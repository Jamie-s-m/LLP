import request from 'supertest';
import app from '../src/app.js';

describe('API app', () => {
  it('responds to health check', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
