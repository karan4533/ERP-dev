import React, { useEffect, useState, useMemo } from 'react'
import {
    Database,
    Plus,
    Search,
    RefreshCw,
    Download,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowUpRight,
    X,
    Filter,
    Calendar,
    Paperclip,
    Send,
    Edit3
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { proService } from '../../services/modules/proService'

const DATA_CATEGORIES = [
    'ALL',
    'Affiliation & Sanctioned Sections',
    'Statutory Licensing & Fire NOC',
    'Government Approved Fee Structure',
    'Government Correspondence & Directives',
    'Admissions & Lead Approvals',
    'Student Transfer & Concession Lists',
]

const STATUSES = ['ALL', 'Submitted', 'In Review', 'Imported', 'Verified', 'Returned for Revision']

const ProErpDataHandover = () => {
    const [handovers, setHandovers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const [selectedHandover, setSelectedHandover] = useState(null)
    const [statusUpdateModal, setStatusUpdateModal] = useState(null)
    const [newStatus, setNewStatus] = useState('In Review')
    const [statusRemarks, setStatusRemarks] = useState('')
    const [feedbackMessage, setFeedbackMessage] = useState('')

    // New Handover Form
    const [form, setForm] = useState({
        batchId: '',
        date: new Date().toISOString().split('T')[0],
        dataCategory: 'Affiliation & Sanctioned Sections',
        description: '',
        handoverBy: 'R. Srinivasan (Senior PRO)',
        receivedBy: 'S. Sundaresan (ERP Technical Lead)',
        recordCount: 1,
        status: 'Submitted',
        remarks: '',
        attachment: null,
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await proService.getErpHandovers({
                status: statusFilter,
                dataCategory: categoryFilter,
                fromDate,
                toDate,
                search: searchQuery,
            })
            if (res.success && Array.isArray(res.data)) {
                setHandovers(res.data)
            }
        } catch (err) {
            console.error('Failed to load ERP handovers:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [categoryFilter, statusFilter, fromDate, toDate])

    const handleSearchSubmit = (e) => {
        e.preventDefault()
        loadData()
    }

    const resetFilters = () => {
        setCategoryFilter('ALL')
        setStatusFilter('ALL')
        setFromDate('')
        setToDate('')
        setSearchQuery('')
    }

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 10 * 1024 * 1024) {
            alert('File size exceeds 10MB limit.')
            return
        }
        setForm((prev) => ({
            ...prev,
            attachment: {
                fileName: file.name,
                fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                fileType: file.type,
                uploadedAt: new Date().toISOString(),
            },
        }))
    }

    const handleCreateSubmit = async (e) => {
        e.preventDefault()
        if (!form.dataCategory || !form.description || !form.handoverBy || !form.receivedBy) {
            alert('Please fill in all mandatory handover fields.')
            return
        }

        try {
            const res = await proService.createErpHandover(form)
            if (res.success) {
                setFeedbackMessage(`Batch ${res.data.batchId} successfully handed over to ERP team.`)
                setTimeout(() => setFeedbackMessage(''), 4500)
                setShowRegisterModal(false)
                setForm({
                    batchId: '',
                    date: new Date().toISOString().split('T')[0],
                    dataCategory: 'Affiliation & Sanctioned Sections',
                    description: '',
                    handoverBy: 'R. Srinivasan (Senior PRO)',
                    receivedBy: 'S. Sundaresan (ERP Technical Lead)',
                    recordCount: 1,
                    status: 'Submitted',
                    remarks: '',
                    attachment: null,
                })
                loadData()
            } else {
                alert(`Error: ${res.error?.message || 'Failed to register handover'}`)
            }
        } catch (err) {
            console.error('Handover registration failed:', err)
            alert('Handover registration failed.')
        }
    }

    const handleStatusUpdate = async (e) => {
        e.preventDefault()
        if (!statusUpdateModal) return

        try {
            const updatePayload = {
                status: newStatus,
                remarks: statusRemarks
                    ? `${statusUpdateModal.remarks ? statusUpdateModal.remarks + ' | ' : ''}${statusRemarks}`
                    : statusUpdateModal.remarks,
                ...(newStatus === 'Returned for Revision' ? { revisionNotes: statusRemarks } : {}),
            }
            const res = await proService.updateErpHandover(statusUpdateModal.id, updatePayload)
            if (res.success) {
                setFeedbackMessage(`Batch ${statusUpdateModal.batchId} updated to status "${newStatus}".`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setStatusUpdateModal(null)
                setStatusRemarks('')
                loadData()
            }
        } catch (err) {
            console.error('Failed to update handover status:', err)
            alert('Status update failed.')
        }
    }

    const exportToCSV = () => {
        if (!handovers.length) {
            alert('No handover data to export.')
            return
        }
        const headers = ['Batch ID', 'Date', 'Category', 'Description', 'Handover By', 'Received By', 'Record Count', 'Status', 'Remarks']
        const rows = handovers.map((h) => [
            `"${h.batchId}"`,
            `"${h.date}"`,
            `"${h.dataCategory}"`,
            `"${(h.description || '').replace(/"/g, '""')}"`,
            `"${h.handoverBy}"`,
            `"${h.receivedBy}"`,
            h.recordCount || 0,
            `"${h.status}"`,
            `"${(h.remarks || '').replace(/"/g, '""')}"`,
        ])
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `PRO_ERP_Data_Handovers_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Metrics
    const metrics = useMemo(() => {
        const total = handovers.length
        const pending = handovers.filter((h) => h.status === 'Submitted' || h.status === 'In Review').length
        const imported = handovers.filter((h) => h.status === 'Imported').length
        const verified = handovers.filter((h) => h.status === 'Verified').length
        return { total, pending, imported, verified }
    }, [handovers])

    const columns = [
        {
            key: 'batchId',
            label: 'Batch ID & Date',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-mono font-bold text-xs text-slate-900'>{row.batchId}</div>
                    <div className='text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-mono'>
                        <Calendar className='w-3 h-3 text-slate-400' />
                        {row.date}
                    </div>
                </div>
            ),
        },
        {
            key: 'dataCategory',
            label: 'Data Category & Scope',
            required: true,
            render: (row) => (
                <div className='max-w-xs'>
                    <span className='px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200'>
                        {row.dataCategory}
                    </span>
                    <p className='text-xs text-slate-700 mt-1 line-clamp-2'>{row.description}</p>
                </div>
            ),
        },
        {
            key: 'handoverBy',
            label: 'PRO Handover & ERP Recipient',
            required: true,
            render: (row) => (
                <div className='text-xs space-y-0.5'>
                    <div className='text-slate-800 font-medium'>
                        <span className='text-[10px] text-slate-400 uppercase font-semibold block'>From (PRO):</span>
                        {row.handoverBy}
                    </div>
                    <div className='text-slate-600'>
                        <span className='text-[10px] text-slate-400 uppercase font-semibold block'>To (ERP):</span>
                        {row.receivedBy}
                    </div>
                </div>
            ),
        },
        {
            key: 'attachment',
            label: 'Attachment',
            required: true,
            render: (row) => (
                <div>
                    {row.attachment ? (
                        <div className='flex items-center gap-1.5 text-xs text-teal-700 font-medium bg-teal-50/70 px-2 py-1 rounded-lg border border-teal-100 max-w-[140px] truncate'>
                            <Paperclip className='w-3.5 h-3.5 shrink-0 text-teal-600' />
                            <span className='truncate' title={row.attachment.fileName}>
                                {row.attachment.fileName}
                            </span>
                        </div>
                    ) : (
                        <span className='text-[11px] text-slate-400'>No file</span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'ERP Integration Status',
            required: true,
            render: (row) => {
                const isVerified = row.status === 'Verified'
                const isImported = row.status === 'Imported'
                const isReview = row.status === 'In Review'
                const isReturned = row.status === 'Returned for Revision'

                let badgeColor = 'bg-slate-100 text-slate-700'
                if (isVerified) badgeColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                else if (isImported) badgeColor = 'bg-blue-100 text-blue-800 border border-blue-200'
                else if (isReview) badgeColor = 'bg-amber-100 text-amber-800 border border-amber-200'
                else if (isReturned) badgeColor = 'bg-rose-100 text-rose-800 border border-rose-200'

                return (
                    <div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
                            {row.status}
                        </span>
                        {row.recordCount && (
                            <span className='block text-[10px] text-slate-400 mt-0.5 font-mono'>
                                {row.recordCount} records
                            </span>
                        )}
                    </div>
                )
            },
        },
        {
            key: 'actions',
            label: 'Actions',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5'>
                    <button
                        type='button'
                        onClick={() => setSelectedHandover(row)}
                        className='text-xs px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors'
                    >
                        Details
                    </button>
                    <button
                        type='button'
                        onClick={() => {
                            setStatusUpdateModal(row)
                            setNewStatus(row.status === 'Submitted' ? 'In Review' : row.status === 'In Review' ? 'Imported' : 'Verified')
                            setStatusRemarks('')
                        }}
                        className='text-xs px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold transition-colors flex items-center gap-1'
                    >
                        <Edit3 className='w-3 h-3' /> Update
                    </button>
                </div>
            ),
        },
    ]

    return (
        <section className='space-y-6 p-1'>
            {/* Header Banner */}
            <div className='rounded-2xl bg-white p-5 border border-slate-200 shadow-xs'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700'>
                            <Database className='w-4 h-4' />
                            Public Relations &rarr; ERP Technical Operations
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            PRO Team Given the Data For ERP Team
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-3xl'>
                            Formal record repository and tracking workflow for external regulatory, board affiliation, statutory licensing, fee approval orders, and master datasets handed over by PRO to the ERP software team.
                        </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2.5'>
                        <button
                            type='button'
                            onClick={exportToCSV}
                            className='inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <Download className='w-3.5 h-3.5' />
                            Export CSV
                        </button>
                        <button
                            type='button'
                            onClick={loadData}
                            className='inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            type='button'
                            onClick={() => setShowRegisterModal(true)}
                            className='inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Register Handover Batch
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

            {/* Metric KPI Cards */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs'>
                    <span className='text-xs font-medium text-slate-500 uppercase tracking-wider block'>Total Batches Handed Over</span>
                    <span className='text-2xl font-black text-slate-900 mt-1 block'>{metrics.total}</span>
                    <span className='text-[11px] text-slate-400 mt-0.5 block'>PRO regulatory consignments</span>
                </div>
                <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs'>
                    <span className='text-xs font-medium text-slate-500 uppercase tracking-wider block'>In Review / Submitted</span>
                    <span className='text-2xl font-black text-amber-600 mt-1 block'>{metrics.pending}</span>
                    <span className='text-[11px] text-amber-600 font-medium mt-0.5 block'>Pending ERP import</span>
                </div>
                <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs'>
                    <span className='text-xs font-medium text-slate-500 uppercase tracking-wider block'>Successfully Imported</span>
                    <span className='text-2xl font-black text-blue-600 mt-1 block'>{metrics.imported}</span>
                    <span className='text-[11px] text-blue-600 font-medium mt-0.5 block'>Configured in database</span>
                </div>
                <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs'>
                    <span className='text-xs font-medium text-slate-500 uppercase tracking-wider block'>Verified by Leads</span>
                    <span className='text-2xl font-black text-emerald-600 mt-1 block'>{metrics.verified}</span>
                    <span className='text-[11px] text-emerald-600 font-medium mt-0.5 block'>Live production verified</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3'>
                <div className='flex flex-wrap items-center justify-between gap-4'>
                    <div className='flex flex-wrap items-center gap-3'>
                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-medium text-slate-500'>Category:</span>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                            >
                                {DATA_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c === 'ALL' ? 'All Data Categories' : c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-medium text-slate-500'>Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                            >
                                {STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                        {s === 'ALL' ? 'All Integration Statuses' : s}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className='flex items-center gap-1.5 text-xs text-slate-600'>
                            <span className='font-medium text-slate-500'>From:</span>
                            <input
                                type='date'
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className='px-2 py-1 text-xs rounded-lg border border-slate-200'
                            />
                            <span className='font-medium text-slate-500 ml-1'>To:</span>
                            <input
                                type='date'
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className='px-2 py-1 text-xs rounded-lg border border-slate-200'
                            />
                        </div>

                        {(categoryFilter !== 'ALL' || statusFilter !== 'ALL' || fromDate || toDate || searchQuery) && (
                            <button
                                type='button'
                                onClick={resetFilters}
                                className='text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors'
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSearchSubmit} className='relative w-full md:w-64'>
                        <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search batch ID, topic, officer...'
                            className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        />
                    </form>
                </div>
            </div>

            {/* Handovers Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        PRO &rarr; ERP Data Handover Ledger ({handovers.length} records)
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={handovers}
                        emptyMessage='No data handovers found matching current filters.'
                    />
                </div>
            </div>

            {/* Register Handover Modal */}
            {showRegisterModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-base font-bold text-slate-900'>Register New Data Handover to ERP</h3>
                                <p className='text-xs text-slate-500 mt-0.5'>Handover external regulatory &amp; licensing datasets to ERP technical team</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setShowRegisterModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className='mt-4 space-y-4 text-xs'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Handover Date *</label>
                                    <input
                                        type='date'
                                        required
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 font-mono'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Data Category *</label>
                                    <select
                                        value={form.dataCategory}
                                        onChange={(e) => setForm({ ...form, dataCategory: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white'
                                    >
                                        {DATA_CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Batch Description / Scope *</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder='Specify dataset details, approved sanction numbers, dates, and instructions for ERP team...'
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Handover By (PRO) *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.handoverBy}
                                        onChange={(e) => setForm({ ...form, handoverBy: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Received By (ERP Team) *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.receivedBy}
                                        onChange={(e) => setForm({ ...form, receivedBy: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Estimated Record Count</label>
                                    <input
                                        type='number'
                                        min={1}
                                        value={form.recordCount}
                                        onChange={(e) => setForm({ ...form, recordCount: Number(e.target.value) })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 font-mono'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Initial Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white'
                                    >
                                        <option value='Submitted'>Submitted</option>
                                        <option value='In Review'>In Review</option>
                                    </select>
                                </div>
                            </div>

                            {/* Attachment Upload */}
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-200'>
                                <label className='block font-semibold text-slate-700 mb-1 flex items-center gap-1.5'>
                                    <Paperclip className='w-3.5 h-3.5 text-teal-600' />
                                    Supporting Data File / Approval Order (.pdf, .xlsx, .csv, max 10MB)
                                </label>
                                <input
                                    type='file'
                                    onChange={handleFileChange}
                                    accept='.pdf,.xlsx,.xls,.csv,.doc,.docx'
                                    className='block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100'
                                />
                                {form.attachment && (
                                    <div className='mt-2 text-[11px] text-teal-800 font-medium flex items-center gap-1'>
                                        <CheckCircle2 className='w-3.5 h-3.5 text-teal-600' />
                                        Attached: {form.attachment.fileName} ({form.attachment.fileSize})
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Remarks / Technical Directives</label>
                                <input
                                    type='text'
                                    value={form.remarks}
                                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                                    placeholder='e.g. Needs immediate import into Section Master for Admissions'
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowRegisterModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs flex items-center gap-1.5'
                                >
                                    <Send className='w-3.5 h-3.5' />
                                    Submit Handover Batch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {statusUpdateModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-sm font-bold text-slate-900'>Update Integration Status</h3>
                                <span className='text-[11px] font-mono text-teal-700'>{statusUpdateModal.batchId}</span>
                            </div>
                            <button
                                type='button'
                                onClick={() => setStatusUpdateModal(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <form onSubmit={handleStatusUpdate} className='mt-4 space-y-3 text-xs'>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>New Status *</label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white'
                                >
                                    <option value='Submitted'>Submitted</option>
                                    <option value='In Review'>In Review</option>
                                    <option value='Imported'>Imported</option>
                                    <option value='Verified'>Verified</option>
                                    <option value='Returned for Revision'>Returned for Revision</option>
                                </select>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Status Remarks / Technical Notes</label>
                                <textarea
                                    rows={3}
                                    value={statusRemarks}
                                    onChange={(e) => setStatusRemarks(e.target.value)}
                                    placeholder='Specify execution summary, verified schema fields, or revision requirements...'
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setStatusUpdateModal(null)}
                                    className='px-3.5 py-1.5 font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-3.5 py-1.5 font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                                >
                                    Save Status
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Handover Details Modal */}
            {selectedHandover && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <span className='text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono'>
                                    {selectedHandover.batchId}
                                </span>
                                <h3 className='text-sm font-bold text-slate-900 mt-1'>{selectedHandover.dataCategory}</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedHandover(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-3 text-xs'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5'>
                                <span className='text-[10px] uppercase font-bold text-slate-400 block'>Consignment Description</span>
                                <p className='text-slate-800 leading-relaxed'>{selectedHandover.description}</p>
                            </div>

                            <div className='grid grid-cols-2 gap-2 text-slate-700'>
                                <div className='p-2.5 rounded-lg bg-slate-50 border border-slate-100'>
                                    <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Handover By (PRO)</span>
                                    <span className='font-semibold text-slate-900'>{selectedHandover.handoverBy}</span>
                                </div>
                                <div className='p-2.5 rounded-lg bg-slate-50 border border-slate-100'>
                                    <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Received By (ERP)</span>
                                    <span className='font-semibold text-slate-900'>{selectedHandover.receivedBy}</span>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-2'>
                                <div className='p-2.5 rounded-lg bg-slate-50 border border-slate-100'>
                                    <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Date &amp; Records</span>
                                    <span className='font-mono text-slate-800'>{selectedHandover.date} · {selectedHandover.recordCount || 1} records</span>
                                </div>
                                <div className='p-2.5 rounded-lg bg-slate-50 border border-slate-100'>
                                    <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Current Status</span>
                                    <span className='font-bold text-teal-800'>{selectedHandover.status}</span>
                                </div>
                            </div>

                            {selectedHandover.attachment && (
                                <div className='p-2.5 rounded-lg bg-teal-50/60 border border-teal-100 flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                        <Paperclip className='w-4 h-4 text-teal-600' />
                                        <div>
                                            <span className='font-semibold text-teal-900 block'>{selectedHandover.attachment.fileName}</span>
                                            <span className='text-[10px] text-teal-700'>{selectedHandover.attachment.fileSize}</span>
                                        </div>
                                    </div>
                                    <button
                                        type='button'
                                        onClick={() => alert(`Simulated download of ${selectedHandover.attachment.fileName}`)}
                                        className='text-[11px] px-2.5 py-1 rounded bg-teal-600 text-white font-medium hover:bg-teal-700'
                                    >
                                        Download
                                    </button>
                                </div>
                            )}

                            {selectedHandover.remarks && (
                                <div className='p-2.5 rounded-lg bg-slate-50 border border-slate-100'>
                                    <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Remarks</span>
                                    <span className='text-slate-700'>{selectedHandover.remarks}</span>
                                </div>
                            )}

                            {selectedHandover.revisionNotes && (
                                <div className='p-2.5 rounded-lg bg-rose-50 border border-rose-100'>
                                    <span className='text-[10px] text-rose-500 uppercase font-semibold block'>Revision Notes</span>
                                    <span className='text-rose-800'>{selectedHandover.revisionNotes}</span>
                                </div>
                            )}
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end'>
                            <button
                                type='button'
                                onClick={() => setSelectedHandover(null)}
                                className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700'
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

export default ProErpDataHandover
