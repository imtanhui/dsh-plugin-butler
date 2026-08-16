/**
 * dsh-plugin-butler — 插件管家 Host 半。
 *
 * 注册 pluginManager 远程服务（Typert 自定义 Remote）：
 * - list()：Loader 行快照 + 中文目录（名称/说明/分类），支持用户覆盖文件。
 * - setEnabled()：手术式改写 profile 补丁层（cordis.patch.yml），由 HMR 观察者热生效。
 * - setOverride()/removeOverride()：编辑目录覆盖文件。
 *
 * 运行时行 id 形如 include:<配置行 id>（include 子树的命名空间前缀），
 * 补丁文件按配置行 id（最后一段）定位。
 * @module dsh-plugin-butler
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { githubFullName, githubUrl, initialPatchFile, moduleShortName, setRowDisabled } from './patch.js'

export const name = 'dsh-plugin-butler'

const PROFILE = process.env.DSH_PLUGIN_MANAGER_PROFILE || 'web'

function dshHome() {
  const env = process.env.DSH_HOME
  if (env && env.trim()) return resolve(env.trim())
  return join(homedir(), '.dsh')
}
function patchPath() {
  return join(dshHome(), 'profiles', PROFILE, 'cordis.patch.yml')
}
function overridesPath() {
  return join(dshHome(), 'plugin-manager', 'catalog.json')
}
function groupsPath() {
  return join(dshHome(), 'plugin-manager', 'groups.json')
}

/** 目录分类中文标签。 */
export const CATEGORY_LABELS = {
  core: '核心服务',
  llm: '模型与网络',
  session: '会话',
  agent: '智能体',
  tool: '工具',
  skill: '技能',
  ui: '界面',
  web: 'Web 服务',
  sandbox: '沙箱与安全',
  storage: '存储',
  external: '第三方插件',
  other: '其它',
}

