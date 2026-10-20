/** Installments / receipts that belong under Transport Payment (not Academic Payment). */
export function isTransportFeeInstallment(row) {
    if (!row) return false
    const category = String(row.feeCategoryId || row.categoryId || '').toUpperCase()
    if (category.includes('TRANSPORT')) return true
    const text = [
        row.feeHead,
        row.installmentLabel,
        row.source,
        row.routeName,
        row.routeId,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
    return text.includes('transport')
}

export function filterInstallmentsByScope(installments, feeScope = 'academic') {
    const rows = Array.isArray(installments) ? installments : []
    if (feeScope === 'transport') return rows.filter(isTransportFeeInstallment)
    if (feeScope === 'academic') return rows.filter((row) => !isTransportFeeInstallment(row))
    return rows
}

export function filterReceiptsByScope(receipts, feeScope = 'academic') {
    const rows = Array.isArray(receipts) ? receipts : []
    if (feeScope === 'all') return rows
    return rows.filter((receipt) => {
        const heads = [
            receipt.feeHead,
            receipt.narration,
            ...(receipt.feeHeads || []).map((item) => item?.feeHead || item?.label || item),
            ...(receipt.allocations || []).map((item) => item?.feeHead || item?.installmentLabel),
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
        const isTransport = heads.includes('transport')
            || String(receipt.sourceModule || '').toUpperCase() === 'TRANSPORT'
        return feeScope === 'transport' ? isTransport : !isTransport
    })
}
