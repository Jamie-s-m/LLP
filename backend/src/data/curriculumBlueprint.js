// LinguaNest Curriculum Blueprint
//
// This is the design document the content system is built against, not a database table.
// It exists so no lesson gets created without first answering "why does this exist, and what
// level/skill does it belong to" - see PRIORITY 6 of the Phase 2 brief.
//
// Reference frameworks: the CEFR (Common European Framework of Reference) and its 2020
// Companion Volume, plus publicly available information about how Cambridge English exams are
// structured (skills covered, task types in general terms). This blueprint does NOT reproduce
// any Cambridge exam question or copyrighted text, and LinguaNest does not claim Cambridge
// certification, official CEFR certification, or endorsement anywhere - see
// backend/src/data/certificateMethodology.js for the exact language used on issued
// certificates.
//
// Every level below is described across the same 9 dimensions so a reviewer (or the content
// pipeline) can check completeness at a glance. A1-B2 are filled in with real, original
// content design; C1-C2 are intentionally left as placeholders per PRIORITY 6/7 - do not
// build full C1-C2 content before the A1-B2 reference pathway is validated with real users.

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const CURRICULUM_BLUEPRINT = {
  A1: {
    status: 'blueprint+reference_pathway',
    communicativeGoals: [
      'Introduce yourself and others using simple phrases',
      'Give basic personal information (name, nationality, job, family)',
      'Understand and follow simple, slow instructions',
      'Ask and answer basic questions about immediate needs',
      'Handle simple everyday transactions (shopping, ordering)',
    ],
    grammarProgression: [
      'Present simple: to be, have, common verbs',
      'Subject pronouns and possessive adjectives',
      'There is / there are',
      'Basic question forms (wh- questions, yes/no questions)',
      'Plural nouns and basic articles (a/an/the)',
    ],
    vocabularyDomains: ['greetings', 'family', 'numbers and time', 'daily routines', 'food and drink', 'workplace basics'],
    listeningGoals: ['Recognize familiar words and very basic phrases spoken slowly and clearly'],
    speakingGoals: ['Produce simple, isolated phrases about people and places', 'Ask/answer simple questions in a predictable exchange'],
    readingGoals: ['Understand familiar names, words, and very simple sentences (signs, forms, short notices)'],
    writingGoals: ['Write a short, simple postcard-length message', 'Fill in a form with personal details'],
    interaction: ['Interact in a simple way given a slow, repeated, or rephrased exchange'],
    practicalSituations: ['Introducing yourself at work', 'A first-day-at-work small talk exchange', 'Basic workplace greetings and check-ins'],
  },
  A2: {
    status: 'blueprint+reference_pathway',
    communicativeGoals: [
      'Describe routines, habits, and past experiences in simple terms',
      'Handle common workplace and travel situations',
      'Understand the main point of short, clear, predictable exchanges',
      'Communicate simple, direct needs and requests',
      'Write short, simple connected messages',
    ],
    grammarProgression: [
      'Past simple (regular and common irregular verbs)',
      'Present continuous vs present simple',
      'Comparatives and superlatives',
      'Modal verbs: can, should, have to',
      'Future with going to / will (basic)',
    ],
    vocabularyDomains: ['workplace tasks and departments', 'travel and transport', 'health and routines', 'shopping and services', 'making plans'],
    listeningGoals: ['Catch the main point in short, clear messages and announcements on familiar topics'],
    speakingGoals: ['Describe your job, routine, and past weekend in a few connected sentences', 'Handle short social exchanges'],
    readingGoals: ['Understand short, simple texts on familiar matters (emails, schedules, short articles)'],
    writingGoals: ['Write short, connected notes and messages about immediate needs', 'Describe past events in simple connected sentences'],
    interaction: ['Ask for and give directions, handle simple transactions, exchange information on familiar topics'],
    practicalSituations: ['Describing your job responsibilities', 'A short workplace email', 'Booking travel for a work trip'],
  },
  B1: {
    status: 'blueprint+reference_pathway',
    communicativeGoals: [
      'Explain experiences, events, and ambitions with reasons and explanations',
      'Discuss familiar professional topics with some confidence',
      'Understand the main points of clear standard speech on familiar matters',
      'Participate in routine workplace conversations and small meetings',
      'Write connected text on familiar or personally interesting subjects',
    ],
    grammarProgression: [
      'Present perfect vs past simple',
      'First and second conditionals',
      'Relative clauses (who/which/that)',
      'Passive voice (present and past, overview)',
      'Reported speech (statements)',
    ],
    vocabularyDomains: ['professional responsibility and process', 'opinions and debate', 'media and current issues', 'strategy and planning', 'workplace problem-solving'],
    listeningGoals: ['Understand the main points of clear standard speech on familiar workplace topics, including short narratives'],
    speakingGoals: ['Give a short, structured explanation of a problem and a proposed solution', 'Participate in a routine meeting or discussion'],
    readingGoals: ['Understand texts that consist mainly of everyday or job-related language, including straightforward factual articles'],
    writingGoals: ['Write straightforward connected text on familiar professional topics', 'Summarize and give an opinion on a workplace issue in writing'],
    interaction: ['Enter unprepared into conversation on familiar topics, follow up on ideas, express and justify opinions'],
    practicalSituations: ['Explaining a workplace problem and proposing a fix', 'Participating in a team meeting', 'Writing a professional email with a request and justification'],
  },
  B2: {
    status: 'blueprint_only',
    communicativeGoals: [
      'Interact with a degree of fluency and spontaneity with native speakers',
      'Present clear, detailed viewpoints on a range of professional topics',
      'Understand extended speech and complex argumentation',
      'Negotiate and take part in formal discussions',
    ],
    grammarProgression: [
      'Advanced conditionals (mixed, inverted)',
      'Passive reporting structures (it is believed that...)',
      'Complex noun/relative clauses',
      'Nuance, register, and hedging language',
    ],
    vocabularyDomains: ['negotiation', 'evidence and argument', 'frameworks and proposals', 'formal register vs informal register'],
    listeningGoals: ['Understand extended speech and complex lines of argument on familiar and unfamiliar professional topics'],
    speakingGoals: ['Present and defend a proposal in a professional meeting', 'Handle disagreement and negotiation with appropriate register'],
    readingGoals: ['Read articles and reports on contemporary professional problems, understanding viewpoint and argument'],
    writingGoals: ['Write clear, detailed text on a range of professional subjects, weighing information and arguments'],
    interaction: ['Sustain a discussion with fluency, actively negotiate meaning, adjust register to the audience'],
    practicalSituations: ['Negotiating terms in a professional meeting', 'Writing a persuasive project proposal'],
    note: 'Goals and grammar/vocabulary progression are drafted; no reference lessons built yet. Do not build full B2 content before the A1-B1 reference pathway is validated with real users (see PRIORITY 7/25).',
  },
  C1: {
    status: 'future_architecture_only',
    note: 'Not designed yet. Reserved level - the schema (CEFR_LEVELS, Lesson.cefr enum, PlacementQuestion.cefr) already supports it so this can be added later without a migration.',
  },
  C2: {
    status: 'future_architecture_only',
    note: 'Not designed yet. Reserved level - see C1 note.',
  },
};

// A single place documenting what "the initial commercially important range" (PRIORITY 4)
// actually is, and why - referenced by the reference curriculum and by anything that needs to
// explain current coverage honestly (marketing copy, admin content-coverage views).
export const CURRICULUM_COVERAGE_SUMMARY = {
  levelsWithReferenceLessons: ['A1', 'A2', 'B1'],
  levelsWithBlueprintOnly: ['B2'],
  levelsNotDesigned: ['C1', 'C2'],
  theme: 'English for Work',
  reasoning: 'A1-B1 covers the beachhead persona from the earlier audit (migration-track and IT-adjacent learners in Uzbekistan) without overbuilding for a level range that has zero validated demand data yet.',
};
