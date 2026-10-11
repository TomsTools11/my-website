# tom-panos.com

Personal website for **Tom Panos** — Growth Strategist & AI Consultant.

A static site (HTML / CSS / vanilla JS). A zero-dependency script, `build.mjs`, generates the blog from `posts/` into `dist/`, which Vercel serves.

## Pages
| File | Route | Page |
|------|-------|------|
| `index.html` | `/` | Home |
| `projects.html` | `/projects` | My Projects |
| `mission.html` | `/mission` | My Mission |
| `library.html` | `/library` | Software Library |
| `blog.html` | `/blog` | My Blog |
| `posts/<slug>.html` | `/blog/<slug>` | Blog posts (generated via `templates/post.html`) |

## Structure
- `assets/css/styles.css` — base styles, fonts, keyframes, hover states, responsive rules
- `assets/js/main.js` — scroll reveal, animated counters, category filters, live search, chart bars
- `assets/img/` — logos and tool icons
- `posts/` — one file per blog post: front matter + body HTML (see `GLOSSARY.md`)
- `templates/post.html` — post page template
- `build.mjs` — builds `dist/`: post pages, blog cards, home latest articles, `sitemap.xml`, `feed.xml`
- `vercel.json` — build command, clean URLs + long-cache headers for assets

## Develop
```bash
node build.mjs --serve   # http://localhost:8080
```

## Deploy
Connected to Vercel via the GitHub integration — pushes to `main` deploy automatically.
