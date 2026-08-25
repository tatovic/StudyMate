import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'

const linkovi = [
  { href: '/dashboard', label: 'Pocetna' },
  { href: '/predmeti', label: 'Predmeti' },
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
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-semibold">
              StudyMate
            </Link>
            <div className="flex gap-3 text-sm text-gray-600">
              {linkovi.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-black">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <form action={logout}>
            <button className="rounded-md border px-3 py-1.5 text-sm">Odjavi se</button>
          </form>
        </div>
      </nav>
      {children}
    </div>
  )
}
