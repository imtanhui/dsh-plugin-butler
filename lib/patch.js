/**
 * dsh-plugin-manager 纯函数工具：补丁文件手术式编辑 + GitHub 仓库解析 + 短名。
 * 不依赖 node:fs，便于单测。
 * @module dsh-plugin-manager/patch
 */

export function eolOf(content) {
  return content.includes('\r\n') ? '\r\n' : '\n'
}

export function unquote(value) {
  const t = value.trim()
  if (t.length >= 2 && ((t[0] === "'" && t[t.length - 1] === "'") || (t[0] === '"' && t[t.length - 1] === '"'))) {
    return t.slice(1, -1)
  }
  return t
}

export function isExpression(value) {
  return value !== null && value.trim().startsWith('!!js')
}

/** 解析顶层行块（按列 0 的 "- " 切块）。 */
export function parsePatchBlocks(content) {
  const lines = content.split(/\r?\n/)
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''
    if (!/^- /.test(line)) { i += 1; continue }
    const start = i
    i += 1
    while (i < lines.length && !/^- /.test(lines[i] ?? '')) i += 1
    const blockLines = lines.slice(start, i)
    let id = null
    let disabledIndex = -1
    let disabledValue = null
    for (let at = 0; at < blockLines.length; at += 1) {
      const text = blockLines[at] ?? ''
      const idMatch = /^- id:\s*(.*)$/.exec(text)
      if (idMatch) id = unquote(idMatch[1] ?? '')
      const disabledMatch = /^(\s*)disabled:\s*(.*)$/.exec(text)
      if (disabledMatch && disabledIndex < 0) {
        disabledIndex = at
        disabledValue = (disabledMatch[2] ?? '').trim()
      }
    }
    blocks.push({ lines: blockLines, start, id, disabledIndex, disabledValue })
  }
  return blocks
}

/** 在补丁内容里为 entryId 设置/清除 disabled（保留其它行与注释原样不动）。 */
export function setRowDisabled(content, entryId, enabled) {
  const eol = eolOf(content)
  const lines = content.split(/\r?\n/)
  const blocks = parsePatchBlocks(content)
  const target = blocks.find((b) => b.id === entryId)

  if (target !== undefined && target.disabledIndex >= 0 && isExpression(target.disabledValue)) {
    return { content, changed: false, blocked: 'expression' }
  }

  if (!enabled) {
    if (target !== undefined && target.disabledValue === 'true') {
      return { content, changed: false, blocked: null }
    }
    if (target !== undefined && target.disabledIndex >= 0) {
      const next = [...lines]
      next[target.start + target.disabledIndex] = '  disabled: true'
      return { content: next.join(eol), changed: true, blocked: null }
    }
    if (target !== undefined) {
      const next = [...lines]
      next.splice(target.start + 1, 0, '  disabled: true')
      return { content: next.join(eol), changed: true, blocked: null }
    }
  } else {
    if (target !== undefined) {
      const next = [...lines]
      if (target.disabledIndex >= 0) next[target.start + target.disabledIndex] = '  disabled: false'
      else next.splice(target.start + 1, 0, '  disabled: false')
      return { content: next.join(eol), changed: true, blocked: null }
    }
  }

  const addition = [`- id: ${entryId}`, `  disabled: ${enabled ? 'false' : 'true'}`]
  const marker = lines.findIndex((line) => line.trim() === '[]')
  if (marker >= 0) {
    const next = [...lines]
    next.splice(marker, 1, ...addition)
    return { content: next.join(eol), changed: true, blocked: null }
  }
  const trimmed = content.length > 0 && !content.endsWith(eol) ? content + eol : content
  return { content: trimmed + addition.join(eol) + eol, changed: true, blocked: null }
}

export function initialPatchFile() {
  return [
    '# dsh-plugin-manager（插件管家）管理的启停补丁 —— 修改后实时热生效。',
    '# 你仍可手工编辑本文件；插件管家只在需要时增删 "- id: … / disabled: …" 行块。',
    '# !!js 表达式控制的插件不会被插件管家改写。',
    '[]',
    '',
  ].join('\n')
}

/** 把 package.json 的 repository 字段规整成 GitHub https URL；非 GitHub 返回 null。 */
export function githubUrl(repository) {
  if (!repository) return null
  let url = ''
  if (typeof repository === 'string') url = repository
  else if (repository && typeof repository === 'object' && typeof repository.url === 'string') url = repository.url
  if (!url) return null
  url = url.replace(/^git\+/, '')
  if (url.startsWith('git@github.com:')) url = 'https://github.com/' + url.slice('git@github.com:'.length)
  else if (url.startsWith('git://github.com/')) url = 'https://github.com/' + url.slice('git://github.com/'.length)
  else if (url.startsWith('ssh://git@github.com/')) url = 'https://github.com/' + url.slice('ssh://git@github.com/'.length)
  url = url.replace(/\.git$/, '')
  if (!/^https?:\/\/github\.com\/[^/\s]+/.test(url)) return null
  return url
}

/** 去掉作用域与 dsh/cordis 前缀，得到可读短名。 */
export function moduleShortName(moduleName) {
  const unscoped = moduleName.startsWith('@') ? moduleName.slice(moduleName.indexOf('/') + 1) : moduleName
  return unscoped
    .replace(/^cordis:/, '')
    .replace(/^cordis-plugin-/, '')
    .replace(/^dsh-(?:host-|client-)?/, '')
}
