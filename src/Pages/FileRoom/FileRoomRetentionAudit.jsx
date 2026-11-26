import React, { useEffect, useState, useMemo } from 'react'
import {
    ShieldAlert,
    Clock,
    Search,
    RefreshCw,
    Archive,
    CheckCircle2,
    AlertTriangle,
    FileCheck2,
    Calendar,
    Building2,
    Trash2,
    Printer,
    Download,
    X,
    Plus,
    FileText,
    ShieldCheck,
    Lock
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { fileRoomService } from '../../services/modules/fileRoomService'
import { useAuth } from '../../context/AuthContext'

const RETENTION_RULES = [
    'ALL',
    'Permanent Archival',
    '10 Years',
    'Retirement + 10 Years',
    '5 Years Post-Graduation',
    '3 Years Audit Clearance',
]

const DISPOSAL_METHODS = [
    'Shredding',
    'Incineration',
    'Digital Archival Only',
    'Secure Destruction',
]

const FileRoomRetentionAudit = () => {
    const { role: authRole } = useAuth()
    const isMdOrDirector = authRole === 'director' || authRole === 'superadmin'

    const [activeTab, setActiveTab] = useState('RETENTION') // RETENTION, DISPOSALS
    const [files, setFiles] = useState([])
    const [disposals, setDisposals] = useState([])
    const [loading, setLoading] = useState(true)
    const [ruleFilter, setRuleFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [feedbackMessage, setFeedbackMessage] = useState('')

    // Disposal Execution Modal
    const [disposalModalFile, setDisposalModalFile] = useState(null)
    const [disposalForm, setDisposalForm] = useState({
        disposalMethod: 'Shredding',
        scheduledDate: new Date().toISOString().split('T')[0],
        disposalDate: new Date().toISOString().split('T')[0],
        boardResolutionNo: `BOM-RES-${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`,
        authorizedBy: 'Dr. V. Thirunavukkarasu (Managing Director)',
        witnesses: 'K. Rajendran (Custodian), S. Meenakshi (Internal Auditor)',
        remarks: 'Statutory retention duration concluded. Verified no pending legal summons.',
        permanentOverrideAuthorized: false,
    })

    // Certificate Viewer Modal
    const [viewCertificate, setViewCertificate] = useState(null)

    const loadData = async () => {
        setLoading(true)
        try {
            const [filesRes, disposalsRes] = await Promise.all([
                fileRoomService.getFiles(),
                fileRoomService.getDisposals(),
            ])
            if (filesRes.success && Array.isArray(filesRes.data)) {
                setFiles(filesRes.data)
            }
            if (disposalsRes.success && Array.isArray(disposalsRes.data)) {
                setDisposals(disposalsRes.data)
            }
        } catch (err) {
            console.error('Failed to load retention records:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredFiles = useMemo(() => {
        return files.filter((f) => {
            const matchesRule = ruleFilter === 'ALL' || f.retentionRule === ruleFilter
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                f.fileRefNo?.toLowerCase().includes(q) ||
                f.fileName?.toLowerCase().includes(q) ||
                f.category?.toLowerCase().includes(q) ||
                f.ownerDepartment?.toLowerCase().includes(q)

            return matchesRule && matchesSearch
        })
    }, [files, ruleFilter, searchQuery])

    const filteredDisposals = useMemo(() => {
        return disposals.filter((d) => {
            const q = searchQuery.toLowerCase().trim()
            return (
                !q ||
                d.fileRefNo?.toLowerCase().includes(q) ||
                d.fileName?.toLowerCase().includes(q) ||
                d.certificateNumber?.toLowerCase().includes(q) ||
                d.boardResolutionNo?.toLowerCase().includes(q) ||
                d.authorizedBy?.toLowerCase().includes(q)
            )
        })
    }, [disposals, searchQuery])

    const handleAuditClearance = (fileRefNo) => {
        setFeedbackMessage(`File ${fileRefNo} certified compliant for continued statutory archival retention.`)
        setTimeout(() => setFeedbackMessage(''), 4500)
    }

    const openDisposalModal = (file) => {
        setDisposalModalFile(file)
        setDisposalForm({
            disposalMethod: 'Shredding',
            scheduledDate: new Date().toISOString().split('T')[0],
            disposalDate: new Date().toISOString().split('T')[0],
            boardResolutionNo: `BOM-RES-${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`,
            authorizedBy: isMdOrDirector ? 'Dr. V. Thirunavukkarasu (Managing Director)' : 'Dr. K. S. Sundaram (Joint Director)',
            witnesses: 'K. Rajendran (Custodian), S. Meenakshi (Internal Auditor)',
            remarks: 'Statutory retention duration concluded. Verified no pending legal summons.',
            permanentOverrideAuthorized: false,
        })
    }

    const handleDisposalSubmit = async (e) => {
        e.preventDefault()
        if (!disposalModalFile) return

        const isPermanent = disposalModalFile.retentionRule === 'Permanent Archival'
        if (isPermanent && !disposalForm.permanentOverrideAuthorized) {
            alert('Cannot execute disposal: Permanent Archival files require explicit Board of Management & Managing Director dual authorization.')
            return
        }

        try {
            const payload = {
                fileId: disposalModalFile.id,
                fileRefNo: disposalModalFile.fileRefNo,
                fileName: disposalModalFile.fileName,
                category: disposalModalFile.category,
                ownerDepartment: disposalModalFile.ownerDepartment,
                retentionRule: disposalModalFile.retentionRule,
                disposalMethod: disposalForm.disposalMethod,
                scheduledDate: disposalForm.scheduledDate,
                disposalDate: disposalForm.disposalDate,
                boardResolutionNo: disposalForm.boardResolutionNo,
                authorizedBy: disposalForm.authorizedBy,
                witnesses: disposalForm.witnesses,
                remarks: disposalForm.remarks,
                status: 'Completed',
            }

            const res = await fileRoomService.scheduleDisposal(payload)
            if (res.success) {
                setFeedbackMessage(`File ${payload.fileRefNo} disposed via ${payload.disposalMethod}. Certificate ${res.data.certificateNumber} generated.`)
                setTimeout(() => setFeedbackMessage(''), 5000)
                setDisposalModalFile(null)
                loadData()
                setViewCertificate(res.data)
            } else {
                alert(`Error: ${res.error?.message || res.error || 'Failed to execute disposal'}`)
            }
        } catch (err) {
            console.error('Disposal execution failed:', err)
            alert('Failed to execute archival disposal.')
        }
    }

    const printCertificate = () => {
        window.print()
    }

    // Retention Columns
    const retentionColumns = [
        {
            key: 'fileRefNo',
            label: 'Barcode / File Ref',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900'>
                    <Archive className='w-3.5 h-3.5 text-teal-600' />
                    {row.fileRefNo}
                </div>
            ),
        },
        {
            key: 'fileName',
            label: 'Physical Document Title & Category',
            required: true,
            render: (row) => (
                <div className='max-w-md'>
                    <div className='font-bold text-slate-900 text-xs'>{row.fileName}</div>
                    <div className='text-[11px] text-slate-500 mt-0.5'>{row.category} · Dept: {row.ownerDepartment}</div>
                </div>
            ),
        },
        {
            key: 'retentionRule',
            label: 'Statutory Retention Policy',
            required: true,
            render: (row) => {
                const isPermanent = row.retentionRule === 'Permanent Archival'
                return (
                    <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isPermanent
                                ? 'bg-purple-100 text-purple-800 border border-purple-200 font-bold'
                                : 'bg-slate-100 text-slate-700'
                        }`}
                    >
                        {row.retentionRule || 'Permanent Archival'}
                    </span>
                )
            },
        },
        {
            key: 'status',
            label: 'Disposal Eligibility & Status',
            required: true,
            render: (row) => {
                const isDisposed = row.currentLocationStatus === 'Disposed / Destroyed' || row.currentLocationStatus === 'Digitally Archived'
                const isPermanent = row.retentionRule === 'Permanent Archival'
                if (isDisposed) {
                    return (
                        <span className='px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200'>
                            {row.currentLocationStatus}
                        </span>
                    )
                }
                return (
                    <div className='text-xs'>
                        <span className={`font-semibold ${isPermanent ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {isPermanent ? 'Retained Permanently' : 'Eligible for Disposal Review'}
                        </span>
                        <div className='text-[10px] text-slate-400 mt-0.5'>Audit Cycle: 2026-2027</div>
                    </div>
                )
            },
        },
        {
            key: 'actions',
            label: 'Actions',
            required: true,
            render: (row) => {
                const isDisposed = row.currentLocationStatus === 'Disposed / Destroyed' || row.currentLocationStatus === 'Digitally Archived'
                if (isDisposed) {
                    return <span className='text-[11px] text-slate-400 font-medium'>Disposal Completed</span>
                }
                return (
                    <div className='flex items-center gap-1.5'>
                        <button
                            type='button'
                            onClick={() => handleAuditClearance(row.fileRefNo)}
                            className='text-xs px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 font-semibold transition-colors'
                        >
                            Certify
                        </button>
                        <button
                            type='button'
                            onClick={() => openDisposalModal(row)}
                            className='text-xs px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 font-semibold transition-colors flex items-center gap-1'
                        >
                            <Trash2 className='w-3 h-3' /> Schedule Disposal
                        </button>
                    </div>
                )
            },
        },
    ]

    // Disposals Columns
    const disposalColumns = [
        {
            key: 'certificateNumber',
            label: 'Certificate No. & Date',
            required: true,
            render: (row) => (
                <div>
                    <span className='font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200'>
                        {row.certificateNumber}
                    </span>
                    <div className='text-[11px] text-slate-500 mt-1 font-mono flex items-center gap-1'>
                        <Calendar className='w-3 h-3 text-slate-400' />
                        {row.disposalDate}
                    </div>
                </div>
            ),
        },
        {
            key: 'fileName',
            label: 'Disposed File Title & Barcode',
            required: true,
            render: (row) => (
                <div className='max-w-md'>
                    <div className='font-bold text-slate-900 text-xs'>{row.fileName}</div>
                    <div className='text-[11px] font-mono text-slate-500 mt-0.5'>{row.fileRefNo} · {row.category}</div>
                </div>
            ),
        },
        {
            key: 'disposalMethod',
            label: 'Method & Resolution',
            required: true,
            render: (row) => (
                <div>
                    <span className='px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800'>
                        {row.disposalMethod}
                    </span>
                    <div className='text-[10px] text-slate-500 mt-0.5 font-mono'>{row.boardResolutionNo}</div>
                </div>
            ),
        },
        {
            key: 'authorizedBy',
            label: 'Authorized Signatory & Witnesses',
            required: true,
            render: (row) => (
                <div className='text-xs space-y-0.5'>
                    <div className='font-semibold text-slate-800'>{row.authorizedBy}</div>
                    <div className='text-[10px] text-slate-400'>Witness: {row.witnesses}</div>
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'Certificate',
            required: true,
            render: (row) => (
                <button
                    type='button'
                    onClick={() => setViewCertificate(row)}
                    className='text-xs px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors flex items-center gap-1 shadow-xs'
                >
                    <FileText className='w-3 h-3' /> View Certificate
                </button>
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
                            <ShieldAlert className='w-4 h-4' />
                            Statutory Retention Rules &amp; Archival Disposal
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Retention Audit &amp; Archival Disposal Workflow
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Formal statutory lifecycle management. Schedule destruction, select authorized disposal methods (shredding, incineration, digital archival), obtain board resolution sign-off, and generate official disposal certificates.
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={loadData}
                            className='inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh Records
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

            {/* Tab Navigation & Filters */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3'>
                <div className='flex flex-wrap items-center justify-between gap-4'>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={() => setActiveTab('RETENTION')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                                activeTab === 'RETENTION'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                            Retention Audit &amp; Inventory ({files.length})
                        </button>
                        <button
                            type='button'
                            onClick={() => setActiveTab('DISPOSALS')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                                activeTab === 'DISPOSALS'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                            Disposal Register &amp; Certificates ({disposals.length})
                        </button>
                    </div>

                    <div className='relative w-full md:w-64'>
                        <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search file ref, title, cert no...'
                            className='w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        />
                    </div>
                </div>

                {activeTab === 'RETENTION' && (
                    <div className='flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100'>
                        <span className='text-xs font-medium text-slate-500'>Retention Policy:</span>
                        {RETENTION_RULES.map((rule) => (
                            <button
                                key={rule}
                                type='button'
                                onClick={() => setRuleFilter(rule)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                    ruleFilter === rule
                                        ? 'bg-teal-700 text-white'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                            >
                                {rule}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Tables View */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        {activeTab === 'RETENTION'
                            ? `Retention Rules & Compliance Inventory (${filteredFiles.length} files)`
                            : `Archival Disposals & Execution History (${filteredDisposals.length} certificates)`}
                    </h2>
                </div>
                <div className='p-2'>
                    {activeTab === 'RETENTION' ? (
                        <DataTable
                            columns={retentionColumns}
                            data={filteredFiles}
                            emptyMessage='No files found matching the selected retention criteria.'
                        />
                    ) : (
                        <DataTable
                            columns={disposalColumns}
                            data={filteredDisposals}
                            emptyMessage='No executed archival disposals recorded yet.'
                        />
                    )}
                </div>
            </div>

            {/* Schedule / Execute Disposal Modal */}
            {disposalModalFile && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-base font-bold text-slate-900'>Schedule Archival Disposal &amp; Destruction</h3>
                                <span className='text-[11px] font-mono text-teal-700'>{disposalModalFile.fileRefNo}</span>
                            </div>
                            <button
                                type='button'
                                onClick={() => setDisposalModalFile(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <form onSubmit={handleDisposalSubmit} className='mt-4 space-y-4 text-xs'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100'>
                                <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Target Dossier</span>
                                <div className='font-bold text-slate-900 text-xs mt-0.5'>{disposalModalFile.fileName}</div>
                                <div className='text-[11px] text-slate-500 mt-1'>
                                    Category: <strong>{disposalModalFile.category}</strong> · Policy: <strong>{disposalModalFile.retentionRule}</strong>
                                </div>
                            </div>

                            {disposalModalFile.retentionRule === 'Permanent Archival' && (
                                <div className='p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 space-y-2'>
                                    <div className='flex items-center gap-1.5 font-bold text-[11px] text-rose-900'>
                                        <Lock className='w-3.5 h-3.5 text-rose-600' />
                                        Permanent Archival Dossier
                                    </div>
                                    <p className='text-[11px] leading-relaxed'>
                                        This file has statutory retention rule &quot;Permanent Archival&quot;. Destruction requires Executive Board concurrence and dual Director sign-off.
                                    </p>
                                    <label className='flex items-center gap-2 pt-1 border-t border-rose-200 cursor-pointer'>
                                        <input
                                            type='checkbox'
                                            checked={disposalForm.permanentOverrideAuthorized}
                                            onChange={(e) =>
                                                setDisposalForm({
                                                    ...disposalForm,
                                                    permanentOverrideAuthorized: e.target.checked,
                                                })
                                            }
                                            className='rounded text-rose-600 focus:ring-rose-500'
                                        />
                                        <span className='text-[11px] font-bold text-rose-900'>
                                            Board of Management Executive Dual Authorization Affixed
                                        </span>
                                    </label>
                                </div>
                            )}

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Disposal Method *</label>
                                    <select
                                        value={disposalForm.disposalMethod}
                                        onChange={(e) => setDisposalForm({ ...disposalForm, disposalMethod: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white'
                                    >
                                        {DISPOSAL_METHODS.map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Execution Date *</label>
                                    <input
                                        type='date'
                                        required
                                        value={disposalForm.disposalDate}
                                        onChange={(e) => setDisposalForm({ ...disposalForm, disposalDate: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 font-mono'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Board Resolution Number *</label>
                                    <input
                                        type='text'
                                        required
                                        value={disposalForm.boardResolutionNo}
                                        onChange={(e) => setDisposalForm({ ...disposalForm, boardResolutionNo: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 font-mono'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Authorized Sign-off Officer *</label>
                                    <input
                                        type='text'
                                        required
                                        value={disposalForm.authorizedBy}
                                        onChange={(e) => setDisposalForm({ ...disposalForm, authorizedBy: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Destruction Witnesses</label>
                                <input
                                    type='text'
                                    value={disposalForm.witnesses}
                                    onChange={(e) => setDisposalForm({ ...disposalForm, witnesses: e.target.value })}
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Audit Rationale / Destruction Notes</label>
                                <textarea
                                    rows={2}
                                    value={disposalForm.remarks}
                                    onChange={(e) => setDisposalForm({ ...disposalForm, remarks: e.target.value })}
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setDisposalModalFile(null)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1.5'
                                >
                                    <Trash2 className='w-3.5 h-3.5' />
                                    Execute Disposal &amp; Issue Certificate
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Official Disposal Certificate Viewer Modal */}
            {viewCertificate && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-300 max-h-[92vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-200'>
                            <div className='flex items-center gap-2'>
                                <ShieldCheck className='w-5 h-5 text-teal-700' />
                                <span className='text-xs font-bold text-teal-800 uppercase tracking-widest'>Official Archival Certificate</span>
                            </div>
                            <button
                                type='button'
                                onClick={() => setViewCertificate(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        {/* Certificate Body (Printable) */}
                        <div className='mt-6 p-6 rounded-2xl border-2 border-slate-300 bg-slate-50/50 space-y-6'>
                            <div className='text-center space-y-1'>
                                <div className='text-[10px] uppercase font-mono font-bold tracking-widest text-slate-500'>
                                    Institutional Records Management &amp; Archives Directorate
                                </div>
                                <h2 className='text-lg font-black text-slate-900 tracking-wide uppercase'>
                                    Certificate of Archival Disposal &amp; Document Destruction
                                </h2>
                                <div className='font-mono text-xs font-bold text-teal-800 mt-1'>
                                    Certificate Reference: {viewCertificate.certificateNumber}
                                </div>
                            </div>

                            <p className='text-xs text-slate-700 leading-relaxed text-justify'>
                                This is to officially certify that the physical records and archival dossier detailed hereunder have reached statutory expiration of their prescribed retention period under Institutional Archival Regulations § 14.3. The destruction was duly authorized by the Board of Management, witnessed by authorized custodians, and executed in complete conformity with environmental and confidential data destruction standards.
                            </p>

                            <div className='grid grid-cols-2 gap-4 p-4 rounded-xl bg-white border border-slate-200 text-xs'>
                                <div>
                                    <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Document Reference / Barcode</span>
                                    <span className='font-mono font-bold text-slate-900 text-xs'>{viewCertificate.fileRefNo}</span>
                                </div>
                                <div>
                                    <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Execution Date</span>
                                    <span className='font-mono font-bold text-slate-900 text-xs'>{viewCertificate.disposalDate}</span>
                                </div>
                                <div className='col-span-2'>
                                    <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Physical Document Title</span>
                                    <span className='font-bold text-slate-900 text-xs'>{viewCertificate.fileName}</span>
                                </div>
                                <div>
                                    <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Disposal Method Executed</span>
                                    <span className='font-bold text-teal-800'>{viewCertificate.disposalMethod}</span>
                                </div>
                                <div>
                                    <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Board Resolution Reference</span>
                                    <span className='font-mono font-bold text-slate-800'>{viewCertificate.boardResolutionNo}</span>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs'>
                                <div>
                                    <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Witnesses of Destruction</span>
                                    <span className='font-medium text-slate-800 text-[11px] block mt-1'>{viewCertificate.witnesses}</span>
                                    <div className='mt-3 pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-400'>
                                        Custodian Signature &amp; Stamp
                                    </div>
                                </div>
                                <div className='text-right'>
                                    <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Authorized Signatory</span>
                                    <span className='font-bold text-slate-900 text-[11px] block mt-1'>{viewCertificate.authorizedBy}</span>
                                    <div className='mt-3 pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-400'>
                                        Executive Director Seal
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-200 flex items-center justify-end gap-2'>
                            <button
                                type='button'
                                onClick={() => setViewCertificate(null)}
                                className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700'
                            >
                                Close
                            </button>
                            <button
                                type='button'
                                onClick={printCertificate}
                                className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center gap-1.5'
                            >
                                <Printer className='w-3.5 h-3.5' />
                                Print Certificate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default FileRoomRetentionAudit
