import React from 'react'
import {
    BarChart3,
    PieChart,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react'

export const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
export const tdClass = 'px-2 py-4 text-[#667085]'

export const ICON_TONES = {
    info: 'bg-[#515DEF1A] text-[#515DEF]',
    success: 'bg-[#4CAF501A] text-[#4CAF50]',
    warning: 'bg-[#FF98001A] text-[#FF9800]',
    danger: 'bg-[#FF57221A] text-[#FF5722]',
}

const SUMMARY_ICON_MAP = {
    'Total Income (YTD)': TrendingUp,
    'Total Expenditure (YTD)': TrendingDown,
    'Net Surplus': Wallet,
    'Fee Collection Efficiency': PieChart,
    '3-Month Avg. Surplus': Wallet,
    'Highest Spend Month': TrendingDown,
    'Collection Peak': TrendingUp,
    'Expense Volatility': BarChart3,
}

export const Panel = ({ title, action, children, className = '' }) => (
    <div className={`bg-white rounded-2xl shadow-md p-4 h-full ${className}`}>
        <div className='flex justify-between items-center mb-4 gap-3'>
            <h3 className='text-base font-semibold text-[#1E1E1E]'>{title}</h3>
            {action}
        </div>
        {children}
    </div>
)

export const SummaryCards = ({ cards }) => (
    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
        {cards.map((card) => {
            const Icon = SUMMARY_ICON_MAP[card.label] ?? BarChart3
            return (
                <div key={card.label} className='bg-white rounded-2xl shadow-md p-4'>
                    <div className='flex items-start justify-between gap-2 mb-3'>
                        <div className={`p-2 rounded-xl ${ICON_TONES[card.iconTone]}`}>
                            <Icon size={18} />
                        </div>
                    </div>
                    <p className='text-xs text-[#808080]'>{card.label}</p>
                    <p className='text-xl font-semibold text-[#1E1E1E] mt-1'>{card.value}</p>
                    {card.sub && (
                        <p className={`text-xs mt-1 ${
                            card.subTone === 'success'
                                ? 'text-[#4CAF50] font-medium'
                                : card.subTone === 'danger'
                                    ? 'text-[#FF5722] font-medium'
                                    : 'text-[#667085]'
                        }`}>
                            {card.sub}
                        </p>
                    )}
                </div>
            )
        })}
    </div>
)

export const FlowBars = ({ items }) => (
    <div className='space-y-4'>
        {items.map((item) => (
            <div key={item.label}>
                <div className='flex items-center justify-between text-sm mb-1.5'>
                    <span className='text-[#667085]'>{item.label}</span>
                    <span className='font-semibold text-[#1E1E1E]'>{item.amount}</span>
                </div>
                <div className='h-2 rounded-full bg-[#EDEEF5] overflow-hidden'>
                    <div
                        className={`h-full rounded-full ${item.tone === 'in' ? 'bg-[#4CAF50]' : 'bg-[#FF5722]'}`}
                        style={{ width: `${item.value}%` }}
                    />
                </div>
            </div>
        ))}
    </div>
)

export const ReportTile = ({ title, sub, icon: Icon }) => (
    <button
        type='button'
        className='text-left border border-[#F2F4F7] rounded-xl p-4 hover:bg-[#F2F4F7] transition-colors cursor-pointer h-full'
    >
        <Icon size={20} className='text-[#515DEF] mb-2' />
        <p className='text-sm font-semibold text-[#1E1E1E]'>{title}</p>
        <p className='text-xs text-[#667085] mt-1'>{sub}</p>
    </button>
)

export const TableCard = ({ title, filters, children }) => (
    <div className='bg-white rounded-2xl shadow-md overflow-hidden'>
        <div className='flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 p-4 border-b border-[#F2F4F7]'>
            <h3 className='text-base font-semibold text-[#1E1E1E]'>{title}</h3>
            {filters}
        </div>
        <div className='relative overflow-x-auto p-4 pt-0'>{children}</div>
    </div>
)
