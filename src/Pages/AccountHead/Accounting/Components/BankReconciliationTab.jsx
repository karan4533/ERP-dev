import React, { useMemo, useState } from 'react'
import {
    formatRupeeAmount,
    parseRupeeAmount,
    reconciliationStatusBadgeColor,
    BANK_RECONCILIATION_BANKS,
} from '../accountingData'
import { SummaryCards, TableCard, TablePagination, tdClass, thClass } from './AccountingShared'
import ReconciliationDrawer from './ReconciliationDrawer'
import { useFinance } from '../../financeDomain/FinanceContext'
import { CHEQUE_STATUSES, chequeStatusBadgeColor } from '../../financeDomain/financeConstants'
import { formatCurrency } from '../../financeDomain/financeHelpers'

const STATUS_FILTERS = ['All Status', 'Matched', 'Unmatched', 'Pending Reconciliation']

const formatCompactRupee = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
    return formatRupeeAmount(amount)
}

const buildEntryFromSuggestion = (entry, suggestion) => {
    const erpAmount = entry.erpAmount === '—' ? suggestion.erpAmount : entry.erpAmount
    const bankAmount = entry.bankAmount === '—' ? suggestion.bankAmount : entry.bankAmount
    const voucher = entry.voucher === '—' ? suggestion.erpVoucher : entry.voucher

    return {
        ...entry,
        voucher,
        erpAmount,
        bankAmount,
        difference: '₹0',
        status: 'Matched',
        detail: {
            ...entry.detail,
            erpEntry: entry.detail.erpEntry ?? {
                date: entry.date,
                voucher: suggestion.erpVoucher,
                description: suggestion.erpDescription,
                amount: suggestion.erpAmount,
            },
            bankEntry: entry.detail.bankEntry ?? {
                date: entry.date,
                reference: suggestion.erpVoucher,
                description: suggestion.erpDescription,
                amount: suggestion.bankAmount,
            },
            suggestions: [],
        },
    }
}

export const buildBankReconciliationSummary = (entries) => {
    const matchedCount = entries.filter((row) => row.status === 'Matched').length
    const unmatchedCount = entries.filter((row) => row.status === 'Unmatched').length
    const pendingCount = entries.filter((row) => row.status === 'Pending Reconciliation').length
    const differenceTotal = entries
        .filter((row) => row.status !== 'Matched')
        .reduce((total, row) => total + parseRupeeAmount(row.difference), 0)

    return [
        {
            label: 'Matched Entries',
            value: String(matchedCount),
            sub: `${entries.length} total entries`,
            subTone: 'success',
            iconTone: 'success',
        },
        {
            label: 'Unmatched Entries',
            value: String(unmatchedCount),
            sub: unmatchedCount > 0 ? 'needs review' : 'all matched',
            subTone: unmatchedCount > 0 ? 'warning' : undefined,
            iconTone: unmatchedCount > 0 ? 'warning' : 'info',
        },
        {
            label: 'Pending Reconciliation',
            value: String(pendingCount),
            sub: pendingCount > 0 ? 'awaiting clearance' : 'none pending',
            subTone: pendingCount > 0 ? 'danger' : undefined,
            iconTone: pendingCount > 0 ? 'danger' : 'info',
        },
        {
            label: 'Difference Amount',
            value: formatCompactRupee(differenceTotal),
            sub: differenceTotal > 0 ? 'unreconciled variance' : 'fully reconciled',
            subTone: differenceTotal > 0 ? 'danger' : 'success',
            iconTone: differenceTotal > 0 ? 'danger' : 'success',
        },
    ]
}

