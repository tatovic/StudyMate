import { createClient } from '@/lib/supabase/server'
import { AvatarUpload } from './avatar-upload'
import { ProfilForm } from './form'

export default async function ProfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profil } = await supabase
    .from('profiles')
    .select('ime, skola, opis, avatar_url')
    .eq('id', user!.id)
    .single()

  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Moj profil</h1>
        <p className="text-sm text-gray-600">{user!.email}</p>
      </header>

      <AvatarUpload ime={profil?.ime ?? ''} avatarUrl={profil?.avatar_url ?? null} />

      <ProfilForm profil={profil ?? { ime: '', skola: null, opis: null }} />
    </main>
  )
}
