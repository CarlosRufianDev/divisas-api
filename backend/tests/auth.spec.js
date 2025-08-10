const request = require('supertest');
const app = require('../index');

const user = { email: 'test@example.com', password: 'Secret123', username: 'tester' };

describe('Auth', () => {
  it('registers user', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('logs in user', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