/** 内置目录：模块名 → [中文名, 一句话说明, 分类]。 */
export const CATALOG = {
  '@deepseek-ai/cordis-plugin-timer': ['定时器服务', '提供延时与定时基础能力，热加载与调度依赖它', 'core'],
  '@deepseek-ai/cordis-plugin-hmr': ['热加载驱动', '监听配置与插件变更并热重载', 'core'],
  '@deepseek-ai/dsh-typert-registry': ['类型反射注册表', '运行时包反射与模式注册中心（RPC 依赖）', 'core'],
  '@deepseek-ai/dsh-typert-loader': ['类型反射加载器', '把生成的 Typert 贡献加载进注册表', 'core'],
  '@deepseek-ai/dsh-api-gateway': ['API 网关', '远程调用（RPC）的主机分发与客户端接口', 'core'],
  '@deepseek-ai/dsh-api-remotes': ['远程接口装配', '把主机远程服务装配给浏览器（remote.*）', 'core'],
  '@deepseek-ai/dsh-tools': ['工具注册中心', '工具注册表与执行管线（所有工具宿主）', 'core'],
  '@deepseek-ai/dsh-system-prompt': ['系统提示词组装', '系统提示词分节组装注册表', 'core'],
  '@deepseek-ai/dsh-agent-loop': ['Agent 主循环', '思考-调用工具-产出的主循环实现', 'core'],
  '@deepseek-ai/dsh-code-runtime-worker-thread': ['代码执行运行时', '在 worker 线程中执行代码的运行时', 'core'],
  '@deepseek-ai/dsh-fs-observation-policy': ['文件观察策略', '文件上下文策略：读取前观察、编辑前先读', 'core'],
  '@deepseek-ai/dsh-jobs-local': ['后台任务注册表', '进程内后台任务（job）注册与管理', 'core'],
  '@deepseek-ai/dsh-subprocess-local': ['子进程执行', '本地子进程执行实现', 'core'],
  '@deepseek-ai/dsh-shell-env': ['Shell 环境注册', '管理注入 shell 的 DSH_* 环境变量', 'core'],
  '@deepseek-ai/dsh-workspace': ['工作区注册', '工作区实体注册与会话挂接', 'core'],
  '@deepseek-ai/dsh-host-plugin-inventory': ['插件清单服务（只读）', '把 Loader 插件状态投影给客户端（只读）', 'core'],
  '@deepseek-ai/dsh-cordis-host-runner': ['动态插件宿主', 'AI 动态定义插件的注册、沙箱与调用处理器', 'core'],
  '@deepseek-ai/dsh-cordis-client-runner': ['动态插件客户端', 'AI 动态定义插件的浏览器半执行环境', 'core'],
  '@deepseek-ai/dsh-client-connection': ['客户端连接', '浏览器与主机的 HTTP/WebSocket 连接层', 'core'],
  '@deepseek-ai/dsh-client-modules': ['客户端模块系统', '浏览器插件模块表与 __DSH_BOOT__ 组装', 'core'],
  '@deepseek-ai/dsh-client-runtime': ['客户端运行时', '浏览器核心服务：会话运行时与槽位注册', 'core'],
  '@deepseek-ai/dsh-llm': ['大模型服务接口', '统一的模型调用接口层，适配器挂其下', 'llm'],
  '@deepseek-ai/dsh-llm-deepseek': ['DeepSeek 模型适配器', 'DeepSeek 官方 chat-completions 适配', 'llm'],
  '@deepseek-ai/dsh-llm-pi-ai': ['pi-ai 模型适配器', '基于 pi-ai 的多提供商模型适配', 'llm'],
  '@deepseek-ai/dsh-llm-retry': ['模型请求重试', '按提供商路由的 LLM 请求重试策略', 'llm'],
  '@deepseek-ai/dsh-token-meter': ['Token 计量', '回放感知的 token 消耗测量服务', 'llm'],
  '@deepseek-ai/dsh-web': ['网络能力接口', '搜索/抓取能力的抽象接口与提供者注册', 'llm'],
  '@deepseek-ai/dsh-web-search-deepseek': ['DeepSeek 搜索', 'DeepSeek 官方搜索提供者（web_search）', 'llm'],
  '@deepseek-ai/dsh-agent-default-model': ['默认模型选择', 'Agent 入口共享的默认模型选择服务', 'llm'],
  '@deepseek-ai/dsh-session': ['会话存储核心', '事件溯源式会话数据核心，记录对话轨迹', 'session'],
  '@deepseek-ai/dsh-session-persistence-jsonl': ['会话持久化（JSONL）', '把会话记录以 JSONL 文件持久化', 'session'],
  '@deepseek-ai/dsh-session-projection': ['会话投影', '会话数据的可合并扩展投影类型表', 'session'],
  '@deepseek-ai/dsh-session-projection-cache': ['投影缓存', '会话投影的持久化检查点缓存', 'session'],
  '@deepseek-ai/dsh-session-query-sqlite': ['会话全文搜索', 'SQLite FTS5 全文检索会话内容', 'session'],
  '@deepseek-ai/dsh-session-stats': ['会话统计', '轮次/耗时统计投影', 'session'],
  '@deepseek-ai/dsh-session-telemetry-otel': ['遥测上报', 'OpenTelemetry 上报（可关闭）', 'session'],
  '@deepseek-ai/dsh-session-title': ['会话标题服务', '基于会话记录生成标题', 'session'],
  '@deepseek-ai/dsh-session-title-first-prompt-llm': ['会话标题生成（LLM）', '用首条消息让大模型起标题', 'session'],
  '@deepseek-ai/dsh-session-checkpoint-policy': ['会话检查点', '副作用前的持久化检查点', 'session'],
  '@deepseek-ai/dsh-session-log-export': ['会话导出', '会话日志导出与下载对话框', 'session'],
  '@deepseek-ai/dsh-compaction-basic': ['上下文压缩', '按 token 阈值自动压缩会话上下文', 'session'],
  '@deepseek-ai/dsh-compaction-tool-result-pruner': ['结果裁剪', '回放安全地裁剪超长工具结果', 'session'],
  '@deepseek-ai/dsh-message-feedback': ['消息反馈', '每条消息的点赞/点踩与备注', 'session'],
  '@deepseek-ai/dsh-agent': ['智能体核心', 'Agent 接口、注册表与会话事件词汇', 'agent'],
  '@deepseek-ai/dsh-agent-instructions': ['工作区指令加载', '加载 AGENTS.md 等项目指令', 'agent'],
  '@deepseek-ai/dsh-agent-presets': ['Agent 预设引擎', '按预设 cordis.yml 组合每个会话', 'agent'],
  '@deepseek-ai/dsh-goal': ['目标状态服务', '同会话目标的事件溯源状态与生命周期', 'agent'],
  '@deepseek-ai/dsh-goal-round-driver': ['目标轮次驱动', '目标自动续轮驱动器', 'agent'],
  '@deepseek-ai/dsh-plan-mode': ['计划模式', '按会话记录的计划模式（先计划后执行）', 'agent'],
  '@deepseek-ai/dsh-repeat-tool-reminder': ['重复调用提醒', '模型重复调用同一工具时提醒', 'agent'],
  '@deepseek-ai/dsh-subagent': ['子代理接口', '委托子代理的命名提供者注册', 'agent'],
  '@deepseek-ai/dsh-subagent-spawn-in-process': ['子代理（进程内）', '进程内生成全新子代理的后端', 'agent'],
  '@deepseek-ai/dsh-subagent-fork-in-process': ['子代理（分叉）', '继承父会话前缀的分叉子代理后端', 'agent'],
  '@deepseek-ai/dsh-user-questions': ['用户提问通道', '向用户提问的抽象接口（征求确认用）', 'agent'],
  '@deepseek-ai/dsh-workflow-worker-thread': ['工作流引擎', '在 worker 线程中执行编排脚本', 'agent'],
  '@deepseek-ai/dsh-persona': ['人格', 'Agent 人格', 'agent'],
  '@deepseek-ai/dsh-tool-bash': ['Bash 工具', '给模型用的 bash 命令工具', 'tool'],
  '@deepseek-ai/dsh-tool-pwsh': ['PowerShell 工具', '给模型用的 pwsh 命令工具', 'tool'],
  '@deepseek-ai/dsh-tool-fs': ['文件工具', 'read / write / edit 文件操作工具', 'tool'],
  '@deepseek-ai/dsh-tool-fs-search': ['文件搜索工具', 'glob / grep 文件发现工具', 'tool'],
  '@deepseek-ai/dsh-tool-web': ['网络工具', '给模型用的 web_search / web_fetch 工具', 'tool'],
  '@deepseek-ai/dsh-tool-jobs': ['后台任务工具', 'job_output / job_list / job_kill 工具', 'tool'],
  '@deepseek-ai/dsh-tool-goal': ['目标工具', '给模型用的同会话目标工具', 'tool'],
  '@deepseek-ai/dsh-tool-todo': ['待办工具', '给模型用的 todo_write 待办列表工具', 'tool'],
  '@deepseek-ai/dsh-tool-ralph': ['Ralph 循环工具', '给模型用的 Ralph 全新代理迭代循环', 'tool'],
  '@deepseek-ai/dsh-tool-skill': ['技能工具', '给模型用的 skill 加载工具', 'tool'],
  '@deepseek-ai/dsh-tool-str-replace-editor': ['字符串编辑工具', 'view/create/替换/插入行的文本编辑工具', 'tool'],
  '@deepseek-ai/dsh-tool-subagent': ['子代理委托工具', '给模型用的 subagent 委托工具', 'tool'],
  '@deepseek-ai/dsh-tool-subagent-control': ['子代理控制工具', 'send_message / interrupt_agent / list_agents 工具', 'tool'],
  '@deepseek-ai/dsh-tool-subagent-control/list-agents': ['子代理列表入口', '同一控制工具包的列表入口', 'tool'],
  '@deepseek-ai/dsh-tool-subagent-report': ['子代理报告工具', '子代理作用域内的结果上报工具', 'tool'],
  '@deepseek-ai/dsh-tool-workflow': ['工作流工具', '给模型用的 workflow 编排脚本工具', 'tool'],
  '@deepseek-ai/dsh-tool-call-timeout-policy': ['工具超时策略', '按工具类型设定时限', 'tool'],
  '@deepseek-ai/dsh-tool-cordis': ['动态插件工具', 'AI 定义/运行插件的工具集（cordis_*）', 'tool'],
  '@deepseek-ai/dsh-tool-ask-user': ['提问工具', 'ask_user_question 工具', 'tool'],
  '@deepseek-ai/dsh-skill': ['技能注册中心', 'Agent 技能提供者注册表', 'skill'],
  '@deepseek-ai/dsh-skill-filesystem': ['技能文件系统', '从本地目录加载技能文件', 'skill'],
  '@deepseek-ai/dsh-skill-badge': ['DSH 徽章技能', '内置的 dsh 徽章技能提供者', 'skill'],
  '@deepseek-ai/dsh-commands': ['命令注册表', '人类命令注册（斜杠命令）', 'ui'],
  '@deepseek-ai/dsh-command-feedback': ['反馈命令', '会话反馈记录 + /feedback 命令', 'ui'],
  '@deepseek-ai/dsh-command-goal': ['目标命令', '人类用的目标斜杠命令', 'ui'],
  '@deepseek-ai/dsh-command-compact': ['压缩命令', '手动触发会话压缩的斜杠命令', 'ui'],
  '@deepseek-ai/dsh-host-directory-picker-auto': ['目录选择器', '按宿主环境自动选择原生/浏览式目录选择', 'ui'],
  '@deepseek-ai/dsh-host-directory-picker-native': ['原生目录选择', '系统原生目录选择器', 'ui'],
  '@deepseek-ai/dsh-client-ui-theme': ['主题', '明暗主题状态与切换', 'ui'],
  '@deepseek-ai/dsh-client-locale': ['语言', '中/英语言偏好与文案字典', 'ui'],
  '@deepseek-ai/dsh-client-ui-layout': ['界面框架', '三栏应用框架与拖拽调节', 'ui'],
  '@deepseek-ai/dsh-client-ui-sidebar': ['侧边栏', '会话多级树、搜索与状态点', 'ui'],
  '@deepseek-ai/dsh-client-ui-settings': ['设置框架', '设置页的命名空间作用域与槽位契约', 'ui'],
  '@deepseek-ai/dsh-client-ui-settings-general': ['常规设置', '常规设置分区与新手引导', 'ui'],
  '@deepseek-ai/dsh-client-ui-settings-models': ['模型设置', '模型配置设置与凭据接入', 'ui'],
  '@deepseek-ai/dsh-client-ui-settings-plugin-inventory': ['插件列表页（只读）', '设置里的只读插件清单标签页', 'ui'],
  '@deepseek-ai/dsh-client-ui-settings-plugins': ['插件设置分区', '设置→插件分区与可配置插件卡片', 'ui'],
  '@deepseek-ai/dsh-client-ui-conversation': ['对话界面', '对话区骨架、消息流、输入框与详情', 'ui'],
  '@deepseek-ai/dsh-client-ui-tool': ['工具调用卡片', '工具调用树的渲染与定制视图', 'ui'],
  '@deepseek-ai/dsh-client-ui-cordis': ['动态插件卡片', 'cordis_define 工具行的运行/停止卡片', 'ui'],
  '@deepseek-ai/dsh-client-ui-workflow-run': ['工作流运行节点', '工作流运行生命周期对话节点', 'ui'],
  '@deepseek-ai/dsh-client-ui-deliverables': ['产出文件栏', '回复尾部产出文件引用与打开', 'ui'],
  '@deepseek-ai/dsh-client-ui-workspace': ['工作区选择器', '侧边栏里的工作区选择组件', 'ui'],
  '@deepseek-ai/dsh-client-ui-input-trigger': ['输入触发器', "'/' 与 '@' 触发管线与候选菜单", 'ui'],
  '@deepseek-ai/dsh-client-ui-commands': ['命令面板', '全局命令目录与弹层选择', 'ui'],
  '@deepseek-ai/dsh-client-ui-skill': ['技能引用', '技能引用与技能工具行', 'ui'],
  '@deepseek-ai/dsh-client-ui-subagent': ['子代理界面', '子代理会话目录与续接路由', 'ui'],
  '@deepseek-ai/dsh-client-ui-jobs': ['后台任务列表', '会话头的后台任务实时列表', 'ui'],
  '@deepseek-ai/dsh-client-ui-goal': ['目标条', '输入框上方的会话目标条', 'ui'],
  '@deepseek-ai/dsh-client-ui-message-feedback': ['消息反馈按钮', '助手消息上的点赞/点踩', 'ui'],
  '@deepseek-ai/dsh-client-ui-model-selection': ['模型选择', '/model 弹层选择与模型切换', 'ui'],
  '@deepseek-ai/dsh-client-ui-permission-presets': ['权限界面', '默认权限与 /permission 弹层', 'ui'],
  '@deepseek-ai/dsh-client-ui-agent-preset': ['Agent 预设界面', 'Agent 预设与组合编辑器', 'ui'],
  '@deepseek-ai/dsh-client-ui-plan': ['计划模式控件', '输入框上的计划模式开关', 'ui'],
  '@deepseek-ai/dsh-client-ui-user-questions': ['提问界面', 'ask_user_question 的提问 UI', 'ui'],
  '@deepseek-ai/dsh-client-ui-trajectory': ['轨迹视图', '交互式时序轨迹事件总览', 'ui'],
  '@deepseek-ai/dsh-web-app': ['Web 运行时', 'Web 界面运行时（前端资源、信任栅栏）', 'web'],
  '@deepseek-ai/dsh-web-app/startup': ['Web 启动参数', '解析 Web 启动参数（host/port 等）', 'web'],
  '@deepseek-ai/dsh-host-webserver': ['HTTP 服务器', 'Web 路由注册与静态资源服务', 'web'],
  '@deepseek-ai/dsh-host-apiproxy': ['API 网关宿主', '/api 契约、fetch 载体与主机插件', 'web'],
  '@deepseek-ai/dsh-client-hmr': ['客户端热更新', '开发模式下客户端插件热更新驱动', 'web'],
  '@deepseek-ai/dsh-sandbox-local': ['进程沙箱', '本地进程沙箱后端（bwrap/landlock 等）', 'sandbox'],
  '@deepseek-ai/dsh-sandbox-policy': ['沙箱策略', '每次调用的沙箱策略解析', 'sandbox'],
  '@deepseek-ai/dsh-fs-sandbox': ['文件沙箱执行', '按沙箱策略拦截 write/edit 的文件系统', 'sandbox'],
  '@deepseek-ai/dsh-bash-sandbox': ['Bash 执行器（沙箱）', '通过沙箱执行 Bash 命令', 'sandbox'],
  '@deepseek-ai/dsh-pwsh-sandbox': ['PowerShell 执行器（沙箱）', '通过沙箱执行 PowerShell 命令', 'sandbox'],
  '@deepseek-ai/dsh-user-approval': ['操作审批', '危险操作的一次性权限审批通道', 'sandbox'],
  '@deepseek-ai/dsh-permission-presets': ['权限预设', '面向用户的权限预设', 'sandbox'],
  '@deepseek-ai/dsh-storage': ['存储中枢', '命名存储后端注册与数据形态设施', 'storage'],
  '@deepseek-ai/dsh-storage-json': ['JSON 存储后端', 'JSON 文件 KV 存储后端', 'storage'],
  '@deepseek-ai/dsh-storage-domain': ['领域存储', '带模式校验的 KV 领域数据存储', 'storage'],
  '@deepseek-ai/dsh-settings-file': ['设置存储（文件）', '把设置写入 settings.yaml 的文件后端', 'storage'],
  '@deepseek-ai/dsh-credentials-local': ['凭据存储（本地）', '本地凭据提供者（.credentials.yaml）', 'storage'],
  '@deepseek-ai/dsh-attachment-local': ['附件存储', '内容寻址的附件本地存储', 'storage'],
  '@deepseek-ai/dsh-spill-local': ['溢写存储（本地）', '超大工具结果溢写到本地文件', 'storage'],
  '@deepseek-ai/dsh-spill-policy': ['溢写策略', '把超长工具结果替换为文件引用', 'storage'],
}

