export const REVIEW_PERIODS = ['H1 2026', 'H2 2025', 'H1 2025', 'Annual 2025']

export const performanceRatingBadgeColor = (rating) => {
    if (rating >= 4.5) return 'bg-[#4CAF5033] text-[#4CAF50]'
    if (rating >= 3.5) return 'bg-[#2196F333] text-[#2196F3]'
    if (rating >= 2.5) return 'bg-[#FF980033] text-[#FF9800]'
    return 'bg-[#FF572233] text-[#FF5722]'
}

/** Cleared of Delhi demo staff; add reviews against Queen Mira EMP-QMIS-* IDs as needed. */
export const PERFORMANCE_REVIEWS = []
