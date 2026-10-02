import Link from "next/link";
import {
  ArrowRight,
  Check,
  Gift,
  HeartHandshake,
  Luggage,
  Map as MapIcon,
  MessageCircle,
  Printer,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SITE } from "@/lib/site-config";
import { CtaLink } from "./cta-link";
import { ProductPreview } from "./product-preview";

/* Shared bits ------------------------------------------------------------ */

function Eyebrow({ children, tone = "light" }: { children: React.ReactNode; tone?: "light" | "dark" }) {
  return (
    <p
      className={
        tone === "light"
          ? "text-xs font-semibold tracking-[0.18em] text-brand-strong uppercase"
          : "text-xs font-semibold tracking-[0.18em] text-brand-soft uppercase"
      }
    >
      {children}
    </p>
  );
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`mt-3 font-display text-[2rem] leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl ${className}`}>
      {children}
    </h2>
  );
}

/* HERO ------------------------------------------------------------------- */

export function Hero() {
  const trust = [
    { icon: Users, text: "Your partner joins free" },
    { icon: ShieldCheck, text: "Secure checkout by Stripe" },
    ...(SITE.guaranteeDays ? [{ icon: RotateCcw, text: `${SITE.guaranteeDays}-day money-back guarantee` }] : []),
    { icon: Smartphone, text: "Works on any phone — no download" },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_80%_-10%,rgba(247,230,226,0.9),transparent),radial-gradient(40rem_25rem_at_-10%_30%,rgba(230,239,232,0.8),transparent)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pt-14 pb-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-28">
        <div>
          <a
            href="#co-pilot"
            className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 py-1 pr-3 pl-1 text-xs font-semibold shadow-sm backdrop-blur transition-colors hover:bg-white"
          >
            <span className="rounded-full bg-ink px-2 py-0.5 text-canvas">New</span>
            Co-Pilot mode for partners <ArrowRight className="size-3.5" aria-hidden />
          </a>
          <h1 className="mt-6 font-display text-[2.6rem] leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Your first pregnancy, <span className="text-brand-strong italic">planned for two.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
            {SITE.name} is the week-by-week command center for first-time parents. Know exactly what to book, buy and
            decide — while your partner gets their own task list, so you&apos;re never the only one remembering.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CtaLink>Start our plan — {SITE.price}</CtaLink>
            <a
              href="#co-pilot"
              className="inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-4 text-base font-semibold text-ink transition-colors hover:bg-white/70"
            >
              See how Co-Pilot works
            </a>
          </div>
          <ul className="mt-9 grid gap-x-6 gap-y-2.5 text-sm text-muted sm:grid-cols-2">
            {trust.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="size-4 shrink-0 text-sage" aria-hidden /> {text}
              </li>
            ))}
          </ul>
        </div>
        <ProductPreview />
      </div>
    </section>
  );
}

/* PROOF STRIP (factual product numbers — no invented social proof) ------- */

const NUMBERS = [
  { value: "79", label: "week-by-week tasks" },
  { value: "12", label: "ready-to-send scripts" },
  { value: "1-page", label: "doctor visit printouts" },
  { value: "2", label: "logins, one shared plan" },
];

