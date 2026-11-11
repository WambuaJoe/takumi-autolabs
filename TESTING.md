# Website, contact-form, and analytics verification report

| | |
| --- | --- |
| Project | Takumi AutoLabs website |
| Run date | 2026-11-11 |
| Environment | Managed Preview, local Node.js static server, mocked client tests, one synthetic Web3Forms submission, and consent-denied headless Chromium |
| Production | `https://takumi-autolabs.vercel.app/` |
| Inbox delivery | Not confirmed; see the exact Gmail-search result below |

## Contact-form results

| Area | Result | Evidence / scope |
| --- | --- | --- |
| Automated tests | Pass — 21/21 | `npm test`; covers required fields, field mapping, access-key presence without printing its value, subject/Reply-To, botcheck/honeypot, duplicate-submit locking, confirmed success, provider failure, static routes, analytics-tag presence, content, and disclosure. Automated tests never send email. |
| Web3Forms client acceptance | Pass | One clearly labelled synthetic Preview submission received HTTP success with `success: true`; the browser displayed the success state only after that response. No credential or request payload was printed. |
| Inbox delivery | Not confirmed | A focused Gmail search for the unique synthetic token and for the exact recipient/subject returned 0 threads in the connected mailbox. The message may be delayed, filtered, or the connected Gmail account may not be the target. No second test email was sent. |
| Required and invalid email | Pass | Native form validation blocked an empty submission and malformed email address in the browser; static tests verify required controls and `type=email`. |
| Bot protection | Pass | Existing `website` honeypot remains, and Web3Forms’ `botcheck` checkbox is included. Unit tests confirm the honeypot blocks sending. |
| Duplicate submission | Pass in unit test | The client ignores repeat submits while a request is processing and restores controls afterward. This is in-flight protection; no Resend idempotency header or endpoint remains. |
| Error handling | Pass in unit test | Mocked HTTP/provider rejection, network rejection, and unexpected responses show the error state with the direct email fallback; they do not show success. |
| Mobile layout | Visual check completed | The full Contact page was captured at 375×812 after the disclosure update. Form controls remain stacked and readable; no redesign was made. |
| Preview/runtime | Pass | `/contact/` and `/manus-routes.json` returned HTTP 200. The former `/api/contact` POST route returns HTTP 405 from the local static server. |
| Production form | Pass | `https://takumi-autolabs.vercel.app/contact/` and `/assets/js/site.js` returned HTTP 200 and contain the static integration; production `/api/contact` returns HTTP 404. |
| Source/build checks | Pass | `node --check` on `assets/js/site.js`, `dev-server.js`, and `scripts/build.js`; `npm run build` with `SITE_URL` unset; sitemap and robots output validated; `git diff --check` clean. |

## Analytics and deployment results

| Area | Result | Evidence / scope |
| --- | --- | --- |
| Static build | Pass | Built all six pages for Vercel. The regression suite requires exactly one direct GA4 loader/configuration and one GTM loader on Home, Services, How We Work, Projects, About, and Contact. |
| Production page source | Pass | All six production routes returned HTTP 200. Each response contained exactly one `G-T8ZB559WEY` loader, one matching `gtag('config', ...)` call, and one `GTM-5M2HBJWS` loader. |
| External script delivery | Pass | The direct GA4 and GTM JavaScript endpoints returned HTTP 200 from the production browser context. |
| Runtime initialization | Pass, consent denied | Headless Chromium loaded the production homepage with analytics consent set to denied and non-site third-party requests blocked. The GA4 config was queued in `dataLayer`; `window.google_tag_manager['GTM-5M2HBJWS']` was present. No measurement traffic was allowed by this test. |
| Analytics event receipt | Not checked | This confirms that the scripts and GTM container runtime load. It does not confirm that tags configured in the GTM account have been published or that GA4 received events. The GTM workspace and GA4 reports were not accessed. The user explicitly accepts potential duplicate tracking when GA4 is also configured inside GTM. |
| Repository / deployment | Pass | Private GitHub `main` was updated with the analytics installation and its connected Vercel deployment is live at `https://takumi-autolabs.vercel.app/`. |

The installed GTM code follows Google’s current one-part web-container snippet and omits the prior two-part body `<noscript>` iframe version. See Google’s [web-container installation instructions](https://support.google.com/tagmanager/answer/14847097?hl=en) and [data-layer documentation](https://developers.google.com/tag-platform/tag-manager/datalayer).

## Remaining delivery confirmation

The Web3Forms access key is a public client-side key and is embedded in the static Contact form. No Resend credential was retrieved or reused; the obsolete Resend environment declarations and function were removed. Please confirm whether the synthetic test notice reached `takumiautolabs@gmail.com` (including Spam) and verify that the visitor address is Reply-To. The connected Gmail search did not find the message, so inbox delivery is not yet confirmed.

The browser runtime check confirms that both Google scripts load and that the GTM container runtime initializes. A follow-up check in Google Tag Assistant / GTM Preview or GA4 Realtime is still needed to verify that any tags configured inside the user's GTM workspace publish events to the intended destination.

The contact integration follows the [Web3Forms API reference](https://docs.web3forms.com/getting-started/api-reference), [Reply-To guide](https://docs.web3forms.com/getting-started/customizations/custom-reply-to), and [spam-protection guidance](https://docs.web3forms.com/getting-started/customizations/spam-protection/spam-protection).
