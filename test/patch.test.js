import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  eolOf,
  unquote,
  isExpression,
  parsePatchBlocks,
  setRowDisabled,
  initialPatchFile,
  githubUrl,
  moduleShortName,
} from '../lib/patch.js'

test('eolOf 识别 CRLF 与 LF', () => {
  assert.equal(eolOf('a\r\nb'), '\r\n')
  assert.equal(eolOf('a\nb'), '\n')
})

test('unquote 去掉单双引号、保留未加引号', () => {
  assert.equal(unquote("'foo'"), 'foo')
  assert.equal(unquote('"bar"'), 'bar')
  assert.equal(unquote('baz'), 'baz')
  assert.equal(unquote(''), '')
})

test('isExpression 识别 !!js 表达式', () => {
  assert.equal(isExpression('!!js/function () { return true }'), true)
  assert.equal(isExpression('  !!js/foo'), true)
  assert.equal(isExpression('true'), false)
  assert.equal(isExpression(null), false)
})

test('parsePatchBlocks 解析 id / disabled / 引号', () => {
  const content = "- id: foo\n  disabled: true\n- id: 'bar'\n  name: x\n"
  const blocks = parsePatchBlocks(content)
  assert.equal(blocks.length, 2)
  assert.equal(blocks[0].id, 'foo')
  assert.equal(blocks[0].disabledValue, 'true')
  assert.equal(blocks[1].id, 'bar')
  assert.equal(blocks[1].disabledIndex, -1)
})

test('setRowDisabled 停用不存在的行：追加块', () => {
  const r = setRowDisabled('# comment\n[]\n', 'foo', false)
  assert.equal(r.changed, true)
  assert.equal(r.blocked, null)
  assert.equal(r.content, '# comment\n- id: foo\n  disabled: true\n')
})

test('setRowDisabled 启用已停用行：改 disabled: false', () => {
  const r = setRowDisabled('- id: foo\n  disabled: true\n', 'foo', true)
  assert.equal(r.changed, true)
  assert.equal(r.content, '- id: foo\n  disabled: false\n')
})

test('setRowDisabled 停用无 disabled 行的块：插入 disabled: true', () => {
  const r = setRowDisabled("- id: foo\n  name: 'x'\n", 'foo', false)
  assert.equal(r.changed, true)
  assert.equal(r.content, "- id: foo\n  disabled: true\n  name: 'x'\n")
})

test('setRowDisabled 拒绝改写 !!js 表达式', () => {
  const content = '- id: foo\n  disabled: !!js/function (x) { return true; }\n'
  const r = setRowDisabled(content, 'foo', false)
  assert.equal(r.changed, false)
  assert.equal(r.blocked, 'expression')
  assert.equal(r.content, content)
})

test('setRowDisabled 已停用再停用是幂等', () => {
  const content = '- id: foo\n  disabled: true\n'
  const r = setRowDisabled(content, 'foo', false)
  assert.equal(r.changed, false)
  assert.equal(r.content, content)
})

test('setRowDisabled 保留 CRLF 换行', () => {
  const r = setRowDisabled('# a\r\n- id: foo\r\n  disabled: true\r\n', 'foo', true)
  assert.equal(r.content, '# a\r\n- id: foo\r\n  disabled: false\r\n')
})

test('setRowDisabled 保留其它块与注释', () => {
  const content = "# top\n- id: other\n  disabled: true\n- id: foo\n  name: 'Foo'\n"
  const r = setRowDisabled(content, 'foo', false)
  assert.equal(r.content, "# top\n- id: other\n  disabled: true\n- id: foo\n  disabled: true\n  name: 'Foo'\n")
})

test('setRowDisabled 无 [] 标记时追加到末尾', () => {
  const r = setRowDisabled('# only comment', 'foo', false)
  assert.equal(r.changed, true)
  assert.equal(r.content, '# only comment\n- id: foo\n  disabled: true\n')
})

test('initialPatchFile 含占位标记', () => {
  const c = initialPatchFile()
  assert.equal(typeof c, 'string')
  assert.ok(c.includes('[]'))
})

test('githubUrl 规整各种 repository 形态', () => {
  assert.equal(githubUrl('https://github.com/foo/bar'), 'https://github.com/foo/bar')
  assert.equal(githubUrl('git+https://github.com/foo/bar.git'), 'https://github.com/foo/bar')
  assert.equal(githubUrl({ url: 'git@github.com:foo/bar.git' }), 'https://github.com/foo/bar')
  assert.equal(githubUrl('git://github.com/foo/bar'), 'https://github.com/foo/bar')
  assert.equal(githubUrl('ssh://git@github.com/foo/bar.git'), 'https://github.com/foo/bar')
  assert.equal(githubUrl('https://gitlab.com/foo/bar'), null)
  assert.equal(githubUrl('github.com/foo/bar'), null)
  assert.equal(githubUrl(null), null)
  assert.equal(githubUrl(undefined), null)
})

test('moduleShortName 去掉作用域与 dsh/cordis 前缀', () => {
  assert.equal(moduleShortName('@deepseek-ai/dsh-client-runtime'), 'runtime')
  assert.equal(moduleShortName('@deepseek-ai/dsh-host-webserver'), 'webserver')
  assert.equal(moduleShortName('cordis-plugin-timer'), 'timer')
  assert.equal(moduleShortName('cordis:foo'), 'foo')
  assert.equal(moduleShortName('plain-pkg'), 'plain-pkg')
  assert.equal(moduleShortName('dsh-plugin-manager'), 'plugin-manager')
})
