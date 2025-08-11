const request = require('supertest');
const app = require('../app');

const user = { email: `test${Date.now()}@example.com`, password: 'Secret123' }

beforeAll(async () => {
  const res = await request(app).post('/api/auth/register').send(user)
  console.log('REGISTER RESPONSE:', res.status, res.body)
  expect([200, 201]).toContain(res.status)
})

describe('Auth', () => {
  it('logs in user', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: user.email, password: user.password })
    console.log('LOGIN RESPONSE:', res.status, res.body)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })
})
