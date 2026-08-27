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
    <div className="rounded-md border border-dashed p-6 text-center">
      <p className="text-sm text-gray-600">{naslov}</p>
      {akcija && (
        <Link
          href={akcija.href}
          className="mt-3 inline-block rounded-md bg-black px-3 py-1.5 text-sm text-white"
        >
          {akcija.label}
        </Link>
      )}
    </div>
  )
}
