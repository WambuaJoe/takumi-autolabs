# Takumi AutoLabs website

A multi-page, static-first website for **Takumi AutoLabs — Business Systems Implementation & Automation**. The source uses HTML5, CSS3, vanilla JavaScript, and a small Node.js serverless function for contact-form email delivery.

The visual identity follows the approved **Calm Operational Intelligence** direction: Carbon, Slate, Chalk, Fog, Signal Amber, Flow Sage, and Connection Teal; Manrope and IBM Plex Mono; restrained borders and connected-system diagrams; and the approved connected-core mark. It avoids generic AI imagery and unsupported business claims.

The handoff includes a concise [brand implementation guide](BRAND.md), [production-input checklist](PLACEHOLDERS.md), and [verification report](TESTING.md).

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | Static homepage with the approved hero, clearly labelled illustrative dashboard, operational challenges, service overview, demonstration project, and implementation process. |
| `services/`, `how-we-work/`, `projects/`, `about/`, `contact/` | Crawlable, individual page documents, each with its own title and description. |
| `assets/css/site.css` | Responsive visual system, page layouts, interaction states, and reduced-motion/accessibility styles. |
| `assets/js/site.js` | Accessible mobile menu and progressively enhanced contact form submission. Page copy remains in HTML. |
| `assets/logo.svg`, `assets/favicon.svg` | Approved connected-core mark and site favicon. |
| `api/contact.js` | Vercel Node.js function that validates contact submissions and forwards them to Takumi’s email through Resend. Secrets stay server-side. |
| `dev-server.js` | Dependency-free local web server for the static pages and contact endpoint. |
| `scripts/build.js` | Copies the static site to `dist/`; when `SITE_URL` is configured, generates canonical/social image metadata and an absolute-URL sitemap. |
| `manus-routes.json` | Preview route manifest for the six public pages. |
| `tests/` | Built-in Node tests for site requirements and the contact endpoint. Tests mock email delivery and never send a real message. |
| `vercel.json` | Vercel build output, contact-function duration, and baseline response headers. |

## Local development

Requires Node.js 20 or newer; there are no npm dependencies.

```sh
npm run dev
```

The local site listens on port 3000 (or the `PORT` environment value). Open `http://localhost:3000`. The static pages and `GET /manus-routes.json` are served locally. Contact submissions return a clear configuration error until the email provider variables are set. No live emails are sent by the automated tests.

```sh
npm test
npm run build
```

A build without a configured domain deliberately omits absolute canonical URLs, `og:url`, absolute social-image URLs, and sitemap page entries. That avoids inventing a production domain. The XML sitemap and `robots.txt` are still generated. To verify the configured-origin output locally, use a reserved example-only origin, not as a production setting:

```sh
SITE_URL=https://example.invalid npm run build
```

## Vercel deployment

1. Import the repository into Vercel or deploy it through the Vercel CLI. Select **Other** as the framework preset if asked. The repository includes `vercel.json` with `npm run build` and `dist` as the output directory.
2. Connect the real production domain in Vercel, then set `SITE_URL` to that actual HTTPS origin in the applicable Vercel environments. Do not use a preview URL or the example domain as the production origin. Rebuild after setting it; page-specific canonicals, `og:url`, absolute social image URLs, `sitemap.xml`, and the sitemap reference in `robots.txt` are emitted from that configured origin.
3. In Resend, verify a sending domain you control before choosing a sender. In Vercel Project Settings → Environment Variables, add `RESEND_API_KEY`, `CONTACT_EMAIL`, and `CONTACT_FROM_EMAIL`. Set `CONTACT_EMAIL` to `takumiautolabs@gmail.com`. Set `CONTACT_FROM_EMAIL` to the exact email address on your Resend-verified domain; no sender address is assumed here. Keep the API key server-side. Do not use a `NEXT_PUBLIC_` or `VITE_` prefix and do not add credentials to HTML, frontend JavaScript, or committed files.
4. Select Production for the live site. Add Preview/Development only if you intentionally want test submissions in those environments to send real email. These submissions go to the configured `CONTACT_EMAIL` inbox.
5. Save the environment variables and redeploy the latest commit from Vercel’s Deployments page (or run a new Vercel deployment). Vercel applies changed environment variables to new deployments. After deployment, submit one real test enquiry and confirm the message reaches `CONTACT_EMAIL` with the submitter’s address as Reply-To. Do not treat a mocked test as proof of real delivery.

The form posts to `/api/contact`. It includes server-side field validation, input sanitization, an off-screen honeypot, a 12 KB body limit, output escaping, and Resend idempotency-key handling to reduce duplicate email sends. The browser reuses the key for unchanged retries; Resend documents the `Idempotency-Key` header and a 24-hour retention window in its [official documentation](https://resend.com/docs/dashboard/emails/idempotency-keys). The handler does not log enquiry content or expose provider credentials. When any required email variable is missing or invalid, it returns a clear configuration error and keeps the direct email fallback. Resend responses that do not confirm an accepted email ID produce an error, not success.

## Production placeholders to resolve

- The real production domain: connect it in Vercel and provide it as `SITE_URL` before final canonical, social-preview, and sitemap output is generated.
- Email delivery: configure `RESEND_API_KEY`, `CONTACT_EMAIL`, and a `CONTACT_FROM_EMAIL` address from a Resend-verified domain in Vercel. The form is not operational until these are set and real delivery is verified.
- Confirm the post-submission expectation and email handling fit Takumi AutoLabs’ actual business process. Current copy says Takumi will review and follow up by email; it does not state an unverified response time.
- No team bios, credentials, client references, client deployments, testimonials, measured case-study results, or company history were supplied, so none are claimed. Add them only when verified and approved for publication.

## SEO and content notes

Each public page has meaningful HTML, a unique title and meta description, Open Graph title/description/site name, Twitter card metadata, internal links, and relevant structured data without fabricated addresses or credentials. The build inserts absolute URL metadata only from an explicit HTTPS `SITE_URL`. The route list, `sitemap.xml`, and `robots.txt` cover the six public pages; `/api/contact` is not an indexable page. Canonicals and sitemap entries require the production origin to be set.

The dashboard values are fictional and visibly labelled **“ILLUSTRATIVE OPERATIONS DASHBOARD · SAMPLE DATA”**. The Projects page explicitly describes its ERP portfolio as an illustrative demonstration, not a verified client implementation or result.

## Accessibility and performance notes

Content is present in static HTML. Navigation has a skip link, labelled landmarks, a keyboard-operable mobile menu, active-page state, and visible focus. Form controls have explicit labels, browser validation, a live status region, and meaningful errors. Motion is restrained and reduced when requested. The site uses no front-end framework, package dependencies, stock photography, or animation library; its information visuals are light SVG/CSS treatments.
