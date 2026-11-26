import React, { useEffect, useState, useMemo } from 'react'
import {
    Receipt,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Search,
    RefreshCw,
    Building2,
    ExternalLink,
    Filter,
    ShieldCheck,
    DollarSign,
    X,
    Check
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { proService } from '../../services/modules/proService'

const INITIAL_CHALLANS = [
    {
        id: 'CHAL-2026-001',
        challanNumber: 'TN-TREAS-MDU-2026-9921',
        statutoryPurpose: 'Tamil Nadu Fire & Rescue Annual Inspection & NOC Fee',
        issuingDepartment: 'Fire & Rescue Services',
        amount: 25000,
        paymentDate: '2026-01-10',
        bankTreasuryBranch: 'SBI Treasury Branch, Madurai Central',
        linkedFinanceVoucherId: 'VOUCH-2026-FIN-0881',
        verificationStatus: 'Verified with Finance',
        permitRef: 'PERMIT-2026-001',
        verifiedBy: 'A. Ramanathan (Account Head)',
        verifiedDate: '2026-01-11',
    },
    {
        id: 'CHAL-2026-002',
        challanNumber: 'CBSE-AFF-FEE-2026-4412',
        statutoryPurpose: 'CBSE Secondary & Senior Secondary Annual Affiliation Extension Fee',
        issuingDepartment: 'CBSE Regional Office',
        amount: 50000,
        paymentDate: '2026-01-18',
        bankTreasuryBranch: 'Canara Bank (Direct CBSE Gateway Transfer)',
        linkedFinanceVoucherId: 'VOUCH-2026-FIN-0912',
        verificationStatus: 'Verified with Finance',
        permitRef: 'AFF-2026-001',
        verifiedBy: 'A. Ramanathan (Account Head)',
        verifiedDate: '2026-01-19',
    },
    {
        id: 'CHAL-2026-003',
        challanNumber: 'DTCP-PLAN-SCRUT-2026-102',
        statutoryPurpose: 'Directorate of Town & Country Planning (DTCP) Building Stability Scrutiny',
        issuingDepartment: 'Revenue Dept & DTCP',
        amount: 35000,
        paymentDate: '2026-02-05',
        bankTreasuryBranch: 'Madurai District Treasury e-Challan Portal',
        linkedFinanceVoucherId: 'VOUCH-2026-FIN-1004',
        verificationStatus: 'Verified with Finance',
        permitRef: 'PERMIT-2026-002',
        verifiedBy: 'A. Ramanathan (Account Head)',
        verifiedDate: '2026-02-06',
    },
    {
        id: 'CHAL-2026-004',
        challanNumber: 'TNPCB-AIR-WATER-2026-78',
        statutoryPurpose: 'Pollution Control Board Consent Renewal Inspection Statutory Fee',
        issuingDepartment: 'TNPCB Regional Office',
        amount: 18500,
        paymentDate: '2026-03-01',
        bankTreasuryBranch: 'Indian Bank Government Treasury Counter',
        linkedFinanceVoucherId: 'VOUCH-2026-FIN-1120',
        verificationStatus: 'Pending Finance Audit',
        permitRef: 'PERMIT-2026-004',
        verifiedBy: null,
        verifiedDate: null,
    },
    {
        id: 'CHAL-2026-005',
        challanNumber: 'RTE-RECOG-GOV-2026-012',
        statutoryPurpose: 'Right to Education (RTE) Section 12(1)(c) Compliance Processing Fee',
        issuingDepartment: 'Directorate of School Education',
        amount: 12000,
        paymentDate: '2026-03-10',
        bankTreasuryBranch: 'SBI Treasury Branch',
        linkedFinanceVoucherId: 'VOUCH-2026-FIN-1155',
        verificationStatus: 'Pending Finance Audit',
        permitRef: 'AFF-2026-004',
        verifiedBy: null,
        verifiedDate: null,
    },
]

const ProChallans = () => {
    const [challans, setChallans] = useState(() => {
        const saved = localStorage.getItem('pro_challans_records')
        return saved ? JSON.parse(saved) : INITIAL_CHALLANS
    })
    const [loading, setLoading] = useState(false)
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedChallan, setSelectedChallan] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    useEffect(() => {
        localStorage.setItem('pro_challans_records', JSON.stringify(challans))
    }, [challans])

    const filteredChallans = useMemo(() => {
        return challans.filter((c) => {
            const matchesStatus = statusFilter === 'ALL' || c.verificationStatus === statusFilter
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                c.challanNumber.toLowerCase().includes(q) ||
                c.statutoryPurpose.toLowerCase().includes(q) ||
                c.linkedFinanceVoucherId.toLowerCase().includes(q) ||
                c.issuingDepartment.toLowerCase().includes(q)

            return matchesStatus && matchesSearch
        })
    }, [challans, statusFilter, searchQuery])

    const handleVerify = (id) => {
        setChallans((prev) =>
            prev.map((c) => {
                if (c.id === id) {
                    return {
                        ...c,
                        verificationStatus: 'Verified with Finance',
                        verifiedBy: 'A. Ramanathan (Account Head)',
                        verifiedDate: new Date().toISOString().split('T')[0],
                    }
                }
                return c
            })
        )
        setFeedbackMessage('Challan reconciled and verified against Finance accounts ledger.')
        setTimeout(() => setFeedbackMessage(''), 4000)
    }

    const columns = [
        {
            key: 'challanNumber',
            label: 'Treasury Challan Ref',
            required: true,
            render: (row) => (
                <div>
                    <span className='font-mono text-xs font-bold text-slate-900'>{row.challanNumber}</span>
                    <div className='text-[11px] text-slate-400 mt-0.5'>{row.bankTreasuryBranch}</div>
                </div>
            ),
        },
        {
            key: 'statutoryPurpose',
            label: 'Statutory Purpose & Department',
            required: true,
            render: (row) => (
                <div>
                    <div className='text-xs font-semibold text-slate-900'>{row.statutoryPurpose}</div>
                    <div className='text-[11px] text-teal-700 font-medium mt-0.5'>{row.issuingDepartment}</div>
                </div>
            ),
        },
        {
            key: 'amount',
            label: 'Amount (INR)',
            required: true,
            render: (row) => (
                <div className='font-mono font-bold text-xs text-slate-900'>
                    ₹{row.amount.toLocaleString('en-IN')}
                    <div className='text-[10px] text-slate-400 font-normal'>Paid: {row.paymentDate}</div>
                </div>
            ),
        },
        {
            key: 'linkedFinanceVoucherId',
            label: 'Linked Finance Voucher',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5 font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 w-fit'>
                    <Receipt className='w-3 h-3 text-indigo-600' />
                    {row.linkedFinanceVoucherId}
                </div>
            ),
        },
        {
            key: 'verificationStatus',
            label: 'Audit Status',
            required: true,
            render: (row) => <StatusBadge status={row.verificationStatus} />,
        },
        {
            key: 'actions',
            label: 'Actions',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-2'>
                    {row.verificationStatus !== 'Verified with Finance' ? (
                        <button
                            type='button'
                            onClick={() => handleVerify(row.id)}
                            className='inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold transition-colors shadow-xs'
                        >
                            <Check className='w-3 h-3' />
                            Reconcile &amp; Verify
                        </button>
                    ) : (
                        <span className='text-[11px] font-semibold text-emerald-700 flex items-center gap-1'>
                            <CheckCircle2 className='w-3.5 h-3.5 text-emerald-600' />
                            Audited
                        </span>
                    )}
                </div>
            ),
        },
    ]

    return (
        <section className='space-y-6 p-1'>
            {/* Header */}
            <div className='rounded-2xl bg-white p-5 border border-slate-200 shadow-xs'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700'>
                            <Receipt className='w-4 h-4' />
                            Inter-Departmental Financial Reconciliation
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Statutory Fee &amp; Treasury Challan Verification
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Direct linkage between PRO government filings, treasury challans, and the Central Finance Department's accounts payable ledger.
                        </p>
                    </div>
                </div>

                {feedbackMessage && (
                    <div className='mt-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800 flex items-center gap-2'>
                        <CheckCircle2 className='w-4 h-4 text-teal-600' />
                        {feedbackMessage}
                    </div>
                )}
            </div>

            {/* Filter Bar */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div className='flex items-center gap-2'>
                    <span className='text-xs font-semibold text-slate-500'>Verification Status:</span>
                    {['ALL', 'Verified with Finance', 'Pending Finance Audit'].map((st) => (
                        <button
                            key={st}
                            type='button'
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                                statusFilter === st
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                            {st === 'ALL' ? 'All Challans' : st}
                        </button>
                    ))}
                </div>

                <div className='relative w-full md:w-72'>
                    <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search challan, voucher, or purpose...'
                        className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    />
                </div>
            </div>

            {/* Challans Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Treasury Challans &amp; Payment Vouchers ({filteredChallans.length})
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredChallans}
                        emptyMessage='No treasury challans match the current criteria.'
                    />
                </div>
            </div>
        </section>
    )
}

export default ProChallans
