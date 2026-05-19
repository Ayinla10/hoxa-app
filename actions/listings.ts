'use server'

import { createClient, getAuthUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type OfferInput = {
  from_currency: string
  to_currency: string
  rate: number
  min_amount: number
  max_amount: number
  available_liquidity: number
  payment_methods: string[]
}

async function requireSeller() {
  const { user, supabase } = await getAuthUser()
  if (!user) return { supabase, user: null, seller: null }
  const { data: seller } = await supabase.from('sellers').select('id, status').eq('user_id', user.id).single()
  return { supabase, user, seller }
}

async function requireSellerOwnsOffer(offerId: string) {
  const { supabase, user, seller } = await requireSeller()
  if (!user || !seller) return { supabase, user: null, seller: null, offer: null }
  const { data: offer } = await supabase
    .from('offers')
    .select('id, seller_id')
    .eq('id', offerId)
    .eq('seller_id', seller.id)
    .single()
  return { supabase, user, seller, offer }
}

export async function getSellerRecord() {
  const { user, supabase } = await getAuthUser()
  if (!user) return null
  const { data } = await supabase.from('sellers').select('*').eq('user_id', user.id).single()
  return data
}

export async function getSellerOffers() {
  const { supabase, seller } = await requireSeller()
  if (!seller) return []

  const { data } = await supabase
    .from('offers')
    .select('*')
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function createOffer(input: OfferInput) {
  const { supabase, user, seller } = await requireSeller()
  if (!user) return { error: 'Unauthorized' }
  if (!seller) return { error: 'No seller record found. Complete your seller profile first.' }
  if (seller.status !== 'approved') return { error: 'Your seller account is pending approval.' }

  if (input.rate <= 0) return { error: 'Rate must be greater than zero' }
  if (input.min_amount <= 0) return { error: 'Minimum amount must be greater than zero' }
  if (input.max_amount <= 0) return { error: 'Maximum amount must be greater than zero' }
  if (input.min_amount > input.max_amount) return { error: 'Minimum amount cannot exceed maximum amount' }
  if (input.available_liquidity <= 0) return { error: 'Available liquidity must be greater than zero' }
  if (!input.payment_methods.length) return { error: 'At least one payment method is required' }
  if (!input.from_currency || !input.to_currency) return { error: 'Both currencies are required' }
  if (input.from_currency === input.to_currency) return { error: 'Currencies must be different' }

  const { error } = await supabase.from('offers').insert({ ...input, seller_id: seller.id })
  if (error) return { error: 'Failed to create offer' }

  revalidatePath('/seller/listings')
  revalidatePath('/seller/dashboard')
  return { success: true }
}

export async function updateOffer(id: string, input: Partial<OfferInput>) {
  const { supabase, user, offer } = await requireSellerOwnsOffer(id)
  if (!user) return { error: 'Unauthorized' }
  if (!offer) return { error: 'Offer not found' }

  if (input.rate !== undefined && input.rate <= 0) return { error: 'Rate must be greater than zero' }
  if (input.min_amount !== undefined && input.min_amount <= 0) return { error: 'Minimum amount must be greater than zero' }
  if (input.max_amount !== undefined && input.max_amount <= 0) return { error: 'Maximum amount must be greater than zero' }
  if (input.available_liquidity !== undefined && input.available_liquidity <= 0) return { error: 'Available liquidity must be greater than zero' }

  const { error } = await supabase
    .from('offers')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('seller_id', offer.seller_id)

  if (error) return { error: 'Failed to update offer' }
  revalidatePath('/seller/listings')
  revalidatePath('/seller/dashboard')
  return { success: true }
}

export async function toggleOfferAvailability(id: string, available: boolean) {
  const { supabase, user, offer } = await requireSellerOwnsOffer(id)
  if (!user) return { error: 'Unauthorized' }
  if (!offer) return { error: 'Offer not found' }

  const { error } = await supabase
    .from('offers')
    .update({ is_available: available, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('seller_id', offer.seller_id)

  if (error) return { error: 'Failed to update offer' }
  revalidatePath('/seller/listings')
  revalidatePath('/seller/dashboard')
  return { success: true }
}

export async function pauseAllOffers() {
  const { supabase, user, seller } = await requireSeller()
  if (!user) return { error: 'Unauthorized' }
  if (!seller) return { error: 'No seller record found' }

  const { error } = await supabase
    .from('offers')
    .update({ is_available: false, updated_at: new Date().toISOString() })
    .eq('seller_id', seller.id)
    .eq('is_available', true)

  if (error) return { error: 'Failed to pause offers' }
  revalidatePath('/seller/listings')
  revalidatePath('/seller/dashboard')
  return { success: true }
}

export async function updateSellerAvailability(status: 'online' | 'busy' | 'offline') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('sellers')
    .update({ availability: status })
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to update availability' }
  revalidatePath('/seller')
  return { success: true }
}

export async function deleteOffer(id: string) {
  const { supabase, user, offer } = await requireSellerOwnsOffer(id)
  if (!user) return { error: 'Unauthorized' }
  if (!offer) return { error: 'Offer not found' }

  const { error } = await supabase
    .from('offers')
    .delete()
    .eq('id', id)
    .eq('seller_id', offer.seller_id)

  if (error) return { error: 'Failed to delete offer' }
  revalidatePath('/seller/listings')
  return { success: true }
}

export async function getMarketplaceOffers(fromCurrency?: string, toCurrency?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('offers')
    .select(`
      *,
      sellers (
        id, completion_rate, avg_response_seconds, total_transactions, status,
        profiles ( full_name, country )
      )
    `)
    .eq('is_available', true)
    .eq('sellers.status', 'approved')

  if (fromCurrency) query = query.eq('from_currency', fromCurrency)
  if (toCurrency) query = query.eq('to_currency', toCurrency)

  const { data, error } = await query.order('rate', { ascending: true })
  if (error) return []
  return data ?? []
}
