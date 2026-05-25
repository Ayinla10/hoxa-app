'use server'

import { createClient, createServiceClient, getAuthUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cache } from 'react'

// ── Public reads (cached per request) ──

/** Get active payment providers for a country + currency */
export const getProvidersForCountry = cache(async (country: string, currency?: string) => {
  const supabase = await createClient()
  let query = supabase
    .from('payment_providers')
    .select('*')
    .eq('country', country)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (currency) query = query.eq('currency', currency)

  const { data } = await query
  return data ?? []
})

/** Get all providers (admin) */
export const getAllProviders = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('payment_providers')
    .select('*')
    .order('country')
    .order('sort_order', { ascending: true })
  return data ?? []
})

/** Get provider by ID */
export const getProviderById = cache(async (id: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('payment_providers')
    .select('*')
    .eq('id', id)
    .single()
  return data
})

// ── Collection accounts ──

export const getCollectionAccount = cache(async (country: string, currency: string) => {
  const supabase = await createClient()
  // Try exact country + currency match first, fall back to currency-only
  const { data: exact } = await supabase
    .from('hoxa_collection_accounts')
    .select('*')
    .eq('currency', currency)
    .eq('is_active', true)
    .eq('country', country)
    .maybeSingle()
  if (exact) return exact

  // Fallback: any active account for this currency
  const { data: byCurrency } = await supabase
    .from('hoxa_collection_accounts')
    .select('*')
    .eq('currency', currency)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()
  return byCurrency ?? null
})

export const getAllCollectionAccounts = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('hoxa_collection_accounts')
    .select('*')
    .order('country')
  return data ?? []
})

// ── Admin CRUD for providers ──

export async function createProvider(input: {
  country: string
  currency: string
  provider_name: string
  method_type: string
  display_name: string
  display_icon?: string
  instruction_template: Record<string, unknown>
  account_number_format?: string
  account_number_length?: number
  sort_order?: number
}) {
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const { error } = await service.from('payment_providers').insert({
    ...input,
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/providers')
  return { success: true }
}

export async function updateProvider(id: string, input: Record<string, unknown>) {
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const { error } = await service.from('payment_providers').update(input).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/providers')
  return { success: true }
}

// ── Admin CRUD for collection accounts ──

export async function createCollectionAccount(input: {
  country: string
  currency: string
  provider: string
  account_number: string
  account_name?: string
}) {
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const { error } = await service.from('hoxa_collection_accounts').insert({
    ...input,
    account_name: input.account_name ?? 'HOXA Secure Account',
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/collection-accounts')
  return { success: true }
}

export async function updateCollectionAccount(id: string, input: Record<string, unknown>) {
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const { error } = await service.from('hoxa_collection_accounts').update(input).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/collection-accounts')
  return { success: true }
}
