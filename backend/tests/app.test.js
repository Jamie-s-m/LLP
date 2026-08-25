import request from 'supertest';
import app from '../src/app.js';

describe('API app', () => {
  it('responds to health check', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('rejects incomplete authentication requests', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com' });

    expect(response.status).toBe(400);
    expect(response.body.message || response.body.error).toMatch(/password/i);
  });

  it('protects authenticated resources', async () => {
    const response = await request(app).get('/api/users/profile');

    expect(response.status).toBe(401);
  });

  it('handles CORS properly', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(200);
  });
});
