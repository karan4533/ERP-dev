import React from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { CheckCircle2, ClipboardCheck, BookOpen, Receipt } from 'lucide-react'
import Approvals from '../../AccountHead/Approvals/Approvals'
import Accounting from '../../AccountHead/Accounting/Accounting'
import PaymentVouchers from '../../AccountHead/PaymentVouchers/PaymentVouchers'

export default function AdminExpensesWorkspace({ view = 'approvals' }) {
    const { section } = useParams()

    const navTabs = [
        {
            label: 'Expense & Salary Approvals',
            to: '/admin/expenses/approvals',
            icon: ClipboardCheck,
            active: view === 'approvals',
        },
        {
            label: 'Day Book & General Ledger',
            to: '/admin/expenses/accounting/day-book',
            icon: BookOpen,
            active: view === 'accounting',
        },
        {
            label: 'Payment Vouchers',
            to: '/admin/expenses/payment-vouchers',
            icon: Receipt,
            active: view === 'vouchers',
        },
    ]

    return (
        <section className='space-y-6'>
            {/* Document 7 Governance Banner */}
            <div className='bg-[#F8F9FA] border border-[#E4E7EC] rounded-2xl p-4 sm:p-5 shadow-sm'>
                <div className='flex items-start gap-3'>
                    <div className='p-2 bg-[#515DEF15] text-[#515DEF] rounded-xl shrink-0 mt-0.5'>
                        <CheckCircle2 size={20} />
                    </div>
                    <div className='space-y-1'>
                        <h2 className='text-base font-semibold text-[#1E1E1E]'>
                            Finance Ledger & Institutional Expense Centralization (Document 7)
                        </h2>
                        <p className='text-sm text-[#667085] leading-relaxed'>
                            Per Document 7 compliance, Admin and Super Admin govern administrative authorizations and institutional policies, while the centralized Finance Department (Account Head) maintains all master expense ledgers, salary disbursement records, vouchers, and cash registers.
                        </p>
                    </div>
                </div>

                {/* Sub-navigation tabs */}
                <div className='flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#E4E7EC]'>
                    {navTabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <NavLink
                                key={tab.to}
                                to={tab.to}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    tab.active
                                        ? 'bg-[#515DEF] text-white shadow-sm'
                                        : 'bg-white text-[#667085] border border-[#D9D9D9] hover:bg-[#F2F4F7]'
                                }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </NavLink>
                        )
                    })}
                </div>
            </div>

            {/* Live Finance Workspace View */}
            <div>
                {view === 'approvals' && <Approvals />}
                {view === 'accounting' && <Accounting />}
                {view === 'vouchers' && <PaymentVouchers />}
            </div>
        </section>
    )
}
