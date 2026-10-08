import React, { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { toast } from 'react-toastify'
import {
    DAY_BOOK_CHANNELS,
    DAY_BOOK_DEPARTMENTS,
    DAY_BOOK_PAYMENT_METHODS,
    DAY_BOOK_STATUS_FILTERS,
    DAY_BOOK_TRANSACTION_TYPES,
    dayBookStatusBadgeColor,
    dayBookTransactionTypeBadgeColor,
    formatRupeeAmount,
    parseRupeeAmount,
} from '../accountingData'
import { SummaryCards, TableCard, TablePagination, tdClass, thClass } from './AccountingShared'

const toEntryIso = (row) => {
    if (row.dateIso) return row.dateIso
    const parsed = new Date(row.date)
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
}

const isCashRow = (row) => {
    if (row.paymentMethod === 'Cash' || row.paymentMethod === 'Petty Cash') return true
    if (row.cash && row.cash !== '—') return true
    return false
}

const EditNarrationModal = ({ row, onClose, onSave }) => {
    const [narration, setNarration] = useState(row.narration || row.description || '')
    const [reason, setReason] = useState('')
    const posted = String(row.status || '').toLowerCase().includes('post')

    const submit = (event) => {
        event.preventDefault()
        if (!narration.trim()) {
            toast.error('Narration is required.')
            return
        }
        if (posted && !reason.trim()) {
            toast.error('Reason is required to edit narration after posting.')
            return
        }
        const result = onSave({
            transactionId: row.sourceTransactionId,
            narration: narration.trim(),
            reason: reason.trim(),
        })
        if (result?.success === false) {
            toast.error(result.message || 'Could not update narration.')
            return
        }
        toast.success('Narration updated.')
        onClose()
    }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
            <form onSubmit={submit} className='bg-white rounded-2xl shadow-lg w-full max-w-md p-5 space-y-4'>
                <div className='flex items-start justify-between gap-3'>
                    <div>
                        <h3 className='text-base font-semibold text-[#1E1E1E]'>Edit narration</h3>
                        <p className='text-xs text-[#667085] mt-1'>{row.voucherNo} · {row.referenceNo || '—'}</p>
                    </div>
                    <button type='button' onClick={onClose} className='p-1 rounded hover:bg-[#F2F4F7] cursor-pointer' aria-label='Close'>
                        <X size={16} />
                    </button>
                </div>
                <label className='block text-sm'>
                    <span className='text-[#808080]'>Narration</span>
                    <textarea
                        rows={3}
                        value={narration}
                        onChange={(event) => setNarration(event.target.value)}
                        className='mt-1 w-full text-sm border border-[#D9D9D9] rounded-md px-3 py-2'
                    />
                </label>
                {posted && (
                    <label className='block text-sm'>
                        <span className='text-[#808080]'>Reason (required after posting)</span>
                        <input
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            className='mt-1 w-full text-sm border border-[#D9D9D9] rounded-md px-3 py-2'
                        />
                    </label>
                )}
                <div className='flex justify-end gap-2'>
                    <button type='button' onClick={onClose} className='text-sm px-4 py-2 rounded-md border border-[#D9D9D9] cursor-pointer'>Cancel</button>
                    <button type='submit' className='text-sm px-4 py-2 rounded-md bg-[#515DEF] text-white cursor-pointer'>Save</button>
                </div>
            </form>
        </div>
    )
}

