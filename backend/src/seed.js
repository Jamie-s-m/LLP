import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { pathToFileURL } from 'node:url';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Course from './models/Course.js';
import Lesson from './models/Lesson.js';
import Exercise from './models/Exercise.js';
import Flashcard from './models/Flashcard.js';
import PlacementQuestion from './models/PlacementQuestion.js';
import { LINGUANEST_CONTENT_LIBRARY } from './contentLibrary.js';
import { placementQuestions } from './data/placementQuestions.js';
import { inferSkillFromType } from './utils/skills.js';
import { REFERENCE_COURSE } from './data/referenceCurriculum.js';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Gate on "is there a usable connection", not "is MONGODB_URI set" - the two are not the
// same thing. Tests connect Mongoose themselves (via MONGODB_TEST_URI, or an in-memory
// server - see tests/jest.setup.js) before calling seedContent()/contentStatus() directly,
// so MONGODB_URI is legitimately unset in that context even though the database is real and
// ready. Checking the env var instead of the connection state made every test that seeds
// content fail in CI, since CI (correctly) never sets MONGODB_URI at all.
const assertDatabaseConfigured = () => {
  if (mongoose.connection.readyState === 1) return;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI must be configured for content operations');
  }
};

// This script only ever reads MONGODB_URI from the repo-root .env (see dotenv.config()
// above) - it does NOT read backend/.env, even though that file may hold a different,
// intentionally-local override. If the root .env's MONGODB_URI happens to point at a real
// remote cluster (as it does on at least one developer machine, pointed at the production
// Atlas database), running this script in development mode would silently seed production.
// Since seed writes are irreversible-by-default (see seedContent's upsert loop), refuse to
// proceed outside --mode=production unless the resolved target is unambiguously local.
export const isLocalMongoUri = (uri) => {
  if (!uri) return false;
  try {
    const withoutQuery = uri.split('?')[0];
    const afterScheme = withoutQuery.replace(/^mongodb(\+srv)?:\/\//, '');
    const hostPart = afterScheme.split('@').pop().split('/')[0];
    const host = (hostPart.split(',')[0].split(':')[0] || '').toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
};

const assertSafeSeedTarget = (safeMode) => {
  if (safeMode === 'production') return; // explicit --mode=production --confirm already required
  if (isLocalMongoUri(MONGODB_URI)) return;
  const redacted = String(MONGODB_URI || '').replace(/\/\/[^@]*@/, '//<redacted>@');
  throw new Error(
    `Refusing to run content seeding in "${safeMode}" mode against a non-local-looking ` +
    `database (${redacted}). If this is genuinely what you want, pass --mode=production --confirm.`
  );
};

const demoUsers = [
  {
    email: 'student@demo.linguanest.local',
    password: 'DemoStudent123!',
    firstName: 'Demo',
    lastName: 'Student',
    role: 'student',
    nativeLanguage: 'Russian',
    targetLanguages: ['English'],
  },
  {
    email: 'parent@demo.linguanest.local',
    password: 'DemoParent123!',
    firstName: 'Demo',
    lastName: 'Parent',
    role: 'parent',
    nativeLanguage: 'Uzbek',
    targetLanguages: ['English'],
  },
  {
    email: 'teacher@demo.linguanest.local',
    password: 'DemoTeacher123!',
    firstName: 'Demo',
    lastName: 'Teacher',
    role: 'teacher',
    nativeLanguage: 'English',
    targetLanguages: ['English'],
  },
  {
    email: 'admin@demo.linguanest.local',
    password: 'DemoAdmin123!',
    firstName: 'Demo',
    lastName: 'Admin',
    role: 'admin',
    nativeLanguage: 'English',
    targetLanguages: ['English'],
  },
];

const normalizeLessonContent = (lesson) => ({
  title: lesson.title,
  description: lesson.description,
  content: lesson.content,
  duration: lesson.duration || 15,
  difficulty: lesson.difficulty || 'Easy',
  vocabulary: (lesson.vocabulary || []).map((item) => ({
    word: item.word || 'language',
    translation: item.translation || 'translation',
    pronunciation: item.pronunciation || item.word || 'pronunciation',
    examples: Array.isArray(item.examples) ? item.examples : [item.example || `${item.word} is useful.`],
  })),
  grammar: (lesson.grammar || []).map((item) => ({
    rule: item.rule || 'Key grammar pattern',
    explanation: item.explanation || 'Use the target structure clearly and consistently.',
    examples: Array.isArray(item.examples) ? item.examples : [item.example || 'Example sentence'],
  })),
});

const ensureDemoUsers = async () => {
  const createdEntries = [];

  for (const userData of demoUsers) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      createdEntries.push(existing);
      continue;
    }

    const user = await User.create(userData);
    createdEntries.push(user);
  }

  return createdEntries;
};

