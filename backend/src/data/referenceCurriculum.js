// The ONE reference pathway required by PRIORITY 7 of the Phase 2 brief: A1 -> A2 -> B1,
// themed "English for Work", demonstrating the full architecture end-to-end (objectives,
// grammar, vocabulary, reading, speaking, review, assessment) on real, hand-authored content -
// not the templated generator in contentLibrary.js, and not thousands of exercises.
//
// Deliberately excluded from this reference pathway, and why:
// - Listening: no real audio-recording/licensing pipeline exists yet (PRIORITY 13/14 says use
//   original or properly licensed audio, never fabricate placeholder files). Left as a
//   documented gap rather than faking it.
// - Writing exercises: the current exercise-type UI only renders multiple_choice, fill_blank,
//   and speaking (see the earlier product audit) - a "writing" exercise here would silently be
//   ungradeable. Not added until that UI exists.
//
// Every lesson traces back to CURRICULUM_BLUEPRINT (backend/src/data/curriculumBlueprint.js)
// for its level's communicative goals - this file is the executable content, that file is the
// design document explaining why this content exists.

export const REFERENCE_COURSE = {
  id: 'english-for-work-reference',
  title: 'English for Work: A1-B1 Reference Pathway',
  description:
    'A small, hand-built reference course demonstrating LinguaNest\'s CEFR-referenced curriculum architecture end to end: real learning objectives, grammar, vocabulary, reading, and teacher-reviewed speaking practice for workplace English, from A1 through B1.',
  language: 'English',
  level: 'Beginner',
  category: 'Conversation',
  estimatedHours: 3,
  lessons: [
    {
      id: 'efw-ref-a1-introducing-yourself',
      title: 'Introducing Yourself at Work',
      description: 'Meet a new colleague and learn to introduce yourself clearly at work.',
      cefr: 'A1',
      order: 1,
      difficulty: 'Easy',
      objectives: [
        { description: 'The learner can introduce themselves by name, job, and workplace using simple sentences.', skill: 'speaking' },
        { description: "The learner can use the present simple form of 'to be' and common verbs to state basic facts about themselves.", skill: 'grammar' },
        { description: 'The learner can recognize and use basic workplace vocabulary: colleague, manager, department, office, meeting.', skill: 'vocabulary' },
      ],
      content:
        "Read: Aziz is a new employee at a software company in Tashkent.\n\n" +
        '"Hello, my name is Aziz. I am a junior developer. I work in the technology department. ' +
        'My manager is Malika. I have a meeting with my team every morning at nine o\'clock."\n\n' +
        'Notice how Aziz uses simple present-tense sentences to give clear, basic facts about himself - ' +
        'his name, his job, his department, and his daily routine.',
      vocabulary: [
        { word: 'colleague', translation: "hamkasb", examples: ['My colleague sits next to me.'] },
        { word: 'manager', translation: 'menejer', examples: ['My manager is Malika.'] },
        { word: 'department', translation: "bo'lim", examples: ['I work in the technology department.'] },
        { word: 'office', translation: 'ofis', examples: ['The office opens at nine.'] },
        { word: 'meeting', translation: 'uchrashuv', examples: ['We have a meeting every morning.'] },
      ],
      grammar: [
        {
          rule: "Present simple: 'to be' and common verbs",
          explanation: "Use am/is/are to state facts about identity and role. Use the base verb (+s for he/she/it) for actions and routines.",
          examples: ['I am a junior developer.', 'She works in the office.', 'They have a meeting at nine.'],
        },
      ],
      exercises: [
        {
          id: 'efw-ref-a1-mc-1',
          title: 'Quick Check',
          type: 'multiple_choice',
          question: 'Choose the correct sentence.',
          options: ['I am a developer.', 'I is a developer.', 'I are a developer.', 'I be a developer.'],
          correctAnswer: 0, // graded by option index, not text - see contentLibrary.js's createExercise comment
          explanation: "'Am' is the correct form of 'to be' with 'I'.",
          difficulty: 'Easy',
          points: 10,
        },
        {
          id: 'efw-ref-a1-fb-1',
          title: 'Sentence Builder',
          type: 'fill_blank',
          question: 'Complete the sentence: My ___ is Malika. She helps me with my work.',
          correctAnswer: 'manager',
          explanation: "'Manager' fits the context - someone who helps and oversees your work.",
          difficulty: 'Easy',
          points: 10,
        },
        {
          id: 'efw-ref-a1-speak-1',
          title: 'Speaking Task',
          type: 'speaking',
          question: 'Introduce yourself in 3-4 sentences: your name, your job, and where you work.',
          correctAnswer: 'Introduce yourself in 3-4 sentences: your name, your job, and where you work.',
          explanation: 'Focus on clear, simple present-tense sentences. A teacher will review your recording.',
          difficulty: 'Easy',
          points: 20,
        },
      ],
    },
    {
      id: 'efw-ref-a2-describing-your-job',
      title: 'Describing Your Job',
      description: 'Talk about your daily responsibilities and a recent task at work.',
      cefr: 'A2',
      order: 2,
      difficulty: 'Medium',
      objectives: [
        { description: 'The learner can describe daily job responsibilities using the present simple.', skill: 'grammar' },
        { description: 'The learner can describe a recently completed work task using the past simple.', skill: 'grammar' },
        { description: 'The learner can read a short workplace schedule and identify key information.', skill: 'reading' },
      ],
      content:
        "Read: Dilnoza's Monday schedule.\n\n" +
        '"Every day, I check my emails first. Then I attend the team meeting and update our project report. ' +
        'Yesterday, I finished a report one day early and my manager was happy about it."\n\n' +
        'Dilnoza uses the present simple for her routine (check, attend, update) and the past simple for a ' +
        'completed action (finished, was) - notice how the tense changes depending on whether she is ' +
        'describing a habit or a specific, finished event.',
      vocabulary: [
        { word: 'responsibility', translation: "mas'uliyat", examples: ['Checking emails is my responsibility.'] },
        { word: 'task', translation: 'vazifa', examples: ['I finished the task early.'] },
        { word: 'deadline', translation: 'muddat', examples: ['The deadline is Friday.'] },
        { word: 'report', translation: 'hisobot', examples: ['I update our project report every day.'] },
        { word: 'schedule', translation: 'jadval', examples: ["Check your schedule for today's meetings."] },
      ],
      grammar: [
        {
          rule: 'Present simple (routines) vs past simple (completed actions)',
          explanation: 'Use the present simple for habits and routines. Use the past simple for a specific, finished action, often with a time word like "yesterday".',
          examples: ['I check my emails every morning.', 'Yesterday, I finished the report early.'],
        },
      ],
      exercises: [
        {
          id: 'efw-ref-a2-mc-1',
          title: 'Quick Check',
          type: 'multiple_choice',
          question: 'Choose the correct sentence.',
          options: ['Yesterday, I finished the report.', 'Yesterday, I finish the report.', 'Yesterday, I am finishing the report.', 'Yesterday, I finishing the report.'],
          correctAnswer: 0,
          explanation: "'Yesterday' signals a completed action, so the past simple ('finished') is correct.",
          difficulty: 'Medium',
          points: 10,
        },
        {
          id: 'efw-ref-a2-fb-1',
          title: 'Sentence Builder',
          type: 'fill_blank',
          question: 'Complete the sentence: Please send the report before the ___ on Friday.',
          correctAnswer: 'deadline',
          explanation: "'Deadline' is the latest time something must be finished by.",
          difficulty: 'Medium',
          points: 15,
        },
        {
          id: 'efw-ref-a2-speak-1',
          title: 'Speaking Task',
          type: 'speaking',
          question: 'Describe your job in 4-5 sentences: what you do every day, and one thing you did recently.',
          correctAnswer: 'Describe your job in 4-5 sentences: what you do every day, and one thing you did recently.',
          explanation: 'Try to use both present simple (routine) and past simple (a recent, finished task).',
          difficulty: 'Medium',
          points: 20,
        },
      ],
    },
    {
      id: 'efw-ref-b1-explaining-a-problem',
      title: 'Explaining a Workplace Problem',
      description: 'Explain a problem at work clearly and propose a solution.',
      cefr: 'B1',
      order: 3,
      difficulty: 'Medium',
      objectives: [
        { description: 'The learner can explain a workplace problem and propose a solution using connected sentences.', skill: 'speaking' },
        { description: 'The learner can use first conditional sentences to describe consequences and solutions.', skill: 'grammar' },
        { description: 'The learner can read a short professional email and identify the main request.', skill: 'reading' },
      ],
      content:
        'Read: An email from a project manager.\n\n' +
        '"Hi team, the client project has been delayed because of a technical issue. If we do not resolve it ' +
        'by Thursday, we will need to escalate it to the client. Please let me know your suggestions today."\n\n' +
        'Notice the structure: the writer states the problem (delayed, technical issue), the consequence using ' +
        'a first conditional (if we do not resolve it, we will need to escalate), and a clear request for action.',
      vocabulary: [
        { word: 'issue', translation: 'muammo', examples: ['We have a technical issue.'] },
        { word: 'delay', translation: 'kechikish', examples: ['The project has been delayed.'] },
        { word: 'resolve', translation: 'hal qilmoq', examples: ['We need to resolve this by Thursday.'] },
        { word: 'escalate', translation: "yuqoriga ko'tarmoq", examples: ["We'll escalate it to the client."] },
        { word: 'suggestion', translation: 'taklif', examples: ['Please share your suggestions.'] },
      ],
      grammar: [
        {
          rule: 'First conditional',
          explanation: 'Use if + present simple, will + base verb to describe a likely consequence of a real, possible situation.',
          examples: ['If we do not resolve it, we will escalate it.', 'If the deadline moves, the client will be informed.'],
        },
      ],
      exercises: [
        {
          id: 'efw-ref-b1-mc-1',
          title: 'Quick Check',
          type: 'multiple_choice',
          question: 'Choose the correct sentence.',
          options: ['If we do not fix it, we will escalate it.', 'If we do not fix it, we escalate it.', 'If we will not fix it, we will escalate it.', 'If we not fix it, we will escalate it.'],
          correctAnswer: 0,
          explanation: 'First conditional: if + present simple, will + base verb.',
          difficulty: 'Medium',
          points: 10,
        },
        {
          id: 'efw-ref-b1-fb-1',
          title: 'Sentence Builder',
          type: 'fill_blank',
          question: 'Complete the sentence: We need to ___ this issue before the client notices.',
          correctAnswer: 'resolve',
          explanation: "'Resolve' means to find a solution to a problem.",
          difficulty: 'Medium',
          points: 15,
        },
        {
          id: 'efw-ref-b1-speak-1',
          title: 'Speaking Task',
          type: 'speaking',
          question: 'Explain a real or imagined problem at work in 5-6 sentences, and propose a solution using a first conditional sentence.',
          correctAnswer: 'Explain a real or imagined problem at work in 5-6 sentences, and propose a solution using a first conditional sentence.',
          explanation: 'Structure: state the problem, explain the consequence with "if... will...", then propose your solution.',
          difficulty: 'Medium',
          points: 20,
        },
      ],
    },
  ],
}
