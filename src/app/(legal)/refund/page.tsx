import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundPage() {
  const days = SITE.guaranteeDays;
  return (
    <LegalPage
      title="Refund Policy"
      intro={
        days
          ? `We want ${SITE.name} to make your pregnancy calmer. If it doesn't, you can get your money back within ${days} days — no hard feelings.`
          : `We want ${SITE.name} to make your pregnancy calmer. Here's how refunds work.`
      }
    >
      {days ? (
        <LegalSection title={`${days}-day money-back guarantee`}>
          <ul>
            <li>Ask within {days} days of your purchase for a full refund. You don&apos;t need to give a reason.</li>
            <li>
              Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> from your account email (or include it in
              your message).
            </li>
            <li>
              Refunds are issued through Polar, our merchant of record, to your original payment method, usually within
              5–10 business days depending on your bank.
            </li>
            <li>When a refund is issued, access to the plan ends for you and your Co-Pilot.</li>
          </ul>
        </LegalSection>
      ) : null}

      <LegalSection title="After the guarantee period">
        <p>
          Because {SITE.name} is digital content you can use immediately, purchases are not refundable after
          {days ? ` ${days} days` : " purchase"}, except where the law requires otherwise or if the service is not provided
          as described. If something isn&apos;t working, please contact us first — we&apos;re happy to help.
        </p>
      </LegalSection>

      <LegalSection title="Duplicate or unauthorised charges">
        <p>
          If you were charged twice or don&apos;t recognise a charge, email us right away and we will fix it promptly. The
          charge on your statement comes from Polar, which processes payments for {SITE.name}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
