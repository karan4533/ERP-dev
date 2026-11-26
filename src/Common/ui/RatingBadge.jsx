import React from 'react'

/**
 * Three-point performance tier badge supporting QMIS MD directives:
 * - Above Average (Tier 1)
 * - Average (Tier 2)
 * - Below Average (Tier 3)
 */
export default function RatingBadge({ score, tier, showDots = true, className = '' }) {
    let resolvedTier = tier
    if (!resolvedTier && typeof score === 'number') {
        if (score >= 90) resolvedTier = 'Above Average'
        else if (score >= 80) resolvedTier = 'Average'
        else resolvedTier = 'Below Average'
    }

    const configs = {
        'Above Average': {
            label: 'Above Average',
            bg: 'bg-[#EAF7EF] text-[#176B3A] border-[#B7E4C7]',
            dots: 3,
            dotColor: 'bg-[#176B3A]',
        },
        'Average': {
            label: 'Average',
            bg: 'bg-[#EEF2FF] text-[#2441A8] border-[#C7D2FE]',
            dots: 2,
            dotColor: 'bg-[#2441A8]',
        },
        'Below Average': {
            label: 'Below Average',
            bg: 'bg-[#FFF4D6] text-[#7A3E00] border-[#F4D38A]',
            dots: 1,
            dotColor: 'bg-[#7A3E00]',
        },
    }

    const config = configs[resolvedTier] || configs['Average']

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${className}`}
            title={`Performance Tier: ${config.label}${score !== undefined ? ` (${score}%)` : ''}`}
        >
            {showDots && (
                <span className='flex items-center gap-0.5' aria-hidden='true'>
                    {[1, 2, 3].map((step) => (
                        <span
                            key={step}
                            className={`size-1.5 rounded-full ${step <= config.dots ? config.dotColor : 'bg-black/15'}`}
                        />
                    ))}
                </span>
            )}
            <span>{config.label}</span>
        </span>
    )
}

