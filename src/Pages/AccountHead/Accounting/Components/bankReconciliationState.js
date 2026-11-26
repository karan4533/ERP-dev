import { formatRupeeAmount, parseRupeeAmount } from '../accountingData.js'

const formatCompactRupee = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
    return formatRupeeAmount(amount)
}

const buildEntryFromSuggestion = (entry, suggestion) => ({
    ...entry,
    voucher: entry.voucher === '—' ? suggestion.erpVoucher : entry.voucher,
    erpAmount: entry.erpAmount === '—' ? suggestion.erpAmount : entry.erpAmount,
    bankAmount: entry.bankAmount === '—' ? suggestion.bankAmount : entry.bankAmount,
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
})

export const buildBankReconciliationSummary = (entries) => {
    const matchedCount = entries.filter((row) => row.status === 'Matched').length
    const unmatchedCount = entries.filter((row) => row.status === 'Unmatched').length
    const pendingCount = entries.filter((row) => row.status === 'Pending Reconciliation').length
    const differenceTotal = entries
        .filter((row) => row.status !== 'Matched')
        .reduce((total, row) => total + parseRupeeAmount(row.difference), 0)

    return [
        { label: 'Matched entries', value: String(matchedCount), sub: `${entries.length} total entries`, subTone: 'success', iconTone: 'success' },
        { label: 'Unmatched entries', value: String(unmatchedCount), sub: unmatchedCount > 0 ? 'needs review' : 'all matched', subTone: unmatchedCount > 0 ? 'warning' : undefined, iconTone: unmatchedCount > 0 ? 'warning' : 'info' },
        { label: 'Pending reconciliation', value: String(pendingCount), sub: pendingCount > 0 ? 'awaiting clearance' : 'none pending', subTone: pendingCount > 0 ? 'danger' : undefined, iconTone: pendingCount > 0 ? 'danger' : 'info' },
        { label: 'Difference amount', value: formatCompactRupee(differenceTotal), sub: differenceTotal > 0 ? 'unreconciled variance' : 'fully reconciled', subTone: differenceTotal > 0 ? 'danger' : 'success', iconTone: differenceTotal > 0 ? 'danger' : 'success' },
    ]
}

export const autoMatchReconciliation = (entries) => entries.map((entry) => {
    if (entry.status !== 'Unmatched') return entry
    const highConfidence = entry.detail.suggestions?.find(
        (suggestion) => suggestion.confidence === 'High'
            && parseRupeeAmount(suggestion.erpAmount) === parseRupeeAmount(suggestion.bankAmount),
    )
    return highConfidence ? buildEntryFromSuggestion(entry, highConfidence) : entry
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
        return { ...entry, difference: '₹0', status: 'Matched', detail: { ...entry.detail, suggestions: [] } }
    }
    return entry
})