const parseSeedCliArgs = () => {
  const args = new Set(process.argv.slice(2));
  const parsed = {
    mode: 'development',
    status: false,
    dryRun: false,
    confirm: false,
    force: false,
  };

  for (const arg of args) {
    if (arg === '--status') parsed.status = true;
    if (arg === '--dry-run') parsed.dryRun = true;
    if (arg === '--confirm') parsed.confirm = true;
    if (arg === '--force') parsed.force = true;
    if (arg.startsWith('--mode=')) {
      parsed.mode = String(arg.split('=')[1] || 'development').toLowerCase();
    }
  }

  return parsed;
};

const getContentCounts = async () => {
  if (mongoose.connection.readyState !== 1) {
    console.log(`🔌 Connecting to MongoDB for status check...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
  }

  const [courses, publishedCourses, lessons, exercises, flashcards, vocabularyCount, placementQuestionCount] = await Promise.all([
    Course.countDocuments(),
    Course.countDocuments({ isPublished: true }),
    Lesson.countDocuments(),
    Exercise.countDocuments(),
    Flashcard.countDocuments(),
    Flashcard.countDocuments(),
    PlacementQuestion.countDocuments(),
  ]);

  const libraryMetrics = LINGUANEST_CONTENT_LIBRARY.metadata;

  return {
    courses,
    publishedCourses,
    lessons,
    // Live count, not library.metadata.totalExercises - that static figure is computed once
    // from the generated catalog only and never included REFERENCE_COURSE's exercises, so
    // the "already seeded" check below could never be satisfied once the reference pathway
    // was added: 630 (static) >= 639 (630 generated + 9 reference) is always false, so every
    // seed run silently fell through to re-upserting the entire catalog, forever. A live
    // count is correct by construction for any future addition, not just this one.
    exercises,
    flashcards,
    vocabularyCount,
    modules: libraryMetrics.totalModules,
    units: libraryMetrics.totalUnits,
    // No live "assessment question" collection exists yet - contentLibrary.js's
    // assessmentBank/buildAssessmentSet is dead code, never seeded anywhere (see the release
    // audit). This stays a static metadata figure for reporting only, and unlike `exercises`
    // above it is intentionally NOT part of catalogAlreadySatisfiesRequirements below.
    assessmentQuestions: libraryMetrics.totalAssessmentQuestions,
    placementQuestions: placementQuestionCount,
  };
};

export const contentStatus = async ({ mode = 'development' } = {}) => {
  // Only close the connection this call opened itself. Unconditionally disconnecting here
  // used to be safe by accident: assertDatabaseConfigured() always threw before this point
  // whenever there wasn't already a real MONGODB_URI-backed connection, so the only way to
  // reach this far was for contentStatus() to have opened the connection itself. Now that a
  // pre-existing live connection (e.g. a test's, or a future caller reusing the app's own
  // Mongo connection) is a legitimate way to get here, tearing it down unconditionally would
  // silently disconnect whatever else was relying on it.
  const openedHere = mongoose.connection.readyState !== 1;
  try {
    assertDatabaseConfigured();
    const counts = await getContentCounts();
    const output = [
      'LinguaNest Content Health',
      `Mode: ${mode}`,
      `Content Version: ${process.env.CONTENT_LIBRARY_VERSION || 'development'}`,
      `Courses: ${counts.courses}`,
      `Modules: ${counts.modules}`,
      `Units: ${counts.units}`,
      `Lessons: ${counts.lessons}`,
      `Exercises: ${counts.exercises}`,
      `Vocabulary: ${counts.vocabularyCount}`,
      `Assessment Questions: ${counts.assessmentQuestions}`,
      `Placement Test Questions: ${counts.placementQuestions}`,
      `Published Courses: ${counts.publishedCourses}`,
    ].join('\n');

    console.log(output);
    return counts;
  } finally {
    if (openedHere && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

export const seedContent = async ({
  mode = 'development',
  confirm = false,
  dryRun = false,
  force = false,
  silent = false,
} = {}) => {
  const safeMode = String(mode || 'development').toLowerCase();

  if (!['development', 'staging', 'production'].includes(safeMode)) {
    throw new Error('Unsupported content mode. Use development, staging, or production.');
  }

  if (safeMode === 'production' && !confirm) {
    throw new Error('Production content seeding requires --confirm and a verified target database.');
  }

  assertDatabaseConfigured();

  if (mongoose.connection.readyState !== 1) {
    assertSafeSeedTarget(safeMode);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  }

  // Fold the hand-authored reference pathway (backend/src/data/referenceCurriculum.js) into
  // the same library shape the generated catalog uses, so it goes through the exact same
  // upsert loop below AND so the "already satisfies requirements" short-circuit further down
  // actually accounts for it - without this, re-running seed against a database that already
  // has the generated catalog would silently never insert the reference course, since the
  // generated catalog alone already satisfies the old (undercounted) minimums.
  const referenceExerciseCount = REFERENCE_COURSE.lessons.reduce((sum, lessonData) => sum + (lessonData.exercises?.length || 0), 0);
  const library = {
    ...LINGUANEST_CONTENT_LIBRARY,
    courses: [...LINGUANEST_CONTENT_LIBRARY.courses, REFERENCE_COURSE],
    lessons: [...LINGUANEST_CONTENT_LIBRARY.lessons, ...REFERENCE_COURSE.lessons],
    metadata: {
      ...LINGUANEST_CONTENT_LIBRARY.metadata,
      totalExercises: LINGUANEST_CONTENT_LIBRARY.metadata.totalExercises + referenceExerciseCount,
    },
  };
  const minimumRequirements = {
    courses: library.courses.length,
    publishedCourses: library.courses.length,
    lessons: library.lessons.length,
    vocabulary: library.vocabulary.length,
    exercises: library.metadata.totalExercises,
    assessmentQuestions: library.metadata.totalAssessmentQuestions,
    placementQuestions: placementQuestions.length,
  };

  const currentCounts = await getContentCounts();
  const catalogAlreadySatisfiesRequirements = currentCounts.courses >= minimumRequirements.courses
    && currentCounts.publishedCourses >= minimumRequirements.publishedCourses
    && currentCounts.lessons >= minimumRequirements.lessons
    && currentCounts.vocabularyCount >= minimumRequirements.vocabulary
    && currentCounts.exercises >= minimumRequirements.exercises
    && currentCounts.placementQuestions >= minimumRequirements.placementQuestions;

  if (!force && catalogAlreadySatisfiesRequirements) {
    if (!silent) {
      console.log('Content already seeded; no update required.');
    }
    return { seeded: false, ...currentCounts };
  }

  if (dryRun) {
    if (!silent) {
      console.log('Dry run: content sync would seed the required library.');
    }
    return { seeded: false, dryRun: true, ...currentCounts };
  }

  // Demo accounts use hardcoded, publicly-readable passwords (this file) - fine to create
  // for local development, a real account-takeover risk if ever created on a production
  // database. Production seeding therefore never creates them: it requires a real teacher
  // account (created through normal signup) to already exist to attribute courses to.
  let teacher = await User.findOne({ role: 'teacher' });
  if (!teacher && safeMode !== 'production') {
    const users = await ensureDemoUsers();
    teacher = users.find((user) => user.role === 'teacher');
  }

  if (!teacher) {
    throw new Error(
      safeMode === 'production'
        ? 'No teacher account exists yet. Create a real teacher account first - production seeding will not create demo accounts.'
        : 'Teacher demo user was not created.'
    );
  }

  for (const courseData of library.courses) {
    const course = await Course.findOneAndUpdate(
      { contentKey: courseData.id },
      {
        contentKey: courseData.id,
        title: courseData.title,
        description: courseData.description,
        language: courseData.language,
        level: courseData.level,
        instructor: teacher._id,
        category: courseData.category,
        estimatedHours: courseData.estimatedHours,
        isPublished: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const lessonIds = [];

    for (const lessonData of courseData.lessons) {
      const lessonDoc = await Lesson.findOneAndUpdate(
        { course: course._id, contentKey: lessonData.id },
        {
          contentKey: lessonData.id,
          course: course._id,
          title: lessonData.title,
          description: lessonData.description,
          content: lessonData.content,
          order: lessonData.order,
          duration: lessonData.duration || 15,
          difficulty: lessonData.difficulty || 'Easy',
          contentType: lessonData.contentType || 'text',
          mediaUrl: lessonData.mediaUrl || '',
          vocabulary: normalizeLessonContent(lessonData).vocabulary,
          grammar: normalizeLessonContent(lessonData).grammar,
          cefr: lessonData.cefr || null,
          objectives: Array.isArray(lessonData.objectives) ? lessonData.objectives : [],
          tags: [courseData.category, courseData.level.toLowerCase()],
          completionTime: lessonData.duration || 15,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const exerciseIds = [];
      for (const exerciseData of lessonData.exercises || []) {
        const exerciseDoc = await Exercise.findOneAndUpdate(
          { lesson: lessonDoc._id, contentKey: exerciseData.id },
          {
            contentKey: exerciseData.id,
            lesson: lessonDoc._id,
            title: exerciseData.title,
            description: exerciseData.description || '',
            type: exerciseData.type,
            skill: inferSkillFromType(exerciseData.type),
            question: exerciseData.question,
            instructions: exerciseData.instructions || '',
            options: Array.isArray(exerciseData.options) ? exerciseData.options : [],
            correctAnswer: exerciseData.correctAnswer,
            sentenceTemplate: exerciseData.sentenceTemplate || '',
            correctAnswers: Array.isArray(exerciseData.correctAnswers) ? exerciseData.correctAnswers : [],
            leftItems: Array.isArray(exerciseData.leftItems) ? exerciseData.leftItems : [],
            rightItems: Array.isArray(exerciseData.rightItems) ? exerciseData.rightItems : [],
            correctPairs: Array.isArray(exerciseData.correctPairs) ? exerciseData.correctPairs : [],
            audioReference: exerciseData.audioReference || '',
            acceptablePronunciations: Array.isArray(exerciseData.acceptablePronunciations) ? exerciseData.acceptablePronunciations : [],
            maxWords: exerciseData.maxWords || undefined,
            minWords: exerciseData.minWords || undefined,
            audioFile: exerciseData.audioFile || '',
            transcript: exerciseData.transcript || '',
            difficulty: exerciseData.difficulty || 'Medium',
            points: exerciseData.points || 10,
            hints: Array.isArray(exerciseData.hints) ? exerciseData.hints : [],
            explanation: exerciseData.explanation || '',
            tags: Array.isArray(exerciseData.tags) ? exerciseData.tags : [courseData.category],
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        exerciseIds.push(exerciseDoc._id);
      }

      await Lesson.findByIdAndUpdate(lessonDoc._id, {
        exercises: exerciseIds,
      });

      lessonIds.push(lessonDoc._id);
    }

    await Course.findByIdAndUpdate(course._id, {
      lessons: lessonIds,
      totalLessons: lessonIds.length,
      isPublished: true,
      contentKey: courseData.id,
    });
  }

  const flashcards = LINGUANEST_CONTENT_LIBRARY.vocabulary;
  for (const card of flashcards) {
    await Flashcard.findOneAndUpdate(
      { contentKey: card.id },
      {
        contentKey: card.id,
        language: 'English',
        front: { text: card.word, audio: '', image: '' },
        back: { text: card.uz || card.ru || card.word, audio: '', image: '' },
        category: card.topic || 'general',
        difficulty: card.difficulty || 'Medium',
        tags: [card.topic || 'general', 'seeded'],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  for (const questionData of placementQuestions) {
    await PlacementQuestion.findOneAndUpdate(
      { order: questionData.order },
      questionData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const finalCounts = await getContentCounts();

  if (!silent) {
    console.log(`Content sync complete for ${safeMode}. Courses: ${finalCounts.courses}, Published: ${finalCounts.publishedCourses}, Lessons: ${finalCounts.lessons}.`);
  }

  return {
    seeded: true,
    mode: safeMode,
    ...finalCounts,
  };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = parseSeedCliArgs();

  const run = cli.status
    ? contentStatus({ mode: cli.mode })
    : seedContent({
        mode: cli.mode,
        confirm: cli.confirm,
        dryRun: cli.dryRun,
        force: cli.force,
        silent: false,
      });

  run.then(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }).catch((error) => {
    console.error('Content seed failed:', error);
    process.exit(1);
  });
}
