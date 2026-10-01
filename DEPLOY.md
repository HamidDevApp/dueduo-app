# Launch checklist — First Pregnancy Planner

Work through the parts in order. Test everything first (Parts 1–4), then switch to live payments (Part 5).

---

## 0. Before you take real money

- [ ] **Terms, Privacy Policy and Refund Policy pages.** Stripe expects them to be reachable from your site. Link them in the footer (`src/components/landing/sections.tsx` → `SiteFooter`).
- [ ] **The guarantee matches your refund policy.** `SITE.guaranteeDays` in `src/lib/site-config.ts` is set to `14`. Change it, or set it to `null` to hide it.
- [ ] **Support email.** Set `NEXT_PUBLIC_SUPPORT_EMAIL`.
- [ ] **Medical review** of `src/lib/roadmap.ts`, `src/lib/scripts.ts` and `src/lib/budget.ts` by a midwife or doctor.
- [ ] **Tax.** You are selling a digital product internationally, which can create VAT/GST obligations (Swiss VAT, EU OSS, etc.). Either turn on **Stripe Tax** (Checkout supports it) or confirm your setup with an accountant.

---

## 1. Install and database

```bash
npm i stripe server-only
```

In the Supabase **SQL Editor**, run `supabase/migrations/0003_payments.sql`.

Your own test account won't have paid yet. To skip the paywall for yourself:

```sql
update public.profiles set has_access = true
where id = (select id from auth.users where email = 'YOU@EXAMPLE.COM');
```

---

## 2. Stripe (test mode first)

1. **Product catalog → Add product**
   - Name: `First Pregnancy Planner`
   - Price: **29.00 USD**, **One-off**
   - Copy the **Price ID** (`price_...`) into `STRIPE_PRICE_ID`.
2. **Developers → API keys:** copy the secret key (`sk_test_...`) into `STRIPE_SECRET_KEY`.
3. **Settings → Business → Customer emails:** turn on *Successful payments* so buyers get a receipt.
4. **Settings → Branding:** add your logo and brand color `#c0615a`.
5. **Optional: promo codes** (checkout already accepts them). Create a 100% coupon plus a promotion code, e.g. `FRIENDS`, for testers and influencers.

### Test the webhook locally with the Stripe CLI

```bash
stripe login
stripe listen --forward-to localhost:3001/api/stripe/webhook
# copy the "whsec_..." it prints into STRIPE_WEBHOOK_SECRET, then restart `npm run dev`
```

Then run through it yourself:

1. Log in with a **new** email and you should land on `/checkout`.
2. Pay with the test card `4242 4242 4242 4242`, any future date, any CVC.
3. You should go to `/onboarding`, and in Supabase `profiles.has_access` should now be `true`.
4. Refund the payment in the Stripe dashboard. `has_access` should go back to `false`, and the user is sent to `/checkout` again.

---

## 3. Supabase for production

1. **Project Settings → API keys:** copy the **secret key** (`sb_secret_...`, or the legacy `service_role` key) into `SUPABASE_SERVICE_ROLE_KEY`. It is server-only: never prefix it with `NEXT_PUBLIC_`.
2. **Custom SMTP (required).** Supabase's built-in email only reaches your own team members and is heavily rate-limited, so real customers would never get their login link.
   - Create a free account with an email provider (e.g. Resend or Postmark) and verify your domain (they give you the DNS records).
   - Go to **Authentication → Emails → SMTP Settings** and turn on custom SMTP. For Resend: host `smtp.resend.com`, port `465`, user `resend`, password = your API key. Sender: `hello@yourdomain.com`.
   - Under **Authentication → Rate limits**, raise the email limit, e.g. 100 per hour.
3. **Authentication → Emails → Templates → Magic Link:** brand the email. For example, subject "Your First Pregnancy Planner login link", with a warm one-line intro.
4. **Authentication → URL Configuration:**
   - **Site URL:** `https://yourdomain.com`
   - **Redirect URLs** (add all of these):
     - `https://yourdomain.com/**`
     - `http://localhost:3001/**`
     - `https://*-YOUR-VERCEL-TEAM.vercel.app/**` (for preview deployments)

---

## 4. Deploy to Vercel

1. Push the project to a **private** GitHub repo. `.env.local` is already gitignored, so never commit your keys.
2. **vercel.com → Add New → Project → Import** the repo. The framework is detected automatically (Next.js).
3. **Environment Variables:** add each of these for **Production** and **Preview**. Use Stripe **test** keys for Preview.

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | secret key |
   | `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` |
   | `NEXT_PUBLIC_SUPPORT_EMAIL` | `hello@yourdomain.com` |
   | `STRIPE_SECRET_KEY` | `sk_test_...` for now |
   | `STRIPE_PRICE_ID` | `price_...` (test) |
   | `STRIPE_WEBHOOK_SECRET` | from step 4.5 below |

4. **Deploy.** Then go to **Settings → Domains**, add `yourdomain.com` and `www.yourdomain.com`, and create the DNS records Vercel shows you at your registrar (Hostinger works fine).
5. **Stripe → Developers → Webhooks → Add endpoint:**
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`
   - Copy its **signing secret** into `STRIPE_WEBHOOK_SECRET` in Vercel, then **Redeploy**.

> `NEXT_PUBLIC_*` values are baked in at build time. After changing any of them, click **Redeploy**.

---

## 5. Go live

1. In Stripe, **activate your account** (business details and bank account), then switch to **Live mode**.
2. Create the product and **$29** price again in live mode. Live and test use separate IDs.
3. Add the **live webhook endpoint** (same URL and events as above) and copy its live signing secret.
4. In Vercel **Production** env vars, replace `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` and `STRIPE_WEBHOOK_SECRET` with the live values, then **Redeploy**.
5. **Production smoke test:**
   - [ ] The landing page loads on your phone, and sharing the link on WhatsApp shows the preview card.
   - [ ] Sign up with a real email and receive the magic link (this proves SMTP works).
   - [ ] Pay with a real card or a 100% promo code, land on onboarding, and finish it.
   - [ ] Invite a partner from a second email and check they see the shared plan.
   - [ ] Print a visit summary.
   - [ ] Refund your own test payment in Stripe.

---

## 6. First week after launch

- **Vercel → Analytics:** enable it for visits and conversion.
- **Stripe → Payments:** check the webhook shows `200` responses (Developers → Webhooks → your endpoint).
- **Ads:** point Meta and TikTok ads at `/`. Add your pixel and conversion event on `/onboarding` (only reached after payment) when you're ready.
- **Real testimonials:** once your first customers give permission, add them to the landing page. Never invent reviews.
