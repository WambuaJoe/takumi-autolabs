# Remaining business and production inputs

The contact-form code and deployment instructions are implemented. The Vercel production environment still needs the values below; no sender address or production domain has been invented.

| Item | Needed from Takumi | Why it matters | Current state |
| --- | --- | --- | --- |
| Production domain | The final public HTTPS domain connected to the Vercel project | Set `SITE_URL` so each public page emits its absolute canonical, Open Graph URL/image, and sitemap URL. | Open |
| Resend API key | A Resend API key stored in Vercel as `RESEND_API_KEY` | Enables server-side delivery of contact enquiries. Keep it out of source code and client JavaScript. | Open in Vercel |
| Notification recipient | Set `CONTACT_EMAIL` to `takumiautolabs@gmail.com` in Vercel | Determines the inbox that receives website enquiry notifications. | Open in Vercel |
| Verified sender | Set `CONTACT_FROM_EMAIL` to the exact sender email address verified with Resend, on a domain you control | Resend must authorize the sender domain. No verified address has been guessed or supplied in this document. | Open |
| Environment scope | Decide whether email delivery should be enabled in Production only or also Preview/Development | Preview and Development submissions send real email when configured; choose scope intentionally. | Open |
| Contact/data notice | Confirm whether the current short notice is sufficient or supply Takumi’s approved privacy/data-handling notice | The contact page says details are used to respond and does not make an unsupported delivery claim. | Open |

In Vercel, open the project’s **Settings → Environment Variables**, add the three email variables with the exact names above, select the required environments, save them, and redeploy the latest commit. The form returns a configuration error and retains the direct email fallback until all three values are set. See [README.md](README.md) for the full deployment steps.

The public business email and discovery booking link are supplied and already implemented. Company history, team biographies, credentials, certifications, client names, testimonials, live deployments, and measured results were not supplied; they are intentionally absent.
