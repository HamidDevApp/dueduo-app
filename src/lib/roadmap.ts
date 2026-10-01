import type { Trimester } from "@/lib/pregnancy";
import type { ScriptId } from "@/lib/scripts";

/* =========================================================
   Types
   ========================================================= */

/** Who the task belongs to by default. The mom can reassign any task. */
export type Owner = "mom" | "partner" | "together";

export type TaskCategory =
  | "medical"    // appointments, tests, vaccines
  | "health"     // nutrition, movement, symptoms
  | "admin"      // work, leave, insurance, paperwork
  | "money"      // smart budgeting
  | "baby-prep"  // gear, sleep space, childcare
  | "birth"      // birth plan, hospital, labor logistics
  | "boundaries" // communication and protecting your peace
  | "wellbeing"; // rest, support, relationship

/** In-app destinations a task can deep-link to. */
export type AppRoute =
  | "/budget"
  | "/budget#leave-plan"
  | "/budget#skip-list"
  | "/registry"
  | "/hospital-bag"
  | "/questions"
  | "/appointments"
  | "/appointments/print"
  | "/co-pilot";

/** The "done-for-you" part: every action opens something ready to use. */
export type TaskAction =
  | { type: "script"; scriptId: ScriptId; label: string }
  | { type: "link"; href: AppRoute; label: string };

export type RoadmapTask = {
  /** Stable ID stored in `roadmap_progress.task_key` — never rename once live. */
  key: string;
  title: string;
  /** Exactly what to do, in one or two sentences. */
  detail: string;
  /** Why it matters — the peace-of-mind line. */
  why?: string;
  owner: Owner;
  category: TaskCategory;
  /** Rough time needed, so tasks feel doable. */
  minutes: number;
  essential?: boolean;
  action?: TaskAction;
};

export type RoadmapStage = {
  id: string;
  fromWeek: number;
  toWeek: number;
  trimester: Trimester;
  title: string;
  focus: string;
  /** Calm, normalizing message for this stage. */
  reassurance: string;
  /** One line telling the partner how to help most right now. */
  partnerFocus: string;
  tasks: RoadmapTask[];
};

export const OWNER_LABELS: Record<Owner, string> = {
  mom: "You",
  partner: "Partner",
  together: "Together",
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  medical: "Medical",
  health: "Health",
  admin: "Work & admin",
  money: "Money",
  "baby-prep": "Baby prep",
  birth: "Birth",
  boundaries: "Boundaries",
  wellbeing: "Wellbeing",
};

export const TRIMESTERS: Record<Trimester, { title: string; weeks: string; summary: string }> = {
  1: {
    title: "First trimester",
    weeks: "Weeks 1–13",
    summary: "Confirm, book your care, protect your energy, and make the early decisions calmly.",
  },
  2: {
    title: "Second trimester",
    weeks: "Weeks 14–27",
    summary: "Your energy window: scans, work and leave, a smart budget, and childcare.",
  },
  3: {
    title: "Third trimester",
    weeks: "Weeks 28–40+",
    summary: "Get birth-ready: bag, car seat, visitor plan, meals, and plenty of rest.",
  },
};

/* =========================================================
   Content
   General guidance — timings vary by country and provider.
   ========================================================= */

