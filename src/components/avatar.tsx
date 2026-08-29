// Prikaz slike profila; korisnik bez slike dobija zamenski prikaz sa inicijalima.
function inicijali(ime: string): string {
  const delovi = ime.trim().split(/\s+/).filter(Boolean)
  if (delovi.length === 0) return '?'
  if (delovi.length === 1) return delovi[0]!.slice(0, 2).toUpperCase()
  return (delovi[0]![0] + delovi[delovi.length - 1]![0]).toUpperCase()
}

export function Avatar({
  url,
  ime,
  size = 40,
  className = '',
}: {
  url: string | null
  ime: string
  size?: number
  className?: string
}) {
  const stil = { width: size, height: size }

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={ime}
        style={stil}
        className={`shrink-0 rounded-full object-cover ring-1 ring-black/5 ${className}`}
      />
    )
  }

  return (
    <div
      style={stil}
      className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-700 ${className}`}
    >
      {inicijali(ime)}
    </div>
  )
}
