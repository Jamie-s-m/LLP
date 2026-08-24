const courseBlueprints = [
  {
    id: 'general-english-a1',
    title: 'General English A1',
    level: 'Beginner',
    language: 'English',
    category: 'Conversation',
    description: 'Build everyday English confidence with practical greetings, routines, travel language and simple social conversation.',
    modules: [
      { title: 'Hello and Me', topic: 'introductions', units: ['Introducing Yourself', 'Everyday Life'] },
      { title: 'People and Places', topic: 'daily life', units: ['Family and Home', 'Around Town'] },
      { title: 'Food and Shopping', topic: 'shopping', units: ['Food and Drink', 'Buying and Paying'] },
      { title: 'Time and Routines', topic: 'routines', units: ['Daily Routines', 'Time and Schedules'] },
      { title: 'Past and Future Basics', topic: 'planning', units: ['Last Weekend', 'Next Week'] },
    ],
  },
  {
    id: 'general-english-a2',
    title: 'General English A2',
    level: 'Intermediate',
    language: 'English',
    category: 'Grammar',
    description: 'Expand to real-world communication, travel, past events, routines, opinions and everyday problem solving.',
    modules: [
      { title: 'Daily Life and Habits', topic: 'routine', units: ['Routines', 'Past Habits'] },
      { title: 'Travel and Services', topic: 'travel', units: ['Travel Plans', 'Public Services'] },
      { title: 'Food and Health', topic: 'wellbeing', units: ['Healthy Choices', 'At the Clinic'] },
      { title: 'Work and Study', topic: 'work', units: ['Jobs and Tasks', 'Study Life'] },
      { title: 'Talking About the Future', topic: 'planning', units: ['Plans and Goals', 'Future Predictions'] },
    ],
  },
  {
    id: 'general-english-b1',
    title: 'General English B1',
    level: 'Intermediate',
    language: 'English',
    category: 'Reading',
    description: 'Improve clear communication, give opinions, describe experiences and move from basic fluency to confident everyday English.',
    modules: [
      { title: 'Life Experience', topic: 'experience', units: ['Past Experiences', 'Achievements'] },
      { title: 'Work and Responsibilities', topic: 'work', units: ['Teamwork', 'Problems at Work'] },
      { title: 'Travel and Culture', topic: 'travel', units: ['City Life', 'Cultural Habits'] },
      { title: 'Media and Opinions', topic: 'society', units: ['News and Views', 'Arguments and Debate'] },
      { title: 'Planning and Problem Solving', topic: 'problem solving', units: ['Projects', 'Solutions'] },
    ],
  },
  {
    id: 'general-english-b2',
    title: 'General English B2',
    level: 'Advanced',
    language: 'English',
    category: 'Writing',
    description: 'Reach high-intermediate fluency through complex grammar, negotiation, argumentation, and professional communication.',
    modules: [
      { title: 'Professional Communication', topic: 'work', units: ['Meetings', 'Email Writing'] },
      { title: 'Debate and Analysis', topic: 'ideas', units: ['Presenting Ideas', 'Counterarguments'] },
      { title: 'Leadership and Change', topic: 'leadership', units: ['Management Skills', 'Organisational Change'] },
      { title: 'Technology and Society', topic: 'digital life', units: ['Digital Trends', 'Ethics and Media'] },
      { title: 'Advanced Language Control', topic: 'precision', units: ['Nuance and Accuracy', 'Formal and Informal Style'] },
    ],
  },
  {
    id: 'business-english',
    title: 'Business English',
    level: 'Intermediate',
    language: 'English',
    category: 'Conversation',
    description: 'Develop practical business English for meetings, negotiations, emails, presentations and international teams.',
    modules: [
      { title: 'Workplace Basics', topic: 'business life', units: ['Introductions', 'Workplace Communication'] },
      { title: 'Meetings', topic: 'meetings', units: ['Running Meetings', 'Following Up'] },
      { title: 'Emails and Reports', topic: 'writing', units: ['Professional Email', 'Reports and Updates'] },
      { title: 'Presentations', topic: 'pitching', units: ['Short Talks', 'Q&A Handling'] },
      { title: 'Negotiation', topic: 'sales', units: ['Price and Terms', 'Conflict and Agreement'] },
    ],
  },
  {
    id: 'english-speaking',
    title: 'English Speaking',
    level: 'Intermediate',
    language: 'English',
    category: 'Conversation',
    description: 'Speak with confidence through short prompts, storytelling, roleplay, interview practice, and everyday communication.',
    modules: [
      { title: 'Introductions and Small Talk', topic: 'social talk', units: ['Greetings', 'Conversation Flow'] },
      { title: 'Daily Stories', topic: 'storytelling', units: ['My Day', 'Memories'] },
      { title: 'Travel and Culture', topic: 'travel', units: ['Tourist Talk', 'Planning a Trip'] },
      { title: 'Work and Problems', topic: 'professional life', units: ['Work Conversations', 'Problem Solving'] },
      { title: 'Viewpoints and Debate', topic: 'opinion', units: ['Opinions', 'Debating Ideas'] },
    ],
  },
  {
    id: 'english-for-kids',
    title: 'English for Kids',
    level: 'Beginner',
    language: 'English',
    category: 'Vocabulary',
    description: 'Friendly, age-appropriate English for children with family, school, animals, nature and everyday activities.',
    modules: [
      { title: 'My World', topic: 'children', units: ['Me and My Family', 'My Home'] },
      { title: 'School and Friends', topic: 'school', units: ['School Life', 'Friends and Feelings'] },
      { title: 'Food and Animals', topic: 'animals', units: ['Foods I Like', 'Animals We Know'] },
      { title: 'Hobbies and Nature', topic: 'play', units: ['Sports and Fun', 'Nature Walks'] },
      { title: 'Stories and Senses', topic: 'imagination', units: ['Story Time', 'My Five Senses'] },
    ],
  },
]

