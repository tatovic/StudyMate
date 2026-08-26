'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { porukaGreske } from '@/lib/auth-greske'
import { validirajLozinku } from '@/lib/validacija'

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

  const { error } = await supabase.auth.signUp({
    email: String(formData.get('email')),
    password: lozinka,
    options: { data: { ime: String(formData.get('ime')) } },
  })

  if (error) {
    return { greska: porukaGreske(error, 'Registracija nije uspela. Pokusaj ponovo.') }
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
