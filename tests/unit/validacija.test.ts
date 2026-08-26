import { describe, expect, it } from 'vitest'
import {
  MAX_VELICINA_SLIKE,
  validirajLozinku,
  validirajMaxClanova,
  validirajNazivGrupe,
  validirajSlikuProfila,
  validirajTekstPoruke,
} from '@/lib/validacija'

describe('validirajNazivGrupe', () => {
  it('odbija prazan naziv', () => {
    expect(validirajNazivGrupe('')).not.toBeNull()
  })

  it('odbija naziv koji je samo razmaci', () => {
    expect(validirajNazivGrupe('   ')).not.toBeNull()
  })

  it('prihvata ispravan naziv', () => {
    expect(validirajNazivGrupe('Matematika 2. godina')).toBeNull()
  })
})

describe('validirajMaxClanova', () => {
  it('odbija vrednost manju od 2', () => {
    expect(validirajMaxClanova(1)).not.toBeNull()
  })

  it('odbija vrednost vecu od 100', () => {
    expect(validirajMaxClanova(101)).not.toBeNull()
  })

  it('odbija necele brojeve', () => {
    expect(validirajMaxClanova(5.5)).not.toBeNull()
  })

  it('prihvata granicne vrednosti 2 i 100', () => {
    expect(validirajMaxClanova(2)).toBeNull()
    expect(validirajMaxClanova(100)).toBeNull()
  })
})

describe('validirajTekstPoruke', () => {
  it('odbija praznu poruku', () => {
    expect(validirajTekstPoruke('   ')).not.toBeNull()
  })

  it('odbija poruku preko 2000 karaktera', () => {
    expect(validirajTekstPoruke('a'.repeat(2001))).not.toBeNull()
  })

  it('prihvata poruku do 2000 karaktera', () => {
    expect(validirajTekstPoruke('a'.repeat(2000))).toBeNull()
  })

  it('prihvata obicnu poruku', () => {
    expect(validirajTekstPoruke('Zdravo svima')).toBeNull()
  })
})

describe('validirajLozinku', () => {
  it('odbija lozinku kracu od 6 karaktera', () => {
    expect(validirajLozinku('abc12')).not.toBeNull()
  })

  it('prihvata lozinku od tacno 6 karaktera', () => {
    expect(validirajLozinku('abc123')).toBeNull()
  })
})

describe('validirajSlikuProfila', () => {
  it('odbija nedozvoljen tip fajla', () => {
    expect(validirajSlikuProfila('application/pdf', 1024)).not.toBeNull()
  })

  it('odbija fajl preko maksimalne velicine', () => {
    expect(validirajSlikuProfila('image/png', MAX_VELICINA_SLIKE + 1)).not.toBeNull()
  })

  it('prihvata dozvoljen tip i velicinu na granici', () => {
    expect(validirajSlikuProfila('image/png', MAX_VELICINA_SLIKE)).toBeNull()
    expect(validirajSlikuProfila('image/jpeg', 1024)).toBeNull()
    expect(validirajSlikuProfila('image/webp', 1024)).toBeNull()
    expect(validirajSlikuProfila('image/gif', 1024)).toBeNull()
  })
})