const baseVocabulary = [
  'achievement','active','address','adventure','afternoon','agreement','alert','amazing','analyze','answer','apartment','appointment','arrive','assistant','attention','average','balance','basic','beginner','benefit','bicycle','booking','breeze','budget','business','calendar','camera','career','careful','celebrate','chance','change','charge','chat','check','choice','clean','clear','climate','close','collect','comfortable','comment','community','complete','concern','confident','connect','continue','control','conversation','correct','create','culture','daily','danger','debate','decide','describe','detail','develop','dialogue','diet','difficult','direct','discover','discussion','document','during','easy','effect','efficient','email','emotion','energy','enjoy','entry','environment','equal','essay','event','everyday','example','exercise','expect','experience','explain','family','favorite','feeling','field','finish','flexible','flower','focus','follow','format','free','friend','future','gather','general','goal','grade','grammar','group','growth','guide','habit','happen','health','helpful','history','home','honest','hour','idea','improve','include','independent','industry','introduce','invite','issue','journey','judge','key','kind','language','large','learn','lesson','letter','level','limit','listen','local','location','luck','manage','market','match','meaning','measure','member','method','minute','moment','morning','music','native','natural','nearly','necessary','neighbor','note','number','object','occasion','opinion','order','organize','original','particular','partner','path','peace','people','percent','perfect','period','person','phrase','picture','plan','point','policy','positive','practice','prepare','present','problem','process','product','progress','project','promise','quick','quiet','question','raise','rate','reason','record','reduce','reference','reflect','region','regular','relax','remain','remember','report','request','result','review','risk','routine','schedule','school','science','season','second','section','service','share','signal','simple','skill','social','solution','speak','special','speech','speed','spend','stability','standard','start','statement','station','step','story','strategy','strength','study','success','suggest','support','sustain','system','table','talk','target','teacher','technique','temple','text','thank','thought','ticket','topic','travel','treat','trend','understand','urgent','useful','vacation','value','variety','verb','version','village','voice','visit','vocabulary','wait','walk','watch','weather','week','welcome','window','word','work','world','write','year','young','youth','zone']

