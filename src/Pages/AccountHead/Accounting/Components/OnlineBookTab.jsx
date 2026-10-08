import React, { useMemo, useState } from 'react'
import { Eye, Search } from 'lucide-react'
import {
    ONLINE_BOOK_DATE_RANGES,
    ONLINE_BOOK_GATEWAYS,
    ONLINE_BOOK_PAYMENT_METHODS,
    ONLINE_BOOK_STATUSES,
    SYNC_TRANSACTION_TEMPLATE,
    formatRupeeAmount,
    onlineBookStatusBadgeColor,
    onlineBookTransactionTypeBadgeColor,
    parseRupeeAmount,
} from '../accountingData'
import OnlineTransactionDetailsDrawer from './OnlineTransactionDetailsDrawer'
import { SummaryCards, TableCard, TablePagination, tdClass, thClass } from './AccountingShared'

const isWithinDateRange = (dateIso, range, customFrom, customTo) => {
    const entryDate = new Date(dateIso)
    const today = new Date('2026-06-26')

    if (range === 'Today') {
        return dateIso === '2026-06-26'
    }
    if (range === 'This Week') {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - 6)
        return entryDate >= weekStart && entryDate <= today
    }
    if (range === 'This Month') {
        return dateIso.startsWith('2026-06')
    }
    if (range === 'Custom Range') {
        if (customFrom && dateIso < customFrom) return false
        if (customTo && dateIso > customTo) return false
        return true
    }
    return true
}

