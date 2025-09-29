const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')
let mongod

beforeAll(async () => {
  process.env.DOTENV_DISABLE_LOG = 'true'
  process.env.JWT_SECRET = 'testsecret'
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  process.env.MONGODB_URI = uri
  await mongoose.connect(uri)
}, 30000) // Aumentar timeout a 30 segundos

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  if (mongod) await mongod.stop()
}, 30000) // Aumentar timeout a 30 segundos
