import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Osvezava Supabase sesiju na svakom zahtevu i stiti privatne rute.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // VAZNO: nista izmedju createServerClient i getUser(), inace sesija moze da otkaze.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const javneRute = ['/login', '/register', '/auth']
  const jeJavna = javneRute.some((r) => request.nextUrl.pathname.startsWith(r))

  if (!user && !jeJavna && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // VAZNO: uvek vratiti supabaseResponse da se kolacici ne izgube.
  return supabaseResponse
}
