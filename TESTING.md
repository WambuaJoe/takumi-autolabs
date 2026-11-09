# Contact-form and website verification report

| | |
| --- | --- |
| Project | Takumi AutoLabs website |
| Run date | 2026-11-10 |
| Environment | Managed Preview, local Node.js static server, mocked client tests, and one synthetic Web3Forms submission |
| Vercel deployment | Pending sync of the tested update to the connected private GitHub `main` branch |
| Inbox delivery | Not confirmed; see the exact Gmail-search result below |

## Contact-form results

| Area | Result | Evidence / scope |
| --- | --- | --- |
| Automated tests | Pass — 20/20 | `npm test`; covers required fields, field mapping, access-key presence without printing its value, subject/Reply-To, botcheck/honeypot, duplicate-submit locking, confirmed success, provider failure, static routes, content, and disclosure. Automated tests never send email. |
| Web3Forms client acceptance | Pass | One clearly labelled synthetic Preview submission received HTTP success with `success: true`; the browser displayed the success state only after that response. No credential or request payload was printed. |
| Inbox delivery | Not confirmed | A focused Gmail search for the unique synthetic token and for the exact recipient/subject returned 0 threads in the connected mailbox. The message may be delayed, filtered, or the connected Gmail account may not be the target. No second test email was sent. |
| Required and invalid email | Pass | Native form validation blocked an empty submission and a malformed email address in the browser; static tests verify required controls and `type=email`. |
| Bot protection | Pass | Existing `website` honeypot remains, and Web3Forms’ `botcheck` checkbox is included. Unit tests confirm the honeypot blocks sending. |
| Duplicate submission | Pass in unit test | The client ignores repeat submits while a request is processing and restores controls afterward. This is in-flight protection; Web3Forms does not use the retired Resend idempotency header. |
| Error handling | Pass in unit test | Mocked HTTP/provider rejection, network rejection, and unexpected responses show the error state with the direct email fallback; they do not show success. |
| Mobile layout | Visual check completed | The full Contact page was captured at 375×812 after the disclosure update. Form controls remain stacked and readable; no redesign was made. |
| Preview/runtime | Pass | `/contact/` and `/manus-routes.json` returned HTTP 200. The former `/api/contact` endpoint is absent; POST to that path returns HTTP 405 from the static server. |
| Source/build checks | Pass | `node --check` on `assets/js/site.js`, `dev-server.js`, and `scripts/build.js`; `npm run build` with `SITE_URL` unset; sitemap and robots output validated; `git diff --check` clean. |

## Remaining deployment check

The user-provided Web3Forms access key is a public client-side key and is embedded in the static Contact form. No Resend credential was retrieved or reused; the obsolete Resend environment declarations and function were removed. After the private GitHub `main` update triggers Vercel, verify the production page shows the updated form and have the target inbox owner confirm receipt (including Spam). The Gmail connector search did not find the synthetic test message, so do not claim inbox delivery yet.

The integration follows the [Web3Forms API reference](https://docs.web3forms.com/getting-started/api-reference), [Reply-To guide](https://docs.web3forms.com/getting-started/customizations/custom-reply-to), and [spam-protection guidance](https://docs.web3forms.com/getting-started/customizations/spam-protection/spam-protection).