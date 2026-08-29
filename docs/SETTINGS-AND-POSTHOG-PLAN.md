# Housora settings and PostHog plan

## Recommended settings architecture

Use a dedicated settings page on desktop and a full-screen sheet on mobile. Keep seven sections; avoid putting destructive actions beside everyday preferences.

### 1. Profile

- Full name
- Profile image: upload, replace, remove
- Primary email and verification status
- Add or change email through Clerk’s verified flow
- Password, passkeys, connected sign-in methods, and active sessions through Clerk
- Language and time zone
- Sign out everywhere

### 2. Studio

- Studio or organization name
- Logo
- Professional role
- Default project type: interior, exterior, or garden
- Default currency and measurement system
- Default export format and resolution
- Brand information for client exports

### 3. Team and permissions

- Members and pending invitations
- Roles: owner, admin, designer, reviewer/viewer
- Per-project access where needed
- Transfer ownership
- Remove or suspend member
- Activity/audit history for permission and billing changes

Do not display this section to personal workspaces until team collaboration is fully implemented.

### 4. AI and generation preferences

- Default image quality and aspect ratio
- Default reference fidelity: literal, balanced, creative
- Structure-protection default
- Standard or high-detail 3D preference with the credit cost shown
- Confirm before an operation consuming more than a configurable credit threshold
- Content-safety explanation and AI-output limitations
- Optional consent for using private content to improve Housora; off by default and separate from service processing

### 5. Notifications

- Essential service and security messages: always on where required
- Generation completed or failed
- Credit balance low
- Subscription renewal and payment failure
- Project invitation, comment, and approval
- Product updates and marketing: optional consent with unsubscribe
- Email and in-app controls separately

### 6. Billing and credits

- Current plan, renewal date, and cancellation
- Monthly and purchased credit balances shown separately
- Clear expiry dates
- Usage history by operation, date, project, and credits
- Buy credits and optional low-balance auto top-up with a spending cap
- Payment method and billing details through the payment provider
- Invoices, receipts, tax information, and refund/support entry point
- A price preview before every billable generation

### 7. Privacy, data, and security

- Analytics consent
- Session replay consent separately from analytics where required
- Cookie preferences and consent history
- Download/export account and project data
- Delete individual projects and files
- Delete account with reauthentication, impact summary, and confirmation
- Data-retention summary
- List of subprocessors and processing regions
- Privacy request/contact link
- Privacy Policy, Terms, acceptable-use rules, and third-party licenses
- Active devices/sessions and security alerts

## Save behavior

- Save each section independently and show a durable success message.
- Warn before leaving with unsaved changes.
- Reauthenticate for email, password, ownership, payment, export, and deletion changes.
- Never show a success state unless the backend mutation has completed.
- Maintain an audit record for consent, role, ownership, billing, and deletion changes.

## PostHog: what Housora should collect

### User properties

Collect only properties useful for product decisions:

- Internal user ID from Clerk, not a raw secret or password
- Account creation date
- Country or region at coarse level
- Language, time zone, currency, and measurement preference
- Workspace type: personal or studio
- Role: owner, admin, designer, viewer
- Plan: free, creator, studio
- Subscription state: trialing, active, past due, cancelled
- Credit-balance band, such as 0, 1–10, 11–50, 51–150, 151+
- Onboarding completed and first-value date

Do not set prompt text, room images, masks, 3D files, billing card information, precise addresses, client names, project names, or sensitive profile data as PostHog person properties.

### Core custom events

| Event | Safe properties |
|---|---|
| `account_created` | signup method, referral source |
| `onboarding_completed` | steps completed, elapsed-time band |
| `project_created` | project type, source: upload/example/reference |
| `image_uploaded` | file type, size band, dimensions band; never filename or image URL |
| `generation_started` | mode, style category, quality, aspect ratio, credits quoted |
| `generation_completed` | provider/model alias, duration band, credits charged, success |
| `generation_failed` | provider/model alias, error code category, retryable; never raw provider response |
| `details_opened` | mode |
| `detail_selected` | detail category and safe option value |
| `edit_tab_opened` | mode, object-count band |
| `object_selected` | normalized object category, not mask or image data |
| `segmentation_completed` | object category, duration band, success |
| `object_edit_completed` | object category, duration band, credits charged, success; never prompt |
| `design_saved` | mode, source |
| `design_downloaded` | format, resolution |
| `design_shared` | channel category, permission level; never recipient address |
| `3d_generation_started/completed/failed` | quality, duration band, credits, error category |
| `ar_opened` | device class, AR mode, model-source category |
| `credits_viewed` | balance band, plan |
| `credit_pack_purchased` | pack, currency, amount; never card data |
| `subscription_started/changed/cancelled` | plan, interval, reason category |
| `settings_changed` | section and field name; never the entered value for personal fields |
| `privacy_choice_changed` | consent category and granted/denied, policy version |
| `account_export_requested` | scope |
| `account_deletion_requested/completed` | reason category and completion state |

### Funnels and product questions

Create these dashboards:

1. Signup → first project → first upload → first successful generation → first save.
2. First generation → second project within seven days.
3. Free credit use → pricing viewed → checkout started → subscription activated.
4. Edit opened → object selected → segmentation succeeded → object edit succeeded.
5. Image saved → 3D generated → AR opened.
6. Failure rate and latency by provider/model alias, device class, and feature.
7. Retention by first successful workflow: image only, object edit, or 3D/AR.

### Session replay rules

- Obtain consent where required before recording.
- Mask all text inputs by default.
- Block or exclude the canvas, uploaded images, generated images, thumbnails, masks, model viewer, payment UI, account/profile fields, support messages, and project/client names.
- Do not record password, authentication, billing, privacy-request, or account-deletion screens.
- Sample replays rather than recording every user; start at 10% of eligible sessions.
- Retain replays for no more than 30 days at launch.
- Give the user a separate Settings control to disable replay.
- Restrict replay access to named personnel and log administrative access.

### Data governance

- Use an event-name and property allowlist instead of sending arbitrary component text.
- Turn off broad autocapture until sensitive elements are explicitly excluded; custom events are safer for the editor.
- Identify a user only after sign-in, and reset PostHog identity on sign-out.
- Respect consent before analytics initialization in regions requiring opt-in.
- Honor Global Privacy Control if Housora uses any practice classified as sale or sharing.
- Define a 12–24 month analytics retention limit and a 30-day replay limit.
- Keep production and development PostHog projects separate.
- Do not expose a PostHog personal API key in browser code; only the public project key belongs client-side.
- Review the tracking plan quarterly and remove events that do not drive a decision.

## Legal and launch dependencies

Before launching Settings, Housora still needs:

- confirmed legal entity, address, support/privacy/legal emails, and governing law;
- a cookie/consent manager matched to launch regions;
- signed or accepted Data Processing Agreements with relevant processors;
- a subprocessor list and transfer-mechanism review;
- implemented data export, project deletion, account deletion, and consent withdrawal;
- actual retention jobs in Convex and providers, not policy text alone;
- a security incident and breach-notification procedure;
- an age policy and enforcement decision;
- a refund/cancellation flow that matches the checkout and local consumer law; and
- legal review before publishing the Privacy Policy and Terms.