const DayBookTab = ({ entries, summary, onEditNarration }) => {
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [paymentMethod, setPaymentMethod] = useState(DAY_BOOK_PAYMENT_METHODS[0])
    const [transactionType, setTransactionType] = useState(DAY_BOOK_TRANSACTION_TYPES[0])
    const [channel, setChannel] = useState(DAY_BOOK_CHANNELS[0])
    const [department, setDepartment] = useState(DAY_BOOK_DEPARTMENTS[0])
    const [statusFilter, setStatusFilter] = useState(DAY_BOOK_STATUS_FILTERS[0])
    const [voucherSearch, setVoucherSearch] = useState('')
    const [editingRow, setEditingRow] = useState(null)

    const filteredEntries = useMemo(() => {
        return entries.filter((row) => {
            if (paymentMethod !== 'All Methods' && row.paymentMethod !== paymentMethod) return false
            if (transactionType !== 'All Types' && row.transactionType !== transactionType) return false
            if (department !== 'All Departments' && row.department !== department) return false
            if (statusFilter !== 'All Status' && row.status !== statusFilter) return false
            if (channel === 'Cash' && !isCashRow(row)) return false
            if (channel === 'Bank' && isCashRow(row)) return false
            if (voucherSearch && !String(row.voucherNo || '').toLowerCase().includes(voucherSearch.toLowerCase())) return false
            const iso = toEntryIso(row)
            if (dateFrom && iso && iso < dateFrom) return false
            if (dateTo && iso && iso > dateTo) return false
            return true
        })
    }, [entries, dateFrom, dateTo, paymentMethod, transactionType, channel, department, statusFilter, voucherSearch])

    return (
        <div className='space-y-6' id='day-book-print-area'>
            <SummaryCards cards={summary} />

            <TableCard
                title='Day book register'
                filters={(
                    <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                        <input
                            type='date'
                            value={dateFrom}
                            onChange={(event) => setDateFrom(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'
                            aria-label='From date'
                        />
                        <input
                            type='date'
                            value={dateTo}
                            onChange={(event) => setDateTo(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'
                            aria-label='To date'
                        />
                        <select
                            value={channel}
                            onChange={(event) => setChannel(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'
                        >
                            {DAY_BOOK_CHANNELS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <select
                            value={paymentMethod}
                            onChange={(event) => setPaymentMethod(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'
                        >
                            {DAY_BOOK_PAYMENT_METHODS.map((method) => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                        <select
                            value={transactionType}
                            onChange={(event) => setTransactionType(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'
                        >
                            {DAY_BOOK_TRANSACTION_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <select
                            value={department}
                            onChange={(event) => setDepartment(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[150px]'
                        >
                            {DAY_BOOK_DEPARTMENTS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[150px]'
                        >
                            {DAY_BOOK_STATUS_FILTERS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <div className='relative min-w-[160px]'>
                            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                            <input
                                type='text'
                                value={voucherSearch}
                                onChange={(event) => setVoucherSearch(event.target.value)}
                                placeholder='Voucher number...'
                                className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                            />
                        </div>
                    </div>
                )}
                footer={(
                    <TablePagination
                        summary={`${filteredEntries.length} entries${
                            filteredEntries.length !== entries.length ? ` (of ${entries.length} total)` : ''
                        }`}
                    />
                )}
            >
                <table className='w-full text-sm text-left mt-4 min-w-[1200px]'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Date</th>
                            <th className={thClass}>Voucher No.</th>
                            <th className={thClass}>Voucher Type</th>
                            <th className={thClass}>Category</th>
                            <th className={thClass}>Narration</th>
                            <th className={thClass}>Cash</th>
                            <th className={thClass}>Bank</th>
                            <th className={thClass}>Debit</th>
                            <th className={thClass}>Credit</th>
                            <th className={thClass}>Reference</th>
                            <th className={thClass}>Status</th>
                            <th className={`${thClass} rounded-e-lg`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntries.length === 0 ? (
                            <tr>
                                <td colSpan={12} className='px-2 py-8 text-center text-[#667085]'>
                                    No day-book entries match the selected filters.
                                </td>
                            </tr>
                        ) : (
                            filteredEntries.map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg whitespace-nowrap`}>{row.date}</td>
                                    <td className={`${tdClass} font-mono text-xs text-[#515DEF]`}>{row.voucherNo}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${dayBookTransactionTypeBadgeColor[row.transactionType]}`}>
                                            {row.voucherType || row.transactionType}
                                        </span>
                                    </td>
                                    <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.category || row.ledgerHead}</td>
                                    <td className={tdClass}>{row.narration || row.description}</td>
                                    <td className={tdClass}>{row.cash || (row.paymentMethod === 'Cash' ? row.debit : '—')}</td>
                                    <td className={tdClass}>{row.bank || (row.paymentMethod !== 'Cash' ? row.debit : '—')}</td>
                                    <td className={`${tdClass} text-[#4CAF50] font-medium`}>{row.debit}</td>
                                    <td className={`${tdClass} text-[#FF5722] font-medium`}>{row.credit}</td>
                                    <td className={`${tdClass} font-mono text-xs`}>{row.referenceNo || '—'}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${dayBookStatusBadgeColor[row.status] || ''}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        {row.sourceTransactionId && onEditNarration ? (
                                            <button
                                                type='button'
                                                onClick={() => setEditingRow(row)}
                                                className='text-xs font-medium text-[#515DEF] cursor-pointer'
                                            >
                                                Edit narration
                                            </button>
                                        ) : (
                                            <span className='text-xs text-[#98A2B3]'>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </TableCard>

            {editingRow && (
                <EditNarrationModal
                    row={editingRow}
                    onClose={() => setEditingRow(null)}
                    onSave={onEditNarration}
                />
            )}
        </div>
    )
}

export const buildDayBookSummary = (entries, openingBalance) => {
    const cashCollection = entries.reduce((total, row) => {
        if (row.transactionType === 'Income') {
            return total + parseRupeeAmount(row.debit)
        }
        return total
    }, 0)

    const cashExpenses = entries.reduce((total, row) => {
        if (row.transactionType === 'Expense') {
            return total + parseRupeeAmount(row.credit)
        }
        return total
    }, 0)

    const netChange = cashCollection - cashExpenses
    const closingBalance = openingBalance + netChange

    return [
        {
            label: "Today's Cash Collection",
            value: formatRupeeAmount(cashCollection),
            sub: `${entries.filter((row) => row.transactionType === 'Income').length} receipts`,
            subTone: 'success',
            iconTone: 'success',
        },
        {
            label: "Today's Cash Expenses",
            value: formatRupeeAmount(cashExpenses),
            sub: `${entries.filter((row) => row.transactionType === 'Expense').length} payouts`,
            subTone: 'danger',
            iconTone: 'danger',
        },
        {
            label: 'Total Offline Transactions',
            value: String(entries.length),
            sub: 'day book entries',
            iconTone: 'info',
        },
        {
            label: 'Opening & Closing Cash Balance',
            value: formatRupeeAmount(closingBalance),
            sub: `opening ${formatRupeeAmount(openingBalance)} → closing ${formatRupeeAmount(closingBalance)}`,
            iconTone: 'info',
        },
    ]
}

export const appendDayBookEntry = (entries, openingBalance, entry) => {
    const lastBalance = entries.length > 0
        ? parseRupeeAmount(entries[0].balance)
        : openingBalance

    const amount = parseRupeeAmount(entry.debit !== '—' ? entry.debit : entry.credit)
    const nextBalance = entry.transactionType === 'Income'
        ? lastBalance + amount
        : lastBalance - amount

    const newEntry = {
        ...entry,
        id: `DB-${Date.now()}`,
        balance: formatRupeeAmount(nextBalance),
    }

    return [newEntry, ...entries]
}

export default DayBookTab
