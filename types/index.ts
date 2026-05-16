export type UserRole = 'buyer' | 'seller' | 'admin'

export type User = {
  id: string
  email: string
  full_name: string
  phone: string
  country: string
  role: UserRole
  created_at: string
}

export type SellerStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

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

export type TransactionStatus =
  | 'pending_seller'      // waiting for seller to accept
  | 'seller_accepted'     // seller accepted, buyer must pay
  | 'seller_rejected'     // seller rejected
  | 'seller_timeout'      // seller did not respond
  | 'payment_submitted'   // buyer uploaded proof
  | 'payment_verified'    // admin verified payment
  | 'fulfillment'         // seller sending funds
  | 'completed'           // done
  | 'disputed'            // dispute open
  | 'cancelled'           // cancelled

export type Transaction = {
  id: string
  buyer_id: string
  seller_id: string
  offer_id: string
  from_currency: string
  to_currency: string
  from_amount: number
  to_amount: number
  rate: number
  status: TransactionStatus
  payment_proof_url: string | null
  payment_reference: string | null
  payment_notes: string | null
  seller_response_deadline: string | null
  verified_by: string | null
  verified_at: string | null
  completed_at: string | null
  created_at: string
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
  admin_id: string
  action: string
  entity: string
  entity_id: string
  metadata: Record<string, unknown>
  created_at: string
}
