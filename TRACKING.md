# Legal pages + conversion tracking: setup

The code is already in the project. This file covers the account settings only you can do.

---

## 1. Database (1 minute)

In the Supabase **SQL Editor**, run `supabase/migrations/0004_consent.sql`.

New users now tick a consent box at the last onboarding step, and the time they agreed is saved in `profiles.health_consent_at`. Pregnancy details count as health data, so this explicit consent is required.

Existing test accounts will see the checkbox the next time they open `/onboarding` (Settings → Edit).

---

## 2. Legal pages (before live payments)

1. Open `src/lib/site-config.ts` and fill in `SITE.legal`:
   - `operator`: your full legal name or company name
   - `address`: your business address
   - `governingLaw`: set to Switzerland; change it if your business is registered elsewhere
2. Set `NEXT_PUBLIC_SUPPORT_EMAIL` in Vercel. It appears on all legal pages.
3. Read `/terms`, `/privacy` and `/refund` on your site. Check that these promises match what you will actually do:
   - the **14-day guarantee**
   - **deletion within 30 days**
   - **no health data shared with ad platforms**
4. Have the final texts reviewed by a lawyer or a reputable policy service. They are a strong template, not legal advice.
5. **Stripe → Settings → Business → Public details:** add `https://dueduo.com/terms` and `https://dueduo.com/privacy`. Stripe Checkout will link to them.

---

## 3. Meta (Facebook / Instagram ads)

1. **Events Manager → Connect data sources → Web**, create a dataset (pixel) named "DueDuo", then copy the **Pixel ID**.
2. In that dataset: **Settings → Conversions API → Generate access token**, and copy the token.
3. **Business settings → Brand safety → Domains:** add and verify `dueduo.com` (a DNS TXT record at your registrar).
4. In Vercel, under **Environment Variables (Production)**:
   - `NEXT_PUBLIC_META_PIXEL_ID` = Pixel ID
   - `META_CAPI_ACCESS_TOKEN` = token
5. **Test it:**
   - In Events Manager, open **Test events** and copy the code.
   - Add `META_TEST_EVENT_CODE` to Vercel and redeploy.
   - Accept cookies on your site and make a test purchase. You should see **Purchase** from *Browser* **and** *Server*, marked **Deduplicated**.
   - Then **remove** `META_TEST_EVENT_CODE` and redeploy.

## 4. TikTok

1. **TikTok Ads Manager → Tools → Events → Web events → Set up web events → Manually**, then choose **Pixel + Events API**. Copy the **Pixel ID**.
2. In the pixel's **Settings → Events API**, generate an **access token**.
3. In Vercel:
   - `NEXT_PUBLIC_TIKTOK_PIXEL_ID` = Pixel ID
   - `TIKTOK_EVENTS_ACCESS_TOKEN` = token
4. Test the same way with `TIKTOK_TEST_EVENT_CODE`. The purchase event is called **CompletePayment**.

## 5. Vercel Analytics

In your Vercel project, open the **Analytics** tab and click **Enable**. It's cookieless, so it works without the banner. Then **Redeploy**.

> The cookie banner only appears once at least one pixel ID is set. `NEXT_PUBLIC_*` values are baked in at build time, so **redeploy after adding them**.

---

## What is tracked (only after "Accept")

| Event | When | Meta | TikTok |
|---|---|---|---|
| Page view | every page | `PageView` | `page` |
| Lead | magic link sent on `/login` | `Lead` | `SubmitForm` |
| Initiate checkout | `/checkout` page opened | `InitiateCheckout` | `InitiateCheckout` |
| Purchase | after payment: browser event on `/onboarding` **plus** server event from the Stripe webhook, sharing one event ID | `Purchase` | `CompletePayment` |

Notes:

- **Free orders aren't reported.** Purchases paid with a 100% promo code send no Purchase event.
- **The server event follows the visitor's choice.** It is only sent if they accepted cookies; that choice is stored on the Stripe checkout.
- **No pregnancy or health data** is ever sent to Meta or TikTok. The only identifiers sent are a hashed email, a hashed user ID, the IP address, the browser details and the platforms' own cookies.

## Final check

- [ ] An incognito visit shows the banner. Click **Decline**: in DevTools → Network there are no requests to `facebook` or `tiktok`.
- [ ] Click **Accept**: the Meta Pixel Helper browser extension shows `PageView`.
- [ ] A test purchase shows a deduplicated Purchase in Meta and TikTok test events.
- [ ] The footer links Terms, Privacy, Refunds and Cookie settings all work.
- [ ] `git add -A && git commit -m "Legal pages, consent banner, conversion tracking" && git push`
