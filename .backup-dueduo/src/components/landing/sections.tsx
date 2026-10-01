import {
  Check,
  ClipboardList,
  HeartHandshake,
  Luggage,
  Map as MapIcon,
  MessageCircle,
  Printer,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { SITE } from "@/lib/site-config";
import { CtaLink } from "./cta-link";
import { ProductPreview } from "./product-preview";

/* ------------------------------ HERO ------------------------------ */

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
      <div>
        <p className="text-sm font-semibold tracking-wide text-brand uppercase">For first-time parents-to-be</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
          Pregnant for the first time? Here&apos;s exactly what happens next.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          A week-by-week command center that tells you what to book, buy and decide — and gives your partner their own
          task list, so you&apos;re never the only one remembering.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <CtaLink>Get my planner — {SITE.price}</CtaLink>
          <a href="#features" className="px-2 py-3 text-center text-sm font-semibold text-muted hover:text-ink">
            See what&apos;s inside
          </a>
        </div>
        <p className="mt-4 text-sm text-muted">{SITE.priceNote}</p>
      </div>
      <ProductPreview />
    </section>
  );
}

/* ------------------------------ PROBLEM ------------------------------ */

const PAINS = [
  { title: "Twenty browser tabs, zero plan", body: "Apps tell you your baby is the size of an avocado. Nobody tells you to book the anatomy scan or join the daycare waitlist." },
  { title: "Questions you forget in the room", body: "You think of them at 2am, then blank the moment the doctor asks “any questions?”." },
  { title: "One person carries it all", body: "Appointments, bookings, awkward family messages — the mental load quietly lands on mom." },
  { title: "Money spent on things you don't need", body: "Baby marketing is relentless. Meanwhile, nobody has calculated what maternity leave will cost you." },
];

export function Problem() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl font-display text-3xl sm:text-4xl">Everyone has advice. Nobody gives you a plan.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {PAINS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-line bg-canvas p-6">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-2 text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FEATURES ------------------------------ */

