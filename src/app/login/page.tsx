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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Prijava na StudyMate</h1>

      {sp.greska && GRESKE[sp.greska] && <GreskaBaner poruka={GRESKE[sp.greska]} />}
      {sp.poruka && OBAVESTENJA[sp.poruka] && <ObavestenjeBaner poruka={OBAVESTENJA[sp.poruka]} />}

      <LoginForm />

      <p className="text-sm text-gray-600">
        Nemas nalog?{' '}
        <Link href="/register" className="underline">
          Registruj se
        </Link>
      </p>
    </main>
  )
}
