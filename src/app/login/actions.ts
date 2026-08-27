'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { porukaGreske } from '@/lib/auth-greske'
import { validirajLozinku } from '@/lib/validacija'
import { trenutniOrigin } from '@/lib/site-url'

export async function login(_prev: unknown, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email')),
    password: String(formData.get('password')),
  })

  if (error) return { greska: porukaGreske(error, 'Pogresan email ili lozinka.') }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function register(_prev: unknown, formData: FormData) {
  const supabase = await createClient()

  const lozinka = String(formData.get('password'))
  const lozinkaGreska = validirajLozinku(lozinka)
  if (lozinkaGreska) return { greska: lozinkaGreska }

  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get('email')),
    password: lozinka,
    options: {
      data: { ime: String(formData.get('ime')) },
      emailRedirectTo: `${await trenutniOrigin()}/auth/confirm?next=/dashboard`,
    },
  })

  if (error) {
    return { greska: porukaGreske(error, 'Registracija nije uspela. Pokusaj ponovo.') }
  }

  // Kad je "Confirm email" ukljucen (produkcija), signUp ne otvara sesiju odmah -
  // korisnik mora prvo da klikne link iz emaila. Kad je iskljucen (razvoj), sesija
  // postoji odmah i moze pravo na dashboard.
  if (!data.session) {
    revalidatePath('/', 'layout')
    redirect('/login?poruka=proveri-email')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
