import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

// Regression test for a real production incident: registration hung indefinitely (60s+, no
// response) once SMTP env vars pointed at a real host, because the nodemailer transporter had
// no connection/socket timeouts and register() awaited the verification email send before
// responding. A bounded timeout closed the hang, but registration still took ~20s end to end -
// unacceptable for a button a user is staring at. The real fix is that the email send is now
// fire-and-forget: register() never waits on it at all, so the response is fast regardless of
// mail server health. 192.0.2.1 is a TEST-NET-1 address (RFC 5737) reserved for documentation
// and guaranteed non-routable, standing in for "SMTP host that never responds".
describe('Registration does not wait on the mail server at all', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    process.env.SMTP_HOST = '192.0.2.1';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test';
    process.env.SMTP_PASS = 'test';
  });

  afterAll(async () => {
    // Let the background send attempt hit its own connectionTimeout before the test file exits,
    // so Jest's --detectOpenHandles doesn't catch an in-flight socket from this test.
    await new Promise((resolve) => setTimeout(resolve, 10500));
    process.env = originalEnv;
    await User.deleteOne({ email: 'unreachable-smtp@example.com' });
  }, 15000);

  test('register() responds fast, with a verification link, without waiting on email at all', async () => {
    const startedAt = Date.now();

    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Timeout',
      lastName: 'Tester',
      email: 'unreachable-smtp@example.com',
      password: 'testpass123',
      role: 'student',
    });

    const elapsedMs = Date.now() - startedAt;

    // Fire-and-forget means this is bounded by DB writes, not by the SMTP handshake (whose own
    // connectionTimeout is 10s) - a regression back to awaiting the send would push this well
    // past 1s.
    expect(elapsedMs).toBeLessThan(1000);
    expect(res.status).toBe(201);
    expect(res.body.data.previewUrl).toContain('/verify-email?token=');

    const user = await User.findOne({ email: 'unreachable-smtp@example.com' });
    expect(user).not.toBeNull();
  });
});