export const importBankStatementEntry = (entries) => {
    const template = {
        id: `BRC-${Date.now()}`,
        date: '26 Jun',
        dateIso: '2026-06-26',
        voucher: '—',
        erpAmount: '—',
        bankAmount: '₹3,200',
        difference: '₹3,200',
        status: 'Unmatched',
        bank: 'SBI Current A/c',
        detail: {
            erpEntry: null,
            bankEntry: {
                date: '26 Jun 2026',
                reference: 'UPI/FEE/3200',
                description: 'UPI credit — late fee payment batch',
                amount: '₹3,200',
            },
            suggestions: [
                {
                    id: `sug-import-${Date.now()}`,
                    label: 'UPI Collections — 26 Jun (BB-2026-0045)',
                    confidence: 'High',
                    erpAmount: '₹3,200',
                    bankAmount: '₹3,200',
                    erpVoucher: 'BB-2026-0045',
                    erpDescription: 'UPI fee collection — imported statement',
                },
            ],
        },
    }

    return [template, ...entries]
}

export const autoMatchReconciliation = (entries) => entries.map((entry) => {
    if (entry.status !== 'Unmatched') return entry

    const highConfidence = entry.detail.suggestions?.find(
        (suggestion) => suggestion.confidence === 'High'
            && parseRupeeAmount(suggestion.erpAmount) === parseRupeeAmount(suggestion.bankAmount),
    )

    if (!highConfidence) return entry
    return buildEntryFromSuggestion(entry, highConfidence)
})

export const reconcileReconciliationEntry = (entries, entryId, suggestionId) => entries.map((entry) => {
    if (entry.id !== entryId || entry.status === 'Matched') return entry

    const suggestion = suggestionId
        ? entry.detail.suggestions?.find((item) => item.id === suggestionId)
        : entry.detail.suggestions?.[0]

    if (suggestion) return buildEntryFromSuggestion(entry, suggestion)

    const erpValue = parseRupeeAmount(entry.erpAmount)
    const bankValue = parseRupeeAmount(entry.bankAmount)
    if (erpValue > 0 && bankValue > 0) {
        return {
            ...entry,
            difference: '₹0',
            status: 'Matched',
            detail: { ...entry.detail, suggestions: [] },
        }
    }

    return entry
})