const OnlineBookTab = ({ entries, summary, onSelectTransaction, selectedTransaction, onCloseDetails }) => {
    const [dateRange, setDateRange] = useState(ONLINE_BOOK_DATE_RANGES[0])
    const [customFrom, setCustomFrom] = useState('')
    const [customTo, setCustomTo] = useState('')
    const [gateway, setGateway] = useState(ONLINE_BOOK_GATEWAYS[0])
    const [paymentMethod, setPaymentMethod] = useState(ONLINE_BOOK_PAYMENT_METHODS[0])
    const [status, setStatus] = useState(ONLINE_BOOK_STATUSES[0])
    const [transactionSearch, setTransactionSearch] = useState('')

    const filteredEntries = useMemo(() => {
        return entries.filter((row) => {
            if (!isWithinDateRange(row.dateIso, dateRange, customFrom, customTo)) return false
            if (gateway !== 'All Gateways' && row.paymentGateway !== gateway) return false
            if (paymentMethod !== 'All Methods' && row.paymentMethod !== paymentMethod) return false
            if (status !== 'All Status' && row.status !== status) return false
            if (transactionSearch && !row.transactionId.toLowerCase().includes(transactionSearch.toLowerCase())) {
                return false
            }
            return true
        })
    }, [entries, dateRange, customFrom, customTo, gateway, paymentMethod, status, transactionSearch])

    return (
        <div className='space-y-6' id='online-book-print-area'>
            <SummaryCards cards={summary} />

            <TableCard
                title='Online transaction register'
                filters={(
                    <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                        <select
                            value={dateRange}
                            onChange={(event) => setDateRange(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'
                        >
                            {ONLINE_BOOK_DATE_RANGES.map((range) => (
                                <option key={range} value={range}>{range}</option>
                            ))}
                        </select>
                        {dateRange === 'Custom Range' && (
                            <>
                                <input
                                    type='date'
                                    value={customFrom}
                                    onChange={(event) => setCustomFrom(event.target.value)}
                                    className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'
                                />
                                <input
                                    type='date'
                                    value={customTo}
                                    onChange={(event) => setCustomTo(event.target.value)}
                                    className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'
                                />
                            </>
                        )}
                        <select
                            value={gateway}
                            onChange={(event) => setGateway(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'
                        >
                            {ONLINE_BOOK_GATEWAYS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <select
                            value={paymentMethod}
                            onChange={(event) => setPaymentMethod(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'
                        >
                            {ONLINE_BOOK_PAYMENT_METHODS.map((method) => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'
                        >
                            {ONLINE_BOOK_STATUSES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <div className='relative min-w-[160px]'>
                            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                            <input
                                type='text'
                                value={transactionSearch}
                                onChange={(event) => setTransactionSearch(event.target.value)}
                                placeholder='Transaction ID...'
                                className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                            />
                        </div>
                    </div>
                )}
                footer={(
                    <TablePagination
                        summary={`${filteredEntries.length} online transactions${
                            filteredEntries.length !== entries.length ? ` (of ${entries.length} total)` : ''
                        }`}
                    />
                )}
            >
                <table className='w-full text-sm text-left mt-4 min-w-[1100px]'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Date & Time</th>
                            <th className={thClass}>Transaction ID</th>
                            <th className={thClass}>Student / Vendor</th>
                            <th className={thClass}>Transaction Type</th>
                            <th className={thClass}>Payment Gateway</th>
                            <th className={thClass}>Payment Method</th>
                            <th className={thClass}>Amount</th>
                            <th className={thClass}>Bank Reference</th>
                            <th className={thClass}>Status</th>
                            <th className={`${thClass} rounded-e-lg`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntries.length === 0 ? (
                            <tr>
                                <td colSpan={10} className='px-2 py-8 text-center text-[#667085]'>
                                    No online transactions match the selected filters.
                                </td>
                            </tr>
                        ) : (
                            filteredEntries.map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg whitespace-nowrap`}>{row.dateTime}</td>
                                    <td className={`${tdClass} font-mono text-xs text-[#515DEF]`}>{row.transactionId}</td>
                                    <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.party}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${onlineBookTransactionTypeBadgeColor[row.transactionType]}`}>
                                            {row.transactionType}
                                        </span>
                                    </td>
                                    <td className={tdClass}>{row.paymentGateway}</td>
                                    <td className={tdClass}>{row.paymentMethod}</td>
                                    <td className={`${tdClass} font-semibold text-[#515DEF]`}>{row.amount}</td>
                                    <td className={`${tdClass} font-mono text-xs max-w-[180px] truncate`} title={row.bankReference}>
                                        {row.bankReference}
                                    </td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${onlineBookStatusBadgeColor[row.status]}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <button
                                            type='button'
                                            onClick={() => onSelectTransaction(row)}
                                            className='inline-flex items-center gap-1.5 text-xs font-medium text-[#515DEF] hover:opacity-80 cursor-pointer'
                                        >
                                            <Eye size={14} />
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </TableCard>

            <OnlineTransactionDetailsDrawer
                isOpen={Boolean(selectedTransaction)}
                onClose={onCloseDetails}
                transaction={selectedTransaction}
            />
        </div>
    )
}

export const buildOnlineBookSummary = (entries) => {
    const collections = entries
        .filter((row) => row.transactionType === 'Income' && row.status === 'Successful')
        .reduce((total, row) => total + parseRupeeAmount(row.amount), 0)

    const expenses = entries
        .filter((row) => row.transactionType === 'Expense' && row.status === 'Successful')
        .reduce((total, row) => total + parseRupeeAmount(row.amount), 0)

    const successfulCount = entries.filter((row) => row.status === 'Successful').length
    const failedCount = entries.filter((row) => row.status === 'Failed').length

    return [
        {
            label: 'Online Collections',
            value: formatRupeeAmount(collections),
            sub: `${entries.filter((row) => row.transactionType === 'Income').length} inbound transactions`,
            subTone: 'success',
            iconTone: 'success',
        },
        {
            label: 'Online Expenses',
            value: formatRupeeAmount(expenses),
            sub: `${entries.filter((row) => row.transactionType === 'Expense').length} outbound payments`,
            subTone: 'danger',
            iconTone: 'danger',
        },
        {
            label: 'Successful Transactions',
            value: String(successfulCount),
            sub: 'settled via gateway',
            subTone: 'success',
            iconTone: 'success',
        },
        {
            label: 'Failed Transactions',
            value: String(failedCount),
            sub: failedCount > 0 ? 'requires follow-up' : 'no failures',
            subTone: failedCount > 0 ? 'danger' : undefined,
            iconTone: failedCount > 0 ? 'danger' : 'info',
        },
    ]
}

export const syncOnlineTransaction = (entries) => {
    const template = {
        id: `OLT-${Date.now()}`,
        dateTime: SYNC_TRANSACTION_TEMPLATE.dateTime(),
        dateIso: SYNC_TRANSACTION_TEMPLATE.dateIso(),
        transactionId: SYNC_TRANSACTION_TEMPLATE.transactionId(),
        party: SYNC_TRANSACTION_TEMPLATE.party,
        transactionType: SYNC_TRANSACTION_TEMPLATE.transactionType,
        paymentGateway: SYNC_TRANSACTION_TEMPLATE.paymentGateway,
        paymentMethod: SYNC_TRANSACTION_TEMPLATE.paymentMethod,
        amount: SYNC_TRANSACTION_TEMPLATE.amount,
        bankReference: SYNC_TRANSACTION_TEMPLATE.bankReference,
        status: SYNC_TRANSACTION_TEMPLATE.status,
        detail: {
            ...SYNC_TRANSACTION_TEMPLATE.detail,
            referenceNumber: SYNC_TRANSACTION_TEMPLATE.detail.referenceNumber(),
        },
    }

    return [template, ...entries]
}

export default OnlineBookTab
