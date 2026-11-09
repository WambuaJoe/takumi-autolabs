# Contact-form implementation report

**Date:** 2026-11-09

**Status:** Source implementation and mocked verification complete; production email delivery awaits Vercel configuration.

## What changed

The existing contact form design and fields remain unchanged. The Vercel-compatible `/api/contact` handler now sends enquiry notifications through Resend using server-only `RESEND_API_KEY`, `CONTACT_EMAIL`, and `CONTACT_FROM_EMAIL`. The handler validates and sanitizes fields, enforces the message size limit and topic allowlist, escapes HTML, rejects the existing honeypot, and returns a truthful configuration error with the direct-email fallback when required settings are absent or invalid.

The browser disables the form while a request is in flight, blocks concurrent submits, and uses a unique `Idempotency-Key`. Unchanged retries reuse the key; editing the enquiry creates a new key. Resend documents this header for duplicate suppression over a 24-hour window ([official documentation](https://resend.com/docs/dashboard/emails/idempotency-keys)). The client displays success only when the endpoint confirms Resend accepted an email and returned an email ID. Provider rejection, network failure, and missing configuration remain error states.

The contradictory copy claiming a configured email service has been removed. The direct address `takumiautolabs@gmail.com` remains visible as the fallback.

## Vercel configuration

In the Vercel project, open **Settings → Environment Variables** and configure:

- `RESEND_API_KEY`: the Resend API key; keep it server-side.
- `CONTACT_EMAIL`: `takumiautolabs@gmail.com`.
- `CONTACT_FROM_EMAIL`: the actual sender email address on a domain already verified with Resend. No sender address has been invented or assumed.

Select Production, and optionally Preview/Development only if those environments should send real email. Save the values and redeploy the latest commit; changed Vercel variables apply to new deployments. Then submit a real test enquiry and confirm it reaches the recipient inbox. The previously configured Manus Development variable named `RESEND_FROM` is not read by this version; this implementation uses the requested `CONTACT_FROM_EMAIL` name.

## Verification

`npm test` passes **24/24**. Tests cover required and malformed fields, empty input, sanitization, honeypot handling, missing/invalid environment values, mocked Resend acceptance/rejection/network error, absent acceptance ID, and idempotency-key forwarding. `node --check` and a clean static build pass.

The 375×812 contact-page capture shows the unchanged mobile layout. In the sandbox Preview, native required validation blocked an empty form; synthetic double submission made only one in-flight request; unchanged retry reused the same idempotency key; and the configuration error retained the direct-email fallback. Browser fetch was stubbed for that interaction check. A local synthetic POST returned the expected 503 because `CONTACT_EMAIL` and `CONTACT_FROM_EMAIL` are not set in Preview.

**No real email was sent, no Vercel environment values were changed, and successful live delivery has not been verified.** Until the three Vercel values are set and a real delivery test succeeds, the form is intentionally honest about missing configuration.
