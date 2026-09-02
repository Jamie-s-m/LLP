// Any paid plan (local/learner/family/teaching) counts equally toward access - what gates
// content is billing.status, not which specific plan key the user is on. Mirrors the exact
// status set the founder confirmed: 'active' and 'trialing' only - past_due/canceled/unpaid/
// incomplete all fall back to the free tier, matching a real subscription's actual entitlement.
const ENTITLED_BILLING_STATUSES = new Set(['active', 'trialing']);

export const hasActivePlan = (user) => ENTITLED_BILLING_STATUSES.has(user?.billing?.status);

// Free tier, confirmed with the founder: each course's A1-level content, plus Lesson 1 of every
// course regardless of that course's own level, stays free. A2+ requires an active plan.
export const isLessonFree = (lesson) => lesson.order === 1 || lesson.cefr === 'A1';

// Mirrors the {error: {status, message}} convention assertLessonOwnership (ownership.js)
// already uses, rather than inventing a second error shape for the same kind of caller.
export const requireLessonEntitlement = (lesson, user) => {
  if (isLessonFree(lesson) || hasActivePlan(user)) return { allowed: true };
  return {
    allowed: false,
    error: {
      status: 402,
      message: 'This lesson requires an active LinguaNest plan.',
      data: { requiresUpgrade: true },
    },
  };
};

// Flashcards aren't tagged with their own CEFR level - only their course is, and there's no
// "lesson 1" equivalent for a course-wide deck. A course counts as free for flashcard purposes
// only when it's entirely A1 (Course.cefr === 'A1'); a higher single-level course or a
// multi-level pathway (cefr: null) is gated.
export const isCourseFreeForFlashcards = (courseCefr) => courseCefr === 'A1';
