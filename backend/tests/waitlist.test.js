import request from 'supertest';
import app from '../src/app.js';
import WaitlistEntry from '../src/models/WaitlistEntry.js';
import User from '../src/models/User.js';

describe('Waitlist API', () => {
  it('rejects an invalid email', async () => {
    const res = await request(app).post('/api/waitlist/join').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('joins the waitlist anonymously and is idempotent for the same email + feature', async () => {
    const email = 'waitlist-anon@example.com';

    const first = await request(app).post('/api/waitlist/join').send({ email, name: 'Anon' });
    expect(first.status).toBe(200);
    expect(first.body.success).toBe(true);

    const second = await request(app).post('/api/waitlist/join').send({ email, name: 'Anon Again' });
    expect(second.status).toBe(200);
    expect(second.body.data.alreadyJoined).toBe(true);

    const entries = await WaitlistEntry.find({ email });
    expect(entries).toHaveLength(1);
    expect(entries[0].feature).toBe('speaking_practice');
  });

  it('links a waitlist entry to the requesting user when authenticated', async () => {
    const user = await User.create({
      firstName: 'Wait',
      lastName: 'Lister',
      email: 'waitlist-user@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'waitlist-user@example.com', password: 'testpass123' });
    const token = loginRes.body.token;

    await request(app)
      .post('/api/waitlist/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'waitlist-user@example.com' });

    const entry = await WaitlistEntry.findOne({ email: 'waitlist-user@example.com' });
    expect(entry.user.toString()).toBe(user._id.toString());
  });

  it('reports a real count and blocks non-admins from listing raw entries', async () => {
    const countRes = await request(app).get('/api/waitlist/count');
    expect(countRes.status).toBe(200);
    expect(typeof countRes.body.data.count).toBe('number');
    expect(countRes.body.data.count).toBeGreaterThan(0);

    const entriesRes = await request(app).get('/api/waitlist/entries');
    expect(entriesRes.status).toBe(401);
  });
});
