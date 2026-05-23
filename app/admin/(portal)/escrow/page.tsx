import { redirect } from 'next/navigation'

// /admin/escrow → canonical payment review queue
export default function EscrowPage() {
  redirect('/admin/payment-review')
}
