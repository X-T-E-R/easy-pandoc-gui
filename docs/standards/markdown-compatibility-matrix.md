# Markdown Compatibility Matrix

本文档定义项目内部认定的 Markdown 写法边界，分为四类：

- `标准`：直接采用 Pandoc 官方支持语法
- `标准扩展`：Pandoc 明确支持的扩展语法
- `兼容魔改`：仅为兼容旧稿件保留，不鼓励新文档继续使用
- `禁止`：破坏可移植性、可维护性或可验证性的写法

## 标准

| ID                       | 写法           | 示例                    | 行为                        |
| ------------------------ | -------------- | ----------------------- | --------------------------- |
| `pandoc-citation`        | Pandoc 引用    | `[@key]`                | 直接进入 canonical Markdown |
| `markdown-image-caption` | 图片题注       | `![图 1 示例](img.png)` | 直接进入 canonical Markdown |
| `yaml-front-matter`      | YAML 头        | `---`                   | 保留                        |
| `math-block`             | 标准块公式     | `$$ a = b $$`           | 保留                        |
| `heading-standard`       | 不手工编号标题 | `## 方法`               | 由规则层或模板决定是否编号  |

## 标准扩展

| ID                         | 写法               | 示例                      | 行为                 |
| -------------------------- | ------------------ | ------------------------- | -------------------- |
| `image-attributes`         | Pandoc 图片属性    | `![图](a.png){width=50%}` | 保留                 |
| `reference-title-metadata` | 参考文献标题元数据 | `reference-section-title` | 进入 Pandoc metadata |
| `lua-filter`               | Pandoc Lua filters | `--lua-filter`            | 作为正式扩展点       |

## 兼容魔改

| ID                        | 写法                     | 示例                                      | 当前策略                     |
| ------------------------- | ------------------------ | ----------------------------------------- | ---------------------------- |
| `image-center-caption`    | 图片后接 `<center>` 题注 | `![img](a.png)` + `<center>图 1</center>` | 自动改写并告警               |
| `center-caption-block`    | 独立 `<center>` 题注块   | `<center>表 2.1 ...</center>`             | 保留并告警，等待后续规则细化 |
| `math-tag`                | 公式内 `\\tag{}`         | `$$ ... \\tag{2} $$`                      | 自动改写并告警               |
| `manual-heading-number`   | 手工写标题号             | `## 1.1 方法`                             | 解析后清洗并告警             |
| `legacy-numeric-citation` | 手工数字引用             | `[1]`                                     | 仅在 legacy 模式兼容         |
| `html-figure-wrapper`     | HTML `figure` 包裹图片   | `<figure>...</figure>`                    | 自动降级处理                 |

## 禁止

| ID                         | 写法                   | 示例                    | 原因       |
| -------------------------- | ---------------------- | ----------------------- | ---------- |
| `absolute-personal-path`   | 个人绝对路径           | `C:\\Users\\xxoy1\\...` | 不可移植   |
| `implicit-external-state`  | 未声明外部目录依赖     | 依赖固定 Obsidian 目录  | 不可验证   |
| `undocumented-custom-html` | 未登记自定义 HTML 容器 | `<foo-block>`           | 无兼容保证 |
| `binary-output-commit`     | 提交生成产物           | 直接提交导出的 `.docx`  | 污染仓库   |

## 执行规则

1. 新文档默认只能写 `标准` 和 `标准扩展`。
2. `兼容魔改` 必须在 lint 中显式标出，并在转换报告里留下命中记录。
3. `禁止` 写法在默认模式下直接报错，不进入导出流程。
4. 每增加一条兼容规则，都要同步更新：
   - 本文档
   - format registry
   - fixture
   - regression test
