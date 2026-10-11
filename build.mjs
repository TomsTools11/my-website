// tom-panos.com — build (no dependencies). Generates dist/ from the hand-authored pages + posts/.
//   node build.mjs           build dist/
//   node build.mjs --serve   build, then serve dist/ at http://localhost:8080 with clean URLs
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'dist');
const SITE = 'https://tom-panos.com';
const PAGES = ['index.html', 'projects.html', 'mission.html', 'library.html', 'blog.html'];
const STATIC = ['assets', 'robots.txt'];

// Category key (what data-cat / filters match on) -> display label. Button order = this order.
const CATEGORIES = { AI: 'Artificial Intelligence', Productivity: 'Productivity', Sales: 'Sales & Marketing' };
const REQUIRED = ['title', 'date', 'categories', 'description', 'excerpt', 'cover'];
const OPTIONAL = ['cardTitle', 'coverAlt', 'ogImage', 'featured'];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = urlPath => fs.existsSync(path.join(ROOT, urlPath));
const errors = [];

// ---------- Posts ----------

function parsePost(file) {
  const slug = file.replace(/\.html$/, '');
  const m = read(path.join('posts', file)).match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) { errors.push(`posts/${file}: missing --- front matter ---`); return null; }
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(': ');
    if (i < 0) { errors.push(`posts/${file}: bad front-matter line "${line}"`); continue; }
    meta[line.slice(0, i).trim()] = line.slice(i + 2).trim();
  }
  const where = `posts/${file}`;
  for (const k of REQUIRED) if (!meta[k]) errors.push(`${where}: missing "${k}"`);
  for (const k of Object.keys(meta)) if (!REQUIRED.includes(k) && !OPTIONAL.includes(k)) errors.push(`${where}: unknown field "${k}"`);
  const date = new Date(meta.date + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date || '') || isNaN(date)) errors.push(`${where}: date must be YYYY-MM-DD`);
  const categories = (meta.categories || '').split(',').map(s => s.trim()).filter(Boolean);
  for (const c of categories) if (!CATEGORIES[c]) errors.push(`${where}: unknown category "${c}" (known: ${Object.keys(CATEGORIES).join(', ')})`);
  for (const k of ['cover', 'ogImage']) if (meta[k] && !exists(meta[k])) errors.push(`${where}: ${k} ${meta[k]} not found`);
  if (meta.featured && meta.featured !== 'true') errors.push(`${where}: featured must be "true" or omitted`);
  const body = m[2].trim();
  if (!body) errors.push(`${where}: empty body`);
  const words = body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return {
    slug, ...meta, body, date, iso: meta.date, categories,
    url: `${SITE}/blog/${slug}`,
    cardTitle: meta.cardTitle || meta.title,
    coverAlt: meta.coverAlt || `Cover art for ${meta.title}`,
    // Social platforms don't render SVG previews; fall back to the avatar.
    ogImage: meta.ogImage || (/\.svg$/i.test(meta.cover || '') ? '/assets/img/avatar.png' : meta.cover),
    featured: meta.featured === 'true',
    label: categories.map(c => CATEGORIES[c]).join(' · '),
    displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
    readTime: Math.max(1, Math.ceil(words / 200)),
  };
}

const posts = fs.readdirSync(path.join(ROOT, 'posts')).filter(f => f.endsWith('.html')).map(parsePost).filter(Boolean)
  .sort((a, b) => b.date - a.date || a.slug.localeCompare(b.slug));
const featuredPosts = posts.filter(p => p.featured);
if (featuredPosts.length > 1) errors.push(`more than one featured post: ${featuredPosts.map(p => p.slug).join(', ')}`);
const featured = featuredPosts[0] || posts[0];

// ---------- Renderers (markup mirrors the Claude Design originals) ----------

const REVEAL = (s) => `opacity:0;transform:translateY(24px);transition:opacity ${s} cubic-bezier(.2,.7,.2,1),transform ${s} cubic-bezier(.2,.7,.2,1)`;
const LABEL = `font-family:'Fira Code';font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#5C9BE8;`;

