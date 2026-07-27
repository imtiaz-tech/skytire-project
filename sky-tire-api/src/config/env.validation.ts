import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // Database
  DATABASE_URL: Joi.string().required(),

  // Server
  PORT: Joi.number().default(5001),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // JWT
  JWT_SECRET: Joi.string().default('sky-tire-secret-key-2026'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  // Frontend
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
  /** Public origin for email <img src> (no /api). Required for Gmail to load images. */
  EMAIL_IMAGE_BASE_URL: Joi.string().optional().allow(''),
  API_PUBLIC_URL: Joi.string().optional().allow(''),
});
