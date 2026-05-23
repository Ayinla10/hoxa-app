import { getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getBuyerTransactions } from '@/actions/transactions'
import SupportPageClient from './SupportPageClient'

export default async function SupportPage() {
  const { user } = await getAuthUser()
  if (!user) redirect('/login')

  const transactions = await getBuyerTransactions()

  return <SupportPageClient transactions={transactions} />
}
