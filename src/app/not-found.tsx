import Link from 'next/link'

export default function NijePronadjeno() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Stranica nije pronadjena</h1>
      <p className="text-sm text-gray-600">Putanja koju trazis ne postoji ili je premestena.</p>
      <Link href="/" className="rounded-md bg-black px-4 py-2 text-sm text-white">
        Nazad na pocetnu
      </Link>
    </main>
  )
}
