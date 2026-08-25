import request from 'supertest';
import app from '../src/app.js';

describe('Rate Limiting Tests', () => {
  it('enforces authentication rate limits', async () => {
    const requests = [];

    // Make 15 requests (limit is 10)
    for (let i = 0; i < 15; i++) {
      requests.push(
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'test123' })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);

    expect(rateLimited).toBe(true);
  }, 30000);
});

describe('Security Headers Tests', () => {
  it('sets security headers', async () => {
    const response = await request(app).get('/api/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
  });

  it('sanitizes MongoDB injection attempts', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: { $ne: null },
        password: { $ne: null }
      });

    expect(response.status).not.toBe(200);
  });
});
