import type { Metadata } from "next";
import Link from "next/link";
import { GuideCta, GuideHeader, Prose, SourceLink, Sources } from "@/components/guides/guide-parts";
import { MessageCard, MonthPicker, MonthProvider } from "@/components/guides/messages";
import { GUIDES, SOURCES, guideMetadata } from "@/lib/guides";

const guide = GUIDES.messages;
export const metadata: Metadata = guideMetadata(guide);

const h2 = "mt-14 font-display text-2xl font-semibold tracking-tight";
const h3 = "mt-8 font-display text-xl font-semibold";

export default function TellFamilyAndWorkPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <GuideHeader guide={guide} />
      <Prose className="mt-6">
        <p>
          Some news is easy to share. Asking family to keep it quiet, telling your manager or saying no to hospital
          visitors is easier when the words are ready. Here are eight messages from DueDuo. Copy one, make it yours, and
          send it.
        </p>
      </Prose>
      <p className="mt-3 text-sm text-muted">
        The WhatsApp button opens WhatsApp with the message filled in, and nothing is sent until you press send.
      </p>

      <MonthProvider>
        <div className="mt-8">
          <MonthPicker />
        </div>

        <h2 className={h2}>Telling family</h2>
        <h3 className={h3}>Telling close family</h3>
        <MessageCard text="We have some news… we're expecting a baby in [month]! 🤍 We're telling just a few people for now, so please keep it between us until we share it more widely. We love you!" />
        <h3 className={h3}>Asking people to keep it quiet</h3>
        <MessageCard text="We're so happy you're excited with us! One small favor: please don't post or share the news yet. We'd love to announce it ourselves when the time is right. Thank you for understanding 🙏" />

        <h2 className={h2}>Telling work</h2>
        <Prose className="mt-4">
          <p>When you tell work is up to you, but notice rules for leave depend on where you live and work.</p>
          <ul className="list-disc space-y-2.5 pl-5">
            <li>
              <strong>UK, birthing parent:</strong>{" "}
              <SourceLink source={SOURCES.govMaternity}>
                at least 15 weeks before the due date, tell your employer when the baby is due and when you want your
                maternity leave to start
              </SourceLink>
              .
            </li>
            <li>
              <strong>UK, partner:</strong> at least 28 days before you want your paternity leave to start, tell your
              employer the start date and how long you&apos;ll take.{" "}
              <SourceLink source={SOURCES.govPaternity}>GOV.UK has the full rules</SourceLink>, including when to give the
              due date.
            </li>
            <li>
              <strong>US and elsewhere:</strong> check your employer&apos;s leave policy and your local rules for notice
              deadlines and pay. The{" "}
              <Link href={GUIDES.leaveCalculator.path}>parental leave calculator</Link> can help you plan the money.
            </li>
          </ul>
        </Prose>
        <h3 className={h3}>Birthing parent: asking your manager for a private chat</h3>
        <MessageCard
          text="Hi, could we find 15 minutes this week for a private chat? I have some personal news to share, and I'd like to plan ahead together so the team is fully covered."
          tip="Tip: book the meeting, share the news in person, then confirm your dates in writing by email and keep a copy."
        />
        <h3 className={h3}>Partner: telling your manager</h3>
        <MessageCard text="Hi, I wanted to let you know early that my partner and I are expecting a baby in [month]. I plan to take parental leave around that time, and I'll prepare a handover plan well in advance. Can we set up time to go over the dates?" />

        <h2 className={h2}>Before and after the birth</h2>
        <h3 className={h3}>Labor updates (send around week 37)</h3>
        <MessageCard text="Quick heads-up: when labor starts, we'll be switching our phones off to focus. Please don't worry if you don't hear from us. We'll message as soon as baby is here and we're ready to share. Thank you for giving us that space 💛" />
        <h3 className={h3}>No hospital visitors (send around weeks 36 to 37)</h3>
        <MessageCard
          text="We've decided to keep the hospital time just for the three of us, so we can rest and get to know our baby. We can't wait for you to meet them once we're settled at home. We'll let you know when we're ready for visits! 🤍"
          tip="Tip: let the partner send this one. It takes the pressure off the birthing parent."
        />
        <h3 className={h3}>Visiting at home</h3>
        <MessageCard text="We'd love for you to meet the baby! A few things that help us a lot right now: please message before coming, keep visits short (about 30 to 45 min), wash hands when you arrive, and stay home if you're feeling unwell. Bringing a snack or helping with a small chore is the best gift 😊" />
        <h3 className={h3}>Advice nobody asked for</h3>
        <MessageCard
          text="I know it comes from love, and I really appreciate you caring! We're following our doctor's guidance and figuring out what works for us, so we'll ask if we need ideas 😊"
          tip="Tip: warm first, firm second."
        />
      </MonthProvider>

      <GuideCta guide={guide}>
        DueDuo has all 12 messages, each with an Open in WhatsApp button, next to your week-by-week plan, so the one you
        need is there when the moment comes.
      </GuideCta>
      <Sources sources={[SOURCES.govMaternity, SOURCES.govPaternity]} />
    </article>
  );
}
