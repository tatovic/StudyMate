import Link from 'next/link'

// Hvata notFound() pozvan iz stranica unutar (app) grupe (npr. grupe/[id],
// profil/[id]) - renderuje se unutar (app)/layout.tsx, pa navigacija ostaje
// vidljiva (tiket 10).
export default function NijePronadjenoUAplikaciji() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 p-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Nije pronadjeno</h1>
      <p className="text-sm text-gray-600">
        Ono sto trazis ne postoji, obrisano je, ili nemas pristup.
      </p>
      <Link href="/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700">
        Nazad na pocetnu
      </Link>
    </main>
  )
}