export const FALLBACK_DESC = '暂无内置说明，可在覆盖文件中补充自定义说明。'

/** 系统保护模块：缺失会导致应用/传输层/插件管家自身失效，界面不允许停用。 */
export const SYSTEM_MODULES = new Set([
  '@deepseek-ai/cordis-plugin-timer',
  '@deepseek-ai/cordis-plugin-hmr',
  '@deepseek-ai/dsh-typert-registry',
  '@deepseek-ai/dsh-typert-loader',
  '@deepseek-ai/dsh-api-gateway',
  '@deepseek-ai/dsh-host-apiproxy',
  '@deepseek-ai/dsh-llm',
  '@deepseek-ai/dsh-tools',
  '@deepseek-ai/dsh-system-prompt',
  '@deepseek-ai/dsh-agent',
  '@deepseek-ai/dsh-agent-loop',
  '@deepseek-ai/dsh-session',
  '@deepseek-ai/dsh-session-persistence-jsonl',
  '@deepseek-ai/dsh-settings-file',
  '@deepseek-ai/dsh-storage',
  '@deepseek-ai/dsh-storage-json',
  '@deepseek-ai/dsh-storage-domain',
  '@deepseek-ai/dsh-sandbox-local',
  '@deepseek-ai/dsh-sandbox-policy',
  '@deepseek-ai/dsh-fs-sandbox',
  '@deepseek-ai/dsh-host-webserver',
  '@deepseek-ai/dsh-web-app',
  '@deepseek-ai/dsh-web-app/startup',
  '@deepseek-ai/dsh-client-modules',
  '@deepseek-ai/dsh-client-connection',
  '@deepseek-ai/dsh-api-remotes',
  '@deepseek-ai/dsh-client-runtime',
  '@deepseek-ai/dsh-client-ui-settings',
  '@deepseek-ai/dsh-client-ui-settings-plugins',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-ui-layout',
  'dsh-plugin-butler',
])