export const ROADMAP: RoadmapStage[] = [
  // ======================= TRIMESTER 1 =======================
  {
    id: "w04",
    fromWeek: 0,
    toWeek: 6,
    trimester: 1,
    title: "You're pregnant — first steps",
    focus: "Confirm, protect and book.",
    reassurance:
      "Feeling excited, scared, or both at once is completely normal. You don't need to have everything figured out — just the next few steps.",
    partnerFocus: "Take one call off her plate today: book the first appointment or check the insurance.",
    tasks: [
      { key: "w04-prenatal-vitamin", title: "Start a daily prenatal vitamin with folic acid", detail: "Look for at least 400 mcg folic acid. Ask your provider if you need a higher dose, vitamin D or iron.", why: "Folic acid matters most in the earliest weeks.", owner: "mom", category: "health", minutes: 10, essential: true },
      { key: "w04-book-first-visit", title: "Book the first prenatal appointment", detail: "Call your doctor, midwife or clinic. First visits usually happen around weeks 8–10, and slots fill up.", owner: "partner", category: "medical", minutes: 15, essential: true, action: { type: "link", href: "/appointments", label: "Add the appointment" } },
      { key: "w04-review-meds", title: "Review every medication and supplement", detail: "Ask a doctor or pharmacist before stopping or continuing anything, including painkillers, acne products and herbal remedies.", owner: "mom", category: "medical", minutes: 15, essential: true, action: { type: "link", href: "/questions", label: "Add to doctor questions" } },
      { key: "w04-alcohol-smoking", title: "Stop alcohol, smoking and vaping", detail: "There is no known safe amount of alcohol in pregnancy. Ask your provider about free quit-support if you need it.", owner: "mom", category: "health", minutes: 5, essential: true },
      { key: "w04-food-safety", title: "Learn the food-safety basics", detail: "Avoid unpasteurized dairy, raw or undercooked meat, eggs and fish, and high-mercury fish. Keep caffeine under about 200 mg a day.", owner: "together", category: "health", minutes: 10 },
      { key: "w04-insurance", title: "Check maternity coverage", detail: "Find out what's covered for prenatal care, scans, delivery and the newborn, plus deductibles. Save the policy number in the app.", owner: "partner", category: "admin", minutes: 30 },
      { key: "w04-partner-invite", title: "Invite your partner as Co-Pilot", detail: "Send the invite so tasks can be shared from day one. Your partner gets their own login and task list.", why: "Sharing the mental load early prevents burnout later.", owner: "mom", category: "wellbeing", minutes: 2, essential: true, action: { type: "script", scriptId: "partner-invite", label: "Send on WhatsApp" } },
    ],
  },
  {
    id: "w07",
    fromWeek: 7,
    toWeek: 8,
    trimester: 1,
    title: "Getting ready for your first visit",
    focus: "Walk in prepared, walk out reassured.",
    reassurance:
      "Nausea and tiredness usually peak around now and often ease in the second trimester. Rest is productive right now.",
    partnerFocus: "Take over dinners and cleaning up the kitchen — smells can be the hardest part of this stage.",
    tasks: [
      { key: "w07-family-history", title: "Write down both families' medical history", detail: "Genetic conditions, twins, diabetes, high blood pressure and any past pregnancy complications.", owner: "together", category: "medical", minutes: 20, essential: true, action: { type: "link", href: "/questions", label: "Add to visit notes" } },
      { key: "w07-first-questions", title: "Add your first questions for the doctor", detail: "Symptoms, exercise, travel, work hazards, and which tests are recommended for you.", owner: "mom", category: "medical", minutes: 10, action: { type: "link", href: "/questions", label: "Open doctor questions" } },
      { key: "w07-print-summary", title: "Print or save your visit summary", detail: "Take a one-page summary with your questions, symptoms and history so nothing is forgotten in the room.", why: "Most people forget half their questions once the appointment starts.", owner: "mom", category: "medical", minutes: 2, action: { type: "link", href: "/appointments/print", label: "Open visit printout" } },
      { key: "w07-nausea-plan", title: "Make a nausea plan", detail: "Small frequent meals, crackers by the bed, ginger. Call your provider if you can't keep fluids down for 24 hours.", owner: "mom", category: "health", minutes: 10 },
      { key: "w07-partner-chores", title: "Partner takes over strong-smell chores", detail: "Cooking, bins and the fridge clean-out. If you have a cat, the partner takes over the litter box.", why: "Cat litter can carry toxoplasmosis, which is risky in pregnancy.", owner: "partner", category: "wellbeing", minutes: 5 },
      { key: "w07-attend-visit", title: "Partner books time off to join the first visit", detail: "Put all known appointments in a shared calendar and request time off early.", owner: "partner", category: "admin", minutes: 10 },
    ],
  },
  {
    id: "w09",
    fromWeek: 9,
    toWeek: 10,
    trimester: 1,
    title: "Screening decisions",
    focus: "Understand your options — no pressure, just clarity.",
    reassurance:
      "Screening is optional and personal. Asking questions until you feel clear is exactly what the appointments are for.",
    partnerFocus: "Read about the screening options too, so you can decide together — not leave it all to her.",
    tasks: [
      { key: "w09-screening-options", title: "Decide on screening with your provider", detail: "Options may include NIPT (cell-free DNA, from about week 10) and first-trimester combined screening.", owner: "together", category: "medical", minutes: 30, essential: true, action: { type: "link", href: "/questions", label: "Add screening questions" } },
      { key: "w09-dental", title: "Book a dental check-up", detail: "Gum problems are more common in pregnancy, and routine dental care is safe. Tell the dentist you're pregnant.", owner: "mom", category: "health", minutes: 10 },
      { key: "w09-budget-start", title: "Set up your baby budget", detail: "Start with medical costs and your leave income plan. Gear comes later — and less of it than you think.", why: "Knowing your numbers early is the biggest money-stress reducer.", owner: "together", category: "money", minutes: 20, essential: true, action: { type: "link", href: "/budget#leave-plan", label: "Open leave plan" } },
      { key: "w09-leave-policy", title: "Quietly read both parental leave policies", detail: "Find the notice deadline, paid weeks and pay rate for each of you. No need to tell work yet.", owner: "together", category: "admin", minutes: 30, action: { type: "link", href: "/budget#leave-plan", label: "Enter leave details" } },
    ],
  },
  {
    id: "w11",
    fromWeek: 11,
    toWeek: 13,
    trimester: 1,
    title: "End of the first trimester",
    focus: "Scans, sharing the news on your terms, and moving your body.",
    reassurance:
      "You get to decide who knows, and when. There's no 'right' time to announce — only what feels right to you.",
    partnerFocus: "Be the one who handles curious relatives, so she can share news only when she wants to.",
    tasks: [
      { key: "w11-nt-scan", title: "Attend your 11–14 week scan if offered", detail: "It often includes dating and nuchal translucency measurement.", owner: "together", category: "medical", minutes: 60, essential: true },
      { key: "w11-warning-signs", title: "Both save the warning-signs list", detail: "Know when to call your provider or go to emergency care. Both phones, not just hers.", owner: "together", category: "medical", minutes: 5, essential: true },
      { key: "w11-exercise", title: "Get cleared for exercise and start a routine", detail: "Most people can aim for about 150 minutes of moderate activity a week, like brisk walking or swimming.", owner: "mom", category: "health", minutes: 10 },
      { key: "w11-tell-family", title: "Tell your inner circle", detail: "Send the message to close family, and ask them to keep it private until you announce.", owner: "together", category: "boundaries", minutes: 10, action: { type: "script", scriptId: "tell-family", label: "Use the script" } },
      { key: "w11-keep-private", title: "Ask people not to post the news", detail: "Head off accidental social-media announcements before they happen.", owner: "partner", category: "boundaries", minutes: 5, action: { type: "script", scriptId: "keep-it-private", label: "Use the script" } },
      { key: "w11-work-plan", title: "Plan when to tell your employer", detail: "Check your country's legal notice deadline so you're protected, and decide what you'll ask for.", owner: "mom", category: "admin", minutes: 20 },
    ],
  },

  // ======================= TRIMESTER 2 =======================
  {
    id: "w14",
    fromWeek: 14,
    toWeek: 16,
    trimester: 2,
    title: "Welcome to the second trimester",
    focus: "Use the energy boost for the big planning.",
    reassurance:
      "Many people feel much better now. This is the best window for decisions that take research — use it, but don't overdo it.",
    partnerFocus: "Own the childcare research: shortlist options and costs, then decide together.",
    tasks: [
      { key: "w14-tell-work", title: "Book the conversation with your manager", detail: "Use the script to request a private meeting, share the news in person, then confirm dates by email.", owner: "mom", category: "boundaries", minutes: 15, action: { type: "script", scriptId: "tell-work", label: "Use the script" } },
      { key: "w14-childcare", title: "Research childcare and join waitlists", detail: "Daycare and nanny waitlists can be many months long in some areas. Note the cost of each option in the budget.", owner: "partner", category: "baby-prep", minutes: 60, essential: true, action: { type: "link", href: "/budget", label: "Add costs to budget" } },
      { key: "w14-skip-list", title: "Read the 'Skip list' before buying anything", detail: "Go through what babies actually need in the first 3 months vs. what marketing says they need.", why: "Most families overspend on gear they barely use.", owner: "together", category: "money", minutes: 10, essential: true, action: { type: "link", href: "/budget#skip-list", label: "Open the Skip list" } },
      { key: "w14-registry-start", title: "Start your registry with must-haves only", detail: "Car seat, safe sleep space, feeding basics, diapers. Mark each as Must / Nice / Later.", owner: "mom", category: "baby-prep", minutes: 30, action: { type: "link", href: "/registry", label: "Open registry" } },
      { key: "w14-maternity-clothes", title: "Get a few maternity basics", detail: "Stretchy trousers, a supportive bra and a couple of tops. Borrow or buy second-hand where you can.", owner: "mom", category: "money", minutes: 30 },
      { key: "w14-sleep-position", title: "Start getting used to sleeping on your side", detail: "A pillow between the knees helps. From the third trimester, side-sleeping is recommended.", owner: "mom", category: "health", minutes: 5 },
    ],
  },
  {
    id: "w17",
    fromWeek: 17,
    toWeek: 19,
    trimester: 2,
    title: "Choose where and how",
    focus: "Birth place, classes and the anatomy scan.",
    reassurance:
      "You don't need a perfect birth plan — you need a place you trust and a team who listens. That's what you're choosing now.",
    partnerFocus: "Book the classes and the hospital tour, and put them in both calendars.",
    tasks: [
      { key: "w17-anatomy-scan", title: "Book the anatomy scan (usually 18–22 weeks)", detail: "This detailed ultrasound checks baby's development and the placenta.", owner: "partner", category: "medical", minutes: 10, essential: true, action: { type: "link", href: "/appointments", label: "Add the appointment" } },
      { key: "w17-birth-place", title: "Compare hospitals or birth centers", detail: "Check insurance coverage, NICU level, visiting rules, and whether you can tour.", owner: "together", category: "birth", minutes: 45, essential: true },
      { key: "w17-classes", title: "Book antenatal and baby-care classes", detail: "Popular classes fill fast. Most people take them between weeks 28 and 36.", owner: "partner", category: "birth", minutes: 20 },
      { key: "w17-pelvic-floor", title: "Start daily pelvic floor exercises", detail: "A few minutes a day helps before and after birth. Ask about a pelvic-floor physio if you have pain or leaks.", owner: "mom", category: "health", minutes: 5 },
      { key: "w17-advice-boundary", title: "Set a kind boundary on unsolicited advice", detail: "Save the script for the next time the tips and horror stories start.", owner: "mom", category: "boundaries", minutes: 2, action: { type: "script", scriptId: "unsolicited-advice", label: "Save the script" } },
    ],
  },
  {
    id: "w20",
    fromWeek: 20,
    toWeek: 22,
    trimester: 2,
    title: "Halfway there",
    focus: "Scan, leave paperwork and a lean gear plan.",
    reassurance:
      "Halfway! If the to-do list feels long, remember: a baby needs a safe place to sleep, milk, diapers and you. Everything else is a bonus.",
    partnerFocus: "File your own parental leave request this week, and handle the big-purchase research.",
    tasks: [
      { key: "w20-anatomy-done", title: "Attend the anatomy scan", detail: "Decide beforehand whether you want to know the sex, and tell the sonographer.", owner: "together", category: "medical", minutes: 60, essential: true },
      { key: "w20-notify-employer", title: "Formally notify your employer and file leave paperwork", detail: "Put it in writing and keep a copy. Confirm dates, pay and benefits.", owner: "mom", category: "admin", minutes: 30, essential: true },
      { key: "w20-partner-leave", title: "Partner requests parental leave", detail: "Tell your employer and agree dates now, so leave isn't a last-minute scramble.", owner: "partner", category: "admin", minutes: 15, essential: true, action: { type: "script", scriptId: "partner-tell-work", label: "Use the script" } },
      { key: "w20-hand-me-downs", title: "Ask for hand-me-downs before buying", detail: "Friends with older babies often have bouncers, carriers and clothes waiting for a new home.", why: "This alone can save a large share of your gear budget.", owner: "partner", category: "money", minutes: 5, action: { type: "script", scriptId: "hand-me-downs", label: "Send on WhatsApp" } },
      { key: "w20-big-purchases", title: "Price the big-ticket items", detail: "Stroller, car seat, crib. Add them to the budget as Essential / Nice / Skip and choose new vs. second-hand.", owner: "partner", category: "money", minutes: 45, action: { type: "link", href: "/budget", label: "Open budget" } },
      { key: "w20-nursery-plan", title: "Plan the baby's sleep space", detail: "A firm, flat crib or bassinet with a fitted sheet only. Many parents keep baby in their room for the first months.", owner: "together", category: "baby-prep", minutes: 20 },
    ],
  },
  {
    id: "w23",
    fromWeek: 23,
    toWeek: 25,
    trimester: 2,
    title: "Build your support team",
    focus: "Pediatrician, glucose test and gift planning.",
    reassurance:
      "Asking for help isn't a weakness — it's planning. The families who cope best are the ones who lined up support early.",
    partnerFocus: "Shortlist pediatricians and book the meet-and-greets.",
    tasks: [
      { key: "w23-pediatrician", title: "Choose a pediatrician or family doctor for the baby", detail: "Check they accept your insurance and are taking new patients. Many offer a free meet-and-greet.", owner: "partner", category: "baby-prep", minutes: 45, essential: true },
      { key: "w23-glucose-book", title: "Book the glucose screening (usually 24–28 weeks)", detail: "It checks for gestational diabetes. Ask if you need to fast beforehand.", owner: "partner", category: "medical", minutes: 10, essential: true, action: { type: "link", href: "/appointments", label: "Add the appointment" } },
      { key: "w23-movements", title: "Get to know your baby's movement pattern", detail: "Notice when baby is usually active. Any reduction later on should be checked the same day.", owner: "mom", category: "health", minutes: 5 },
      { key: "w23-gift-guide", title: "Guide gifts toward what you actually need", detail: "Share your registry and suggest meals or practical help instead of more stuff.", owner: "mom", category: "money", minutes: 5, action: { type: "script", scriptId: "gift-preferences", label: "Use the script" } },
    ],
  },
  {
    id: "w26",
    fromWeek: 26,
    toWeek: 27,
    trimester: 2,
    title: "Last weeks of trimester two",
    focus: "Tests, vaccines and the 'who does what' talk.",
    reassurance:
      "Talking through night feeds and chores now is one of the kindest things you can do for your future, exhausted selves.",
    partnerFocus: "Start the 'how we'll split things' conversation — don't wait for her to bring it up.",
    tasks: [
      { key: "w26-glucose-test", title: "Take the glucose test", detail: "Bring a snack for afterwards and something to do while you wait.", owner: "mom", category: "medical", minutes: 120, essential: true },
      { key: "w26-blood-type", title: "Ask whether you need anti-D (Rh-negative blood type)", detail: "If your blood type is Rh-negative, your provider may offer an injection around week 28.", owner: "mom", category: "medical", minutes: 5, action: { type: "link", href: "/questions", label: "Add to doctor questions" } },
      { key: "w26-vaccines", title: "Ask which pregnancy vaccines are recommended", detail: "Commonly whooping cough (Tdap), flu and, depending on season and country, RSV. Partners may need boosters too.", owner: "together", category: "medical", minutes: 10, essential: true, action: { type: "link", href: "/questions", label: "Add to doctor questions" } },
      { key: "w26-partner-talk", title: "Agree on 'who does what' after birth", detail: "Night feeds, leave dates, chores, pets and visitors. Write it down and review it at week 36.", owner: "together", category: "wellbeing", minutes: 45, essential: true },
    ],
  },

  // ======================= TRIMESTER 3 =======================
  {
    id: "w28",
    fromWeek: 28,
    toWeek: 30,
    trimester: 3,
    title: "Third trimester begins",
    focus: "Movements, birth preferences and more frequent visits.",
    reassurance:
      "Appointments get more frequent from here. That's routine care, not a sign something is wrong.",
    partnerFocus: "Come to as many appointments as you can, and learn the birth preferences as well as she does.",
    tasks: [
      { key: "w28-movements-daily", title: "Check baby's movements every day", detail: "If movements slow down or change, contact your provider the same day — don't wait until tomorrow.", owner: "mom", category: "health", minutes: 5, essential: true },
      { key: "w28-appointments", title: "Add the more frequent appointments", detail: "Visits often move to every 2–3 weeks now. Add each one so the printout stays up to date.", owner: "partner", category: "medical", minutes: 10, action: { type: "link", href: "/appointments", label: "Open appointments" } },
      { key: "w28-birth-preferences", title: "Draft your birth preferences", detail: "Pain relief, who's in the room, skin-to-skin, feeding plans, and what you'd want if plans change.", owner: "together", category: "birth", minutes: 45, essential: true },
      { key: "w28-print-visit", title: "Take the visit printout to every appointment", detail: "Symptoms, questions and birth preferences on one page, so nothing gets forgotten.", owner: "mom", category: "medical", minutes: 2, action: { type: "link", href: "/appointments/print", label: "Open visit printout" } },
      { key: "w28-feeding", title: "Learn the basics of feeding", detail: "Take a breastfeeding or bottle-feeding class and save a lactation support number.", owner: "together", category: "baby-prep", minutes: 90 },
    ],
  },
  {
    id: "w31",
    fromWeek: 31,
    toWeek: 33,
    trimester: 3,
    title: "Getting the home ready",
    focus: "Car seat, hospital registration and the meal plan.",
    reassurance:
      "Nesting is real, but so is fatigue. Delegate the physical jobs — your job is to rest and grow the baby.",
    partnerFocus: "Car seat, pre-registration and meal train are all yours this stretch.",
    tasks: [
      { key: "w31-preregister", title: "Pre-register at the hospital or birth center", detail: "Fill in the paperwork now so check-in is quick. Do the tour if you haven't.", owner: "partner", category: "birth", minutes: 30, essential: true },
      { key: "w31-car-seat", title: "Buy and install the car seat", detail: "Follow the manual exactly. Have the installation checked by a certified technician if available.", why: "Most hospitals expect a properly fitted car seat before you drive home.", owner: "partner", category: "baby-prep", minutes: 60, essential: true },
      { key: "w31-wash-clothes", title: "Wash baby clothes and bedding", detail: "Use a fragrance-free detergent. Organize by size: newborn, then 0–3 months.", owner: "partner", category: "baby-prep", minutes: 60 },
      { key: "w31-meal-train", title: "Set up a meal train", detail: "Ask friends and family to sign up for meal drop-offs in the first weeks.", owner: "partner", category: "wellbeing", minutes: 10, action: { type: "script", scriptId: "meal-train", label: "Send on WhatsApp" } },
      { key: "w31-freezer-meals", title: "Stock the freezer with easy meals", detail: "Aim for 10–15 meals — double tonight's dinner and freeze half.", owner: "together", category: "wellbeing", minutes: 120 },
      { key: "w31-postpartum-help", title: "Plan your postpartum support", detail: "Who helps in the first 2 weeks, who handles meals, and when visitors are welcome.", owner: "together", category: "wellbeing", minutes: 30 },
    ],
  },
  {
    id: "w34",
    fromWeek: 34,
    toWeek: 35,
    trimester: 3,
    title: "Almost ready",
    focus: "Bag, birth plan and your visitor plan.",
    reassurance:
      "Being prepared doesn't mean controlling everything. It means having a plan and a team — and you do.",
    partnerFocus: "You're the gatekeeper: send the visitor messages so she never has to be the 'bad guy'.",
    tasks: [
      { key: "w34-pack-bag", title: "Pack the hospital bags", detail: "Use the checklist for mom, baby and partner bags. Have them by the door by week 36.", owner: "together", category: "birth", minutes: 60, essential: true, action: { type: "link", href: "/hospital-bag", label: "Open bag checklist" } },
      { key: "w34-share-plan", title: "Finalize and share your birth preferences", detail: "Go through them with your provider and give a copy to your birth partner.", owner: "mom", category: "birth", minutes: 20, action: { type: "link", href: "/appointments/print", label: "Print with visit summary" } },
      { key: "w34-route", title: "Plan the route to the hospital and a backup", detail: "Time the drive at different hours. Know where to park and which entrance to use at night.", owner: "partner", category: "birth", minutes: 30 },
      { key: "w34-labor-signs", title: "Learn the signs of labor", detail: "Know how true contractions differ from practice ones, what waters breaking looks like, and when your provider wants you to call.", owner: "together", category: "birth", minutes: 30, essential: true },
      { key: "w34-no-visitors", title: "Tell family your hospital visitor plan", detail: "Send it now, before anyone makes travel plans.", owner: "partner", category: "boundaries", minutes: 5, essential: true, action: { type: "script", scriptId: "no-hospital-visitors", label: "Send on WhatsApp" } },
      { key: "w34-arrangements", title: "Arrange care for pets or other children", detail: "Have a first-choice and a backup person ready at any hour.", owner: "partner", category: "admin", minutes: 15 },
    ],
  },
  {
    id: "w36",
    fromWeek: 36,
    toWeek: 36,
    trimester: 3,
    title: "Week 36 — ready to go",
    focus: "Final checks and handovers.",
    reassurance:
      "From here, baby could come any time in the next few weeks. Everything important is already in place.",
    partnerFocus: "Finish your work handover and keep your phone charged and on loud.",
    tasks: [
      { key: "w36-gbs", title: "Ask about the Group B strep test", detail: "Many providers test between weeks 36 and 38. The result shapes your care in labor.", owner: "mom", category: "medical", minutes: 5, essential: true, action: { type: "link", href: "/questions", label: "Add to doctor questions" } },
      { key: "w36-work-handover", title: "Finish both work handovers", detail: "Write the handover doc, set out-of-office messages, and confirm your last days.", owner: "together", category: "admin", minutes: 60 },
      { key: "w36-postpartum-supplies", title: "Set up a postpartum care station", detail: "Maternity pads, peri bottle, comfy underwear, nipple cream, snacks and a water bottle by the bed.", owner: "partner", category: "wellbeing", minutes: 30 },
      { key: "w36-contacts", title: "Save key numbers in both phones", detail: "Labor ward, provider, pediatrician, lactation support, backup driver.", owner: "partner", category: "birth", minutes: 10 },
      { key: "w36-review-split", title: "Review your 'who does what' plan", detail: "Revisit what you agreed at week 26 and adjust for what you know now.", owner: "together", category: "wellbeing", minutes: 20 },
    ],
  },
  {
    id: "w37",
    fromWeek: 37,
    toWeek: 39,
    trimester: 3,
    title: "Full term",
    focus: "Rest, stay close to home, and know exactly when to go.",
    reassurance:
      "Waiting is the hardest part. Every day now is one more day of rest for you and growth for baby.",
    partnerFocus: "Send the 'no calls during labor' message and keep the car fuelled or charged.",
    tasks: [
      { key: "w37-when-to-go", title: "Confirm exactly when to call or go in", detail: "Ask your provider for their rule on contractions, waters breaking and bleeding, and write it down.", owner: "together", category: "birth", minutes: 10, essential: true, action: { type: "link", href: "/questions", label: "Add to doctor questions" } },
      { key: "w37-labor-updates", title: "Ask family to wait for your news", detail: "Let everyone know you'll message when you're ready — no calls during labor.", owner: "partner", category: "boundaries", minutes: 5, action: { type: "script", scriptId: "labor-updates", label: "Send on WhatsApp" } },
      { key: "w37-home-rules", title: "Prepare your home visiting rules", detail: "Short visits, message first, wash hands, stay home if sick. The partner sends it.", owner: "partner", category: "boundaries", minutes: 5, action: { type: "script", scriptId: "home-visiting-rules", label: "Use the script" } },
      { key: "w37-insurance-baby", title: "Find the deadline to add baby to your insurance", detail: "Many plans require it within a set window after birth (often around 30 days). Put a reminder in the calendar now.", owner: "partner", category: "admin", minutes: 15 },
      { key: "w37-rest", title: "Rest and lighten the schedule", detail: "Nap when you can, batch errands, and let the partner handle the rest.", owner: "mom", category: "wellbeing", minutes: 5 },
      { key: "w37-final-check", title: "Final check of the bags and car seat", detail: "Add chargers, snacks and documents. The car seat should already be installed.", owner: "partner", category: "birth", minutes: 15, action: { type: "link", href: "/hospital-bag", label: "Open bag checklist" } },
    ],
  },
  {
    id: "w40",
    fromWeek: 40,
    toWeek: 42,
    trimester: 3,
    title: "Due date and beyond",
    focus: "Patience, monitoring and the next plan.",
    reassurance:
      "Only a small share of babies arrive exactly on their due date. Going past it is common, and your provider will guide the next steps.",
    partnerFocus: "Field the 'any news yet?' messages so she doesn't have to.",
    tasks: [
      { key: "w40-overdue-plan", title: "Discuss the plan if baby comes late", detail: "Ask about extra monitoring and when induction would be offered.", owner: "together", category: "medical", minutes: 15, essential: true, action: { type: "link", href: "/questions", label: "Add to doctor questions" } },
      { key: "w40-movements", title: "Keep checking baby's movements", detail: "Movements should not slow down near the end. If they do, call your provider right away.", owner: "mom", category: "health", minutes: 5, essential: true },
      { key: "w40-gentle", title: "Stay gently active and rested", detail: "Walks, showers, a favorite show. Keep the bags and car ready.", owner: "mom", category: "wellbeing", minutes: 5 },
    ],
  },
];

