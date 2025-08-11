const request = require('supertest')
const app = require('../index')

const user = { email: 'test@example.com', password: 'Secret123', username: 'tester' }

beforeAll(async () => {
  const res = await request(app).post('/api/auth/register').send(user)
  expect([200, 201]).toContain(res.status)
})

describe('Auth', () => {
  it('logs in user', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: user.email, password: user.password })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })
})
