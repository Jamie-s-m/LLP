import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Course from './models/Course.js';
import Lesson from './models/Lesson.js';
import Flashcard from './models/Flashcard.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/language-learn-platform';

const courseCatalog = [
  {
    title: 'English Explorer',
    description: 'Build everyday conversation confidence with practical vocabulary, speaking routines, and fast win lessons.',
    language: 'English',
    level: 'Beginner',
    category: 'Conversation',
    estimatedHours: 8,
    lessons: [
      {
        title: 'Greetings and first impressions',
        description: 'Learn how to introduce yourself naturally and greet people with confidence.',
        content: 'This lesson focuses on greetings, polite phrases, and small talk that helps students feel calm in real conversations.',
        order: 1,
        difficulty: 'Easy',
        vocabulary: [
          { word: 'hello', translation: 'salom', pronunciation: 'hə-LOU', examples: ['Hello! Nice to meet you.'] },
          { word: 'How are you?', translation: 'Qalaysiz?', pronunciation: 'haʊ ɑːr juː?', examples: ['How are you today?'] },
        ],
        grammar: [{ rule: 'Use the verb to be in introductions', explanation: 'Use I am / I am from ... in first introductions.', examples: ['I am Alex. I am from Tashkent.'] }],
        tags: ['greetings', 'speaking', 'confidence'],
      },
      {
        title: 'Daily routine basics',
        description: 'Talk about mornings, habits, and daily actions using simple present tense.',
        content: 'Students learn how to describe their daily habits and check common routine phrases used in daily conversation.',
        order: 2,
        difficulty: 'Easy',
        vocabulary: [
          { word: 'wake up', translation: 'o’ygan', pronunciation: 'weɪk ʌp', examples: ['I wake up at 7 a.m.'] },
          { word: 'breakfast', translation: 'nonushta', pronunciation: 'brekfəst', examples: ['I eat breakfast with my family.'] },
        ],
        grammar: [{ rule: 'Present simple for routines', explanation: 'Use the present simple to describe regular actions.', examples: ['She works from 9 to 5.'] }],
        tags: ['routine', 'present simple'],
      },
      {
        title: 'Ordering food and asking for help',
        description: 'Practice essential phrases for cafes, restaurants, and everyday support.',
        content: 'This lesson adds common transactional phrases in English for shopping, eating, and asking simple questions.',
        order: 3,
        difficulty: 'Medium',
        vocabulary: [
          { word: 'menu', translation: 'menyu', pronunciation: 'ˈmɛn.juː', examples: ['Can I see the menu?'] },
          { word: 'help', translation: 'yordam', pronunciation: 'hɛlp', examples: ['I need help, please.'] },
        ],
        grammar: [{ rule: 'Polite requests', explanation: 'Use can/could to ask politely.', examples: ['Could you help me, please?'] }],
        tags: ['restaurant', 'support'],
      },
    ],
    flashcards: [
      { front: 'How are you?', back: 'Qalaysiz?', category: 'Greetings', difficulty: 'Easy', language: 'English' },
      { front: 'I wake up at 7', back: 'Men soat yettada uyg’onaman', category: 'Routine', difficulty: 'Easy', language: 'English' },
      { front: 'Can I see the menu?', back: 'Menyuni ko‘rishim mumkinmi?', category: 'Food', difficulty: 'Medium', language: 'English' },
    ],
  },
  {
    title: 'Turkish Talk & Travel',
    description: 'Master useful Turkish for travel, daily life, and smoother conversations with locals.',
    language: 'Turkish',
    level: 'Intermediate',
    category: 'Conversation',
    estimatedHours: 10,
    lessons: [
      {
        title: 'Travel essentials',
        description: 'Learn phrases for airports, hotels, tickets, and simple directions.',
        content: 'Students practice how to ask for directions and answer travel-related questions in Turkish.',
        order: 1,
        difficulty: 'Medium',
        vocabulary: [
          { word: 'günaydın', translation: 'good morning', pronunciation: 'goo-nah-DOON', examples: ['Günaydın, otel nerede?'] },
          { word: 'bilet', translation: 'ticket', pronunciation: 'bi-LET', examples: ['Bir bilet istiyorum.'] },
        ],
        grammar: [{ rule: 'Use -iyorum for present action', explanation: 'Add -iyorum to express what you are doing now.', examples: ['Şimdi bekliyorum.'] }],
        tags: ['travel', 'hotel'],
      },
      {
        title: 'Ordering coffee and snacks',
        description: 'Talk naturally in cafés and street food settings.',
        content: 'This lesson teaches highly useful Turkish expressions for ordering food and understanding quick responses.',
        order: 2,
        difficulty: 'Easy',
        vocabulary: [
          { word: 'kahve', translation: 'coffee', pronunciation: 'kah-VE', examples: ['Bir kahve istiyorum.'] },
          { word: 'lütfen', translation: 'please', pronunciation: 'luh-TEH-en', examples: ['Lütfen, menüyü gösterir misiniz?'] },
        ],
        grammar: [{ rule: 'Polite request pattern', explanation: 'Use istiyorum and lütfen to sound natural.', examples: ['Bir çay lütfen.'] }],
        tags: ['food', 'polite'],
      },
      {
        title: 'Making plans with friends',
        description: 'Use Turkish phrases to suggest, accept, and arrange weekend plans.',
        content: 'Great for social life, friendships, and casual planning in Turkish.',
        order: 3,
        difficulty: 'Medium',
        vocabulary: [
          { word: 'bugün', translation: 'today', pronunciation: 'boo-GOON', examples: ['Bugün ne yapıyorsun?'] },
          { word: 'hafta sonu', translation: 'weekend', pronunciation: 'hahf-ta so-NOO', examples: ['Hafta sonu sinemaya gidelim.'] },
        ],
        grammar: [{ rule: 'Use gidelim for invitations', explanation: 'Use gidelim to invite someone to do something together.', examples: ['Akşam yemeğe gidelim.'] }],
        tags: ['friends', 'plans'],
      },
    ],
    flashcards: [
      { front: 'Günaydın', back: 'Good morning', category: 'Travel', difficulty: 'Easy', language: 'Turkish' },
      { front: 'Bir kahve lütfen', back: 'One coffee, please', category: 'Food', difficulty: 'Easy', language: 'Turkish' },
      { front: 'Hafta sonu ne yapıyorsun?', back: 'What are you doing this weekend?', category: 'Social', difficulty: 'Medium', language: 'Turkish' },
    ],
  },
  {
    title: 'Uzbek Speaking Sprint',
    description: 'Fast, friendly Uzbek lessons for everyday life, study, and speaking with confidence.',
    language: 'Uzbek',
    level: 'Beginner',
    category: 'Listening',
    estimatedHours: 7,
    lessons: [
      {
        title: 'School and study',
        description: 'Talk about class, classmates, and your learning routine in Uzbek.',
        content: 'This lesson helps students talk about their school schedule and study habits using everyday Uzbek.',
        order: 1,
        difficulty: 'Easy',
        vocabulary: [
          { word: 'dars', translation: 'lesson', pronunciation: 'dars', examples: ['Dars boshlanadi.'] },
          { word: 'o‘qituvchi', translation: 'teacher', pronunciation: 'o-kit-u-chi', examples: ['O‘qituvchi darsni tushuntirdi.'] },
        ],
        grammar: [{ rule: 'Use bor/yo‘q for existence', explanation: 'Use bor to say there is and yo‘q to say there is not.', examples: ['Maktabda kitoblar bor.'] }],
        tags: ['school', 'study'],
      },
      {
        title: 'Family and home',
        description: 'Learn phrases for discussing family members, routines, and home life.',
        content: 'Students gain useful speech patterns for talking about family, home, and chores.',
        order: 2,
        difficulty: 'Easy',
        vocabulary: [
          { word: 'uy', translation: 'home', pronunciation: 'ooi', examples: ['Uyim ko‘p.'] },
          { word: 'ota', translation: 'father', pronunciation: 'o-ta', examples: ['Otam ishga ketdi.'] },
        ],
        grammar: [{ rule: 'Use -da/-da to say at home', explanation: 'Add -da to show the place where something happens.', examples: ['Uyda ishlayman.'] }],
        tags: ['family', 'home'],
      },
      {
        title: 'Small talk in public',
        description: 'Practice light, friendly conversation in everyday public places.',
        content: 'Teaches students how to start and continue conversations while shopping or travelling around town.',
        order: 3,
        difficulty: 'Medium',
        vocabulary: [
          { word: 'salom', translation: 'hello', pronunciation: 'sa-lom', examples: ['Salom, yaxshimisiz?'] },
          { word: 'yo‘l', translation: 'road', pronunciation: 'yol', examples: ['Bu yo‘l qayerga boradi?'] },
        ],
        grammar: [{ rule: 'Polite questions', explanation: 'Use nima, qayer, and qachon to ask simple questions naturally.', examples: ['Bu qayerda joylashgan?'] }],
        tags: ['public', 'small talk'],
      },
    ],
    flashcards: [
      { front: 'Salom', back: 'Hello', category: 'Greeting', difficulty: 'Easy', language: 'Uzbek' },
      { front: 'Uyda ishlayman', back: 'I work at home', category: 'Home', difficulty: 'Easy', language: 'Uzbek' },
      { front: 'Bu yo‘l qayerga boradi?', back: 'Where does this road go?', category: 'Travel', difficulty: 'Medium', language: 'Uzbek' },
    ],
  },
];

