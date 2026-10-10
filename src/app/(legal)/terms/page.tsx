import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  const { operator, address, governingLaw } = SITE.legal;
  return (
    <LegalPage
      title="Terms of Service"
      intro={`These terms are an agreement between you and ${operator} ("we", "us"), which operates ${SITE.name} at ${SITE.domain}. By creating an account or making a purchase, you agree to them.`}
    >
      <LegalSection title="1. What DueDuo is">
        <p>
          {SITE.name} is an online planning tool for expecting parents: a week-by-week roadmap, appointments, questions for
          your doctor, budget, registry and hospital-bag checklists, shared with a partner you invite (“Co-Pilot”).
        </p>
      </LegalSection>

      <LegalSection title="2. Not medical advice">
        <p>
          <strong>{SITE.name} is for organization only. It does not provide medical advice, diagnosis or treatment</strong>{" "}
          and does not replace your doctor, midwife or other healthcare professional. Timelines are general and vary by
          country, provider and pregnancy. Always follow your healthcare provider&apos;s guidance. In an emergency, contact
          your provider or local emergency services immediately.
        </p>
      </LegalSection>

      <LegalSection title="3. Your account">
        <ul>
          <li>You must be at least 18 years old to create an account.</li>
          <li>You sign in with a one-time email link. Keep access to your email account secure.</li>
          <li>You are responsible for the information you enter and for activity under your account.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Co-Pilot sharing">
        <p>
          When you invite a Co-Pilot, they can see and edit your shared plan, including pregnancy details you have entered.
          Only invite someone you trust. You can remove a Co-Pilot at any time in Settings; a Co-Pilot can also leave the
          plan. A Co-Pilot does not need to pay; their access depends on the plan owner&apos;s purchase.
        </p>
      </LegalSection>

      <LegalSection title="5. Price and payment">
        <ul>
          <li>
            Access costs a one-time payment of {SITE.price} ({SITE.currency}) unless shown otherwise at checkout. It is not a
            subscription and does not renew.
          </li>
          <li>
            Our order process is conducted by our online reseller Polar (polar.sh), who is the merchant of record for all
            orders. Polar handles payment, invoicing, sales tax and refunds, and its own terms of sale apply to the
            purchase. We never see or store your full card details.
          </li>
          <li>Applicable taxes are calculated by Polar based on your location and shown at checkout.</li>
          <li>
            Your purchase gives you personal, non-transferable access to {SITE.name} for as long as we operate the service.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Refunds">
        <p>
          See our <Link href="/refund">Refund policy</Link>.
          {SITE.guaranteeDays ? ` In short: a ${SITE.guaranteeDays}-day money-back guarantee.` : ""}
        </p>
      </LegalSection>

      <LegalSection title="7. Acceptable use">
        <ul>
          <li>Don&apos;t misuse the service, attempt to access other people&apos;s data, or disrupt its operation.</li>
          <li>Don&apos;t resell, copy or redistribute the content of {SITE.name} (roadmap, scripts, guides).</li>
          <li>We may suspend accounts that break these terms.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Your content and ours">
        <p>
          Information you enter stays yours. You allow us to store and process it only to provide the service, as described
          in our <Link href="/privacy">Privacy Policy</Link>. The {SITE.name} software, design and written content belong to
          us.
        </p>
      </LegalSection>

      <LegalSection title="9. Availability and changes">
        <p>
          We work hard to keep {SITE.name} available and accurate, but we cannot guarantee it will always be uninterrupted or
          error-free. We may improve or change features over time. If we ever shut the service down, we will give reasonable
          notice and a way to export your information.
        </p>
      </LegalSection>

      <LegalSection title="10. Liability">
        <p>
          To the extent permitted by law, our total liability to you is limited to the amount you paid us, and we are not
          liable for indirect or consequential losses. Nothing in these terms limits liability that cannot be limited by law,
          including your mandatory rights as a consumer.
        </p>
      </LegalSection>

      <LegalSection title="11. Ending your account">
        <p>
          You can stop using {SITE.name} at any time and ask us to delete your account from Settings or by emailing us.
        </p>
      </LegalSection>

      <LegalSection title="12. Governing law">
        <p>
          These terms are governed by the laws of {governingLaw}. If you are a consumer, you also keep the protection of the
          mandatory laws of your country of residence.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes and contact">
        <p>
          We may update these terms; we will notify you of material changes by email or in the app. Questions:{" "}
          <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> · {operator}, {address}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
