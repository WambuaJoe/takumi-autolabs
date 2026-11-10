# Takumi AutoLabs website

A multi-page, static-first website for **Takumi AutoLabs — Business Systems Implementation & Automation**. The source uses HTML5, CSS3, and vanilla JavaScript. Contact enquiries submit directly from the browser to Web3Forms; there is no email backend, custom-domain requirement, or Vercel serverless function.

The visual identity follows the approved **Calm Operational Intelligence** direction: Carbon, Slate, Chalk, Fog, Signal Amber, Flow Sage, and Connection Teal; Manrope and IBM Plex Mono; restrained borders and connected-system diagrams; and the approved connected-core mark. It avoids generic AI imagery and unsupported business claims.

The handoff includes a concise [brand implementation guide](BRAND.md), [production-input checklist](PLACEHOLDERS.md), [contact-form implementation report](CONTACT-FORM-IMPLEMENTATION.md), and [verification report](TESTING.md).

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | Static homepage with the approved hero, clearly labelled illustrative dashboard, operational challenges, service overview, demonstration project, and implementation process. |
| `services/`, `how-we-work/`, `projects/`, `about/`, `contact/` | Crawlable, individual page documents, each with its own title and description. |
| `assets/css/site.css` | Responsive visual system, page layouts, interaction states, and reduced-motion/accessibility styles. |
| `assets/js/site.js` | Accessible mobile menu and asynchronous browser-side Web3Forms submission. Page copy remains in HTML. |
| `contact/index.html` | Existing contact form layout and fields, plus hidden Web3Forms integration fields. |
| `dev-server.js` | Dependency-free local static-file server. |
| `scripts/build.js` | Copies the static site to `dist/`; when `SITE_URL` is configured, generates canonical/social image metadata and an absolute-URL sitemap. |
| `manus-routes.json` | Preview route manifest for the six public pages. |
| `tests/` | Built-in Node tests for site requirements and mocked Web3Forms client responses. Automated tests never send email. |
| `vercel.json` | Static Vercel build output and baseline response headers; no serverless function configuration. |

## Contact form

The form submits to `https://api.web3forms.com/submit`. The provided Web3Forms access key is in a hidden input on the Contact page because Web3Forms’ documented static-site integration sends it from the browser. **This key is intentionally public and visible in page source and network requests; it is not a private server credential.** The key must be associated with the recipient inbox `takumiautolabs@gmail.com`.

The form forwards the existing **Name**, **Work email**, **Business**, **Area of interest**, **Enquiry message**, and **Consent** values. It sets a fixed subject, `New website enquiry — Takumi AutoLabs`, and explicitly sends the visitor’s email as Reply-To. The previous visual form fields and design are unchanged. The site retains its existing hidden website honeypot and includes Web3Forms’ hidden `botcheck` checkbox. The submit control locks while a request is processing. A success message appears only when Web3Forms returns a successful HTTP response with `success: true`; failures retain the direct email fallback.

Web3Forms notes that honeypots are less effective than CAPTCHA and recommends CAPTCHA for stronger protection. This implementation includes the requested botcheck and existing honeypot, but not an added CAPTCHA.

For the documented request fields and success response, see the [Web3Forms API reference](https://docs.web3forms.com/getting-started/api-reference), [Reply-To guide](https://docs.web3forms.com/getting-started/customizations/custom-reply-to), and [botcheck guidance](https://docs.web3forms.com/getting-started/customizations/spam-protection/spam-protection).

## Google Analytics

A single direct GA4 Google tag using Measurement ID `G-T8ZB559WEY` is installed immediately after `<head>` on each of the six public pages. It loads `gtag.js` and calls `gtag('config', 'G-T8ZB559WEY')` once per page. The separately supplied `GTM-5M2HBJWS` is a Tag Manager container ID; it is not installed, to avoid loading overlapping tags without a configured GTM plan.

No cookie-consent banner or privacy-policy update was added. Review the site’s analytics disclosure and consent requirements for the regions where the site operates before expanding tracking or advertising use. See Google’s [Measurement ID instructions](https://support.google.com/analytics/answer/12270356?hl=en) and [Google tag setup help](https://support.google.com/analytics/answer/9539598?hl=en).

## Local development

Requires Node.js 20 or newer; there are no npm dependencies.

```sh
npm run dev
```

The local site listens on port 3000 (or the `PORT` environment value). Open `http://localhost:3000`. The static pages and `GET /manus-routes.json` are served locally.

```sh
npm test
npm run build
```

Automated tests stub the browser’s network request and do not submit email. One clearly labelled synthetic Preview submission has since received `success: true` from Web3Forms. A focused Gmail search for the exact test token and subject did not find the message, so actual delivery to `takumiautolabs@gmail.com` remains unconfirmed.

A build without a configured domain deliberately omits absolute canonical URLs, `og:url`, absolute social-image URLs, and sitemap page entries. That avoids inventing a production domain. The XML sitemap and `robots.txt` are still generated. To verify the configured-origin output locally, use a reserved example-only origin, not as a production setting:

```sh
SITE_URL=https://example.invalid npm run build
```

## Vercel deployment

1. Deploy the static repository to Vercel using **Other** as the framework preset if asked. The repository config runs `npm run build` and serves `dist/`.
2. No custom domain, email-provider environment variable, serverless function, or separate backend is required for the contact form. Its Web3Forms access key is already in the Contact page. `SITE_URL` is only for SEO metadata and sitemap URLs; the contact form works on the default Vercel domain.
3. After updating the source, deploy the latest commit through the connected GitHub branch or Vercel. After the deployment is ready, submit one synthetic test enquiry and verify it reaches `takumiautolabs@gmail.com` with the visitor’s address as Reply-To.

## Production placeholders to resolve

- The final production domain is still optional for the form. Connect the real HTTPS domain and set `SITE_URL` only if absolute canonical, social-preview, and sitemap URLs are required.
- Confirm the supplied Web3Forms access key is configured for `takumiautolabs@gmail.com` by completing a real test submission and verifying inbox receipt.
- Confirm the post-submission expectation and email handling fit Takumi AutoLabs’ actual business process. Current copy says Takumi will review and follow up by email; it does not state an unverified response time.
- No team bios, credentials, client references, client deployments, testimonials, measured case-study results, or company history were supplied, so none are claimed. Add them only when verified and approved for publication.

## SEO and content notes

Each public page has meaningful HTML, a unique title and meta description, Open Graph title/description/site name, Twitter card metadata, internal links, and relevant structured data without fabricated addresses or credentials. The build inserts absolute URL metadata only from an explicit HTTPS `SITE_URL`. The route list, `sitemap.xml`, and `robots.txt` cover the six public pages. Canonicals and sitemap entries require the production origin to be set.

The dashboard values are fictional and visibly labelled **“ILLUSTRATIVE OPERATIONS DASHBOARD · SAMPLE DATA”**. The Projects page explicitly describes its ERP portfolio as an illustrative demonstration, not a verified client implementation or result.

## Accessibility and performance notes

Content is present in static HTML. Navigation has a skip link, labelled landmarks, a keyboard-operable mobile menu, active-page state, and visible focus. Form controls have explicit labels, browser validation, a live status region, and meaningful loading/errors. Motion is restrained and reduced when requested. The site uses no front-end framework, package dependencies, stock photography, or animation library; its information visuals are light SVG/CSS treatments.
