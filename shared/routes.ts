import { z } from 'zod';
import { insertUserSchema, insertSaveSchema, GameStateSchema } from './schema';

// ============================================
// API CONTRACT
// ============================================

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

export const api = {
  // Simple auth/user routes
  users: {
    login: {
      method: 'POST' as const,
      path: '/api/users/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.object({ id: z.number(), username: z.string() }),
        401: errorSchemas.unauthorized,
      }
    },
    register: {
      method: 'POST' as const,
      path: '/api/users/register',
      input: insertUserSchema,
      responses: {
        201: z.object({ id: z.number(), username: z.string() }),
        400: errorSchemas.validation,
      }
    }
  },
  // Save management
  saves: {
    get: {
      method: 'GET' as const,
      path: '/api/saves/latest',
      responses: {
        200: GameStateSchema,
        404: errorSchemas.notFound,
      }
    },
    sync: {
      method: 'POST' as const,
      path: '/api/saves',
      input: GameStateSchema,
      responses: {
        200: z.object({ success: z.boolean(), timestamp: z.number() }),
        400: errorSchemas.validation,
      }
    }
  }
};
