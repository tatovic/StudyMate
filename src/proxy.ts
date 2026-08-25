import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

// Next.js 16: fajl se zove proxy.ts (ranije middleware.ts),
// a izvezena funkcija proxy (ranije middleware). Runtime je uvek nodejs.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
