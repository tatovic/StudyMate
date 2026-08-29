// Deljeni baner za greske koje se prenose kroz query parametre posle redirect-a
// iz Server Action-a (npr. kad akcija koja nema sopstvenu formu za povratno
// stanje ne uspe) - tiket 10.
export function GreskaBaner({ poruka }: { poruka: string }) {
  return (
    <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
      {poruka}
    </p>
  )
}
