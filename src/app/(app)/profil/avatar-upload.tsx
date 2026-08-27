'use client'

import { useActionState, useRef } from 'react'
import { Avatar } from '@/components/avatar'
import { DOZVOLJENI_TIPOVI_SLIKE } from '@/lib/validacija'
import { sacuvajAvatar } from './actions'

export function AvatarUpload({
  ime,
  avatarUrl,
}: {
  ime: string
  avatarUrl: string | null
}) {
  const [state, formAction, pending] = useActionState(sacuvajAvatar, null)
  const formRef = useRef<HTMLFormElement>(null)

  const prikazanaSlika = state && 'avatarUrl' in state ? state.avatarUrl : avatarUrl

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-4">
      <Avatar url={prikazanaSlika} ime={ime} size={72} />
      <div className="flex flex-col gap-1">
        <label className="w-fit cursor-pointer rounded-md border px-3 py-1.5 text-sm">
          {pending ? 'Otpremanje...' : 'Promeni sliku'}
          <input
            type="file"
            name="slika"
            accept={DOZVOLJENI_TIPOVI_SLIKE.join(',')}
            className="hidden"
            disabled={pending}
            onChange={() => formRef.current?.requestSubmit()}
          />
        </label>
        {state && 'greska' in state && <p className="text-sm text-red-600">{state.greska}</p>}
      </div>
    </form>
  )
}
