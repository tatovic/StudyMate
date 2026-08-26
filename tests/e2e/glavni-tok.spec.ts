import { expect, test } from '@playwright/test'
import { nadjiKorisnikaPoImenu, obrisiTestKorisnika } from '../helpers/admin'

// Jedan prolaz kroz glavni tok u pravom browseru: registracija -> izbor predmeta ->
// kreiranje grupe -> slanje poruke -> odjava. Zahteva pokrenut dev server (Playwright
// ga sam pokrece, vidi playwright.config.ts) i "Confirm email" iskljucen u test
// Supabase projektu (db.md, sekcija 6) - inace se registracija ne uloguje odmah.

test('registracija, izbor predmeta, kreiranje grupe, poruka, odjava', async ({ page }) => {
  const oznaka = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`
  const email = `studymate-e2e-${oznaka}@example.com`
  const lozinka = 'lozinka123'
  const ime = `E2E Test ${oznaka}`
  const nazivGrupe = `[TEST E2E] Grupa ${oznaka}`
  const tekstPoruke = `Zdravo iz e2e testa ${oznaka}`

  try {
    await page.goto('/register')
    await page.getByPlaceholder('Ime i prezime').fill(ime)
    await page.getByPlaceholder('Email').fill(email)
    await page.getByPlaceholder(/^Lozinka/).fill(lozinka)
    await page.getByRole('button', { name: 'Registruj se' }).click()
    await expect(page).toHaveURL(/\/dashboard/)

    await page.goto('/predmeti')
    const redMatematike = page.locator('li').filter({ hasText: 'Matematika' })
    await redMatematike.getByRole('button', { name: 'Dodaj' }).click()
    await expect(redMatematike.getByRole('button', { name: 'Ukloni' })).toBeVisible()

    await page.goto('/grupe')
    await page.getByRole('button', { name: 'Napravi grupu' }).click()
    await page.getByPlaceholder('Naziv grupe').fill(nazivGrupe)
    await page.getByRole('combobox').selectOption({ label: 'Matematika' })
    await page.getByRole('button', { name: 'Kreiraj' }).click()
    await expect(page).toHaveURL(/\/grupe\/\d+/)

    await page.getByPlaceholder('Napisi poruku...').fill(tekstPoruke)
    await page.getByRole('button', { name: 'Posalji' }).click()
    await expect(page.getByText(tekstPoruke)).toBeVisible()

    await page.getByRole('button', { name: 'Odjavi se' }).click()
    await expect(page).toHaveURL(/\/login/)
  } finally {
    const userId = await nadjiKorisnikaPoImenu(ime)
    if (userId) await obrisiTestKorisnika(userId)
  }
})
