window.__ModuleLoader__.load({
  id: 'dsh-plugin-manager',
  factory: (require) => {
    const { createElement: h, useState, useEffect, useCallback, Fragment } = require('react')

    const CATEGORY_LABELS = {
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

    const css = [
      '.pmg{display:flex;flex-direction:column;gap:16px;width:100%;max-width:780px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}',
      '.pmg-head{display:flex;align-items:center;justify-content:space-between;gap:12px}',
      '.pmg-search{position:relative;flex:1}',
      '.pmg-search input{width:100%;height:34px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font:inherit;font-size:13px;outline:none;box-sizing:border-box}',
      '.pmg-search input:focus-visible{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 18%,transparent)}',
      '.pmg-count{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;font-size:12px;white-space:nowrap}',
      '.pmg-sec{display:flex;flex-direction:column;gap:8px}',
      '.pmg-sec-title{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary);letter-spacing:.02em;cursor:pointer;user-select:none}',
      '.pmg-sec-title:hover{color:var(--dsw-alias-label-primary)}',
      '.pmg-sec-title .bar{flex:1;height:1px;background:var(--dsw-alias-border-l2)}',
      '.pmg-chev{flex:none;font-size:11px;line-height:1;color:var(--dsw-alias-label-secondary)}',
      '.pmg-n{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;font-size:11px;font-weight:400}',
      '.pmg-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
      '.pmg-chip{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer;font:inherit}',
      '.pmg-chip[data-on="true"]{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 8%,transparent)}',
      '.pmg-chip .x{opacity:.55;display:inline-flex}',
      '.pmg-chip .x:hover{opacity:1}',
      '.pmg-add{display:inline-flex;align-items:center;height:24px;padding:0 8px;border-radius:999px;border:1px dashed var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}',
      '.pmg-add:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}',
      '.pmg-input{height:24px;border:1px solid var(--dsw-alias-brand-primary);border-radius:999px;padding:0 10px;font:inherit;font-size:12px;outline:none;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}',
      '.pmg-row{display:flex;align-items:center;gap:10px;padding:9px 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1)}',
      '.pmg-dot{width:8px;height:8px;border-radius:50%;flex:none;align-self:flex-start;margin-top:6px}',
      '.pmg-dot[data-p="active"]{background:var(--dsw-alias-state-success-primary)}',
      '.pmg-dot[data-p="failed"],.pmg-dot[data-p="pending"],.pmg-dot[data-p="loading"],.pmg-dot[data-p="unloading"]{background:var(--dsw-alias-state-warn-primary)}',
      '.pmg-dot[data-p="null"]{background:var(--dsw-alias-border-l2)}',
      '.pmg-body{flex:1;min-width:0}',
      '.pmg-name{display:flex;align-items:center;gap:6px;min-width:0;font-weight:500}',
      '.pmg-name .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.pmg-desc{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;margin-top:1px;cursor:text}',
      '.pmg-desc:hover{color:var(--dsw-alias-label-primary)}',
      '.pmg-desc textarea{width:100%;box-sizing:border-box;border:1px solid var(--dsw-alias-brand-primary);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;padding:4px 8px;outline:none;resize:vertical}',
      '.pmg-desc-actions{display:flex;gap:6px;margin-top:4px}',
      '.pmg-desc-actions button{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;border-radius:6px;padding:2px 8px;cursor:pointer}',
      '.pmg-desc-actions button:hover{color:var(--dsw-alias-label-primary)}',
      '.pmg-mod{color:var(--dsw-alias-label-secondary);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px}',
      '.pmg-badge{flex:none;font-size:11px;line-height:18px;padding:0 7px;border-radius:5px;border:1px solid transparent}',
      '.pmg-badge[data-s="official"]{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent)}',
      '.pmg-badge[data-s="external"]{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l2)}',
      '.pmg-badge[data-cat]{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2)}',
      '.pmg-badge[data-prot="true"]{color:var(--dsw-alias-state-warn-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 40%,transparent)}',
      '.pmg-badge[data-ov="true"]{color:var(--dsw-alias-state-warn-primary)}',
      '.pmg-badge[data-upd="true"]{color:var(--dsw-alias-state-warn-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 50%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 10%,transparent)}',
      '.pmg-updbtn{flex:none;border:1px solid var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-state-warn-primary);background:transparent;font:inherit;font-size:11px;border-radius:6px;padding:2px 8px;cursor:pointer}',
      '.pmg-updbtn:hover{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 12%,transparent)}',
      '.pmg-updbtn:disabled{opacity:.5;cursor:default}',
      '.pmg-checkbtn{flex:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;border-radius:8px;padding:4px 10px;cursor:pointer}',
      '.pmg-checkbtn:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l1)}',
      '.pmg-checkbtn:disabled{opacity:.5;cursor:default}',
      '.pmg-notice{font-size:12px;line-height:18px;border-radius:8px;padding:8px 11px}',
      '.pmg-notice[data-k="ok"]{color:var(--dsw-alias-state-success-primary);border:1px solid color-mix(in srgb,var(--dsw-alias-state-success-primary) 40%,transparent)}',
      '.pmg-notice[data-k="err"]{color:var(--dsw-alias-state-error-primary);border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 40%,transparent)}',
      '.pmg-toggle{position:relative;flex:none;width:36px;height:20px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);cursor:pointer;padding:0;transition:background .18s,border-color .18s}',
      '.pmg-toggle[data-on="true"]{background:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}',
      '.pmg-toggle::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .18s;box-shadow:0 1px 2px rgba(0,0,0,.25)}',
      '.pmg-toggle[data-on="true"]::after{transform:translateX(16px)}',
      '.pmg-toggle:disabled{opacity:.45;cursor:not-allowed}',
      '.pmg-select{height:26px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;padding:0 4px;cursor:pointer;outline:none;max-width:110px}',
      '.pmg-empty{color:var(--dsw-alias-label-secondary);font-size:12px;padding:8px 2px}',
      '.pmg-cat{font-size:11px;font-weight:600;color:var(--dsw-alias-label-secondary);letter-spacing:.03em;margin:6px 2px 0}',
      '.pmg-msg{font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.pmg-err{color:var(--dsw-alias-state-error-primary);font-size:12px}',
      '.pmg-hint{color:var(--dsw-alias-label-secondary);font-size:11px;text-align:right}',
    ].join('\n')

    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin="dsh-plugin-manager"]') === null) {
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-plugin-manager'
      tag.textContent = css
      document.head.appendChild(tag)
    }

    function api(path, body) {
      const init = body === undefined
        ? { method: 'GET' }
        : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
      return fetch(path, init).then(async (r) => {
        let data = null
        try { data = await r.json() } catch { /* non-JSON */ }
        if (!r.ok) throw new Error(data && data.error ? data.error : 'HTTP ' + r.status)
        return data
      })
    }
    const list = () => api('/plugin-manager/list')
    const setEnabled = (entryId, enabled) => api('/plugin-manager/setEnabled', { entryId, enabled })
    const setOverride = (moduleName, name, desc) => api('/plugin-manager/setOverride', { moduleName, name, desc })
    const removeOverride = (moduleName) => api('/plugin-manager/removeOverride', { moduleName })
    const createGroup = (name) => api('/plugin-manager/createGroup', { name })
    const renameGroup = (groupId, name) => api('/plugin-manager/renameGroup', { groupId, name })
    const deleteGroup = (groupId) => api('/plugin-manager/deleteGroup', { groupId })
    const assign = (moduleName, groupId) => api('/plugin-manager/assign', { moduleName, groupId })
    const checkUpdates = () => api('/plugin-manager/checkUpdates')
    const update = (name) => api('/plugin-manager/update', { name })

    function Toggle(props) {
      return h('button', {
        type: 'button',
        className: 'pmg-toggle',
        'data-on': props.on ? 'true' : 'false',
        disabled: props.disabled,
        'aria-label': props.on ? '停用' : '启用',
        title: props.title || (props.on ? '停用' : '启用'),
        onClick: props.onClick,
      })
    }

    function GroupChips(props) {
      const [adding, setAdding] = useState(false)
      const [name, setName] = useState('')
      const [editing, setEditing] = useState(null)
      const [editName, setEditName] = useState('')

      const commitAdd = () => {
        const n = name.trim()
        if (!n) { setAdding(false); return }
        props.createGroup(n).then((r) => {
          if (r.accepted) { setName(''); setAdding(false); props.refresh() }
          else setAdding(false)
        })
      }
      const commitEdit = (g) => {
        const n = editName.trim()
        if (n && n !== g.name) props.renameGroup(g.id, n).then(props.refresh)
        setEditing(null)
      }
      const remove = (g) => props.deleteGroup(g.id).then(props.refresh)

      return h('div', { className: 'pmg-chips' },
        h('button', {
          type: 'button', className: 'pmg-chip',
          'data-on': props.active === null ? 'true' : 'false',
          onClick: () => props.onFilter(null),
        }, '全部'),
        props.groups.map((g) => {
          if (editing === g.id) {
            return h('input', {
              key: g.id, className: 'pmg-input', value: editName, autoFocus: true,
              onChange: (e) => setEditName(e.currentTarget.value),
              onBlur: () => commitEdit(g),
              onKeyDown: (e) => { if (e.key === 'Enter') commitEdit(g); if (e.key === 'Escape') setEditing(null) },
            })
          }
          return h('span', {
            key: g.id, className: 'pmg-chip',
            'data-on': props.active === g.id ? 'true' : 'false',
            onClick: () => props.onFilter(g.id),
            onDoubleClick: () => { setEditing(g.id); setEditName(g.name) },
            title: '双击重命名',
          },
            g.name,
            h('span', { className: 'x', onClick: (e) => { e.stopPropagation(); remove(g) }, title: '删除组' }, '\u00d7'),
          )
        }),
        adding
          ? h('input', {
              className: 'pmg-input', value: name, autoFocus: true, placeholder: '组名',
              onChange: (e) => setName(e.currentTarget.value),
              onBlur: commitAdd,
              onKeyDown: (e) => { if (e.key === 'Enter') commitAdd(); if (e.key === 'Escape') setAdding(false) },
            })
          : h('button', { type: 'button', className: 'pmg-add', onClick: () => setAdding(true) }, '+ 新建组'),
      )
    }

    function DescEditor(props) {
      const [editing, setEditing] = useState(false)
      const [value, setValue] = useState('')

      const start = () => { setValue(props.entry.hasOverride ? props.entry.description : ''); setEditing(true) }
      const save = () => {
        const v = value.trim()
        if (v) props.setOverride(props.entry.moduleName, '', v).then(() => { setEditing(false); props.refresh() })
        else props.removeOverride(props.entry.moduleName).then(() => { setEditing(false); props.refresh() })
      }
      const restore = () => props.removeOverride(props.entry.moduleName).then(() => { setEditing(false); props.refresh() })

      if (!editing) {
        return h('div', { className: 'pmg-desc', onClick: start, title: '点击编辑说明（Ctrl+Enter 保存）' },
          props.entry.description,
          h('span', { style: { opacity: 0.6, marginLeft: 6 } }, '\u270e'),
        )
      }
      return h('div', { className: 'pmg-desc' },
        h('textarea', {
          autoFocus: true, rows: 2, value,
          onChange: (e) => setValue(e.currentTarget.value),
          onKeyDown: (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save() }
            if (e.key === 'Escape') setEditing(false)
          },
          placeholder: '留空保存 = 恢复内置说明',
        }),
        h('div', { className: 'pmg-desc-actions' },
          h('button', { type: 'button', onClick: save }, '保存 (Ctrl+Enter)'),
          h('button', { type: 'button', onClick: restore }, '恢复内置'),
          h('button', { type: 'button', onClick: () => setEditing(false) }, '取消'),
        ),
      )
    }

    function Row(props) {
      const entry = props.entry
      const [confirm, setConfirm] = useState(false)
      const [noSource, setNoSource] = useState(false)
      const [busy, setBusy] = useState(false)

      const onClickToggle = () => {
        if (!entry.toggleable) return
        if (entry.system && !confirm) { setConfirm(true); return }
        setConfirm(false)
        setBusy(true)
        props.setEnabled(entry.entryId, !entry.enabled).then(
          () => { setBusy(false); setTimeout(props.refresh, 700) },
          () => { setBusy(false); props.refresh() },
        )
      }

      const openGithub = (e) => {
        if (entry.source !== 'external' || !e.ctrlKey) return
        if (e.target && e.target.closest && e.target.closest('button, select, input, textarea, .pmg-desc')) return
        e.preventDefault()
        if (entry.repo) window.open(entry.repo, '_blank', 'noopener,noreferrer')
        else { setNoSource(true); setTimeout(() => setNoSource(false), 2200) }
      }

      const phase = entry.enabled ? String(entry.fiberPhase) : 'null'
      const toggleTitle = !entry.toggleable
        ? (entry.toggleBlockReason === 'expression' ? '由 !!js 表达式控制，请直接编辑配置文件' : '系统插件，不允许停用')
        : (entry.on ? '停用' : '启用')

      return h('div', {
        className: 'pmg-row',
        onClick: openGithub,
        title: entry.source === 'external' ? 'Ctrl + 左键打开 GitHub 仓库' : undefined,
      },
        h('span', { className: 'pmg-dot', 'data-p': phase }),
        h('div', { className: 'pmg-body' },
          h('div', { className: 'pmg-name' },
            h('span', { className: 't', title: entry.repo || 'null' }, entry.displayName),
            h('span', { className: 'pmg-badge', 'data-s': entry.source }, entry.source === 'official' ? '官方' : '外部'),
            entry.system ? h('span', { className: 'pmg-badge', 'data-prot': 'true' }, '核心') : null,
            entry.hasOverride ? h('span', { className: 'pmg-badge', 'data-ov': 'true' }, '自定') : null,
            h('span', { className: 'pmg-badge', 'data-cat': true }, CATEGORY_LABELS[entry.category] || entry.category),
            props.updateInfo && props.updateInfo.hasUpdate
              ? h('span', { className: 'pmg-badge', 'data-upd': 'true' }, '有更新 ' + (props.updateInfo.currentVersion || '?') + ' → ' + props.updateInfo.latestVersion)
              : null,
          ),
          h(DescEditor, { entry, setOverride: props.setOverride, removeOverride: props.removeOverride, refresh: props.refresh }),
          h('div', { className: 'pmg-mod' }, entry.moduleName),
        ),
        noSource ? h('span', { className: 'pmg-msg', style: { flex: 'none' } }, '未找到 GitHub 来源') : null,
        confirm ? h('span', { className: 'pmg-msg', style: { flex: 'none', color: 'var(--dsw-alias-state-warn-primary)' } }, '再点一次确认') : null,
        props.updateInfo && props.updateInfo.hasUpdate
          ? h('button', { type: 'button', className: 'pmg-updbtn', disabled: props.updating, onClick: () => props.onUpdate(entry.moduleName) }, props.updating ? '更新中…' : '更新')
          : null,
        entry.source === 'external'
          ? h('select', {
              className: 'pmg-select', value: entry.group || '', title: '移动到组',
              onChange: (e) => props.assign(entry.moduleName, e.currentTarget.value === '' ? null : e.currentTarget.value).then(props.refresh),
            },
              h('option', { value: '' }, '未分组'),
              props.groups.map((g) => h('option', { key: g.id, value: g.id }, g.name)),
            )
          : null,
        h(Toggle, { on: entry.enabled, disabled: busy || !entry.toggleable, title: toggleTitle, onClick: onClickToggle }),
      )
    }

    function SectionTitle(props) {
      return h('div', {
        className: 'pmg-sec-title',
        role: 'button',
        tabIndex: 0,
        'aria-expanded': props.collapsed ? 'false' : 'true',
        onClick: props.onToggle,
        onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); props.onToggle() } },
      },
        h('span', { className: 'pmg-chev' }, props.collapsed ? '\u25b8' : '\u25be'),
        props.title,
        h('span', { className: 'pmg-n' }, props.count),
        h('span', { className: 'bar' }),
      )
    }

    function PluginManagerTab(props) {
      const { list, setEnabled, setOverride, removeOverride, createGroup, renameGroup, deleteGroup, assign, checkUpdates, update } = props
      const [state, setState] = useState({ status: 'loading' })
      const [query, setQuery] = useState('')
      const [filter, setFilter] = useState(null)
      const [collOfficial, setCollOfficial] = useState(true)
      const [collExternal, setCollExternal] = useState(false)
      const [updates, setUpdates] = useState({})
      const [checking, setChecking] = useState(false)
      const [updating, setUpdating] = useState({})
      const [notice, setNotice] = useState(null)

      const refresh = useCallback(() => {
        list().then(
          (data) => setState({ status: 'ready', data }),
          (err) => setState({ status: 'error', msg: err && err.message ? err.message : String(err) }),
        )
      }, [list])

      useEffect(() => { refresh() }, [refresh])

      useEffect(() => {
        if (!notice) return
        const t = setTimeout(() => setNotice(null), 6000)
        return () => clearTimeout(t)
      }, [notice])

      const doCheckUpdates = () => {
        setChecking(true)
        checkUpdates().then(
          (r) => {
            const map = {}
            for (const it of (r.items || [])) map[it.name] = it
            setUpdates(map)
            setChecking(false)
            const n = (r.items || []).filter((i) => i.hasUpdate).length
            setNotice({ kind: 'ok', text: n > 0 ? n + ' 个插件有更新' : '所有插件均为最新' })
          },
          (err) => { setChecking(false); setNotice({ kind: 'err', text: '检查更新失败：' + ((err && err.message) || err) }) },
        )
      }

      const doUpdate = (name) => {
        setUpdating((u) => ({ ...u, [name]: true }))
        update(name).then(
          (r) => {
            setUpdating((u) => ({ ...u, [name]: false }))
            setNotice({ kind: r.accepted ? 'ok' : 'err', text: r.message })
            doCheckUpdates()
          },
          (err) => { setUpdating((u) => ({ ...u, [name]: false })); setNotice({ kind: 'err', text: '更新失败：' + ((err && err.message) || err) }) },
        )
      }

      if (state.status === 'loading') return h('div', { className: 'pmg-msg' }, '正在读取插件…')
      if (state.status === 'error') return h('div', { className: 'pmg-err' }, '读取插件失败：' + (state.msg || '未知错误'))

      const data = state.data || { entries: [], groups: [] }
      const q = query.trim().toLowerCase()
      const all = data.entries.filter((e) =>
        !q || e.moduleName.toLowerCase().includes(q) || e.displayName.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
      const CAT_ORDER = ['core', 'llm', 'session', 'agent', 'tool', 'skill', 'ui', 'web', 'sandbox', 'storage', 'other']
      const catRank = (e) => { const i = CAT_ORDER.indexOf(e.category); return i < 0 ? CAT_ORDER.length : i }
      const official = all.filter((e) => e.source === 'official')
        .sort((a, b) => catRank(a) - catRank(b) || a.displayName.localeCompare(b.displayName, 'zh'))
      let external = all.filter((e) => e.source === 'external')
      if (filter) external = external.filter((e) => (e.group || null) === filter)
      const groups = data.groups || []
      const externalTotal = data.entries.filter((e) => e.source === 'external').length

      const renderRow = (e) => h(Row, {
        key: e.entryId, entry: e, groups,
        setEnabled, setOverride, removeOverride, assign, refresh,
        updateInfo: updates[e.moduleName],
        updating: !!updating[e.moduleName],
        onUpdate: doUpdate,
      })
      const renderRows = (rows) => rows.length === 0
        ? h('div', { className: 'pmg-empty' }, '暂无插件')
        : rows.map(renderRow)
      const renderOfficial = () => {
        const grouped = new Map()
        for (const e of official) {
          const cat = e.category || 'other'
          if (!grouped.has(cat)) grouped.set(cat, [])
          grouped.get(cat).push(e)
        }
        return [...grouped.entries()].map(([cat, rows]) => h(Fragment, { key: 'g-' + cat },
          h('div', { className: 'pmg-cat' }, CATEGORY_LABELS[cat] || cat),
          renderRows(rows),
        ))
      }

      return h('div', { className: 'pmg' },
        h('div', { className: 'pmg-head' },
          h('div', { className: 'pmg-search' },
            h('input', { type: 'search', placeholder: '搜索插件（名称 / 说明 / 模块名）', value: query, onChange: (e) => setQuery(e.currentTarget.value) }),
          ),
          h('button', { type: 'button', className: 'pmg-checkbtn', disabled: checking, onClick: doCheckUpdates }, checking ? '检查中…' : '检查更新'),
          h('span', { className: 'pmg-count', title: data.patchFile || '' }, '官方 ' + official.length + ' · 外部 ' + externalTotal + ' · 启用 ' + data.enabledCount + '/' + data.entryCount + (data.profile ? ' · ' + data.profile : '')),
        ),
        notice ? h('div', { className: 'pmg-notice', 'data-k': notice.kind }, notice.text) : null,
        h('div', { className: 'pmg-sec' },
          h(SectionTitle, { title: '官方插件', count: official.length, collapsed: collOfficial, onToggle: () => setCollOfficial((v) => !v) }),
          collOfficial ? null : renderOfficial(),
        ),
        h('div', { className: 'pmg-sec' },
          h(SectionTitle, { title: '外部插件', count: externalTotal, collapsed: collExternal, onToggle: () => setCollExternal((v) => !v) }),
          collExternal ? null : h(Fragment, null,
            h(GroupChips, { groups, active: filter, onFilter: setFilter, createGroup, renameGroup, deleteGroup, refresh }),
            renderRows(external),
          ),
        ),
        h('div', { className: 'pmg-hint' }, '提示：点击说明文字可自定义描述；外部插件按住 Ctrl + 左键打开 GitHub 仓库；更新后需重启 profile 生效'),
      )
    }

    const inject = ['slots']
    function apply(ctx) {
      ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
        name: 'settings.plugins.tab',
        id: 'manager',
        order: 20,
        label: '插件管理',
        inject: () => ({ list, setEnabled, setOverride, removeOverride, createGroup, renameGroup, deleteGroup, assign, checkUpdates, update }),
      }, PluginManagerTab))
    }

    return { apply, inject }
  },
})
