# Website verification report

| | |
| --- | --- |
| Project | Takumi AutoLabs website |
| Run date | 2026-11-09 |
| Environment | Managed project Preview and local Node.js runtime |
| Deployment status | Source and Vercel configuration prepared; no production deployment performed |

## Results

| Area | Result | Evidence / scope |
| --- | --- | --- |
| Automated tests | Pass — 14/14 | `npm test`: method/field validation, oversized payload, honeypot, missing provider config, mocked provider success/failure, six crawlable pages, page metadata, route manifest, portfolio labels, required service content, form wiring, local routes/anchors/assets, and no hard-coded production domain. |
| JavaScript syntax | Pass | `node --check` on `api/contact.js`, `dev-server.js`, `scripts/build.js`, and `assets/js/site.js`. |
| Static build | Pass | `npm run build` produced all six page documents, assets, `manus-routes.json`, `robots.txt`, and `sitemap.xml` in `dist/`. |
| Domain-aware SEO build | Pass with a reserved example-only origin | Built using `SITE_URL=https://example.invalid`; verified page-specific canonical metadata, absolute Open Graph/Twitter image URLs, and six absolute sitemap entries. `example.invalid` is reserved for testing and is not a production domain. |
| Build without production origin | Pass | With `SITE_URL` unset, the build omits canonical and absolute social URL metadata and sitemap page entries instead of guessing a domain. XML remains valid and crawlable `robots.txt` is generated. |
| Live Preview routes/assets | Pass | All six page routes and core CSS, JavaScript, SVG, social-card PNG, and route-manifest endpoints returned HTTP 200. The route manifest lists exactly the six public pages. |
| Navigation and CTA | Pass for the primary “Explore Our Work” CTA | In the Preview browser, clicked the CTA; it opened `/projects/`, not Services. Automated checks resolve local page, fragment, and asset links. |
| Responsive layouts | Visual check completed | Full-page captures of all six pages reviewed at desktop (1280 px), tablet (768 px), and mobile (375 px) widths. Forms, navigation, cards, content flow, and footer stack appropriately in the captured views; no broken imagery or evident horizontal overflow was seen. |
| Mobile menu | Interaction-state check passed | Preview browser toggled open/closed state; `aria-expanded` and `.menu-open` matched. Mobile captures show the compact menu control. |
| Client-side form validation | Pass | Empty form was blocked by native validation; valid synthetic test data and consent passed client validation. |
| Server-side email function | Logic pass; production delivery not configured | Tests mock Resend responses and verify server-side forwarding, input validation, output escaping, success only after provider confirmation, and provider-error behavior. No real email was sent. |
| Live Preview form response | Honest configuration error verified | A valid synthetic test enquiry reached the endpoint; absent email settings produced the displayed “Email delivery is not configured yet” error instead of a false success. |
| Accessibility/source review | Key checks pass; not a formal audit | Semantic landmarks, primary headings, skip link, labelled navigation/form fields, visible focus styling, menu keyboard handling, live form status, native `<details>` FAQ, and reduced-motion CSS were reviewed. No formal WCAG certification or automated axe scan is claimed. |

## Production blockers

The form cannot deliver real enquiries until Vercel has `RESEND_API_KEY` and a verified `RESEND_FROM`, followed by a real end-to-end send test. Canonicals, absolute social-image URLs, and populated sitemap entries require the true production HTTPS origin in `SITE_URL`. See [README.md](README.md) and [PLACEHOLDERS.md](PLACEHOLDERS.md) for exact setup steps and outstanding inputs.
