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
      <nav className="border-b">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/dashboard" className="font-semibold">
              StudyMate
            </Link>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
              {linkovi.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-black">
                  {l.label}
                </Link>
              ))}
            </div>
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
