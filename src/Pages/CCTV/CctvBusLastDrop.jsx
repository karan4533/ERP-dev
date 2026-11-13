import React, { useEffect, useState, useMemo } from 'react'
import {
    Bus,
    Plus,
    Calendar,
    Clock,
    Search,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    UserCheck,
    X,
    Filter,
    FileSpreadsheet,
    Printer,
    ShieldCheck
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { cctvService } from '../../services/modules/cctvService'

const ROUTES = [
    'All Routes',
    'ROUTE-01',
    'ROUTE-02',
    'ROUTE-04',
    'ROUTE-07',
    'ROUTE-08',
]

const CctvBusLastDrop = () => {
    const [drops, setDrops] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRoute, setSelectedRoute] = useState('All Routes')
    const [complianceFilter, setComplianceFilter] = useState('ALL')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedDrop, setSelectedDrop] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        busNo: 'BUS-04',
        routeNo: 'ROUTE-04',
        driverName: 'K. Murugan',
        conductorName: 'M. Selvam',
        totalStudentsDropped: 30,
        lastStopName: 'School Campus Main Gate',
        scheduledTime: '04:30 PM',
        actualDropTime: '04:38 PM',
        emptyBusVerified: true,
        remarks: 'All students safely handed over at designated drop points; bus cabin inspected and locked.',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await cctvService.getBusLastDrops()
            if (res.success && Array.isArray(res.data)) {
                setDrops(res.data)
            }
        } catch (err) {
            console.error('Failed to load bus last drop records:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredDrops = useMemo(() => {
        return drops.filter((d) => {
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                d.busNo?.toLowerCase().includes(q) ||
                d.routeNo?.toLowerCase().includes(q) ||
                d.driverName?.toLowerCase().includes(q) ||
                d.conductorName?.toLowerCase().includes(q) ||
                d.lastStopName?.toLowerCase().includes(q)

            const matchesRoute = selectedRoute === 'All Routes' || d.routeNo === selectedRoute
            const matchesCompliance =
                complianceFilter === 'ALL' ||
                (complianceFilter === 'VERIFIED' && d.emptyBusVerified) ||
                (complianceFilter === 'PENDING' && !d.emptyBusVerified)

            return matchesSearch && matchesRoute && matchesCompliance
        })
    }, [drops, searchQuery, selectedRoute, complianceFilter])

    const kpiMetrics = useMemo(() => {
        const total = filteredDrops.length
        const verifiedCount = filteredDrops.filter((d) => d.emptyBusVerified).length
        const pendingCount = total - verifiedCount
        const totalStudents = filteredDrops.reduce((acc, curr) => acc + (Number(curr.totalStudentsDropped) || 0), 0)
        const complianceRate = total > 0 ? Math.round((verifiedCount / total) * 100) : 100
        return { total, verifiedCount, pendingCount, totalStudents, complianceRate }
    }, [filteredDrops])

    const handleCreateSubmit = async (e) => {
        e.preventDefault()
        if (!form.busNo || !form.routeNo || !form.driverName) {
            alert('Please specify bus number, route, and driver.')
            return
        }

        try {
            const res = await cctvService.createBusLastDrop(form)
            if (res.success) {
                setDrops((prev) => [res.data, ...prev])
                setShowCreateModal(false)
                setFeedbackMessage(`Evening last drop record ${res.data.id} recorded for ${res.data.busNo}.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setForm({
                    date: new Date().toISOString().split('T')[0],
                    busNo: 'BUS-04',
                    routeNo: 'ROUTE-04',
                    driverName: 'K. Murugan',
                    conductorName: 'M. Selvam',
                    totalStudentsDropped: 30,
                    lastStopName: 'School Campus Main Gate',
                    scheduledTime: '04:30 PM',
                    actualDropTime: '04:38 PM',
                    emptyBusVerified: true,
                    remarks: 'All students safely handed over at designated drop points; bus cabin inspected and locked.',
                })
            } else {
                alert(`Error: ${res.error?.message || 'Failed to record last drop'}`)
            }
        } catch (err) {
            console.error('Error logging last drop:', err)
        }
    }

    const handleVerifyDrop = async (drop) => {
        try {
            const res = await cctvService.verifyBusLastDrop(drop.id)
            if (res.success) {
                setDrops((prev) => prev.map((d) => (d.id === drop.id ? { ...d, emptyBusVerified: true } : d)))
                setFeedbackMessage(`Empty bus inspection certified for ${drop.busNo}.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
            }
        } catch (err) {
            console.error('Failed to verify empty bus:', err)
        }
    }

    const exportCsv = () => {
        if (filteredDrops.length === 0) {
            alert('No records to export.')
            return
        }

        const headers = ['Record ID', 'Date', 'Bus No', 'Route No', 'Driver Name', 'Conductor Name', 'Students Dropped', 'Last Stop', 'Scheduled', 'Actual', 'Empty Bus Verified', 'Remarks']
        const rows = filteredDrops.map((d) => [
            d.id,
            d.date,
            d.busNo,
            d.routeNo,
            `"${(d.driverName || '').replace(/"/g, '""')}"`,
            `"${(d.conductorName || '').replace(/"/g, '""')}"`,
            d.totalStudentsDropped,
            `"${(d.lastStopName || '').replace(/"/g, '""')}"`,
            d.scheduledTime,
            d.actualDropTime,
            d.emptyBusVerified ? 'YES' : 'NO',
            `"${(d.remarks || '').replace(/"/g, '""')}"`,
        ])

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
        const link = document.createElement('a')
        link.setAttribute('href', encodeURI(csvContent))
        link.setAttribute('download', `bus_last_drop_report_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const columns = [
        {
            key: 'id',
            label: 'Dispersal ID & Date',
            required: true,
            render: (row) => (
                <div>
                    <span className='font-mono font-bold text-xs text-slate-900'>{row.id}</span>
                    <div className='text-[10px] text-slate-400 font-mono mt-0.5'>{row.date}</div>
                </div>
            ),
        },
        {
            key: 'busRoute',
            label: 'Bus & Route No',
            required: true,
            render: (row) => (
                <div>
                    <div className='flex items-center gap-1.5'>
                        <Bus className='w-3.5 h-3.5 text-teal-600' />
                        <span className='font-bold text-slate-900 text-xs'>{row.busNo}</span>
                        <span className='px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-mono'>
                            {row.routeNo}
                        </span>
                    </div>
                    <div className='text-[11px] text-slate-500 mt-0.5'>Driver: {row.driverName}</div>
                </div>
            ),
        },
        {
            key: 'crewStudents',
            label: 'Conductor & Student Count',
            required: true,
            render: (row) => (
                <div className='text-xs'>
                    <div className='font-semibold text-slate-900'>Conductor: {row.conductorName}</div>
                    <div className='text-[10px] text-teal-700 font-bold mt-0.5'>
                        {row.totalStudentsDropped} Students Dispersed
                    </div>
                </div>
            ),
        },
        {
            key: 'lastStop',
            label: 'Final Stop & Drop Time',
            required: true,
            render: (row) => (
                <div className='max-w-xs text-xs'>
                    <div className='font-medium text-slate-800 truncate' title={row.lastStopName}>{row.lastStopName}</div>
                    <div className='text-[10px] text-slate-500 font-mono mt-0.5'>
                        Actual: {row.actualDropTime} (Sched: {row.scheduledTime})
                    </div>
                </div>
            ),
        },
        {
            key: 'emptyBusVerified',
            label: 'Empty Bus Inspection',
            required: true,
            render: (row) =>
                row.emptyBusVerified ? (
                    <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200'>
                        <CheckCircle2 className='w-3 h-3 text-emerald-600' /> Verified Empty
                    </span>
                ) : (
                    <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200'>
                        <AlertCircle className='w-3 h-3 text-rose-600' /> Unconfirmed
                    </span>
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
                        onClick={() => setSelectedDrop(row)}
                        className='text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors'
                    >
                        Details
                    </button>
                    {!row.emptyBusVerified && (
                        <button
                            type='button'
                            onClick={() => handleVerifyDrop(row)}
                            className='inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors shadow-xs'
                        >
                            <ShieldCheck className='w-3 h-3' />
                            Verify Empty
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
                            <Bus className='w-4 h-4' />
                            Evening Student Safety &amp; Dispersal Audit
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Bus Last Drop &amp; Dispersal Register
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Evening school bus trip completion verification ensuring 100% of students have been safely dropped and mandatory empty bus cabin sweeps performed.
                        </p>
                    </div>
                    <div className='flex items-center gap-2 flex-wrap'>
                        <button
                            type='button'
                            onClick={exportCsv}
                            className='inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <FileSpreadsheet className='w-3.5 h-3.5 text-emerald-600' />
                            Export CSV
                        </button>
                        <button
                            type='button'
                            onClick={() => window.print()}
                            className='inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <Printer className='w-3.5 h-3.5 text-slate-600' />
                            Print
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
                            className='inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Record Last Drop
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

            {/* KPI Metrics */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Routes Audited</div>
                    <div className='text-2xl font-bold text-slate-900 mt-1 font-mono'>{kpiMetrics.total}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Active evening routes</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Empty Bus Compliance</div>
                    <div className='text-2xl font-bold text-emerald-600 mt-1 font-mono'>{kpiMetrics.complianceRate}%</div>
                    <div className='text-[10px] text-emerald-600 mt-0.5 font-medium'>{kpiMetrics.verifiedCount} of {kpiMetrics.total} verified</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Pending Verification</div>
                    <div className='text-2xl font-bold text-rose-600 mt-1 font-mono'>{kpiMetrics.pendingCount}</div>
                    <div className='text-[10px] text-rose-500 mt-0.5 font-semibold'>Awaiting conductor confirmation</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Students Dropped</div>
                    <div className='text-2xl font-bold text-teal-700 mt-1 font-mono'>{kpiMetrics.totalStudents}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Safe transit total</div>
                </div>
            </div>

            {/* Filters */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3'>
                <div className='flex items-center gap-3 w-full md:w-auto flex-wrap'>
                    <div className='relative w-full md:w-64'>
                        <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search bus, conductor, stop...'
                            className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        />
                    </div>

                    <select
                        value={selectedRoute}
                        onChange={(e) => setSelectedRoute(e.target.value)}
                        className='px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    >
                        {ROUTES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>

                    <select
                        value={complianceFilter}
                        onChange={(e) => setComplianceFilter(e.target.value)}
                        className='px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    >
                        <option value='ALL'>All Compliance States</option>
                        <option value='VERIFIED'>Verified Empty Only</option>
                        <option value='PENDING'>Unconfirmed Pending Only</option>
                    </select>
                </div>

                <div className='text-xs font-semibold text-slate-500'>
                    Showing {filteredDrops.length} dispersal records
                </div>
            </div>

            {/* Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Dispersal &amp; Final Drop Compliance Log
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredDrops}
                        emptyMessage='No bus drop records found matching active filters.'
                    />
                </div>
            </div>

            {/* Create Last Drop Modal */}
            {showCreateModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div className='flex items-center gap-2'>
                                <Bus className='w-5 h-5 text-teal-600' />
                                <h3 className='text-base font-bold text-slate-900'>Record Evening Final Drop</h3>
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
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Bus Number *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.busNo}
                                        onChange={(e) => setForm({ ...form, busNo: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Route Number *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.routeNo}
                                        onChange={(e) => setForm({ ...form, routeNo: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Total Students Dropped *</label>
                                    <input
                                        type='number'
                                        required
                                        value={form.totalStudentsDropped}
                                        onChange={(e) => setForm({ ...form, totalStudentsDropped: Number(e.target.value) })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Driver Full Name *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.driverName}
                                        onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Conductor Full Name *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.conductorName}
                                        onChange={(e) => setForm({ ...form, conductorName: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Last Stop Name / Terminal Landmark *</label>
                                <input
                                    type='text'
                                    required
                                    value={form.lastStopName}
                                    onChange={(e) => setForm({ ...form, lastStopName: e.target.value })}
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Scheduled Final Time</label>
                                    <input
                                        type='text'
                                        value={form.scheduledTime}
                                        onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Actual Dispersal Time</label>
                                    <input
                                        type='text'
                                        value={form.actualDropTime}
                                        onChange={(e) => setForm({ ...form, actualDropTime: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div className='p-3 rounded-xl bg-teal-50 border border-teal-200'>
                                <label className='flex items-center gap-2 text-xs font-bold text-teal-900 cursor-pointer'>
                                    <input
                                        type='checkbox'
                                        checked={form.emptyBusVerified}
                                        onChange={(e) => setForm({ ...form, emptyBusVerified: e.target.checked })}
                                        className='rounded text-teal-600'
                                    />
                                    Confirm Empty Bus Verification (Physically swept all seat rows; no student or baggage left)
                                </label>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Dispersal Remarks &amp; Handover Notes</label>
                                <textarea
                                    rows={2}
                                    value={form.remarks}
                                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                                    placeholder='Specify handover status, bus parking bay, or exceptions...'
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
                                    Submit Dispersal Confirmation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedDrop && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <span className='text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono'>
                                    {selectedDrop.id}
                                </span>
                                <h3 className='text-sm font-bold text-slate-900 mt-1'>{selectedDrop.busNo} Last Drop Verification</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedDrop(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-3 text-xs'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5'>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Route &amp; Bus:</span>
                                    <span className='font-bold text-slate-900'>{selectedDrop.routeNo} ({selectedDrop.busNo})</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Driver:</span>
                                    <span className='text-slate-900 font-medium'>{selectedDrop.driverName}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Conductor:</span>
                                    <span className='text-slate-900 font-medium'>{selectedDrop.conductorName}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Students Dropped:</span>
                                    <span className='font-bold text-teal-800 font-mono'>{selectedDrop.totalStudentsDropped}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Terminal Stop:</span>
                                    <span className='text-slate-900 font-medium'>{selectedDrop.lastStopName}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Drop Time:</span>
                                    <span className='font-mono font-bold text-slate-800'>{selectedDrop.actualDropTime} (Scheduled: {selectedDrop.scheduledTime})</span>
                                </div>
                            </div>

                            <div className={`p-3 rounded-xl border ${selectedDrop.emptyBusVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                                <div className='font-bold flex items-center gap-1.5'>
                                    {selectedDrop.emptyBusVerified ? (
                                        <>
                                            <CheckCircle2 className='w-4 h-4 text-emerald-600' />
                                            Empty Bus Cabin Certified Safe
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className='w-4 h-4 text-rose-600' />
                                            Empty Bus Check Unconfirmed
                                        </>
                                    )}
                                </div>
                                <div className='text-[11px] mt-1'>
                                    {selectedDrop.emptyBusVerified
                                        ? 'Physical sweep performed; vehicle secured in parking bay.'
                                        : 'Immediate physical inspection of vehicle interior required.'}
                                </div>
                            </div>

                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1'>
                                <span className='text-[11px] text-slate-500 block font-medium'>Remarks:</span>
                                <p className='text-slate-800'>{selectedDrop.remarks || 'No remarks provided.'}</p>
                            </div>
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end'>
                            <button
                                type='button'
                                onClick={() => setSelectedDrop(null)}
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

export default CctvBusLastDrop
