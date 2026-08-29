// Shared skill taxonomy used to bucket exercises for the Progress & Analytics
// skills-breakdown chart. Exercises created going forward set this explicitly;
// older records fall back to a type-based inference so nothing is left unbucketed.
export const SKILLS = ['listening', 'speaking', 'reading', 'writing', 'vocabulary', 'grammar'];

const TYPE_TO_SKILL = {
  listening: 'listening',
  speaking: 'speaking',
  writing: 'writing',
  matching: 'vocabulary',
  fill_blank: 'grammar',
  multiple_choice: 'reading',
};

export const inferSkillFromType = (type) => TYPE_TO_SKILL[type] || 'reading';
