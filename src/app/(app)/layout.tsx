import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'
import { SubmitDugme } from '@/components/submit-dugme'

const linkovi = [
  { href: '/dashboard', label: 'Pocetna' },
  { href: '/predmeti', label: 'Predmeti' },
  { href: '/korisnici', label: 'Korisnici' },
  { href: '/grupe', label: 'Grupe' },
  { href: '/profil', label: 'Profil' },
]

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl justify-center px-4 pt-4">
          <Link href="/dashboard" className="text-xl font-semibold tracking-tight">
            <span className="text-indigo-600">Study</span>
            <span className="text-gray-900">Mate</span>
          </Link>
        </div>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex flex-wrap gap-2 text-sm font-bold text-gray-600">
            {linkovi.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg border border-gray-200 px-3 py-1.5 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <form action={logout}>
            <SubmitDugme ucitavanjeTekst="Odjavljivanje...">Odjavi se</SubmitDugme>
          </form>
        </div>
      </nav>
      {children}
    </div>
  )
}
