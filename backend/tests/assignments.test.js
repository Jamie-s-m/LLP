import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import Exercise from '../src/models/Exercise.js';
import Group from '../src/models/Group.js';
import Assignment from '../src/models/Assignment.js';
import Progress from '../src/models/Progress.js';
import ExerciseAttempt from '../src/models/ExerciseAttempt.js';

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role || 'student' }, process.env.JWT_SECRET || 'local-development-only-secret', { expiresIn: '1h' });

describe('Assignment feature (teacher assigns a lesson/exercise to students or a group)', () => {
  let owningTeacher;
  let owningTeacherToken;
  let otherTeacher;
  let otherTeacherToken;
  let studentTarget;
  let studentTargetToken;
  let studentOther;
  let studentOtherToken;
  let groupMemberA;
  let groupMemberAToken;
  let groupMemberB;
  let groupMemberBToken;

  let course;
  let lesson;
  let exercise;
  let group;

  beforeAll(async () => {
    owningTeacher = await User.create({
      firstName: 'Assign',
      lastName: 'Owner',
      email: 'assign-owner@example.com',
      password: 'testpass123',
      role: 'teacher',
      isEmailVerified: true,
    });
    owningTeacherToken = signToken(owningTeacher);

    otherTeacher = await User.create({
      firstName: 'Assign',
      lastName: 'OtherTeacher',
      email: 'assign-other-teacher@example.com',
      password: 'testpass123',
      role: 'teacher',
      isEmailVerified: true,
    });
    otherTeacherToken = signToken(otherTeacher);

    studentTarget = await User.create({
      firstName: 'Assign',
      lastName: 'Target',
      email: 'assign-target@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    studentTargetToken = signToken(studentTarget);

    studentOther = await User.create({
      firstName: 'Assign',
      lastName: 'NonTarget',
      email: 'assign-nontarget@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    studentOtherToken = signToken(studentOther);

    groupMemberA = await User.create({
      firstName: 'Assign',
      lastName: 'GroupA',
      email: 'assign-group-a@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    groupMemberAToken = signToken(groupMemberA);

    groupMemberB = await User.create({
      firstName: 'Assign',
      lastName: 'GroupB',
      email: 'assign-group-b@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    groupMemberBToken = signToken(groupMemberB);

    course = await Course.create({
      title: 'Assignment Test Course',
      description: 'Course used to test the Assignment feature',
      language: 'English',
      level: 'Beginner',
      category: 'Grammar',
      instructor: owningTeacher._id,
      isPublished: true,
    });

    lesson = await Lesson.create({
      title: 'Assignment Test Lesson',
      course: course._id,
      order: 1,
      content: 'Lesson content used to test assignments.',
    });

    exercise = await Exercise.create({
      lesson: lesson._id,
      title: 'Assignment Test Exercise',
      type: 'multiple_choice',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5'],
      correctAnswer: 1,
      skill: 'grammar',
    });

    group = await Group.create({
      name: 'Assignment Test Group',
      creator: owningTeacher._id,
      members: [groupMemberA._id, groupMemberB._id],
      language: 'English',
      level: 'Beginner',
    });
  });

  afterAll(async () => {
    await Assignment.deleteMany({ course: course._id });
    await Progress.deleteMany({ course: course._id });
    await ExerciseAttempt.deleteMany({ exercise: exercise._id });
    await Exercise.deleteOne({ _id: exercise._id });
    await Lesson.deleteOne({ _id: lesson._id });
    await Course.deleteOne({ _id: course._id });
    await Group.deleteOne({ _id: group._id });
    await User.deleteMany({
      _id: {
        $in: [
          owningTeacher._id,
          otherTeacher._id,
          studentTarget._id,
          studentOther._id,
          groupMemberA._id,
          groupMemberB._id,
        ],
      },
    });
  });

  test('the owning teacher can create a lesson-based assignment for specific students', async () => {
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${owningTeacherToken}`)
      .send({
        title: 'Read Lesson 1',
        description: 'Please complete lesson 1',
        courseId: course._id,
        lessonId: lesson._id,
        studentIds: [studentTarget._id],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Read Lesson 1');
    expect(res.body.data.students).toContain(studentTarget._id.toString());
    expect(res.body.data.assignedBy).toBe(owningTeacher._id.toString());
    // Regression: the create response must carry the same completedCount/totalCount shape
    // getAssignmentsForCourse returns, so the frontend can prepend it straight into its list
    // state without rendering "undefined of undefined completed".
    expect(res.body.data.completedCount).toBe(0);
    expect(res.body.data.totalCount).toBe(1);
  });

  test('a teacher who does not own the course gets 403 creating the same assignment', async () => {
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${otherTeacherToken}`)
      .send({
        title: 'Read Lesson 1 (imposter)',
        courseId: course._id,
        lessonId: lesson._id,
        studentIds: [studentTarget._id],
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('creating with both lessonId and exerciseId is rejected with 400', async () => {
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${owningTeacherToken}`)
      .send({
        title: 'Bad: both',
        courseId: course._id,
        lessonId: lesson._id,
        exerciseId: exercise._id,
        studentIds: [studentTarget._id],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('creating with neither lessonId nor exerciseId is rejected with 400', async () => {
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${owningTeacherToken}`)
      .send({
        title: 'Bad: neither',
        courseId: course._id,
        studentIds: [studentTarget._id],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('creating with neither studentIds nor groupId is rejected with 400', async () => {
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${owningTeacherToken}`)
      .send({
        title: 'Bad: no targets',
        courseId: course._id,
        lessonId: lesson._id,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('the target student sees the assignment in GET /mine as not completed, then completed after finishing the lesson', async () => {
    const before = await request(app)
      .get('/api/assignments/mine')
      .set('Authorization', `Bearer ${studentTargetToken}`);

    expect(before.status).toBe(200);
    const beforeEntry = before.body.data.find((a) => a.title === 'Read Lesson 1');
    expect(beforeEntry).toBeDefined();
    expect(beforeEntry.completed).toBe(false);

    // Simulate the student completing the assigned lesson via a real Progress record.
    await Progress.create({
      user: studentTarget._id,
      course: course._id,
      completedLessons: [lesson._id],
      progressPercentage: 100,
    });

    const after = await request(app)
      .get('/api/assignments/mine')
      .set('Authorization', `Bearer ${studentTargetToken}`);

    expect(after.status).toBe(200);
    const afterEntry = after.body.data.find((a) => a.title === 'Read Lesson 1');
    expect(afterEntry).toBeDefined();
    expect(afterEntry.completed).toBe(true);
  });

  test('a non-target student does not see the assignment in GET /mine', async () => {
    const res = await request(app)
      .get('/api/assignments/mine')
      .set('Authorization', `Bearer ${studentOtherToken}`);

    expect(res.status).toBe(200);
    const entry = res.body.data.find((a) => a.title === 'Read Lesson 1');
    expect(entry).toBeUndefined();
  });

  test('a group-based assignment reaches every member of the group in GET /mine', async () => {
    const createRes = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${owningTeacherToken}`)
      .send({
        title: 'Group Exercise Assignment',
        courseId: course._id,
        exerciseId: exercise._id,
        groupId: group._id,
      });

    expect(createRes.status).toBe(201);

    const resA = await request(app)
      .get('/api/assignments/mine')
      .set('Authorization', `Bearer ${groupMemberAToken}`);
    const resB = await request(app)
      .get('/api/assignments/mine')
      .set('Authorization', `Bearer ${groupMemberBToken}`);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);

    const entryA = resA.body.data.find((a) => a.title === 'Group Exercise Assignment');
    const entryB = resB.body.data.find((a) => a.title === 'Group Exercise Assignment');
    expect(entryA).toBeDefined();
    expect(entryB).toBeDefined();
    expect(entryA.completed).toBe(false);
    expect(entryB.completed).toBe(false);

    // groupMemberA completes the assigned exercise via a real graded ExerciseAttempt.
    await ExerciseAttempt.create({
      user: groupMemberA._id,
      exercise: exercise._id,
      skill: 'grammar',
      isCorrect: true,
      status: 'graded',
    });

    const resAAfter = await request(app)
      .get('/api/assignments/mine')
      .set('Authorization', `Bearer ${groupMemberAToken}`);
    const entryAAfter = resAAfter.body.data.find((a) => a.title === 'Group Exercise Assignment');
    expect(entryAAfter.completed).toBe(true);

    const resBAfter = await request(app)
      .get('/api/assignments/mine')
      .set('Authorization', `Bearer ${groupMemberBToken}`);
    const entryBAfter = resBAfter.body.data.find((a) => a.title === 'Group Exercise Assignment');
    expect(entryBAfter.completed).toBe(false);
  });

  test('getAssignmentsForCourse and getAssignmentById are ownership-gated the same way', async () => {
    const assignment = await Assignment.findOne({ course: course._id, title: 'Read Lesson 1' });

    const listForbidden = await request(app)
      .get(`/api/assignments/course/${course._id}`)
      .set('Authorization', `Bearer ${otherTeacherToken}`);
    expect(listForbidden.status).toBe(403);

    const listAllowed = await request(app)
      .get(`/api/assignments/course/${course._id}`)
      .set('Authorization', `Bearer ${owningTeacherToken}`);
    expect(listAllowed.status).toBe(200);
    const listEntry = listAllowed.body.data.find((a) => a._id === assignment._id.toString());
    expect(listEntry.completedCount).toBe(1);
    expect(listEntry.totalCount).toBe(1);

    const byIdForbidden = await request(app)
      .get(`/api/assignments/${assignment._id}`)
      .set('Authorization', `Bearer ${otherTeacherToken}`);
    expect(byIdForbidden.status).toBe(403);

    const byIdAllowed = await request(app)
      .get(`/api/assignments/${assignment._id}`)
      .set('Authorization', `Bearer ${owningTeacherToken}`);
    expect(byIdAllowed.status).toBe(200);
    expect(byIdAllowed.body.data.students).toHaveLength(1);
    expect(byIdAllowed.body.data.students[0].studentId).toBe(studentTarget._id.toString());
    expect(byIdAllowed.body.data.students[0].completed).toBe(true);
  });

  test('update and delete are ownership-gated the same way as create', async () => {
    const assignment = await Assignment.findOne({ course: course._id, title: 'Group Exercise Assignment' });

    const updateForbidden = await request(app)
      .put(`/api/assignments/${assignment._id}`)
      .set('Authorization', `Bearer ${otherTeacherToken}`)
      .send({ title: 'Hijacked title' });
    expect(updateForbidden.status).toBe(403);

    const updateAllowed = await request(app)
      .put(`/api/assignments/${assignment._id}`)
      .set('Authorization', `Bearer ${owningTeacherToken}`)
      .send({ title: 'Group Exercise Assignment (updated)' });
    expect(updateAllowed.status).toBe(200);
    expect(updateAllowed.body.data.title).toBe('Group Exercise Assignment (updated)');

    const deleteForbidden = await request(app)
      .delete(`/api/assignments/${assignment._id}`)
      .set('Authorization', `Bearer ${otherTeacherToken}`);
    expect(deleteForbidden.status).toBe(403);

    const deleteAllowed = await request(app)
      .delete(`/api/assignments/${assignment._id}`)
      .set('Authorization', `Bearer ${owningTeacherToken}`);
    expect(deleteAllowed.status).toBe(200);

    const gone = await Assignment.findById(assignment._id);
    expect(gone).toBeNull();
  });
});
