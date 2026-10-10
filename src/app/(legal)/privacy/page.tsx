import type { Metadata } from "next";
import { CookieSettingsButton } from "@/components/consent/consent-banner";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  const { operator, address } = SITE.legal;
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`Your pregnancy is personal. This policy explains what ${SITE.name} collects, why, who helps us process it, and the choices you have. We never sell your data.`}
    >
      <LegalSection title="1. Who is responsible">
        <p>
          {operator}, {address} (“we”) is the controller of your personal data. Contact:{" "}
          <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. What we collect">
        <ul>
          <li><strong>Account:</strong> your email address and sign-in records.</li>
          <li>
            <strong>Your plan:</strong> what you enter — due date, names, hospital, appointments, questions and answers,
            symptoms, budget, leave and income figures, registry and checklist items.{" "}
            <strong>Pregnancy and symptom details are health information</strong>, which we process only with your explicit
            consent.
          </li>
          <li><strong>Co-Pilot:</strong> the partner&apos;s email and anything they add to the shared plan.</li>
          <li>
            <strong>Payment:</strong> Polar sells {SITE.name} to you as our merchant of record and processes your payment.
            We receive the amount, currency, status and your email — never your card number.
          </li>
          <li><strong>Technical:</strong> basic logs (such as IP address and browser) needed to run and secure the service.</li>
          <li><strong>Advertising cookies:</strong> only if you accept them (see section 7).</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Why we use it (legal bases)">
        <ul>
          <li><strong>To provide the service you bought</strong> — performance of our contract with you.</li>
          <li><strong>To store your pregnancy and health information</strong> — your explicit consent, given during setup.</li>
          <li><strong>To measure our advertising</strong> — your consent via the cookie banner.</li>
          <li><strong>To keep the service secure and prevent fraud</strong> — our legitimate interests.</li>
          <li><strong>To keep payment and accounting records</strong> — legal obligations.</li>
        </ul>
        <p>We never use your health information for advertising, and never sell or rent your data.</p>
      </LegalSection>

      <LegalSection title="4. Who processes data for us">
        <ul>
          <li><strong>Supabase</strong> — database and sign-in.</li>
          <li><strong>Vercel</strong> — website hosting and privacy-friendly, cookieless visit statistics.</li>
          <li>
            <strong>Polar</strong> — our merchant of record: it handles checkout, payment, receipts, sales tax and refunds,
            as an independent controller under its own privacy policy.
          </li>
          <li><strong>Our email provider</strong> — sending sign-in links and service emails.</li>
          <li>
            <strong>Meta and TikTok</strong> — only if you accept advertising cookies. If you buy, we tell them a purchase
            happened (with your email in hashed, unreadable form) so we can measure our ads. No pregnancy or health details
            are ever shared.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. International transfers">
        <p>
          Some providers process data outside Switzerland and the EU/EEA, for example in the United States. Where this
          happens, we rely on recognised safeguards such as the European Commission&apos;s Standard Contractual Clauses and,
          where applicable, the EU-US and Swiss-US Data Privacy Frameworks.
        </p>
      </LegalSection>

      <LegalSection title="6. How long we keep it">
        <p>
          We keep your plan while your account is active. When you ask us to delete your account, we delete your plan data
          within 30 days. Payment records are kept as long as accounting law requires (up to 10 years).
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="7. Cookies">
        <ul>
          <li>
            <strong>Essential (always on):</strong> keep you signed in and remember your cookie choice (
            <code>sb-…</code>, <code>dd_consent</code>).
          </li>
          <li><strong>Statistics:</strong> Vercel Analytics counts visits without cookies or personal profiles.</li>
          <li>
            <strong>Advertising (only with consent):</strong> Meta Pixel (<code>_fbp</code>, <code>_fbc</code>) and TikTok
            Pixel (<code>_ttp</code>, <code>dd_ttclid</code>) measure whether our ads lead to sign-ups and purchases.
          </li>
        </ul>
        <p>
          You can change your choice at any time:{" "}
          <CookieSettingsButton className="font-semibold text-brand-strong underline-offset-2 hover:underline" />.
        </p>
      </LegalSection>

      <LegalSection title="8. Your rights">
        <p>
          You can ask for access to, a copy of, correction or deletion of your data, and you can withdraw consent at any time
          (this doesn&apos;t affect processing before withdrawal). Email{" "}
          <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> or use Settings → Request account deletion. You may
          also complain to a data protection authority — in Switzerland the FDPIC, in the EU your local authority.
        </p>
      </LegalSection>

      <LegalSection title="9. Security">
        <p>
          Data is encrypted in transit, access is restricted per account with database-level security rules, and only you and
          the Co-Pilot you invite can see your plan.
        </p>
      </LegalSection>

      <LegalSection title="10. Age">
        <p>{SITE.name} is intended for adults aged 18 or over.</p>
      </LegalSection>

      <LegalSection title="11. Changes">
        <p>We will update this page when our practices change and notify you of important changes.</p>
      </LegalSection>
    </LegalPage>
  );
}
