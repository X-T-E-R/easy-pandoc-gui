use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

use pathdiff::diff_paths;
use regex::{Captures, Regex};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadDocumentInput {
  path: String,
  resource_roots: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportDocumentInput {
  input_path: String,
  source: String,
  output_path: String,
  bibliography_path: Option<String>,
  reference_doc_path: Option<String>,
  resource_paths: Option<Vec<String>>,
  pandoc_path: Option<String>,
  reference_section_title: Option<String>,
  mode: ExportMode,
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExportMode {
  Html,
  Docx,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DoctorInput {
  pandoc_path: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalizeWarning {
  raw_path: String,
  reason: &'static str,
  attempted: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetSummary {
  inspected: usize,
  resolved: usize,
  unresolved: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadDocumentResult {
  path: String,
  source: String,
  canonical_markdown: String,
  warnings: Vec<CanonicalizeWarning>,
  asset_summary: AssetSummary,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportDocumentResult {
  output_path: String,
  canonical_markdown: String,
  warnings: Vec<CanonicalizeWarning>,
  asset_summary: AssetSummary,
  diagnostics: Vec<HarnessDiagnostic>,
  stderr: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HarnessDiagnostic {
  code: &'static str,
  severity: &'static str,
  message: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DoctorCheck {
  id: &'static str,
  status: &'static str,
  detail: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DoctorResult {
  status: &'static str,
  checks: Vec<DoctorCheck>,
}

struct CanonicalizeResult {
  markdown: String,
  warnings: Vec<CanonicalizeWarning>,
  asset_summary: AssetSummary,
}

#[tauri::command]
pub fn load_document(input: LoadDocumentInput) -> Result<LoadDocumentResult, String> {
  let input_path = PathBuf::from(&input.path);
  let source = fs::read_to_string(&input_path)
    .map_err(|error| format!("读取文件失败 {}: {}", input.path, error))?;
  let resource_roots = resolve_resource_roots(&input_path, input.resource_roots.unwrap_or_default());

  let canonical = canonicalize_markdown(&source, &input_path, resource_roots);

  Ok(LoadDocumentResult {
    path: input.path,
    source,
    canonical_markdown: canonical.markdown,
    warnings: canonical.warnings,
    asset_summary: canonical.asset_summary,
  })
}

#[tauri::command]
pub fn export_document(input: ExportDocumentInput) -> Result<ExportDocumentResult, String> {
  let input_path = PathBuf::from(&input.input_path);
  let output_path = PathBuf::from(&input.output_path);
  let extra_roots = resolve_resource_roots(&input_path, input.resource_paths.unwrap_or_default());
  let canonical = canonicalize_markdown(&input.source, &input_path, extra_roots.clone());
  let temp_input = create_temp_markdown_path(&input_path)?;

  fs::write(&temp_input, &canonical.markdown)
    .map_err(|error| format!("写入临时 canonical 文件失败: {}", error))?;

  let args = build_pandoc_args(
    &temp_input,
    &output_path,
    input.mode,
    input.bibliography_path.as_deref(),
    input.reference_doc_path.as_deref(),
    &build_resource_paths(&input_path, &extra_roots),
    input.reference_section_title.as_deref(),
  );

  let command = input
    .pandoc_path
    .filter(|value| !value.trim().is_empty())
    .unwrap_or_else(|| "pandoc".to_string());

  let output = Command::new(&command)
    .args(&args)
    .output()
    .map_err(|error| format!("执行 pandoc 失败: {}", error))?;

  let stdout = String::from_utf8_lossy(&output.stdout).to_string();
  let stderr = String::from_utf8_lossy(&output.stderr).to_string();
  let _ = fs::remove_file(&temp_input);

  if !output.status.success() {
    let message = if stderr.trim().is_empty() {
      format!("Pandoc 导出失败，退出码: {}", output.status)
    } else {
      stderr.trim().to_string()
    };
    return Err(message);
  }

  Ok(ExportDocumentResult {
    output_path: output_path.to_string_lossy().to_string(),
    canonical_markdown: canonical.markdown,
    warnings: canonical.warnings,
    asset_summary: canonical.asset_summary,
    diagnostics: parse_pandoc_diagnostics(&stderr),
    stderr: if stderr.trim().is_empty() { stdout } else { stderr },
  })
}

#[tauri::command]
pub fn run_doctor(input: DoctorInput) -> Result<DoctorResult, String> {
  let pandoc_command = input
    .pandoc_path
    .filter(|value| !value.trim().is_empty())
    .unwrap_or_else(|| "pandoc".to_string());

  let checks = vec![
    check_executable("pandoc", &pandoc_command),
    check_executable("rsvg-convert", "rsvg-convert"),
  ];

  let status = if checks.iter().all(|item| item.status == "ok") {
    "success"
  } else {
    "warning"
  };

  Ok(DoctorResult { status, checks })
}

fn check_executable(id: &'static str, command: &str) -> DoctorCheck {
  match Command::new(command).arg("--version").output() {
    Ok(output) => {
      let stdout = String::from_utf8_lossy(&output.stdout).to_string();
      let stderr = String::from_utf8_lossy(&output.stderr).to_string();
      let detail = first_non_empty_line(&stdout)
        .or_else(|| first_non_empty_line(&stderr))
        .unwrap_or_else(|| "available".to_string());

      DoctorCheck {
        id,
        status: "ok",
        detail,
      }
    }
    Err(error) => {
      let detail = error.to_string();
      let status = if detail.contains("os error 2") || detail.contains("not found") {
        "missing"
      } else {
        "error"
      };

      DoctorCheck { id, status, detail }
    }
  }
}

fn first_non_empty_line(input: &str) -> Option<String> {
  input
    .lines()
    .map(|line| line.trim())
    .find(|line| !line.is_empty())
    .map(|line| line.to_string())
}

fn create_temp_markdown_path(input_path: &Path) -> Result<PathBuf, String> {
  let millis = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map_err(|error| error.to_string())?
    .as_millis();
  let stem = input_path
    .file_stem()
    .and_then(|value| value.to_str())
    .unwrap_or("document");

  Ok(std::env::temp_dir().join(format!(
    "testpandoc-export-{}-{}.canonical.md",
    millis, stem
  )))
}

fn build_pandoc_args(
  input_path: &Path,
  output_path: &Path,
  mode: ExportMode,
  bibliography_path: Option<&str>,
  reference_doc_path: Option<&str>,
  resource_paths: &[String],
  reference_section_title: Option<&str>,
) -> Vec<String> {
  let mut args = vec![
    input_path.to_string_lossy().to_string(),
    "-o".to_string(),
    output_path.to_string_lossy().to_string(),
  ];

  match mode {
    ExportMode::Docx => args.push("--standalone".to_string()),
    ExportMode::Html => {
      args.push("-t".to_string());
      args.push("html5".to_string());
      args.push("--standalone".to_string());
    }
  }

  if let Some(path) = bibliography_path {
    args.push("--citeproc".to_string());
    args.push("--bibliography".to_string());
    args.push(path.to_string());
  }

  if let Some(path) = reference_doc_path {
    args.push("--reference-doc".to_string());
    args.push(path.to_string());
  }

  if let Some(title) = reference_section_title {
    args.push("--metadata".to_string());
    args.push(format!("reference-section-title={}", title));
  }

  if !resource_paths.is_empty() {
    let delimiter = if cfg!(windows) { ';' } else { ':' };
    args.push("--resource-path".to_string());
    args.push(resource_paths.join(&delimiter.to_string()));
  }

  args
}

fn build_resource_paths(input_path: &Path, extra_roots: &[PathBuf]) -> Vec<String> {
  let mut roots = Vec::new();
  if let Some(document_dir) = input_path.parent() {
    roots.push(document_dir.to_path_buf());
  }
  roots.extend(extra_roots.iter().cloned());

  let mut seen = HashSet::new();
  roots
    .into_iter()
    .filter_map(|path| {
      let key = normalize_path(&path);
      if seen.insert(key.clone()) {
        Some(key)
      } else {
        None
      }
    })
    .collect()
}

fn resolve_resource_roots(input_path: &Path, roots: Vec<String>) -> Vec<PathBuf> {
  let document_dir = input_path
    .parent()
    .map(Path::to_path_buf)
    .unwrap_or_else(|| PathBuf::from("."));

  roots
    .into_iter()
    .map(PathBuf::from)
    .map(|path| if path.is_absolute() { path } else { document_dir.join(path) })
    .collect()
}

fn canonicalize_markdown(source: &str, document_path: &Path, extra_roots: Vec<PathBuf>) -> CanonicalizeResult {
  let transformed = transform_legacy_markdown(source);
  let document_dir = document_path
    .parent()
    .map(Path::to_path_buf)
    .unwrap_or_else(|| PathBuf::from("."));
  let search_roots = unique_paths(
    std::iter::once(document_dir.clone())
      .chain(extra_roots.into_iter())
      .collect(),
  );

  let image_pattern = Regex::new(r"!\[([^\]]*)\]\(([^)\r\n]+)\)").expect("valid image regex");
  let remote_pattern = Regex::new(r"^(https?://|data:|file://)").expect("valid remote regex");

  let mut warnings = Vec::new();
  let mut summary = AssetSummary {
    inspected: 0,
    resolved: 0,
    unresolved: 0,
  };

  let markdown = image_pattern
    .replace_all(&transformed, |captures: &Captures| {
      let alt = captures.get(1).map(|value| value.as_str()).unwrap_or_default();
      let raw_path = captures
        .get(2)
        .map(|value| value.as_str().trim().to_string())
        .unwrap_or_default();

      if remote_pattern.is_match(&raw_path) {
        return captures.get(0).unwrap().as_str().to_string();
      }

      summary.inspected += 1;
      let resolution = resolve_asset_path(&raw_path, &document_dir, &search_roots);

      match resolution.resolved_path {
        Some(path) => {
          summary.resolved += 1;
          format!(
            "![{}]({})",
            alt,
            format_relative_asset_path(&document_dir, &path)
          )
        }
        None => {
          summary.unresolved += 1;
          warnings.push(CanonicalizeWarning {
            raw_path,
            reason: "unresolved",
            attempted: resolution.attempted,
          });
          captures.get(0).unwrap().as_str().to_string()
        }
      }
    })
    .to_string();

  CanonicalizeResult {
    markdown,
    warnings,
    asset_summary: summary,
  }
}

fn transform_legacy_markdown(input: &str) -> String {
  let figure_pattern =
    Regex::new(r"(?s)!\[(.*?)\]\((.*?)\)\s*<center>(.*?)</center>").expect("valid figure regex");
  let math_pattern =
    Regex::new(r"(?s)\$\$(.*?)\\tag\{(.*?)\}\s*\$\$").expect("valid math regex");

  let with_figures = figure_pattern
    .replace_all(input, |captures: &Captures| {
      let path = captures.get(2).map(|value| value.as_str().trim()).unwrap_or_default();
      let caption = captures.get(3).map(|value| value.as_str().trim()).unwrap_or_default();
      format!("![{}]({})", caption, path)
    })
    .to_string();

  math_pattern
    .replace_all(&with_figures, |captures: &Captures| {
      let body = captures
        .get(1)
        .map(|value| value.as_str().trim_end_matches('\\').trim())
        .unwrap_or_default();
      let tag = captures.get(2).map(|value| value.as_str().trim()).unwrap_or_default();
      format!("$${}$$ {{#eq:{}}}", body, tag)
    })
    .to_string()
}

struct AssetResolution {
  resolved_path: Option<PathBuf>,
  attempted: Vec<String>,
}

fn resolve_asset_path(raw_path: &str, document_dir: &Path, search_roots: &[PathBuf]) -> AssetResolution {
  let mut attempted = Vec::new();
  let mut seen = HashSet::new();
  let raw_path_buf = PathBuf::from(raw_path);
  let basename = raw_path_buf
    .file_name()
    .map(PathBuf::from)
    .unwrap_or_else(|| PathBuf::from(raw_path));

  let mut candidates = Vec::new();

  if raw_path_buf.is_absolute() {
    candidates.push(raw_path_buf.clone());
  } else {
    candidates.push(document_dir.join(&raw_path_buf));
  }

  if let Some(special_tail) = extract_special_tail(raw_path) {
    for root in search_roots {
      candidates.push(root.join(&special_tail));
    }
  }

  for root in search_roots {
    candidates.push(root.join(&raw_path_buf));
    candidates.push(root.join(&basename));
    candidates.push(root.join("assets").join(&basename));
    candidates.push(root.join("attachments").join(&basename));
  }

  for candidate in candidates {
    let normalized = normalize_path(&candidate);
    if !seen.insert(normalized.clone()) {
      continue;
    }

    attempted.push(normalized);
    if candidate.exists() {
      return AssetResolution {
        resolved_path: Some(candidate),
        attempted,
      };
    }
  }

  AssetResolution {
    resolved_path: None,
    attempted,
  }
}

fn extract_special_tail(raw_path: &str) -> Option<PathBuf> {
  let pattern =
    Regex::new(r"(?i)(?:^|[\\/])(assets|attachments)[\\/](.+)$").expect("valid tail regex");
  let captures = pattern.captures(raw_path)?;
  let prefix = captures.get(1)?.as_str();
  let suffix = captures.get(2)?.as_str().replace('\\', "/");
  Some(PathBuf::from(format!("{}/{}", prefix, suffix)))
}

fn format_relative_asset_path(base_dir: &Path, resolved_path: &Path) -> String {
  match diff_paths(resolved_path, base_dir) {
    Some(relative) if !relative.as_os_str().is_empty() => normalize_path(&relative),
    _ => normalize_path(resolved_path),
  }
}

fn normalize_path(path: &Path) -> String {
  path.to_string_lossy().replace('\\', "/")
}

fn unique_paths(paths: Vec<PathBuf>) -> Vec<PathBuf> {
  let mut seen = HashSet::new();
  paths
    .into_iter()
    .filter(|path| seen.insert(normalize_path(path)))
    .collect()
}

fn parse_pandoc_diagnostics(stderr: &str) -> Vec<HarnessDiagnostic> {
  let marker_pattern = Regex::new(r"^\[(WARNING|ERROR)\]\s*(.*)$").expect("valid marker regex");
  let mut entries: Vec<(String, String)> = Vec::new();

  for line in stderr.lines() {
    if let Some(capture) = marker_pattern.captures(line.trim()) {
      let severity = capture
        .get(1)
        .map(|value| value.as_str().to_string())
        .unwrap_or_else(|| "WARNING".to_string());
      let message = capture
        .get(2)
        .map(|value| value.as_str().trim().to_string())
        .unwrap_or_default();
      entries.push((severity, message));
      continue;
    }

    if let Some((_, message)) = entries.last_mut() {
      if !line.trim().is_empty() {
        if !message.is_empty() {
          message.push(' ');
        }
        message.push_str(line.trim());
      }
    }
  }

  entries
    .into_iter()
    .map(|(severity_label, message)| {
      let severity = if severity_label == "ERROR" {
        "error"
      } else {
        "warning"
      };

      let code = if message.contains("Could not fetch resource")
        || message.contains("replacing image with description")
      {
        "missing-resource"
      } else if message.contains("Could not convert TeX math")
        || message.contains("rendering as TeX")
      {
        "math-render"
      } else if message.contains("rsvg-convert") {
        "svg-converter-missing"
      } else if severity == "error" {
        "generic-error"
      } else {
        "generic-warning"
      };

      HarnessDiagnostic {
        code,
        severity,
        message,
      }
    })
    .collect()
}

#[cfg(test)]
mod tests {
  use super::{canonicalize_markdown, parse_pandoc_diagnostics};
  use std::fs;
  use std::path::PathBuf;

  #[test]
  fn rewrites_center_caption_and_math_tags() {
    let temp_dir = std::env::temp_dir().join("testpandoc-rust-rewrite");
    let _ = fs::create_dir_all(&temp_dir);
    let document = temp_dir.join("input.md");

    let result = canonicalize_markdown(
      "![img](a.png)\n<center>图 1 示例</center>\n$$ a=b \\\\tag{2} $$",
      &document,
      Vec::new(),
    );

    assert!(result.markdown.contains("![图 1 示例](a.png)"));
    assert!(result.markdown.contains("$$a=b$$ {#eq:2}"));
  }

  #[test]
  fn detects_missing_resource_and_math_render_warnings() {
    let stderr = "[WARNING] Could not fetch resource foo.png: replacing image with description\n[WARNING] Could not convert TeX math rendering as TeX";
    let diagnostics = parse_pandoc_diagnostics(stderr);

    assert_eq!(diagnostics.len(), 2);
    assert_eq!(diagnostics[0].code, "missing-resource");
    assert_eq!(diagnostics[1].code, "math-render");
  }

  #[test]
  fn canonicalization_resolves_assets_from_extra_roots() {
    let temp_dir = std::env::temp_dir().join("testpandoc-rust-assets");
    let assets_dir = temp_dir.join("attachments");
    let _ = fs::create_dir_all(&assets_dir);
    let _ = fs::write(assets_dir.join("figure.png"), "stub");
    let document = temp_dir.join("input.md");
    let _ = fs::write(&document, "![x](figure.png)");

    let result = canonicalize_markdown(
      "![x](figure.png)",
      &document,
      vec![PathBuf::from(&temp_dir)],
    );

    assert!(result.markdown.contains("attachments/figure.png"));
    assert_eq!(result.asset_summary.resolved, 1);
  }
}