const postCard = (p, i) => `
          <a href="/blog/${p.slug}" data-card data-cat="${esc(p.categories.join(','))}" data-reveal data-reveal-delay="${[0, 80, 160][i % 3]}" style="${REVEAL('.6s')},border-color .25s;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden;background:rgba(255,255,255,.02);" class="hv9">
            <img src="${esc(p.cover)}" alt="${esc(p.coverAlt)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block;" loading="lazy">
            <div style="padding:22px;flex:1;display:flex;flex-direction:column;">
              <span style="${LABEL}">${esc(p.label)}</span>
              <h3 style="font-family:'Red Hat Display';font-weight:700;font-size:18px;line-height:1.22;margin:11px 0 10px;">${esc(p.cardTitle)}</h3>
              <p style="font-size:13.5px;line-height:1.5;color:#9BA3AD;margin:0 0 16px;flex:1;">${esc(p.excerpt)}</p>
              <span style="font-family:'Fira Code';font-size:12px;color:#7B8693;">${p.displayDate}</span>
            </div>
          </a>`;

const latestCard = (p, i) => `
          <a href="/blog/${p.slug}" data-reveal="" data-reveal-delay="${[0, 120, 240][i]}" style="${REVEAL('.7s')};display:block;border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden;background:rgba(255,255,255,.02);" class="hv9">
            <img src="${esc(p.cover)}" alt="${esc(p.coverAlt)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block;" loading="lazy">
            <div style="padding:22px;">
              <span style="${LABEL}">${esc(p.label)}</span>
              <h3 style="font-family:'Red Hat Display';font-weight:700;font-size:19px;line-height:1.25;margin:12px 0 14px;">${esc(p.cardTitle)}</h3>
              <span style="font-size:12.5px;color:#7B8693;font-family:'Fira Code';">${p.displayDate}</span>
            </div>
          </a>`;

const featuredPost = p => `      <a href="/blog/${p.slug}" data-reveal style="${REVEAL('.7s')},border-color .25s;display:grid;grid-template-columns:1.1fr 1fr;gap:0;border:1px solid rgba(255,255,255,.08);border-radius:22px;overflow:hidden;background:rgba(255,255,255,.02);" class="hv14">
        <div style="padding:48px;display:flex;flex-direction:column;justify-content:center;">
          <span style="font-family:'Fira Code';font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#5C9BE8;">Featured · ${esc(p.label)}</span>
          <h2 style="font-family:'Red Hat Display';font-weight:800;font-size:34px;line-height:1.1;letter-spacing:-1px;margin:14px 0 16px;">${esc(p.title)}</h2>
          <p style="font-size:16px;line-height:1.6;color:#B6BDC7;margin:0 0 22px;">${esc(p.excerpt)}</p>
          <span style="font-family:'Fira Code';font-size:12.5px;color:#7B8693;">${p.displayDate} · ${p.readTime} min read</span>
        </div>
        <img src="${esc(p.cover)}" alt="${esc(p.coverAlt)}" style="width:100%;height:100%;min-height:280px;object-fit:cover;display:block;">
      </a>`;

const filterButton = (key, label, on) => `          <button data-filter="${esc(key)}" style="cursor:pointer;font-family:'Fira Code';font-size:12.5px;letter-spacing:.5px;color:${on ? '#0B0C10' : '#9BA3AD'};background:${on ? 'linear-gradient(135deg,#5C9BE8,#2E6BB0)' : 'rgba(255,255,255,.03)'};border:1px solid ${on ? 'transparent' : 'rgba(255,255,255,.12)'};padding:8px 15px;border-radius:9px;">${esc(label)}</button>`;

const postTemplate = read('templates/post.html');
const postPage = p => postTemplate.replace(/\{\{(\w+)\}\}/g, (_, k) => {
  if (k === 'body') return p.body;
  if (k === 'date') return p.iso;
  if (k === 'categoryLabel') return esc(p.label);
  if (k === 'ogImage') return SITE + p.ogImage;
  if (!(k in p)) { errors.push(`templates/post.html: unknown placeholder {{${k}}}`); return ''; }
  return esc(p[k]);
});

