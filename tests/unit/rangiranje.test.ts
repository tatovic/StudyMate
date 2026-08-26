import { describe, expect, it } from 'vitest'
import {
  rangirajPreporuceneGrupe,
  rangirajSlicneKorisnike,
  type PreporucenaGrupa,
  type SlicanKorisnik,
} from '@/lib/rangiranje'

function korisnik(delimicno: Partial<SlicanKorisnik> & { id: string; ime: string }): SlicanKorisnik {
  return {
    skola: null,
    opis: null,
    avatar_url: null,
    zajednicki: 0,
    predmeti: [],
    ...delimicno,
  }
}

function grupa(delimicno: Partial<PreporucenaGrupa> & { id: number; naziv: string }): PreporucenaGrupa {
  return {
    opis: null,
    predmet: 'Matematika',
    broj_clanova: 0,
    max_clanova: 10,
    ...delimicno,
  }
}

describe('rangirajSlicneKorisnike', () => {
  it('sortira po broju zajednickih predmeta opadajuce', () => {
    const rezultat = rangirajSlicneKorisnike(
      [
        korisnik({ id: '1', ime: 'Ana', zajednicki: 1 }),
        korisnik({ id: '2', ime: 'Bojan', zajednicki: 3 }),
        korisnik({ id: '3', ime: 'Vera', zajednicki: 2 }),
      ],
      10
    )
    expect(rezultat.map((k) => k.id)).toEqual(['2', '3', '1'])
  })

  it('kod izjednacenog broja zajednickih predmeta sortira alfabetski po imenu', () => {
    const rezultat = rangirajSlicneKorisnike(
      [korisnik({ id: '1', ime: 'Zoran', zajednicki: 2 }), korisnik({ id: '2', ime: 'Ana', zajednicki: 2 })],
      10
    )
    expect(rezultat.map((k) => k.ime)).toEqual(['Ana', 'Zoran'])
  })

  it('postuje limit', () => {
    const svi = Array.from({ length: 5 }, (_, i) => korisnik({ id: String(i), ime: `K${i}`, zajednicki: i }))
    expect(rangirajSlicneKorisnike(svi, 2)).toHaveLength(2)
  })

  it('ne menja ulazni niz', () => {
    const svi = [korisnik({ id: '1', ime: 'Ana', zajednicki: 1 }), korisnik({ id: '2', ime: 'Bojan', zajednicki: 2 })]
    const kopija = [...svi]
    rangirajSlicneKorisnike(svi, 10)
    expect(svi).toEqual(kopija)
  })
})

describe('rangirajPreporuceneGrupe', () => {
  it('sortira grupe po broju clanova opadajuce', () => {
    const rezultat = rangirajPreporuceneGrupe(
      [grupa({ id: 1, naziv: 'A', broj_clanova: 2 }), grupa({ id: 2, naziv: 'B', broj_clanova: 5 })],
      10
    )
    expect(rezultat.map((g) => g.id)).toEqual([2, 1])
  })

  it('postuje limit', () => {
    const sve = Array.from({ length: 4 }, (_, i) => grupa({ id: i, naziv: `G${i}`, broj_clanova: i }))
    expect(rangirajPreporuceneGrupe(sve, 2)).toHaveLength(2)
  })
})
