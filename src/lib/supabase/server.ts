import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Supabase klijent za Server Components, Server Actions i Route Handlers.
// U Next.js 16 cookies() je iskljucivo asinhron, zato je funkcija async.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Poziv iz Server Component-a: proxy.ts vec osvezava sesiju, pa se ignorise.
          }
        },
      },
    }
  )
}
