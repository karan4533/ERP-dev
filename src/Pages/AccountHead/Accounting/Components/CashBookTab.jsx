import React, { useMemo, useState } from 'react'
import {
    CASH_BOOK_ACCOUNTS,
    CASH_BOOK_TRANSACTION_TYPES,
    formatRupeeAmount,
    parseRupeeAmount,
} from '../accountingData'
import { SummaryCards, TableCard, TablePagination, tdClass, thClass } from './AccountingShared'

const CashBookTab = ({ entries, summary }) => {
    const [dateFilter, setDateFilter] = useState('')
    const [cashAccount, setCashAccount] = useState(CASH_BOOK_ACCOUNTS[0])
    const [transactionType, setTransactionType] = useState(CASH_BOOK_TRANSACTION_TYPES[0])

    const filteredEntries = useMemo(() => {
        return entries.filter((row) => {
            if (cashAccount !== 'All Accounts' && row.cashAccount !== cashAccount) return false
            if (transactionType !== 'All Types' && row.transactionType !== transactionType) return false
            if (dateFilter && row.dateIso !== dateFilter) return false
            return true
        })
    }, [entries, dateFilter, cashAccount, transactionType])

    return (
        <div className='space-y-6' id='cash-book-print-area'>
            <SummaryCards cards={summary} />

            <TableCard
                title='Cash book register'
                filters={(
                    <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                        <input
                            type='date'
                            value={dateFilter}
                            onChange={(event) => setDateFilter(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'
                        />
                        <select
                            value={cashAccount}
                            onChange={(event) => setCashAccount(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[170px]'
                        >
                            {CASH_BOOK_ACCOUNTS.map((account) => (
                                <option key={account} value={account}>{account}</option>
                            ))}
                        </select>
                        <select
                            value={transactionType}
                            onChange={(event) => setTransactionType(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'
                        >
                            {CASH_BOOK_TRANSACTION_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                )}
                footer={(
                    <TablePagination
                        summary={`${filteredEntries.length} cash transactions${
                            filteredEntries.length !== entries.length ? ` (of ${entries.length} total)` : ''
                        }`}
                    />
                )}
            >
                <table className='w-full text-sm text-left mt-4 min-w-[900px]'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Date</th>
                            <th className={thClass}>Voucher</th>
                            <th className={thClass}>Description</th>
                            <th className={thClass}>Receipt</th>
                            <th className={thClass}>Payment</th>
                            <th className={`${thClass} rounded-e-lg`}>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntries.length === 0 ? (
                            <tr>
                                <td colSpan={6} className='px-2 py-8 text-center text-[#667085]'>
                                    No cash transactions match the selected filters.
                                </td>
                            </tr>
                        ) : (
                            filteredEntries.map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg whitespace-nowrap`}>{row.date}</td>
                                    <td className={`${tdClass} font-mono text-xs text-[#515DEF]`}>{row.voucher}</td>
                                    <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.description}</td>
                                    <td className={`${tdClass} text-[#4CAF50] font-medium`}>{row.receipt}</td>
                                    <td className={`${tdClass} text-[#FF5722] font-medium`}>{row.payment}</td>
                                    <td className={`${tdClass} rounded-e-lg font-semibold`}>{row.balance}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </TableCard>
        </div>
    )
}

export const buildCashBookSummary = (entries, openingBalance) => {
    const cashReceived = entries.reduce(
        (total, row) => total + (row.receipt !== '—' ? parseRupeeAmount(row.receipt) : 0),
        0,
    )
    const cashPaid = entries.reduce(
        (total, row) => total + (row.payment !== '—' ? parseRupeeAmount(row.payment) : 0),
        0,
    )
    const closingCash = openingBalance + cashReceived - cashPaid

    return [
        {
            label: 'Opening Cash',
            value: formatRupeeAmount(openingBalance),
            sub: 'cash in hand at start',
            iconTone: 'info',
        },
        {
            label: 'Cash Received',
            value: formatRupeeAmount(cashReceived),
            sub: `${entries.filter((row) => row.receipt !== '—').length} receipts`,
            subTone: 'success',
            iconTone: 'success',
        },
        {
            label: 'Cash Paid',
            value: formatRupeeAmount(cashPaid),
            sub: `${entries.filter((row) => row.payment !== '—').length} payments`,
            subTone: 'danger',
            iconTone: 'danger',
        },
        {
            label: 'Closing Cash',
            value: formatRupeeAmount(closingCash),
            sub: 'current cash position',
            iconTone: 'success',
        },
    ]
}

export default CashBookTab
