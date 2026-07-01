# tom-panos.com

Personal website for **Tom Panos** — Growth Strategist & AI Consultant.

A static site (HTML / CSS / vanilla JS) with no build step — Vercel serves the files directly.

## Pages
| File | Route | Page |
|------|-------|------|
| `index.html` | `/` | Home |
| `projects.html` | `/projects` | My Projects |
| `mission.html` | `/mission` | My Mission |
| `library.html` | `/library` | Software Library |
| `blog.html` | `/blog` | My Blog |

## Structure
- `assets/css/styles.css` — base styles, fonts, keyframes, hover states, responsive rules
- `assets/js/main.js` — scroll reveal, animated counters, category filters, live search, chart bars
- `assets/img/` — logos and tool icons
- `vercel.json` — clean URLs + long-cache headers for assets

## Deploy
Connected to Vercel via the GitHub integration — pushes to `main` deploy automatically.
