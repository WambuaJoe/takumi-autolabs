# Contact-form and website verification report

| | |
| --- | --- |
| Project | Takumi AutoLabs website |
| Run date | 2026-11-09 |
| Environment | Managed project Preview, local Node.js runtime, mocked Resend responses |
| Production delivery | Not tested; Vercel environment values were not changed and no real email was sent |

## Contact-form results

| Area | Result | Evidence / scope |
| --- | --- | --- |
| Automated tests | Pass — 24/24 | `npm test`; includes contact endpoint validation, malformed/empty inputs, size limit, honeypot, server configuration, sanitization, Resend accept/reject/network behavior, idempotency forwarding, six static routes, and client-side configuration/disclosure checks. |
| Successful provider response | Pass with mock | A simulated Resend 200 response with an email ID produced the success state. No real Resend request or email delivery is claimed. |
| Missing configuration | Pass | A synthetic valid POST to the restarted local endpoint returned HTTP 503 and the direct `takumiautolabs@gmail.com` fallback because `CONTACT_EMAIL` and `CONTACT_FROM_EMAIL` are not configured in this Preview. No email was sent. |
| Provider rejection and failure | Pass with mocks | Simulated Resend rejection, network failure, and an HTTP success response without an accepted email ID all produced failure responses, not success. |
| Input validation and sanitization | Pass | Required name/email/message/consent, malformed addresses, body size, control characters, HTML escaping, topic allowlist, and invalid recipient/sender settings are covered by tests. |
| Honeypot | Pass | A filled `website` field is rejected before Resend and never returns a success state. |
| Duplicate submission | Pass in browser + unit test | Two concurrent synthetic submits produced one fetch call; retrying unchanged fields reused the same key. The endpoint forwards `Idempotency-Key` to Resend. Resend documents duplicate suppression for 24 hours: [Idempotency Keys](https://resend.com/docs/dashboard/emails/idempotency-keys). |
| Mobile layout | Visual check completed | Contact page captured full-page at 375×812; form controls stack in one column, remain labelled/readable, and the contact fallback remains visible. No redesign was made. |
| Mobile/form interaction | Pass in sandbox Preview with mocked fetch | Empty submission was blocked by native validation. Loading/disabled state, single in-flight submit, retry-key reuse, server configuration error, and direct-email fallback were observed. The browser fetch was stubbed so no real email could be sent. |
| Source and build checks | Pass | `node --check` on the contact function, client JavaScript, Preview server, and build script; `npm run build` completed with `SITE_URL` unset. XML sitemap parsed, all six pages built, and no production origin was guessed. |
| Contact page disclosure | Pass | Removed the claim that delivery was already configured; the form retains its direct email fallback and the same fields/design. |

## Production items still required

In Vercel, set `RESEND_API_KEY`, `CONTACT_EMAIL` (`takumiautolabs@gmail.com`), and `CONTACT_FROM_EMAIL` (the exact sender address on a domain verified with Resend), then redeploy the latest commit. No sender address has been invented. A real end-to-end delivery test remains necessary after those values are set. See [README.md](README.md) and [PLACEHOLDERS.md](PLACEHOLDERS.md).