const FEATURES = [
  { icon: MapIcon, title: "Week-by-week roadmap", body: "79 practical tasks across all three trimesters, each with the why, the time it takes and a button that does the next step for you." },
  { icon: HeartHandshake, title: "Partner Co-Pilot", body: "Your partner gets their own login and task list — the car seat, bookings, the visitor messages. Reassign anything with one tap." },
  { icon: Printer, title: "Doctor visit printout", body: "Log symptoms, star your must-ask questions, and print a clean one-page summary before every appointment." },
  { icon: MessageCircle, title: "Boundary scripts", body: "12 ready-to-send WhatsApp messages: telling work, “please don't post yet”, no hospital visitors, and more." },
  { icon: Wallet, title: "Smart budget", body: "See your maternity leave income gap and one calm monthly savings target. The Skip list stops you buying what babies don't need." },
  { icon: Luggage, title: "Bag, registry & appointments", body: "Shared checklists for three hospital bags, a registry you can share on WhatsApp, and every visit in one place." },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-sm font-semibold tracking-wide text-brand uppercase">What&apos;s inside</p>
        <h2 className="mt-2 max-w-2xl font-display text-3xl sm:text-4xl">Not another journal. A done-for-you command center.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-line bg-surface p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ HOW IT WORKS ------------------------------ */

const STEPS = [
  { title: "Sign up in a minute", body: "Enter your email — no password to remember — and unlock the planner." },
  { title: "Add your due date", body: "Or the first day of your last period. We map every week from today to delivery day." },
  { title: "Invite your partner", body: "Send one WhatsApp link. From then on, you both just open “This week”." },
];

export function HowItWorks() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl sm:text-4xl">Set up in two minutes</h2>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="grid size-10 place-items-center rounded-full bg-ink font-display text-lg text-canvas">{i + 1}</span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------ CO-PILOT BAND ------------------------------ */

export function CoPilotBand() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 rounded-[2rem] bg-ink p-8 text-canvas sm:p-12 lg:grid-cols-2">
          <div>
            <HeartHandshake className="size-10 text-brand-soft" aria-hidden />
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">You&apos;re a team. Now the plan knows it too.</h2>
            <p className="mt-4 text-canvas/75">
              About a third of the roadmap is assigned to your partner by default — and they see it on their own phone.
              Less “did you remember…?”, more “already done”.
            </p>
          </div>
          <ul className="space-y-3">
            {["Books the scans and the hospital tour", "Installs the car seat and packs their bag", "Sends the “no visitors yet” message for you", "Their own login — free with your plan"].map((t) => (
              <li key={t} className="flex gap-3 rounded-xl bg-canvas/10 p-4">
                <Check className="mt-0.5 size-5 shrink-0 text-brand-soft" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ PRICING ------------------------------ */

const INCLUDED = [
  "Full week-by-week roadmap (all trimesters)",
  "Partner Co-Pilot account included",
  "Doctor visit printouts",
  "12 WhatsApp boundary scripts",
  "Smart budget, leave plan & Skip list",
  "Appointments, registry & hospital bags",
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-md text-center">
          <h2 className="font-display text-3xl sm:text-4xl">One price. Everything included.</h2>
          <p className="mt-3 text-muted">Less than a single maternity outfit — for nine calmer months.</p>
        </div>
        <div className="mx-auto mt-10 max-w-md rounded-[1.75rem] border border-line bg-canvas p-8 shadow-sm">
          <div className="flex items-baseline justify-center gap-2">
            <span className="font-display text-6xl">{SITE.price}</span>
            <span className="text-muted">one-time</span>
          </div>
          <p className="mt-1 text-center text-sm text-muted">No subscription. Your partner joins free.</p>
          <ul className="mt-8 space-y-3">
            {INCLUDED.map((i) => (
              <li key={i} className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-sage" aria-hidden /> {i}
              </li>
            ))}
          </ul>
          <CtaLink className="mt-8 w-full">Get my planner</CtaLink>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="size-4" aria-hidden /> Secure checkout by Stripe
            {SITE.guaranteeDays ? ` · ${SITE.guaranteeDays}-day money-back guarantee` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FAQ ------------------------------ */

const FAQ = [
  { q: "Is this medical advice?", a: "No. It's an organization tool that helps you plan, prepare questions and share the load. Always follow your doctor or midwife — the planner even helps you ask them better questions." },
  { q: "I'm already 20 weeks. Is it too late?", a: "Not at all. You'll start at your current week, and a gentle “catch up” list shows anything from earlier weeks that still applies." },
  { q: "Does my partner need to pay?", a: "No. You send one invite link and they get their own free login to the same plan." },
  { q: "Is it a subscription?", a: `No — it's a single payment of ${SITE.price}. No renewals, no surprise charges.` },
  { q: "Do I need to download an app?", a: "No. It works in any browser on your phone or computer. Tip: add it to your home screen for one-tap access." },
  { q: "Who can see my information?", a: "Only you and the partner you invite. Your data is never sold or shared." },
];

export function Faq() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center font-display text-3xl sm:text-4xl">Questions, answered</h2>
        <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-surface">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <span className="text-xl text-brand transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FINAL CTA + FOOTER ------------------------------ */

export function FinalCta() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-[2rem] bg-brand px-6 py-14 text-center text-white sm:px-12">
        <ClipboardList className="mx-auto size-10 text-white/80" aria-hidden />
        <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl sm:text-4xl">
          Know exactly what to do this week — and who&apos;s doing it.
        </h2>
        <CtaLink variant="light" className="mt-8">
          Get my planner — {SITE.price}
        </CtaLink>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} {SITE.name}. For organization only — not medical advice.
        </p>
        <nav className="flex gap-4">
          <a href={`mailto:${SITE.supportEmail}`} className="hover:text-ink">
            Contact
          </a>
          <a href="/login" className="hover:text-ink">
            Log in
          </a>
        </nav>
      </div>
    </footer>
  );
}
