# Launch checklist — DueDuo

Production runs at **https://dueduo.com** on Vercel, with Supabase for sign-in and data and **Polar** for payments.
Polar is the merchant of record: it sells the product, handles VAT/sales tax and refunds, and sends receipts.

---

## 0. Before you take real money

- [x] **Terms, Privacy Policy and Refund Policy pages** are live and linked in the footer. They name Polar as merchant of record.
- [ ] **The guarantee matches your refund policy.** `SITE.guaranteeDays` in `src/lib/site-config.ts` is set to `14`. Change it, or set it to `null` to hide it.
- [ ] **Support inbox.** `NEXT_PUBLIC_SUPPORT_EMAIL` must be a mailbox you actually read (refund and deletion requests go there).
- [ ] **Medical review** of `src/lib/roadmap.ts`, `src/lib/scripts.ts` and `src/lib/budget.ts` by a midwife or doctor.
- [ ] **Legal review** of `/terms`, `/privacy` and `/refund`.
- [x] **Tax** is handled by Polar as merchant of record.

---

## 1. Install and database

```bash
npm install
```

In the Supabase **SQL Editor**, run the migrations in `supabase/migrations/` in order (`0001` → `0004`).

To skip the paywall for your own account:

```sql
update public.profiles set has_access = true
where id = (select id from auth.users where email = 'YOU@EXAMPLE.COM');
```

---

## 2. Polar

Use **sandbox.polar.sh** for local testing (with `POLAR_SERVER=sandbox`) and **polar.sh** for production. They have separate products, tokens and webhooks.

1. **Products → New product:** `DueDuo`, one-time price **$29**. Copy the product ID into `POLAR_PRODUCT_ID`.
2. **Settings → Developers → New token** with the `checkouts:read` and `checkouts:write` scopes. Copy it into `POLAR_ACCESS_TOKEN`.
3. **Settings → Webhooks → Add endpoint:**
   - URL: `https://dueduo.com/api/webhook/polar`
   - Events: `order.paid` and `order.refunded`
   - Copy its secret into `POLAR_WEBHOOK_SECRET`.
4. **Optional: discount codes** (checkout already accepts them). A 100% code is handy for testers and influencers. Free orders send no ad Purchase event.

How it works: the Unlock button creates a Polar checkout tagged with the user's ID (`src/app/checkout/actions.ts`). After payment, `/checkout/success` confirms it with Polar and the `order.paid` webhook does the same in the background. Either one sets `profiles.has_access = true` (`src/lib/billing.ts`). A full refund (`order.refunded`) sets it back to `false`.

---

## 3. Supabase for production

1. **Project Settings → API keys:** copy the **secret key** (`sb_secret_...`, or the legacy `service_role` key) into `SUPABASE_SERVICE_ROLE_KEY`. It is server-only: never prefix it with `NEXT_PUBLIC_`.
2. **Authentication → URL Configuration:**
   - **Site URL:** `https://dueduo.com`
   - **Redirect URLs:** `https://dueduo.com/**`, `http://localhost:3001/**`, and `https://*-YOUR-VERCEL-TEAM.vercel.app/**` for preview deployments.
3. **Custom SMTP with Resend (required).** Supabase's built-in email only reaches members of your Supabase team and is heavily rate-limited, so real customers would never get their login link.

   **a. Verify the domain in Resend**
   1. Sign up at resend.com, open **Domains → Add domain**, enter `dueduo.com` and pick the **EU (Ireland)** region.
   2. Resend shows 3–4 DNS records. In **Hostinger → Domains → dueduo.com → DNS / Nameservers → DNS records**, add each one exactly as shown:
      - **TXT** `resend._domainkey` (DKIM key)
      - **MX** `send` → `feedback-smtp.eu-west-1.amazonses.com`, priority `10`
      - **TXT** `send` → `v=spf1 include:amazonses.com ~all`
      - Recommended: **TXT** `_dmarc` → `v=DMARC1; p=none;`

      In Hostinger's *Name* field, enter only the part before `.dueduo.com` (e.g. `send`). These records sit on the `send` subdomain, so they don't touch your main mail (MX) records or the Vercel A/CNAME records.
   3. Back in Resend, click **Verify DNS records**. It usually turns green within minutes (up to a few hours).

   **b. Create an API key**
   - **API Keys → Create API key**, permission **Sending access**, domain `dueduo.com`. Copy it (it is shown once).

   **c. Connect it to Supabase**
   - **Authentication → Emails → SMTP Settings → Enable custom SMTP:**
     | Field | Value |
     |---|---|
     | Sender email | `hello@dueduo.com` (any address on dueduo.com) |
     | Sender name | `DueDuo` |
     | Host | `smtp.resend.com` |
     | Port | `465` |
     | Username | `resend` |
     | Password | the Resend API key |
   - **Authentication → Rate limits:** raise *Rate limit for sending emails* to about **100 per hour**.

   **d. Brand the email**
   - **Authentication → Emails → Templates → Magic Link:** subject `Your DueDuo login link`, with a warm one-line intro above the button.

   **e. Test it**
   - In a private window, sign up on dueduo.com with an email that is **not** on your Supabase team (e.g. a fresh Gmail). The link should arrive within a minute, and not in spam.
   - **Resend → Emails** shows each message and whether it was delivered.

---

## 4. Vercel

1. The GitHub repo is connected; every push to `main` deploys to production.
2. **Environment Variables (Production):**

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | secret key |
   | `NEXT_PUBLIC_SUPPORT_EMAIL` | your support address on dueduo.com |
   | `POLAR_ACCESS_TOKEN` | production token |
   | `POLAR_PRODUCT_ID` | production product ID |
   | `POLAR_WEBHOOK_SECRET` | production webhook secret |

   For **Preview**, use sandbox values and add `POLAR_SERVER=sandbox` and `NEXT_PUBLIC_SITE_URL`. Production always uses `https://dueduo.com` (`SITE.url` in `src/lib/site-config.ts`), so `NEXT_PUBLIC_SITE_URL` isn't needed there.
3. **Settings → Domains:** `dueduo.com` and `www.dueduo.com`, with DNS at Hostinger.

> `NEXT_PUBLIC_*` values are baked in at build time. After changing any of them, click **Redeploy**.

---

## 5. Production smoke test

- [x] Pay with a 100% discount code, land on onboarding, and check `has_access = true`.
- [ ] Sign up with an outside email and receive the magic link (proves SMTP works).
- [ ] The landing page loads on your phone, and sharing the link on WhatsApp shows the preview card.
- [ ] Invite a partner from a second email and check they see the shared plan.
- [ ] Print a visit summary.
- [ ] Refund a test order in Polar and check `has_access` goes back to `false`.

---

## 6. Before ads and the first week after launch

- **Tracking:** follow `TRACKING.md` (Meta, TikTok, Vercel Analytics). Test with a real paid order.
- **Polar → Webhooks:** check deliveries show `200`.
- **Real testimonials:** once your first customers give permission, add them to the landing page. Never invent reviews.
