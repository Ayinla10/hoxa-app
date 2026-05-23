export type UserRole = 'buyer' | 'seller' | 'admin'

export type User = {
  id: string
  email: string
  full_name: string
  phone: string
  country: string
  role: UserRole
  language: string
  registered_send_account: string | null
  registered_send_country: string | null
  preferred_payment_method: string | null
  unconfirmed_claim_count: number
  fraud_flag: boolean
  fraud_flag_reason: string | null
  created_at: string
}

export type SellerStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
export type SellerAvailability = 'available' | 'offline'

export type Seller = {
  id: string
  user_id: string
  full_name: string
  phone: string
  country: string
  payment_methods: string[]
  currencies: string[]
  daily_limit: number
  status: SellerStatus
  completion_rate: number
  avg_response_seconds: number
  total_transactions: number
  timeout_count: number
  rejection_count: number
  weekly_hours: Record<string, { open: string; close: string }>
  timezone: string
  manual_availability_status: SellerAvailability | null
  admin_availability_override: SellerAvailability | null
  auto_accept_enabled: boolean
  auto_accept_rules: {
    max_amount?: number
    corridors?: string[]
    hours?: { open: string; close: string }
  }
  settlement_accounts: Record<string, string>
  supported_corridors: string[]
  supported_receive_countries: string[]
  created_at: string
}

export type Offer = {
  id: string
  seller_id: string
  seller: Seller
  from_currency: string
  to_currency: string
  rate: number
  min_amount: number
  max_amount: number
  available_liquidity: number
  payment_methods: string[]
  is_available: boolean
  created_at: string
}

// ── V5.1 Transaction Status (full state machine) ──
export type TransactionStatus =
  | 'initiated'
  | 'queued'                        // outside operating hours
  | 'activated'                     // queued → activated at open time
  | 'pending_acceptance'            // seller acceptance logic
  | 'accepted'
  | 'awaiting_payment'              // buyer on payment instruction screen
  | 'pending_ops_confirmation'      // buyer tapped I've Paid
  | 'payment_confirmed'             // ops clicked Confirm
  | 'payment_rejected'              // ops rejected → back to awaiting_payment
  | 'window_expired'                // 20min passed, no ops action
  | 'payment_expired'               // rate lock expired, no payment
  | 'fulfillment_in_progress'       // seller notified to send
  | 'pending_receipt_confirmation'  // seller marked fulfilled
  | 'receipt_confirmed'             // buyer tapped Yes
  | 'auto_confirmed'                // timer expired, auto-confirmed
  | 'disputed'                      // buyer tapped No
  | 'pending_settlement'            // ops settlement queue
  | 'fully_completed'               // done
  | 'acceptance_failed'
  | 'silent_reroute'
  | 'cancelled'
  // Legacy statuses (backward compat)
  | 'pending_seller'
  | 'seller_accepted'
  | 'seller_rejected'
  | 'seller_timeout'
  | 'payment_submitted'
  | 'payment_verified'
  | 'fulfillment'
  | 'completed'

export type Transaction = {
  id: string
  hoxa_transaction_id: string
  buyer_id: string
  seller_id: string
  offer_id: string | null
  corridor_id: string | null
  buyer_destination_country: string | null
  // Legacy fields
  from_currency: string
  to_currency: string
  from_amount: number
  to_amount: number
  rate: number
  // V5.1 fields
  send_amount: number | null
  send_currency: string | null
  receive_amount: number | null
  receive_currency: string | null
  exchange_rate: number | null
  hoxa_fee_amount: number
  seller_settlement_amount: number | null
  buyer_send_account: string | null
  buyer_send_provider: string | null
  buyer_selected_payment_method: string | null
  buyer_receive_account: string | null
  buyer_receive_provider: string | null
  status: TransactionStatus
  // Timestamps
  rate_locked_at: string | null
  rate_expires_at: string | null
  ive_paid_tapped_at: string | null
  payment_window_expires_at: string | null
  payment_confirmed_at: string | null
  fulfillment_notified_at: string | null
  fulfillment_confirmed_at: string | null
  receipt_confirmed_at: string | null
  settlement_released_at: string | null
  auto_confirm_due_at: string | null
  payment_screen_loaded_at: string | null
  // Legacy timestamps
  payment_proof_url: string | null
  payment_reference: string | null
  payment_notes: string | null
  seller_response_deadline: string | null
  verified_by: string | null
  verified_at: string | null
  completed_at: string | null
  // Ops fields
  dispute_reason: string | null
  ops_reject_reason: string | null
  created_at: string
  updated_at: string
}

export type Notification = {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
}

export type AuditLog = {
  id: string
  actor_id: string | null
  actor_role: string | null
  action: string
  entity: string
  entity_id: string
  metadata: Record<string, unknown>
  created_at: string
}

// ── V5.1 New Types ──

export type Corridor = {
  id: string
  send_country: string
  send_currency: string
  receive_country: string
  receive_currency: string
  collection_account_id: string | null
  min_amount: number
  max_amount: number
  is_active: boolean
  launched_at: string | null
  created_at: string
  updated_at: string
}

export type PaymentMethodType = 'app' | 'ussd' | 'bank' | 'qr' | 'cash_deposit'

export type PaymentProvider = {
  id: string
  country: string
  currency: string
  provider_name: string
  method_type: PaymentMethodType
  display_name: string
  display_icon: string | null
  instruction_template: Record<string, unknown>
  account_number_format: string | null
  account_number_length: number | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type HoxaCollectionAccount = {
  id: string
  country: string
  currency: string
  provider: string
  account_number: string
  account_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type BuyerSellerWatch = {
  id: string
  buyer_id: string
  seller_id: string
  amount: number | null
  corridor_id: string | null
  created_at: string
}

// ── Computed types for UI ──

export type SellerComputedStatus = 'available' | 'offline' | 'busy'

export type SellerMarketplaceCard = {
  seller_id: string
  seller_name: string
  rate: number
  from_currency: string
  to_currency: string
  avg_speed_minutes: number
  serves_countries: string[]
  total_completed: number
  completion_rate: number
  status: SellerComputedStatus
  next_available_at: string | null
  min_amount: number
  max_amount: number
  offer_id: string
}

export type PlatformStatus = 'open' | 'busy' | 'closed'

export type CheckoutSummary = {
  receive_amount: number
  receive_currency: string
  receive_provider: string
  receive_account: string
  exchange_rate: number
  seller_name: string
  subtotal: number
  hoxa_fee_percent: number
  hoxa_fee_amount: number
  total_pay: number
  send_currency: string
  rate_expires_at: string
}
