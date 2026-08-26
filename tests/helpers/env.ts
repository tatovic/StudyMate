import path from 'node:path'
import { config } from 'dotenv'

config({ path: path.resolve(process.cwd(), '.env.local') })

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Nedostaju NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY u .env.local - ' +
      'testovi pristupa podacima i e2e testovi rade nad pravom Supabase bazom.'
  )
}
