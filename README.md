# dsh-plugin-manager

[中文](README.zh.md) | English

Manage DeepSeek Harness plugins from the Web settings page. **Zero build, zero runtime dependencies** (Node builtins + services the deployment already provides).

- **Chinese catalog** — every plugin gets a Chinese name + one-line description + category (130+ built-in module catalog). Click the description to override it; overrides live in `~/.dsh/plugin-manager/catalog.json`.
- **Toggle** — surgically edits the profile's `cordis.patch.yml`, hot-reloaded by DSH (no restart). Core rows are protected; rows driven by a `!!js` expression are left untouched.
- **Classify** — **Official** (`@deepseek-ai/*` / `cordis:*`) vs **External** (installed via `dsh plugin add`), both collapsible.
- **Custom groups** — create / rename / delete / move external plugins; persisted to `~/.dsh/plugin-manager/groups.json`.
- **Update check + one-click update** — compares against the npm registry `latest`; "Update" re-runs `pnpm add <name>@latest` (auto-rolls back on failure).
- **Plugin market** — search GitHub for plugins tagged with the `dsh-plugin` topic (ranked by stars), preview details / README, and one-click install (equivalent to `dsh plugin add github:owner/repo`, auto-joins the bundle layer).
- **Uninstall** — one-click uninstall of external plugins (removes from the bundle layer first, then `pnpm remove`, with automatic rollback on failure).
- **Health status** — failed plugins are highlighted red with their error message, plus a "show only failed" filter.
- **GitHub shortcut** — **Ctrl + click** an external plugin to open its GitHub repository; hover the name to see the URL.

## Install

```bash
dsh plugin --profile web add dsh-plugin-manager
```

Restart the web profile, then open **Settings → Plugins → Plugin manager**.

> Targets the `web` profile by default. To manage another profile, set `DSH_PLUGIN_MANAGER_PROFILE` before the Host half loads.

## How it works

- **Host half** (`lib/index.js`) — `apply(ctx)` registers same-origin HTTP routes under `/plugin-manager/*` via the `webServer` service (`list` / `setEnabled` / `setOverride` / `removeOverride` / `createGroup` / `renameGroup` / `deleteGroup` / `assign` / `checkUpdates` / `update` / `market` / `detail` / `detailRepo` / `install` / `uninstall`), reading/writing the patch layer, the bundle layer (`dsh.profile.bundles`), and state files directly.
- **Client half** (`lib/client.js`) — a hand-written `window.__ModuleLoader__.load` bundle (no bundler), registers the `settings.plugins.tab` "Plugin manager" and talks to the Host via same-origin `fetch`.
- No Typert / zod / bundler, so there is no `npm install` or build step.

## Project structure

```
lib/index.js        Host plugin (/plugin-manager/* routes + patch I/O + catalog/groups + updates)
lib/client.js       Browser bundle (ModuleLoader format, settings tab)
lib/patch.js        Pure helpers (patch editing, GitHub URL parsing) — unit-tested
cordis.patch.yml    Bundle patch layer (inserts the host entry)
```

## Notes & limitations

- Toggling a plugin live-recomposes its subtree; the running session may briefly observe the change.
- Disabling the web shell itself can make the app unavailable, so core rows are non-toggleable.
- Updates / installs / uninstalls are not hot-applied — restart the profile to load new code.
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