/** 按行 id 保护（与模块名无关的引导行）。 */
export const SYSTEM_ROW_IDS = new Set(['include', 'loader', 'dsh-plugin-butler'])

// ---------- 目录覆盖文件 ----------
// 补丁文件的纯函数工具已抽到 lib/patch.js（parsePatchBlocks / setRowDisabled / initialPatchFile 等）。

function readOverrides() {
  try {
    const parsed = JSON.parse(readFileSync(overridesPath(), 'utf8'))
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    return {}
  } catch {
    return {}
  }
}

function writeOverrides(overrides) {
  mkdirSync(dirname(overridesPath()), { recursive: true })
  writeFileSync(overridesPath(), JSON.stringify(overrides, null, 2) + '\n', 'utf8')
}

function readGroups() {
  try {
    const parsed = JSON.parse(readFileSync(groupsPath(), 'utf8'))
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    return {}
  } catch {
    return {}
  }
}

function writeGroups(groups) {
  mkdirSync(dirname(groupsPath()), { recursive: true })
  writeFileSync(groupsPath(), JSON.stringify(groups, null, 2) + '\n', 'utf8')
}

function tryRead(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return undefined
    throw error
  }
}

function profileDir() {
  return join(dshHome(), 'profiles', PROFILE)
}

/** 从 npm registry 取一个包的 latest 版本；失败返回 null。 */
async function fetchLatestVersion(name) {
  try {
    const url = 'https://registry.npmjs.org/' + name.replace('/', '%2F') + '/latest'
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    const json = await res.json()
    return typeof json.version === 'string' ? json.version : null
  } catch {
    return null
  }
}

/** 截取子进程输出的尾部，供界面消息展示。 */
function summarize(output) {
  const text = String(output || '').trim()
  if (text.length === 0) return ''
  return ' 输出：' + text.slice(-300)
}

