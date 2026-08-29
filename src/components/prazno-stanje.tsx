import Link from 'next/link'

// Deljeno prazno stanje za liste u aplikaciji - jasan tekst i, kad ima smisla,
// dugme koje vodi ka sledecem koraku (tiket 10).
export function PraznoStanje({
  naslov,
  akcija,
}: {
  naslov: string
  akcija?: { href: string; label: string }
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-8 text-center">
      <p className="text-sm text-gray-600">{naslov}</p>
      {akcija && (
        <Link
          href={akcija.href}
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          {akcija.label}
        </Link>
      )}
    </div>
  )
}
