import { getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getBuyerTransactions } from '@/actions/transactions'
import { getSettings } from '@/actions/settings'
import SupportPageClient from './SupportPageClient'

export default async function SupportPage() {
  const { user } = await getAuthUser()
  if (!user) redirect('/login')

  const [transactions, settings] = await Promise.all([
    getBuyerTransactions(),
    getSettings(),
  ])

  const whatsappNumber: string = settings['support_whatsapp'] ?? process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '+233000000000'

  return <SupportPageClient transactions={transactions} whatsappNumber={whatsappNumber} />
}
