import { getBuyerTransactions } from '@/actions/transactions'
import BuyerTransactionsClient from './BuyerTransactionsClient'

export default async function TransactionsPage() {
  const transactions = await getBuyerTransactions()
  return <BuyerTransactionsClient transactions={transactions} />
}
