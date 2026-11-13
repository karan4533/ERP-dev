import React, { useEffect, useState, useMemo } from 'react'
import {
    AlertTriangle,
    Plus,
    Calendar,
    Search,
    RefreshCw,
    Wrench,
    CheckCircle2,
    Clock,
    X,
    Filter,
    Activity,
    ShieldAlert
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { cctvService } from '../../services/modules/cctvService'

const ZONES = [
    'All Zones',
    'Campus Perimeter & Gates',
    'Academic Blocks & Corridors',
    'Science Laboratories Wing',
    'Dining Hall & Cafeteria',
    'Hostel Blocks & Common Areas',
    'Transport Yard & Bus Bays',
]

const DEFECT_CATEGORIES = [
    'Network Signal Drop / POE Failure',
    'Power Surge / Adapter Fault',
    'Camera Lens Scratched / Dirty',
    'IR Illuminator Failure (Night Vision)',
    'PTZ Motor Stuck / Control Error',
    'Hard Disk S.M.A.R.T Warning',
    'NVR Channel Glitch / Video Loss',
]

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

const CctvIssueRegister = () => {
    const [issues, setIssues] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedZone, setSelectedZone] = useState('All Zones')
    const [selectedSeverity, setSelectedSeverity] = useState('ALL')
    const [selectedStatus, setSelectedStatus] = useState('ALL')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [resolvingIssue, setResolvingIssue] = useState(null)
    const [selectedIssue, setSelectedIssue] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    // Form states
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        zone: 'Campus Perimeter & Gates',
        assetId: 'CAM-01',
        assetName: 'Main Gate 1 & Perimeter Security Cabin',
        defectCategory: 'Network Signal Drop / POE Failure',
        severity: 'Medium',
        reportedBy: 'S. Selvakumar (Camera Room)',
        assignedTechnician: 'K. Ramesh (IT Network Team)',
        status: 'Open',
        notes: '',
    })

    const [resolveForm, setResolveForm] = useState({
        status: 'Rectified',
        rectifiedDate: new Date().toISOString().split('T')[0],
        rectifiedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        assignedTechnician: '',
        notes: '',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await cctvService.getIssues()
            if (res.success && Array.isArray(res.data)) {
                setIssues(res.data)
            }
        } catch (err) {
            console.error('Failed to load CCTV issues:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredIssues = useMemo(() => {
        return issues.filter((i) => {
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                i.id?.toLowerCase().includes(q) ||
                i.assetId?.toLowerCase().includes(q) ||
                i.assetName?.toLowerCase().includes(q) ||
                i.defectCategory?.toLowerCase().includes(q) ||
                i.notes?.toLowerCase().includes(q)

            const matchesZone = selectedZone === 'All Zones' || i.zone === selectedZone
            const matchesSeverity = selectedSeverity === 'ALL' || i.severity === selectedSeverity
            const matchesStatus = selectedStatus === 'ALL' || i.status === selectedStatus

            return matchesSearch && matchesZone && matchesSeverity && matchesStatus
        })
    }, [issues, searchQuery, selectedZone, selectedSeverity, selectedStatus])

    // KPI Summary
    const kpiMetrics = useMemo(() => {
        const total = filteredIssues.length
        const criticalOpen = filteredIssues.filter((i) => (i.severity === 'Critical' || i.severity === 'High') && i.status === 'Open').length
        const inProgress = filteredIssues.filter((i) => i.status === 'In Progress').length
        const rectified = filteredIssues.filter((i) => i.status === 'Rectified').length
        return { total, criticalOpen, inProgress, rectified }
    }, [filteredIssues])

    const handleCreateSubmit = async (e) => {
        e.preventDefault()
        if (!form.zone || !form.defectCategory || !form.severity) {
            alert('Please select zone, defect category, and severity.')
            return
        }

        try {
            const res = await cctvService.createIssue(form)
            if (res.success) {
                setIssues((prev) => [res.data, ...prev])
                setShowCreateModal(false)
                setFeedbackMessage(`Surveillance defect ticket ${res.data.id} logged successfully.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setForm({
                    date: new Date().toISOString().split('T')[0],
                    zone: 'Campus Perimeter & Gates',
                    assetId: 'CAM-01',
                    assetName: 'Main Gate 1 & Perimeter Security Cabin',
                    defectCategory: 'Network Signal Drop / POE Failure',
                    severity: 'Medium',
                    reportedBy: 'S. Selvakumar (Camera Room)',
                    assignedTechnician: 'K. Ramesh (IT Network Team)',
                    status: 'Open',
                    notes: '',
                })
            } else {
                alert(`Error: ${res.error?.message || 'Failed to report defect'}`)
            }
        } catch (err) {
            console.error('Error logging issue:', err)
        }
    }

    const openResolveModal = (issue) => {
        setResolvingIssue(issue)
        setResolveForm({
            status: issue.status === 'Open' ? 'In Progress' : 'Rectified',
            rectifiedDate: new Date().toISOString().split('T')[0],
            rectifiedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            assignedTechnician: issue.assignedTechnician || 'K. Ramesh (IT Network Team)',
            notes: '',
        })
    }

    const handleResolveSubmit = async (e) => {
        e.preventDefault()
        if (!resolvingIssue) return

        try {
            const res = await cctvService.resolveIssue(resolvingIssue.id, resolveForm)
            if (res.success) {
                setIssues((prev) => prev.map((i) => (i.id === resolvingIssue.id ? res.data : i)))
                setResolvingIssue(null)
                setFeedbackMessage(`Issue ${res.data.id} updated to status: ${res.data.status}`)
                setTimeout(() => setFeedbackMessage(''), 4000)
            } else {
                alert(`Error: ${res.error?.message || 'Failed to update issue'}`)
            }
        } catch (err) {
            console.error('Error updating issue status:', err)
        }
    }

    const columns = [
        {
            key: 'id',
            label: 'Issue ID & Date',
            required: true,
            render: (row) => (
                <div>
                    <span className='font-mono font-bold text-xs text-slate-900'>{row.id}</span>
                    <div className='text-[10px] text-slate-400 font-mono mt-0.5'>{row.date}</div>
                </div>
            ),
        },
        {
            key: 'asset',
            label: 'Surveillance Asset & Zone',
            required: true,
            render: (row) => (
                <div className='max-w-xs'>
                    <div className='font-bold text-slate-900 text-xs'>{row.assetName}</div>
                    <div className='text-[10px] text-teal-700 font-mono mt-0.5'>ID: {row.assetId} · {row.zone}</div>
                </div>
            ),
        },
        {
            key: 'defectCategory',
            label: 'Defect Category & Severity',
            required: true,
            render: (row) => (
                <div>
                    <div className='text-xs font-semibold text-slate-800'>{row.defectCategory}</div>
                    <div className='mt-1'>
                        <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row.severity === 'Critical'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : row.severity === 'High'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : row.severity === 'Medium'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-slate-100 text-slate-700'
                            }`}
                        >
                            {row.severity} Severity
                        </span>
                    </div>
                </div>
            ),
        },
        {
            key: 'assignedTechnician',
            label: 'Technician',
            required: true,
            render: (row) => (
                <div className='text-xs'>
                    <div className='font-medium text-slate-900'>{row.assignedTechnician}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Reported: {row.reportedBy}</div>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            required: true,
            render: (row) => (
                <div>
                    <StatusBadge status={row.status} />
                    {row.rectifiedDate && (
                        <div className='text-[10px] text-emerald-700 font-mono mt-1'>
                            Rectified: {row.rectifiedDate} ({row.rectifiedTime || ''})
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5'>
                    <button
                        type='button'
                        onClick={() => setSelectedIssue(row)}
                        className='text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors'
                    >
                        Details
                    </button>
                    {row.status !== 'Rectified' && (
                        <button
                            type='button'
                            onClick={() => openResolveModal(row)}
                            className='inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors shadow-xs'
                        >
                            <Wrench className='w-3 h-3' />
                            {row.status === 'Open' ? 'Take Up' : 'Rectify'}
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
                            <Wrench className='w-4 h-4' />
                            Equipment &amp; Hardware Maintenance
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Surveillance Issue &amp; Defect Register
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Defect tracking register for surveillance cameras, NVR servers, POE switches, and cables with status progression and technician rectification logging.
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
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
                            className='inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Report Defect / Issue
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

            {/* KPI Metrics Cards */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Total Reported Issues</div>
                    <div className='text-2xl font-bold text-slate-900 mt-1 font-mono'>{kpiMetrics.total}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Hardware &amp; Network faults</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Critical / High Open</div>
                    <div className='text-2xl font-bold text-rose-600 mt-1 font-mono'>{kpiMetrics.criticalOpen}</div>
                    <div className='text-[10px] text-rose-500 mt-0.5 font-semibold'>Immediate action needed</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>In Progress</div>
                    <div className='text-2xl font-bold text-amber-600 mt-1 font-mono'>{kpiMetrics.inProgress}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>With assigned technicians</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Rectified / Resolved</div>
                    <div className='text-2xl font-bold text-emerald-600 mt-1 font-mono'>{kpiMetrics.rectified}</div>
                    <div className='text-[10px] text-emerald-600 mt-0.5 font-medium'>Restored to operational health</div>
                </div>
            </div>

            {/* Filters */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3'>
                <div className='flex items-center gap-2 w-full md:w-auto flex-wrap'>
                    <div className='relative w-full md:w-64'>
                        <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search defect, asset ID...'
                            className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        />
                    </div>

                    <select
                        value={selectedZone}
                        onChange={(e) => setSelectedZone(e.target.value)}
                        className='px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    >
                        {ZONES.map((z) => (
                            <option key={z} value={z}>{z}</option>
                        ))}
                    </select>

                    <select
                        value={selectedSeverity}
                        onChange={(e) => setSelectedSeverity(e.target.value)}
                        className='px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    >
                        <option value='ALL'>All Severities</option>
                        {SEVERITIES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className='px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    >
                        <option value='ALL'>All Statuses</option>
                        <option value='Open'>Open</option>
                        <option value='In Progress'>In Progress</option>
                        <option value='Rectified'>Rectified</option>
                    </select>
                </div>

                <div className='text-xs font-semibold text-slate-500'>
                    Showing {filteredIssues.length} issues
                </div>
            </div>

            {/* Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Hardware &amp; Camera Defect Logs
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredIssues}
                        emptyMessage='No issues match the selected filters.'
                    />
                </div>
            </div>

            {/* Create Defect Modal */}
            {showCreateModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div className='flex items-center gap-2'>
                                <AlertTriangle className='w-5 h-5 text-amber-600' />
                                <h3 className='text-base font-bold text-slate-900'>Report Surveillance Defect</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setShowCreateModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className='mt-4 space-y-4'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Date *</label>
                                    <input
                                        type='date'
                                        required
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Severity Level *</label>
                                    <select
                                        value={form.severity}
                                        onChange={(e) => setForm({ ...form, severity: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        {SEVERITIES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Campus Zone *</label>
                                    <select
                                        value={form.zone}
                                        onChange={(e) => setForm({ ...form, zone: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        {ZONES.filter((z) => z !== 'All Zones').map((z) => (
                                            <option key={z} value={z}>{z}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Asset ID / Tag</label>
                                    <input
                                        type='text'
                                        value={form.assetId}
                                        onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                                        placeholder='e.g. CAM-04 or NVR-1'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Asset Name / Location Description *</label>
                                <input
                                    type='text'
                                    required
                                    value={form.assetName}
                                    onChange={(e) => setForm({ ...form, assetName: e.target.value })}
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Defect Category *</label>
                                <select
                                    value={form.defectCategory}
                                    onChange={(e) => setForm({ ...form, defectCategory: e.target.value })}
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                >
                                    {DEFECT_CATEGORIES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Assigned Technician</label>
                                    <input
                                        type='text'
                                        value={form.assignedTechnician}
                                        onChange={(e) => setForm({ ...form, assignedTechnician: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Reported By</label>
                                    <input
                                        type='text'
                                        value={form.reportedBy}
                                        onChange={(e) => setForm({ ...form, reportedBy: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Defect Notes &amp; Observations</label>
                                <textarea
                                    rows={3}
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder='Specify symptoms, error logs, or observed signal distortion...'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowCreateModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Log Issue Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Resolve / Status Progression Modal */}
            {resolvingIssue && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div className='flex items-center gap-2'>
                                <Wrench className='w-4 h-4 text-teal-600' />
                                <h3 className='text-sm font-bold text-slate-900'>Update Issue Lifecycle &amp; Rectification</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setResolvingIssue(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <form onSubmit={handleResolveSubmit} className='mt-4 space-y-4'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs'>
                                <div className='font-bold text-slate-900'>{resolvingIssue.assetName}</div>
                                <div className='text-slate-500 mt-0.5'>{resolvingIssue.defectCategory} ({resolvingIssue.severity} Severity)</div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>New Lifecycle Status *</label>
                                <select
                                    value={resolveForm.status}
                                    onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value })}
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                >
                                    <option value='In Progress'>In Progress (Work Assigned)</option>
                                    <option value='Rectified'>Rectified (Hardware Restored)</option>
                                </select>
                            </div>

                            {resolveForm.status === 'Rectified' && (
                                <div className='grid grid-cols-2 gap-3'>
                                    <div>
                                        <label className='block text-xs font-semibold text-slate-700 mb-1'>Rectified Date *</label>
                                        <input
                                            type='date'
                                            required
                                            value={resolveForm.rectifiedDate}
                                            onChange={(e) => setResolveForm({ ...resolveForm, rectifiedDate: e.target.value })}
                                            className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-xs font-semibold text-slate-700 mb-1'>Rectified Time *</label>
                                        <input
                                            type='time'
                                            required
                                            value={resolveForm.rectifiedTime}
                                            onChange={(e) => setResolveForm({ ...resolveForm, rectifiedTime: e.target.value })}
                                            className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Assigned / Resolving Technician *</label>
                                <input
                                    type='text'
                                    required
                                    value={resolveForm.assignedTechnician}
                                    onChange={(e) => setResolveForm({ ...resolveForm, assignedTechnician: e.target.value })}
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Resolution Notes &amp; Rectification Verification</label>
                                <textarea
                                    rows={3}
                                    value={resolveForm.notes}
                                    onChange={(e) => setResolveForm({ ...resolveForm, notes: e.target.value })}
                                    placeholder='Specify parts replaced, test results, or work done...'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setResolvingIssue(null)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Save Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedIssue && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <span className='text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono'>
                                    {selectedIssue.id}
                                </span>
                                <h3 className='text-sm font-bold text-slate-900 mt-1'>{selectedIssue.assetName}</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedIssue(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-3 text-xs'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5'>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Zone:</span>
                                    <span className='font-medium text-slate-900'>{selectedIssue.zone}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Asset ID:</span>
                                    <span className='font-mono font-semibold text-slate-800'>{selectedIssue.assetId}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Defect Category:</span>
                                    <span className='font-semibold text-slate-900'>{selectedIssue.defectCategory}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Severity:</span>
                                    <span className='font-bold text-rose-700'>{selectedIssue.severity}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Reported By:</span>
                                    <span className='text-slate-800'>{selectedIssue.reportedBy} ({selectedIssue.date})</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Assigned Tech:</span>
                                    <span className='font-bold text-teal-800'>{selectedIssue.assignedTechnician}</span>
                                </div>
                            </div>

                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1'>
                                <span className='text-[11px] text-slate-500 block font-medium'>Notes &amp; Observations:</span>
                                <p className='text-slate-800'>{selectedIssue.notes || 'No notes provided.'}</p>
                            </div>

                            {selectedIssue.rectifiedDate && (
                                <div className='p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 space-y-0.5'>
                                    <div className='font-bold flex items-center gap-1.5'>
                                        <CheckCircle2 className='w-4 h-4 text-emerald-600' />
                                        Rectified on {selectedIssue.rectifiedDate} at {selectedIssue.rectifiedTime || 'N/A'}
                                    </div>
                                    <div className='text-[11px] text-emerald-700'>Hardware and network stream restored and validated.</div>
                                </div>
                            )}
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end'>
                            <button
                                type='button'
                                onClick={() => setSelectedIssue(null)}
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

export default CctvIssueRegister
