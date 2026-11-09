# Remaining business and production inputs

The website source is complete, but these values or confirmations must be supplied by Takumi AutoLabs before the corresponding production features can be finalized.

| Item | Needed from Takumi | Why it matters | Current state |
| --- | --- | --- | --- |
| Production domain | The final public HTTPS domain connected to the Vercel project | Set `SITE_URL` so each public page emits its absolute canonical, Open Graph URL/image, and sitemap URL. No domain has been invented or configured. | Open |
| Resend API key | A Resend API key stored as a Vercel environment variable named `RESEND_API_KEY` | Enables server-side delivery of contact enquiries. Keep it out of source code and client JavaScript. | Open |
| Verified sender | A verified sender address/string stored as `RESEND_FROM` in Vercel | Resend requires an authorized sending identity. Select an address on the verified sending domain. | Open |
| Environment scope | Decide whether real email delivery should be enabled in Production only or also Preview/Development | Keeps test environments from sending unintended enquiries. | Open |
| Contact/data notice | Confirm whether the current short notice is sufficient or supply Takumi’s approved privacy/data-handling notice | The contact page explains that data is used to respond and that email delivery uses a configured server-side service; no legal policy has been invented. | Open |

The public business email and discovery booking link are supplied and already implemented. Company history, team biographies, credentials, certifications, client names, testimonials, live deployments, and measured results were not supplied; they are intentionally absent. Add any such proof only after it is verified and approved for publication.
