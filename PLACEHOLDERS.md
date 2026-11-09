# Remaining business and production inputs

The static Web3Forms integration is implemented without changing the Contact page layout. The user-provided access key is embedded in the form as required by Web3Forms’ browser-side flow; it is intentionally public. No custom domain, email backend, provider environment variable, or Vercel serverless function is required.

| Item | Needed | Why it matters | Current state |
| --- | --- | --- | --- |
| Web3Forms destination | The access key must deliver to `takumiautolabs@gmail.com` | Web3Forms associates the access key with the inbox that receives submissions. | Provider accepted one test; target inbox receipt not confirmed by Gmail search |
| Production deployment | Updated source on the connected private GitHub `main` branch | Vercel deploys the static build from the connected repository. | Pending final repository sync |
| Delivery confirmation | Confirm the synthetic test notice arrives in the target inbox and the visitor address is Reply-To | A successful provider response alone does not prove inbox receipt. | No matching message appeared in the connected Gmail search; check the target account and Spam |
| Production domain | A final public HTTPS domain, only if desired | Set `SITE_URL` for absolute canonical, Open Graph, and sitemap URLs. The form itself works on the default Vercel domain. | Optional / open |
| Contact/data notice | Confirm that the current short notice is sufficient or provide Takumi’s approved privacy/data-handling notice | The Contact page now explains that submissions are sent through Web3Forms to deliver the enquiry and advises visitors not to submit sensitive information. | Owner review recommended |

To change the Web3Forms key, replace the value of the hidden `access_key` input in `contact/index.html` and redeploy. Because Web3Forms requires a browser-side key for this integration, it is visible in page source and network requests by design. Do not place private credentials in the form.

No Resend integration, Resend environment dependency, or Vercel contact-function configuration remains. The public business email and discovery booking link are already implemented. Company history, team biographies, credentials, certifications, client names, testimonials, live deployments, and measured results were not supplied; they are intentionally absent.