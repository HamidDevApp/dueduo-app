import type { Metadata } from "next";
import Link from "next/link";
import { GuideCta, GuideHeader, Prose, SourceLink, Sources } from "@/components/guides/guide-parts";
import { MessageCard, MonthPicker, MonthProvider } from "@/components/guides/messages";
import { GUIDES, SOURCES, guideMetadata } from "@/lib/guides";

const guide = GUIDES.bossNews;
export const metadata: Metadata = guideMetadata(guide);

const h2 = "mt-14 font-display text-2xl font-semibold tracking-tight";
const h3 = "mt-8 font-display text-xl font-semibold";
const tip = "mt-2 px-1 text-sm text-muted";

export default function TellYourBossPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <GuideHeader guide={guide} />
      <Prose className="mt-6">
        <p>
          Telling work can feel bigger than telling family. It goes more smoothly with a plan: when to tell, what to say,
          and what to put in writing afterwards. Below are templates you can copy, for both of you.
        </p>
        <p>
          For the family announcement, labor updates and visitor messages, see our{" "}
          <Link href={GUIDES.messages.path}>guide to telling family and work</Link>.
        </p>
      </Prose>

      <h2 className={h2}>When to tell work</h2>
      <Prose className="mt-4">
        <p>
          There&apos;s no single right time. Many people wait until after their first-trimester scan. Some tell earlier,
          because they need time off for appointments or changes at work.
        </p>
        <p>What matters most are your leave notice rules. These depend on where you live and on your employer:</p>
        <ul className="list-disc space-y-2.5 pl-5">
          <li>
            <strong>US:</strong> if you qualify for{" "}
            <SourceLink source={SOURCES.dolFmla}>FMLA</SourceLink>, you can take up to 12 weeks of unpaid, job-protected
            leave. When the leave is foreseeable, you generally{" "}
            <SourceLink source={SOURCES.dolFmlaNotice}>must give 30 days&apos; notice</SourceLink>, or as soon as you can
            if that isn&apos;t possible. Separately, the{" "}
            <SourceLink source={SOURCES.eeocPwfa}>Pregnant Workers Fairness Act</SourceLink> requires employers with 15
            or more employees to provide reasonable accommodations for pregnancy-related limitations, unless it causes
            the employer undue hardship.
          </li>
          <li>
            <strong>Canada:</strong> maternity and parental benefits are paid through{" "}
            <SourceLink source={SOURCES.canadaEi}>Employment Insurance</SourceLink>, or the Québec Parental Insurance
            Plan in Quebec. For how much notice to give your employer, check your province&apos;s or territory&apos;s
            employment standards.
          </li>
          <li>
            <strong>Australia:</strong> check the notice rules for parental leave with the{" "}
            <SourceLink source={SOURCES.fairWork}>Fair Work Ombudsman</SourceLink>, and give your employer written notice
            in good time.
          </li>
        </ul>
        <p>Check your employee handbook or ask HR how much notice they need and what pay they offer.</p>
      </Prose>

      <h2 className={h2}>Before the conversation</h2>
      <Prose className="mt-4">
        <ul className="list-disc space-y-2.5 pl-5">
          <li>
            <strong>Read your leave policy:</strong> notice deadline, paid weeks, pay rate.
          </li>
          <li>
            <strong>Have a rough timeline:</strong> your due date, and roughly when you&apos;d like your leave to start.
          </li>
          <li>
            <strong>Think about handover:</strong> who could cover what. Managers relax when you arrive with a plan.
          </li>
        </ul>
      </Prose>

      <p className="mt-8 text-sm text-muted">
        The WhatsApp button opens WhatsApp with the message filled in, and nothing is sent until you press send.
      </p>
      <MonthProvider>
        <div className="mt-4">
          <MonthPicker />
        </div>

        <h2 className={h2}>Step 1: Ask for a private chat</h2>
        <MessageCard text="Hi, could we find 15 minutes this week for a private chat? I have some personal news to share, and I'd like to plan ahead together so the team is fully covered." />

        <h2 className={h2}>Step 2: What to say in the meeting</h2>
        <MessageCard text="I wanted to tell you in person: I'm pregnant, and the baby is due in [month]. I'm happy and committed to my work here, and I want to make the next months easy for the team. I'm planning to take leave from around [month], and I'll put together a handover plan. Could we go over the timeline together in the next few weeks?" />
        <p className={tip}>
          Tip: you don&apos;t have to share health details, only what&apos;s needed for scheduling and any changes you
          need at work.
        </p>

        <h2 className={h2}>Step 3: Follow up in writing</h2>
        <MessageCard
          text={
            "Subject: Following up on our conversation\n\nHi [name],\n\nThank you for taking the time to talk today. As discussed, I'm expecting a baby in [month], and I plan to start my leave around [date]. I'll send a handover plan by [date], and I'll confirm my exact dates once I have them. Please let me know if HR needs anything else from me.\n\nThank you,\n[your name]"
          }
        />
        <p className={tip}>Tip: keep a copy of this email and any replies.</p>

        <h3 className={h3}>If your company wants you to tell HR first</h3>
        <MessageCard text="Hi [HR name], I'm expecting a baby in [month] and would like to understand my leave options: the notice I need to give, the pay I'm eligible for, and the paperwork. Could we set up a time to talk? Thank you." />

        <h2 className={h2}>For the partner: asking for parental leave</h2>
        <MessageCard text="Hi, I wanted to let you know early that my partner and I are expecting a baby in [month]. I plan to take parental leave around that time, and I'll prepare a handover plan well in advance. Can we set up time to go over the dates?" />
      </MonthProvider>

      <p className="mt-8 text-sm text-muted">
        These templates are for planning, not legal advice. Leave rights differ by country, state, province and employer.
      </p>

      <h2 className={h2}>Worked out the money side yet?</h2>
      <Prose className="mt-4">
        <p>
          Your leave may be partly paid or unpaid. The{" "}
          <Link href={GUIDES.leaveCalculator.path}>parental leave calculator</Link> shows your income gap and what to save
          each month.
        </p>
      </Prose>

      <GuideCta guide={guide}>
        In DueDuo, both of you get a work and leave plan inside your week-by-week roadmap: when to read your policies,
        when to tell work, and when to file the paperwork, with these messages ready to send.
      </GuideCta>
      <Sources sources={[SOURCES.dolFmla, SOURCES.dolFmlaNotice, SOURCES.eeocPwfa, SOURCES.canadaEi, SOURCES.fairWork]} />
    </article>
  );
}
