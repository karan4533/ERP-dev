import React, { useState, useEffect, useMemo } from 'react'
import {
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    Filter,
    Plus,
    X,
    Printer,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    ShieldCheck,
    CreditCard,
    Building,
    Check,
    ChevronRight,
    RotateCcw
} from 'lucide-react'
import { toast } from 'react-toastify'
import { feeService } from '../../../../services/modules/feeService'
import { REFUND_STATUS } from '../../../../services/models/index'
import { useAuth } from '../../../../context/AuthContext'
import { openPrintDocument } from '../../../../Common/printDocument'
import { getStudentsList } from '../../../Teacher/StudentsList/studentsListData'
import { useFinance } from '../../financeDomain/FinanceContext'

const RefundsManagementTab = () => {
    const { auth } = useAuth()
    const authName = auth?.user?.name || 'Finance Officer'
    const userRole = auth?.user?.role || 'account-head'
    const { recordVoucherAction } = useFinance()

    const [refunds, setRefunds] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [refreshKey, setRefreshKey] = useState(0)

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isProcessModalOpen, setIsProcessModalOpen] = useState(false)
    const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false)
    const [selectedRefund, setSelectedRefund] = useState(null)

    // New Request Form
    const [formData, setFormData] = useState({
        studentId: '',
        studentName: '',
        refundCategory: 'Caution Deposit Refund',
        receiptReference: 'REC-2025-0842',
        paidAmount: 10000,
        refundAmount: 10000,
        deductionAmount: 0,
        reason: 'Final institutional clearance upon completion of secondary schooling.',
        accountHolderName: '',
        bankName: 'State Bank of India',
        accountNumber: '38491029482',
        ifscCode: 'SBIN0001428',
    })

    // Process & Approval Form
    const [approvalNotes, setApprovalNotes] = useState('Cleared after departmental dues verification.')

    // Disbursement Form
    const [disburseData, setDisburseData] = useState({
        disbursementMode: 'Bank Transfer (NEFT/RTGS)',
        transactionReference: `UTR-${Math.floor(100000000 + Math.random() * 900000000)}`,
        chequeNumber: '',
        disbursedDate: new Date().toISOString().split('T')[0],
        remarks: 'Payment sanctioned and processed via central treasury account.'
    })

    const schoolStudents = useMemo(() => {
        try {
            return getStudentsList() || []
        } catch {
            return []
        }
    }, [])

    const loadRefunds = async () => {
        setLoading(true)
        try {
            const res = await feeService.getRefundRequests()
            if (res.success && Array.isArray(res.data)) {
                setRefunds(res.data)
            }
        } catch (err) {
            console.warn('Error loading fee refunds:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadRefunds()
    }, [refreshKey])

    // KPI Metrics
    const kpis = useMemo(() => {
        const total = refunds.length
        const pendingAccounts = refunds.filter(r => r.status === REFUND_STATUS.PENDING_ACCOUNTS).length
        const pendingJd = refunds.filter(r => r.status === REFUND_STATUS.PENDING_JD).length
        const approved = refunds.filter(r => r.status === REFUND_STATUS.APPROVED).length
        const disbursedRefunds = refunds.filter(r => r.status === REFUND_STATUS.DISBURSED)
        const totalDisbursedAmount = disbursedRefunds.reduce((acc, r) => acc + (Number(r.refundAmount) || 0), 0)

        return {
            total,
            pendingAccounts,
            pendingJd,
            approved,
            disbursedCount: disbursedRefunds.length,
            totalDisbursedAmount
        }
    }, [refunds])

    // Handle Create Refund Request
    const handleCreateSubmit = async (e) => {
        e.preventDefault()
        if (!formData.studentId || !formData.refundAmount) {
            toast.warning('Please select student and enter refund amount.')
            return
        }

        try {
            const payload = {
                studentId: formData.studentId,
                studentName: formData.studentName,
                refundCategory: formData.refundCategory,
                refundAmount: Number(formData.refundAmount),
                reason: formData.reason,
                paymentReceiptId: formData.receiptReference,
                requesterRole: userRole,
                requesterName: authName,
                beneficiaryBankDetails: {
                    accountHolderName: formData.accountHolderName || formData.studentName,
                    bankName: formData.bankName,
                    accountNumber: formData.accountNumber,
                    ifscCode: formData.ifscCode,
                }
            }

            const res = await feeService.requestRefund(payload)
            if (res.success) {
                toast.success(`✓ Refund request for ₹${Number(formData.refundAmount).toLocaleString('en-IN')} initiated! Forwarded for Accounts Verification.`)
                setIsCreateModalOpen(false)
                setRefreshKey(k => k + 1)
            }
        } catch (err) {
            toast.error(err.message || 'Error initiating refund request.')
        }
    }

    // Handle Stage Transition (Accounts Verification -> JD Approval -> Approved)
    const handleAdvanceStage = async (targetRefund, nextStatus) => {
        try {
            const res = await feeService.approveRefund(targetRefund.id, {
                nextStatus,
                approverRole: userRole === 'jointdirector' ? 'Joint Director' : 'Finance Head',
                approverName: authName,
                remarks: approvalNotes,
            })
            if (res.success) {
                toast.success(`✓ Refund status updated to "${nextStatus}"!`)
                setIsProcessModalOpen(false)
                setSelectedRefund(null)
                setRefreshKey(k => k + 1)
            }
        } catch (err) {
            toast.error(err.message || 'Error updating refund approval.')
        }
    }

    // Handle Disbursement
    const handleDisburseSubmit = async (e) => {
        e.preventDefault()
        if (!selectedRefund) return

        try {
            const voucherNumber = `REF-VOUCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
            const res = await feeService.issueRefundVoucher(selectedRefund.id, {
                nextStatus: REFUND_STATUS.DISBURSED,
                disbursementMode: disburseData.disbursementMode,
                transactionRef: disburseData.transactionReference || disburseData.chequeNumber,
                voucherNo: voucherNumber,
                remarks: disburseData.remarks,
                disbursedBy: authName,
            })

            if (res.success) {
                toast.success(`✓ Refund of ₹${Number(selectedRefund.refundAmount).toLocaleString('en-IN')} successfully disbursed! Payment voucher ${voucherNumber} generated.`)
                setIsDisburseModalOpen(false)
                setSelectedRefund(null)
                setRefreshKey(k => k + 1)
            }
        } catch (err) {
            toast.error(err.message || 'Error disbursing refund.')
        }
    }

    // Print Refund Payment Voucher
    const handlePrintVoucher = (refund) => {
        const body = `
            <div style="padding:30px;font-family:sans-serif;color:#0F172A;">
                <div style="border-bottom:2px solid #0F172A;padding-bottom:12px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end;">
                    <div>
                        <h2 style="margin:0;font-size:20px;text-transform:uppercase;color:#1E3A8A;">Queens Matriculation & Higher Secondary School</h2>
                        <p style="margin:4px 0 0;font-size:12px;color:#64748B;">Central Accounts & Treasury Department • Institutional Clearance Ledger</p>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-size:16px;font-weight:bold;color:#B45309;">OFFICIAL REFUND VOUCHER</span><br>
                        <span style="font-size:12px;font-family:monospace;">${refund.refundVoucherNumber || `REF-VOUCH-2026-081`}</span>
                    </div>
                </div>

                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">
                    <tbody>
                        <tr style="border-bottom:1px solid #E2E8F0;"><th style="text-align:left;padding:8px 0;width:35%;color:#64748B;">Student Name</th><td style="font-weight:bold;">${refund.studentName} (${refund.studentId})</td></tr>
                        <tr style="border-bottom:1px solid #E2E8F0;"><th style="text-align:left;padding:8px 0;color:#64748B;">Refund Category</th><td>${refund.refundCategory}</td></tr>
                        <tr style="border-bottom:1px solid #E2E8F0;"><th style="text-align:left;padding:8px 0;color:#64748B;">Original Paid Receipt Ref</th><td style="font-family:monospace;">${refund.paymentReceiptId || 'REC-2025-0842'}</td></tr>
                        <tr style="border-bottom:1px solid #E2E8F0;"><th style="text-align:left;padding:8px 0;color:#64748B;">Net Refund Amount Disbursed</th><td style="font-size:16px;font-weight:bold;color:#047857;">₹${Number(refund.refundAmount).toLocaleString('en-IN')}</td></tr>
                        <tr style="border-bottom:1px solid #E2E8F0;"><th style="text-align:left;padding:8px 0;color:#64748B;">Disbursement Mode</th><td>${refund.disbursementMode || 'Bank Transfer (NEFT / RTGS)'}</td></tr>
                        <tr style="border-bottom:1px solid #E2E8F0;"><th style="text-align:left;padding:8px 0;color:#64748B;">Beneficiary Bank Account</th><td>${refund.beneficiaryBankDetails?.bankName || 'SBI'} - A/C ${refund.beneficiaryBankDetails?.accountNumber || '38491029482'} (${refund.beneficiaryBankDetails?.ifscCode || 'SBIN0001428'})</td></tr>
                        <tr style="border-bottom:1px solid #E2E8F0;"><th style="text-align:left;padding:8px 0;color:#64748B;">Sanction Rationale</th><td>${refund.reason}</td></tr>
                        <tr style="border-bottom:1px solid #E2E8F0;"><th style="text-align:left;padding:8px 0;color:#64748B;">Date Disbursed</th><td>${new Date().toLocaleDateString('en-GB')}</td></tr>
                    </tbody>
                </table>

                <div style="margin-top:40px;display:flex;justify-content:space-between;font-size:11px;color:#475569;">
                    <div>_______________________<br>Prepared by (Accounts Clerk)</div>
                    <div>_______________________<br>Verified by (Finance Head)</div>
                    <div>_______________________<br>Sanctioned by (Joint Director)</div>
                    <div>_______________________<br>Beneficiary Parent Signature</div>
                </div>
            </div>
        `
        openPrintDocument({ title: `Refund Voucher - ${refund.studentName}`, body })
    }

    // Filtered refunds
    const filteredRefunds = useMemo(() => {
        return refunds.filter((r) => {
            const matchesQuery =
                !searchQuery ||
                r.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.refundVoucherNumber?.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesCategory =
                categoryFilter === 'ALL' ||
                r.refundCategory === categoryFilter

            const matchesStatus =
                statusFilter === 'ALL' ||
                r.status === statusFilter

            return matchesQuery && matchesCategory && matchesStatus
        })
    }, [refunds, searchQuery, categoryFilter, statusFilter])

    return (
        <div className='space-y-6 pt-2'>
            {/* Top KPI Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold'>
                        <RotateCcw size={24} />
                    </div>
                    <div>
                        <span className='text-xs font-semibold text-slate-500 uppercase block'>Total Applications</span>
                        <span className='text-2xl font-bold text-slate-900'>{kpis.total} Requests</span>
                        <span className='text-xs text-slate-400 block mt-0.5'>Lifetime Lodged</span>
                    </div>
                </div>

                <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold'>
                        <Clock size={24} />
                    </div>
                    <div>
                        <span className='text-xs font-semibold text-slate-500 uppercase block'>Accounts Verification</span>
                        <span className='text-2xl font-bold text-amber-700'>{kpis.pendingAccounts} Pending</span>
                        <span className='text-xs text-slate-400 block mt-0.5'>Audit Clearance Queue</span>
                    </div>
                </div>

                <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold'>
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <span className='text-xs font-semibold text-slate-500 uppercase block'>JD Sanction Queue</span>
                        <span className='text-2xl font-bold text-purple-700'>{kpis.pendingJd} Awaiting</span>
                        <span className='text-xs text-slate-400 block mt-0.5'>Executive Sign-Off</span>
                    </div>
                </div>

                <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold'>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <span className='text-xs font-semibold text-slate-500 uppercase block'>Total Disbursed</span>
                        <span className='text-2xl font-bold text-emerald-700'>₹{Number(kpis.totalDisbursedAmount).toLocaleString('en-IN')}</span>
                        <span className='text-xs text-slate-400 block mt-0.5'>{kpis.disbursedCount} Vouchers Released</span>
                    </div>
                </div>
            </div>

            {/* Filter and Action Toolbar */}
            <div className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs'>
                <div className='flex items-center gap-3 flex-wrap'>
                    <div className='relative w-full sm:w-72'>
                        <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
                        <input
                            type='text'
                            placeholder='Search by student, ID or voucher...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500'
                        />
                    </div>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className='px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700'
                    >
                        <option value='ALL'>All Categories</option>
                        <option value='Caution Deposit Refund'>Caution Deposit Refund</option>
                        <option value='Excess / Duplicate Payment'>Excess / Duplicate Payment</option>
                        <option value='Admission Cancellation'>Admission Cancellation</option>
                        <option value='Activity / Transport Fee Refund'>Activity / Transport Fee Refund</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className='px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700'
                    >
                        <option value='ALL'>All Workflow Stages</option>
                        <option value={REFUND_STATUS.REQUESTED}>{REFUND_STATUS.REQUESTED}</option>
                        <option value={REFUND_STATUS.PENDING_ACCOUNTS}>{REFUND_STATUS.PENDING_ACCOUNTS}</option>
                        <option value={REFUND_STATUS.PENDING_JD}>{REFUND_STATUS.PENDING_JD}</option>
                        <option value={REFUND_STATUS.APPROVED}>{REFUND_STATUS.APPROVED}</option>
                        <option value={REFUND_STATUS.DISBURSED}>{REFUND_STATUS.DISBURSED}</option>
                        <option value={REFUND_STATUS.REJECTED}>{REFUND_STATUS.REJECTED}</option>
                    </select>
                </div>

                <button
                    type='button'
                    onClick={() => setIsCreateModalOpen(true)}
                    className='inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer'
                >
                    <Plus size={16} />
                    Initiate Refund Request
                </button>
            </div>

            {/* Refunds Table */}
            <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs'>
                <div className='overflow-x-auto'>
                    <table className='w-full text-left text-xs'>
                        <thead className='bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider'>
                            <tr>
                                <th className='py-3.5 px-4'>Request / Voucher #</th>
                                <th className='py-3.5 px-4'>Student Details</th>
                                <th className='py-3.5 px-4'>Category</th>
                                <th className='py-3.5 px-4 text-right'>Refund Amount</th>
                                <th className='py-3.5 px-4'>Beneficiary / Mode</th>
                                <th className='py-3.5 px-4 text-center'>Lifecycle Status</th>
                                <th className='py-3.5 px-4 text-right'>Actions</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100 text-slate-700'>
                            {filteredRefunds.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='py-8 px-4 text-center text-slate-400'>
                                        No refund applications matching the search criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredRefunds.map((ref) => {
                                    const isPendingAcc = ref.status === REFUND_STATUS.PENDING_ACCOUNTS
                                    const isPendingJd = ref.status === REFUND_STATUS.PENDING_JD
                                    const isApproved = ref.status === REFUND_STATUS.APPROVED
                                    const isDisbursed = ref.status === REFUND_STATUS.DISBURSED
                                    const isRejected = ref.status === REFUND_STATUS.REJECTED

                                    return (
                                        <tr key={ref.id} className='hover:bg-slate-50/60 transition-colors'>
                                            <td className='py-3.5 px-4'>
                                                <span className='font-mono font-bold text-indigo-700 block'>{ref.refundVoucherNumber || ref.id}</span>
                                                <span className='text-[10px] text-slate-400 font-mono'>Ref: {ref.id}</span>
                                            </td>
                                            <td className='py-3.5 px-4'>
                                                <span className='font-bold text-slate-900 block'>{ref.studentName}</span>
                                                <span className='text-[11px] text-slate-400 font-mono'>{ref.studentId}</span>
                                            </td>
                                            <td className='py-3.5 px-4'>
                                                <span className='font-semibold text-slate-800 block'>{ref.refundCategory}</span>
                                                <span className='text-[10px] text-slate-500'>Receipt: {ref.paymentReceiptId || 'REC-DIRECT'}</span>
                                            </td>
                                            <td className='py-3.5 px-4 text-right font-extrabold text-sm text-slate-900'>
                                                ₹{Number(ref.refundAmount).toLocaleString('en-IN')}
                                            </td>
                                            <td className='py-3.5 px-4'>
                                                <span className='text-xs font-medium text-slate-800 block'>
                                                    {ref.beneficiaryBankDetails?.bankName || 'Direct Credit'}
                                                </span>
                                                <span className='text-[10px] text-slate-500 font-mono'>
                                                    {ref.beneficiaryBankDetails?.accountNumber ? `A/C: ${ref.beneficiaryBankDetails.accountNumber}` : 'Online Ref'}
                                                </span>
                                            </td>
                                            <td className='py-3.5 px-4 text-center'>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    isDisbursed ? 'bg-emerald-100 text-emerald-800' :
                                                    isApproved ? 'bg-indigo-100 text-indigo-800' :
                                                    isPendingJd ? 'bg-purple-100 text-purple-800' :
                                                    isPendingAcc ? 'bg-amber-100 text-amber-800' :
                                                    isRejected ? 'bg-rose-100 text-rose-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {ref.status}
                                                </span>
                                            </td>
                                            <td className='py-3.5 px-4 text-right'>
                                                <div className='flex items-center justify-end gap-1.5'>
                                                    {isPendingAcc && (
                                                        <button
                                                            type='button'
                                                            onClick={() => {
                                                                setSelectedRefund(ref)
                                                                setIsProcessModalOpen(true)
                                                            }}
                                                            className='px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer'
                                                        >
                                                            Verify Accounts
                                                        </button>
                                                    )}
                                                    {isPendingJd && (
                                                        <button
                                                            type='button'
                                                            onClick={() => {
                                                                setSelectedRefund(ref)
                                                                setIsProcessModalOpen(true)
                                                            }}
                                                            className='px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer'
                                                        >
                                                            JD Sanction →
                                                        </button>
                                                    )}
                                                    {isApproved && (
                                                        <button
                                                            type='button'
                                                            onClick={() => {
                                                                setSelectedRefund(ref)
                                                                setIsDisburseModalOpen(true)
                                                            }}
                                                            className='px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1'
                                                        >
                                                            <DollarSign size={13} />
                                                            Disburse Refund
                                                        </button>
                                                    )}
                                                    {isDisbursed && (
                                                        <button
                                                            type='button'
                                                            onClick={() => handlePrintVoucher(ref)}
                                                            className='px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer flex items-center gap-1'
                                                        >
                                                            <Printer size={13} />
                                                            Print Voucher
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: Initiate New Refund Request */}
            {isCreateModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs'>
                    <div className='bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900 flex items-center gap-2'>
                                <RotateCcw size={18} className='text-indigo-600' />
                                Initiate Fee Refund Request
                            </h3>
                            <button type='button' onClick={() => setIsCreateModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className='space-y-3.5 text-xs'>
                            <div>
                                <label className='font-bold text-slate-700 uppercase mb-1 block'>Select Enrolled Student *</label>
                                <select
                                    required
                                    value={formData.studentId}
                                    onChange={(e) => {
                                        const stu = schoolStudents.find(s => s.id === e.target.value)
                                        setFormData(prev => ({
                                            ...prev,
                                            studentId: e.target.value,
                                            studentName: stu ? stu.name : e.target.value,
                                            accountHolderName: stu ? stu.name : ''
                                        }))
                                    }}
                                    className='w-full rounded-xl border border-slate-200 p-2 font-medium text-slate-800'
                                >
                                    <option value=''>-- Choose Student --</option>
                                    {schoolStudents.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.id}) • Class {s.className}-{s.section}
                                        </option>
                                    ))}
                                    <option value='STU-001'>Aarav Sharma (STU-001) • Grade 10-A</option>
                                    <option value='STU-002'>Kavya Patel (STU-002) • Grade 10-A</option>
                                    <option value='STU-003'>Rohan Verma (STU-003) • Grade 9-B</option>
                                </select>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-bold text-slate-700 uppercase mb-1 block'>Refund Category *</label>
                                    <select
                                        value={formData.refundCategory}
                                        onChange={(e) => setFormData(prev => ({ ...prev, refundCategory: e.target.value }))}
                                        className='w-full rounded-xl border border-slate-200 p-2 font-medium text-slate-800'
                                    >
                                        <option value='Caution Deposit Refund'>Caution Deposit Refund</option>
                                        <option value='Excess / Duplicate Payment'>Excess / Duplicate Payment</option>
                                        <option value='Admission Cancellation'>Admission Cancellation</option>
                                        <option value='Activity / Transport Fee Refund'>Activity / Transport Fee Refund</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='font-bold text-slate-700 uppercase mb-1 block'>Paid Receipt Ref *</label>
                                    <input
                                        type='text'
                                        required
                                        value={formData.receiptReference}
                                        onChange={(e) => setFormData(prev => ({ ...prev, receiptReference: e.target.value }))}
                                        className='w-full rounded-xl border border-slate-200 p-2'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-bold text-slate-700 uppercase mb-1 block'>Original Paid (₹)</label>
                                    <input
                                        type='number'
                                        value={formData.paidAmount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: Number(e.target.value) }))}
                                        className='w-full rounded-xl border border-slate-200 p-2 font-bold text-slate-700'
                                    />
                                </div>
                                <div>
                                    <label className='font-bold text-slate-700 uppercase mb-1 block'>Refund Amount (₹) *</label>
                                    <input
                                        type='number'
                                        required
                                        min='100'
                                        max={formData.paidAmount}
                                        value={formData.refundAmount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, refundAmount: Number(e.target.value) }))}
                                        className='w-full rounded-xl border border-slate-200 p-2 font-bold text-indigo-700 text-sm'
                                    />
                                </div>
                            </div>

                            <div className='p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2'>
                                <span className='font-bold text-slate-800 block text-[11px] uppercase'>Beneficiary Direct Credit Coordinates</span>
                                <div className='grid grid-cols-2 gap-2'>
                                    <input
                                        type='text'
                                        placeholder='Account Holder Name'
                                        value={formData.accountHolderName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                                        className='rounded-lg border border-slate-200 p-1.5'
                                    />
                                    <input
                                        type='text'
                                        placeholder='Bank Name'
                                        value={formData.bankName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                                        className='rounded-lg border border-slate-200 p-1.5'
                                    />
                                    <input
                                        type='text'
                                        placeholder='Account Number'
                                        value={formData.accountNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                                        className='rounded-lg border border-slate-200 p-1.5 font-mono'
                                    />
                                    <input
                                        type='text'
                                        placeholder='IFSC Code'
                                        value={formData.ifscCode}
                                        onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value }))}
                                        className='rounded-lg border border-slate-200 p-1.5 font-mono'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='font-bold text-slate-700 uppercase mb-1 block'>Reason / Institutional Justification *</label>
                                <textarea
                                    rows={2}
                                    required
                                    value={formData.reason}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button type='button' onClick={() => setIsCreateModalOpen(false)} className='px-4 py-2 font-semibold text-slate-600'>
                                    Cancel
                                </button>
                                <button type='submit' className='px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-xs'>
                                    Submit for Verification
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Review & Advance Stage */}
            {isProcessModalOpen && selectedRefund && (
                <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs'>
                    <div className='bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900 flex items-center gap-2'>
                                <ShieldCheck size={18} className='text-purple-600' />
                                Multi-Department Verification & Approval
                            </h3>
                            <button type='button' onClick={() => setIsProcessModalOpen(false)} className='text-slate-400'>
                                <X size={20} />
                            </button>
                        </div>

                        <div className='p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100'>
                            <span className='font-bold text-slate-900 block text-sm'>{selectedRefund.studentName} ({selectedRefund.studentId})</span>
                            <span>Category: {selectedRefund.refundCategory} • Amount: <b>₹{Number(selectedRefund.refundAmount).toLocaleString('en-IN')}</b></span>
                            <span className='block text-slate-500 italic mt-1'>"{selectedRefund.reason}"</span>
                        </div>

                        <div className='space-y-1.5 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950'>
                            <span className='font-bold block uppercase text-[10px]'>Clearance Checklist</span>
                            <div className='flex items-center gap-2'><Check size={14} className='text-emerald-600' /> Library Dues Cleared</div>
                            <div className='flex items-center gap-2'><Check size={14} className='text-emerald-600' /> Hostel / Boarding Bed Vacated & Cleared</div>
                            <div className='flex items-center gap-2'><Check size={14} className='text-emerald-600' /> Science & IT Lab Inventory Returned</div>
                        </div>

                        <div>
                            <label className='font-bold text-slate-700 uppercase mb-1 block text-xs'>Approval / Endorsement Remarks *</label>
                            <textarea
                                rows={2}
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                className='w-full rounded-xl border border-slate-200 p-2 text-xs'
                            />
                        </div>

                        <div className='flex justify-between items-center pt-2 border-t border-slate-100'>
                            <button
                                type='button'
                                onClick={() => handleAdvanceStage(selectedRefund, REFUND_STATUS.REJECTED)}
                                className='px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer'
                            >
                                Reject Refund
                            </button>
                            <div className='flex gap-2'>
                                <button type='button' onClick={() => setIsProcessModalOpen(false)} className='px-3 py-1.5 text-xs font-semibold text-slate-600'>
                                    Cancel
                                </button>
                                {selectedRefund.status === REFUND_STATUS.PENDING_ACCOUNTS && (
                                    <button
                                        type='button'
                                        onClick={() => handleAdvanceStage(selectedRefund, REFUND_STATUS.PENDING_JD)}
                                        className='px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-xs'
                                    >
                                        Verify & Forward to JD →
                                    </button>
                                )}
                                {selectedRefund.status === REFUND_STATUS.PENDING_JD && (
                                    <button
                                        type='button'
                                        onClick={() => handleAdvanceStage(selectedRefund, REFUND_STATUS.APPROVED)}
                                        className='px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl cursor-pointer shadow-xs'
                                    >
                                        Sanction Approved ✓
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Disburse Refund Payment */}
            {isDisburseModalOpen && selectedRefund && (
                <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs'>
                    <div className='bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-emerald-800 flex items-center gap-2'>
                                <DollarSign size={20} className='text-emerald-600' />
                                Disburse Refund & Issue Payment Voucher
                            </h3>
                            <button type='button' onClick={() => setIsDisburseModalOpen(false)} className='text-slate-400'>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleDisburseSubmit} className='space-y-3.5 text-xs'>
                            <div className='p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl'>
                                <span className='font-bold text-emerald-950 block text-sm'>
                                    Sanctioned Amount: ₹{Number(selectedRefund.refundAmount).toLocaleString('en-IN')}
                                </span>
                                <span className='text-emerald-800 block text-xs mt-0.5'>
                                    Beneficiary: {selectedRefund.studentName} ({selectedRefund.studentId})
                                </span>
                            </div>

                            <div>
                                <label className='font-bold text-slate-700 uppercase mb-1 block'>Disbursement Mode *</label>
                                <select
                                    value={disburseData.disbursementMode}
                                    onChange={(e) => setDisburseData(prev => ({ ...prev, disbursementMode: e.target.value }))}
                                    className='w-full rounded-xl border border-slate-200 p-2 font-bold text-slate-800'
                                >
                                    <option value='Bank Transfer (NEFT/RTGS)'>Bank Transfer (NEFT / RTGS)</option>
                                    <option value='Cheque'>Cheque Payment</option>
                                    <option value='Credit Note / Fee Adjustment'>Credit Note / Fee Adjustment</option>
                                </select>
                            </div>

                            {disburseData.disbursementMode === 'Bank Transfer (NEFT/RTGS)' && (
                                <div>
                                    <label className='font-bold text-slate-700 uppercase mb-1 block'>UTR / Bank Reference Number *</label>
                                    <input
                                        type='text'
                                        required
                                        value={disburseData.transactionReference}
                                        onChange={(e) => setDisburseData(prev => ({ ...prev, transactionReference: e.target.value }))}
                                        className='w-full rounded-xl border border-slate-200 p-2 font-mono font-bold'
                                    />
                                </div>
                            )}

                            {disburseData.disbursementMode === 'Cheque' && (
                                <div>
                                    <label className='font-bold text-slate-700 uppercase mb-1 block'>Cheque Number *</label>
                                    <input
                                        type='text'
                                        required
                                        placeholder='e.g. CHQ-2026-881942'
                                        value={disburseData.chequeNumber}
                                        onChange={(e) => setDisburseData(prev => ({ ...prev, chequeNumber: e.target.value }))}
                                        className='w-full rounded-xl border border-slate-200 p-2 font-mono font-bold'
                                    />
                                </div>
                            )}

                            {disburseData.disbursementMode === 'Credit Note / Fee Adjustment' && (
                                <div className='p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900'>
                                    <span className='font-bold block'>Credit Adjustment Policy</span>
                                    <span>Credit note of ₹{Number(selectedRefund.refundAmount).toLocaleString('en-IN')} will be credited against the student's next academic term fee installment.</span>
                                </div>
                            )}

                            <div>
                                <label className='font-bold text-slate-700 uppercase mb-1 block'>Treasury Remarks</label>
                                <input
                                    type='text'
                                    value={disburseData.remarks}
                                    onChange={(e) => setDisburseData(prev => ({ ...prev, remarks: e.target.value }))}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button type='button' onClick={() => setIsDisburseModalOpen(false)} className='px-4 py-2 font-semibold text-slate-600'>
                                    Cancel
                                </button>
                                <button type='submit' className='px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer shadow-xs'>
                                    Confirm Disbursement & Issue Voucher
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default RefundsManagementTab
