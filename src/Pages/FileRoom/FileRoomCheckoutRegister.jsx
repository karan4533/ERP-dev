import React, { useEffect, useState, useMemo } from 'react'
import {
    ArrowRightLeft,
    Plus,
    Calendar,
    Clock,
    CheckCircle2,
    AlertTriangle,
    RotateCcw,
    Search,
    RefreshCw,
    Archive,
    UserCheck,
    X,
    Filter,
    PackagePlus,
    Paperclip,
    Send,
    ShieldCheck
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { fileRoomService } from '../../services/modules/fileRoomService'

const FileRoomCheckoutRegister = () => {
    const [activeTab, setActiveTab] = useState('OUTWARD') // OUTWARD, INWARD
    const [outwardList, setOutwardList] = useState([])
    const [inwardList, setInwardList] = useState([])
    const [availableFiles, setAvailableFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL') // ALL, Issued, Overdue, Returned, Non-Returnable
    const [showIssueModal, setShowIssueModal] = useState(false)
    const [showReturnModal, setShowReturnModal] = useState(false)
    const [showInwardModal, setShowInwardModal] = useState(false)
    const [returningIssue, setReturningIssue] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    // Form states
    const [issueForm, setIssueForm] = useState({
        fileId: '',
        requestedById: 'EMP-TCH-041',
        requestedByName: 'M. Anand',
        department: 'Academics',
        departmentHeadApprover: 'Dr. Aruna Ramesh (Academic Dean)',
        departmentHeadApprovalStatus: 'Approved',
        isReturnable: 'Returnable',
        purpose: 'Term Examination Tabulation Cross-Verification',
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        approvalRole: 'principal',
        acknowledgementAttachment: null,
    })

    const [returnForm, setReturnForm] = useState({
        returnCondition: 'Good',
        custodianInspectionNotes: 'Verified all internal annexures intact.',
    })

    const [inwardForm, setInwardForm] = useState({
        fileName: '',
        receivedFrom: '',
        department: 'Administration',
        receivedByCustodian: 'K. Rajendran (File Room In-charge)',
        documentCount: 1,
        physicalCondition: 'Good',
        storageRackAssigned: 'Rack A, Shelf 01',
        remarks: 'Physical files deposited into file archive custody.',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const [outwardRes, inwardRes, filesRes] = await Promise.all([
                fileRoomService.getOutwardRegister(),
                fileRoomService.getInwardRegister(),
                fileRoomService.getFiles(),
            ])

            if (outwardRes.success && Array.isArray(outwardRes.data)) {
                setOutwardList(outwardRes.data)
            }
            if (inwardRes.success && Array.isArray(inwardRes.data)) {
                setInwardList(inwardRes.data)
            }
            if (filesRes.success && Array.isArray(filesRes.data)) {
                setAvailableFiles(filesRes.data.filter((f) => f.currentLocationStatus !== 'Checked Out / Issued'))
                if (filesRes.data.length > 0 && !issueForm.fileId) {
                    setIssueForm((prev) => ({ ...prev, fileId: filesRes.data[0].id }))
                }
            }
        } catch (err) {
            console.error('Failed to load checkout register:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredOutward = useMemo(() => {
        return outwardList.filter((item) => {
            let matchesStatus = true
            if (statusFilter === 'Non-Returnable') {
                matchesStatus = item.isReturnable === 'Non-Returnable' || item.status === 'Dispatched / Non-Returnable'
            } else if (statusFilter !== 'ALL') {
                matchesStatus = item.status === statusFilter
            }

            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                item.fileName?.toLowerCase().includes(q) ||
                item.requestedByName?.toLowerCase().includes(q) ||
                item.department?.toLowerCase().includes(q) ||
                item.fileId?.toLowerCase().includes(q) ||
                item.departmentHeadApprover?.toLowerCase().includes(q)

            return matchesStatus && matchesSearch
        })
    }, [outwardList, statusFilter, searchQuery])

    const filteredInward = useMemo(() => {
        return inwardList.filter((item) => {
            const q = searchQuery.toLowerCase().trim()
            return (
                !q ||
                item.fileName?.toLowerCase().includes(q) ||
                item.receivedFrom?.toLowerCase().includes(q) ||
                item.department?.toLowerCase().includes(q)
            )
        })
    }, [inwardList, searchQuery])

    const handleAcknowledgementUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 10 * 1024 * 1024) {
            alert('File size exceeds 10MB limit.')
            return
        }
        setIssueForm((prev) => ({
            ...prev,
            acknowledgementAttachment: {
                fileName: file.name,
                fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                mimeType: file.type || 'application/pdf',
                uploadedAt: new Date().toISOString(),
            },
        }))
    }

    const handleIssueSubmit = async (e) => {
        e.preventDefault()
        if (!issueForm.fileId || !issueForm.requestedByName || !issueForm.purpose) {
            alert('Please fill in borrower name, purpose, and target file.')
            return
        }

        try {
            const res = await fileRoomService.requestCheckout(issueForm)
            if (res.success) {
                const isNonRet = issueForm.isReturnable === 'Non-Returnable'
                setFeedbackMessage(
                    isNonRet
                        ? `File dispatched as Non-Returnable to ${issueForm.requestedByName}.`
                        : `File issued to ${issueForm.requestedByName}. Due: ${issueForm.expectedReturnDate}.`
                )
                setTimeout(() => setFeedbackMessage(''), 4500)
                setShowIssueModal(false)
                setIssueForm({
                    fileId: availableFiles[0]?.id || '',
                    requestedById: 'EMP-TCH-041',
                    requestedByName: 'M. Anand',
                    department: 'Academics',
                    departmentHeadApprover: 'Dr. Aruna Ramesh (Academic Dean)',
                    departmentHeadApprovalStatus: 'Approved',
                    isReturnable: 'Returnable',
                    purpose: 'Term Examination Tabulation Cross-Verification',
                    expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    approvalRole: 'principal',
                    acknowledgementAttachment: null,
                })
                loadData()
            } else {
                alert(`Error: ${res.error?.message || res.error || 'Failed to issue file'}`)
            }
        } catch (err) {
            console.error('Checkout error:', err)
            alert('Checkout error occurred.')
        }
    }

    const handleReturnSubmit = async (e) => {
        e.preventDefault()
        if (!returningIssue) return

        try {
            const res = await fileRoomService.returnPhysicalFile(returningIssue.id, {
                actualReturnDate: new Date().toISOString(),
                returnCondition: returnForm.returnCondition,
                custodianInspectionNotes: returnForm.custodianInspectionNotes,
            })
            if (res.success) {
                setFeedbackMessage(`File ${returningIssue.fileName} marked returned & restored to archive.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setShowReturnModal(false)
                setReturningIssue(null)
                loadData()
            }
        } catch (err) {
            console.error('Return error:', err)
            alert('Failed to return file.')
        }
    }

    const handleInwardSubmit = async (e) => {
        e.preventDefault()
        if (!inwardForm.fileName || !inwardForm.receivedFrom || !inwardForm.department) {
            alert('Please fill in file name, received from, and department.')
            return
        }

        try {
            const res = await fileRoomService.logInward(inwardForm)
            if (res.success) {
                setFeedbackMessage(`Inward deposit ${inwardForm.fileName} successfully recorded.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setShowInwardModal(false)
                setInwardForm({
                    fileName: '',
                    receivedFrom: '',
                    department: 'Administration',
                    receivedByCustodian: 'K. Rajendran (File Room In-charge)',
                    documentCount: 1,
                    physicalCondition: 'Good',
                    storageRackAssigned: 'Rack A, Shelf 01',
                    remarks: 'Physical files deposited into file archive custody.',
                })
                loadData()
            }
        } catch (err) {
            console.error('Inward log error:', err)
        }
    }

    const outwardColumns = [
        {
            key: 'fileId',
            label: 'Issue Ref / File & Policy',
            required: true,
            render: (row) => {
                const isNonReturnable = row.isReturnable === 'Non-Returnable' || row.status === 'Dispatched / Non-Returnable'
                return (
                    <div>
                        <div className='font-bold text-slate-900 text-xs'>{row.fileName}</div>
                        <div className='flex items-center gap-1.5 mt-1'>
                            <span className='font-mono text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded'>
                                {row.fileId}
                            </span>
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    isNonReturnable
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                            >
                                {isNonReturnable ? 'Non-Returnable' : 'Returnable Loan'}
                            </span>
                        </div>
                    </div>
                )
            },
        },
        {
            key: 'requestedByName',
            label: 'Staff Requester & Dept Head Approver',
            required: true,
            render: (row) => (
                <div className='text-xs space-y-0.5'>
                    <div className='font-semibold text-slate-900 flex items-center gap-1.5'>
                        <span>{row.requestedByName}</span>
                        <span className='font-mono text-[10px] text-slate-400'>({row.requestedById || 'STAFF'})</span>
                    </div>
                    <div className='text-[11px] text-slate-500'>Dept: {row.department}</div>
                    <div className='text-[10px] flex items-center gap-1 text-teal-700 font-medium'>
                        <ShieldCheck className='w-3 h-3 text-teal-600' />
                        <span>HOD: {row.departmentHeadApprover || 'Approved by Dept Head'}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'acknowledgement',
            label: 'Acknowledgement Stub',
            required: true,
            render: (row) => (
                <div>
                    {row.acknowledgementAttachment ? (
                        <div className='flex items-center gap-1.5 text-xs text-teal-700 font-medium bg-teal-50/80 px-2 py-1 rounded-lg border border-teal-200 max-w-[150px] truncate'>
                            <Paperclip className='w-3.5 h-3.5 shrink-0 text-teal-600' />
                            <span className='truncate' title={row.acknowledgementAttachment.fileName}>
                                {row.acknowledgementAttachment.fileName}
                            </span>
                        </div>
                    ) : (
                        <span className='text-[11px] text-slate-400'>No attachment</span>
                    )}
                </div>
            ),
        },
        {
            key: 'expectedReturnDate',
            label: 'Return Due Date',
            required: true,
            render: (row) => {
                const isNonReturnable = row.isReturnable === 'Non-Returnable' || row.status === 'Dispatched / Non-Returnable'
                if (isNonReturnable) {
                    return (
                        <div className='text-xs'>
                            <span className='font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100'>
                                Permanent Issue
                            </span>
                            <div className='text-[10px] text-slate-400 mt-0.5 font-mono'>
                                Dispatched: {row.issueDateTime?.split('T')[0]}
                            </div>
                        </div>
                    )
                }

                const today = new Date().toISOString().split('T')[0]
                const isOverdue = row.status === 'Issued' && row.expectedReturnDate && row.expectedReturnDate < today
                return (
                    <div>
                        <div className='flex items-center gap-1.5 font-mono text-xs'>
                            <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
                            <span className={isOverdue ? 'text-rose-700 font-bold' : 'text-slate-800'}>
                                {row.expectedReturnDate || 'N/A'}
                            </span>
                        </div>
                        <span className='text-[10px] text-slate-400'>Issued: {row.issueDateTime?.split('T')[0]}</span>
                    </div>
                )
            },
        },
        {
            key: 'status',
            label: 'Status',
            required: true,
            render: (row) => {
                const isNonReturnable = row.isReturnable === 'Non-Returnable' || row.status === 'Dispatched / Non-Returnable'
                if (isNonReturnable) {
                    return (
                        <span className='px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200'>
                            Dispatched / Non-Returnable
                        </span>
                    )
                }
                return (
                    <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            row.status === 'Overdue'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : row.status === 'Issued'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-emerald-100 text-emerald-800'
                        }`}
                    >
                        {row.status}
                    </span>
                )
            },
        },
        {
            key: 'actions',
            label: 'Actions',
            required: true,
            render: (row) => {
                const isNonReturnable = row.isReturnable === 'Non-Returnable' || row.status === 'Dispatched / Non-Returnable'
                if (isNonReturnable) {
                    return <span className='text-[11px] text-slate-400 font-medium'>No Return Required</span>
                }
                return (
                    <div>
                        {row.status !== 'Returned' ? (
                            <button
                                type='button'
                                onClick={() => {
                                    setReturningIssue(row)
                                    setShowReturnModal(true)
                                }}
                                className='inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold transition-colors shadow-xs'
                            >
                                <RotateCcw className='w-3 h-3' />
                                Process Return
                            </button>
                        ) : (
                            <span className='text-[11px] text-emerald-700 font-semibold flex items-center gap-1'>
                                <CheckCircle2 className='w-3 h-3' /> Returned
                            </span>
                        )}
                    </div>
                )
            },
        },
    ]

    const inwardColumns = [
        {
            key: 'inwardDate',
            label: 'Deposit Date',
            required: true,
            render: (row) => (
                <span className='font-mono text-xs font-semibold text-slate-800'>
                    {row.inwardDate?.split('T')[0]}
                </span>
            ),
        },
        {
            key: 'fileName',
            label: 'Document Title & Origin',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-bold text-slate-900 text-xs'>{row.fileName}</div>
                    <div className='text-[11px] text-slate-500 mt-0.5'>
                        From: <span className='font-medium text-slate-700'>{row.receivedFrom}</span> ({row.department})
                    </div>
                </div>
            ),
        },
        {
            key: 'documentCount',
            label: 'Qty',
            required: true,
            render: (row) => <span className='font-mono text-xs font-semibold text-slate-700'>{row.documentCount || 1}</span>,
        },
        {
            key: 'storageRackAssigned',
            label: 'Assigned Storage Coordinates',
            required: true,
            render: (row) => (
                <span className='font-mono text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded'>
                    {row.storageRackAssigned}
                </span>
            ),
        },
        {
            key: 'physicalCondition',
            label: 'Condition Checked',
            required: true,
            render: (row) => <StatusBadge status={row.physicalCondition} />,
        },
    ]

    return (
        <section className='space-y-6 p-1'>
            {/* Header */}
            <div className='rounded-2xl bg-white p-5 border border-slate-200 shadow-xs'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700'>
                            <ArrowRightLeft className='w-4 h-4' />
                            Circulation &amp; Chain of Custody
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Issue &amp; Return Checkout Registry
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Rigorous tracking of physical file borrowing, returnable vs non-returnable status, staff requester with department head approver, acknowledgement stubs, and condition audits.
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={loadData}
                            className='inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            type='button'
                            onClick={() => setShowInwardModal(true)}
                            className='inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <PackagePlus className='w-3.5 h-3.5' />
                            Log Inward Deposit
                        </button>
                        <button
                            type='button'
                            onClick={() => setShowIssueModal(true)}
                            className='inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Issue File (Checkout)
                        </button>
                    </div>
                </div>

                {feedbackMessage && (
                    <div className='mt-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800 flex items-center gap-2'>
                        <CheckCircle2 className='w-4 h-4 text-teal-600' />
                        {feedbackMessage}
                    </div>
                )}
            </div>

            {/* Tab Navigation & Filters */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3'>
                <div className='flex flex-wrap items-center justify-between gap-4'>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={() => setActiveTab('OUTWARD')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                                activeTab === 'OUTWARD'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                            Outward Issues ({outwardList.length})
                        </button>
                        <button
                            type='button'
                            onClick={() => setActiveTab('INWARD')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                                activeTab === 'INWARD'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                            Inward Deposit Register ({inwardList.length})
                        </button>
                    </div>

                    <div className='relative w-full md:w-64'>
                        <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search borrower, file, or dept...'
                            className='w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        />
                    </div>
                </div>

                {activeTab === 'OUTWARD' && (
                    <div className='flex items-center gap-2 pt-2 border-t border-slate-100'>
                        <span className='text-xs font-medium text-slate-500'>Filter Status:</span>
                        {['ALL', 'Issued', 'Overdue', 'Returned', 'Non-Returnable'].map((st) => (
                            <button
                                key={st}
                                type='button'
                                onClick={() => setStatusFilter(st)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                    statusFilter === st
                                        ? 'bg-teal-700 text-white'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Table View */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        {activeTab === 'OUTWARD'
                            ? `Active & Historic File Loans (${filteredOutward.length})`
                            : `Inward Deposit Register (${filteredInward.length})`}
                    </h2>
                </div>
                <div className='p-2'>
                    {activeTab === 'OUTWARD' ? (
                        <DataTable
                            columns={outwardColumns}
                            data={filteredOutward}
                            emptyMessage='No outward checkout records match the criteria.'
                        />
                    ) : (
                        <DataTable
                            columns={inwardColumns}
                            data={filteredInward}
                            emptyMessage='No inward deposit records found.'
                        />
                    )}
                </div>
            </div>

            {/* Issue File (Checkout) Modal */}
            {showIssueModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-base font-bold text-slate-900'>Issue Physical File (Outward Loan)</h3>
                                <p className='text-xs text-slate-500 mt-0.5'>Record custodian issuance, loan terms, and acknowledgement stub</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setShowIssueModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        <form onSubmit={handleIssueSubmit} className='mt-4 space-y-4 text-xs'>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Select Physical File *</label>
                                <select
                                    value={issueForm.fileId}
                                    onChange={(e) => setIssueForm({ ...issueForm, fileId: e.target.value })}
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white'
                                >
                                    {availableFiles.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.fileRefNo} — {f.fileName} ({f.confidentiality})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Returnable vs Non-Returnable Selection */}
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2'>
                                <label className='block font-semibold text-slate-800'>Loan Policy (Returnable vs Non-Returnable) *</label>
                                <div className='grid grid-cols-2 gap-2'>
                                    <label
                                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                            issueForm.isReturnable === 'Returnable'
                                                ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                                                : 'bg-white border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        <input
                                            type='radio'
                                            name='returnPolicy'
                                            value='Returnable'
                                            checked={issueForm.isReturnable === 'Returnable'}
                                            onChange={() =>
                                                setIssueForm((prev) => ({
                                                    ...prev,
                                                    isReturnable: 'Returnable',
                                                    expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                                }))
                                            }
                                            className='text-teal-600 focus:ring-teal-500'
                                        />
                                        <span>Returnable Loan</span>
                                    </label>

                                    <label
                                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                            issueForm.isReturnable === 'Non-Returnable'
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold'
                                                : 'bg-white border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        <input
                                            type='radio'
                                            name='returnPolicy'
                                            value='Non-Returnable'
                                            checked={issueForm.isReturnable === 'Non-Returnable'}
                                            onChange={() =>
                                                setIssueForm((prev) => ({
                                                    ...prev,
                                                    isReturnable: 'Non-Returnable',
                                                    expectedReturnDate: '',
                                                }))
                                            }
                                            className='text-indigo-600 focus:ring-indigo-500'
                                        />
                                        <span>Non-Returnable (Permanent)</span>
                                    </label>
                                </div>
                                <span className='text-[11px] text-slate-500 block'>
                                    {issueForm.isReturnable === 'Non-Returnable'
                                        ? 'File will be permanently dispatched. Return date tracking is disabled.'
                                        : 'Temporary borrow loan requiring expected return date and condition inspection.'}
                                </span>
                            </div>

                            {/* Staff Requester & Department Head Approver */}
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Staff Requester Name *</label>
                                    <input
                                        type='text'
                                        required
                                        value={issueForm.requestedByName}
                                        onChange={(e) => setIssueForm({ ...issueForm, requestedByName: e.target.value })}
                                        placeholder='e.g. M. Anand'
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Staff ID / Employee Code</label>
                                    <input
                                        type='text'
                                        value={issueForm.requestedById}
                                        onChange={(e) => setIssueForm({ ...issueForm, requestedById: e.target.value })}
                                        placeholder='e.g. EMP-TCH-041'
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 font-mono'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Borrower Department *</label>
                                    <select
                                        value={issueForm.department}
                                        onChange={(e) => setIssueForm({ ...issueForm, department: e.target.value })}
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
                                        value={issueForm.departmentHeadApprover}
                                        onChange={(e) => setIssueForm({ ...issueForm, departmentHeadApprover: e.target.value })}
                                        placeholder='e.g. Dr. Aruna Ramesh (Academic Dean)'
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Official Purpose of Borrowing *</label>
                                <textarea
                                    rows={2}
                                    required
                                    value={issueForm.purpose}
                                    onChange={(e) => setIssueForm({ ...issueForm, purpose: e.target.value })}
                                    placeholder='State specific audit, review, or administrative purpose...'
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>
                                        Expected Return Date {issueForm.isReturnable === 'Returnable' ? '*' : '(Disabled)'}
                                    </label>
                                    <input
                                        type='date'
                                        disabled={issueForm.isReturnable === 'Non-Returnable'}
                                        required={issueForm.isReturnable === 'Returnable'}
                                        value={issueForm.expectedReturnDate}
                                        onChange={(e) => setIssueForm({ ...issueForm, expectedReturnDate: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-xl border border-slate-200 ${
                                            issueForm.isReturnable === 'Non-Returnable'
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'focus:ring-2 focus:ring-teal-500 bg-white'
                                        }`}
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Authorized Sign-off Role</label>
                                    <select
                                        value={issueForm.approvalRole}
                                        onChange={(e) => setIssueForm({ ...issueForm, approvalRole: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white'
                                    >
                                        <option value='principal'>Principal / HOD</option>
                                        <option value='director'>Managing Director (MD)</option>
                                        <option value='jointdirector'>Joint Director (JD)</option>
                                        <option value='superadmin'>Super Admin</option>
                                    </select>
                                </div>
                            </div>

                            {/* Acknowledgement File Upload (Receipt stub or Email Copy) */}
                            <div className='p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2'>
                                <label className='block font-bold text-slate-800 flex items-center gap-1.5'>
                                    <Paperclip className='w-3.5 h-3.5 text-teal-600' />
                                    Upload Acknowledgement (e.g. Email Copy, Signed Requisition Slip, Delivery Challan)
                                </label>
                                <input
                                    type='file'
                                    accept='.pdf,.jpg,.jpeg,.png,.doc,.docx,.msg,.eml'
                                    onChange={handleAcknowledgementUpload}
                                    className='block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100'
                                />
                                {issueForm.acknowledgementAttachment && (
                                    <div className='text-[11px] text-teal-800 font-medium flex items-center gap-1.5 bg-white p-2 rounded border border-teal-100'>
                                        <CheckCircle2 className='w-3.5 h-3.5 text-teal-600 shrink-0' />
                                        <span>Attached: <strong>{issueForm.acknowledgementAttachment.fileName}</strong> ({issueForm.acknowledgementAttachment.fileSize})</span>
                                    </div>
                                )}
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowIssueModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs flex items-center gap-1.5'
                                >
                                    <Send className='w-3.5 h-3.5' />
                                    Confirm Issue &amp; Handover
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Process Return Modal */}
            {showReturnModal && returningIssue && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-sm font-bold text-slate-900'>Confirm File Return to Archive</h3>
                                <p className='text-xs text-slate-500 mt-0.5'>{returningIssue.fileName}</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setShowReturnModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <form onSubmit={handleReturnSubmit} className='mt-4 space-y-4 text-xs'>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Physical Return Condition *</label>
                                <select
                                    value={returnForm.returnCondition}
                                    onChange={(e) => setReturnForm({ ...returnForm, returnCondition: e.target.value })}
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white'
                                >
                                    <option value='Mint'>Mint (Perfect Condition)</option>
                                    <option value='Good'>Good (Normal Wear)</option>
                                    <option value='Fair'>Fair (Minor Wear)</option>
                                    <option value='Damaged / Pages Missing'>Damaged / Binding Required</option>
                                </select>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Custodian Inspection Remarks</label>
                                <textarea
                                    rows={3}
                                    value={returnForm.custodianInspectionNotes}
                                    onChange={(e) => setReturnForm({ ...returnForm, custodianInspectionNotes: e.target.value })}
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowReturnModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Confirm Return &amp; Relock in Vault
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Inward Deposit Modal */}
            {showInwardModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <h3 className='text-base font-bold text-slate-900'>Log Inward Document / Courier Intake</h3>
                            <button
                                type='button'
                                onClick={() => setShowInwardModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <form onSubmit={handleInwardSubmit} className='mt-4 space-y-4 text-xs'>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Document / Parcel Title *</label>
                                <input
                                    type='text'
                                    required
                                    value={inwardForm.fileName}
                                    onChange={(e) => setInwardForm({ ...inwardForm, fileName: e.target.value })}
                                    placeholder='e.g. CBSE Affiliation Inspection Dossier 2026'
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Received From (Person / Courier) *</label>
                                    <input
                                        type='text'
                                        required
                                        value={inwardForm.receivedFrom}
                                        onChange={(e) => setInwardForm({ ...inwardForm, receivedFrom: e.target.value })}
                                        placeholder='e.g. Speed Post / PRO Office'
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Origin Department *</label>
                                    <input
                                        type='text'
                                        required
                                        value={inwardForm.department}
                                        onChange={(e) => setInwardForm({ ...inwardForm, department: e.target.value })}
                                        placeholder='e.g. Administration'
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Assigned Storage Coordinates</label>
                                    <input
                                        type='text'
                                        value={inwardForm.storageRackAssigned}
                                        onChange={(e) => setInwardForm({ ...inwardForm, storageRackAssigned: e.target.value })}
                                        placeholder='Rack A, Shelf 01'
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 font-mono'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Physical Condition</label>
                                    <select
                                        value={inwardForm.physicalCondition}
                                        onChange={(e) => setInwardForm({ ...inwardForm, physicalCondition: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white'
                                    >
                                        <option value='Mint'>Mint</option>
                                        <option value='Good'>Good</option>
                                        <option value='Fair'>Fair</option>
                                        <option value='Fragile / Damaged'>Fragile / Damaged</option>
                                    </select>
                                </div>
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowInwardModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Save Inward Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}

export default FileRoomCheckoutRegister
