# dsh-plugin-butler

中文 | [English](README.md)

**dsh-plugin-butler**（插件管家）是一个运行在 [DeepSeek Harness](https://github.com/deepseek-ai)（DSH）Web 设置页里的图形化插件管理器。它让你在界面上管理 profile 里的所有插件——整理、开关、分组、更新、安装、卸载，全程不用碰终端。

**零构建、零运行时依赖**——只用 Node 内置模块 + 部署本身已提供的服务。

---

## 功能

### 1. 中文目录（`catalog.json`）
每个插件显示**中文名 + 一句话用途说明 + 分类**，内置 130+ 官方模块目录。外部插件或目录里没有的模块会回退到短名。

- **点击说明文字**即可就地编辑（保存 / Ctrl+Enter / Esc）。
- 自定义说明存于 `~/.dsh/plugin-manager/catalog.json`，并带「自定」徽章标识。

### 2. 一键开关（热生效）
每行一个开关，**手术式编辑** profile 的 `cordis.patch.yml`（增删 `disabled: true` 行块），然后交给 DSH 的 HMR 观察者热应用——**无需重启**。

安全保护：
- **系统核心行受保护**——应用、传输层、插件管家自身依赖的服务不允许在界面停用。
- 由 `!!js` 表达式控制的行走完全不改写（需手工编辑配置文件）。
- 手工添加的其它补丁内容原样保留。

### 3. 官方 / 外部分类（可折叠）
插件分成两区，均可折叠：
- **官方**——`@deepseek-ai/*` 与 `cordis:*` 模块，内部再按分类分组。
- **外部**——`dsh plugin add` 安装的插件，尽可能展示作者 / 仓库信息。

### 4. 自定义分组（`groups.json`）
把外部插件归入自定义分组（**新建 / 重命名 / 删组 / 移动**）。归属存于 `~/.dsh/plugin-manager/groups.json`，点分组即可过滤外部列表。

### 5. 更新检测 + 一键更新
- **检查更新**：把每个已装 npm 依赖与 registry 的 `latest` 对比，有更新的行标注 `当前版 → 最新版`。
- **更新**：重跑 `pnpm add <name>@latest`，失败时**自动回滚**到旧版本。
- link/file/git 来源标注为「不可自动检测」。

### 6. 插件市场（搜索 + 安装）
搜索 GitHub 上带 **`dsh-plugin`** 话题的插件，按 stars 排序，带分页（「加载更多」）。

- 弹窗预览**详情 / README**。
- **一键安装**（等价 `dsh plugin add github:owner/repo`），包声明了 `dsh.bundle` 时自动加入组合层。
- 市场条目**Ctrl + 左键**新标签页打开其仓库。

### 7. 卸载
外部插件**两次点击确认**卸载：先从 `dsh.profile.bundles` 移除，再 `pnpm remove`，卸载失败时**回滚组合层**。

### 8. 依赖视图
每行有「**依赖**」徽章，展开显示：
- **注入**——它声明了哪些服务，每个标注提供者（`服务 ← 提供者`）。
- **被依赖**——哪些插件依赖它提供的服务（即停用它会拖垮谁）。

### 9. 依赖关系图
全屏**从左到右的思维导图**布局：最左列是核心插件（被依赖最多），依赖者按依赖深度向右逐列展开。

- **平移**（拖空白）、**缩放**（滚轮或 +/- 按钮）、**适应**（一键全景）。
- **拖动节点**，连线随之移动。
- **悬停节点**高亮其依赖链（蓝色加粗），其它连线淡出，同时显示详情浮层。
- 浅色胶囊节点 + **蓝色圆点（官方）/ 黑色圆点（外部）**。
- 淡点阵画布背景。

### 10. 健康状态
加载失败的插件**红色高亮**并显示报错原因，顶部「⚠ N 个插件加载失败」汇总条 + 「只看失败」过滤。

### 11. 详情弹窗（Markdown）
详情弹窗把插件的 **README 渲染成带排版的 Markdown**——标题、代码块、行内代码、粗体/斜体、链接、图片、列表、引用、分割线。

---

## 安装

```bash
dsh plugin --profile web add dsh-plugin-butler
```

**重启 web profile** 后，打开 **设置 → 插件 → 插件管理**。

> 默认管理 `web` profile；如需管理其它 profile，在 Host 半加载前设置 `DSH_PLUGIN_MANAGER_PROFILE`。

---

## 工作原理

- **Host 半**（`lib/index.js`）：`apply(ctx)` 通过 `webServer` 服务注册同源路由 `/plugin-manager/*`：
  `list · setEnabled · setOverride · removeOverride · createGroup · renameGroup · deleteGroup · assign · checkUpdates · update · market · detail · detailRepo · install · uninstall`。
  直接读写补丁层、组合层（`dsh.profile.bundles`）与状态文件（`catalog.json`、`groups.json`），并从 Cordis 运行时的 `fiber._store` 精确解析依赖边。
- **Client 半**（`lib/client.js`）：手写的 `window.__ModuleLoader__.load` bundle（无打包器），注册 `settings.plugins.tab`「插件管理」，同源 `fetch` 调 Host。
- 不使用 Typert / zod / 打包器——**无需 `npm install`、无构建步骤**。

## 项目结构

```
lib/index.js        宿主端插件（/plugin-manager/* 路由 + 补丁读写 + 目录/分组 + 更新）
lib/client.js       浏览器端 bundle（ModuleLoader 格式，设置页 tab + 依赖图）
lib/patch.js        纯函数工具（补丁编辑、GitHub 解析）——有单测
cordis.patch.yml    bundle 补丁层（插入宿主条目）
test/patch.test.js  node:test 单元测试
```

## 环境要求

- **Node.js ≥ 18**（用到了 `fetch` 与 `AbortSignal.timeout`）。
- 一个带 `webServer` 服务的 `web` profile（DSH 标准 Web 部署自带）。

## 注意与限制

- 开关插件会实时 recompose 其子树，正在运行的会话可能短暂感知变化。
- 停用 web shell 本身会使应用不可用，因此核心行不可停用。
- 更新 / 安装 / 卸载**不是**热生效，需重启 profile 才加载新代码。
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
