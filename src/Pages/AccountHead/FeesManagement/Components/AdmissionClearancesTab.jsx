import React, { useState, useMemo, useEffect } from 'react'
import {
    CheckCircle2,
    Clock,
    DollarSign,
    GraduationCap,
    Receipt,
    Search,
    ShieldCheck,
    UserCheck,
    X,
    Filter
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
    getAllAdmissions,
    approveAdmissionAndCollectFee,
    getStudentDisplayName,
} from '../../../Admin/FrontOffice/AdminssionList/admissionListData'
import { useAuth } from '../../../../context/AuthContext'

export default function AdmissionClearancesTab() {
    const { name: authName, email: authEmail } = useAuth()
    const [admissions, setAdmissions] = useState(() => getAllAdmissions())
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('Pending')
    const [selectedAdmission, setSelectedAdmission] = useState(null)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

    // Payment Form State
    const [paymentMode, setPaymentMode] = useState('Cash')
    const [feeAmount, setFeeAmount] = useState('5000')
    const [receiptNumber, setReceiptNumber] = useState('')
    const [referenceNumber, setReferenceNumber] = useState('')
    const [remarks, setRemarks] = useState('')

    const refresh = () => setAdmissions(getAllAdmissions())

    useEffect(() => {
        const handler = () => refresh()
        window.addEventListener('schoolerp-admission-finance-sync', handler)
        return () => window.removeEventListener('schoolerp-admission-finance-sync', handler)
    }, [])

    const filteredAdmissions = useMemo(() => {
        const q = search.trim().toLowerCase()
        return admissions.filter((item) => {
            const isPending = item.status === 'Pending Finance Approval' || (!item.enrolledStudentId && item.status !== 'Enrolled')
            const isEnrolled = item.status === 'Enrolled'

            if (statusFilter === 'Pending' && !isPending) return false
            if (statusFilter === 'Enrolled' && !isEnrolled) return false

            if (!q) return true
            const name = getStudentDisplayName(item).toLowerCase()
            const admId = (item.admissionNumber || item.id || '').toLowerCase()
            const cls = (item.className || '').toLowerCase()
            const parent = (item.fatherName || item.motherName || item.parentEmail || '').toLowerCase()
            return name.includes(q) || admId.includes(q) || cls.includes(q) || parent.includes(q)
        })
    }, [admissions, search, statusFilter])

    const pendingCount = admissions.filter(
        (a) => a.status === 'Pending Finance Approval' || (!a.enrolledStudentId && a.status !== 'Enrolled')
    ).length

    const enrolledCount = admissions.filter((a) => a.status === 'Enrolled').length

    const handleOpenModal = (admission) => {
        setSelectedAdmission(admission)
        setFeeAmount(admission.registrationFees || '5000')
        setReceiptNumber(`RCP-ADM-${Date.now().toString().slice(-6)}`)
        setReferenceNumber('')
        setRemarks(`Admission fee cleared and verified by Finance (${authName || 'Account Head'}).`)
        setIsPaymentModalOpen(true)
    }

    const handleConfirmPayment = (e) => {
        e.preventDefault()
        if (!selectedAdmission) return

        const res = approveAdmissionAndCollectFee(selectedAdmission.id, {
            collectedBy: authName || authEmail || 'Account Head',
            paymentMode,
            amount: feeAmount,
            receiptNumber,
            referenceNumber,
            remarks,
        })

        if (!res.success) {
            toast.error(res.message || 'Failed to process fee clearance.')
            return
        }

        refresh()
        setIsPaymentModalOpen(false)
        setSelectedAdmission(null)
        toast.success(
            `${getStudentDisplayName(selectedAdmission)} enrolled! Receipt ${receiptNumber} generated.`
        )
    }

    return (
        <div className='space-y-6'>
            {/* KPI Summary Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div className='rounded-2xl border border-amber-200 bg-amber-50/50 p-4'>
                    <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-amber-700'>Awaiting Finance Clearance</span>
                        <Clock size={18} className='text-amber-600' />
                    </div>
                    <p className='mt-2 text-2xl font-bold text-amber-950'>{pendingCount} Students</p>
                    <p className='text-[11px] text-amber-600 mt-0.5'>PRM admission submitted · pending fee billing</p>
                </div>

                <div className='rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4'>
                    <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-emerald-700'>Fee Cleared &amp; Enrolled</span>
                        <GraduationCap size={18} className='text-emerald-600' />
                    </div>
                    <p className='mt-2 text-2xl font-bold text-emerald-950'>{enrolledCount} Students</p>
                    <p className='text-[11px] text-emerald-600 mt-0.5'>Active enrolled students with UIS profile</p>
                </div>

                <div className='rounded-2xl border border-blue-200 bg-blue-50/50 p-4'>
                    <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-blue-700'>Standard Admission Fee</span>
                        <DollarSign size={18} className='text-blue-600' />
                    </div>
                    <p className='mt-2 text-2xl font-bold text-blue-950'>₹5,000 / Student</p>
                    <p className='text-[11px] text-blue-600 mt-0.5'>Registration &amp; admission processing tariff</p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className='flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200'>
                <div className='flex flex-wrap items-center gap-3 flex-1 min-w-[280px]'>
                    <div className='relative flex-1 max-w-sm'>
                        <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
                        <input
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Search student, admission ID, class or parent...'
                            className='w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-500'
                        />
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={() => setStatusFilter('Pending')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                statusFilter === 'Pending'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Pending Clearances ({pendingCount})
                        </button>
                        <button
                            type='button'
                            onClick={() => setStatusFilter('Enrolled')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                statusFilter === 'Enrolled'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Enrolled ({enrolledCount})
                        </button>
                        <button
                            type='button'
                            onClick={() => setStatusFilter('All')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                statusFilter === 'All'
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            All ({admissions.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Admissions Clearance Table */}
            <div className='overflow-x-auto rounded-2xl border border-slate-200 bg-white'>
                <table className='w-full text-left text-xs'>
                    <thead className='bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-200'>
                        <tr>
                            <th className='py-3 px-4'>Admission ID</th>
                            <th className='py-3 px-4'>Student Name</th>
                            <th className='py-3 px-4'>Class &amp; Batch</th>
                            <th className='py-3 px-4'>Parent Contact</th>
                            <th className='py-3 px-4'>Admission Fee</th>
                            <th className='py-3 px-4'>Status</th>
                            <th className='py-3 px-4 text-right'>Action</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                        {filteredAdmissions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className='py-8 text-center text-slate-400'>
                                    No admission records match the current filters.
                                </td>
                            </tr>
                        ) : (
                            filteredAdmissions.map((adm) => {
                                const isEnrolled = adm.status === 'Enrolled'
                                return (
                                    <tr key={adm.id} className='hover:bg-slate-50/80 transition-colors'>
                                        <td className='py-3 px-4 font-mono font-semibold text-indigo-900'>
                                            {adm.admissionNumber || adm.id}
                                        </td>
                                        <td className='py-3 px-4 font-medium text-slate-900'>
                                            <div>{getStudentDisplayName(adm)}</div>
                                            <span className='text-[10px] text-slate-400'>{adm.email || '—'}</span>
                                        </td>
                                        <td className='py-3 px-4 text-slate-700'>
                                            {adm.className || 'Not assigned'}
                                        </td>
                                        <td className='py-3 px-4 text-slate-600'>
                                            <div>{adm.parentMobileNumber || adm.mobileNumber || '—'}</div>
                                            <span className='text-[10px] text-slate-400'>{adm.fatherName || adm.motherName || '—'}</span>
                                        </td>
                                        <td className='py-3 px-4 font-semibold text-slate-900'>
                                            ₹{adm.registrationFees || '5,000'}
                                        </td>
                                        <td className='py-3 px-4'>
                                            {isEnrolled ? (
                                                <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                                                    <CheckCircle2 size={12} /> Fee Paid &amp; Enrolled
                                                </span>
                                            ) : (
                                                <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200'>
                                                    <Clock size={12} /> Pending Finance
                                                </span>
                                            )}
                                        </td>
                                        <td className='py-3 px-4 text-right'>
                                            {isEnrolled ? (
                                                <span className='text-[11px] font-semibold text-slate-400'>
                                                    UIS #{adm.enrolledStudentId || 'Active'}
                                                </span>
                                            ) : (
                                                <button
                                                    type='button'
                                                    onClick={() => handleOpenModal(adm)}
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors'
                                                >
                                                    <Receipt size={13} /> Collect Fee &amp; Enrol
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Collect Fee & Approve Enrolment Modal */}
            {isPaymentModalOpen && selectedAdmission && (
                <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs'>
                    <div className='bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden'>
                        <div className='px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50'>
                            <div className='flex items-center gap-2'>
                                <ShieldCheck size={20} className='text-indigo-600' />
                                <div>
                                    <h3 className='text-sm font-bold text-slate-900'>Admission Fee Collection &amp; Enrolment</h3>
                                    <p className='text-[11px] text-slate-500'>
                                        Candidate: {getStudentDisplayName(selectedAdmission)} ({selectedAdmission.admissionNumber || selectedAdmission.id})
                                    </p>
                                </div>
                            </div>
                            <button
                                type='button'
                                onClick={() => setIsPaymentModalOpen(false)}
                                className='p-1 text-slate-400 hover:text-slate-600 rounded-lg'
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmPayment} className='p-6 space-y-4 text-xs'>
                            <div className='p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1 text-indigo-900'>
                                <p className='font-semibold'>Admission Workflow Connection:</p>
                                <p className='text-[11px] text-indigo-700'>
                                    Upon recording fee clearance, the student status will transition from <span className='font-semibold'>Pending Finance Approval</span> to <span className='font-semibold'>Enrolled</span>, creating their official UIS student profile and parent credentials.
                                </p>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Class Allocated</label>
                                    <input
                                        type='text'
                                        value={selectedAdmission.className || 'Grade 1'}
                                        readOnly
                                        className='w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-800'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Admission Fee Amount (₹)</label>
                                    <input
                                        type='number'
                                        value={feeAmount}
                                        onChange={(e) => setFeeAmount(e.target.value)}
                                        required
                                        className='w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Payment Mode</label>
                                    <select
                                        value={paymentMode}
                                        onChange={(e) => setPaymentMode(e.target.value)}
                                        className='w-full px-3 py-2 bg-white border border-slate-200 rounded-xl'
                                    >
                                        <option value='Cash'>Cash</option>
                                        <option value='UPI / QR Code'>UPI / QR Code</option>
                                        <option value='Cheque'>Cheque</option>
                                        <option value='Bank Transfer (NEFT/RTGS)'>Bank Transfer (NEFT/RTGS)</option>
                                        <option value='POS Terminal Card'>POS Terminal Card</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Receipt Number</label>
                                    <input
                                        type='text'
                                        value={receiptNumber}
                                        onChange={(e) => setReceiptNumber(e.target.value)}
                                        required
                                        className='w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Transaction Ref / Cheque No. (Optional)</label>
                                <input
                                    type='text'
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    placeholder='e.g. UTR-994821 or CHQ-001248'
                                    className='w-full px-3 py-2 bg-white border border-slate-200 rounded-xl'
                                />
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Account Head Clearance Remarks</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows={2}
                                    className='w-full px-3 py-2 bg-white border border-slate-200 rounded-xl resize-none'
                                />
                            </div>

                            <div className='pt-3 border-t border-slate-100 flex items-center justify-end gap-2'>
                                <button
                                    type='button'
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className='px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-medium'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5'
                                >
                                    <UserCheck size={14} /> Confirm Payment &amp; Enrol
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