const BankReconciliationTab = ({
    entries,
    summary,
    selectedId,
    onSelect,
    drawerOpen,
    onCloseDrawer,
    onReconcile,
    selectedSuggestionId,
    onSelectSuggestion,
}) => {
    const [dateFilter, setDateFilter] = useState('')
    const [bankFilter, setBankFilter] = useState(BANK_RECONCILIATION_BANKS[0])
    const [statusFilter, setStatusFilter] = useState(STATUS_FILTERS[0])

    const selectedEntry = useMemo(
        () => entries.find((row) => row.id === selectedId) ?? null,
        [entries, selectedId],
    )

    const filteredEntries = useMemo(() => entries.filter((row) => {
        if (bankFilter !== 'All Banks' && row.bank !== bankFilter) return false
        if (statusFilter !== 'All Status' && row.status !== statusFilter) return false
        if (dateFilter && row.dateIso !== dateFilter) return false
        return true
    }), [entries, bankFilter, statusFilter, dateFilter])

    const { cheques, settleCheque } = useFinance()
    const pendingCount = entries.filter((row) => row.status !== 'Matched').length

    return (
        <div className='space-y-6' id='bank-reconciliation-print-area'>
            <SummaryCards cards={summary} />

            <TableCard
                title='Reconciliation register'
                filters={(
                    <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                        <input
                            type='date'
                            value={dateFilter}
                            onChange={(event) => setDateFilter(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'
                        />
                        <select
                            value={bankFilter}
                            onChange={(event) => setBankFilter(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[160px]'
                        >
                            {BANK_RECONCILIATION_BANKS.map((bank) => (
                                <option key={bank} value={bank}>{bank}</option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[180px]'
                        >
                            {STATUS_FILTERS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                )}
                footer={(
                    <TablePagination
                        summary={`${filteredEntries.length} reconciliation entries${
                            filteredEntries.length !== entries.length ? ` (of ${entries.length} total)` : ''
                        }${pendingCount > 0 ? ` · ${pendingCount} pending` : ''}`}
                    />
                )}
            >
                <table className='w-full text-sm text-left mt-4 min-w-[900px]'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg w-10`} />
                            <th className={thClass}>Date</th>
                            <th className={thClass}>Voucher</th>
                            <th className={thClass}>ERP Amount</th>
                            <th className={thClass}>Bank Amount</th>
                            <th className={thClass}>Difference</th>
                            <th className={`${thClass} rounded-e-lg`}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntries.length === 0 ? (
                            <tr>
                                <td colSpan={7} className='px-2 py-8 text-center text-[#667085]'>
                                    No reconciliation entries match the selected filters.
                                </td>
                            </tr>
                        ) : (
                            filteredEntries.map((row) => (
                                <tr
                                    key={row.id}
                                    onClick={() => onSelect(row.id)}
                                    className={`border-b border-[#f2f4f7] hover:bg-[#f2f4f7] cursor-pointer ${
                                        selectedId === row.id ? 'bg-[#515DEF0D]' : ''
                                    }`}
                                >
                                    <td className={`${tdClass} rounded-s-lg`}>
                                        <input
                                            type='radio'
                                            name='selected-reconciliation'
                                            checked={selectedId === row.id}
                                            onChange={() => onSelect(row.id)}
                                            className='accent-[#515DEF] cursor-pointer'
                                        />
                                    </td>
                                    <td className={`${tdClass} whitespace-nowrap`}>{row.date}</td>
                                    <td className={`${tdClass} font-mono text-xs text-[#515DEF]`}>{row.voucher}</td>
                                    <td className={tdClass}>{row.erpAmount}</td>
                                    <td className={tdClass}>{row.bankAmount}</td>
                                    <td className={`${tdClass} ${row.difference !== '₹0' ? 'text-[#FF5722] font-medium' : ''}`}>
                                        {row.difference}
                                    </td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${reconciliationStatusBadgeColor[row.status]}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </TableCard>

            <TableCard title='Cheque / PDC lifecycle'>
                <table className='w-full text-sm text-left mt-4 min-w-[720px]'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Cheque</th>
                            <th className={thClass}>Bank</th>
                            <th className={thClass}>Date</th>
                            <th className={thClass}>Amount</th>
                            <th className={thClass}>Status</th>
                            <th className={`${thClass} rounded-e-lg`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cheques.length === 0 ? (
                            <tr><td colSpan={6} className='px-2 py-6 text-center text-[#667085]'>No cheques in process.</td></tr>
                        ) : cheques.map((cheque) => (
                            <tr key={cheque.id} className='border-b border-[#f2f4f7]'>
                                <td className={`${tdClass} rounded-s-lg font-mono text-xs`}>{cheque.chequeNo}</td>
                                <td className={tdClass}>{cheque.bank}</td>
                                <td className={tdClass}>{cheque.chequeDate}</td>
                                <td className={tdClass}>{formatCurrency(cheque.amount)}</td>
                                <td className={tdClass}>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${chequeStatusBadgeColor[cheque.status]}`}>{cheque.status}</span>
                                </td>
                                <td className={`${tdClass} rounded-e-lg`}>
                                    <div className='flex flex-wrap gap-1'>
                                        {cheque.status !== CHEQUE_STATUSES.CLEARED && cheque.status !== CHEQUE_STATUSES.BOUNCED && (
                                            <button type='button' onClick={() => settleCheque(cheque.id, CHEQUE_STATUSES.CLEARED, 'Marked cleared in BRS')} className='text-xs border border-[#4CAF50] text-[#4CAF50] px-2 py-1 rounded cursor-pointer'>Mark Cleared</button>
                                        )}
                                        {cheque.status !== CHEQUE_STATUSES.BOUNCED && cheque.status !== CHEQUE_STATUSES.CLEARED && (
                                            <button type='button' onClick={() => settleCheque(cheque.id, CHEQUE_STATUSES.BOUNCED, 'Returned by bank')} className='text-xs border border-[#FF5722] text-[#FF5722] px-2 py-1 rounded cursor-pointer'>Mark Bounced</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableCard>

            <ReconciliationDrawer
                isOpen={drawerOpen}
                onClose={onCloseDrawer}
                entry={selectedEntry}
                onReconcile={onReconcile}
                selectedSuggestionId={selectedSuggestionId}
                onSelectSuggestion={onSelectSuggestion}
            />
        </div>
    )
}

export default BankReconciliationTab
