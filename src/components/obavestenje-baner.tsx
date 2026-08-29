// Deljeni baner za neutralna obavestenja (nije greska) koja se prenose kroz
// query parametre posle redirect-a iz Server Action-a - tiket 11.
export function ObavestenjeBaner({ poruka }: { poruka: string }) {
  return (
    <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
      {poruka}
    </p>
  )
}