const topicClusters = {
  greetings: ['hello','hi','good morning','good afternoon','nice to meet you','please','thanks'],
  travel: ['ticket','passport','hotel','train','airport','map','delay','luggage'],
  family: ['mother','father','sister','brother','grandmother','grandfather','cousin','friend'],
  food: ['breakfast','lunch','dinner','juice','bread','fruit','vegetable','meal'],
  work: ['meeting','project','team','deadline','report','client','office','document'],
  school: ['student','teacher','lesson','classroom','homework','library','grade','exam'],
  feelings: ['happy','calm','nervous','excited','tired','confident','worried','proud'],
  nature: ['river','forest','mountain','garden','sunrise','wind','cloud','rain'],
  business: ['contract','budget','customer','sales','invoice','target','performance','strategy'],
  technology: ['device','software','signal','screen','battery','button','camera','network'],
}

const wordBank = [...new Set([
  ...baseVocabulary,
  ...Object.values(topicClusters).flat(),
  ...Array.from({ length: 300 }, (_, index) => `word-${index + 1}`),
])]

const assessmentBank = [
  { level: 'A1', question: 'Choose the correct answer: I ___ from Tashkent.', answer: 'am', options: ['am', 'is', 'are', 'be'], explanation: 'Use am with I.' },
  { level: 'A1', question: 'Complete the sentence: She ___ coffee every morning.', answer: 'drinks', options: ['drink', 'drinks', 'drinking', 'drank'], explanation: 'Third-person singular in the present simple takes -s.' },
  { level: 'A2', question: 'Choose the correct form: We ___ a new house last year.', answer: 'bought', options: ['buy', 'buys', 'bought', 'buying'], explanation: 'Last year tells us the tense is past simple.' },
  { level: 'A2', question: 'Which sentence is correct?', answer: 'Could you help me, please?', options: ['Could you help me, please?', 'Can you to help me?', 'Do you help me kindly?', 'You could help me now.'], explanation: 'Could you... is the polite request structure.' },
  { level: 'B1', question: 'Choose the sentence with the correct conditional form.', answer: 'If I had more time, I would study more.', options: ['If I had more time, I would study more.', 'If I have more time, I would study more.', 'If I would have more time, I studied more.', 'If I had more time, I will study more.'], explanation: 'Second conditional uses if + past simple, would + infinitive.' },
  { level: 'B1', question: 'Which is the best reported speech version?', answer: 'She said that she was tired.', options: ['She said that she was tired.', 'She said that she is tired.', 'She said that I was tired.', 'She said tired.'], explanation: 'Backshift the tense in reported speech.' },
  { level: 'B2', question: 'Choose the most appropriate sentence.', answer: 'By the time we arrived, the meeting had already started.', options: ['By the time we arrived, the meeting had already started.', 'By the time we arrived, the meeting already started.', 'By the time we arrived, the meeting has started.', 'By the time we arrived, the meeting starts.'], explanation: 'Past perfect shows that the meeting started before arrival.' },
  { level: 'B2', question: 'Which sentence is most formal?', answer: 'We would appreciate your prompt response.', options: ['We would appreciate your prompt response.', 'Can you reply soon?', 'Hey, get back to us.', 'Please respond quick.'], explanation: 'Formal business English uses more polite, indirect phrasing.' },
]

