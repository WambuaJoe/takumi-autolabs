'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PAGES = [
  { route: '/', source: 'index.html', title: 'Home' },
  { route: '/services/', source: 'services/index.html', title: 'Services' },
  { route: '/how-we-work/', source: 'how-we-work/index.html', title: 'How We Work' },
  { route: '/projects/', source: 'projects/index.html', title: 'Projects' },
  { route: '/about/', source: 'about/index.html', title: 'About' },
  { route: '/contact/', source: 'contact/index.html', title: 'Contact' }
];

function xmlEscape(value) {
  return value.replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]);
}

function getSiteOrigin() {
  const raw = process.env.SITE_URL;
  if (!raw) return '';
  let parsed;
  try {
    parsed = new URL(raw);
  } catch (_error) {
    throw new Error('SITE_URL must be an absolute HTTPS origin, such as https://your-real-domain.example.');
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.pathname !== '/' && parsed.pathname !== '')) {
    throw new Error('SITE_URL must be an HTTPS origin only, without credentials, path, query, or fragment.');
  }
  return parsed.origin;
}

function ensureDirectory(destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
}

function copyFile(relativePath) {
  const from = path.join(ROOT, relativePath);
  const to = path.join(DIST, relativePath);
  ensureDirectory(to);
  fs.copyFileSync(from, to);
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

for (const page of PAGES) copyFile(page.source);
for (const directory of ['assets']) {
  fs.cpSync(path.join(ROOT, directory), path.join(DIST, directory), { recursive: true });
}
copyFile('manus-routes.json');

const siteOrigin = getSiteOrigin();
for (const page of PAGES) {
  const htmlPath = path.join(DIST, page.source);
  let html = fs.readFileSync(htmlPath, 'utf8');
  const metadata = siteOrigin
    ? `<link rel="canonical" href="${siteOrigin}${page.route}">\n  <meta property="og:url" content="${siteOrigin}${page.route}">\n  <meta property="og:image" content="${siteOrigin}/assets/og-card.png">\n  <meta name="twitter:image" content="${siteOrigin}/assets/og-card.png">`
    : '<!-- Canonical and absolute social image URLs are omitted until SITE_URL is configured. -->';
  html = html.replace('<!-- SITE_ORIGIN_METADATA -->', metadata);
  fs.writeFileSync(htmlPath, html);
}

const sitemapUrlset = siteOrigin
  ? PAGES.map(({ route }) => `  <url><loc>${xmlEscape(`${siteOrigin}${route}`)}</loc></url>`).join('\n')
  : '  <!-- No production origin is set. Configure SITE_URL to emit absolute sitemap URLs. -->';
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrlset}\n</urlset>\n`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);

const robots = ['User-agent: *', 'Allow: /'];
if (siteOrigin) robots.push(`Sitemap: ${siteOrigin}/sitemap.xml`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `${robots.join('\n')}\n`);

console.log(`Static site built to dist/ (${PAGES.length} pages).`);
if (!siteOrigin) console.warn('SITE_URL is unset: absolute canonicals, social image URLs, and sitemap page entries were intentionally omitted.');
