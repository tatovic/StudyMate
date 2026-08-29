'use client'

// Hvata neuhvacene greske u renderovanju stranica - prikazuje poruku na
// srpskom umesto belog ekrana ili neuhvacenog izuzetka (tiket 10).
export default function Greska({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Doslo je do greske</h1>
      <p className="text-sm text-gray-600">
        Nesto nije uspelo kako je trebalo. Pokusaj ponovo - ako se problem nastavi, vrati se
        malo kasnije.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
      >
        Pokusaj ponovo
      </button>
    </main>
  )
}
