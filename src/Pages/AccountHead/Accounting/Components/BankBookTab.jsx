import React, { useMemo, useState } from 'react'
import {
    BANK_BOOK_ACCOUNTS,
    BANK_BOOK_BANKS,
    formatRupeeAmount,
    parseRupeeAmount,
} from '../accountingData'
import { SummaryCards, TableCard, TablePagination, tdClass, thClass } from './AccountingShared'

const BankBookTab = ({ entries, summary }) => {
    const [bankFilter, setBankFilter] = useState(BANK_BOOK_BANKS[0])
    const [dateFilter, setDateFilter] = useState('')
    const [accountFilter, setAccountFilter] = useState(BANK_BOOK_ACCOUNTS[0])

    const filteredEntries = useMemo(() => {
        return entries.filter((row) => {
            if (bankFilter !== 'All Banks' && row.bank !== bankFilter) return false
            if (accountFilter !== 'All Accounts' && row.account !== accountFilter) return false
            if (dateFilter && row.dateIso !== dateFilter) return false
            return true
        })
    }, [entries, bankFilter, dateFilter, accountFilter])

    return (
        <div className='space-y-6' id='bank-book-print-area'>
            <SummaryCards cards={summary} />

            <TableCard
                title='Bank book register'
                filters={(
                    <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                        <select
                            value={bankFilter}
                            onChange={(event) => setBankFilter(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[160px]'
                        >
                            {BANK_BOOK_BANKS.map((bank) => (
                                <option key={bank} value={bank}>{bank}</option>
                            ))}
                        </select>
                        <input
                            type='date'
                            value={dateFilter}
                            onChange={(event) => setDateFilter(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'
                        />
                        <select
                            value={accountFilter}
                            onChange={(event) => setAccountFilter(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[170px]'
                        >
                            {BANK_BOOK_ACCOUNTS.map((account) => (
                                <option key={account} value={account}>{account}</option>
                            ))}
                        </select>
                    </div>
                )}
                footer={(
                    <TablePagination
                        summary={`${filteredEntries.length} bank transactions${
                            filteredEntries.length !== entries.length ? ` (of ${entries.length} total)` : ''
                        }`}
                    />
                )}
            >
                <table className='w-full text-sm text-left mt-4 min-w-[1100px]'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Sl No.</th>
                            <th className={thClass}>Date</th>
                            <th className={thClass}>Voucher No.</th>
                            <th className={thClass}>Voucher Type</th>
                            <th className={thClass}>Debit</th>
                            <th className={thClass}>Credit</th>
                            <th className={thClass}>Description</th>
                            <th className={thClass}>Cheque No.</th>
                            <th className={thClass}>Dr.</th>
                            <th className={thClass}>Cr.</th>
                            <th className={`${thClass} rounded-e-lg`}>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntries.length === 0 ? (
                            <tr>
                                <td colSpan={11} className='px-2 py-8 text-center text-[#667085]'>
                                    No bank transactions match the selected filters.
                                </td>
                            </tr>
                        ) : (
                            filteredEntries.map((row, index) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg`}>{index + 1}</td>
                                    <td className={`${tdClass} whitespace-nowrap`}>{row.date}</td>
                                    <td className={`${tdClass} font-mono text-xs text-[#515DEF]`}>{row.voucher}</td>
                                    <td className={tdClass}>{row.voucherType || 'Receipt'}</td>
                                    <td className={`${tdClass} text-[#4CAF50] font-medium`}>{row.deposit}</td>
                                    <td className={`${tdClass} text-[#FF5722] font-medium`}>{row.withdrawal}</td>
                                    <td className={tdClass}>{row.description || row.account}</td>
                                    <td className={tdClass}>{row.chequeNo || '—'}</td>
                                    <td className={tdClass}>{row.deposit}</td>
                                    <td className={tdClass}>{row.withdrawal}</td>
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

const formatCompactRupee = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
    return formatRupeeAmount(amount)
}

export const buildBankBookSummary = (entries, openingBalance) => {
    const totalDeposits = entries.reduce(
        (total, row) => total + (row.deposit !== '—' ? parseRupeeAmount(row.deposit) : 0),
        0,
    )
    const totalWithdrawals = entries.reduce(
        (total, row) => total + (row.withdrawal !== '—' ? parseRupeeAmount(row.withdrawal) : 0),
        0,
    )
    const closingBalance = openingBalance + totalDeposits - totalWithdrawals

    return [
        {
            label: 'Opening Bank Balance',
            value: formatCompactRupee(openingBalance),
            sub: 'all bank accounts',
            iconTone: 'info',
        },
        {
            label: 'Total Deposits',
            value: formatCompactRupee(totalDeposits),
            sub: `${entries.filter((row) => row.deposit !== '—').length} credits`,
            subTone: 'success',
            iconTone: 'success',
        },
        {
            label: 'Total Withdrawals',
            value: formatCompactRupee(totalWithdrawals),
            sub: `${entries.filter((row) => row.withdrawal !== '—').length} debits`,
            subTone: 'danger',
            iconTone: 'danger',
        },
        {
            label: 'Closing Balance',
            value: formatCompactRupee(closingBalance),
            sub: 'as per bank book',
            iconTone: 'info',
        },
    ]
}

export default BankBookTab
