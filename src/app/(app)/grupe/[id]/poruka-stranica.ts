// Broj poruka koji se ucitava odjednom - deli ga i page.tsx (Server Component) i chat.tsx
// (Client Component). Namerno NIJE u chat.tsx: taj fajl ima 'use client', a Next.js RSC
// granica pretvara SVAKI export klijentskog fajla, kad se uveze u Server Component, u
// opaku referencu upotrebljivu samo kao JSX - runtime vrednost (npr. za .limit()/.slice())
// bi na serveru bila funkcija-proxy umesto broja 30, ne stvarni broj (otkriveno rucnom
// proverom - upit je vracao sve poruke bez ogranicenja, a "starije" stranicenje se lomilo).
export const PORUKA_STRANICA = 30
