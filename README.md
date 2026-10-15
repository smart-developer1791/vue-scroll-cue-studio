<div align="center">

# 📖 Scroll Cue Studio

**Give every section a clear way in.**

![Vue](https://img.shields.io/badge/Vue-3-42b883?style=for-the-badge&logo=vuedotjs&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=ffffff)
![License](https://img.shields.io/badge/License-MIT-777777?style=for-the-badge)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

_Vue reading-page editor with post-flush DOM observation, keyed template refs, active chapters, viewport reading progress, and HTML/JSON exports._

</div>

---

## ✨ Highlights

- **A short page with a clear path:** Edit 2–12 chapters, page details, and plain-text paragraphs.
- **Real reading cues:** Scroll the actual preview and watch the active chapter and geometric progress update.
- **Vue and the patched DOM:** A post-flush effect connects native scroll/resize observation to the current keyed section refs.
- **An accessible jump:** Chapter buttons scroll the reader and focus the target section without scrolling the document.
- **Try the rhythm:** Choose comfortable or compact reading density, reorder chapters, and save text explicitly.
- **A portable page:** Export escaped standalone HTML with native chapter links, or the complete JSON workspace.

## 🧱 Project Structure

```text
public/
├── favicon.svg                         # Original project emblem
├── og.svg                              # Original social artwork
├── font-licenses.txt                   # Font copyright and OFL licenses
└── sample-workspace.json               # Complete importable workspace
src/
├── components/
│   ├── ReadingPreview.vue              # Post-flush scroll/resize observation
│   ├── DataTools.vue                   # Workspace actions and confirmation
│   ├── AppDialog.vue                   # Native Teleport modal and focus lifecycle
│   ├── AppIcon.vue                     # Original inline SVG icons
│   ├── DataExchange.vue                # Validated workspace import dialog
│   └── StudioHeader.vue                # Workspace branding and actions
├── domain/
│   ├── sections.ts                    # Pure validation, calculations, and exports
│   ├── shared.ts                       # Identity and text guards; portable HTML where used
│   └── validation.ts                   # Strict unknown-input guards
├── services/
│   ├── draft.ts                        # Validated device-local persistence
│   └── files.ts                        # Downloads and deterministic identities
├── App.vue                             # Workspace and editor state
├── base.css                            # Tailwind, local fonts, and control defaults
├── style.css                           # Project theme tokens
└── main.ts                             # Vue application entry
tests/
├── *.test.ts                           # Native domain/composable/export tests
└── e2e/                                # Production browser workflows
```

Root files include Vite, TypeScript, Playwright, and Prettier configuration, an npm lockfile, the MIT license, and explicit `vercel.json`. The official scaffold’s default artwork and empty `src/assets` directory are removed. The shared generic development container stays unchanged.

## 🛠 Tech Stack

| Tool                          | Role                                                                        |
| ----------------------------- | --------------------------------------------------------------------------- |
| Vue 3.5                       | Typed SFCs, component contracts, reactive state, and lifecycle management   |
| TypeScript 6                  | Checked domain structures and component/composable inputs                   |
| Vite 8                        | Development server and static production bundles                            |
| Tailwind CSS 4                | Vite plugin, theme tokens, template utilities, and responsive/state styling |
| DM Sans + Bricolage Grotesque | Locally bundled Latin variable fonts                                        |
| Node.js 24+                   | Local CLI tools and native TypeScript tests                                 |
| Playwright                    | Chromium workflows against the production build                             |

The app requires no account, backend, remote data source, or extra UI library. All dependencies and CLI tools are installed locally inside this independent project.

## 🎨 Tailwind Styling

The Vite config enables `@tailwindcss/vite`. `base.css` imports Tailwind, defines font tokens, and uses `@apply` for small native control defaults. `style.css` defines project colors through `@theme`. Actual application templates use Tailwind utilities for grid/flex layouts, spacing, typography, borders, colors, responsive behavior, focus, and visible states.

`data-ui`, `data-project`, and domain identity attributes are explicit browser hooks. There are no orphan semantic styling classes. Reserved preview/list containers and internal overflow keep neighboring panels stable when modes, selected details, or results change. Self-contained exported HTML carries its own styles where needed; all application layout and visible-state classes use Tailwind utilities. Reduced-motion preferences shorten transitions.

Two Fontsource variable font files are bundled as hashed local assets. Their copyright and OFL text are in [font-licenses.txt](./public/font-licenses.txt). Favicon/social artwork and SVG interface icons are original project assets.

## 📦 Included Demo Data

The fictional **A small guide to a shared garden** sample contains five original three-paragraph chapters, from a first conversation to sharing what grows. Comfortable reading density is selected initially.

The complete [sample-workspace.json](./public/sample-workspace.json) includes valid provenance and is served as a public static file. The same canonical sample is defined in the domain module for first use and confirmed restoration.

## 🚀 Local Development

Use Node.js **24 or later**:

```bash
npm ci
npm run dev
```

Vite prints the local URL and binds to `0.0.0.0` for the shared container. Inspect a production bundle with:

```bash
npm run build
npm run preview
```

## 🧩 Vue Implementation

[`ReadingPreview.vue` uses `useTemplateRef` inside `v-for`](https://vuejs.org/guide/essentials/template-refs.html#refs-inside-v-for) to access the actual section elements. Vue does not promise that this ref array follows source order. The component therefore builds an identity map and calculates positions in workspace order instead of pairing array indexes.

[`watchPostEffect` runs after Vue patches the component DOM](https://vuejs.org/guide/essentials/watchers.html#post-watchers). It reads section identities/content and reading density, then connects one passive scroll listener and one native `ResizeObserver` to the current reader/sections. A requestAnimationFrame callback coalesces measurements. Effect cleanup removes the listener, disconnects the observer, and cancels pending frames before reconnecting and when the component unmounts. Resize observation also reacts to font loading and viewport changes.

Measurements use the preview’s own scroll container. Progress is the scroll offset divided by available scroll distance, clamped to 0–100; it is not a word-completion estimate. The active cue uses ordered measured chapter positions and a small top reading offset, with the final chapter selected at the bottom. Chapter buttons scroll that container and focus the identified section with `preventScroll`, keeping outer page position stable.

All reading content is text interpolation. No Markdown or HTML is executed. Page and chapter editors are detached, explicit Save forms. Density and structural changes update the validated workspace immediately. Preview height remains fixed through content edits, reorders, and density changes.

The shared modal uses `Teleport`, a unique `useId` heading, and a post-flush watcher to synchronize Vue state with native `showModal`/`close`. Escape and focus return remain native. A queued close event cannot reset a modal that has already reopened.

## 💾 Local Drafts & Data Exchange

Validated workspace data is stored under `vue-scroll-cue-studio:v1`. First-use and restored data are validated before use. Invalid saved JSON/schema falls back to the sample without immediately overwriting the damaged entry. A later valid change writes a new draft. Blocked storage leaves editing and downloads usable and shows a status message.

Import parses a detached candidate and replaces the workspace only after complete validation. Failure keeps current work and the saved draft intact. Workspace JSON is limited to **120,000 characters**. Known fields are rebuilt in canonical order; unknown fields and supplied provenance are not trusted or carried into the editable domain. Project markers are recomputed from validated data. Session-only selection, modes, pending forms, dialog text, and derived results are not exported as workspace state.

| Field                | Accepted values                                                                |
| -------------------- | ------------------------------------------------------------------------------ |
| `version`, `name`    | `1`; nonblank single-line title up to 80 characters                            |
| `introduction`       | Optional single-line text up to 240 characters                                 |
| `density`            | `comfortable` or `compact`                                                     |
| `sections`           | 2–12 entries with unique safe lowercase IDs                                    |
| Section title / body | Nonblank single-line title up to 80 characters; nonblank plain text up to 3000 |

Blank lines separate visible paragraphs; content may contain ordinary line breaks and tabs. Reserved prototype identities and enum arrays are rejected. Known fields are reconstructed rather than merging arbitrary imported objects.

HTML includes the title, introduction, every chapter and paragraph, matching native navigation anchors, SC author metadata, system-font CSS, and print rules. It contains no runtime scripts, external resources, live scroll progress, or editor density controls. Its native anchor navigation works independently of Vue. JSON retains the complete content, order, and preview density; scroll position, focused chapter, and pending editor text are session-only.

Download Blob URLs are revoked after download. Destructive collection removal and sample restoration use native confirmation dialogs.

## ◈ Project Markers

- `SC` appears in the wordmark, project metadata, and workspace identity; original favicon and social artwork use its matching emblem.
- `SC-XXXXXXXX` is a deterministic 32-bit content stamp calculated from the canonical validated workspace, excluding supplied provenance.
- JSON provenance includes the project slug, `CodeSculptor`, and the marker. Downloaded artifacts carry the appropriate identity in filenames and/or metadata/content.
- Markers help identify configurations and artifacts; they are not cryptographic signatures or tamper-proof authorship claims.
- Author metadata and the MIT license retain CodeSculptor attribution.

## 🧭 Extension Notes & Nuances

- Reading cues track scroll geometry in the preview, not time, comprehension, words read, or the outer document’s position.
- The preview preserves its scroll position where possible after edits; the browser clamps it if content becomes shorter.
- A short fully visible document reports 100%. The final chapter is selected at the bottom of the reader.
- Plain text uses blank lines to separate paragraphs. There are no embedded images, authored HTML, or Markdown rendering.
- Selecting another chapter discards unsubmitted editor fields; imports and confirmed restoration replace all pending forms.
- The HTML export is a simple native reading page; the live Vue preview’s observer cues remain application behavior.
- When adding rich content, preserve safe rendering, post-patch measurements, keyed identity lookup, and observer cleanup.

The application and documentation are English. At 320 px panels stack, while larger screens use the shared grid. Scrollable data regions, named native controls, visible focus styles, and a single main landmark remain available across layouts.

## ✅ Build & Checks

```bash
npm run build
npm run format:check
npm test
npx playwright install chromium
npm run test:e2e
```

`build` runs `vue-tsc` before Vite. Native tests use Node’s built-in runner. Playwright starts the current production bundle with the local preview command and does not reuse another server. Build before browser tests so they inspect current output. `npm run format` formats maintained source; dependencies, generated output, lockfiles, and browser artifacts are excluded.

Six native tests cover sample/provenance, strict section bounds, paragraph splitting, ordered active cues, bounded geometry progress, and escaped HTML anchors. Four domain browser tests use real scrolling/keyboard navigation/focus, instrument observer reconnection after reorder/content/density changes, check added/deleted keyed sections and stable preview geometry, and parse actual downloaded HTML.

Shared browser workflows check valid/failed imports, persistence after reload, provenance downloads, blocked/corrupt storage, confirmed sample restoration, native modal reopening/Escape/focus, real Tailwind grid behavior, named visible controls, and overflow at 320–1440 px. A separate maximum-content browser case checks the accepted collection/field bounds at 320 px. These are local production checks, not a deployed Vercel smoke test.

## ▲ Vercel Deployment

1. Import the repository and select this project folder as the Root Directory when deploying from the shared workspace.
2. Use the committed config: `npm ci`, `npm run build`, and output folder `dist`.
3. Check the root page, public sample/artwork, and main editor after deployment.

The explicit `vercel.json` rewrites only `/` to `/index.html` and permanently redirects `/index.html` to `/`. There are no client routes requiring a catch-all rewrite. Declared routes preserve missing-resource behavior. HTML and unhashed public files revalidate; Vite’s hashed JS/CSS/font assets receive one-year immutable caching. All responses include `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. The dev command accepts Vercel’s `$PORT` with `--strictPort`.

Used fields, route compilation, and generated asset/cache behavior are checked locally against the [official Vercel configuration schema](https://openapi.vercel.sh/vercel.json). Vite preview does not emulate deployment headers. SVG social artwork is included as an editable source; platforms requiring raster cards need a rendered image and an absolute deployed image URL.

## 📄 License

[MIT](./LICENSE) · Copyright (c) 2026 **CodeSculptor**. Bundled fonts retain separate OFL licenses.
