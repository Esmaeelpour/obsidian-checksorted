# Contributing to CheckSorted

Thanks for your interest in improving CheckSorted! Bug reports, feature requests, and pull requests are all welcome.

## Reporting bugs and requesting features

Open an [issue](https://github.com/Esmaeelpour/obsidian-checksorted/issues) and include:

- What you did, what you expected, and what happened instead
- A small snippet of the note (the checkbox list) that reproduces it
- Your Obsidian version, platform (desktop/mobile, OS), and CheckSorted version
- Any errors from the developer console (`Ctrl+Shift+I` / `Cmd+Option+I`)

For feature requests, prefix the title with `[FR]` and describe the workflow you have in mind.

## Development setup

Requirements: [Node.js](https://nodejs.org/) (LTS) and npm.

```bash
git clone https://github.com/Esmaeelpour/obsidian-checksorted.git
cd obsidian-checksorted
npm install
```

- `npm run dev` — rebuilds `main.js` in watch mode (with inline source maps)
- `npm run build` — type-checks and builds a production `main.js`

Source lives in `src/` (`main.ts` for the plugin, `settingsTab.ts` for the settings UI) and styles in `styles.css`.

## Testing in Obsidian

Use a separate test vault rather than your everyday one.

1. Create the folder `<test-vault>/.obsidian/plugins/checksorted/`.
2. Copy (or symlink) `main.js`, `manifest.json`, and `styles.css` into it.
3. In Obsidian, enable **CheckSorted** under *Settings → Community plugins*.
4. After each rebuild, reload the plugin (toggle it off and on, or use the [Hot Reload](https://github.com/pjeby/hot-reload) plugin).

Please check your change in both **live preview** and **reading view**, and in a popout window if it touches editor or DOM behavior.

## Code guidelines

- Follow the style of the surrounding code (tabs, double quotes).
- Use `activeDocument` / an element's own `doc` instead of the global `document`, and register DOM events with `registerDomEvent` so they are cleaned up on unload and work in popout windows.
- Avoid `!important` in CSS; use more specific selectors or CSS variables.
- Keep `minAppVersion` in `manifest.json` in mind; APIs newer than it need a fallback.

## Pull requests

- Keep each PR focused on one change and describe what it does and how you tested it.
- Make sure `npm run build` passes.
- Don't bump the version or commit `main.js`; releases are cut by the maintainer.

## Releasing (maintainers)

```bash
npm version patch   # or minor / major
git push origin master --follow-tags
```

`npm version` updates `manifest.json` and `versions.json` and creates a tag without a `v` prefix (configured in `.npmrc`), which Obsidian requires. Pushing the tag triggers the GitHub Actions workflow that builds the plugin and publishes the release with `main.js`, `manifest.json`, and `styles.css`.
