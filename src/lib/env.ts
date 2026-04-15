import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_APP_ENV: z.enum(['development', 'production', 'preview']).default('production'),
})

const parsed = envSchema.safeParse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
})

if (!parsed.success) {
  console.error('[env] Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables. Check your .env file.')
}

export const env = parsed.data

export type Env = z.infer<typeof envSchema>
