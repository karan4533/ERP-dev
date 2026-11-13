import React, { useEffect, useState, useMemo } from 'react'
import {
    CalendarDays,
    Plus,
    Search,
    RefreshCw,
    Download,
    Printer,
    FileText,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Building2,
    X,
    Filter,
    Calendar,
    UserCheck,
    Send,
    Edit3
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { proService } from '../../services/modules/proService'

const AUTHORITIES = [
    'ALL',
    'District Educational Office (DEO)',
    'Directorate of School Education (DSE)',
    'Regional Transport Office (RTO)',
    'Tamil Nadu Fire & Rescue Services',
    'Municipal Corporation',
    'Central Board of Secondary Education (CBSE)',
    'Town & Country Planning (DTCP)',
    'Police & Traffic Department',
]

const OFFICERS = [
    'ALL',
    'R. Srinivasan (Senior PRO)',
    'P. Meenakshi (PRO Officer)',
    'M. Karthikeyan (Liaison Officer)',
]

const STATUSES = ['ALL', 'Completed', 'Pending Follow-up', 'In Progress']

const ProDailyWorkUpdate = () => {
    const [updates, setUpdates] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [authorityFilter, setAuthorityFilter] = useState('ALL')
    const [officerFilter, setOfficerFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedUpdate, setSelectedUpdate] = useState(null)
    const [editStatusModal, setEditStatusModal] = useState(null)
    const [newStatus, setNewStatus] = useState('Completed')
    const [statusRemarks, setStatusRemarks] = useState('')
    const [feedbackMessage, setFeedbackMessage] = useState('')

    // New Update Form
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        officerId: 'PRO-EMP-01',
        officerName: 'R. Srinivasan (Senior PRO)',
        authoritiesVisited: ['District Educational Office (DEO)'],
        licensingMatter: '',
        meetingSummary: '',
        documentsHandled: '',
        nextFollowUpDate: '',
        status: 'Completed',
        remarks: '',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await proService.getDailyWorkUpdates({
                authority: authorityFilter,
                officer: officerFilter,
                status: statusFilter,
                fromDate,
                toDate,
                search: searchQuery,
            })
            if (res.success && Array.isArray(res.data)) {
                setUpdates(res.data)
            }
        } catch (err) {
            console.error('Failed to load daily work updates:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [authorityFilter, officerFilter, statusFilter, fromDate, toDate])

    const handleSearchSubmit = (e) => {
        e.preventDefault()
        loadData()
    }

    const resetFilters = () => {
        setAuthorityFilter('ALL')
        setOfficerFilter('ALL')
        setStatusFilter('ALL')
        setFromDate('')
        setToDate('')
        setSearchQuery('')
    }

    const handleCreateSubmit = async (e) => {
        e.preventDefault()
        if (!form.officerName || !form.licensingMatter || !form.meetingSummary) {
            alert('Please provide officer name, licensing matter, and meeting summary.')
            return
        }

        try {
            const res = await proService.createDailyWorkUpdate(form)
            if (res.success) {
                setFeedbackMessage(`Daily work update for ${form.date} logged successfully.`)
                setTimeout(() => setFeedbackMessage(''), 4500)
                setShowCreateModal(false)
                setForm({
                    date: new Date().toISOString().split('T')[0],
                    officerId: 'PRO-EMP-01',
                    officerName: 'R. Srinivasan (Senior PRO)',
                    authoritiesVisited: ['District Educational Office (DEO)'],
                    licensingMatter: '',
                    meetingSummary: '',
                    documentsHandled: '',
                    nextFollowUpDate: '',
                    status: 'Completed',
                    remarks: '',
                })
                loadData()
            } else {
                alert(`Error: ${res.error?.message || 'Failed to create work update'}`)
            }
        } catch (err) {
            console.error('Failed to create daily work update:', err)
            alert('Error creating daily work update.')
        }
    }

    const handleStatusUpdate = async (e) => {
        e.preventDefault()
        if (!editStatusModal) return

        try {
            const updatePayload = {
                status: newStatus,
                remarks: statusRemarks
                    ? `${editStatusModal.remarks ? editStatusModal.remarks + ' | ' : ''}${statusRemarks}`
                    : editStatusModal.remarks,
            }
            const res = await proService.updateDailyWorkUpdate(editStatusModal.id, updatePayload)
            if (res.success) {
                setFeedbackMessage(`Work update status updated to "${newStatus}".`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setEditStatusModal(null)
                setStatusRemarks('')
                loadData()
            }
        } catch (err) {
            console.error('Failed to update status:', err)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const exportToCSV = () => {
        if (!updates.length) {
            alert('No daily work update records to export.')
            return
        }
        const headers = ['Date', 'Officer ID', 'Officer Name', 'Authorities Visited', 'Licensing Matter', 'Meeting Summary', 'Documents Handled', 'Next Follow-up', 'Status', 'Remarks']
        const rows = updates.map((u) => [
            `"${u.date}"`,
            `"${u.officerId}"`,
            `"${u.officerName}"`,
            `"${Array.isArray(u.authoritiesVisited) ? u.authoritiesVisited.join('; ') : u.authoritiesVisited}"`,
            `"${(u.licensingMatter || '').replace(/"/g, '""')}"`,
            `"${(u.meetingSummary || '').replace(/"/g, '""')}"`,
            `"${(u.documentsHandled || '').replace(/"/g, '""')}"`,
            `"${u.nextFollowUpDate || 'None'}"`,
            `"${u.status}"`,
            `"${(u.remarks || '').replace(/"/g, '""')}"`,
        ])
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `PRO_Daily_Work_Updates_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Metrics
    const metrics = useMemo(() => {
        const total = updates.length
        const pending = updates.filter((u) => u.status === 'Pending Follow-up').length
        const inProgress = updates.filter((u) => u.status === 'In Progress').length
        const completed = updates.filter((u) => u.status === 'Completed').length
        return { total, pending, inProgress, completed }
    }, [updates])

    const columns = [
        {
            key: 'date',
            label: 'Date & Officer',
            required: true,
            render: (row) => (
                <div>
                    <div className='flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900'>
                        <Calendar className='w-3.5 h-3.5 text-teal-600' />
                        {row.date}
                    </div>
                    <div className='text-[11px] text-slate-700 font-semibold mt-0.5'>{row.officerName}</div>
                    <span className='font-mono text-[10px] text-slate-400'>{row.officerId}</span>
                </div>
            ),
        },
        {
            key: 'authoritiesVisited',
            label: 'Authorities Visited / Contacted',
            required: true,
            render: (row) => {
                const list = Array.isArray(row.authoritiesVisited)
                    ? row.authoritiesVisited
                    : [row.authoritiesVisited]
                return (
                    <div className='flex flex-wrap gap-1 max-w-xs'>
                        {list.map((auth, idx) => (
                            <span
                                key={idx}
                                className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200'
                            >
                                <Building2 className='w-2.5 h-2.5 text-teal-600' />
                                {auth}
                            </span>
                        ))}
                    </div>
                )
            },
        },
        {
            key: 'licensingMatter',
            label: 'Licensing Matter & Discussion Summary',
            required: true,
            render: (row) => (
                <div className='max-w-md'>
                    <div className='font-bold text-xs text-slate-900'>{row.licensingMatter}</div>
                    <p className='text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed'>
                        {row.meetingSummary}
                    </p>
                    {row.documentsHandled && (
                        <div className='text-[11px] text-slate-400 mt-0.5 flex items-center gap-1'>
                            <FileText className='w-3 h-3 text-slate-400' />
                            <span>Docs: {row.documentsHandled}</span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'nextFollowUpDate',
            label: 'Next Follow-up',
            required: true,
            render: (row) => (
                <div>
                    {row.nextFollowUpDate ? (
                        <div className='flex items-center gap-1 font-mono text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 w-fit'>
                            <Clock className='w-3 h-3 text-amber-600' />
                            {row.nextFollowUpDate}
                        </div>
                    ) : (
                        <span className='text-[11px] text-slate-400'>No follow-up needed</span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            required: true,
            render: (row) => {
                const isCompleted = row.status === 'Completed'
                const isPending = row.status === 'Pending Follow-up'
                let badgeColor = 'bg-slate-100 text-slate-700'
                if (isCompleted) badgeColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                else if (isPending) badgeColor = 'bg-amber-100 text-amber-800 border border-amber-200'
                else badgeColor = 'bg-blue-100 text-blue-800 border border-blue-200'

                return (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
                        {row.status}
                    </span>
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
                        onClick={() => setSelectedUpdate(row)}
                        className='text-xs px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors'
                    >
                        View
                    </button>
                    <button
                        type='button'
                        onClick={() => {
                            setEditStatusModal(row)
                            setNewStatus(row.status === 'Completed' ? 'Pending Follow-up' : 'Completed')
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
                            <CalendarDays className='w-4 h-4' />
                            Public Relations &amp; Government Licensing Office
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Daily Work Update
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-3xl'>
                            Operational activity tracking log for Public Relations Officers detailing external visits to regulatory authorities (DEO, RTO, Fire Dept, Affiliation Boards, Municipalities), statutory licensing meetings, documents submitted, and pending follow-ups.
                        </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2.5'>
                        <button
                            type='button'
                            onClick={handlePrint}
                            className='inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <Printer className='w-3.5 h-3.5' />
                            Print Sheet
                        </button>
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
                            onClick={() => setShowCreateModal(true)}
                            className='inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Log Daily Work Entry
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

            {/* Metrics */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs'>
                    <span className='text-xs font-medium text-slate-500 uppercase tracking-wider block'>Total Entries Logged</span>
                    <span className='text-2xl font-black text-slate-900 mt-1 block'>{metrics.total}</span>
                    <span className='text-[11px] text-slate-400 mt-0.5 block'>PRO regulatory interactions</span>
                </div>
                <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs'>
                    <span className='text-xs font-medium text-slate-500 uppercase tracking-wider block'>Pending Follow-ups</span>
                    <span className='text-2xl font-black text-amber-600 mt-1 block'>{metrics.pending}</span>
                    <span className='text-[11px] text-amber-600 font-medium mt-0.5 block'>Requires inspection or re-visit</span>
                </div>
                <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs'>
                    <span className='text-xs font-medium text-slate-500 uppercase tracking-wider block'>In Progress Tasks</span>
                    <span className='text-2xl font-black text-blue-600 mt-1 block'>{metrics.inProgress}</span>
                    <span className='text-[11px] text-blue-600 font-medium mt-0.5 block'>Ongoing verification</span>
                </div>
                <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs'>
                    <span className='text-xs font-medium text-slate-500 uppercase tracking-wider block'>Completed &amp; Closed</span>
                    <span className='text-2xl font-black text-emerald-600 mt-1 block'>{metrics.completed}</span>
                    <span className='text-[11px] text-emerald-600 font-medium mt-0.5 block'>Sanctions &amp; clearances obtained</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3'>
                <div className='flex flex-wrap items-center justify-between gap-4'>
                    <div className='flex flex-wrap items-center gap-3'>
                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-medium text-slate-500'>Authority:</span>
                            <select
                                value={authorityFilter}
                                onChange={(e) => setAuthorityFilter(e.target.value)}
                                className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                            >
                                {AUTHORITIES.map((a) => (
                                    <option key={a} value={a}>
                                        {a === 'ALL' ? 'All Authorities Contacted' : a}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-medium text-slate-500'>Officer:</span>
                            <select
                                value={officerFilter}
                                onChange={(e) => setOfficerFilter(e.target.value)}
                                className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                            >
                                {OFFICERS.map((o) => (
                                    <option key={o} value={o}>
                                        {o === 'ALL' ? 'All PRO Officers' : o}
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
                                        {s === 'ALL' ? 'All Statuses' : s}
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

                        {(authorityFilter !== 'ALL' || officerFilter !== 'ALL' || statusFilter !== 'ALL' || fromDate || toDate || searchQuery) && (
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
                            placeholder='Search licensing, meeting, officer...'
                            className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        />
                    </form>
                </div>
            </div>

            {/* Daily Updates Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        PRO Daily Field &amp; Licensing Activity Register ({updates.length} entries)
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={updates}
                        emptyMessage='No daily work update entries found matching the filter criteria.'
                    />
                </div>
            </div>

            {/* Create Daily Work Entry Modal */}
            {showCreateModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-base font-bold text-slate-900'>Log Daily Work Update</h3>
                                <p className='text-xs text-slate-500 mt-0.5'>Record authority visit, compliance discussion, and documents handled</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setShowCreateModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className='mt-4 space-y-4 text-xs'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Date of Visit / Meeting *</label>
                                    <input
                                        type='date'
                                        required
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 font-mono'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>PRO Officer Name *</label>
                                    <select
                                        value={form.officerName}
                                        onChange={(e) => setForm({ ...form, officerName: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white'
                                    >
                                        {OFFICERS.filter((o) => o !== 'ALL').map((o) => (
                                            <option key={o} value={o}>{o}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Authorities Visited / Contacted *</label>
                                <div className='grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200'>
                                    {AUTHORITIES.filter((a) => a !== 'ALL').map((auth) => {
                                        const isChecked = form.authoritiesVisited.includes(auth)
                                        return (
                                            <label key={auth} className='flex items-center gap-2 cursor-pointer'>
                                                <input
                                                    type='checkbox'
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setForm({ ...form, authoritiesVisited: [...form.authoritiesVisited, auth] })
                                                        } else {
                                                            setForm({
                                                                ...form,
                                                                authoritiesVisited: form.authoritiesVisited.filter((x) => x !== auth),
                                                            })
                                                        }
                                                    }}
                                                    className='rounded border-slate-300 text-teal-600 focus:ring-teal-500'
                                                />
                                                <span className='text-[11px] text-slate-700 font-medium'>{auth}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Licensing / Regulatory Matter *</label>
                                <input
                                    type='text'
                                    required
                                    value={form.licensingMatter}
                                    onChange={(e) => setForm({ ...form, licensingMatter: e.target.value })}
                                    placeholder='e.g. CBSE Senior Secondary Affiliation Renewal Inspection'
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Meeting Summary &amp; Key Discussions *</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={form.meetingSummary}
                                    onChange={(e) => setForm({ ...form, meetingSummary: e.target.value })}
                                    placeholder='Key discussion points with government officials, observations made, deficiencies noted...'
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Documents Submitted / Received</label>
                                <input
                                    type='text'
                                    value={form.documentsHandled}
                                    onChange={(e) => setForm({ ...form, documentsHandled: e.target.value })}
                                    placeholder='e.g. Submitted Land Deed copies, Fire NOC receipt, Bus fitness certificates'
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Next Follow-up Date</label>
                                    <input
                                        type='date'
                                        value={form.nextFollowUpDate}
                                        onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 font-mono'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Activity Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white'
                                    >
                                        <option value='Completed'>Completed</option>
                                        <option value='Pending Follow-up'>Pending Follow-up</option>
                                        <option value='In Progress'>In Progress</option>
                                    </select>
                                </div>
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowCreateModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center gap-1.5'
                                >
                                    <Send className='w-3.5 h-3.5' />
                                    Save Daily Log
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Status Edit Modal */}
            {editStatusModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-sm font-bold text-slate-900'>Update Daily Work Status</h3>
                                <span className='text-[11px] text-slate-500'>{editStatusModal.licensingMatter}</span>
                            </div>
                            <button
                                type='button'
                                onClick={() => setEditStatusModal(null)}
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
                                    <option value='Completed'>Completed</option>
                                    <option value='Pending Follow-up'>Pending Follow-up</option>
                                    <option value='In Progress'>In Progress</option>
                                </select>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Execution Notes / Outcome</label>
                                <textarea
                                    rows={3}
                                    value={statusRemarks}
                                    onChange={(e) => setStatusRemarks(e.target.value)}
                                    placeholder='Specify resolution details, official letters obtained, or revised dates...'
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setEditStatusModal(null)}
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

            {/* Details Modal */}
            {selectedUpdate && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <span className='text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono'>
                                    {selectedUpdate.date} · {selectedUpdate.officerId}
                                </span>
                                <h3 className='text-sm font-bold text-slate-900 mt-1'>{selectedUpdate.licensingMatter}</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedUpdate(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-3 text-xs'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100'>
                                <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Reporting Officer</span>
                                <span className='font-bold text-slate-900 text-xs'>{selectedUpdate.officerName}</span>
                            </div>

                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100'>
                                <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Authorities Contacted</span>
                                <div className='flex flex-wrap gap-1 mt-1'>
                                    {(Array.isArray(selectedUpdate.authoritiesVisited) ? selectedUpdate.authoritiesVisited : [selectedUpdate.authoritiesVisited]).map((a, i) => (
                                        <span key={i} className='px-2 py-0.5 rounded text-[11px] font-bold bg-white text-slate-800 border border-slate-200'>
                                            {a}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100'>
                                <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Discussion Summary</span>
                                <p className='text-slate-800 mt-1 leading-relaxed'>{selectedUpdate.meetingSummary}</p>
                            </div>

                            <div className='grid grid-cols-2 gap-2 text-slate-700'>
                                <div className='p-2.5 rounded-lg bg-slate-50 border border-slate-100'>
                                    <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Documents Handled</span>
                                    <span className='font-medium text-slate-900'>{selectedUpdate.documentsHandled || 'None recorded'}</span>
                                </div>
                                <div className='p-2.5 rounded-lg bg-slate-50 border border-slate-100'>
                                    <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Next Follow-up</span>
                                    <span className='font-bold text-amber-700'>{selectedUpdate.nextFollowUpDate || 'None'}</span>
                                </div>
                            </div>

                            <div className='p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between'>
                                <div>
                                    <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Status</span>
                                    <span className='font-bold text-slate-900'>{selectedUpdate.status}</span>
                                </div>
                                {selectedUpdate.remarks && (
                                    <div className='text-right'>
                                        <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Remarks</span>
                                        <span className='text-slate-600'>{selectedUpdate.remarks}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end'>
                            <button
                                type='button'
                                onClick={() => setSelectedUpdate(null)}
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

export default ProDailyWorkUpdate
