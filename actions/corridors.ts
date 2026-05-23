'use server'

import { createClient, getAuthUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cache } from 'react'

// ── Public reads (cached per request) ──

export const getActiveCorridors = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('corridors')
    .select('*')
    .eq('is_active', true)
    .order('send_currency', { ascending: true })
  if (error) console.error('[getActiveCorridors]', error.message)
  return data ?? []
})

export const getCorridorById = cache(async (id: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('corridors')
    .select('*, hoxa_collection_accounts(*)')
    .eq('id', id)
    .single()
  return data
})

export const getAllCorridors = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('corridors')
    .select('*')
    .order('is_active', { ascending: false })
    .order('send_currency', { ascending: true })
  return data ?? []
})

/** Find corridor by currency pair */
export const findCorridor = cache(async (sendCurrency: string, receiveCurrency: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('corridors')
    .select('*')
    .eq('send_currency', sendCurrency)
    .eq('receive_currency', receiveCurrency)
    .eq('is_active', true)
  return data ?? []
})

/** Get countries that use a given currency (for destination country suggestions) */
export const getCountriesForCurrency = cache(async (currency: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('corridors')
    .select('receive_country')
    .eq('receive_currency', currency)
    .eq('is_active', true)
  const countries = [...new Set((data ?? []).map(d => d.receive_country))]
  return countries
})

// ── Admin CRUD ──

export async function createCorridor(input: {
  send_country: string
  send_currency: string
  receive_country: string
  receive_currency: string
  collection_account_id?: string
  min_amount: number
  max_amount: number
}) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  // RLS enforces admin-only write — this check is belt-and-suspenders
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const { error } = await supabase.from('corridors').insert({
    ...input,
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/corridors')
  return { success: true }
}

export async function updateCorridor(id: string, input: Record<string, unknown>) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const { error } = await supabase.from('corridors').update(input).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/corridors')
  return { success: true }
}

export async function toggleCorridorActive(id: string, isActive: boolean) {
  return updateCorridor(id, { is_active: isActive })
}
