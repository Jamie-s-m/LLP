import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

// Regression test for a real production incident: registration hung indefinitely (60s+, no
// response) once SMTP env vars pointed at a real host, because the nodemailer transporter had
// no connection/socket timeouts and register() awaits the verification email send before
// responding. 192.0.2.1 is a TEST-NET-1 address (RFC 5737) reserved for documentation and
// guaranteed non-routable, standing in for "SMTP host that never responds".
describe('Registration does not hang on an unreachable SMTP host', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    process.env.SMTP_HOST = '192.0.2.1';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test';
    process.env.SMTP_PASS = 'test';
  });

  afterAll(async () => {
    process.env = originalEnv;
    await User.deleteOne({ email: 'unreachable-smtp@example.com' });
  });

  test('register() completes well within its own bounded email timeout, not an indefinite hang', async () => {
    const startedAt = Date.now();

    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Timeout',
      lastName: 'Tester',
      email: 'unreachable-smtp@example.com',
      password: 'testpass123',
      role: 'student',
    });

    const elapsedMs = Date.now() - startedAt;

    // The transporter's own connectionTimeout is 10s; this proves the request is bounded by
    // that instead of hanging on an OS-level TCP timeout (which can be 60s+).
    expect(elapsedMs).toBeLessThan(15000);
    expect(res.status).toBe(201);

    const user = await User.findOne({ email: 'unreachable-smtp@example.com' });
    expect(user).not.toBeNull();
  }, 20000);
});
