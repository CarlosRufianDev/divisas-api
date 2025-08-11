const axios = require('axios')
jest.mock('axios')
const request = require('supertest')
const app = require('../app') // Cambiado aquí

const user = { email: `test${Date.now()}@example.com`, password: 'Secret123', username: 'tester' }
let token

beforeAll(async () => {
  await request(app).post('/api/auth/register').send(user)
  const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password })
  token = res.body.token
})

async function tryPaths(params) {
  const tries = [
    { m: 'get', p: '/api/convert' },
    { m: 'post', p: '/api/convert' },
    { m: 'get', p: '/api/convert/convert' },
    { m: 'post', p: '/api/convert/convert' }
  ]
  for (const t of tries) {
    const r = t.m === 'get'
      ? await request(app)[t.m](t.p).set('Authorization', `Bearer ${token}`).query(params)
      : await request(app)[t.m](t.p).set('Authorization', `Bearer ${token}`).send(params)
    if (r.status !== 404) return r
  }
  return { status: 404, body: {} }
}

describe('Convert', () => {
  it('converts USD->EUR', async () => {
    axios.get.mockResolvedValueOnce({ data: { rates: { USD: 1, EUR: 0.9 }, base: 'USD' } })
    const res = await tryPaths({ from: 'USD', to: 'EUR', amount: 100 })
    expect(res.status).toBe(200)
    const value = parseFloat(res.body.result)
    expect(value).toBeCloseTo(90, 5)
  })

  it('rejects missing params', async () => {
    const res = await tryPaths({ from: 'USD', amount: 50 })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})