/** When to seek care — shown on the roadmap, dashboard and printout. Not exhaustive. */
export const URGENT_SIGNS: string[] = [
  "Vaginal bleeding or fluid leaking",
  "Severe or constant belly pain",
  "Severe headache, vision changes, or sudden swelling of the face or hands",
  "Baby moving less than usual, or a change in the pattern (later in pregnancy)",
  "Fever of 38 °C / 100.4 °F or higher",
  "Regular contractions before 37 weeks",
  "Can't keep any fluids down for 24 hours",
  "Feeling very low, anxious or unable to cope — reach out, you deserve support",
];

/* =========================================================
   Helpers
   ========================================================= */

export const ALL_TASKS: RoadmapTask[] = ROADMAP.flatMap((s) => s.tasks);

/** Per-user task state from `roadmap_progress`. */
export type TaskState = {
  task_key: string;
  assignee: Owner | null;
  completed_at: string | null;
};

export type TaskStateMap = ReadonlyMap<string, TaskState>;

export function toStateMap(rows: TaskState[] | null | undefined): TaskStateMap {
  return new Map((rows ?? []).map((r) => [r.task_key, r]));
}

export function isDone(task: RoadmapTask, states: TaskStateMap): boolean {
  return Boolean(states.get(task.key)?.completed_at);
}

