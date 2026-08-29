import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import ChatMessage from '../src/models/ChatMessage.js';
import ForumPost from '../src/models/ForumPost.js';
import Progress from '../src/models/Progress.js';

const signAdminToken = (user) => jwt.sign({ id: user._id, role: 'admin' }, process.env.JWT_SECRET || 'local-development-only-secret', { expiresIn: '1h' });

describe('Platform reset flow', () => {
  it('keeps only admin data and clears all user-generated content', async () => {
    const admin = await User.create({
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@linguanest.local',
      password: 'AdminPassword123!',
      role: 'admin',
      isEmailVerified: true,
    });

    await User.create({
      firstName: 'Student',
      lastName: 'User',
      email: 'student@linguanest.local',
      password: 'StudentPassword123!',
      role: 'student',
      isEmailVerified: true,
    });

    await User.create({
      firstName: 'Teacher',
      lastName: 'User',
      email: 'teacher@linguanest.local',
      password: 'TeacherPassword123!',
      role: 'teacher',
      isEmailVerified: true,
    });

    await ChatMessage.create({
      conversation: '507f1f77bcf86cd799439011',
      sender: admin._id,
      body: 'This message should be removed',
      readBy: [admin._id],
    });

    await ForumPost.create({
      title: 'Test Post',
      content: 'This forum post should be removed',
      author: admin._id,
    });

    await Progress.create({
      user: admin._id,
      course: '507f1f77bcf86cd799439012',
      lesson: '507f1f77bcf86cd799439013',
      isCompleted: false,
    });

    const token = signAdminToken(admin);
    const response = await request(app)
      .post('/api/admin/reset-platform')
      .set('Authorization', `Bearer ${token}`)
      .send({ confirm: 'RESET_PLATFORM_0' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(await User.countDocuments({ role: 'admin' })).toBeGreaterThanOrEqual(1);
    expect(await User.countDocuments({ role: { $ne: 'admin' } })).toBe(0);
    expect(await ChatMessage.countDocuments()).toBe(0);
    expect(await ForumPost.countDocuments()).toBe(0);
    expect(await Progress.countDocuments()).toBe(0);
  });
});
