// Deljeni indikator ucitavanja - koristi se u loading.tsx datotekama dok se
// stranica jos ceka na podatke sa servera (tiket 10).
export function Ucitavanje({ poruka = 'Ucitavanje...' }: { poruka?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-16 text-sm text-gray-500">
      <span
        className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"
        aria-hidden
      />
      {poruka}
    </div>
  )
}
