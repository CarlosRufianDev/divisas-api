const request = require('supertest')
const app = require('../index')
const axios = require('axios')

jest.mock('axios')

const user = { email: 'conv@example.com', password: 'Secret123', username: 'convuser' }

let token

beforeAll(async () => {
  // Registrar y loguear
  await request(app).post('/api/auth/register').send(user)
  const res = await request(app).post('/api/auth/login')
    .send({ email: user.email, password: user.password })
  token = res.body.token
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('Convert', () => {
  it('converts USD to EUR (mock rates)', async () => {
    // Simula respuesta externa (ajusta shape según tu controlador)
    axios.get.mockResolvedValueOnce({
      data: {
        rates: { USD: 1, EUR: 0.9 },
        base: 'USD'
      }
    })

    const res = await request(app)
      .get('/api/convert')
      .set('Authorization', `Bearer ${token}`)
      .query({ from: 'USD', to: 'EUR', amount: 100 })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('result')
    expect(res.body.result).toBeCloseTo(90, 5)
    expect(axios.get).toHaveBeenCalled()
  })

  it('rejects missing params', async () => {
    const res = await request(app)
      .get('/api/convert')
      .set('Authorization', `Bearer ${token}`)
      .query({ from: 'USD', amount: 50 }) // falta 'to'
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})
