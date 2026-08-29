import Link from 'next/link'

export default function NijePronadjeno() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Stranica nije pronadjena</h1>
      <p className="text-sm text-gray-600">Putanja koju trazis ne postoji ili je premestena.</p>
      <Link href="/" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700">
        Nazad na pocetnu
      </Link>
    </main>
  )
}
