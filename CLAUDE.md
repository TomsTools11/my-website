# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The personal website for Tom Panos (tom-panos.com) — a **static site of hand-authored HTML, one shared CSS file, and one vanilla-JS file, plus a zero-dependency build script (`build.mjs`) that generates the blog.** No framework, no package manager, no `npm install`. Vercel runs `node build.mjs` and serves `dist/`.

Domain terms (Post, Category, Featured post, Card title, …) are defined in `GLOSSARY.md`.

## Commands

- **Build:** `node build.mjs` → writes `dist/` (git-ignored). It validates every Post and exits non-zero with a list of problems (missing/unknown fields, unknown category, missing cover, >1 featured). Treat a failing build as a failing test.
- **Preview locally:** `node build.mjs --serve` → http://localhost:8080 with Vercel-style clean URLs (`/blog`, `/blog/<slug>`). Opening the source `.html` files directly shows empty blog sections — the post markup only exists in `dist/`.
- **Deploy:** push to `main`. Vercel's GitHub integration runs the build (configured in `vercel.json`: `buildCommand`, `outputDirectory: dist`) and auto-deploys to production; branches get preview deploys.

## Architecture

**Pages** are top-level HTML files, one per route: `index.html` (`/`), `projects.html`, `mission.html`, `library.html`, `blog.html`. Every page is self-contained and links `/assets/css/styles.css` + `/assets/js/main.js` (the build appends a `?v=<content hash>` to both, because `/assets/*` is served with a one-year immutable cache).

**The Post module** (`posts/`, `templates/post.html`, `build.mjs`) is the single source for everything blog-related:
- `posts/<slug>.html` = one Post: a `---` front-matter block, then the body HTML (styled by `.post-body`). Fields: `title`, `date` (YYYY-MM-DD), `categories` (comma-separated keys), `description` (meta/OG + lede), `excerpt` (card teaser), `cover`; optional `cardTitle`, `coverAlt`, `ogImage`, `featured: true`. Values are plain text — the build HTML-escapes them. Reading time is computed from the body.
- The build renders `dist/blog/<slug>.html` from `templates/post.html` (`{{placeholder}}` substitution), and fills marker comments in the hand-authored pages: `<!-- build:featured-post -->`, `<!-- build:category-filters -->`, `<!-- build:post-cards -->` in `blog.html`, `<!-- build:latest-posts -->` (newest 3) in `index.html`. It also writes `sitemap.xml` and `feed.xml`.
- Categories (key → label, and filter-button order) are defined once in `CATEGORIES` at the top of `build.mjs`.
- Never hand-edit post markup in `blog.html`/`index.html` or create files under `blog/` — change the Post or the renderer in `build.mjs`.

**Styling is inline-first.** The vast majority of styling lives in `style="..."` attributes directly on elements (these pages were exported from Claude Design prototypes). `assets/css/styles.css` holds only what inline styles can't express:
- global resets, `body` defaults, fonts, `@keyframes` (`floatA`/`floatB` aurora blobs, `spinRing`, `marqueeDrift`)
- **hover states as numbered utility classes** `.hv1`–`.hv14` — an element gets its base look from inline style and its hover behavior by adding `class="hvN"`. When adding an interactive element, reuse an existing `.hvN` whose effect matches rather than inventing inline `:hover`.
- `.post-body` — the ONLY place blog-post prose is styled (h2/h3/p/ul/blockquote/figure/etc.). Blog post bodies rely on this; don't inline-style prose.
- responsive rules keyed off inline style substrings, e.g. `[style*="grid-template-columns:repeat(4"]`. **Consequence:** if you change a grid's `grid-template-columns` inline value, check whether a matching selector in the `@media` blocks needs updating, or the layout won't collapse correctly on mobile.

**`assets/js/main.js`** is one IIFE, no dependencies, driven entirely by `data-*` attributes — add the attribute to opt an element in:
- `data-reveal` (+ optional `data-reveal-delay` ms) — fade/translate in on scroll via IntersectionObserver. Children with `data-grow` + `data-axis`/`data-val` animate (e.g. chart bars growing to a width). A `<noscript>` block forces `data-reveal` elements visible when JS is off.
- `data-count` (+ `data-dec`/`data-prefix`/`data-suffix`) — animated number counter.
- `data-filterbar` containing `data-filter="<Category>"` buttons + `data-card` elements carrying `data-cat` (comma-separated for multiple categories, e.g. `AI,Productivity`) and optional `data-name`; optional `[data-search]` input does live filtering and `[data-empty]` is the no-results element. **Filter categories and active-button colors are hardcoded** — `All` is the reset value and the active-state colors are set imperatively in the click handler (`#0B0C10`, the blue gradient). Category strings on buttons must exactly match a `data-cat` entry on cards (the blog's buttons and cards are generated from `CATEGORIES`, so they can't drift; projects/library are still hand-authored).

## Design tokens (keep consistent when editing)

- Background `#0B0C10`; primary text `#F3F5F8`; muted text `#99A1AD`/`#9BA3AD`.
- Blue accent gradient `linear-gradient(135deg,#5C9BE8,#2E6BB0)`; accent solid `#5C9BE8`.
- Fonts (Google Fonts, linked per page): **Red Hat Display** (headings/logo, weights to 900), **Geist** (body), **Fira Code** (mono accents like `↗` `→` and eyebrow labels).

## Conventions

- **The nav is duplicated inline in every page** (fixed top bar with the same links + the S3 Labs button). There is no include/partial — a nav or footer change must be applied to every top-level HTML file and to `templates/post.html` (which covers all posts).
- **Adding a post:** create `posts/<slug>.html` (copy an existing one for the front-matter shape), put its cover in `assets/img/blog/`, run `node build.mjs`. The post page, blog card, filters, home "Latest articles", sitemap and RSS all update. To feature it, move `featured: true` to it from the current featured post.
- `assets/img/` holds brand logos (multiple variants/marks per product) and `lib/` tool icons for the library page; `blog/` holds post covers and inline figures.
- `.vercelignore` / `.gitignore` keep `.claude/`, `.remember/`, and `*.zip` (the original Claude Design export bundles) out of git and deploys; `dist/` is git-ignored build output.
