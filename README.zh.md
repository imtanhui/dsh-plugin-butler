# dsh-plugin-butler

中文 | [English](README.md)

在 DeepSeek Harness 的 Web 设置页里管理插件。**零构建、零运行时依赖**（只依赖 node 内置 + 部署已提供的服务）。

- **中文目录**：每个插件显示中文名 + 一句话用途说明 + 分类（内置 130+ 模块目录），点击说明可自定义，存于 `~/.dsh/plugin-manager/catalog.json`。
- **开关**：手术式编辑 profile 的 `cordis.patch.yml`，由 DSH 热重载生效；系统核心行有保护，`!!js` 表达式控制的行拒绝改写。
- **分类**：官方（`@deepseek-ai/*` / `cordis:*`）与外部（`dsh plugin add` 安装的），可折叠展开。
- **自定义分组**：外部插件建组 / 重命名 / 删组 / 移动，存于 `~/.dsh/plugin-manager/groups.json`。
- **更新检测 + 一键更新**：对比 npm registry `latest`，点「更新」重跑 `pnpm add <name>@latest`（失败自动回滚旧版）。
- **插件市场**：搜索 GitHub 上带 `dsh-plugin` 话题的插件（按 stars 排序），查看详情 / README，一键安装（等价于 `dsh plugin add github:owner/repo`，自动加入组合层）。
- **卸载**：外部插件一键卸载（先从组合层移除再 `pnpm remove`，失败自动回滚组合层）。
- **健康状态**：加载失败的插件红色高亮 + 显示报错原因 + 「只看失败」过滤。
- **GitHub 直达**：外部插件按住 **Ctrl + 左键**打开其 GitHub 仓库。

## 安装

```bash
dsh plugin --profile web add dsh-plugin-butler
```

重启 web profile 后，打开 **设置 → 插件 → 插件管理**。

> 默认管理 `web` profile；如需管理其它 profile，在 Host 半加载前设置 `DSH_PLUGIN_MANAGER_PROFILE`。

## 工作原理

- **Host 半**（`lib/index.js`）：`apply(ctx)` 注册 `webServer` 环回路由 `/plugin-manager/*`（list / setEnabled / setOverride / removeOverride / createGroup / renameGroup / deleteGroup / assign / checkUpdates / update / market / detail / detailRepo / install / uninstall），直接读写补丁层、组合层（`dsh.profile.bundles`）与状态文件。
- **Client 半**（`lib/client.js`）：手写的 `window.__ModuleLoader__.load` bundle（无打包器），注册 `settings.plugins.tab`「插件管理」，同源 `fetch` 调 Host。
- 不使用 Typert / zod / 打包器，因此无需 `npm install` 和构建步骤。

## 项目结构

```
lib/index.js       宿主端插件（/plugin-manager/* 路由 + 补丁读写 + 目录/分组 + 更新）
lib/client.js      浏览器端 bundle（ModuleLoader 格式，设置页 tab）
lib/patch.js       纯函数工具（补丁编辑、GitHub 解析）——有单测
cordis.patch.yml   bundle 补丁层（插入宿主条目）
```

## 注意与限制

- 开关插件会实时 recompose 其子树，正在运行的会话可能短暂感知到变化。
- 停用系统核心行（web shell 等）会使应用不可用，因此核心行不可停用。
- 更新 / 安装 / 卸载不是热生效，需重启 profile 才加载新代码。
- 市场搜索与详情走 GitHub API，需能访问 `api.github.com`（网络受限时会显示错误）。
- 管理器只编辑 profile 的用户补丁层与组合层，会保留手工添加的其它补丁。
- HTTP 路由做了同源校验（无鉴权）；仅在信任的 loopback 环境使用，勿绑定到公网。

## 开发

```bash
npm run check   # 对所有 bundle 做 node --check
npm test        # node:test 跑 lib/patch.js 单测
```

## License

MIT
