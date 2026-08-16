window.__ModuleLoader__.load({
  id: 'dsh-plugin-butler',
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

    const shortName = (n) => {
      const u = n && n.startsWith('@') ? n.slice(n.indexOf('/') + 1) : (n || '')
      return u.replace(/^cordis:/, '').replace(/^cordis-plugin-/, '').replace(/^dsh-(?:host-|client-)?/, '')
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
      '.pmg-desc-line{display:inline-flex;align-items:baseline;gap:6px;max-width:100%}',
      '.pmg-desc-line .t{flex:0 1 auto;min-width:0}',
      '.pmg-desc-line .pen{flex:none;opacity:.6}',
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
      '.pmg-minbtn{flex:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;border-radius:6px;padding:2px 8px;cursor:pointer}',
      '.pmg-minbtn:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l1)}',
      '.pmg-dangerbtn{flex:none;border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 50%,transparent);color:var(--dsw-alias-state-error-primary);background:transparent;font:inherit;font-size:11px;border-radius:6px;padding:2px 8px;cursor:pointer}',
      '.pmg-dangerbtn:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent)}',
      '.pmg-installbtn{flex:none;border:1px solid var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);background:transparent;font:inherit;font-size:11px;border-radius:6px;padding:2px 8px;cursor:pointer}',
      '.pmg-installbtn:hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent)}',
      '.pmg-installbtn:disabled{opacity:.5;cursor:default}',
      '.pmg-row[data-failed="true"]{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent)}',
      '.pmg-errline{color:var(--dsw-alias-state-error-primary);font-size:11px;line-height:16px;margin-top:2px;word-break:break-all}',
      '.pmg-badge[data-fail="true"]{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 50%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent)}',
      '.pmg-market{display:flex;flex-direction:column;gap:8px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:12px}',
      '.pmg-market-bar{display:flex;gap:8px}',
      '.pmg-market-input{flex:1;height:32px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font:inherit;font-size:13px;outline:none;box-sizing:border-box}',
      '.pmg-market-input:focus-visible{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 18%,transparent)}',
      '.pmg-market-list{display:flex;flex-direction:column;gap:8px;max-height:420px;overflow:auto}',
      '.pmg-market-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:2px}',
      '.pmg-mrow{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2)}',
      '.pmg-mrow-body{flex:1;min-width:0}',
      '.pmg-mrow-name{display:flex;align-items:center;gap:6px;min-width:0;font-weight:500}',
      '.pmg-mrow-name .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.pmg-modal{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:24px}',
      '.pmg-modal-box{width:100%;max-width:720px;max-height:85vh;display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;overflow:hidden}',
      '.pmg-modal-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l2)}',
      '.pmg-modal-title{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.pmg-modal-close{border:none;background:transparent;color:var(--dsw-alias-label-secondary);font-size:18px;line-height:1;cursor:pointer;padding:0 4px}',
      '.pmg-modal-close:hover{color:var(--dsw-alias-label-primary)}',
      '.pmg-modal-meta{display:flex;flex-direction:column;gap:4px;padding:10px 16px;border-bottom:1px solid var(--dsw-alias-border-l2);font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.pmg-modal-meta a{color:var(--dsw-alias-brand-primary);text-decoration:none;word-break:break-all}',
      '.pmg-modal-readme{flex:1;overflow:auto;margin:0;padding:12px 16px;font:inherit;font-size:12px;line-height:18px;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-primary)}',
      // ---------- 界面美化覆盖 ----------
      '.pmg{gap:20px;max-width:820px}',
      '.pmg-hero{display:flex;flex-direction:column;gap:3px}',
      '.pmg-title{font-size:18px;font-weight:650;letter-spacing:-.01em;line-height:1.3}',
      '.pmg-sub{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}',
      '.pmg-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
      '.pmg-search{flex:1;min-width:220px}',
      '.pmg-search input{height:36px;border-radius:10px;transition:border-color .15s,box-shadow .15s}',
      '.pmg-search input:focus-visible{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}',
      '.pmg-btn{flex:none;height:36px;padding:0 14px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:border-color .15s,background .15s,color .15s}',
      '.pmg-btn:hover{border-color:var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}',
      '.pmg-btn:disabled{opacity:.5;cursor:default}',
      '.pmg-btn-primary{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);font-weight:600}',
      '.pmg-btn-primary:hover{border-color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 20%,transparent)}',
      '.pmg-sec-title{padding:6px 2px;font-weight:650}',
      '.pmg-chev{transition:transform .15s}',
      '.pmg-row{gap:12px;padding:11px 13px;border-radius:12px;transition:border-color .15s,box-shadow .15s}',
      '.pmg-row:hover{border-color:var(--dsw-alias-border-l1);box-shadow:0 2px 12px -8px rgba(0,0,0,.35)}',
      '.pmg-dot{width:9px;height:9px;margin-top:7px}',
      '.pmg-name{flex-wrap:wrap}',
      '.pmg-badge{line-height:17px;padding:0 7px;border-radius:6px}',
      '.pmg-mod{font-size:11px}',
      '.pmg-notice{border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
      '.pmg-checkbtn{height:32px;border-radius:8px;padding:0 12px;transition:border-color .15s,background .15s,color .15s}',
      '.pmg-minbtn{border-radius:7px;padding:3px 9px;transition:border-color .15s,color .15s}',
      '.pmg-updbtn{border-radius:7px;padding:3px 9px}',
      '.pmg-dangerbtn{border-radius:7px;padding:3px 9px}',
      '.pmg-installbtn{border-radius:7px;padding:3px 10px;font-weight:600}',
      '.pmg-select{border-radius:7px}',
      '.pmg-market{border-radius:12px;padding:14px}',
      '.pmg-market-input{height:34px;border-radius:9px}',
      '.pmg-mrow{border-radius:10px;padding:9px 11px;transition:border-color .15s}',
      '.pmg-mrow:hover{border-color:var(--dsw-alias-border-l1)}',
      '.pmg-modal{backdrop-filter:blur(4px)}',
      '.pmg-modal-box{border-radius:14px;box-shadow:0 24px 60px -20px rgba(0,0,0,.5)}',
      '.pmg-modal-head{padding:14px 18px}',
      '.pmg-modal-meta{padding:12px 18px}',
      '.pmg-modal-readme{padding:14px 18px}',
      '.pmg-hint{text-align:left;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l2);margin-top:2px}',
      '.pmg-empty{text-align:center;padding:18px 4px;color:var(--dsw-alias-label-secondary)}',
      '.pmg-depstoggle{cursor:pointer;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2)}',
      '.pmg-depstoggle:hover{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.pmg-deps{display:flex;flex-direction:column;gap:5px;margin-top:7px;padding:8px 10px;border:1px dashed var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2);font-size:12px;line-height:18px}',
      '.pmg-deps-line{display:flex;flex-wrap:wrap;gap:4px;align-items:baseline;color:var(--dsw-alias-label-secondary)}',
      '.pmg-deps-line b{color:var(--dsw-alias-label-primary);font-weight:600;margin-right:2px}',
      '.pmg-dep-tag{display:inline-flex;align-items:center;gap:4px;padding:1px 8px;border-radius:999px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:17px}',
      '.pmg-dep-tag .src{opacity:.65}',
      '.pmg-modal-readme{white-space:normal;font-size:13px;line-height:1.6;padding:14px 18px}',
      '.pmg-modal-readme h1,.pmg-modal-readme h2{font-size:19px;font-weight:650;margin:18px 0 10px;line-height:1.3;padding-bottom:6px;border-bottom:1px solid var(--dsw-alias-border-l2)}',
      '.pmg-modal-readme h3{font-size:15px;font-weight:600;margin:16px 0 6px}',
      '.pmg-modal-readme h4,.pmg-modal-readme h5,.pmg-modal-readme h6{font-size:13px;font-weight:600;margin:12px 0 4px}',
      '.pmg-modal-readme p{margin:0 0 10px}',
      '.pmg-modal-readme a{color:var(--dsw-alias-brand-primary);text-decoration:none}',
      '.pmg-modal-readme a:hover{text-decoration:underline}',
      '.pmg-modal-readme .pmg-code{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:10px 12px;overflow:auto;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:1.5;margin:0 0 10px}',
      '.pmg-modal-readme .pmg-inline-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:4px;padding:1px 5px}',
      '.pmg-modal-readme blockquote{margin:0 0 10px;padding:6px 12px;border-left:3px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary)}',
      '.pmg-modal-readme ul,.pmg-modal-readme ol{margin:0 0 10px;padding-left:22px}',
      '.pmg-modal-readme li{margin:2px 0}',
      '.pmg-modal-readme img{max-width:100%;border-radius:6px}',
      '.pmg-modal-readme hr{border:none;border-top:1px solid var(--dsw-alias-border-l2);margin:14px 0}',
    ].join('\n')

    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin="dsh-plugin-butler"]') === null) {
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-plugin-butler'
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
    const market = (q, page) => api('/plugin-manager/market?q=' + encodeURIComponent(q || '') + '&page=' + (page || 1))
    const detail = (name) => api('/plugin-manager/detail?name=' + encodeURIComponent(name))
    const detailRepo = (fullName) => api('/plugin-manager/detailRepo?fullName=' + encodeURIComponent(fullName))
    const install = (name) => api('/plugin-manager/install', { name })
    const uninstall = (name) => api('/plugin-manager/uninstall', { name })

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
          h('div', { className: 'pmg-desc-line' },
            h('span', { className: 't' }, props.entry.description),
            h('span', { className: 'pen' }, '\u270e'),
          ),
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
      const [confirmUninstall, setConfirmUninstall] = useState(false)
      const [noSource, setNoSource] = useState(false)
      const [busy, setBusy] = useState(false)
      const [showDeps, setShowDeps] = useState(false)

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

      const onClickUninstall = () => {
        if (!confirmUninstall) { setConfirmUninstall(true); setTimeout(() => setConfirmUninstall(false), 3000); return }
        setConfirmUninstall(false)
        props.onUninstall(entry.moduleName)
      }

      const openGithub = (e) => {
        if (entry.source !== 'external' || !e.ctrlKey) return
        if (e.target && e.target.closest && e.target.closest('button, select, input, textarea, .pmg-desc')) return
        e.preventDefault()
        if (entry.repo) window.open(entry.repo, '_blank', 'noopener,noreferrer')
        else { setNoSource(true); setTimeout(() => setNoSource(false), 2200) }
      }

      const failed = entry.enabled && entry.fiberPhase === 'failed'
      const phase = entry.enabled ? String(entry.fiberPhase) : 'null'
      const toggleTitle = !entry.toggleable
        ? (entry.toggleBlockReason === 'expression' ? '由 !!js 表达式控制，请直接编辑配置文件' : '系统插件，不允许停用')
        : (entry.on ? '停用' : '启用')

      return h('div', {
        className: 'pmg-row',
        'data-failed': failed ? 'true' : 'false',
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
            failed ? h('span', { className: 'pmg-badge', 'data-fail': 'true' }, '失败') : null,
            h('span', { className: 'pmg-badge', 'data-cat': true }, CATEGORY_LABELS[entry.category] || entry.category),
            h('span', {
              className: 'pmg-badge pmg-depstoggle',
              onClick: (e) => { e.stopPropagation(); setShowDeps((v) => !v) },
              title: showDeps ? '收起依赖关系' : '显示依赖关系（inject / 被依赖）',
            }, showDeps ? '收起' : '依赖'),
            props.updateInfo && props.updateInfo.hasUpdate
              ? h('span', { className: 'pmg-badge', 'data-upd': 'true' }, '有更新 ' + (props.updateInfo.currentVersion || '?') + ' → ' + props.updateInfo.latestVersion)
              : null,
          ),
          h(DescEditor, { entry, setOverride: props.setOverride, removeOverride: props.removeOverride, refresh: props.refresh }),
          h('div', { className: 'pmg-mod' }, entry.moduleName),
          failed && entry.error ? h('div', { className: 'pmg-errline' }, entry.error) : null,
          showDeps ? h('div', { className: 'pmg-deps' },
            h('div', { className: 'pmg-deps-line' },
              h('b', null, '注入服务'),
              entry.injects && entry.injects.length
                ? entry.injects.map((s) => {
                    const prov = props.providers && props.providers[s]
                    return h('span', { key: s, className: 'pmg-dep-tag' }, s, prov ? h('span', { className: 'src' }, '\u2190 ' + shortName(prov)) : null)
                  })
                : h('span', { className: 'pmg-dep-tag' }, '无'),
            ),
            h('div', { className: 'pmg-deps-line' },
              h('b', null, '被依赖'),
              entry.dependents && entry.dependents.length
                ? entry.dependents.map((n) => h('span', { key: n, className: 'pmg-dep-tag' }, shortName(n)))
                : h('span', { className: 'pmg-dep-tag' }, '无'),
            ),
          ) : null,
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
        entry.source === 'external'
          ? h('button', { type: 'button', className: 'pmg-minbtn', onClick: () => props.onDetail(entry.moduleName) }, '详情')
          : null,
        entry.source === 'external'
          ? h('button', {
              type: 'button', className: 'pmg-dangerbtn', disabled: !!props.uninstalling,
              onClick: onClickUninstall,
            }, confirmUninstall ? '确认卸载' : (props.uninstalling ? '卸载中…' : '卸载'))
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

    function MarketPanel(props) {
      const [q, setQ] = useState('')
      const doSearch = (override) => {
        const query = override === undefined ? q : override
        props.onSearch(query)
      }
      return h('div', { className: 'pmg-market' },
        h('div', { className: 'pmg-market-bar' },
          h('input', {
            className: 'pmg-market-input', placeholder: '搜索 dsh-plugin 插件（GitHub 板块）', value: q,
            onChange: (e) => setQ(e.currentTarget.value),
            onKeyDown: (e) => { if (e.key === 'Enter') doSearch() },
          }),
          h('button', { type: 'button', className: 'pmg-checkbtn', disabled: props.loading, onClick: () => doSearch() }, props.loading ? '搜索中…' : '搜索'),
        ),
        props.error ? h('div', { className: 'pmg-err' }, '搜索失败：' + props.error) : null,
        h('div', { className: 'pmg-market-list' },
          (props.items || []).map((it) => h('div', {
            key: it.fullName, className: 'pmg-mrow', title: 'Ctrl + 左键打开 GitHub 仓库',
            onClick: (e) => {
              if (!e.ctrlKey && !e.metaKey) return
              if (e.target && e.target.closest && e.target.closest('button, a, input, textarea, select')) return
              e.preventDefault()
              if (it.url) window.open(it.url, '_blank', 'noopener,noreferrer')
            },
          },
            h('div', { className: 'pmg-mrow-body' },
              h('div', { className: 'pmg-mrow-name' },
                h('span', { className: 't', title: it.fullName }, it.name),
                it.owner ? h('span', { className: 'pmg-badge', 'data-cat': true }, it.owner) : null,
                it.stars != null ? h('span', { className: 'pmg-badge', 'data-cat': true }, '\u2605 ' + it.stars) : null,
                it.installed ? h('span', { className: 'pmg-badge', 'data-s': 'external' }, '已安装') : null,
              ),
              it.description ? h('div', { className: 'pmg-desc' }, it.description) : null,
            ),
            h('button', { type: 'button', className: 'pmg-minbtn', onClick: () => props.onDetailRepo(it.fullName) }, '详情'),
            it.installed
              ? h('span', { className: 'pmg-msg', style: { flex: 'none' } }, '已装')
              : h('button', { type: 'button', className: 'pmg-installbtn', disabled: !!props.installing['github:' + it.fullName], onClick: () => props.onInstall('github:' + it.fullName) }, props.installing['github:' + it.fullName] ? '安装中…' : '安装'),
          )),
          (props.items && props.items.length === 0 && !props.loading && !props.error) ? h('div', { className: 'pmg-empty' }, '无结果，换个关键词试试') : null,
        ),
        h('div', { className: 'pmg-market-foot' },
          props.total ? h('span', { className: 'pmg-sub' }, '共 ' + props.total + ' 个结果') : null,
          props.hasMore
            ? h('button', { type: 'button', className: 'pmg-btn', disabled: props.loading, onClick: props.onLoadMore }, props.loading ? '加载中…' : '加载更多')
            : null,
        ),
      )
    }

    function renderInline(text) {
      const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(!?\[[^\]]*\]\([^)]+\))/g
      const nodes = []
      let last = 0
      let m
      while ((m = re.exec(text)) !== null) {
        if (m.index > last) nodes.push(text.slice(last, m.index))
        const full = m[0]
        if (m[1] !== undefined) {
          nodes.push(h('code', { key: nodes.length, className: 'pmg-inline-code' }, m[1].slice(1, -1)))
        } else if (m[2] !== undefined) {
          nodes.push(h('strong', { key: nodes.length }, m[2].slice(2, -2)))
        } else if (m[3] !== undefined) {
          nodes.push(h('em', { key: nodes.length }, m[3].slice(1, -1)))
        } else if (m[4] !== undefined) {
          const lm = /^!?\[([^\]]*)\]\(([^)]+)\)$/.exec(m[4])
          if (!lm) { nodes.push(full); continue }
          if (m[4][0] === '!') nodes.push(h('img', { key: nodes.length, src: lm[2], alt: lm[1], className: 'pmg-md-img' }))
          else nodes.push(h('a', { key: nodes.length, href: lm[2], target: '_blank', rel: 'noopener noreferrer' }, lm[1]))
        }
        last = m.index + full.length
      }
      if (last < text.length) nodes.push(text.slice(last))
      return nodes
    }

    function renderMarkdown(md) {
      const lines = String(md || '').split(/\r?\n/)
      const blocks = []
      let i = 0
      const isBlockStart = (l) => /^\s*```/.test(l) || /^(#{1,6})\s+/.test(l) || /^\s*([-*_])\s*(\1\s*){2,}$/.test(l) || /^\s*>\s?/.test(l) || /^\s*[-*+]\s+/.test(l) || /^\s*\d+\.\s+/.test(l)
      while (i < lines.length) {
        const line = lines[i]
        if (/^\s*```/.test(line)) {
          const buf = []
          i++
          while (i < lines.length && !/^\s*```/.test(lines[i])) { buf.push(lines[i]); i++ }
          i++
          blocks.push(h('pre', { key: blocks.length, className: 'pmg-code' }, h('code', null, buf.join('\n'))))
          continue
        }
        const hm = /^(#{1,6})\s+(.*)$/.exec(line)
        if (hm) {
          blocks.push(h('h' + hm[1].length, { key: blocks.length }, ...renderInline(hm[2])))
          i++
          continue
        }
        if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) {
          blocks.push(h('hr', { key: blocks.length }))
          i++
          continue
        }
        if (/^\s*>\s?/.test(line)) {
          const buf = []
          while (i < lines.length && /^\s*>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++ }
          blocks.push(h('blockquote', { key: blocks.length }, buf.map((l, idx) => h('p', { key: idx }, ...renderInline(l)))))
          continue
        }
        const ulm = /^\s*[-*+]\s+(.*)$/.exec(line)
        const olm = /^\s*\d+\.\s+(.*)$/.exec(line)
        if (ulm || olm) {
          const ordered = !!olm
          const items = []
          while (i < lines.length) {
            const mm = ordered ? /^\s*\d+\.\s+(.*)$/.exec(lines[i]) : /^\s*[-*+]\s+(.*)$/.exec(lines[i])
            if (!mm) break
            items.push(h('li', { key: items.length }, ...renderInline(mm[1])))
            i++
          }
          blocks.push(h(ordered ? 'ol' : 'ul', { key: blocks.length }, ...items))
          continue
        }
        if (/^\s*$/.test(line)) { i++; continue }
        const buf = []
        while (i < lines.length && !/^\s*$/.test(lines[i]) && !isBlockStart(lines[i])) { buf.push(lines[i]); i++ }
        const inlines = []
        for (const l of buf) inlines.push(...renderInline(l))
        blocks.push(h('p', { key: blocks.length }, ...inlines))
      }
      return blocks
    }

    function DetailModal(props) {
      const d = props.detail
      if (!d) return null
      const body = d.loading
        ? h('div', { className: 'pmg-modal-readme' }, '加载中…')
        : d.error
          ? h('div', { className: 'pmg-modal-readme', style: { color: 'var(--dsw-alias-state-error-primary)' } }, '获取失败：' + d.error)
          : h(Fragment, null,
              h('div', { className: 'pmg-modal-meta' },
                d.data.description ? h('div', {}, d.data.description) : null,
                d.data.latest ? h('div', {}, '版本 ' + d.data.latest + (d.data.installedVersion ? '（已装 ' + d.data.installedVersion + '）' : '')) : null,
                d.data.stars != null ? h('div', {}, '\u2605 ' + d.data.stars + (d.data.pushed ? ' · 更新于 ' + String(d.data.pushed).slice(0, 10) : '')) : null,
                d.data.author ? h('div', {}, '作者：' + d.data.author) : null,
                d.data.license ? h('div', {}, '许可：' + d.data.license) : null,
                d.data.repository ? h('a', { href: d.data.repository, target: '_blank', rel: 'noopener noreferrer' }, d.data.repository) : null,
                d.data.homepage ? h('a', { href: d.data.homepage, target: '_blank', rel: 'noopener noreferrer' }, d.data.homepage) : null,
              ),
              h('div', { className: 'pmg-modal-readme' }, d.data.readme ? renderMarkdown(d.data.readme) : '（无 README）'),
            )
      return h('div', { className: 'pmg-modal', onClick: (e) => { if (e.target === e.currentTarget) props.onClose() } },
        h('div', { className: 'pmg-modal-box' },
          h('div', { className: 'pmg-modal-head' },
            h('div', { className: 'pmg-modal-title' }, d.data ? d.data.name : '详情'),
            h('button', { type: 'button', className: 'pmg-modal-close', onClick: props.onClose, 'aria-label': '关闭' }, '\u00d7'),
          ),
          body,
        ),
      )
    }

    function PluginManagerTab(props) {
      const { list, setEnabled, setOverride, removeOverride, createGroup, renameGroup, deleteGroup, assign, checkUpdates, update, market, detail, detailRepo, install, uninstall } = props
      const [state, setState] = useState({ status: 'loading' })
      const [query, setQuery] = useState('')
      const [filter, setFilter] = useState(null)
      const [collOfficial, setCollOfficial] = useState(true)
      const [collExternal, setCollExternal] = useState(false)
      const [updates, setUpdates] = useState({})
      const [checking, setChecking] = useState(false)
      const [updating, setUpdating] = useState({})
      const [notice, setNotice] = useState(null)
      const [showMarket, setShowMarket] = useState(false)
      const [marketQuery, setMarketQuery] = useState('')
      const [marketState, setMarketState] = useState({ items: [], loading: false, error: null, page: 1, hasMore: false, total: 0 })
      const [installing, setInstalling] = useState({})
      const [uninstalling, setUninstalling] = useState({})
      const [detailState, setDetailState] = useState(null)
      const [onlyFailed, setOnlyFailed] = useState(false)

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

      const doMarketSearch = (q, page) => {
        const pg = page || 1
        setMarketQuery(q || '')
        setMarketState((s) => ({ ...s, loading: true, error: null }))
        market(q, pg).then(
          (r) => setMarketState((s) => ({
            items: pg === 1 ? (r.items || []) : s.items.concat(r.items || []),
            loading: false,
            error: r.ok ? null : (r.message || '搜索失败'),
            page: r.page || pg,
            hasMore: !!r.hasMore,
            total: r.total || 0,
          })),
          (err) => setMarketState((s) => ({ ...s, items: pg === 1 ? [] : s.items, loading: false, error: (err && err.message) || String(err) })),
        )
      }
      const doMarketMore = () => doMarketSearch(marketQuery, (marketState.page || 1) + 1)
      const openDetail = (name) => {
        setDetailState({ loading: true })
        detail(name).then(
          (r) => setDetailState(r.ok ? { data: r } : { error: r.message || '获取失败' }),
          (err) => setDetailState({ error: (err && err.message) || String(err) }),
        )
      }
      const openDetailRepo = (fullName) => {
        setDetailState({ loading: true })
        detailRepo(fullName).then(
          (r) => setDetailState(r.ok ? { data: r } : { error: r.message || '获取失败' }),
          (err) => setDetailState({ error: (err && err.message) || String(err) }),
        )
      }
      const closeDetail = () => setDetailState(null)
      const doInstall = (name) => {
        setInstalling((m) => ({ ...m, [name]: true }))
        install(name).then(
          (r) => { setInstalling((m) => ({ ...m, [name]: false })); setNotice({ kind: r.accepted ? 'ok' : 'err', text: r.message }); if (r.accepted) refresh() },
          (err) => { setInstalling((m) => ({ ...m, [name]: false })); setNotice({ kind: 'err', text: '安装失败：' + ((err && err.message) || err) }) },
        )
      }
      const doUninstall = (name) => {
        setUninstalling((m) => ({ ...m, [name]: true }))
        uninstall(name).then(
          (r) => { setUninstalling((m) => ({ ...m, [name]: false })); setNotice({ kind: r.accepted ? 'ok' : 'err', text: r.message }); refresh() },
          (err) => { setUninstalling((m) => ({ ...m, [name]: false })); setNotice({ kind: 'err', text: '卸载失败：' + ((err && err.message) || err) }) },
        )
      }

      if (state.status === 'loading') return h('div', { className: 'pmg-msg' }, '正在读取插件…')
      if (state.status === 'error') return h('div', { className: 'pmg-err' }, '读取插件失败：' + (state.msg || '未知错误'))

      const data = state.data || { entries: [], groups: [] }
      const q = query.trim().toLowerCase()
      let all = data.entries.filter((e) =>
        !q || e.moduleName.toLowerCase().includes(q) || e.displayName.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
      if (onlyFailed) all = all.filter((e) => e.fiberPhase === 'failed')
      const failedCount = data.entries.filter((e) => e.enabled && e.fiberPhase === 'failed').length
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
        providers: data.providers || {},
        updateInfo: updates[e.moduleName],
        updating: !!updating[e.moduleName],
        onUpdate: doUpdate,
        onDetail: openDetail,
        onUninstall: doUninstall,
        uninstalling: !!uninstalling[e.moduleName],
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
        h('div', { className: 'pmg-hero' },
          h('div', { className: 'pmg-title' }, '插件管理'),
          h('div', { className: 'pmg-sub', title: data.patchFile || '' }, '官方 ' + official.length + ' · 外部 ' + externalTotal + ' · 启用 ' + data.enabledCount + '/' + data.entryCount + (data.profile ? ' · profile ' + data.profile : '')),
        ),
        h('div', { className: 'pmg-toolbar' },
          h('div', { className: 'pmg-search' },
            h('input', { type: 'search', placeholder: '搜索插件（名称 / 说明 / 模块名）', value: query, onChange: (e) => setQuery(e.currentTarget.value) }),
          ),
          h('button', { type: 'button', className: 'pmg-btn', disabled: checking, onClick: doCheckUpdates }, checking ? '检查中…' : '检查更新'),
          h('button', { type: 'button', className: showMarket ? 'pmg-btn' : 'pmg-btn pmg-btn-primary', onClick: () => setShowMarket((v) => !v) }, showMarket ? '关闭市场' : '市场'),
        ),
        notice ? h('div', { className: 'pmg-notice', 'data-k': notice.kind }, notice.text) : null,
        failedCount > 0
          ? h('div', { className: 'pmg-notice', 'data-k': 'err' },
              '⚠ ' + failedCount + ' 个插件加载失败',
              h('button', { type: 'button', className: 'pmg-minbtn', style: { marginLeft: 8 }, onClick: () => setOnlyFailed((v) => !v) }, onlyFailed ? '显示全部' : '只看失败'),
            )
          : null,
        showMarket
          ? h(MarketPanel, { items: marketState.items, loading: marketState.loading, error: marketState.error, total: marketState.total, hasMore: marketState.hasMore, installing, onSearch: doMarketSearch, onLoadMore: doMarketMore, onDetailRepo: openDetailRepo, onInstall: doInstall })
          : null,
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
        h('div', { className: 'pmg-hint' }, '提示：点击说明文字可自定义描述；外部插件 Ctrl + 左键打开 GitHub 仓库；「市场」搜索并安装新插件；安装 / 卸载 / 更新后需重启 profile 生效'),
        h(DetailModal, { detail: detailState, onClose: closeDetail }),
      )
    }

    const inject = ['slots']
    function apply(ctx) {
      ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
        name: 'settings.plugins.tab',
        id: 'manager',
        order: 20,
        label: '插件管理',
        inject: () => ({ list, setEnabled, setOverride, removeOverride, createGroup, renameGroup, deleteGroup, assign, checkUpdates, update, market, detail, detailRepo, install, uninstall }),
      }, PluginManagerTab))
    }

    return { apply, inject }
  },
})