const buildLessonPayload = (courseId, lesson) => ({
  course: courseId,
  ...lesson,
  contentType: 'interactive',
});

try {
  await mongoose.connect(MONGODB_URI);

  const adminUser = await User.findOneAndUpdate(
    { email: 'admin@linguanest.uz' },
    {
      $setOnInsert: {
        firstName: 'LinguaNest',
        lastName: 'Admin',
        email: 'admin@linguanest.uz',
        password: 'Password123!',
        role: 'admin',
        isEmailVerified: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Lesson.deleteMany({});
  await Flashcard.deleteMany({});
  await Course.deleteMany({});

  for (const courseDef of courseCatalog) {
    const course = await Course.create({
      title: courseDef.title,
      description: courseDef.description,
      language: courseDef.language,
      level: courseDef.level,
      category: courseDef.category,
      instructor: adminUser._id,
      estimatedHours: courseDef.estimatedHours,
      isPublished: true,
    });

    const lessons = await Lesson.insertMany(courseDef.lessons.map((lesson) => buildLessonPayload(course._id, lesson)));

    course.lessons = lessons.map((lesson) => lesson._id);
    course.totalLessons = lessons.length;
    await course.save();

    const flashcards = courseDef.flashcards.map((card, index) => ({
      course: course._id,
      lesson: lessons[index % lessons.length]._id,
      language: card.language,
      front: { text: card.front },
      back: { text: card.back },
      category: card.category,
      difficulty: card.difficulty,
      tags: [course.language.toLowerCase(), card.category.toLowerCase()],
    }));

    await Flashcard.insertMany(flashcards);
  }

  console.log('LinguaNest sample catalog successfully seeded with courses, lessons, and flashcards.');
} catch (error) {
  console.error('Seeding failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}