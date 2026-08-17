# dsh-plugin-butler

[中文](./README.md) | [English](./README.en.md)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/imtanhui/dsh-plugin-butler?style=social)](https://github.com/imtanhui/dsh-plugin-butler)

插件管家——在 Web UI 中图形化管理 DeepSeek Harness (DSH) 插件：中文目录、一键启停（热生效）、官方/外部分类、自定义分组、更新检测 + 一键更新（失败自动回滚）、插件市场（搜索 / 安装 / 卸载）、插件详情（Markdown README）、健康状态、全屏依赖关系图。**零构建、零运行时依赖**——只用 Node 内置模块加上部署自带的服务。

> 建议先装管家、再装其他插件：装上之后，每个插件的启停、更新、安装、卸载都走统一界面，启停实时生效、更新失败自动回滚，能显著减少"装上就炸、重启起不来"的情况。
>
> 若某插件导致 profile 无法启动：先手动清理对应 `cordis.patch.yml` 里的 `disabled` 块或卸载依赖，再重启即可。

## 安装

```sh
# 方式一（推荐）：从 GitHub 安装
dsh plugin --profile <name> add github:imtanhui/dsh-plugin-butler

# 方式二：本地源码（开发调试）
cd /path/to/dsh-plugin-butler
dsh plugin --profile <name> add .
```

重启 profile 后，Web UI 的「设置 → 插件」会出现「插件管理」标签页。

## 更新

打开「设置 → 插件 → 插件管理」，点「检查更新」会对比每个已装 npm 依赖的 registry `latest`，有新版的行会显示 `当前 → 最新`，点对应行的「更新」即可一键升级——失败会自动回滚到上一版本。link / file / git 源的行标记为不可自动更新。

## 功能

![插件管理列表](docs/plugin-list.png)

| 能力 | 说明 |
|---|---|
| 查看 | 官方 / 外部两类分组（可折叠）；内置 130+ 官方模块的**中文目录**（中文名 + 一句说明 + 分类），点说明可在线编辑（保存 / Ctrl+Enter / Esc），自定义覆盖存到 `~/.dsh/plugin-manager/catalog.json` 并显示「自定义」徽标 |
| 实时启停 | 每行一个开关，**精确编辑** profile 的 `cordis.patch.yml`（增删 `disabled: true` 块）后由 DSH 的 HMR 观察器热应用，**无需重启**；核心行（应用 / 传输层 / 管家自身依赖的服务）受保护不可禁用；`!!js` 表达式控制的行不动；手工加的其他 patch 条目原样保留 |
| 自定义分组 | 外部插件按分组组织（**新建 / 重命名 / 删除 / 移动**），持久化到 `~/.dsh/plugin-manager/groups.json`，一键过滤 |
| 更新检测 + 一键更新 | 「检查更新」对比 registry `latest` 并标出 `当前 → 最新`；「更新」重跑 `pnpm add <name>@latest`，失败**自动回滚**旧版本 |
| 卸载 | 从 `dsh.profile.bundles` 移除 + `pnpm remove`，失败自动回滚 |
| 详情 | 插件详情弹窗，内置 **Markdown README 渲染**（手写渲染器，零依赖） |
| 健康状态 | 失败行红色高亮 + 「只看失败」筛选；每行展开可见注入的服务 / 提供方依赖 |

![插件市场](docs/market.png)

| 能力 | 说明 |
|---|---|
| 插件市场 | 检索 GitHub `topic:dsh-plugin` 仓库（按 star 排序、分页），每项显示作者 / star / 简介，支持「详情」+「一键安装」 |

![依赖关系图](docs/dependency-graph.png)

| 能力 | 说明 |
|---|---|
| 依赖关系图 | 全屏依赖图：**从左到右思维导图布局**，节点显示项目名、悬停显示详情；官方=蓝点、外部=黑点；可拖拽节点、悬停高亮上下游、点阵画布、低透明度细边 |

## 架构

- Host：`lib/index.js` —— `PluginManagerGateway` 网关 + `/plugin-manager/*` REST 路由（GET 带同源校验，防 CSRF / DNS-rebinding）；更新 / 安装 / 卸载链路整体串行互斥
- Patch 编辑：`lib/patch.js` —— 纯函数辅助（`setRowDisabled` / `parsePatchBlocks` / `githubUrl` / `moduleShortName` …），增删 `disabled` 块、行级操作、原子写入
- 依赖解析：Host `list()` 从 Cordis `fiber._store`（`{service: impl}`，`impl.fiber.entry.options.name` 为提供方模块）解析注入边，返回 `edges` 数组
- Client：`lib/client.js` —— 手写 `window.__ModuleLoader__.load` + `React.createElement`（无 JSX），注册 `settings.plugins.tab`（id `manager`）；手写 Markdown 渲染器与依赖图（Sugiyama 式思维导图布局、SVG 边）
- 通信：官方 webServer 路由 + 同源 fetch（零构建、零运行时依赖，不走 Typert Remote）
- 状态文件：中文目录 / 分组 / 说明覆盖存 `~/.dsh/plugin-manager/{catalog.json,groups.json}`

## 已知限制

- 禁用被依赖的条目可能导致 profile 启动失败（官方 fail-loud 设计）；恢复：手动删除该 profile `cordis.patch.yml` 里的 `disabled` 块
- 核心行受保护，不能从 UI 禁用（需手工改配置文件）
- `!!js` 表达式控制的行 UI 不碰，须手工编辑
- link / file / git 源的依赖不可自动更新（标记为不可更新）
- 市场依赖 GitHub Search API（未认证 60 次/小时限流），仅影响频繁搜索
- 依赖图基于运行时 `fiber._store` 尽力解析，语义级冲突不在检测范围

## 开发

```sh
pnpm run check   # node --check 三个源文件
pnpm test        # node --test（16 个纯函数单测）
```

> 本插件无构建步骤：`lib/index.js` / `lib/client.js` / `lib/patch.js` 直接发布，改动即生效（改 client 后需刷新页面 / 重启 profile）。

## 相关

- 源码与 Issue：[github.com/imtanhui/dsh-plugin-butler](https://github.com/imtanhui/dsh-plugin-butler)
- 同类项目：[dsh-web-plugin-manager](https://github.com/LX2000WASD/dsh-web-plugin-manager)
- 许可证：MIT
