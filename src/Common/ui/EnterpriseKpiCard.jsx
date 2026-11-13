import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * EnterpriseKpiCard - Soft Pastel Blue Metric Card directly replicating the reference design.
 * Features:
 * - Soft pastel blue surface (#E8F1FD)
 * - Large rounded-2xl radius (1.25rem)
 * - Subtle border (#D0E3FA)
 * - High-contrast bold numeric values with subtle change indicator
 */
const EnterpriseKpiCard = ({
    title,
    value,
    change,
    isPositive,
    context,
    className = '',
}) => {
    const hasChange = change !== undefined && change !== null
    const positive = isPositive !== undefined
        ? isPositive
        : String(change || '').startsWith('+')

    return (
        <div
            className={`flex flex-col justify-between rounded-[1.25rem] border border-[#D0E3FA]/90 bg-[#E8F1FD] p-5 shadow-xs transition-all hover:shadow-md ${className}`}
        >
            <div>
                <p className='text-xs font-medium text-slate-600 tracking-wide'>
                    {title}
                </p>
                <div className='mt-2.5 flex items-baseline justify-between gap-3'>
                    <span className='text-2xl sm:text-3xl font-bold tracking-tight text-slate-900'>
                        {value}
                    </span>
                    {hasChange && (
                        <div className='flex items-center gap-1 text-xs font-semibold text-slate-700 shrink-0'>
                            <span>{change}</span>
                            {positive ? (
                                <TrendingUp size={13} className='text-slate-800' />
                            ) : (
                                <TrendingDown size={13} className='text-slate-800' />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {context && (
                <p className='mt-2 text-[11px] text-slate-500 line-clamp-1'>
                    {context}
                </p>
            )}
        </div>
    )
}

export default EnterpriseKpiCard

