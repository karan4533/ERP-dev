import React, { useEffect, useState, useMemo } from 'react'
import {
    Video,
    Plus,
    Calendar,
    Clock,
    Lock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ShieldCheck,
    Search,
    RefreshCw,
    X,
    Filter,
    Layers,
    ChevronRight,
    UserCheck,
    Eye,
    Paperclip,
    Download
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { cctvService } from '../../services/modules/cctvService'

const REASON_CATEGORIES = [
    'ALL',
    'Student Disciplinary Investigation',
    'Vehicular Scrape / Transport Incident',
    'Lost Property Inquiry',
    'Campus Safety / Unauthorized Trespass',
    'Staff Concern / Infrastructure Damage',
    'Sensitive Executive Incident',
]

const CctvFootageRequests = () => {
    const [requests, setRequests] = useState([])
    const [cameras, setCameras] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [stageFilter, setStageFilter] = useState('ALL')
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState(null)
    const [approvalModal, setApprovalModal] = useState(null) // { request, role }
    const [approvalDecision, setApprovalDecision] = useState(true) // true: approve, false: reject
    const [approvalRemarks, setApprovalRemarks] = useState('')
    const [reviewerName, setReviewerName] = useState('')
    const [feedbackMessage, setFeedbackMessage] = useState('')

    // Request form
    const [form, setForm] = useState({
        incidentDate: new Date().toISOString().split('T')[0],
        timeWindowStart: '08:15 AM',
        timeWindowEnd: '08:45 AM',
        cameraIds: ['CAM-01'],
        requesterId: 'EMP-TCH-008',
        requesterName: 'M. Anand (Academics Coordinator)',
        requesterRole: 'Academic Coordinator',
        department: 'Academics',
        reasonCategory: 'Student Disciplinary Investigation',
        justificationText: '',
        attachmentFileName: '',
        attachmentData: '',
        isSensitive: false,
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const [reqsRes, camsRes] = await Promise.all([
                cctvService.getFootageRequests(),
                cctvService.getCameras(),
            ])

            if (reqsRes.success && Array.isArray(reqsRes.data)) {
                setRequests(reqsRes.data)
            }
            if (camsRes.success && Array.isArray(camsRes.data)) {
                setCameras(camsRes.data)
            }
        } catch (err) {
            console.error('Failed to load footage requests:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredRequests = useMemo(() => {
        return requests.filter((r) => {
            const matchesStage = stageFilter === 'ALL' || r.currentApprovalTier === stageFilter
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                r.id.toLowerCase().includes(q) ||
                r.requesterName.toLowerCase().includes(q) ||
                r.reasonCategory.toLowerCase().includes(q) ||
                r.justificationText?.toLowerCase().includes(q)

            return matchesStage && matchesSearch
        })
    }, [requests, stageFilter, searchQuery])

    const handleCreateRequest = async (e) => {
        e.preventDefault()
        if (!form.incidentDate || !form.justificationText || form.cameraIds.length === 0) {
            alert('Please fill in required fields.')
            return
        }

        try {
            const res = await cctvService.createFootageRequest(form)
            if (res.success) {
                setRequests((prev) => [res.data, ...prev])
                setShowRequestModal(false)
                setFeedbackMessage(`Requisition ${res.data.id} submitted for Department Head review.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setForm({
                    incidentDate: new Date().toISOString().split('T')[0],
                    timeWindowStart: '08:15 AM',
                    timeWindowEnd: '08:45 AM',
                    cameraIds: ['CAM-01'],
                    requesterId: 'EMP-TCH-008',
                    requesterName: 'M. Anand (Academics Coordinator)',
                    requesterRole: 'Academic Coordinator',
                    department: 'Academics',
                    reasonCategory: 'Student Disciplinary Investigation',
                    justificationText: '',
                    attachmentFileName: '',
                    attachmentData: '',
                    isSensitive: false,
                })
            } else {
                alert(`Error: ${res.error?.message || 'Failed to submit request'}`)
            }
        } catch (err) {
            console.error('Error submitting footage request:', err)
        }
    }

    const handleApprovalSubmit = async (e) => {
        e.preventDefault()
        if (!approvalModal) return

        const { request, role } = approvalModal
        try {
            const res = await cctvService.processApprovalTier(request.id, {
                role,
                approved: approvalDecision,
                remarks: approvalRemarks || (approvalDecision ? 'Approved per SOP protocol.' : 'Rejected.'),
                reviewerName: reviewerName || `${role} Reviewer`,
            })

            if (res.success) {
                setFeedbackMessage(
                    `Tier ${role} decision recorded for ${request.id}. Next stage: ${res.data.currentApprovalTier}`
                )
                setTimeout(() => setFeedbackMessage(''), 4000)
                setApprovalModal(null)
                setApprovalRemarks('')
                setReviewerName('')
                loadData()
            } else {
                alert(`Approval Error: ${res.error?.message || 'Failed to process tier approval'}`)
            }
        } catch (err) {
            console.error('Approval tier submission failed:', err)
        }
    }

    const columns = [
        {
            key: 'id',
            label: 'Req ID & Sensitivity',
            required: true,
            render: (row) => (
                <div>
                    <span className='font-mono font-bold text-xs text-slate-900'>{row.id}</span>
                    <div className='mt-1'>
                        {row.isSensitive ? (
                            <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1'>
                                <Lock className='w-3 h-3' /> Sensitive (MD)
                            </span>
                        ) : (
                            <span className='px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600'>
                                Standard Tier
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'requesterName',
            label: 'Requester & Incident',
            required: true,
            render: (row) => (
                <div className='max-w-xs'>
                    <div className='font-bold text-slate-900 text-xs'>{row.requesterName}</div>
                    <div className='text-[11px] text-slate-500 mt-0.5'>Dept: {row.department}</div>
                    <div className='text-[11px] text-teal-700 font-medium mt-0.5'>{row.reasonCategory}</div>
                </div>
            ),
        },
        {
            key: 'incidentWindow',
            label: 'Incident Window & Cameras',
            required: true,
            render: (row) => (
                <div className='text-xs'>
                    <div className='font-mono font-medium text-slate-800'>{row.incidentDate}</div>
                    <div className='font-mono text-[11px] text-slate-500 mt-0.5'>
                        {row.timeWindowStart} - {row.timeWindowEnd}
                    </div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>
                        Cams: {Array.isArray(row.cameraIds) ? row.cameraIds.join(', ') : row.cameraIds}
                    </div>
                </div>
            ),
        },
        {
            key: 'attachment',
            label: 'Incident Attachment',
            required: false,
            render: (row) =>
                row.attachmentFileName ? (
                    <button
                        type='button'
                        onClick={(e) => {
                            e.stopPropagation()
                            alert(`Supporting Attachment:\nFilename: ${row.attachmentFileName}\nAssociated with Requisition ${row.id}`)
                        }}
                        className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-[11px] font-medium transition-colors'
                        title={`Click to view ${row.attachmentFileName}`}
                    >
                        <Paperclip className='w-3.5 h-3.5 text-teal-600' />
                        <span className='font-mono max-w-[120px] truncate'>{row.attachmentFileName}</span>
                    </button>
                ) : (
                    <span className='text-[11px] text-slate-400 font-mono'>No file</span>
                ),
        },
        {
            key: 'currentApprovalTier',
            label: 'Approval Stage',
            required: true,
            render: (row) => (
                <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        row.currentApprovalTier === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : row.currentApprovalTier === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                >
                    {row.currentApprovalTier}
                </span>
            ),
        },
        {
            key: 'approvalProgress',
            label: 'Chain Progression',
            required: true,
            render: (row) => {
                const chain = row.approvalChain || {}
                const hodOk = chain.deptHead?.status === 'Approved'
                const jdOk = chain.jointDirector?.status === 'Approved'
                const mdOk = chain.managingDirector?.status === 'Approved'

                return (
                    <div className='flex items-center gap-1.5 text-[11px] font-mono'>
                        <span className={`px-1.5 py-0.5 rounded ${hodOk ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            HOD {hodOk ? '✓' : ''}
                        </span>
                        <ChevronRight className='w-3 h-3 text-slate-300' />
                        <span className={`px-1.5 py-0.5 rounded ${jdOk ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            JD {jdOk ? '✓' : ''}
                        </span>
                        {row.isSensitive && (
                            <>
                                <ChevronRight className='w-3 h-3 text-slate-300' />
                                <span className={`px-1.5 py-0.5 rounded ${mdOk ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                                    MD {mdOk ? '✓' : ''}
                                </span>
                            </>
                        )}
                    </div>
                )
            },
        },
        {
            key: 'actions',
            label: 'Action',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5'>
                    <button
                        type='button'
                        onClick={() => setSelectedRequest(row)}
                        className='text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors'
                    >
                        Details
                    </button>

                    {/* Sequential Tier Approval buttons */}
                    {row.currentApprovalTier === 'Dept Head' && (
                        <button
                            type='button'
                            onClick={() => {
                                setApprovalModal({ request: row, role: 'HOD' })
                                setApprovalDecision(true)
                            }}
                            className='text-xs px-2.5 py-1 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold transition-colors shadow-xs'
                        >
                            HOD Review
                        </button>
                    )}

                    {row.currentApprovalTier === 'Joint Director' && (
                        <button
                            type='button'
                            onClick={() => {
                                setApprovalModal({ request: row, role: 'JD' })
                                setApprovalDecision(true)
                            }}
                            className='text-xs px-2.5 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold transition-colors shadow-xs'
                        >
                            JD Review
                        </button>
                    )}

                    {row.currentApprovalTier === 'Managing Director' && (
                        <button
                            type='button'
                            onClick={() => {
                                setApprovalModal({ request: row, role: 'MD' })
                                setApprovalDecision(true)
                            }}
                            className='text-xs px-2.5 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-semibold transition-colors shadow-xs'
                        >
                            MD Sign-off
                        </button>
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
                            <Video className='w-4 h-4' />
                            Footage Requisitions &amp; Multi-Tier Governance
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Footage Requisition &amp; Approval Workflows
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Multi-tier sequential approval chain (Requester &rarr; Dept Head &rarr; Joint Director &rarr; Managing Director) with cryptographic audit logging.
                        </p>
                    </div>
                    <div className='flex items-center gap-3'>
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
                            onClick={() => setShowRequestModal(true)}
                            className='inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            New Footage Request
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

            {/* Filter Bar */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div className='flex items-center gap-2'>
                    <span className='text-xs font-semibold text-slate-500'>Approval Stage:</span>
                    {['ALL', 'Dept Head', 'Joint Director', 'Managing Director', 'Approved', 'Rejected'].map((st) => (
                        <button
                            key={st}
                            type='button'
                            onClick={() => setStageFilter(st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                                stageFilter === st
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>

                <div className='relative w-full md:w-72'>
                    <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search request ID, requester, or reason...'
                        className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    />
                </div>
            </div>

            {/* Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Footage Requisition Records ({filteredRequests.length})
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredRequests}
                        emptyMessage='No footage requests match the current filters.'
                    />
                </div>
            </div>

            {/* New Footage Request Modal */}
            {showRequestModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <h3 className='text-base font-bold text-slate-900'>Submit CCTV Footage Requisition</h3>
                            <button
                                type='button'
                                onClick={() => setShowRequestModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRequest} className='mt-4 space-y-4'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Incident Date *</label>
                                    <input
                                        type='date'
                                        required
                                        value={form.incidentDate}
                                        onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Inquiry Category *</label>
                                    <select
                                        value={form.reasonCategory}
                                        onChange={(e) => setForm({ ...form, reasonCategory: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        {REASON_CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Time Window Start *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.timeWindowStart}
                                        onChange={(e) => setForm({ ...form, timeWindowStart: e.target.value })}
                                        placeholder='08:15 AM'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Time Window End *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.timeWindowEnd}
                                        onChange={(e) => setForm({ ...form, timeWindowEnd: e.target.value })}
                                        placeholder='08:45 AM'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Requested Cameras *</label>
                                <select
                                    multiple
                                    value={form.cameraIds}
                                    onChange={(e) => {
                                        const selected = Array.from(e.target.selectedOptions, (option) => option.value)
                                        setForm({ ...form, cameraIds: selected })
                                    }}
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden h-24'
                                >
                                    {cameras.map((cam) => (
                                        <option key={cam.id} value={cam.id}>
                                            {cam.id} — {cam.name} ({cam.zone})
                                        </option>
                                    ))}
                                </select>
                                <span className='text-[10px] text-slate-400 mt-1 block'>Hold Ctrl / Cmd to select multiple cameras</span>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Requester Full Name *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.requesterName}
                                        onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Department</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.department}
                                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Incident Summary &amp; Legal Justification *</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={form.justificationText}
                                    onChange={(e) => setForm({ ...form, justificationText: e.target.value })}
                                    placeholder='Specify why footage extraction is required and persons involved...'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Supporting Document / FIR / Incident Copy (Attachment)</label>
                                <input
                                    type='file'
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            setForm({
                                                ...form,
                                                attachmentFileName: file.name,
                                                attachmentData: `data:${file.type || 'application/pdf'};base64,mockAttachmentData_${file.name}`,
                                            })
                                        }
                                    }}
                                    className='w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer'
                                />
                                {form.attachmentFileName && (
                                    <div className='mt-2 flex items-center justify-between p-2 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-800'>
                                        <div className='flex items-center gap-1.5 font-mono truncate'>
                                            <Paperclip className='w-3.5 h-3.5 text-teal-600 shrink-0' />
                                            <span className='truncate'>{form.attachmentFileName}</span>
                                        </div>
                                        <button
                                            type='button'
                                            onClick={() => setForm({ ...form, attachmentFileName: '', attachmentData: '' })}
                                            className='text-slate-400 hover:text-rose-600'
                                        >
                                            <X className='w-3.5 h-3.5' />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-200'>
                                <label className='flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer'>
                                    <input
                                        type='checkbox'
                                        checked={form.isSensitive}
                                        onChange={(e) => setForm({ ...form, isSensitive: e.target.checked })}
                                        className='rounded text-teal-600'
                                    />
                                    Mark as Sensitive / High-Impact Case (Requires Managing Director final sign-off)
                                </label>
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowRequestModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Submit for HOD Approval
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Process Tier Approval Modal */}
            {approvalModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-sm font-bold text-slate-900'>
                                    {approvalModal.role === 'HOD' ? 'Department Head Review' : approvalModal.role === 'JD' ? 'Joint Director Review' : 'Managing Director Sign-off'}
                                </h3>
                                <p className='text-xs text-slate-500 font-mono mt-0.5'>{approvalModal.request.id}</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setApprovalModal(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <form onSubmit={handleApprovalSubmit} className='mt-4 space-y-4'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs'>
                                <div className='font-bold text-slate-900'>{approvalModal.request.reasonCategory}</div>
                                <div className='text-slate-500 mt-1'>
                                    Requester: {approvalModal.request.requesterName} ({approvalModal.request.department})
                                </div>
                                <div className='text-slate-600 mt-1 line-clamp-2'>Justification: {approvalModal.request.justificationText}</div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <button
                                    type='button'
                                    onClick={() => setApprovalDecision(true)}
                                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                                        approvalDecision
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    ✓ Approve Tier
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setApprovalDecision(false)}
                                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                                        !approvalDecision
                                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    ✗ Reject Requisition
                                </button>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Reviewer Name</label>
                                <input
                                    type='text'
                                    value={reviewerName}
                                    onChange={(e) => setReviewerName(e.target.value)}
                                    placeholder={
                                        approvalModal.role === 'HOD'
                                            ? 'Department Head'
                                            : approvalModal.role === 'JD'
                                            ? 'Dr. K. S. Sundaram (Joint Director)'
                                            : 'Dr. V. Thirunavukkarasu (Managing Director)'
                                    }
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Review Remarks &amp; Scope Constraints</label>
                                <textarea
                                    rows={2}
                                    value={approvalRemarks}
                                    onChange={(e) => setApprovalRemarks(e.target.value)}
                                    placeholder='Specify constraints, approved duration, or rejection rationale...'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setApprovalModal(null)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition-colors shadow-xs ${
                                        approvalDecision ? 'bg-teal-600 hover:bg-teal-700' : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    Confirm Decision
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Request Detail Drawer / Modal */}
            {selectedRequest && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <span className='text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded uppercase font-mono'>
                                    {selectedRequest.id}
                                </span>
                                <h3 className='text-sm font-bold text-slate-900 mt-1'>{selectedRequest.reasonCategory}</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedRequest(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-3 text-xs'>
                            <div className='grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100'>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Requester</span>
                                    <span className='font-semibold text-slate-900'>{selectedRequest.requesterName}</span>
                                    <span className='text-[10px] text-slate-400 block'>{selectedRequest.department}</span>
                                </div>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Incident Window</span>
                                    <span className='font-mono text-slate-800 font-semibold'>{selectedRequest.incidentDate}</span>
                                    <span className='text-[10px] text-slate-400 block'>{selectedRequest.timeWindowStart} - {selectedRequest.timeWindowEnd}</span>
                                </div>
                            </div>

                            <div>
                                <span className='text-slate-400 block text-[11px] font-medium'>Target Cameras</span>
                                <span className='font-mono font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded'>
                                    {Array.isArray(selectedRequest.cameraIds) ? selectedRequest.cameraIds.join(', ') : selectedRequest.cameraIds}
                                </span>
                            </div>

                            <div>
                                <span className='text-slate-400 block text-[11px] font-medium'>Justification</span>
                                <p className='text-slate-800 mt-0.5 p-2 rounded-lg bg-slate-50 border border-slate-100'>
                                    {selectedRequest.justificationText}
                                </p>
                            </div>

                            {selectedRequest.attachmentFileName && (
                                <div className='p-3 bg-teal-50/70 rounded-xl border border-teal-200 text-xs flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                        <Paperclip className='w-4 h-4 text-teal-700' />
                                        <div>
                                            <div className='font-bold text-teal-900'>Attached Incident Document</div>
                                            <div className='text-[11px] font-mono text-teal-700'>{selectedRequest.attachmentFileName}</div>
                                        </div>
                                    </div>
                                    <button
                                        type='button'
                                        onClick={() => alert(`Downloading attachment: ${selectedRequest.attachmentFileName}`)}
                                        className='px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-teal-800 hover:bg-teal-100 text-xs font-semibold flex items-center gap-1 shadow-2xs'
                                    >
                                        <Download className='w-3 h-3' /> Download
                                    </button>
                                </div>
                            )}

                            {/* Chain breakdown */}
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2'>
                                <span className='text-xs font-bold text-slate-800 uppercase tracking-wider block'>Approval Chain</span>
                                <div className='space-y-1.5'>
                                    <div className='flex items-center justify-between text-xs'>
                                        <span>Dept Head (HOD):</span>
                                        <StatusBadge status={selectedRequest.approvalChain?.deptHead?.status || 'Pending'} />
                                    </div>
                                    <div className='flex items-center justify-between text-xs'>
                                        <span>Joint Director (JD):</span>
                                        <StatusBadge status={selectedRequest.approvalChain?.jointDirector?.status || 'Pending'} />
                                    </div>
                                    {selectedRequest.isSensitive && (
                                        <div className='flex items-center justify-between text-xs'>
                                            <span>Managing Director (MD):</span>
                                            <StatusBadge status={selectedRequest.approvalChain?.managingDirector?.status || 'Pending'} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end'>
                            <button
                                type='button'
                                onClick={() => setSelectedRequest(null)}
                                className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default CctvFootageRequests