export function NumbersStrip() {
  return (
    <section aria-label="What's inside, in numbers" className="border-y border-ink/5 bg-white">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-5 py-10 sm:px-8 lg:grid-cols-4">
        {NUMBERS.map((n) => (
          <div key={n.label} className="text-center">
            <dt className="sr-only">{n.label}</dt>
            <dd>
              <span className="block font-display text-4xl font-semibold tracking-tight">{n.value}</span>
              <span className="mt-1 block text-sm text-muted">{n.label}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* BEFORE / AFTER --------------------------------------------------------- */

const WITHOUT = [
  "Twenty tabs of conflicting advice",
  "Questions forgotten the moment you're in the exam room",
  "One person quietly carrying the mental load",
  "Money spent on gear babies don't actually need",
  "Awkward messages to family and work, left until the last minute",
];
const WITH = [
  "One calm list for this week — with the why behind each task",
  "A printout with your must-ask questions and symptoms",
  "Tasks split between you two, on two phones",
  "A lean gear list and your real maternity-leave income gap",
  "Boundary scripts ready to send on WhatsApp",
];

export function BeforeAfter() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <Eyebrow>Why {SITE.name}</Eyebrow>
          <SectionTitle>A first pregnancy comes with a second job: remembering everything.</SectionTitle>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-ink/10 bg-white/50 p-8">
            <p className="text-sm font-semibold text-muted">Without a plan</p>
            <ul className="mt-6 space-y-4">
              {WITHOUT.map((t) => (
                <li key={t} className="flex gap-3 text-ink/70">
                  <X className="mt-0.5 size-5 shrink-0 text-ink/30" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 shadow-ink/5 ring-ink/5">
            <p className="text-sm font-semibold text-brand-strong">With {SITE.name}</p>
            <ul className="mt-6 space-y-4">
              {WITH.map((t) => (
                <li key={t} className="flex gap-3 font-medium">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sage text-white">
                    <Check className="size-3" strokeWidth={3.5} aria-hidden />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* CO-PILOT SPOTLIGHT ----------------------------------------------------- */

const COPILOT_POINTS = [
  { title: "Their own login and task list", body: "Your partner sees exactly what's theirs — on their own phone, every week." },
  { title: "Reassign anything in one tap", body: "Too tired this week? Move a task to your Co-Pilot. It syncs instantly." },
  { title: "They send the hard messages", body: "Visitor rules, “no calls during labor” — your partner sends them, so you don't have to." },
  { title: "Free with your plan", body: "One payment covers you both. Invite them with a single WhatsApp link." },
];

const SPLIT = [
  { task: "Install the car seat", who: "Jack" },
  { task: "Pre-register at the hospital", who: "Jack" },
  { task: "Draft birth preferences", who: "Together" },
  { task: "Finish work handover", who: "You" },
  { task: "Send the hospital visitor message", who: "Jack" },
];

export function CoPilotSpotlight() {
  return (
    <section id="co-pilot" className="scroll-mt-20 px-3 sm:px-5">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-ink px-5 py-20 text-canvas sm:px-12 sm:py-28">
        <div className="pointer-events-none absolute -top-40 -right-40 size-[32rem] rounded-full bg-brand-strong/30 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <div>
            <Eyebrow tone="dark">Co-Pilot mode</Eyebrow>
            <SectionTitle className="text-canvas">You&apos;re a team. Now your plan knows it too.</SectionTitle>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-canvas/70">
              About a third of the roadmap is assigned to your partner by default. Less “did you remember…?”, more
              “already done”.
            </p>
            <dl className="mt-10 grid gap-6 sm:grid-cols-2">
              {COPILOT_POINTS.map((p) => (
                <div key={p.title}>
                  <dt className="flex items-center gap-2 font-semibold">
                    <Check className="size-4 text-brand-soft" aria-hidden /> {p.title}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-canvas/60">{p.body}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div aria-hidden className="rounded-3xl bg-canvas/[0.06] p-3 ring-1 ring-canvas/10 backdrop-blur">
            <div className="rounded-2xl bg-white p-6 text-ink shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="font-display text-xl font-semibold">Weeks 31–33</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1 text-xs font-semibold text-[#4f6b59]">
                  <HeartHandshake className="size-3.5" /> Co-Pilot on
                </span>
              </div>
              <ul className="mt-5 divide-y divide-line">
                {SPLIT.map((s) => (
                  <li key={s.task} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="flex items-center gap-2.5">
                      <span className="size-4 rounded-full border-2 border-ink/15" />
                      {s.task}
                    </span>
                    <span
                      className={
                        s.who === "You"
                          ? "rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-strong"
                          : s.who === "Together"
                            ? "rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold"
                            : "rounded-full bg-sage-soft px-2.5 py-1 text-xs font-semibold text-[#4f6b59]"
                      }
                    >
                      {s.who}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* FEATURES BENTO --------------------------------------------------------- */

export function FeaturesBento() {
  return (
    <section id="features" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <Eyebrow>Everything in one place</Eyebrow>
          <SectionTitle>Not another pregnancy journal. A done-for-you command center.</SectionTitle>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-6">
          {/* Roadmap — large */}
          <article className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-ink/5 md:col-span-4">
            <MapIcon className="size-6 text-brand-strong" aria-hidden />
            <h3 className="mt-5 text-xl font-semibold">Week-by-week roadmap</h3>
            <p className="mt-2 max-w-md text-muted">
              79 practical tasks across all three trimesters — each with why it matters, how long it takes, and a button
              that opens the next step.
            </p>
            <div aria-hidden className="mt-7 grid gap-2 sm:grid-cols-3">
              {[
                ["Weeks 9–10", "Decide on screening"],
                ["Weeks 20–22", "File leave paperwork"],
                ["Week 36", "Bags by the door"],
              ].map(([w, t]) => (
                <div key={w} className="rounded-2xl bg-canvas p-4">
                  <p className="text-[11px] font-semibold text-muted">{w}</p>
                  <p className="mt-1 text-sm font-medium">{t}</p>
                </div>
              ))}
            </div>
          </article>

          {/* Printout */}
          <article className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-ink/5 md:col-span-2">
            <Printer className="size-6 text-brand-strong" aria-hidden />
            <h3 className="mt-5 text-xl font-semibold">Doctor visit printout</h3>
            <p className="mt-2 text-muted">Star your must-ask questions, log symptoms, print one clean page.</p>
            <div aria-hidden className="mt-6 space-y-2 rounded-2xl border border-ink/10 bg-canvas/50 p-4">
              <div className="h-2 w-1/3 rounded-full bg-ink/80" />
              <div className="h-2 w-full rounded-full bg-ink/10" />
              <div className="h-2 w-5/6 rounded-full bg-ink/10" />
              <div className="h-2 w-2/3 rounded-full bg-ink/10" />
            </div>
          </article>

          {/* Scripts */}
          <article className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-ink/5 md:col-span-3">
            <MessageCircle className="size-6 text-brand-strong" aria-hidden />
            <h3 className="mt-5 text-xl font-semibold">12 boundary scripts</h3>
            <p className="mt-2 text-muted">Telling work, “please don&apos;t post yet”, hospital visitors — written for you, editable, one tap to WhatsApp.</p>
            <div aria-hidden className="mt-6 max-w-sm rounded-2xl rounded-tl-sm bg-[#dcf8c6] p-4 text-sm leading-relaxed text-[#1f2c1a] shadow-sm">
              We&apos;ve decided to keep the hospital time just for the three of us, so we can rest and get to know our
              baby. We can&apos;t wait for you to meet them once we&apos;re settled 🤍
            </div>
          </article>

          {/* Budget */}
          <article className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-ink/5 md:col-span-3">
            <Wallet className="size-6 text-brand-strong" aria-hidden />
            <h3 className="mt-5 text-xl font-semibold">Smart budget</h3>
            <p className="mt-2 text-muted">See your maternity-leave income gap, one calm monthly savings target, and a Skip list of gear you don&apos;t need.</p>
            <div aria-hidden className="mt-6 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-canvas p-4">
                <p className="text-[11px] font-semibold text-muted uppercase">Leave gap</p>
                <p className="mt-1 font-display text-2xl font-semibold">$5,760</p>
              </div>
              <div className="rounded-2xl bg-brand-soft/70 p-4">
                <p className="text-[11px] font-semibold text-muted uppercase">Save / month</p>
                <p className="mt-1 font-display text-2xl font-semibold text-brand-strong">$990</p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted">Example figures.</p>
          </article>

          {/* Small cards */}
          {[
            { icon: Luggage, title: "Three hospital bags", body: "Yours, baby's and your partner's — one shared checklist." },
            { icon: Gift, title: "Registry you can share", body: "Must-haves first, sent as a WhatsApp list. No duplicates." },
            { icon: Sparkles, title: "Appointments & questions", body: "Every visit in one place, with a running record of the answers." },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-ink/5 md:col-span-2">
              <Icon className="size-6 text-brand-strong" aria-hidden />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* HOW IT WORKS ----------------------------------------------------------- */

const STEPS = [
  { title: "Start your plan", body: "Enter your email — no password — and unlock DueDuo in under a minute." },
  { title: "Add your due date", body: "Or the first day of your last period. We map every week until delivery day." },
  { title: "Invite your Co-Pilot", body: "Send one WhatsApp link. From then on, you both just open “This week”." },
];

export function HowItWorks() {
  return (
    <section className="border-y border-ink/5 bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <SectionTitle>Set up together in two minutes.</SectionTitle>
        </div>
        <ol className="mt-14 grid gap-10 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="font-display text-6xl font-semibold text-brand-soft">0{i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* PRICING ---------------------------------------------------------------- */

const INCLUDED = [
  "Full week-by-week roadmap — all trimesters",
  "Co-Pilot account for your partner",
  "Doctor visit printouts",
  "12 WhatsApp boundary scripts",
  "Smart budget, leave plan & Skip list",
  "Appointments, questions, registry & hospital bags",
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Pricing</Eyebrow>
          <SectionTitle>One payment. Two of you. Nine calmer months.</SectionTitle>
          <p className="mt-5 text-lg text-muted">Less than a single maternity outfit — and no subscription, ever.</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 shadow-ink/10 ring-ink/5 md:grid-cols-[1.2fr_1fr]">
          <div className="p-8 sm:p-10">
            <h3 className="font-display text-2xl font-semibold">{SITE.name} for two</h3>
            <p className="mt-2 text-muted">Everything you need from positive test to delivery day.</p>
            <ul className="mt-8 space-y-3.5">
              {INCLUDED.map((i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sage-soft text-[#4f6b59]">
                    <Check className="size-3" strokeWidth={3.5} aria-hidden />
                  </span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-center bg-canvas p-8 text-center sm:p-10">
            <p className="text-sm font-semibold text-muted">One-time payment</p>
            <p className="mt-2 font-display text-7xl font-semibold tracking-tight">{SITE.price}</p>
            <p className="mt-2 text-sm text-muted">Your partner joins free</p>
            <CtaLink className="mt-8 w-full">Start our plan</CtaLink>
            <div className="mt-6 space-y-2 text-xs text-muted">
              <p className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="size-4" aria-hidden /> Secure checkout by Stripe
              </p>
              {SITE.guaranteeDays && (
                <p className="flex items-center justify-center gap-1.5">
                  <RotateCcw className="size-4" aria-hidden /> {SITE.guaranteeDays}-day money-back guarantee
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* FAQ -------------------------------------------------------------------- */

const FAQ = [
  { q: "Is DueDuo medical advice?", a: "No. It's an organization tool that helps you plan, prepare better questions and share the load. Always follow your doctor or midwife." },
  { q: "I'm already 20 weeks. Is it too late?", a: "Not at all. You start at your current week, and a gentle “catch up” list shows anything from earlier weeks that still applies." },
  { q: "Does my partner need to pay?", a: "No. One payment covers you both. Send a single invite link and your Co-Pilot gets their own free login to the same plan." },
  { q: "Is it a subscription?", a: `No — it's a single payment of ${SITE.price}. No renewals, no surprise charges.` },
  { q: "Do we need to download an app?", a: "No. DueDuo works in any browser on your phones and computer. Tip: add it to your home screen for one-tap access." },
  { q: "Who can see our information?", a: "Only you and the partner you invite. Your data is never sold or shared." },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-ink/5 bg-white py-24 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <Eyebrow>FAQ</Eyebrow>
          <SectionTitle>Questions, answered.</SectionTitle>
          <p className="mt-5 text-muted">
            Something else?{" "}
            <a href={`mailto:${SITE.supportEmail}`} className="font-semibold text-brand-strong underline-offset-4 hover:underline">
              Email us
            </a>
            .
          </p>
        </div>
        <div className="divide-y divide-ink/10 border-y border-ink/10">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold">
                {f.q}
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-canvas text-lg text-brand-strong transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* FINAL CTA + FOOTER ----------------------------------------------------- */

export function FinalCta() {
  return (
    <section className="px-3 py-24 sm:px-5">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-brand-strong px-6 py-20 text-center text-white sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_50%_-20%,rgba(255,255,255,0.25),transparent)]" />
        <div className="relative">
          <h2 className="mx-auto max-w-3xl font-display text-[2rem] leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
            Know exactly what to do this week — and who&apos;s doing it.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">{SITE.priceNote}.</p>
          <CtaLink variant="light" className="mt-10">
            Start our plan — {SITE.price}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/5">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm text-muted">{SITE.tagline}.</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
            <a href="#co-pilot" className="text-muted hover:text-ink">Co-Pilot</a>
            <a href="#features" className="text-muted hover:text-ink">Features</a>
            <a href="#pricing" className="text-muted hover:text-ink">Pricing</a>
            <a href="#faq" className="text-muted hover:text-ink">FAQ</a>
            <Link href="/login" className="text-muted hover:text-ink">Log in</Link>
            <a href={`mailto:${SITE.supportEmail}`} className="text-muted hover:text-ink">Contact</a>
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-ink/5 pt-6 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p>For organization only — not medical advice. Always follow your doctor or midwife.</p>
        </div>
      </div>
    </footer>
  );
}

