import { getSellerPendingRequests } from '@/actions/transactions'
import SellerTopbar from '@/components/seller/SellerTopbar'
import PendingRequestCard from '@/components/seller/PendingRequestCard'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Clock } from 'lucide-react'
import { t, type Lang } from '@/lib/i18n'

export default async function SellerRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name, language').eq('id', user.id).single()
  const cookieStore = await cookies()
  const lang = (profile?.language ?? cookieStore.get('hoxa_lang')?.value ?? 'en') as Lang
  const requests = await getSellerPendingRequests()

  return (
    <>
      <SellerTopbar title={t(lang, 'nav_requests')} sellerName={profile?.full_name ?? ''} notifCount={requests.length} />
      <div className="px-4 lg:px-8 py-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{t(lang, 'pending_requests')}</h2>
            <p className="text-gray-400 text-sm">{requests.length} {t(lang, 'waiting_response')}</p>
          </div>
          {requests.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {requests.length} {lang === 'fr' ? 'urgent' : 'urgent'}
            </span>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <Clock size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{t(lang, 'no_pending')}</p>
            <p className="text-gray-400 text-sm mt-1">{t(lang, 'no_pending_sub')}</p>
          </div>
        ) : (
          <div className="max-w-2xl space-y-3">
            {requests.map((req: any) => {
              const deadline = req.seller_response_deadline ? new Date(req.seller_response_deadline).getTime() : null
              const secondsLeft = deadline ? Math.max(0, Math.floor((deadline - Date.now()) / 1000)) : 120

              return (
                <PendingRequestCard
                  key={req.id}
                  req={{
                    id: req.id,
                    buyerName: req.profiles?.full_name ?? 'Buyer',
                    fromCurrency: req.from_currency,
                    toCurrency: req.to_currency,
                    amount: req.from_amount,
                    rate: req.rate,
                    secondsLeft,
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
