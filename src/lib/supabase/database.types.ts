// Generisano iz Supabase seme. Ne menjati rucno - pokrenuti "npm run gen:types"
// (vidi tech.md, sekcija 4.4) da bi se fajl osvezio posle izmene migracije.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          ime: string
          skola: string | null
          opis: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          ime: string
          skola?: string | null
          opis?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ime?: string
          skola?: string | null
          opis?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          id: number
          naziv: string
          kategorija: string | null
        }
        Insert: {
          id?: number
          naziv: string
          kategorija?: string | null
        }
        Update: {
          id?: number
          naziv?: string
          kategorija?: string | null
        }
        Relationships: []
      }
      user_subjects: {
        Row: {
          user_id: string
          subject_id: number
          nivo: string
        }
        Insert: {
          user_id: string
          subject_id: number
          nivo?: string
        }
        Update: {
          user_id?: string
          subject_id?: number
          nivo?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_subjects_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_subjects_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      groups: {
        Row: {
          id: number
          naziv: string
          opis: string | null
          subject_id: number | null
          owner_id: string
          max_clanova: number
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: number
          naziv: string
          opis?: string | null
          subject_id?: number | null
          owner_id: string
          max_clanova?: number
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          naziv?: string
          opis?: string | null
          subject_id?: number | null
          owner_id?: string
          max_clanova?: number
          is_public?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'groups_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'groups_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      group_members: {
        Row: {
          group_id: number
          user_id: string
          uloga: string
          status: string
          joined_at: string
        }
        Insert: {
          group_id: number
          user_id: string
          uloga?: string
          status?: string
          joined_at?: string
        }
        Update: {
          group_id?: number
          user_id?: string
          uloga?: string
          status?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      messages: {
        Row: {
          id: number
          group_id: number
          user_id: string
          tekst: string
          created_at: string
        }
        Insert: {
          id?: number
          group_id: number
          user_id: string
          tekst: string
          created_at?: string
        }
        Update: {
          id?: number
          group_id?: number
          user_id?: string
          tekst?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      je_clan: {
        Args: { g_id: number }
        Returns: boolean
      }
      pronadji_slicne: {
        Args: { limit_n?: number }
        Returns: {
          id: string
          ime: string
          skola: string | null
          opis: string | null
          avatar_url: string | null
          zajednicki: number
          predmeti: string[]
        }[]
      }
      preporuci_grupe: {
        Args: { limit_n?: number }
        Returns: {
          id: number
          naziv: string
          opis: string | null
          predmet: string
          broj_clanova: number
          max_clanova: number
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type DefaultSchema = Database['public']

export type Tables<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Update']
