import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Course from '../src/models/Course.js';

const makeCourse = (overrides) => Course.create({
  title: 'Sample Course',
  description: 'x',
  language: 'English',
  level: 'Beginner',
  category: 'Conversation',
  instructor: new mongoose.Types.ObjectId(),
  isPublished: false,
  ...overrides,
});

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'local-development-only-secret', { expiresIn: '1h' });

describe('Admin bulk actions', () => {
  it('suspends multiple users at once and skips the acting admin', async () => {
    const admin = await User.create({ firstName: 'Admin', lastName: 'One', email: 'bulk-admin@linguanest.local', password: 'AdminPassword123!', role: 'admin', isEmailVerified: true });
    const studentA = await User.create({ firstName: 'A', lastName: 'Student', email: 'bulk-a@linguanest.local', password: 'Password123!', role: 'student', isEmailVerified: true });
    const studentB = await User.create({ firstName: 'B', lastName: 'Student', email: 'bulk-b@linguanest.local', password: 'Password123!', role: 'student', isEmailVerified: true });

    const token = signToken(admin);
    const response = await request(app)
      .post('/api/admin/users/bulk-action')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [studentA._id.toString(), studentB._id.toString(), admin._id.toString()], action: 'suspend' });

    expect(response.status).toBe(200);
    expect(response.body.data.matched).toBe(2);
    expect(response.body.data.skipped).toBe(1);
    expect((await User.findById(studentA._id)).isActive).toBe(false);
    expect((await User.findById(studentB._id)).isActive).toBe(false);
    expect((await User.findById(admin._id)).isActive).toBe(true);
  });

  it('rejects bulk delete of users from a non-admin moderator', async () => {
    const moderator = await User.create({
      firstName: 'Mod',
      lastName: 'Erator',
      email: 'bulk-mod@linguanest.local',
      password: 'Password123!',
      role: 'moderator',
      isEmailVerified: true,
      moderatorPermissions: { communityModeration: false, supportChat: false, catalogContentQa: false, limitedUserManagement: true },
    });
    const student = await User.create({ firstName: 'C', lastName: 'Student', email: 'bulk-c@linguanest.local', password: 'Password123!', role: 'student', isEmailVerified: true });

    const token = signToken(moderator);
    const response = await request(app)
      .post('/api/admin/users/bulk-action')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [student._id.toString()], action: 'delete' });

    expect(response.status).toBe(403);
    expect(await User.findById(student._id)).not.toBeNull();
  });

  it('bulk publishes courses through the generic content bulk-update endpoint', async () => {
    const admin = await User.create({ firstName: 'Admin', lastName: 'Two', email: 'bulk-admin2@linguanest.local', password: 'AdminPassword123!', role: 'admin', isEmailVerified: true });
    const courseA = await makeCourse({ title: 'Course A' });
    const courseB = await makeCourse({ title: 'Course B' });

    const token = signToken(admin);
    const response = await request(app)
      .patch('/api/admin/content/courses/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [courseA._id.toString(), courseB._id.toString()], updates: { isPublished: true } });

    expect(response.status).toBe(200);
    expect(response.body.data.modifiedCount).toBe(2);
    expect((await Course.findById(courseA._id)).isPublished).toBe(true);
    expect((await Course.findById(courseB._id)).isPublished).toBe(true);
  });

  it('bulk deletes courses through the generic content bulk-delete endpoint', async () => {
    const admin = await User.create({ firstName: 'Admin', lastName: 'Three', email: 'bulk-admin3@linguanest.local', password: 'AdminPassword123!', role: 'admin', isEmailVerified: true });
    const courseA = await makeCourse({ title: 'Course C' });
    const courseB = await makeCourse({ title: 'Course D' });

    const token = signToken(admin);
    const response = await request(app)
      .post('/api/admin/content/courses/bulk-delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [courseA._id.toString(), courseB._id.toString()] });

    expect(response.status).toBe(200);
    expect(response.body.data.deletedCount).toBe(2);
    expect(await Course.countDocuments({ _id: { $in: [courseA._id, courseB._id] } })).toBe(0);
  });
});
