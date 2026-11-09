# Contact-form and website verification report

| | |
| --- | --- |
| Project | Takumi AutoLabs website |
| Run date | 2026-11-10 |
| Environment | Managed Preview, local Node.js static server, mocked client tests, and one synthetic Web3Forms submission |
| Vercel deployment | Live at `https://takumi-autolabs.vercel.app/contact/`; page and script verified |
| Inbox delivery | Not confirmed; see the exact Gmail-search result below |

## Contact-form results

| Area | Result | Evidence / scope |
| --- | --- | --- |
| Automated tests | Pass — 20/20 | `npm test`; covers required fields, field mapping, access-key presence without printing its value, subject/Reply-To, botcheck/honeypot, duplicate-submit locking, confirmed success, provider failure, static routes, content, and disclosure. Automated tests never send email. |
| Web3Forms client acceptance | Pass | One clearly labelled synthetic Preview submission received HTTP success with `success: true`; the browser displayed the success state only after that response. No credential or request payload was printed. |
| Inbox delivery | Not confirmed | A focused Gmail search for the unique synthetic token and for the exact recipient/subject returned 0 threads in the connected mailbox. The message may be delayed, filtered, or the connected Gmail account may not be the target. No second test email was sent. |
| Required and invalid email | Pass | Native form validation blocked an empty submission and malformed email address in the browser; static tests verify required controls and `type=email`. |
| Bot protection | Pass | Existing `website` honeypot remains, and Web3Forms’ `botcheck` checkbox is included. Unit tests confirm the honeypot blocks sending. |
| Duplicate submission | Pass in unit test | The client ignores repeat submits while a request is processing and restores controls afterward. This is in-flight protection; no Resend idempotency header or endpoint remains. |
| Error handling | Pass in unit test | Mocked HTTP/provider rejection, network rejection, and unexpected responses show the error state with the direct email fallback; they do not show success. |
| Mobile layout | Visual check completed | The full Contact page was captured at 375×812 after the disclosure update. Form controls remain stacked and readable; no redesign was made. |
| Preview/runtime | Pass | `/contact/` and `/manus-routes.json` returned HTTP 200. The former `/api/contact` POST route returns HTTP 405 from the local static server. |
| Production | Pass | `https://takumi-autolabs.vercel.app/contact/` and `/assets/js/site.js` returned HTTP 200 and contain the new static integration; production `/api/contact` returns HTTP 404. |
| Source/build checks | Pass | `node --check` on `assets/js/site.js`, `dev-server.js`, and `scripts/build.js`; `npm run build` with `SITE_URL` unset; sitemap and robots output validated; `git diff --check` clean. |

## Remaining delivery confirmation

The Web3Forms access key is a public client-side key and is embedded in the static Contact form. No Resend credential was retrieved or reused; the obsolete Resend environment declarations and function were removed. The production site is live. Have the target inbox owner confirm the synthetic test notice arrives (including Spam) and verify the visitor address is Reply-To. The Gmail connector search did not find the message, so inbox delivery is not yet confirmed.

The integration follows the [Web3Forms API reference](https://docs.web3forms.com/getting-started/api-reference), [Reply-To guide](https://docs.web3forms.com/getting-started/customizations/custom-reply-to), and [spam-protection guidance](https://docs.web3forms.com/getting-started/customizations/spam-protection/spam-protection).