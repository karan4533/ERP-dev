/** Parse a fee string like "₹25,000" or "25000" into a number. */
export function parseFeeAmount(value) {
    const cleaned = String(value ?? '').replace(/[^\d.]/g, '')
    if (!cleaned) return null
    const amount = Number(cleaned)
    return Number.isFinite(amount) ? amount : null
}

/** Format amount, keeping ₹ + Indian grouping when the source used ₹. */
export function formatFeeAmount(amount, sampleValue = '') {
    const rounded = Math.round(amount)
    const withCommas = rounded.toLocaleString('en-IN')
    return String(sampleValue).includes('₹') ? `₹${withCommas}` : String(rounded)
}

/**
 * From yearly fee, derive half-yearly (/2), quarterly (/4), monthly (/12).
 * Clears derived fields when yearly is empty/invalid.
 */
export function deriveFeesFromYearly(yearlyValue) {
    const amount = parseFeeAmount(yearlyValue)
    if (amount == null) {
        return {
            halfYearlyFees: '',
            quarterlyFees: '',
            monthlyFees: '',
        }
    }
    return {
        halfYearlyFees: formatFeeAmount(amount / 2, yearlyValue),
        quarterlyFees: formatFeeAmount(amount / 4, yearlyValue),
        monthlyFees: formatFeeAmount(amount / 12, yearlyValue),
    }
}
