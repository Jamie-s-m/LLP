import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Group from '../src/models/Group.js';
import Attendance from '../src/models/Attendance.js';

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role || 'student' }, process.env.JWT_SECRET || 'local-development-only-secret', { expiresIn: '1h' });

describe('Attendance (group manager marks present/absent/late/excused per session)', () => {
  let teacher;
  let teacherToken;
  let otherTeacher;
  let otherTeacherToken;
  let studentA;
  let studentAToken;
  let studentB;
  let studentBToken;
  let outsideStudent;
  let outsideStudentToken;
  let group;

  beforeAll(async () => {
    teacher = await User.create({
      firstName: 'Attendance',
      lastName: 'Teacher',
      email: 'attendance-teacher@example.com',
      password: 'testpass123',
      role: 'teacher',
      isEmailVerified: true,
    });
    teacherToken = signToken(teacher);

    otherTeacher = await User.create({
      firstName: 'Attendance',
      lastName: 'OtherTeacher',
      email: 'attendance-other-teacher@example.com',
      password: 'testpass123',
      role: 'teacher',
      isEmailVerified: true,
    });
    otherTeacherToken = signToken(otherTeacher);

    studentA = await User.create({
      firstName: 'Attendance',
      lastName: 'StudentA',
      email: 'attendance-student-a@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    studentAToken = signToken(studentA);

    studentB = await User.create({
      firstName: 'Attendance',
      lastName: 'StudentB',
      email: 'attendance-student-b@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    studentBToken = signToken(studentB);

    outsideStudent = await User.create({
      firstName: 'Attendance',
      lastName: 'Outsider',
      email: 'attendance-outsider@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    outsideStudentToken = signToken(outsideStudent);

    group = await Group.create({
      name: 'Attendance Test Group',
      description: 'For attendance integration tests',
      language: 'English',
      level: 'Beginner',
      creator: teacher._id,
      members: [teacher._id, studentA._id, studentB._id],
      moderators: [teacher._id],
    });
  });

  afterAll(async () => {
    await Attendance.deleteMany({ group: group._id });
    await Group.deleteOne({ _id: group._id });
    await User.deleteMany({
      _id: { $in: [teacher._id, otherTeacher._id, studentA._id, studentB._id, outsideStudent._id] },
    });
  });

  test('the group creator can mark attendance for real members', async () => {
    const res = await request(app)
      .post(`/api/attendance/${group._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        date: '2026-09-01',
        records: [
          { studentId: studentA._id.toString(), status: 'present' },
          { studentId: studentB._id.toString(), status: 'absent', notes: 'Called in sick' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.marked).toHaveLength(2);
    expect(res.body.data.skipped).toHaveLength(0);

    const stored = await Attendance.find({ group: group._id });
    expect(stored).toHaveLength(2);
  });

  test('a non-manager teacher cannot mark attendance for the group', async () => {
    const res = await request(app)
      .post(`/api/attendance/${group._id}`)
      .set('Authorization', `Bearer ${otherTeacherToken}`)
      .send({
        date: '2026-09-01',
        records: [{ studentId: studentA._id.toString(), status: 'late' }],
      });

    expect(res.status).toBe(403);
  });

  test('marking a non-member student is skipped, not silently recorded', async () => {
    const res = await request(app)
      .post(`/api/attendance/${group._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        date: '2026-09-02',
        records: [
          { studentId: studentA._id.toString(), status: 'present' },
          { studentId: outsideStudent._id.toString(), status: 'present' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.marked).toHaveLength(1);
    expect(res.body.data.skipped).toHaveLength(1);
    expect(res.body.data.skipped[0].studentId).toBe(outsideStudent._id.toString());

    const outsiderRecord = await Attendance.findOne({ group: group._id, student: outsideStudent._id });
    expect(outsiderRecord).toBeNull();
  });

  test('re-marking the same student+group+date updates the existing record instead of duplicating', async () => {
    const date = '2026-09-03';

    await request(app)
      .post(`/api/attendance/${group._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ date, records: [{ studentId: studentA._id.toString(), status: 'absent' }] });

    const secondRes = await request(app)
      .post(`/api/attendance/${group._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ date, records: [{ studentId: studentA._id.toString(), status: 'late', notes: 'Corrected: arrived late' }] });

    expect(secondRes.status).toBe(200);

    const matching = await Attendance.find({
      group: group._id,
      student: studentA._id,
      date: new Date(Date.UTC(2026, 8, 3)),
    });
    expect(matching).toHaveLength(1);
    expect(matching[0].status).toBe('late');
    expect(matching[0].notes).toBe('Corrected: arrived late');
  });

  test('getAttendanceForGroup returns marked records filtered by from/to range', async () => {
    // Seed a session well outside the from/to window used below.
    await request(app)
      .post(`/api/attendance/${group._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ date: '2026-01-15', records: [{ studentId: studentB._id.toString(), status: 'present' }] });

    const res = await request(app)
      .get(`/api/attendance/${group._id}`)
      .query({ from: '2026-09-01', to: '2026-09-03' })
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    const dates = res.body.data.map((record) => new Date(record.date).toISOString());
    expect(dates.every((d) => d >= '2026-09-01' && d < '2026-09-04')).toBe(true);
    expect(res.body.data.some((record) => new Date(record.date).toISOString().startsWith('2026-01-15'))).toBe(false);
    // student name should be resolved via population
    const withStudent = res.body.data.find((record) => (record.student?._id || record.student) === studentA._id.toString());
    expect(withStudent.student.firstName).toBe('Attendance');
  });

  test('getAttendanceSummaryForStudent computes correct counts and rate; self and manager can view, an unrelated student cannot', async () => {
    // Reset studentB's records to a known set: 3 present + 1 absent across distinct sessions.
    await Attendance.deleteMany({ group: group._id, student: studentB._id });
    const sessionDates = ['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13'];
    const statuses = ['present', 'present', 'present', 'absent'];

    for (let i = 0; i < sessionDates.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await request(app)
        .post(`/api/attendance/${group._id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ date: sessionDates[i], records: [{ studentId: studentB._id.toString(), status: statuses[i] }] });
    }

    const managerRes = await request(app)
      .get(`/api/attendance/${group._id}/summary/${studentB._id}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(managerRes.status).toBe(200);
    expect(managerRes.body.data.totalSessions).toBe(4);
    expect(managerRes.body.data.counts).toEqual({ present: 3, absent: 1, late: 0, excused: 0 });
    expect(managerRes.body.data.attendanceRate).toBe(75);

    const selfRes = await request(app)
      .get(`/api/attendance/${group._id}/summary/${studentB._id}`)
      .set('Authorization', `Bearer ${studentBToken}`);
    expect(selfRes.status).toBe(200);
    expect(selfRes.body.data.attendanceRate).toBe(75);

    const unrelatedRes = await request(app)
      .get(`/api/attendance/${group._id}/summary/${studentB._id}`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(unrelatedRes.status).toBe(403);
  });
});
