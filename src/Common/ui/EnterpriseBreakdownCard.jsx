import React from 'react'

/**
 * EnterpriseBreakdownCard - Categorical distribution card with dash progress indicators.
 * Matches the reference layout's "Traffic by Website" / "Department Breakdown" widget.
 */
const EnterpriseBreakdownCard = ({
    title = 'Traffic by Website',
    items = [
        { label: 'Google', level: 3, value: '62%' },
        { label: 'YouTube', level: 2, value: '45%' },
        { label: 'Instagram', level: 2, value: '38%' },
        { label: 'Pinterest', level: 1, value: '24%' },
        { label: 'Facebook', level: 1, value: '18%' },
        { label: 'Twitter', level: 1, value: '12%' },
    ],
    className = '',
}) => {
    return (
        <div className={`flex flex-col justify-between rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs ${className}`}>
            <h3 className='text-sm font-semibold tracking-tight text-slate-900 mb-4'>
                {title}
            </h3>

            <div className='space-y-4'>
                {items.map((item) => (
                    <div key={item.label} className='flex items-center justify-between gap-3 text-xs'>
                        <span className='font-medium text-slate-700 truncate max-w-[130px]'>
                            {item.label}
                        </span>

                        <div className='flex items-center gap-1 shrink-0'>
                            {/* 3 Dash Indicators matching the reference image */}
                            <span
                                className={`h-1 w-4 rounded-full ${
                                    item.level >= 1 ? 'bg-slate-900' : 'bg-slate-200'
                                }`}
                            />
                            <span
                                className={`h-1 w-4 rounded-full ${
                                    item.level >= 2 ? 'bg-slate-900' : 'bg-slate-200'
                                }`}
                            />
                            <span
                                className={`h-1 w-4 rounded-full ${
                                    item.level >= 3 ? 'bg-slate-900' : 'bg-slate-200'
                                }`}
                            />
                            {item.value && (
                                <span className='ml-2 text-[11px] font-semibold text-slate-500 w-8 text-right'>
                                    {item.value}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default EnterpriseBreakdownCard

