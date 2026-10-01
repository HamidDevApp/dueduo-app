import type { Trimester } from "@/lib/pregnancy";

/** One-tap question ideas for each trimester — added to the user's list on click. */
export const QUESTION_IDEAS: Record<Trimester, string[]> = {
  1: [
    "Which prenatal vitamin and dose is right for me?",
    "Are all my current medications and supplements safe?",
    "Which screening tests do you recommend, and when?",
    "Which symptoms mean I should call you right away?",
    "Can I keep doing my current exercise routine?",
  ],
  2: [
    "What will the anatomy scan check?",
    "When is the glucose test, and do I need to fast?",
    "Which vaccines do you recommend during pregnancy, and when?",
    "Is it safe to travel, and until which week?",
    "How will I know if the baby's movements are normal?",
  ],
  3: [
    "When exactly should we call or come in once labor starts?",
    "What pain relief options are available where I'm giving birth?",
    "What happens if I go past my due date?",
    "When will you test for Group B strep?",
    "Can we go over my birth preferences together?",
  ],
};

export const ALL_QUESTION_IDEAS = new Set(Object.values(QUESTION_IDEAS).flat());