/** Owner after any reassignment by the user. */
export function resolveOwner(task: RoadmapTask, states: TaskStateMap): Owner {
  return states.get(task.key)?.assignee ?? task.owner;
}

/** Tasks a given person should see: their own plus shared ones. */
export function tasksFor(who: "mom" | "partner", tasks: RoadmapTask[], states: TaskStateMap) {
  return tasks.filter((t) => {
    const owner = resolveOwner(t, states);
    return owner === who || owner === "together";
  });
}

/** Stage that covers a given pregnancy week (clamped to first/last stage). */
export function getStageForWeek(week: number): RoadmapStage {
  return (
    ROADMAP.find((s) => week >= s.fromWeek && week <= s.toWeek) ??
    (week < ROADMAP[0].fromWeek ? ROADMAP[0] : ROADMAP[ROADMAP.length - 1])
  );
}

export function getStagesByTrimester(trimester: Trimester): RoadmapStage[] {
  return ROADMAP.filter((s) => s.trimester === trimester);
}

export function getUpcomingStages(week: number, count = 1): RoadmapStage[] {
  const i = ROADMAP.indexOf(getStageForWeek(week));
  return ROADMAP.slice(i + 1, i + 1 + count);
}

/** Unfinished tasks from past stages — the gentle "catch up" list. */
export function getOverdueTasks(week: number, states: TaskStateMap): RoadmapTask[] {
  return ROADMAP.filter((s) => s.toWeek < week)
    .flatMap((s) => s.tasks)
    .filter((t) => !isDone(t, states));
}

export function getProgress(tasks: RoadmapTask[], states: TaskStateMap) {
  const done = tasks.filter((t) => isDone(t, states)).length;
  const total = tasks.length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

/** Share of all tasks that are the partner's — a selling point on the Co-Pilot page. */
export function partnerShare(states: TaskStateMap = new Map()): number {
  const partner = ALL_TASKS.filter((t) => resolveOwner(t, states) === "partner").length;
  return Math.round((partner / ALL_TASKS.length) * 100);
}

export function findTask(key: string): RoadmapTask | undefined {
  return ALL_TASKS.find((t) => t.key === key);
}
