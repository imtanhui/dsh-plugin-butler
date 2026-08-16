# dsh-plugin-butler

[中文](README.zh.md) | English

**dsh-plugin-butler** is a graphical plugin manager for [DeepSeek Harness](https://github.com/deepseek-ai) (DSH). It lives in the Web settings page and lets you manage every plugin in a profile — organize, toggle, group, update, install, uninstall — without touching the terminal.

**Zero build, zero runtime dependencies** — it uses only Node builtins plus services the deployment already provides.

---

## Features

### 1. Chinese catalog (`catalog.json`)
Every plugin shows a **Chinese display name** + a **one-line description** + a **category**, backed by a built-in catalog of 130+ official modules. External plugins and modules missing from the catalog fall back to their short name.

- **Click a description** to edit it in place (saved / Ctrl+Enter / Esc).
- Custom edits are stored in `~/.dsh/plugin-manager/catalog.json` and shown as a `自定` (custom) badge.

### 2. One-click toggle (hot-reloaded)
Each row has a switch that **surgically edits** the profile's `cordis.patch.yml` by adding/removing a `disabled: true` block — then lets DSH's HMR observer hot-apply it, so there is **no restart**.

Safety guards:
- **Core rows are protected** — services required for the app, the transport layer, or the manager itself cannot be disabled from the UI.
- Rows controlled by a `!!js` expression are left untouched (you must edit the config file yourself).
- Any other patch entries you added by hand are preserved verbatim.

### 3. Official vs. external (collapsible)
Plugins are split into two sections, both collapsible:
- **Official** — `@deepseek-ai/*` and `cordis:*` modules, further grouped by category.
- **External** — everything installed via `dsh plugin add`, shown with author/repo info where available.

### 4. Custom groups (`groups.json`)
Organize external plugins into named groups (**create / rename / delete / move**). Assignments persist to `~/.dsh/plugin-manager/groups.json` and filter the external list with one click.

### 5. Update check + one-click update
- **Check updates** compares each installed npm dependency against the registry `latest` and badges rows with `current → latest`.
- **Update** re-runs `pnpm add <name>@latest` and, on failure, **automatically rolls back** to the previously installed version.
- Link/file/git sources are marked as not auto-updatable.

### 6. Plugin market (search + install)
Search GitHub for plugins tagged **`dsh-plugin`**, ranked by stars, with pagination ("load more").

- Preview **details / README** in a modal.
- **One-click install** (`dsh plugin add github:owner/repo` equivalent) — auto-joins the bundle layer when the package declares `dsh.bundle`.
- **Ctrl + click** any market row to open its repository in a new tab.

### 7. Uninstall
Uninstall any external plugin with **two-click confirmation**. It first removes the package from `dsh.profile.bundles`, then runs `pnpm remove`, and **rolls back the bundle layer** if uninstall fails.

### 8. Dependency view
Every row has a **`依赖` (deps)** badge that expands to show:
- **Inject** — the services it declares, each with its provider (`service ← provider`).
- **Dependents** — the plugins that depend on the services it provides (i.e. what would break if you disable it).

### 9. Dependency graph
A full-screen **left-to-right mind-map**: core plugins (most depended-on) sit in the leftmost column, and dependents fan out to the right by dependency depth.

- **Pan** (drag the canvas), **zoom** (wheel or +/-), **fit** to view.
- **Drag nodes** — edges follow.
- **Hover a node** to highlight its dependency chain (blue) while everything else fades, and see a detail tooltip.
- Light pill nodes with a **blue dot (official)** or **black dot (external)**.
- A subtle dot-grid canvas.

### 10. Health status
Plugins that failed to load are **highlighted red** with their error message, plus a `⚠ N 个插件加载失败` banner and a **"show only failed"** filter.

### 11. Detail modal (Markdown)
The detail modal renders the plugin's **README as formatted Markdown** — headings, code blocks, inline code, bold/italic, links, images, lists, quotes, and horizontal rules.

---

## Install

```bash
dsh plugin --profile web add dsh-plugin-butler
```

Then **restart the web profile** and open **Settings → Plugins → 插件管理 (Plugin manager)**.

> Targets the `web` profile by default. To manage another profile, set `DSH_PLUGIN_MANAGER_PROFILE` before the Host half loads.

---

## How it works

- **Host half** (`lib/index.js`) — `apply(ctx)` registers same-origin HTTP routes under `/plugin-manager/*` via the `webServer` service:
  `list · setEnabled · setOverride · removeOverride · createGroup · renameGroup · deleteGroup · assign · checkUpdates · update · market · detail · detailRepo · install · uninstall`.
  It reads/writes the patch layer, the bundle layer (`dsh.profile.bundles`), and state files (`catalog.json`, `groups.json`) directly, and resolves dependency edges from the live Cordis `fiber._store`.
- **Client half** (`lib/client.js`) — a hand-written `window.__ModuleLoader__.load` bundle (no bundler) that registers the `settings.plugins.tab` "插件管理" and talks to the Host via same-origin `fetch`.
- No Typert / zod / bundler — there is **no `npm install` and no build step**.

## Project structure

```
lib/index.js        Host plugin (/plugin-manager/* routes + patch I/O + catalog/groups + updates)
lib/client.js       Browser bundle (ModuleLoader format, settings tab + dependency graph)
lib/patch.js        Pure helpers (patch editing, GitHub URL parsing) — unit-tested
cordis.patch.yml    Bundle patch layer (inserts the host entry)
test/patch.test.js  node:test unit tests
```

## Requirements

- **Node.js ≥ 18** (uses `fetch` and `AbortSignal.timeout`).
- A `web` profile with the `webServer` service available (standard in DSH web deployments).

## Notes & limitations

- Toggling a plugin live-recomposes its subtree; the running session may briefly observe the change.
- Disabling the web shell itself can make the app unavailable, so core rows are non-toggleable.
- Updates / installs / uninstalls are **not** hot-applied — restart the profile to load new code.
- Market search and detail go through the GitHub API, so `api.github.com` must be reachable (a network error is shown otherwise).
- The manager edits only the profile's *user patch layer* and *bundle layer*, and preserves any other patch entries you added by hand.
- The HTTP routes are same-origin guarded (no auth); bind the app to a non-loopback host only if you accept that risk.

## Develop

```bash
npm run check   # node --check on all bundles
npm test        # node:test unit tests for lib/patch.js
```

## License

MIT