function fill(html, file, slots) {
  for (const [name, content] of Object.entries(slots)) {
    const marker = new RegExp(`^[ \\t]*<!-- build:${name} -->\\n`, 'm');
    if (!marker.test(html)) { errors.push(`${file}: missing <!-- build:${name} --> marker`); continue; }
    html = html.replace(marker, () => content.replace(/^\n/, '') + '\n');
  }
  return html;
}

// ---------- Feeds ----------

const xml = s => esc(s).replace(/'/g, '&apos;');
const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['/', '/projects', '/mission', '/library', '/blog'].map(u => `  <url><loc>${SITE}${u === '/' ? '/' : u}</loc></url>`).join('\n')}
${posts.map(p => `  <url><loc>${p.url}</loc><lastmod>${p.iso}</lastmod></url>`).join('\n')}
</urlset>
`;
const feed = () => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Tom Panos — Blog</title>
  <link>${SITE}/blog</link>
  <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
  <description>Essays and field notes on AI, productivity, and the future of knowledge work.</description>
  <language>en-us</language>
${posts.map(p => `  <item>
    <title>${xml(p.title)}</title>
    <link>${p.url}</link>
    <guid>${p.url}</guid>
    <pubDate>${p.date.toUTCString()}</pubDate>
    <description>${xml(p.description)}</description>
${p.categories.map(c => `    <category>${xml(CATEGORIES[c])}</category>`).join('\n')}
  </item>`).join('\n')}
</channel>
</rss>
`;

// ---------- Write dist/ ----------

const out = {};
for (const f of PAGES) out[f] = read(f);
out['blog.html'] = fill(out['blog.html'], 'blog.html', {
  'featured-post': featuredPost(featured),
  'category-filters': [filterButton('All', 'All', true), ...Object.entries(CATEGORIES).map(([k, l]) => filterButton(k, l, false))].join('\n'),
  'post-cards': posts.map(postCard).join('\n'),
});
out['index.html'] = fill(out['index.html'], 'index.html', { 'latest-posts': posts.slice(0, 3).map(latestCard).join('\n') });
for (const p of posts) out[`blog/${p.slug}.html`] = postPage(p);

if (errors.length) {
  console.error(`Build failed:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}

// Content-hash the CSS/JS URLs so the immutable /assets cache header is safe.
const stamp = {};
for (const a of ['/assets/css/styles.css', '/assets/js/main.js']) {
  stamp[a] = `${a}?v=${crypto.createHash('sha256').update(read(a)).digest('hex').slice(0, 10)}`;
}
const stampAssets = html => html.replace(/"(\/assets\/(?:css\/styles\.css|js\/main\.js))"/g, (_, a) => `"${stamp[a]}"`);

fs.rmSync(OUT, { recursive: true, force: true });
for (const s of STATIC) fs.cpSync(path.join(ROOT, s), path.join(OUT, s), { recursive: true });
for (const [f, html] of Object.entries(out)) {
  fs.mkdirSync(path.dirname(path.join(OUT, f)), { recursive: true });
  fs.writeFileSync(path.join(OUT, f), stampAssets(html));
}
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap());
fs.writeFileSync(path.join(OUT, 'feed.xml'), feed());
console.log(`Built dist/: ${PAGES.length} pages, ${posts.length} posts (featured: ${featured.slug}), sitemap.xml, feed.xml`);

// ---------- Local preview with Vercel-style clean URLs ----------

if (process.argv.includes('--serve')) {
  const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.xml': 'application/xml', '.txt': 'text/plain',
    '.png': 'image/png', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
  http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const f = [u, u + '.html', path.join(u, 'index.html')].map(c => path.join(OUT, c))
      .find(c => c.startsWith(OUT) && fs.existsSync(c) && fs.statSync(c).isFile());
    if (!f) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  }).listen(8080, () => console.log('Serving dist/ at http://localhost:8080'));
}
