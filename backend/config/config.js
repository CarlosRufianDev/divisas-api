require('dotenv').config();
const { z } = require('zod');

const schema = z.object({
  MONGODB_URI: z.string().min(10),
  API_URL: z.string().url(),
  JWT_SECRET: z.string().min(12),
  EMAIL_USER: z.string().email().optional().or(z.literal('')),
  EMAIL_PASS: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:4200'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Config validation error:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const rawOrigins = parsed.data.ALLOWED_ORIGINS
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const config = {
  ...parsed.data,
  ALLOWED_ORIGIN_LIST: rawOrigins
};

module.exports = { config };