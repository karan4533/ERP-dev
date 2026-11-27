import React from 'react'
import {
    AlertTriangle,
    Bus,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Fuel,
    MapPinned,
    ShieldCheck,
    Users,
    Wallet,
    Wrench,
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
    'Total Vehicles': Bus,
    'Active on Routes': MapPinned,
    'Under Service': Wrench,
    'Service Due (30 days)': ClipboardCheck,
    'Maintenance Spend (YTD)': Wallet,
    'Damage Cases Open': AlertTriangle,
    'Avg. Service Cost': Wrench,
    'Scheduled This Month': ClipboardCheck,
    'Active Routes': MapPinned,
    'Trips Today': Bus,
    'Students Using Transport': Users,
    'Avg. Trip Distance': MapPinned,
    'Documents Tracked': ShieldCheck,
    'Expiring in 30 Days': AlertTriangle,
    Expired: AlertTriangle,
    'Compliance Score': ShieldCheck,
    'Open Complaints': AlertTriangle,
    'Resolved This Month': ClipboardCheck,
    'Escalated to Admin': AlertTriangle,
    'Avg. Resolution Time': ClipboardCheck,
    'Fuel Spend (This Month)': Fuel,
    'Pending Claims': Wallet,
    'Approved This Month': Wallet,
    'Avg. Mileage': Fuel,
    'Total Transport Payroll': Wallet,
    'Disbursed (This Month)': Wallet,
    Drivers: Users,
    'Transport Managers': Users,
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
            const Icon = SUMMARY_ICON_MAP[card.label] ?? Bus
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

export const StaffAvatar = ({ initials, name }) => (
    <div className='flex items-center gap-2'>
        {initials ? (
            <div className='size-6 rounded-full bg-[#515DEF1A] text-[#515DEF] text-[10px] font-semibold flex items-center justify-center shrink-0'>
                {initials}
            </div>
        ) : null}
        <span className='text-[#1E1E1E]'>{name}</span>
    </div>
)

export const TablePagination = ({ summary, pages = [1, 2, 3], activePage = 1 }) => (
    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-2'>
        <p className='text-sm text-[#667085]'>{summary}</p>
        <div className='flex items-center gap-2'>
            <button type='button' className='size-8 flex items-center justify-center rounded-md border border-[#E2E8F0] text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                <ChevronLeft size={16} />
            </button>
            {pages.map((page) => (
                <button
                    key={page}
                    type='button'
                    className={`size-8 flex items-center justify-center rounded-md text-sm font-medium cursor-pointer transition-colors ${
                        page === activePage
                            ? 'bg-[#515DEF] text-white'
                            : 'border border-[#E2E8F0] text-[#515DEF] hover:bg-[#515DEF] hover:text-white'
                    }`}
                >
                    {page}
                </button>
            ))}
            <button type='button' className='size-8 flex items-center justify-center rounded-md border border-[#E2E8F0] text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                <ChevronRight size={16} />
            </button>
        </div>
    </div>
)

export const TableCard = ({ title, filters, children, footer }) => (
    <div className='bg-white rounded-2xl shadow-md overflow-hidden'>
        <div className='flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 p-4 border-b border-[#F2F4F7]'>
            <h3 className='text-base font-semibold text-[#1E1E1E]'>{title}</h3>
            {filters}
        </div>
        <div className='relative overflow-x-auto p-4 pt-0'>{children}</div>
        {footer && <div className='px-4 pb-4'>{footer}</div>}
    </div>
)
