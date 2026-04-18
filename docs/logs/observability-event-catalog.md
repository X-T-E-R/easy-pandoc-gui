# Observability Event Catalog

## Purpose

统一记录项目中所有结构化事件的名称、触发阶段、核心字段和预期用途，避免日志随实现增长而失控。

## Event Envelope

每条事件至少包含以下字段：

- `eventName`
- `sessionId`
- `documentId`
- `phase`
- `durationMs`
- `status`
- `metadata`

## Initial Events

| Event | Phase | Status | Notes |
| --- | --- | --- | --- |
| `lint.started` | lint | `success` | 标记 lint 开始 |
| `lint.completed` | lint | `success` / `warning` / `error` | 记录规则命中数量 |
| `compat.transform.started` | compat | `success` | 标记兼容转换开始 |
| `compat.transform.completed` | compat | `success` / `warning` / `error` | 记录改写和告警 |
| `pandoc.preview.started` | preview | `success` | 标记 HTML 预览开始 |
| `pandoc.preview.completed` | preview | `success` / `warning` / `error` | 记录输出和耗时 |
| `pandoc.export.started` | export | `success` | 标记导出开始 |
| `pandoc.export.completed` | export | `success` / `warning` / `error` | 记录命令和结果 |
| `harness.run.started` | harness | `success` | 标记回归开始 |
| `harness.run.completed` | harness | `success` / `warning` / `error` | 记录通过率和失败点 |

