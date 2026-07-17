# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The personal website for Tom Panos (tom-panos.com) — a **static site of hand-authored HTML, one shared CSS file, and one vanilla-JS file. There is no build step, no framework, no package manager, and no tests.** Vercel serves the files directly.

## Commands

- **Preview locally:** open the `.html` files in a browser, or run any static server (e.g. `python3 -m http.server`) from the repo root. Note that `vercel.json` uses `cleanUrls`, so locally the pages appear at `/blog.html` while in production they resolve at `/blog` — internal links use the clean form (`/blog`, `/projects`), which won't resolve against `file://` or a plain static server.
- **Deploy:** push to `main`. Vercel's GitHub integration auto-deploys to production; there is no CLI deploy step. Vercel project/team IDs are recorded in Claude's memory.

## Architecture

**Pages** are top-level HTML files, one per route: `index.html` (`/`), `projects.html`, `mission.html`, `library.html`, `blog.html`. Blog posts live in `blog/*.html` and resolve at `/blog/<slug>`. Every page is fully self-contained and links `/assets/css/styles.css` + `/assets/js/main.js`.

**Styling is inline-first.** The vast majority of styling lives in `style="..."` attributes directly on elements (these pages were exported from Claude Design prototypes). `assets/css/styles.css` holds only what inline styles can't express:
- global resets, `body` defaults, fonts, `@keyframes` (`floatA`/`floatB` aurora blobs, `spinRing`, `marqueeDrift`)
- **hover states as numbered utility classes** `.hv1`–`.hv14` — an element gets its base look from inline style and its hover behavior by adding `class="hvN"`. When adding an interactive element, reuse an existing `.hvN` whose effect matches rather than inventing inline `:hover`.
- `.post-body` — the ONLY place blog-post prose is styled (h2/h3/p/ul/blockquote/figure/etc.). Blog post bodies rely on this; don't inline-style prose.
- responsive rules keyed off inline style substrings, e.g. `[style*="grid-template-columns:repeat(4"]`. **Consequence:** if you change a grid's `grid-template-columns` inline value, check whether a matching selector in the `@media` blocks needs updating, or the layout won't collapse correctly on mobile.

**`assets/js/main.js`** is one IIFE, no dependencies, driven entirely by `data-*` attributes — add the attribute to opt an element in:
- `data-reveal` (+ optional `data-reveal-delay` ms) — fade/translate in on scroll via IntersectionObserver. Children with `data-grow` + `data-axis`/`data-val` animate (e.g. chart bars growing to a width). A `<noscript>` block forces `data-reveal` elements visible when JS is off.
- `data-count` (+ `data-dec`/`data-prefix`/`data-suffix`) — animated number counter.
- `data-filterbar` containing `data-filter="<Category>"` buttons + `data-card` elements carrying `data-cat`/`data-name`; optional `[data-search]` input does live filtering and `[data-empty]` is the no-results element. **Filter categories and active-button colors are hardcoded** — `All` is the reset value and the active-state colors are set imperatively in the click handler (`#0B0C10`, the blue gradient). Category strings on buttons must exactly match `data-cat` on cards.

## Design tokens (keep consistent when editing)

- Background `#0B0C10`; primary text `#F3F5F8`; muted text `#99A1AD`/`#9BA3AD`.
- Blue accent gradient `linear-gradient(135deg,#5C9BE8,#2E6BB0)`; accent solid `#5C9BE8`.
- Fonts (Google Fonts, linked per page): **Red Hat Display** (headings/logo, weights to 900), **Geist** (body), **Fira Code** (mono accents like `↗` `→` and eyebrow labels).

## Conventions

- **The nav is duplicated inline in every page** (fixed top bar with the same links + the S3 Labs button). There is no include/partial — a nav or footer change must be applied to every HTML file, including each `blog/*.html` post.
- Blog is maintained by hand in two places: the card grid in `blog.html` and the post file in `blog/`. Adding a post means adding both a `data-card` (with correct `data-cat` matching a filter button) linking to `/blog/<slug>` and the `blog/<slug>.html` page. Cover images referenced from cards live in `assets/img/blog/`.
- `assets/img/` holds brand logos (multiple variants/marks per product) and `lib/` tool icons for the library page; `blog/` holds post covers and inline figures.
- `.vercelignore` / `.gitignore` keep `.claude/`, `.remember/`, and `*.zip` (the original Claude Design export bundles) out of git and deploys.
