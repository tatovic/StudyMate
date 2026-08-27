import { headers } from 'next/headers'

// Domen sa kog je stigao zahtev (localhost u razvoju, pravi domen u produkciji).
// Koristi se za emailRedirectTo tako da link za potvrdu naloga uvek vodi na domen
// sa kog se korisnik registrovao, bez rucnog podesavanja promenljive okruzenja.
export async function trenutniOrigin() {
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('x-forwarded-host') ?? h.get('host')
  return h.get('origin') ?? `${proto}://${host}`
}
