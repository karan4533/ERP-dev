import React from 'react'
import {
    CreditCard,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react'

const ICON_TONES = {
    info: 'bg-[#515DEF1A] text-[#515DEF]',
    success: 'bg-[#4CAF501A] text-[#4CAF50]',
    warning: 'bg-[#FF98001A] text-[#FF9800]',
    danger: 'bg-[#FF57221A] text-[#FF5722]',
}

const SUMMARY_ICON_MAP = {
    'Total Held in Wallets': Wallet,
    'Active Wallets': Users,
    'Recharges Today': TrendingUp,
    'Spent Today': TrendingDown,
    'Total Wallets': Wallet,
    'Zero Balance': Wallet,
    'Frozen / Flagged': Wallet,
    'Avg. Wallet Balance': Wallet,
    'Total Recharged (This Month)': RefreshCw,
    'Avg. Recharge Amount': RefreshCw,
    'Failed Recharges': RefreshCw,
    'Auto-recharges Active': RefreshCw,
    'Total Spent (This Month)': TrendingDown,
    'Top Spend Category': CreditCard,
    'Avg. Spend / User': TrendingDown,
    'Disputed Transactions': TrendingDown,
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
            const Icon = SUMMARY_ICON_MAP[card.label] ?? Wallet
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

export const UserAvatar = ({ initials, name }) => (
    <div className='flex items-center gap-2'>
        <div className='size-6 rounded-full bg-[#515DEF1A] text-[#515DEF] text-[10px] font-semibold flex items-center justify-center shrink-0'>
            {initials}
        </div>
        <span className='text-[#1E1E1E]'>{name}</span>
    </div>
)

export const RoleChip = ({ role }) => (
    <span className='inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-[#EDEEF5] text-[#667085] font-medium'>
        {role}
    </span>
)

