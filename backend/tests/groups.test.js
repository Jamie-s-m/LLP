import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Group from '../src/models/Group.js';

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role || 'student' }, process.env.JWT_SECRET || 'local-development-only-secret', { expiresIn: '1h' });

describe('Study group permissions (teacher-created, approval-gated join)', () => {
  let teacher;
  let teacherToken;
  let student;
  let studentToken;
  let otherStudent;
  let otherStudentToken;

  beforeAll(async () => {
    teacher = await User.create({
      firstName: 'Groups',
      lastName: 'Teacher',
      email: 'groups-teacher@example.com',
      password: 'testpass123',
      role: 'teacher',
      isEmailVerified: true,
    });
    teacherToken = signToken(teacher);

    student = await User.create({
      firstName: 'Groups',
      lastName: 'Student',
      email: 'groups-student@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    studentToken = signToken(student);

    otherStudent = await User.create({
      firstName: 'Groups',
      lastName: 'StudentTwo',
      email: 'groups-student-two@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    otherStudentToken = signToken(otherStudent);
  });

  afterAll(async () => {
    await Group.deleteMany({ creator: teacher._id });
    await User.deleteMany({ _id: { $in: [teacher._id, student._id, otherStudent._id] } });
  });

  test('a student cannot create a group', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Student Attempt', description: 'Should be rejected', language: 'English', level: 'Beginner' });

    expect(res.status).toBe(403);
  });

  test('a teacher can create a group and is auto-enrolled as a member', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ name: 'B1 Conversation Club', description: 'Weekly speaking practice', language: 'English', level: 'Intermediate' });

    expect(res.status).toBe(201);
    expect(res.body.data.members).toContain(teacher._id.toString());
  });

  test('a student join request goes to joinRequests, not members, and is not accepted twice', async () => {
    const group = await Group.findOne({ creator: teacher._id });

    const joinRes = await request(app)
      .post(`/api/groups/${group._id}/join`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(joinRes.status).toBe(200);

    const afterJoin = await Group.findById(group._id);
    expect(afterJoin.members.map((m) => m.toString())).not.toContain(student._id.toString());
    expect(afterJoin.joinRequests.map((r) => r.user.toString())).toContain(student._id.toString());

    const secondAttempt = await request(app)
      .post(`/api/groups/${group._id}/join`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(secondAttempt.status).toBe(400);
  });

  test('a non-manager cannot approve a join request', async () => {
    const group = await Group.findOne({ creator: teacher._id });

    const res = await request(app)
      .post(`/api/groups/${group._id}/requests/${student._id}/approve`)
      .set('Authorization', `Bearer ${otherStudentToken}`);

    expect(res.status).toBe(403);
  });

  test('the group teacher can approve a join request, moving the user into members', async () => {
    const group = await Group.findOne({ creator: teacher._id });

    const res = await request(app)
      .post(`/api/groups/${group._id}/requests/${student._id}/approve`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.members).toContain(student._id.toString());
    expect(res.body.data.joinRequests.find((r) => (r.user?._id || r.user) === student._id.toString())).toBeUndefined();
  });

  test('the group teacher can reject a join request, removing it without adding a member', async () => {
    const group = await Group.findOne({ creator: teacher._id });

    await request(app)
      .post(`/api/groups/${group._id}/join`)
      .set('Authorization', `Bearer ${otherStudentToken}`);

    const res = await request(app)
      .post(`/api/groups/${group._id}/requests/${otherStudent._id}/reject`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.members).not.toContain(otherStudent._id.toString());
    expect(res.body.data.joinRequests.find((r) => (r.user?._id || r.user) === otherStudent._id.toString())).toBeUndefined();
  });
});
