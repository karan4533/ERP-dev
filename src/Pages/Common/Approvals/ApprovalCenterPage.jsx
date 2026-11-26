import React, { useState } from 'react'
import {
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Filter,
    Package,
    ShoppingCart,
    CalendarOff,
    BookOpen,
    FileText,
    Check,
    AlertCircle
} from 'lucide-react'

const INITIAL_APPROVALS = [
    {
        id: 'REQ-STR-2026-008',
        category: 'Store Request',
        title: 'Monthly A4 Copier Paper & Blue Pen Replenishment',
        department: 'Academic Administration',
        requester: 'Meena Kapoor (Stores Officer)',
        submittedDate: 'Today, 09:30 AM',
        amount: '₹15,400',
        priority: 'High',
        details: '40 Reams A4 Copier Paper (500 sheets), 200 Blue Ballpoint Pens, 10 Stapler Pin Boxes.',
        status: 'Pending',
    },
    {
        id: 'PO-2026-004',
        category: 'Purchase Order',
        title: 'Bulk Spiral Notebook Order for New Term',
        department: 'Stationery Store',
        requester: 'Classmate Wholesale India',
        submittedDate: 'Yesterday, 04:15 PM',
        amount: '₹48,750',
        priority: 'Medium',
        details: '750 Units Spiral Notebooks (200 pages) for Grade 9-12 distribution.',
        status: 'Pending',
    },
    {
        id: 'LV-2026-089',
        category: 'Leave Request',
        title: 'Casual Leave (2 Days)',
        department: 'Science & Mathematics',
        requester: 'Ananya Deshmukh (Physics Mentor)',
        submittedDate: 'Today, 08:10 AM',
        amount: '2 Days (CL)',
        priority: 'Urgent',
        details: 'Family emergency leave requested for 3 Nov – 4 Nov 2026. Substitution mapped to R. Srinivasan.',
        status: 'Pending',
    },
    {
        id: 'LP-2026-042',
        category: 'Lesson Plan',
        title: 'Grade 10 Mathematics · Unit 4: Quadratic Equations',
        department: 'Mathematics Wing',
        requester: 'R. Srinivasan (Subject Teacher)',
        submittedDate: '28 Oct 2026',
        amount: 'Term 2 Plan',
        priority: 'Normal',
        details: '12 Period breakdown with Bloom\'s Taxonomy Cognitive Level 3 & HOTS problems.',
        status: 'Pending',
    },
    {
        id: 'REQ-STR-2026-009',
        category: 'Store Request',
        title: 'Science Lab Glassware & Chemical Indicators',
        department: 'Senior Science Laboratory',
        requester: 'Dr. S. Narayanan (Lab Incharge)',
        submittedDate: '27 Oct 2026',
        amount: '₹8,200',
        priority: 'Medium',
        details: 'Test tubes, conical flasks, and pH indicators for CBSE practical examinations.',
        status: 'Pending',
    },
]

