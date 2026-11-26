import React, { useEffect, useState, useMemo } from 'react'
import {
    Activity,
    FileText,
    Download,
    Printer,
    RefreshCw,
    Search,
    Calendar,
    Filter,
    Archive,
    ArrowRightLeft,
    ShieldAlert,
    CheckCircle2,
    Clock,
    Lock,
    Building2,
    RotateCcw
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { fileRoomService } from '../../services/modules/fileRoomService'

const DEPARTMENTS = [
    'ALL',
    'Academics',
    'Administration',
    'HR',
    'Finance',
    'Operations / Facilities',
    'Executive Governance',
    'PRO',
]

const CATEGORIES = [
    'ALL',
    'Examination Tabulation & Result Sheets',
    'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    'Government Affiliation & Statutory Permitting Files',
    'Financial Audit Registers, Ledgers & Vouchers',
    'Procurement, Vendor Agreements & Contracts',
    'General Administrative Directives & Policies',
]

const ACTION_TYPES = [
    'ALL',
    'FILE_REGISTERED',
    'FILE_CHECKOUT',
    'FILE_RETURNED',
    'FILE_RENAMED',
    'DISPOSAL_CERTIFIED',
    'REQUISITION_RAISED',
    'REQUISITION_APPROVED',
]

const FileRoomReportsActivity = () => {
    const [activeTab, setActiveTab] = useState('ACTIVITY') // ACTIVITY, REPORTS, SUMMARY
    const [activities, setActivities] = useState([])
    const [files, setFiles] = useState([])
    const [outward, setOutward] = useState([])
    const [disposals, setDisposals] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    // Filters
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [selectedDept, setSelectedDept] = useState('ALL')
    const [selectedCat, setSelectedCat] = useState('ALL')
    const [selectedAction, setSelectedAction] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')

    const loadAllData = async () => {
        setLoading(true)
        try {
            const [actRes, filesRes, outwardRes, dispRes, statsRes] = await Promise.all([
                fileRoomService.getActivities({
                    fromDate,
                    toDate,
                    department: selectedDept,
                    action: selectedAction,
                    search: searchQuery,
                }),
                fileRoomService.getFiles(),
                fileRoomService.getOutwardRegister(),
                fileRoomService.getDisposals(),
                fileRoomService.getFileRoomStats(),
            ])

            if (actRes.success && Array.isArray(actRes.data)) setActivities(actRes.data)
            if (filesRes.success && Array.isArray(filesRes.data)) setFiles(filesRes.data)
            if (outwardRes.success && Array.isArray(outwardRes.data)) setOutward(outwardRes.data)
            if (dispRes.success && Array.isArray(dispRes.data)) setDisposals(dispRes.data)
            if (statsRes.success) setStats(statsRes.data)
        } catch (err) {
            console.error('Failed to load activity reports:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadAllData()
    }, [selectedDept, selectedAction, fromDate, toDate])

    const handleSearchSubmit = (e) => {
        e.preventDefault()
        loadAllData()
    }

    const resetFilters = () => {
        setFromDate('')
        setToDate('')
        setSelectedDept('ALL')
        setSelectedCat('ALL')
        setSelectedAction('ALL')
        setSearchQuery('')
    }

    // Filtered Report Files
    const reportFiles = useMemo(() => {
        return files.filter((f) => {
            const matchesDept = selectedDept === 'ALL' || f.ownerDepartment === selectedDept
            const matchesCat = selectedCat === 'ALL' || f.category === selectedCat
            const fileDate = f.accessionDate || f.lastMovementDate || f.createdAt?.split('T')[0] || ''
            if (fromDate && fileDate && fileDate < fromDate) return false
            if (toDate && fileDate && fileDate > toDate) return false

            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                f.fileRefNo?.toLowerCase().includes(q) ||
                f.fileName?.toLowerCase().includes(q) ||
                f.ownerDepartment?.toLowerCase().includes(q)

            return matchesDept && matchesCat && matchesSearch
        })
    }, [files, selectedDept, selectedCat, fromDate, toDate, searchQuery])

    // CSV Download
    const exportCSV = () => {
        if (activeTab === 'ACTIVITY') {
            if (!activities.length) return alert('No activity logs to export.')
            const headers = ['Timestamp', 'Action', 'File Ref', 'Document Title', 'Actor', 'Department', 'Details']
            const rows = activities.map((a) => [
                `"${a.timestamp}"`,
                `"${a.action}"`,
                `"${a.fileRefNo}"`,
                `"${(a.fileName || '').replace(/"/g, '""')}"`,
                `"${a.actor}"`,
                `"${a.department}"`,
                `"${(a.details || '').replace(/"/g, '""')}"`,
            ])
            downloadCsvBlob(headers, rows, 'FileRoom_Activity_Audit_Log')
        } else {
            if (!reportFiles.length) return alert('No files to export.')
            const headers = ['Barcode', 'Document Title', 'Category', 'Owner Dept', 'Storage Location', 'Security Tier', 'Status', 'Registered Date']
            const rows = reportFiles.map((f) => {
                const loc = f.storageLocation || {}
                const locStr = `${loc.cupboardRack || loc.rackNo || 'Rack'}/${loc.shelfLevel || loc.shelfNo || 'Shelf'}/${loc.boxFolder || loc.boxNo || 'Box'}`
                return [
                    `"${f.fileRefNo}"`,
                    `"${(f.fileName || '').replace(/"/g, '""')}"`,
                    `"${f.category}"`,
                    `"${f.ownerDepartment}"`,
                    `"${locStr}"`,
                    `"${f.confidentiality}"`,
                    `"${f.currentLocationStatus}"`,
                    `"${f.accessionDate || f.lastMovementDate || 'Permanent'}"`,
                ]
            })
            downloadCsvBlob(headers, rows, 'FileRoom_Custody_Report')
        }
    }

    const downloadCsvBlob = (headers, rows, baseName) => {
        const fromStr = fromDate || 'Start'
        const toStr = toDate || 'Current'
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `${baseName}_${fromStr}_${toStr}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const triggerPrint = () => {
        window.print()
    }

    // Activity Columns
    const activityColumns = [
        {
            key: 'timestamp',
            label: 'Timestamp & Actor',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-mono text-xs font-bold text-slate-900'>
                        {row.timestamp ? new Date(row.timestamp).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className='text-[10px] text-slate-400 font-mono'>
                        {row.timestamp ? new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                    <div className='text-[11px] text-slate-600 font-semibold mt-0.5'>{row.actor}</div>
                </div>
            ),
        },
        {
            key: 'action',
            label: 'Action Performed',
            required: true,
            render: (row) => {
                let badgeClass = 'bg-slate-100 text-slate-800'
                if (row.action.includes('REGISTERED')) badgeClass = 'bg-teal-100 text-teal-800 border border-teal-200'
                else if (row.action.includes('CHECKOUT')) badgeClass = 'bg-blue-100 text-blue-800 border border-blue-200'
                else if (row.action.includes('RETURNED')) badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                else if (row.action.includes('RENAMED')) badgeClass = 'bg-amber-100 text-amber-800 border border-amber-200'
                else if (row.action.includes('DISPOSAL')) badgeClass = 'bg-rose-100 text-rose-800 border border-rose-200'
                else if (row.action.includes('REQUISITION')) badgeClass = 'bg-purple-100 text-purple-800 border border-purple-200'

                return (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeClass}`}>
                        {row.action}
                    </span>
                )
            },
        },
        {
            key: 'fileRefNo',
            label: 'Target Dossier & Department',
            required: true,
            render: (row) => (
                <div className='max-w-md'>
                    <div className='font-bold text-slate-900 text-xs'>{row.fileName}</div>
                    <div className='text-[11px] text-slate-500 font-mono mt-0.5'>
                        {row.fileRefNo} · Dept: <span className='text-slate-800 font-sans font-semibold'>{row.department}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'details',
            label: 'Audit Log Details',
            required: true,
            render: (row) => <span className='text-xs text-slate-700 leading-relaxed'>{row.details}</span>,
        },
    ]

    // Report Files Columns
    const reportFileColumns = [
        {
            key: 'fileRefNo',
            label: 'Barcode',
            required: true,
            render: (row) => <span className='font-mono text-xs font-bold text-slate-900'>{row.fileRefNo}</span>,
        },
        {
            key: 'fileName',
            label: 'Document Title & Category',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-bold text-slate-900 text-xs'>{row.fileName}</div>
                    <div className='text-[11px] text-slate-500'>{row.category}</div>
                </div>
            ),
        },
        {
            key: 'ownerDepartment',
            label: 'Owning Department',
            required: true,
            render: (row) => <span className='text-xs font-semibold text-slate-800'>{row.ownerDepartment}</span>,
        },
        {
            key: 'confidentiality',
            label: 'Security Tier',
            required: true,
            render: (row) => <span className='text-xs font-bold text-slate-700'>{row.confidentiality}</span>,
        },
        {
            key: 'currentLocationStatus',
            label: 'Custody Status',
            required: true,
            render: (row) => <StatusBadge status={row.currentLocationStatus} />,
        },
    ]

    return (
        <section className='space-y-6 p-1'>
            {/* Header */}
            <div className='rounded-2xl bg-white p-5 border border-slate-200 shadow-xs'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700'>
                            <Activity className='w-4 h-4' />
                            Central File Room Auditing &amp; Telemetry
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Activity &amp; Report Workspace
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Unified activity audit timeline, custody movement registers, category reports, CSV dataset generation, and printable summaries.
                        </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2.5'>
                        <button
                            type='button'
                            onClick={exportCSV}
                            className='inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <Download className='w-3.5 h-3.5' />
                            Download CSV
                        </button>
                        <button
                            type='button'
                            onClick={triggerPrint}
                            className='inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <Printer className='w-3.5 h-3.5' />
                            Print / PDF Export
                        </button>
                        <button
                            type='button'
                            onClick={loadAllData}
                            className='inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Metrics Summary */}
            <div className='grid grid-cols-2 sm:grid-cols-5 gap-4'>
                <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs'>
                    <span className='text-xs font-medium text-slate-500 uppercase tracking-wider block'>Cataloged Dossiers</span>
                    <span className='text-2xl font-black text-slate-900 mt-1 block'>{stats?.totalFiles ?? files.length}</span>
                    <span className='text-[11px] text-slate-400 mt-0.5 block'>In Master Inventory</span>
                </div>
                <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs'>
                    <span className='text-xs font-medium text-slate-500 uppercase tracking-wider block'>Available in Archive</span>
                    <span className='text-2xl font-black text-teal-600 mt-1 block'>{stats?.availableFiles ?? 0}</span>
                    <span className='text-[11px] text-teal-600 font-medium mt-0.5 block'>Ready for issue</span>
                </div>
                <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs'>
                    <span className='text-xs font-medium text-slate-500 uppercase tracking-wider block'>Active Issued Loans</span>
                    <span className='text-2xl font-black text-blue-600 mt-1 block'>{stats?.checkedOutFiles ?? 0}</span>
                    <span className='text-[11px] text-blue-600 font-medium mt-0.5 block'>Under circulation</span>
                </div>
                <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs'>
                    <span className='text-xs font-medium text-slate-500 uppercase tracking-wider block'>Overdue Borrows</span>
                    <span className='text-2xl font-black text-rose-600 mt-1 block'>{stats?.overdueCount ?? 0}</span>
                    <span className='text-[11px] text-rose-600 font-medium mt-0.5 block'>Action required</span>
                </div>
                <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs'>
                    <span className='text-xs font-medium text-slate-500 uppercase tracking-wider block'>Disposed / Destroyed</span>
                    <span className='text-2xl font-black text-purple-700 mt-1 block'>{stats?.totalDisposals ?? disposals.length}</span>
                    <span className='text-[11px] text-purple-700 font-medium mt-0.5 block'>Board authorized</span>
                </div>
            </div>

            {/* Tab Navigation & Filters */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3'>
                <div className='flex flex-wrap items-center justify-between gap-4'>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={() => setActiveTab('ACTIVITY')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                                activeTab === 'ACTIVITY'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                            Activity Audit Timeline ({activities.length})
                        </button>
                        <button
                            type='button'
                            onClick={() => setActiveTab('REPORTS')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                                activeTab === 'REPORTS'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                            Custody Reports &amp; Register ({reportFiles.length})
                        </button>
                    </div>

                    <form onSubmit={handleSearchSubmit} className='relative w-full md:w-64'>
                        <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search file, actor, details...'
                            className='w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        />
                    </form>
                </div>

                {/* Filter Controls */}
                <div className='flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100'>
                    <div className='flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200'>
                        <Calendar className='w-3.5 h-3.5 text-teal-600' />
                        <span className='font-semibold text-slate-500'>Date:</span>
                        <input
                            type='date'
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className='px-1.5 py-0.5 text-xs rounded border border-slate-200 bg-white font-mono'
                        />
                        <span className='text-slate-400'>to</span>
                        <input
                            type='date'
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className='px-1.5 py-0.5 text-xs rounded border border-slate-200 bg-white font-mono'
                        />
                    </div>

                    <div className='flex items-center gap-2'>
                        <span className='text-xs font-medium text-slate-500'>Department:</span>
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        >
                            {DEPARTMENTS.map((d) => (
                                <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>
                            ))}
                        </select>
                    </div>

                    {activeTab === 'ACTIVITY' ? (
                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-medium text-slate-500'>Action:</span>
                            <select
                                value={selectedAction}
                                onChange={(e) => setSelectedAction(e.target.value)}
                                className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                            >
                                {ACTION_TYPES.map((a) => (
                                    <option key={a} value={a}>{a === 'ALL' ? 'All Activity Types' : a}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-medium text-slate-500'>Category:</span>
                            <select
                                value={selectedCat}
                                onChange={(e) => setSelectedCat(e.target.value)}
                                className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 max-w-[200px] truncate'
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {(fromDate || toDate || selectedDept !== 'ALL' || selectedCat !== 'ALL' || selectedAction !== 'ALL' || searchQuery) && (
                        <button
                            type='button'
                            onClick={resetFilters}
                            className='text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1'
                        >
                            <RotateCcw className='w-3 h-3' /> Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Main Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        {activeTab === 'ACTIVITY'
                            ? `File Room Activity Audit Log (${activities.length} entries)`
                            : `Physical Document Custody Register (${reportFiles.length} records)`}
                    </h2>
                </div>
                <div className='p-2'>
                    {activeTab === 'ACTIVITY' ? (
                        <DataTable
                            columns={activityColumns}
                            data={activities}
                            emptyMessage='No activity events found matching the filter criteria.'
                        />
                    ) : (
                        <DataTable
                            columns={reportFileColumns}
                            data={reportFiles}
                            emptyMessage='No physical files match the selected report criteria.'
                        />
                    )}
                </div>
            </div>
        </section>
    )
}

export default FileRoomReportsActivity