/** 读取 profile 的 package.json；不存在或非法返回空对象。 */
function readProfileManifest() {
  try {
    const parsed = JSON.parse(readFileSync(join(profileDir(), 'package.json'), 'utf8'))
    return parsed !== null && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/** 写回 profile 的 package.json。 */
function writeProfileManifest(manifest) {
  writeFileSync(join(profileDir(), 'package.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8')
}

/** 已安装依赖名集合。 */
function installedNames() {
  const manifest = readProfileManifest()
  const deps = manifest.dependencies && typeof manifest.dependencies === 'object' ? manifest.dependencies : {}
  return new Set(Object.keys(deps))
}

/** 已装依赖对应的 GitHub owner/repo 集合（用于精确判断市场项是否已装）。 */
function installedFullNames() {
  const manifest = readProfileManifest()
  const deps = manifest.dependencies && typeof manifest.dependencies === 'object' ? manifest.dependencies : {}
  const set = new Set()
  for (const [name, spec] of Object.entries(deps)) {
    if (typeof spec === 'string' && spec.startsWith('github:')) {
      const fn = spec.slice('github:'.length)
      if (/^[^/\s]+\/[^/\s]+$/.test(fn)) set.add(fn.toLowerCase())
    }
    const pkg = readInstalledPackage(name)
    if (pkg && pkg.repository) {
      const fn = githubFullName(pkg.repository)
      if (fn) set.add(fn.toLowerCase())
    }
  }
  return set
}

/** 读取某个已装包的 package.json；失败返回 null。 */
function readInstalledPackage(name) {
  try {
    return JSON.parse(readFileSync(join(profileDir(), 'node_modules', name, 'package.json'), 'utf8'))
  } catch {
    return null
  }
}

/** 把任意抛出的值转成可展示的字符串；无错误返回 null。 */
function errorMessage(error) {
  if (error === undefined || error === null) return null
  if (error instanceof Error) return error.message || String(error)
  return String(error)
}

// ---------- 远程服务 ----------

const FIBER_PHASE = ['pending', 'loading', 'active', 'failed', null, 'unloading']

/** npm 包名（可含作用域）合法性校验，防止把不可信输入传给 spawn shell。 */
const PKG_NAME_RE = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

class PluginManagerGateway {
  constructor(ctx) {
    this.ctx = ctx
    this.toggleQueue = Promise.resolve()
    this.overrideQueue = Promise.resolve()
    this.groupQueue = Promise.resolve()
    this.packageQueue = Promise.resolve()
    this.repoCache = new Map()
    this.marketCache = new Map()
  }

  /** 运行时行 id（include:<配置行 id>）的最后一段 = 补丁 id。 */
  patchIdOf(entryId) {
    return entryId.slice(entryId.lastIndexOf(':') + 1)
  }

  findEntry(entryId) {
    for (const entry of this.ctx.loader.entries()) {
      if (entry.options.group) continue
      if (entry.id === entryId) return entry
    }
    return undefined
  }

  resolveRepo(moduleName) {
    if (this.repoCache.has(moduleName)) return this.repoCache.get(moduleName)
    let repo = null
    try {
      const req = createRequire(this.ctx.baseUrl)
      for (const searchPath of req.resolve.paths(moduleName) ?? []) {
        const candidate = join(searchPath, moduleName)
        if (existsSync(join(candidate, 'package.json'))) {
          const pkg = JSON.parse(readFileSync(join(candidate, 'package.json'), 'utf8'))
          repo = githubUrl(pkg.repository)
          break
        }
      }
    } catch { /* ignore */ }
    this.repoCache.set(moduleName, repo)
    return repo
  }

  toggleGuard(entryId, moduleName) {
    const patchId = this.patchIdOf(entryId)
    if (patchId.length === 0) return { accepted: false, reason: 'system', message: '引导行不允许启停' }
    if (SYSTEM_MODULES.has(moduleName) || SYSTEM_ROW_IDS.has(entryId) || SYSTEM_ROW_IDS.has(patchId)) {
      return { accepted: false, reason: 'system', message: '系统插件：停用会导致应用或插件管家自身不可用' }
    }
    const entry = this.findEntry(entryId)
    if (entry === undefined) return { accepted: false, reason: 'not-found', message: `插件行不存在：${entryId}` }
    const raw = entry.options.disabled
    if (typeof raw !== 'boolean' && raw !== null && raw !== undefined) {
      return { accepted: false, reason: 'expression', message: '该插件由 !!js 表达式控制启停，请直接编辑配置文件' }
    }
    return undefined
  }

  /** 当前 Loader 行快照 + 目录信息 + 依赖关系。 */
  list() {
    const overrides = readOverrides()
    const groups = readGroups()
    const groupList = Array.isArray(groups.groups) ? groups.groups : []
    const assignments = groups.assignments && typeof groups.assignments === 'object' ? groups.assignments : {}

    // 第一遍：收集每个非 group 行的已解析注入（服务 + 提供者模块）与直接依赖。
    const rows = []
    for (const entry of this.ctx.loader.entries()) {
      if (entry.options.group) continue
      const moduleName = entry.options.name
      const fiber = entry.fiber
      const injects = []
      const depModules = new Set()
      const store = fiber && fiber._store
      if (store) {
        for (const [service, impl] of Object.entries(store)) {
          const pm = impl && impl.fiber && impl.fiber.entry ? impl.fiber.entry.options.name : null
          injects.push({ service, provider: pm || null })
          if (pm && pm !== moduleName) depModules.add(pm)
        }
      }
      rows.push({ entry, moduleName, injects, depModules: [...depModules] })
    }

    // 边：依赖者 -> 被依赖者（去重）；反向索引：被依赖模块 -> 依赖它的模块。
    const edgeSet = new Set()
    const edges = []
    const dependentsIndex = new Map()
    for (const r of rows) {
      for (const pm of r.depModules) {
        const key = r.moduleName + '\u2192' + pm
        if (edgeSet.has(key)) continue
        edgeSet.add(key)
        edges.push({ from: r.moduleName, to: pm })
        if (!dependentsIndex.has(pm)) dependentsIndex.set(pm, new Set())
        dependentsIndex.get(pm).add(r.moduleName)
      }
    }

    const entries = []
    let enabledCount = 0
    for (const r of rows) {
      const entry = r.entry
      const moduleName = r.moduleName
      const enabled = !entry.disabled
      if (enabled) enabledCount += 1
      const catalog = CATALOG[moduleName]
      const override = overrides[moduleName]
      const system = SYSTEM_MODULES.has(moduleName) || SYSTEM_ROW_IDS.has(entry.id)
      const raw = entry.options.disabled
      const expressionManaged = typeof raw !== 'boolean' && raw !== null && raw !== undefined
      const dependents = [...(dependentsIndex.get(moduleName) || [])].sort()
      entries.push({
        entryId: entry.id,
        moduleName,
        enabled,
        fiberPhase: entry.fiber === undefined ? null : (FIBER_PHASE[entry.fiber.state] ?? null),
        error: errorMessage(entry.fiber === undefined ? undefined : entry.fiber._error),
        displayName: override?.name ?? catalog?.[0] ?? moduleShortName(moduleName),
        description: override?.desc ?? catalog?.[1] ?? FALLBACK_DESC,
        category: catalog?.[2] ?? 'other',
        system,
        toggleable: !system && !expressionManaged,
        toggleBlockReason: system ? 'system' : expressionManaged ? 'expression' : null,
        hasOverride: override !== undefined,
        source: moduleName.startsWith('@deepseek-ai/') || moduleName.startsWith('cordis:') || moduleName.startsWith('cordis-plugin-') ? 'official' : 'external',
        group: assignments[moduleName] || null,
        repo: moduleName.startsWith('@deepseek-ai/') || moduleName.startsWith('cordis:') ? null : this.resolveRepo(moduleName),
        injects: r.injects,
        dependents,
      })
    }
    return {
      profile: PROFILE,
      patchFile: patchPath(),
      overridesFile: overridesPath(),
      entryCount: entries.length,
      enabledCount,
      groups: groupList,
      edges,
      entries,
    }
  }

  /** 启停一个插件：改写补丁文件，由 HMR 观察者热应用。 */
  setEnabled(entryId, enabled) {
    const entry = this.findEntry(entryId)
    if (entry === undefined) return Promise.resolve({ accepted: false, reason: 'not-found', message: `插件行不存在：${entryId}` })
    const guarded = this.toggleGuard(entryId, entry.options.name)
    if (guarded !== undefined) return Promise.resolve(guarded)

    const patchId = this.patchIdOf(entryId)
    const run = async () => {
      const path = patchPath()
      try {
        let content = tryRead(path) ?? initialPatchFile()
        let edited = setRowDisabled(content, patchId, enabled)
        if (edited.blocked === 'expression') {
          return { accepted: false, reason: 'expression', message: '该插件由 !!js 表达式控制启停，请直接编辑配置文件' }
        }
        if (edited.changed) {
          const current = tryRead(path)
          if (current !== undefined && current !== content) {
            edited = setRowDisabled(current, patchId, enabled)
            if (edited.blocked === 'expression') {
              return { accepted: false, reason: 'expression', message: '该插件由 !!js 表达式控制启停，请直接编辑配置文件' }
            }
          }
          writeFileSync(path, edited.content, 'utf8')
        }
        return { accepted: true }
      } catch (error) {
        return { accepted: false, reason: 'io-error', message: error instanceof Error ? error.message : String(error) }
      }
    }
    const queued = this.toggleQueue.then(run, run)
    this.toggleQueue = queued.then(() => {}, () => {})
    return queued
  }

  /** 保存一个模块的覆盖：空字段视为清除；两字段皆空则移除整条覆盖。 */
  setOverride(moduleName, name, desc) {
    const run = async () => {
      try {
        if (typeof moduleName !== 'string' || moduleName.length === 0) {
          return { accepted: false, reason: 'invalid-input', message: '模块名不能为空' }
        }
        const overrides = readOverrides()
        const next = { ...overrides }
        const entry = {}
        const trimmedName = (name ?? '').trim()
        const trimmedDesc = (desc ?? '').trim()
        if (trimmedName.length > 0) entry.name = trimmedName
        if (trimmedDesc.length > 0) entry.desc = trimmedDesc
        if (entry.name === undefined && entry.desc === undefined) delete next[moduleName]
        else next[moduleName] = entry
        writeOverrides(next)
        return { accepted: true }
      } catch (error) {
        return { accepted: false, reason: 'io-error', message: error instanceof Error ? error.message : String(error) }
      }
    }
    const queued = this.overrideQueue.then(run, run)
    this.overrideQueue = queued.then(() => {}, () => {})
    return queued
  }

  /** 移除一个模块的覆盖，恢复内置目录/短名。 */
  removeOverride(moduleName) {
    const run = async () => {
      try {
        if (typeof moduleName !== 'string' || moduleName.length === 0) {
          return { accepted: false, reason: 'invalid-input', message: '模块名不能为空' }
        }
        const overrides = readOverrides()
        if (!Object.prototype.hasOwnProperty.call(overrides, moduleName)) return { accepted: true }
        const next = { ...overrides }
        delete next[moduleName]
        writeOverrides(next)
        return { accepted: true }
      } catch (error) {
        return { accepted: false, reason: 'io-error', message: error instanceof Error ? error.message : String(error) }
      }
    }
    const queued = this.overrideQueue.then(run, run)
    this.overrideQueue = queued.then(() => {}, () => {})
    return queued
  }

  /** 创建自定义分组。 */
  createGroup(name) {
    const run = async () => {
      try {
        const trimmed = (name ?? '').trim()
        if (!trimmed) return { accepted: false, reason: 'invalid-input', message: '组名不能为空' }
        const groups = readGroups()
        const list = Array.isArray(groups.groups) ? groups.groups : []
        if (list.some((g) => g.name === trimmed)) return { accepted: false, reason: 'duplicate', message: '组名已存在' }
        list.push({ id: 'g' + Date.now().toString(36), name: trimmed })
        groups.groups = list
        writeGroups(groups)
        return { accepted: true, groups: list }
      } catch (error) {
        return { accepted: false, reason: 'io-error', message: error instanceof Error ? error.message : String(error) }
      }
    }
    const queued = this.groupQueue.then(run, run)
    this.groupQueue = queued.then(() => {}, () => {})
    return queued
  }

  /** 重命名分组。 */
  renameGroup(groupId, name) {
    const run = async () => {
      try {
        const trimmed = (name ?? '').trim()
        if (!trimmed) return { accepted: false, reason: 'invalid-input', message: '组名不能为空' }
        const groups = readGroups()
        const list = Array.isArray(groups.groups) ? groups.groups : []
        const group = list.find((g) => g.id === groupId)
        if (!group) return { accepted: false, reason: 'not-found', message: '分组不存在' }
        if (list.some((g) => g.name === trimmed && g.id !== groupId)) return { accepted: false, reason: 'duplicate', message: '组名已存在' }
        group.name = trimmed
        writeGroups(groups)
        return { accepted: true, groups: list }
      } catch (error) {
        return { accepted: false, reason: 'io-error', message: error instanceof Error ? error.message : String(error) }
      }
    }
    const queued = this.groupQueue.then(run, run)
    this.groupQueue = queued.then(() => {}, () => {})
    return queued
  }

  /** 删除分组（其成员回到未分组）。 */
  deleteGroup(groupId) {
    const run = async () => {
      try {
        const groups = readGroups()
        groups.groups = (Array.isArray(groups.groups) ? groups.groups : []).filter((g) => g.id !== groupId)
        const assignments = groups.assignments && typeof groups.assignments === 'object' ? groups.assignments : {}
        for (const key of Object.keys(assignments)) if (assignments[key] === groupId) delete assignments[key]
        groups.assignments = assignments
        writeGroups(groups)
        return { accepted: true, groups: groups.groups, assignments }
      } catch (error) {
        return { accepted: false, reason: 'io-error', message: error instanceof Error ? error.message : String(error) }
      }
    }
    const queued = this.groupQueue.then(run, run)
    this.groupQueue = queued.then(() => {}, () => {})
    return queued
  }

  /** 把插件移入/移出分组（groupId 为空 = 未分组）。 */
  assign(moduleName, groupId) {
    const run = async () => {
      try {
        if (typeof moduleName !== 'string' || moduleName.length === 0) {
          return { accepted: false, reason: 'invalid-input', message: '模块名不能为空' }
        }
        const groups = readGroups()
        const assignments = groups.assignments && typeof groups.assignments === 'object' ? groups.assignments : {}
        if (groupId === null || groupId === '') delete assignments[moduleName]
        else assignments[moduleName] = String(groupId)
        groups.assignments = assignments
        writeGroups(groups)
        return { accepted: true, assignments }
      } catch (error) {
        return { accepted: false, reason: 'io-error', message: error instanceof Error ? error.message : String(error) }
      }
    }
    const queued = this.groupQueue.then(run, run)
    this.groupQueue = queued.then(() => {}, () => {})
    return queued
  }

  /** 检查已装 npm 依赖是否有更新。 */
  checkUpdates() {
    return (async () => {
      try {
        const dir = profileDir()
        const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
        const deps = manifest.dependencies || {}
        const items = []
        for (const [name, spec] of Object.entries(deps)) {
          if (name.startsWith('@deepseek-ai/') || name.startsWith('cordis:')) continue
          const source = /^(link|file):/.test(spec)
            ? 'link'
            : /^(git|github:|git\+|https?:\/\/.*\.git)/.test(spec) ? 'git' : 'npm'
          if (source !== 'npm') {
            items.push({ name, currentVersion: null, latestVersion: null, hasUpdate: false, source, message: '非 npm 源，不可自动检测' })
            continue
          }
          let currentVersion = null
          try {
            const pkg = JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8'))
            currentVersion = pkg.version
          } catch { /* 未物化 */ }
          const latestVersion = await fetchLatestVersion(name)
          items.push({
            name,
            currentVersion,
            latestVersion,
            hasUpdate: !!currentVersion && !!latestVersion && currentVersion !== latestVersion,
            source,
            message: latestVersion === null ? '无法获取最新版本（网络或包名问题）' : undefined,
          })
        }
        return { ok: true, items }
      } catch (error) {
        return { ok: false, items: [], message: error instanceof Error ? error.message : String(error) }
      }
    })()
  }

  /** 在 profile 目录跑一次 pnpm（由 packageQueue 串行化，调用方保证不并发）。 */
  runPnpm(args) {
    return new Promise((resolveResult) => {
      let output = ''
      let settled = false
      const finish = (ok) => { if (!settled) { settled = true; resolveResult({ ok, output }) } }
      const child = spawn('pnpm', args, {
        cwd: profileDir(),
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      child.stdout.on('data', (d) => { output += d })
      child.stderr.on('data', (d) => { output += d })
      child.on('error', (e) => { output += String(e); finish(false) })
      child.on('close', (code) => finish(code === 0))
      setTimeout(() => { try { child.kill() } catch { /* ignore */ } }, 120000)
    })
  }

  /** 更新一个已装 npm 依赖到 @latest（失败自动回滚到旧版本）。 */
  update(name) {
    const run = async () => {
      if (typeof name !== 'string' || name.length === 0) {
        return { accepted: false, message: '包名不能为空' }
      }
      if (!PKG_NAME_RE.test(name)) {
        return { accepted: false, message: '非法包名' }
      }
      let oldVersion = null
      const pkg = readInstalledPackage(name)
      if (pkg) oldVersion = pkg.version

      const result = await this.runPnpm(['add', name + '@latest'])
      if (result.ok) {
        return { accepted: true, updated: true, rolledBack: false, message: '已更新到 @latest，重启 profile 生效。' + summarize(result.output) }
      }
      let rolledBack = false
      if (oldVersion) {
        const rb = await this.runPnpm(['add', name + '@' + oldVersion])
        rolledBack = rb.ok
      }
      return {
        accepted: false,
        updated: false,
        rolledBack,
        message: '更新失败' + (rolledBack ? '，已回滚到 ' + oldVersion : '，回滚也失败，请手动执行 dsh plugin add 修复') + summarize(result.output),
      }
    }
    const queued = this.packageQueue.then(run, run)
    this.packageQueue = queued.then(() => {}, () => {})
    return queued
  }

  /** 市场：搜索 GitHub 公开 `dsh-plugin` 板块（始终限定 topic，按 stars 排序，分页）。 */
  market(query, page) {
    return (async () => {
      try {
        const p = Math.max(1, Number.parseInt(page, 10) || 1)
        const q = ((query ?? '').trim() ? query.trim() + ' ' : '') + 'topic:dsh-plugin'
        const cacheKey = q.toLowerCase() + '#' + p
        const cached = this.marketCache.get(cacheKey)
        if (cached && Date.now() - cached.at < 300000) return cached.data
        const url = 'https://api.github.com/search/repositories?q=' + encodeURIComponent(q) + '&sort=stars&order=desc&per_page=30&page=' + p
        const res = await fetch(url, {
          headers: { accept: 'application/vnd.github+json', 'user-agent': 'dsh-plugin-butler' },
          signal: AbortSignal.timeout(15000),
        })
        if (!res.ok) return { ok: false, items: [], message: '搜索失败：HTTP ' + res.status }
        const json = await res.json()
        const installed = installedFullNames()
        const items = (Array.isArray(json.items) ? json.items : [])
          .map((it) => ({
            name: it.name || '',
            fullName: it.full_name || '',
            owner: (it.owner && it.owner.login) || '',
            url: it.html_url || '',
            description: it.description || '',
            stars: it.stargazers_count || 0,
            pushed: it.pushed_at || '',
            homepage: it.homepage || '',
            installed: installed.has((it.full_name || '').toLowerCase()),
          }))
          .filter((i) => i.fullName)
        const total = json.total_count || 0
        const result = { ok: true, items, total, page: p, hasMore: p * 30 < total }
        this.marketCache.set(cacheKey, { at: Date.now(), data: result })
        return result
      } catch (error) {
        return { ok: false, items: [], message: error instanceof Error ? error.message : String(error) }
      }
    })()
  }

  /** 详情：取 npm registry 元数据（含 README 文本）。 */
  detail(name) {
    return (async () => {
      try {
        if (typeof name !== 'string' || !name) return { ok: false, message: '包名不能为空' }
        const url = 'https://registry.npmjs.org/' + name.replace('/', '%2F')
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
        if (!res.ok) return { ok: false, message: '获取失败：HTTP ' + res.status }
        const json = await res.json()
        const latest = json['dist-tags'] && json['dist-tags'].latest
        const v = latest && json.versions && json.versions[latest]
        const installedPkg = readInstalledPackage(name)
        return {
          ok: true,
          name: json.name || name,
          description: json.description || '',
          latest: latest || null,
          readme: typeof json.readme === 'string' ? json.readme.slice(0, 60000) : '',
          repository: v && v.repository ? githubUrl(v.repository) : null,
          homepage: v && v.homepage ? String(v.homepage) : null,
          license: v && v.license ? (typeof v.license === 'string' ? v.license : (v.license && v.license.type) || '') : null,
          author: v && v.author ? (v.author.name || String(v.author)) : null,
          keywords: v && Array.isArray(v.keywords) ? v.keywords : [],
          installed: !!installedPkg,
          installedVersion: installedPkg && installedPkg.version ? installedPkg.version : null,
        }
      } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : String(error) }
      }
    })()
  }

  /** 详情：取 GitHub 仓库元数据 + README（base64 解码）。 */
  detailRepo(fullName) {
    return (async () => {
      try {
        if (typeof fullName !== 'string' || !/^[^/\s]+\/[^/\s]+$/.test(fullName)) return { ok: false, message: '无效的仓库名' }
        const headers = { accept: 'application/vnd.github+json', 'user-agent': 'dsh-plugin-butler' }
        const repoRes = await fetch('https://api.github.com/repos/' + fullName, { headers, signal: AbortSignal.timeout(15000) })
        if (!repoRes.ok) return { ok: false, message: '获取失败：HTTP ' + repoRes.status }
        const repo = await repoRes.json()
        let readme = ''
        try {
          const rmRes = await fetch('https://api.github.com/repos/' + fullName + '/readme', { headers, signal: AbortSignal.timeout(15000) })
          if (rmRes.ok) {
            const rm = await rmRes.json()
            if (rm && typeof rm.content === 'string') readme = Buffer.from(rm.content, 'base64').toString('utf8').slice(0, 60000)
          }
        } catch { /* ignore */ }
        const installedPkg = readInstalledPackage(repo.name || '')
        const installed = installedFullNames().has(fullName.toLowerCase())
        return {
          ok: true,
          name: fullName,
          description: repo.description || '',
          latest: null,
          readme,
          repository: repo.html_url || null,
          homepage: repo.homepage || null,
          license: (repo.license && repo.license.spdx_id) || null,
          author: (repo.owner && repo.owner.login) || null,
          stars: repo.stargazers_count || 0,
          pushed: repo.pushed_at || null,
          installed,
          installedVersion: installed && installedPkg && installedPkg.version ? installedPkg.version : null,
        }
      } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : String(error) }
      }
    })()
  }

  /** 把声明 dsh.bundle 的依赖同步进组合层（镜像 dsh plugin add 的 reconcile）。 */
  reconcileBundles() {
    const manifest = readProfileManifest()
    const deps = manifest.dependencies && typeof manifest.dependencies === 'object' ? manifest.dependencies : {}
    const bundles = Array.isArray(manifest.dsh?.profile?.bundles) ? manifest.dsh.profile.bundles : []
    let changed = false
    for (const name of Object.keys(deps)) {
      const pkg = readInstalledPackage(name)
      if (pkg && pkg.dsh && pkg.dsh.bundle && pkg.dsh.bundle.patch && !bundles.includes(name)) {
        bundles.push(name)
        changed = true
      }
    }
    if (changed) {
      manifest.dsh = { ...manifest.dsh, profile: { ...(manifest.dsh?.profile), bundles } }
      writeProfileManifest(manifest)
    }
    return changed
  }

  /** 安装：npm 包名或 github:owner/repo（等价 dsh plugin add，自动 reconcile 组合层）。 */
  install(spec) {
    const run = async () => {
      if (typeof spec !== 'string' || !spec) return { accepted: false, message: '规格不能为空' }
      let pnpmSpec
      if (spec.startsWith('github:')) {
        const fullName = spec.slice('github:'.length)
        if (!/^[^/\s]+\/[^/\s]+$/.test(fullName)) return { accepted: false, message: '无效的 GitHub 仓库' }
        pnpmSpec = spec
      } else {
        if (!PKG_NAME_RE.test(spec)) return { accepted: false, message: '非法包名' }
        if (installedNames().has(spec)) return { accepted: false, message: '已安装：' + spec }
        pnpmSpec = spec + '@latest'
      }
      const result = await this.runPnpm(['add', pnpmSpec])
      if (!result.ok) return { accepted: false, message: '安装失败' + summarize(result.output) }
      const reconciled = this.reconcileBundles()
      return { accepted: true, message: '已安装 ' + spec + (reconciled ? '（已加入组合层）' : '') + '，重启 profile 生效。' + summarize(result.output) }
    }
    const queued = this.packageQueue.then(run, run)
    this.packageQueue = queued.then(() => {}, () => {})
    return queued
  }

  /** 卸载一个外部依赖（先从组合层移除，再 pnpm remove；失败回滚组合层）。 */
  uninstall(name) {
    const run = async () => {
      if (typeof name !== 'string' || !name) return { accepted: false, message: '包名不能为空' }
      if (!PKG_NAME_RE.test(name)) return { accepted: false, message: '非法包名' }
      if (SYSTEM_MODULES.has(name) || name.startsWith('@deepseek-ai/') || name === 'dsh-plugin-butler') {
        return { accepted: false, message: '系统/官方插件不允许卸载' }
      }
      const manifest = readProfileManifest()
      const deps = manifest.dependencies && typeof manifest.dependencies === 'object' ? manifest.dependencies : {}
      if (!Object.prototype.hasOwnProperty.call(deps, name)) return { accepted: false, message: '未安装：' + name }

      let hadBundle = false
      const bundles = Array.isArray(manifest.dsh?.profile?.bundles) ? manifest.dsh.profile.bundles : []
      if (bundles.includes(name)) {
        hadBundle = true
        manifest.dsh = { ...manifest.dsh, profile: { ...(manifest.dsh?.profile), bundles: bundles.filter((b) => b !== name) } }
        writeProfileManifest(manifest)
      }
      const result = await this.runPnpm(['remove', name])
      if (!result.ok) {
        if (hadBundle) {
          const m = readProfileManifest()
          const b = Array.isArray(m.dsh?.profile?.bundles) ? m.dsh.profile.bundles : []
          if (!b.includes(name)) {
            b.push(name)
            m.dsh = { ...m.dsh, profile: { ...(m.dsh?.profile), bundles: b } }
            writeProfileManifest(m)
          }
        }
        return { accepted: false, message: '卸载失败，已回滚组合层' + summarize(result.output) }
      }
      try {
        const overrides = readOverrides()
        if (Object.prototype.hasOwnProperty.call(overrides, name)) { const next = { ...overrides }; delete next[name]; writeOverrides(next) }
        const groups = readGroups()
        const assignments = groups.assignments && typeof groups.assignments === 'object' ? groups.assignments : {}
        if (assignments[name]) { delete assignments[name]; groups.assignments = assignments; writeGroups(groups) }
      } catch { /* ignore */ }
      return { accepted: true, message: '已卸载 ' + name + '，重启 profile 生效。' + summarize(result.output) }
    }
    const queued = this.packageQueue.then(run, run)
    this.packageQueue = queued.then(() => {}, () => {})
    return queued
  }
}

export const inject = ['loader', 'webServer']

export function apply(ctx) {
  const svc = new PluginManagerGateway(ctx)

  const sendJson = (res, status, data) => {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(data))
  }
  const readBody = (req) => new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => {
      data += c
      if (data.length > 1_000_000) { reject(new Error('request body too large')); req.destroy() }
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
  const json = async (req) => JSON.parse((await readBody(req)) || '{}')

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/plugin-manager',
    handler: async (req, res) => {
      const pathname = new URL(req.url || '/', 'http://x').pathname
      // 仅接受同源/非浏览器请求：防止其它网页 CSRF 触发启停/更新。
      const secFetchSite = String(req.headers['sec-fetch-site'] || '')
      if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'none') {
        return sendJson(res, 403, { error: 'forbidden: cross-site request' })
      }
      const origin = String(req.headers.origin || '')
      const host = String(req.headers.host || '')
      if (origin && host) {
        try {
          if (new URL(origin).host !== host) return sendJson(res, 403, { error: 'forbidden: cross-origin request' })
        } catch { /* 忽略畸形 Origin */ }
      }
      try {
        if (req.method === 'GET' && pathname === '/plugin-manager/list') return sendJson(res, 200, svc.list())
        if (req.method === 'GET' && pathname === '/plugin-manager/checkUpdates') return sendJson(res, 200, await svc.checkUpdates())
        if (req.method === 'POST' && pathname === '/plugin-manager/setEnabled') { const b = await json(req); return sendJson(res, 200, await svc.setEnabled(String(b.entryId), Boolean(b.enabled))) }
        if (req.method === 'POST' && pathname === '/plugin-manager/setOverride') { const b = await json(req); return sendJson(res, 200, await svc.setOverride(String(b.moduleName), b.name, b.desc)) }
        if (req.method === 'POST' && pathname === '/plugin-manager/removeOverride') { const b = await json(req); return sendJson(res, 200, await svc.removeOverride(String(b.moduleName))) }
        if (req.method === 'POST' && pathname === '/plugin-manager/createGroup') { const b = await json(req); return sendJson(res, 200, await svc.createGroup(b.name)) }
        if (req.method === 'POST' && pathname === '/plugin-manager/renameGroup') { const b = await json(req); return sendJson(res, 200, await svc.renameGroup(String(b.groupId), b.name)) }
        if (req.method === 'POST' && pathname === '/plugin-manager/deleteGroup') { const b = await json(req); return sendJson(res, 200, await svc.deleteGroup(String(b.groupId))) }
        if (req.method === 'POST' && pathname === '/plugin-manager/assign') { const b = await json(req); return sendJson(res, 200, await svc.assign(String(b.moduleName), b.groupId === null || b.groupId === '' ? null : b.groupId)) }
        if (req.method === 'POST' && pathname === '/plugin-manager/update') { const b = await json(req); return sendJson(res, 200, await svc.update(String(b.name))) }
        if (req.method === 'GET' && pathname === '/plugin-manager/market') { const u = new URL(req.url || '/', 'http://x'); return sendJson(res, 200, await svc.market(u.searchParams.get('q') || '', u.searchParams.get('page') || '1')) }
        if (req.method === 'GET' && pathname === '/plugin-manager/detail') { const u = new URL(req.url || '/', 'http://x'); return sendJson(res, 200, await svc.detail(u.searchParams.get('name') || '')) }
        if (req.method === 'GET' && pathname === '/plugin-manager/detailRepo') { const u = new URL(req.url || '/', 'http://x'); return sendJson(res, 200, await svc.detailRepo(u.searchParams.get('fullName') || '')) }
        if (req.method === 'POST' && pathname === '/plugin-manager/install') { const b = await json(req); return sendJson(res, 200, await svc.install(String(b.name))) }
        if (req.method === 'POST' && pathname === '/plugin-manager/uninstall') { const b = await json(req); return sendJson(res, 200, await svc.uninstall(String(b.name))) }
        return sendJson(res, 404, { error: 'not-found' })
      } catch (error) {
        return sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) })
      }
    },
  }))
}