const createExercise = ({ title, type, question, options, answer, explanation, difficulty, points, lessonId }) => ({
  id: `${lessonId}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  title,
  type,
  question,
  options,
  correctAnswer: answer,
  explanation,
  difficulty,
  points,
})

const lessonPatterns = {
  A1: {
    vocabulary: ['hello', 'good morning', 'name', 'country', 'work', 'family', 'home', 'breakfast', 'coffee', 'time'],
    grammar: ['I am', 'Present simple', 'There is / There are', 'Possessive adjectives'],
    speakingPrompt: 'Introduce yourself in three sentences.',
  },
  A2: {
    vocabulary: ['habit', 'travel', 'schedule', 'healthy', 'service', 'ticket', 'plan', 'future', 'choice', 'review'],
    grammar: ['Past simple', 'Present perfect', 'Comparatives', 'Modal verbs'],
    speakingPrompt: 'Talk about your last weekend or your plans for next week.',
  },
  B1: {
    vocabulary: ['achievement', 'responsibility', 'debate', 'process', 'opinion', 'issue', 'media', 'strategy', 'promise', 'analysis'],
    grammar: ['Conditionals', 'Reported speech', 'Relative clauses', 'Passive overview'],
    speakingPrompt: 'Give a short explanation of a problem and a solution.',
  },
  B2: {
    vocabulary: ['negotiate', 'evidence', 'framework', 'structure', 'initiative', 'proposal', 'analysis', 'resilience', 'priority', 'delivery'],
    grammar: ['Advanced conditionals', 'Passive reporting', 'Complex clauses', 'Nuance and register'],
    speakingPrompt: 'Present a solution in a professional meeting.',
  },
}

const makeExercises = (lessonId, lessonTitle, level) => {
  const pattern = lessonPatterns[level] || lessonPatterns.A1
  const base = [
    createExercise({
      title: 'Quick Check',
      type: 'multiple_choice',
      question: `Choose the best answer for the lesson focus: ${lessonTitle}.`,
      options: ['A correct answer', 'A weaker choice', 'A distractor', 'Another distractor'],
      answer: 'A correct answer',
      explanation: 'This sentence matches the structure and context of the lesson.',
      difficulty: 'Easy',
      points: 10,
      lessonId,
    }),
    createExercise({
      title: 'Sentence Builder',
      type: 'fill_blank',
      question: `Complete the sentence: ${pattern.grammar[0]} is the key grammar point in this lesson.`,
      options: [],
      answer: pattern.grammar[0],
      explanation: `${pattern.grammar[0]} helps learners use the target pattern correctly.`,
      difficulty: 'Medium',
      points: 15,
      lessonId,
    }),
    createExercise({
      title: 'Speaking Task',
      type: 'speaking',
      question: pattern.speakingPrompt,
      options: [],
      answer: pattern.speakingPrompt,
      explanation: 'Speak for 30 to 60 seconds and focus on clear structure and useful vocabulary.',
      difficulty: 'Medium',
      points: 20,
      lessonId,
    }),
  ]
  return base
}

const buildLesson = ({ lessonId, title, description, objective, content, level, order }) => ({
  id: lessonId,
  title,
  description,
  objective,
  content,
  order,
  level,
  duration: 10 + (order % 5) * 5,
  vocabulary: lessonPatterns[level]?.vocabulary.slice(0, 5).map((word) => ({
    word,
    translation: word,
    pronunciation: `${word.slice(0, 2)}-${word.slice(-2)}`,
    example: `I use ${word} in everyday communication.`,
  })) || [],
  grammar: lessonPatterns[level]?.grammar.slice(0, 2).map((rule) => ({
    rule,
    explanation: `${rule} is a useful pattern for this lesson.`,
    example: `Example: ${rule}.`,
  })) || [],
  exercises: makeExercises(lessonId, title, level),
})

const buildCourse = (blueprint) => {
  const moduleList = blueprint.modules.map((module, moduleIndex) => ({
    id: `${blueprint.id}-module-${moduleIndex + 1}`,
    title: module.title,
    topic: module.topic,
    units: module.units.map((unitTitle, unitIndex) => ({
      id: `${blueprint.id}-${moduleIndex + 1}-${unitIndex + 1}`,
      title: unitTitle,
      lessons: Array.from({ length: 3 }, (_, lessonIndex) => {
        const lessonOrder = (moduleIndex * 10) + (unitIndex * 3) + lessonIndex + 1
        const lessonId = `${blueprint.id}-lesson-${lessonOrder}`
        const lessonTitle = `${unitTitle} ${lessonIndex + 1}`
        return buildLesson({
          lessonId,
          title: lessonTitle,
          description: `Practice ${unitTitle.toLowerCase()} with realistic language tasks and guided explanation.`,
          objective: `Learners will improve confidence when discussing ${unitTitle.toLowerCase()}.`,
          content: `This lesson helps learners apply useful language in ${module.topic} contexts. Students will study vocabulary, grammar, speaking prompts and short practice tasks related to ${unitTitle.toLowerCase()}.`,
          level: blueprint.level,
          order: lessonOrder,
        })
      }),
    })),
  }))

  const lessons = moduleList.flatMap((module) => module.units.flatMap((unit) => unit.lessons))
  return {
    id: blueprint.id,
    contentKey: blueprint.id,
    title: blueprint.title,
    description: blueprint.description,
    language: blueprint.language,
    level: blueprint.level,
    category: blueprint.category,
    estimatedHours: 18 + (blueprint.level === 'Advanced' ? 10 : blueprint.level === 'Intermediate' ? 8 : 5),
    modules: moduleList,
    lessons,
  }
}

const generatedCourses = courseBlueprints.map(buildCourse)

const buildAssessmentSet = () => {
  const questions = []
  const levelOrder = ['A1', 'A2', 'B1', 'B2']
  levelOrder.forEach((level) => {
    for (let i = 0; i < 60; i += 1) {
      const base = assessmentBank[i % assessmentBank.length]
      questions.push({
        id: `${level.toLowerCase()}-question-${i + 1}`,
        level,
        question: `${base.question} (${level} practice)`,
        answer: base.answer,
        options: base.options,
        explanation: base.explanation,
        skill: ['grammar', 'vocabulary', 'reading', 'listening'][i % 4],
      })
    }
  })
  return questions
}

export const buildLinguaNestContentLibrary = () => {
  const vocabulary = wordBank.slice(0, 500).map((word, index) => ({
    id: `vocab-${index + 1}`,
    word,
    lemma: word,
    pronunciation: word.length > 8 ? `${word.slice(0, 2)}-${word.slice(-2)}` : word,
    partOfSpeech: ['noun', 'verb', 'adjective', 'adverb'][index % 4],
    ru: `ru-${index + 1}`,
    uz: `uz-${index + 1}`,
    definition: `Useful language item for English learning and practice.`,
    example: `Example: ${word} is useful in daily communication.`,
    topic: ['daily life', 'travel', 'work', 'school', 'food', 'relationships'][index % 6],
    ceFr: ['A1', 'A2', 'B1', 'B2'][index % 4],
    difficulty: ['easy', 'medium', 'hard'][index % 3],
  }))

  const flashcards = vocabulary.slice(0, 180).map((item, index) => ({
    id: `flash-${index + 1}`,
    word: item.word,
    pronunciation: item.pronunciation,
    partOfSpeech: item.partOfSpeech,
    ru: item.ru,
    uz: item.uz,
    example: item.example,
    category: item.topic,
    difficulty: item.difficulty,
  }))

  return {
    courses: generatedCourses,
    modules: generatedCourses.flatMap((course) => course.modules),
    lessons: generatedCourses.flatMap((course) => course.lessons),
    flashcards,
    vocabulary,
    assessments: buildAssessmentSet(),
    metadata: {
      totalCourses: generatedCourses.length,
      totalModules: generatedCourses.flatMap((course) => course.modules).length,
      totalUnits: generatedCourses.flatMap((course) => course.modules.flatMap((module) => module.units)).length,
      totalLessons: generatedCourses.flatMap((course) => course.lessons).length,
      totalExercises: generatedCourses.flatMap((course) => course.lessons.flatMap((lesson) => lesson.exercises)).length,
      totalVocabulary: vocabulary.length,
      totalAssessmentQuestions: buildAssessmentSet().length,
    },
  }
}

export const LINGUANEST_CONTENT_LIBRARY = buildLinguaNestContentLibrary()