const ApprovalCenterPage = () => {
    const [approvals, setApprovals] = useState(INITIAL_APPROVALS)
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [selectedIds, setSelectedIds] = useState([])
    const [feedbackMessage, setFeedbackMessage] = useState(null)

    const categories = ['All', 'Store Request', 'Purchase Order', 'Leave Request', 'Lesson Plan']

    const filtered = approvals.filter((item) =>
        selectedCategory === 'All' || item.category === selectedCategory
    )

    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        )
    }

    const selectAll = () => {
        if (selectedIds.length === filtered.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filtered.map((item) => item.id))
        }
    }

    const handleAction = (id, newStatus, reason = '') => {
        setApprovals((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, status: newStatus } : item
            )
        )
        setFeedbackMessage(`Request ${id} marked as ${newStatus}.`)
        setTimeout(() => setFeedbackMessage(null), 3000)
    }

    const handleBulkApprove = () => {
        if (!selectedIds.length) return
        setApprovals((prev) =>
            prev.map((item) =>
                selectedIds.includes(item.id) ? { ...item, status: 'Approved' } : item
            )
        )
        setFeedbackMessage(`Bulk approved ${selectedIds.length} requests successfully.`)
        setSelectedIds([])
        setTimeout(() => setFeedbackMessage(null), 3000)
    }

    return (
        <div className='space-y-6 pb-8 font-inter'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <div className='flex items-center gap-2'>
                        <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                            Unified Approval Center
                        </h1>
                        <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100'>
                            {approvals.filter((a) => a.status === 'Pending').length} Pending
                        </span>
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>
                        Centralized inbox for operational requisitions, purchase orders, staff leave, lesson plans, and marks approval.
                    </p>
                </div>

                {selectedIds.length > 0 && (
                    <button
                        type='button'
                        onClick={handleBulkApprove}
                        className='inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors self-start sm:self-center cursor-pointer'
                    >
                        <CheckCircle2 size={15} />
                        Bulk Approve Selected ({selectedIds.length})
                    </button>
                )}
            </div>

            {feedbackMessage && (
                <div className='flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-xs font-semibold text-blue-700 border border-blue-200'>
                    <Check size={16} />
                    {feedbackMessage}
                </div>
            )}

            {/* Filter Pills */}
            <div className='flex items-center justify-between gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 rounded-2xl shadow-2xs'>
                <div className='flex items-center gap-1.5'>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type='button'
                            onClick={() => setSelectedCategory(cat)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                                selectedCategory === cat
                                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className='flex items-center gap-2 shrink-0 text-xs font-medium text-slate-500 pr-2'>
                    <input
                        type='checkbox'
                        id='select-all'
                        checked={selectedIds.length === filtered.length && filtered.length > 0}
                        onChange={selectAll}
                        className='size-4 accent-blue-600 rounded cursor-pointer'
                    />
                    <label htmlFor='select-all' className='cursor-pointer'>Select All</label>
                </div>
            </div>

            {/* Requests List */}
            <div className='space-y-3.5'>
                {filtered.map((item) => {
                    const isSelected = selectedIds.includes(item.id)
                    const isPending = item.status === 'Pending'

                    return (
                        <div
                            key={item.id}
                            className={`rounded-[1.25rem] border bg-white p-5 shadow-xs transition-all ${
                                isSelected
                                    ? 'border-blue-400 ring-2 ring-blue-500/10'
                                    : 'border-slate-200/80 hover:border-slate-300'
                            }`}
                        >
                            <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
                                <div className='flex items-start gap-3.5 min-w-0'>
                                    {isPending && (
                                        <input
                                            type='checkbox'
                                            checked={isSelected}
                                            onChange={() => toggleSelect(item.id)}
                                            className='mt-1 size-4 accent-blue-600 rounded cursor-pointer'
                                        />
                                    )}

                                    <div className='min-w-0'>
                                        <div className='flex items-center gap-2 flex-wrap'>
                                            <span className='rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600'>
                                                {item.category}
                                            </span>
                                            <span className='font-mono text-xs font-semibold text-slate-500'>
                                                {item.id}
                                            </span>
                                            <span
                                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                                    item.priority === 'Urgent'
                                                        ? 'bg-red-100 text-red-700'
                                                        : item.priority === 'High'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}
                                            >
                                                {item.priority}
                                            </span>
                                        </div>

                                        <h2 className='text-sm font-bold text-slate-900 mt-1.5'>
                                            {item.title}
                                        </h2>

                                        <p className='text-xs text-slate-500 mt-1'>
                                            {item.details}
                                        </p>

                                        <div className='mt-2.5 flex items-center gap-x-4 gap-y-1 flex-wrap text-[11px] text-slate-400'>
                                            <span>Dept: <strong className='text-slate-600'>{item.department}</strong></span>
                                            <span>·</span>
                                            <span>Requester: <strong className='text-slate-600'>{item.requester}</strong></span>
                                            <span>·</span>
                                            <span>Submitted: <strong className='text-slate-600'>{item.submittedDate}</strong></span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Amount & Action Buttons */}
                                <div className='flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100'>
                                    <span className='text-base font-bold text-slate-900'>
                                        {item.amount}
                                    </span>

                                    {isPending ? (
                                        <div className='flex items-center gap-1.5'>
                                            <button
                                                type='button'
                                                onClick={() => handleAction(item.id, 'Approved')}
                                                className='inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer'
                                            >
                                                <CheckCircle2 size={14} />
                                                Approve
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => handleAction(item.id, 'Declined')}
                                                className='inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer'
                                            >
                                                <XCircle size={14} />
                                                Decline
                                            </button>
                                        </div>
                                    ) : (
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                                item.status === 'Approved'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-red-50 text-red-700'
                                            }`}
                                        >
                                            {item.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default ApprovalCenterPage

