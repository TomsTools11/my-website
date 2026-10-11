# Glossary

Domain terms for tom-panos.com. Use these names in code, commits and reviews.

- **Post** — one blog article. Its source is a single file, `posts/<slug>.html`: front matter (metadata) followed by the body HTML. The slug is the filename and the URL (`/blog/<slug>`). Every other appearance of a Post on the site is generated from that file.
- **Post module** — `posts/` + `templates/post.html` + `build.mjs`. Turns Posts into the post pages, blog cards, the featured slot, the home page's latest articles, `sitemap.xml` and `feed.xml`. Its interface is the front-matter fields; callers never touch the generated markup.
- **Category** — a topic a Post belongs to. A Post has one or more. Keys are short (`AI`, `Productivity`, `Sales`) and are what filters match on; each key has a display label (`Artificial Intelligence`, …) defined once in `build.mjs`.
- **Card title** — optional shorter title used on blog cards and home cards. Falls back to the Post's title.
- **Excerpt** — the one-line teaser on cards. Distinct from the **description**, which is the meta/OG description and the lede under the post's headline.
- **Featured post** — the one Post marked `featured: true`. Shown in the hero slot at the top of `/blog`, and also in the grid like any other Post.
- **Latest articles** — the three newest Posts, shown on the home page.
