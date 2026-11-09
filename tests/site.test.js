'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PAGES = [
  { route: '/', file: 'index.html' },
  { route: '/services/', file: 'services/index.html' },
  { route: '/how-we-work/', file: 'how-we-work/index.html' },
  { route: '/projects/', file: 'projects/index.html' },
  { route: '/about/', file: 'about/index.html' },
  { route: '/contact/', file: 'contact/index.html' }
];
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('all six public pages contain crawlable content, unique titles/descriptions, and shared navigation', () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const page of PAGES) {
    const html = read(page.file);
    assert.match(html, /<!doctype html>/i, `${page.file} has a doctype`);
    assert.match(html, /<main\b[^>]*id="main-content"/i, `${page.file} has a main landmark`);
    assert.match(html, /<h1\b/i, `${page.file} has a heading`);
    assert.match(html, /<nav\s+aria-label="Main navigation"/i, `${page.file} has labelled navigation`);
    assert.match(html, /<meta\s+name="description"\s+content="[^"]{50,}"/i, `${page.file} has a page description`);
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1];
    const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1];
    assert.ok(title, `${page.file} has a title`);
    assert.ok(description, `${page.file} has a description`);
    titles.add(title);
    descriptions.add(description);
    for (const href of ['/services/', '/how-we-work/', '/projects/', '/about/', '/contact/']) {
      assert.ok(html.includes(`href="${href}"`), `${page.file} links to ${href}`);
    }
    assert.match(html, /https:\/\/cal\.com\/takumi-autolabs\/discovery/);
    assert.match(html, /takumiautolabs@gmail\.com/);
  }
  assert.equal(titles.size, PAGES.length, 'titles are unique');
  assert.equal(descriptions.size, PAGES.length, 'descriptions are unique');
});

test('the route manifest lists the complete public page set and excludes APIs', () => {
  const manifest = JSON.parse(read('manus-routes.json'));
  assert.deepEqual(manifest.routes.map((route) => route.path), PAGES.map((page) => page.route));
  assert.equal(manifest.routes.length, 6);
  assert.equal(manifest.routes.some((route) => route.path.startsWith('/api/')), false);
});

test('the projects section and homepage label illustrative dashboard data explicitly', () => {
  const label = 'ILLUSTRATIVE OPERATIONS DASHBOARD · SAMPLE DATA';
  assert.ok(read('index.html').includes(label));
  assert.ok(read('projects/index.html').includes(label));
  assert.match(read('projects/index.html'), /not a verified client project/i);
  assert.match(read('projects/index.html'), /not verified client deployments/i);
  assert.match(read('projects/index.html'), /Expected operational improvements/i);
});

test('service descriptions include problem, implementation, intended outcome, and use case for each area', () => {
  const html = read('services/index.html');
  for (const id of ['erp', 'process-optimization', 'systems-integration', 'workflow-automation']) {
    const start = html.indexOf(`id="${id}"`);
    assert.notEqual(start, -1, `section ${id} exists`);
    const next = html.indexOf('<article class="service-detail"', start + 10);
    const section = html.slice(start, next === -1 ? undefined : next);
    assert.match(section, /The business problem/);
    assert.match(section, /What Takumi implements/);
    assert.match(section, /Intended operational outcome/);
    assert.match(section, /Grounded use case/);
  }
});

test('the contact form is wired to the server endpoint with required client fields and accessible status', () => {
  const html = read('contact/index.html');
  assert.match(html, /action="\/api\/contact"/);
  assert.match(html, /name="name"[^>]*required/);
  assert.match(html, /name="email"[^>]*type="email"[^>]*required/);
  assert.match(html, /name="message"[^>]*maxlength="5000"[^>]*minlength="20"[^>]*required/);
  assert.match(html, /name="consent"[^>]*required/);
  assert.match(html, /data-form-status role="status" aria-live="polite"/);
  assert.match(html, /name="website"/);
});

test('all local navigation, section, and asset links resolve to real targets', () => {
  const routeMap = new Map(PAGES.map((page) => [page.route, page.file]));
  for (const page of PAGES) {
    const html = read(page.file);
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = new URL(match[1], `https://takumi.test${page.route}`);
      if (target.origin !== 'https://takumi.test') continue;
      const targetRoute = routeMap.get(target.pathname);
      let targetHtml = '';
      if (targetRoute) {
        targetHtml = read(targetRoute);
      } else {
        let targetPath = path.join(ROOT, target.pathname.replace(/^\//, ''));
        if (target.pathname === '/') targetPath = path.join(ROOT, 'index.html');
        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) targetPath = path.join(targetPath, 'index.html');
        assert.ok(fs.existsSync(targetPath), `${page.file}: ${match[1]} exists`);
        if (targetPath.endsWith('.html')) targetHtml = fs.readFileSync(targetPath, 'utf8');
      }
      if (target.hash) {
        const id = decodeURIComponent(target.hash.slice(1));
        assert.ok(targetHtml.includes(`id="${id}"`), `${page.file}: ${match[1]} fragment exists`);
      }
    }
  }
});

test('no production domain is hard-coded into page metadata', () => {
  for (const page of PAGES) {
    const html = read(page.file);
    assert.match(html, /<!-- SITE_ORIGIN_METADATA -->/);
    assert.doesNotMatch(html, /<link\s+rel="canonical"/i);
    assert.doesNotMatch(html, /<meta\s+property="og:url"/i);
  }
});
