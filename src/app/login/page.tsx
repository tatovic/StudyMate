import Link from 'next/link'
import { GreskaBaner } from '@/components/greska-baner'
import { ObavestenjeBaner } from '@/components/obavestenje-baner'
import { LoginForm } from './login-form'

const GRESKE: Record<string, string> = {
  'potvrda-nije-uspela':
    'Link za potvrdu naloga nije vazeci ili je istekao. Registruj se ponovo ili se prijavi da dobijes novi link.',
}

const OBAVESTENJA: Record<string, string> = {
  'proveri-email': 'Nalog je kreiran. Proveri email i klikni na link da potvrdis nalog pre prijave.',
}

// Next.js 16: searchParams je Promise i mora se await-ovati.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ greska?: string; poruka?: string }>
}) {
  const sp = await searchParams

  return (
    <main className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-indigo-50 via-white to-white p-6">
      <div className="mx-auto w-full max-w-sm space-y-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Prijava na StudyMate</h1>

        {sp.greska && GRESKE[sp.greska] && <GreskaBaner poruka={GRESKE[sp.greska]} />}
        {sp.poruka && OBAVESTENJA[sp.poruka] && <ObavestenjeBaner poruka={OBAVESTENJA[sp.poruka]} />}

        <LoginForm />

        <p className="text-sm text-gray-600">
          Nemas nalog?{' '}
          <Link href="/register" className="font-medium text-indigo-600 hover:underline">
            Registruj se
          </Link>
        </p>
      </div>
    </main>
  )
}
