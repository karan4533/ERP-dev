import React, { useEffect, useState, useMemo } from 'react'
import {
    ClipboardCheck,
    Lock,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    UserCheck,
    Search,
    RefreshCw,
    Building2,
    Calendar,
    Clock,
    X,
    Check,
    Plus,
    Send,
    ShieldCheck
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { fileRoomService } from '../../services/modules/fileRoomService'
import { useAuth } from '../../context/AuthContext'

const EXCLUDED_CATEGORIES = [
    'Student Academic & Cumulative Records',
    'Student Transfer Certificates (TC) & Clearance Stubs',
    'Staff Dossiers, Service Books & Police Verifications',
]

const INITIAL_REQUESTS = [
    {
        id: 'REQ-FLR-2026-001',
        fileId: 'FILE-2026-005',
        fileRefNo: 'LEGAL/CAMPUS/2026/DEED-01',
        fileName: 'Institutional Land Ownership Title Deeds, Patta & DTCP Approvals',
        category: 'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
        confidentiality: 'Strictly Confidential / MD Approval Only',
        requestedById: 'EMP-ADM-004',
        requestedByName: 'R. Vijayaraghavan',
        department: 'Administration',
        departmentHeadApprover: 'K. Narayanaswamy (Admin Head)',
        departmentHeadApprovalStatus: 'Approved',
        purpose: 'Annual statutory land ceiling verification for CBSE renewal',
        requestDate: '2026-03-01',
        status: 'Pending Approval',
        approvalRequired: 'Managing Director',
        approvedBy: null,
        approvalTimestamp: null,
        isReturnable: 'Returnable',
    },
    {
        id: 'REQ-FLR-2026-002',
        fileId: 'FILE-2026-001',
        fileRefNo: 'EXAM/CBSE/X/2025-26/TAB-01',
        fileName: 'Grade 10 CBSE Board Examination Tabulation Register',
        category: 'Examination Tabulation & Result Sheets',
        confidentiality: 'Executive Confidential (HOD / JD Sign-off)',
        requestedById: 'EMP-TCH-008',
        requestedByName: 'M. Anand',
        department: 'Academics',
        departmentHeadApprover: 'Dr. Aruna Ramesh (Academic Dean)',
        departmentHeadApprovalStatus: 'Approved',
        purpose: 'Cross-verifying subject average percentiles for term review',
        requestDate: '2026-03-08',
        status: 'Pending Approval',
        approvalRequired: 'Joint Director',
        approvedBy: null,
        approvalTimestamp: null,
        isReturnable: 'Returnable',
    },
    {
        id: 'REQ-FLR-2026-003',
        fileId: 'FILE-2026-002',
        fileRefNo: 'FIN/AUDIT/2024-25/LED-01',
        fileName: 'Statutory Financial Audit Day Book & General Ledger',
        category: 'Financial Audit Registers, Ledgers & Vouchers',
        confidentiality: 'Department Restricted',
        requestedById: 'EMP-FIN-019',
        requestedByName: 'S. Ramanathan',
        department: 'Finance',
        departmentHeadApprover: 'P. Sundaram (Finance Head)',
        departmentHeadApprovalStatus: 'Pending Dept Head',
        purpose: 'Quarterly balance reconciliation for External Auditor',
        requestDate: '2026-03-11',
        status: 'Pending Dept Head',
        approvalRequired: 'Department Head',
        approvedBy: null,
        approvalTimestamp: null,
        isReturnable: 'Returnable',
    },
]

const FileRoomAccessApprovals = () => {
    const { role: authRole } = useAuth()
    const isMdOrSuperAdmin = authRole === 'director' || authRole === 'superadmin'

    const [requests, setRequests] = useState(() => {
        const saved = localStorage.getItem('fileroom_access_requests')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.filter((r) => !EXCLUDED_CATEGORIES.includes(r.category))
                }
            } catch (err) {
                console.warn('Failed to parse access requests:', err)
            }
        }
        return INITIAL_REQUESTS
    })

    const [statusFilter, setStatusFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [decisionModal, setDecisionModal] = useState(null)
    const [decisionType, setDecisionType] = useState('APPROVE') // APPROVE, REJECT
    const [decisionNotes, setDecisionNotes] = useState('')
    const [mdAuthorizedOverride, setMdAuthorizedOverride] = useState(false)
    const [showRaiseModal, setShowRaiseModal] = useState(false)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    // Form to raise new access request
    const [newRequestForm, setNewRequestForm] = useState({
        fileRefNo: '',
        fileName: '',
        category: 'Examination Tabulation & Result Sheets',
        confidentiality: 'Standard / Public',
        requestedById: 'EMP-TCH-041',
        requestedByName: 'M. Anand',
        department: 'Academics',
        departmentHeadApprover: 'Dr. Aruna Ramesh (Academic Dean)',
        purpose: '',
        isReturnable: 'Returnable',
    })

    useEffect(() => {
        localStorage.setItem('fileroom_access_requests', JSON.stringify(requests))
    }, [requests])

    const filteredRequests = useMemo(() => {
        return requests.filter((r) => {
            // Exclude student and staff categories
            if (EXCLUDED_CATEGORIES.includes(r.category)) return false

            const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                r.fileName?.toLowerCase().includes(q) ||
                r.fileRefNo?.toLowerCase().includes(q) ||
                r.requestedByName?.toLowerCase().includes(q) ||
                r.department?.toLowerCase().includes(q) ||
                r.departmentHeadApprover?.toLowerCase().includes(q)

            return matchesStatus && matchesSearch
        })
    }, [requests, statusFilter, searchQuery])

    const handleExecuteDecision = (e) => {
        e.preventDefault()
        if (!decisionModal) return

        const isStrictlyConfidential = decisionModal.confidentiality?.includes('MD Approval Only')

        // If it's Department Head stage
        if (decisionModal.status === 'Pending Dept Head') {
            const nextStatus = decisionType === 'APPROVE' ? 'Pending Approval' : 'Rejected'
            const hodStatus = decisionType === 'APPROVE' ? 'Approved' : 'Rejected'
            setRequests((prev) =>
                prev.map((r) => {
                    if (r.id === decisionModal.id) {
                        return {
                            ...r,
                            status: nextStatus,
                            departmentHeadApprovalStatus: hodStatus,
                            decisionNotes,
                            updatedAt: new Date().toISOString(),
                        }
                    }
                    return r
                })
            )
            setFeedbackMessage(
                `Department Head ${decisionType === 'APPROVE' ? 'Approved' : 'Rejected'} request ${decisionModal.id}.`
            )
            setTimeout(() => setFeedbackMessage(''), 4000)
            setDecisionModal(null)
            setDecisionNotes('')
            return
        }

        // Custodian / MD approval stage
        if (decisionType === 'APPROVE' && isStrictlyConfidential && !isMdOrSuperAdmin && !mdAuthorizedOverride) {
            alert('Cannot approve: Strictly Confidential files require explicit Managing Director (MD) sign-off.')
            return
        }

        const approverName = isMdOrSuperAdmin
            ? 'Dr. V. Thirunavukkarasu (Managing Director)'
            : 'Designated Approving Authority'

        setRequests((prev) =>
            prev.map((r) => {
                if (r.id === decisionModal.id) {
                    return {
                        ...r,
                        status: decisionType === 'APPROVE' ? 'Approved' : 'Rejected',
                        approvedBy: decisionType === 'APPROVE' ? approverName : null,
                        approvalTimestamp: new Date().toISOString(),
                        decisionNotes,
                    }
                }
                return r
            })
        )

        setFeedbackMessage(
            `Request ${decisionModal.id} has been ${decisionType === 'APPROVE' ? 'Approved' : 'Rejected'}.`
        )
        setTimeout(() => setFeedbackMessage(''), 4000)
        setDecisionModal(null)
        setDecisionNotes('')
        setMdAuthorizedOverride(false)
    }

    const handleRaiseSubmit = async (e) => {
        e.preventDefault()
        if (!newRequestForm.fileRefNo || !newRequestForm.fileName || !newRequestForm.purpose || !newRequestForm.requestedByName) {
            alert('Please fill in file reference, title, requester name, and official purpose.')
            return
        }

        const newReq = {
            id: `REQ-FLR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
            fileId: `FILE-${Math.floor(100 + Math.random() * 900)}`,
            fileRefNo: newRequestForm.fileRefNo,
            fileName: newRequestForm.fileName,
            category: newRequestForm.category,
            confidentiality: newRequestForm.confidentiality,
            requestedById: newRequestForm.requestedById || 'EMP-REQ',
            requestedByName: newRequestForm.requestedByName,
            department: newRequestForm.department,
            departmentHeadApprover: newRequestForm.departmentHeadApprover || 'Department Head',
            departmentHeadApprovalStatus: 'Pending Dept Head',
            purpose: newRequestForm.purpose,
            requestDate: new Date().toISOString().split('T')[0],
            status: 'Pending Dept Head',
            approvalRequired: newRequestForm.confidentiality?.includes('MD') ? 'Managing Director' : 'Joint Director',
            approvedBy: null,
            approvalTimestamp: null,
            isReturnable: newRequestForm.isReturnable,
        }

        setRequests((prev) => [newReq, ...prev])
        setFeedbackMessage(`Access request ${newReq.id} raised and routed to Dept Head (${newReq.departmentHeadApprover}).`)
        setTimeout(() => setFeedbackMessage(''), 4500)
        setShowRaiseModal(false)
        setNewRequestForm({
            fileRefNo: '',
            fileName: '',
            category: 'Examination Tabulation & Result Sheets',
            confidentiality: 'Standard / Public',
            requestedById: 'EMP-TCH-041',
            requestedByName: 'M. Anand',
            department: 'Academics',
            departmentHeadApprover: 'Dr. Aruna Ramesh (Academic Dean)',
            purpose: '',
            isReturnable: 'Returnable',
        })
    }

    const columns = [
        {
            key: 'fileRefNo',
            label: 'Requisition & File Ref',
            required: true,
            render: (row) => (
                <div>
                    <span className='font-mono text-xs font-bold text-slate-900'>{row.fileRefNo}</span>
                    <div className='font-mono text-[10px] text-teal-700 mt-0.5'>{row.id}</div>
                    <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border mt-1 inline-block ${
                            row.isReturnable === 'Non-Returnable'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-teal-50 text-teal-700 border-teal-200'
                        }`}
                    >
                        {row.isReturnable || 'Returnable'}
                    </span>
                </div>
            ),
        },
        {
            key: 'fileName',
            label: 'Document Title & Staff Requester',
            required: true,
            render: (row) => (
                <div className='max-w-md'>
                    <div className='font-bold text-slate-900 text-xs'>{row.fileName}</div>
                    <div className='text-[11px] text-slate-600 mt-0.5'>
                        Requester: <span className='font-semibold text-slate-800'>{row.requestedByName}</span> ({row.requestedById || 'STAFF'}) · Dept: {row.department}
                    </div>
                    <div className='text-[10px] text-teal-700 font-medium mt-0.5 flex items-center gap-1'>
                        <ShieldCheck className='w-3 h-3 text-teal-600' />
                        <span>HOD: {row.departmentHeadApprover}</span>
                        <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                row.departmentHeadApprovalStatus === 'Approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : row.departmentHeadApprovalStatus === 'Rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                            }`}
                        >
                            {row.departmentHeadApprovalStatus || 'Pending Dept Head'}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            key: 'confidentiality',
            label: 'Confidentiality & Tier',
            required: true,
            render: (row) => {
                const isStrict = row.confidentiality?.includes('MD Approval Only')
                return (
                    <div>
                        <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1 ${
                                isStrict
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                        >
                            <Lock className='w-3 h-3' />
                            {isStrict ? 'Strictly Confidential' : 'Executive'}
                        </span>
                        <div className='text-[10px] text-slate-500 mt-0.5'>
                            Requires: <span className='font-semibold'>{row.approvalRequired}</span>
                        </div>
                    </div>
                )
            },
        },
        {
            key: 'purpose',
            label: 'Purpose of Requisition',
            required: true,
            render: (row) => <span className='text-xs text-slate-700 line-clamp-2'>{row.purpose}</span>,
        },
        {
            key: 'status',
            label: 'Workflow Stage',
            required: true,
            render: (row) => {
                let badgeColor = 'bg-slate-100 text-slate-700'
                if (row.status === 'Approved') badgeColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                else if (row.status === 'Rejected') badgeColor = 'bg-rose-100 text-rose-800 border border-rose-200'
                else if (row.status === 'Pending Dept Head') badgeColor = 'bg-purple-100 text-purple-800 border border-purple-200'
                else if (row.status === 'Pending Approval') badgeColor = 'bg-amber-100 text-amber-800 border border-amber-200'

                return (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
                        {row.status}
                    </span>
                )
            },
        },
        {
            key: 'actions',
            label: 'Review Action',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5'>
                    {row.status === 'Pending Dept Head' ? (
                        <>
                            <button
                                type='button'
                                onClick={() => {
                                    setDecisionModal(row)
                                    setDecisionType('APPROVE')
                                }}
                                className='px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-xs'
                            >
                                HOD Approve
                            </button>
                            <button
                                type='button'
                                onClick={() => {
                                    setDecisionModal(row)
                                    setDecisionType('REJECT')
                                }}
                                className='px-2 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors'
                            >
                                Reject
                            </button>
                        </>
                    ) : row.status === 'Pending Approval' ? (
                        <>
                            <button
                                type='button'
                                onClick={() => {
                                    setDecisionModal(row)
                                    setDecisionType('APPROVE')
                                }}
                                className='px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                            >
                                Release
                            </button>
                            <button
                                type='button'
                                onClick={() => {
                                    setDecisionModal(row)
                                    setDecisionType('REJECT')
                                }}
                                className='px-2 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors'
                            >
                                Reject
                            </button>
                        </>
                    ) : (
                        <div className='text-[11px] text-slate-500'>
                            {row.approvedBy ? `Sign-off: ${row.approvedBy}` : 'Completed'}
                        </div>
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
                            <ClipboardCheck className='w-4 h-4' />
                            Security Governance &amp; Access Controls
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Access Requisitions &amp; Multi-Tier Approvals
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Multi-stage requisition workflow: Requisitions initiated by staff, approved by Department Heads, and verified by Custodians / Managing Director (MD) for strictly confidential dossiers.
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={() => setShowRaiseModal(true)}
                            className='inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Raise Access Requisition
                        </button>
                    </div>
                </div>

                {feedbackMessage && (
                    <div className='mt-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800 flex items-center gap-2'>
                        <CheckCircle2 className='w-4 h-4 text-teal-600 shrink-0' />
                        {feedbackMessage}
                    </div>
                )}
            </div>

            {/* Filter Bar */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div className='flex flex-wrap items-center gap-2'>
                    <span className='text-xs font-semibold text-slate-500'>Stage:</span>
                    {['ALL', 'Pending Dept Head', 'Pending Approval', 'Approved', 'Rejected'].map((st) => (
                        <button
                            key={st}
                            type='button'
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                                statusFilter === st
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>

                <div className='relative w-full md:w-64'>
                    <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search file, requester, HOD...'
                        className='w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    />
                </div>
            </div>

            {/* Requisitions Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Multi-Stage Requisition Roster ({filteredRequests.length} requests)
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredRequests}
                        emptyMessage='No access requisitions match the selected criteria.'
                    />
                </div>
            </div>

            {/* Raise Access Requisition Modal */}
            {showRaiseModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-base font-bold text-slate-900'>Raise Document Access Requisition</h3>
                                <p className='text-xs text-slate-500 mt-0.5'>Route request to Department Head for initial clearance</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setShowRaiseModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        <form onSubmit={handleRaiseSubmit} className='mt-4 space-y-4 text-xs'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>File Ref / Barcode *</label>
                                    <input
                                        type='text'
                                        required
                                        value={newRequestForm.fileRefNo}
                                        onChange={(e) => setNewRequestForm({ ...newRequestForm, fileRefNo: e.target.value })}
                                        placeholder='e.g. EXAM/CBSE/X/2026/TAB-01'
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 font-mono'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Loan Policy</label>
                                    <select
                                        value={newRequestForm.isReturnable}
                                        onChange={(e) => setNewRequestForm({ ...newRequestForm, isReturnable: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white'
                                    >
                                        <option value='Returnable'>Returnable Loan</option>
                                        <option value='Non-Returnable'>Non-Returnable (Permanent)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Physical File Title *</label>
                                <input
                                    type='text'
                                    required
                                    value={newRequestForm.fileName}
                                    onChange={(e) => setNewRequestForm({ ...newRequestForm, fileName: e.target.value })}
                                    placeholder='Descriptive title of physical dossier'
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Staff Requester Name *</label>
                                    <input
                                        type='text'
                                        required
                                        value={newRequestForm.requestedByName}
                                        onChange={(e) => setNewRequestForm({ ...newRequestForm, requestedByName: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Staff ID</label>
                                    <input
                                        type='text'
                                        value={newRequestForm.requestedById}
                                        onChange={(e) => setNewRequestForm({ ...newRequestForm, requestedById: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 font-mono'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Department *</label>
                                    <select
                                        value={newRequestForm.department}
                                        onChange={(e) => setNewRequestForm({ ...newRequestForm, department: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white'
                                    >
                                        <option value='Academics'>Academics</option>
                                        <option value='Administration'>Administration</option>
                                        <option value='HR'>HR</option>
                                        <option value='Finance'>Finance</option>
                                        <option value='Operations / Facilities'>Operations / Facilities</option>
                                        <option value='PRO'>PRO</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Department Head Approver *</label>
                                    <input
                                        type='text'
                                        required
                                        value={newRequestForm.departmentHeadApprover}
                                        onChange={(e) => setNewRequestForm({ ...newRequestForm, departmentHeadApprover: e.target.value })}
                                        placeholder='e.g. Dr. Aruna Ramesh (Academic Dean)'
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Official Purpose of Requisition *</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={newRequestForm.purpose}
                                    onChange={(e) => setNewRequestForm({ ...newRequestForm, purpose: e.target.value })}
                                    placeholder='Specify reason for requesting access to physical custody...'
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Confidentiality Level</label>
                                <select
                                    value={newRequestForm.confidentiality}
                                    onChange={(e) => setNewRequestForm({ ...newRequestForm, confidentiality: e.target.value })}
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white'
                                >
                                    <option value='Standard / Public'>Standard / Public</option>
                                    <option value='Department Restricted'>Department Restricted</option>
                                    <option value='Executive Confidential (HOD / JD Sign-off)'>Executive Confidential</option>
                                    <option value='Strictly Confidential / MD Approval Only'>Strictly Confidential / MD Approval Only</option>
                                </select>
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowRaiseModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center gap-1.5'
                                >
                                    <Send className='w-3.5 h-3.5' />
                                    Submit to Dept Head
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Approval / Rejection Decision Modal */}
            {decisionModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-sm font-bold text-slate-900'>
                                    {decisionModal.status === 'Pending Dept Head'
                                        ? `Dept Head ${decisionType === 'APPROVE' ? 'Approval' : 'Rejection'}`
                                        : `${decisionType === 'APPROVE' ? 'Release Approval' : 'Rejection'}`}
                                </h3>
                                <span className='text-[11px] font-mono text-teal-700'>{decisionModal.fileRefNo}</span>
                            </div>
                            <button
                                type='button'
                                onClick={() => setDecisionModal(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <form onSubmit={handleExecuteDecision} className='mt-4 space-y-3 text-xs'>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-100'>
                                <div className='text-slate-500 text-[11px]'>File Title:</div>
                                <div className='font-bold text-slate-900 mt-0.5'>{decisionModal.fileName}</div>
                                <div className='text-slate-500 text-[11px] mt-1'>
                                    Requester: <strong className='text-slate-800'>{decisionModal.requestedByName}</strong> ({decisionModal.department})
                                </div>
                            </div>

                            {decisionModal.confidentiality?.includes('MD Approval Only') && decisionModal.status !== 'Pending Dept Head' && (
                                <div className='p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2'>
                                    <div className='flex items-center gap-1.5 font-bold text-[11px] text-rose-900'>
                                        <Lock className='w-3.5 h-3.5 text-rose-600' />
                                        Strictly Confidential Dossier
                                    </div>
                                    <p className='text-[11px] leading-relaxed'>
                                        Institutional Land Deeds &amp; Executive Records require Managing Director (MD) sign-off.
                                    </p>
                                    {!isMdOrSuperAdmin && (
                                        <label className='flex items-center gap-2 pt-1 border-t border-rose-200 cursor-pointer'>
                                            <input
                                                type='checkbox'
                                                checked={mdAuthorizedOverride}
                                                onChange={(e) => setMdAuthorizedOverride(e.target.checked)}
                                                className='rounded text-rose-600 focus:ring-rose-500'
                                            />
                                            <span className='text-[11px] font-semibold text-rose-900'>
                                                Executive Board Written Concurrence Attached
                                            </span>
                                        </label>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Decision Rationale / Notes</label>
                                <textarea
                                    rows={2}
                                    value={decisionNotes}
                                    onChange={(e) => setDecisionNotes(e.target.value)}
                                    placeholder='Specify approval justification or rejection rationale...'
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setDecisionModal(null)}
                                    className='px-3.5 py-1.5 font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className={`px-3.5 py-1.5 font-semibold rounded-xl text-white shadow-xs ${
                                        decisionType === 'APPROVE' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    Confirm {decisionType === 'APPROVE' ? 'Approval' : 'Rejection'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}

export default FileRoomAccessApprovals
