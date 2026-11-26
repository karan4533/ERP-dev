import { formatRupeeAmount, parseRupeeAmount } from '../accountingData.js'

export const appendJournalVoucher = (vouchers, voucher) => [
    { ...voucher, id: `JV-${Date.now()}` },
    ...vouchers,
]

export const postJournalVouchers = (vouchers, selectedId) => {
    if (!selectedId) return vouchers

    const selected = vouchers.find((row) => row.id === selectedId)
    if (!selected || selected.status === 'Posted') return vouchers

    return vouchers.map((row) => row.id === selectedId ? { ...row, status: 'Posted' } : row)
}

const formatCompactRupee = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
    return formatRupeeAmount(amount)
}

export const buildJournalVoucherSummary = (vouchers) => {
    const draftCount = vouchers.filter((row) => row.status === 'Draft').length
    const postedCount = vouchers.filter((row) => row.status === 'Posted').length
    const pendingCount = vouchers.filter((row) => row.status === 'Pending Approval').length
    const totalAdjustments = vouchers.reduce((total, row) => total + parseRupeeAmount(row.amount), 0)

    return [
        { label: 'Draft vouchers', value: String(draftCount), sub: draftCount > 0 ? 'awaiting posting' : 'none pending', subTone: draftCount > 0 ? 'warning' : undefined, iconTone: draftCount > 0 ? 'warning' : 'info' },
        { label: 'Posted vouchers', value: String(postedCount), sub: 'posted to ledger', subTone: 'success', iconTone: 'success' },
        { label: 'Pending approval', value: String(pendingCount), sub: pendingCount > 0 ? 'needs sign-off' : 'all clear', subTone: pendingCount > 0 ? 'danger' : undefined, iconTone: pendingCount > 0 ? 'danger' : 'info' },
        { label: 'Total adjustments', value: formatCompactRupee(totalAdjustments), sub: `${vouchers.length} vouchers total`, iconTone: 'info' },
    ]
}
