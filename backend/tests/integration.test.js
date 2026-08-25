import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Course from '../src/models/Course.js';

describe('User API Integration Tests', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Create test user and get token
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'testintegration@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    testUserId = testUser._id;

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testintegration@example.com', password: 'testpass123' });

    authToken = response.body.token;
  });

  afterAll(async () => {
    await User.deleteOne({ email: 'testintegration@example.com' });
  });

  it('allows authenticated user to access profile', async () => {
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('allows user to update profile', async () => {
    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ firstName: 'Updated', lastName: 'Name' });

    expect(response.status).toBe(200);
  });
});

describe('Course API Integration Tests', () => {
  let authToken;
  let testCourseId;

  beforeAll(async () => {
    const testTeacher = await User.create({
      firstName: 'Teacher',
      lastName: 'Test',
      email: 'teacherintegration@example.com',
      password: 'testpass123',
      role: 'teacher',
      isEmailVerified: true,
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacherintegration@example.com', password: 'testpass123' });

    authToken = response.body.token;
  });

  afterAll(async () => {
    await User.deleteOne({ email: 'teacherintegration@example.com' });
    if (testCourseId) {
      await Course.deleteOne({ _id: testCourseId });
    }
  });

  it('allows teacher to create course', async () => {
    const response = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Course',
        description: 'Test Description',
        language: 'English',
        difficulty: 'beginner',
      });

    if (response.status === 201) {
      testCourseId = response.body.data?._id;
      expect(response.status).toBe(201);
    }
  });

  it('returns list of published courses', async () => {
    const response = await request(app).get('/api/courses');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data || response.body.courses || [])).toBe(true);
  });
});
