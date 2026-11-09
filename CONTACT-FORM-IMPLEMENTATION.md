# Contact-form implementation report

**Date:** 2026-11-10

## Change delivered

Replaced the Resend serverless form with a static browser-side integration at `https://api.web3forms.com/submit`. The existing contact-page design and six visible fields remain intact. The supplied Web3Forms access key is included in the hidden form field as required for this static integration; it is a public client-side key and is visible to visitors. No Resend credential was retrieved, copied, or reused, and the obsolete Resend environment declarations and `/api/contact` function were removed.

The form forwards name, work email, business, area of interest, enquiry message, and consent; sets the subject to **“New website enquiry — Takumi AutoLabs”**; and explicitly uses the visitor email as Reply-To. The existing website honeypot remains, and the documented Web3Forms `botcheck` field was added. Submissions are asynchronous, the form locks while a request is in progress, and success is shown only after an HTTP-success response with `success: true`. Provider/network errors retain the direct email fallback to `takumiautolabs@gmail.com`. The contact page now discloses that data is sent through Web3Forms.

## Verification

- **20/20 automated tests passed**, including field mapping, client-side success only after provider confirmation, provider/network errors, botcheck and honeypot behavior, duplicate-submit locking, page requirements, and secret isolation.
- JavaScript syntax checks and the dependency-free Vercel static build passed. The preview contact page and route manifest returned HTTP 200; the former `/api/contact` POST route returns HTTP 405.
- The contact page was visually reviewed at **375×812**; fields and labels remain readable in one column with no page redesign. Browser checks confirmed empty and malformed-email submissions are blocked.
- One synthetic submission through the Preview page returned Web3Forms `success: true`, and the client showed its success state only after that response. A narrowly scoped Gmail search for the exact test token/subject returned no message, so receipt in `takumiautolabs@gmail.com` is **not yet confirmed**. No second email was sent.

## Deployment and remaining check

The source is configured for static Vercel hosting; there is no email backend, custom-domain requirement, serverless function, or provider environment variable. The key must remain associated with `takumiautolabs@gmail.com`. After the updated GitHub `main` deploys, confirm the production Contact page shows the Web3Forms form, then verify the test notice in the target inbox (including Spam). A provider acceptance response alone is not proof of inbox receipt.

The field names, `success` response, Reply-To, and botcheck behavior follow the [Web3Forms API reference](https://docs.web3forms.com/getting-started/api-reference), [Reply-To guide](https://docs.web3forms.com/getting-started/customizations/custom-reply-to), and [spam-protection guidance](https://docs.web3forms.com/getting-started/customizations/spam-protection/spam-protection).