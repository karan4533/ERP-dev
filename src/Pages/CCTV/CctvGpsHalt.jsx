import React, { useEffect, useState, useMemo } from 'react'
import {
    Navigation,
    Plus,
    Calendar,
    Clock,
    Search,
    RefreshCw,
    MapPin,
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    X,
    Filter,
    Bus,
    Gauge
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { cctvService } from '../../services/modules/cctvService'

const ROUTES = [
    'All Routes',
    'ROUTE-01: Anna Nagar -> Campus',
    'ROUTE-02: Mattuthavani -> Campus',
    'ROUTE-04: Collectorate -> Campus',
    'ROUTE-07: Vilangudi -> Campus',
    'ROUTE-08: Thirunagar -> Campus',
]

const DELAY_REASONS = [
    'Heavy Traffic Congestion / Arterial Jam',
    'Unscheduled Tyre Puncture / Mechanical Check',
    'Road Construction / Police Traffic Diversion',
    'Level Crossing Railway Gate Closed',
    'Severe Weather / Waterlogging',
    'Student Delay at Designated Pickup Stop',
    'Unauthorized Driver Route Deviation',
]

const CctvGpsHalt = () => {
    const [halts, setHalts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRoute, setSelectedRoute] = useState('All Routes')
    const [speedAlertOnly, setSpeedAlertOnly] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedHalt, setSelectedHalt] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        busNo: 'BUS-04',
        routeCode: 'ROUTE-04',
        driverName: 'K. Murugan',
        haltLocation: '',
        scheduledTime: '07:45 AM',
        arrivalTime: '08:05 AM',
        haltDurationMinutes: 20,
        delayReason: 'Heavy Traffic Congestion / Arterial Jam',
        speedAlert: false,
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await cctvService.getGpsHalts()
            if (res.success && Array.isArray(res.data)) {
                setHalts(res.data)
            }
        } catch (err) {
            console.error('Failed to load GPS halts:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredHalts = useMemo(() => {
        return halts.filter((h) => {
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                h.busNo?.toLowerCase().includes(q) ||
                h.routeCode?.toLowerCase().includes(q) ||
                h.driverName?.toLowerCase().includes(q) ||
                h.haltLocation?.toLowerCase().includes(q) ||
                h.delayReason?.toLowerCase().includes(q)

            const matchesRoute =
                selectedRoute === 'All Routes' ||
                h.routeCode === selectedRoute.split(':')[0].trim()

            const matchesSpeedAlert = !speedAlertOnly || h.speedAlert

            return matchesSearch && matchesRoute && matchesSpeedAlert
        })
    }, [halts, searchQuery, selectedRoute, speedAlertOnly])

    const kpiMetrics = useMemo(() => {
        const total = filteredHalts.length
        const criticalDelays = filteredHalts.filter((h) => Number(h.haltDurationMinutes) >= 15).length
        const speedAlerts = filteredHalts.filter((h) => h.speedAlert).length
        const totalDuration = filteredHalts.reduce((acc, curr) => acc + (Number(curr.haltDurationMinutes) || 0), 0)
        return { total, criticalDelays, speedAlerts, totalDuration }
    }, [filteredHalts])

    const handleCreateSubmit = async (e) => {
        e.preventDefault()
        if (!form.busNo || !form.haltLocation.trim() || !form.haltDurationMinutes) {
            alert('Please provide bus number, halt location, and duration.')
            return
        }

        try {
            const res = await cctvService.createGpsHalt(form)
            if (res.success) {
                setHalts((prev) => [res.data, ...prev])
                setShowCreateModal(false)
                setFeedbackMessage(`Unscheduled halt record ${res.data.id} logged for ${res.data.busNo}.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setForm({
                    date: new Date().toISOString().split('T')[0],
                    busNo: 'BUS-04',
                    routeCode: 'ROUTE-04',
                    driverName: 'K. Murugan',
                    haltLocation: '',
                    scheduledTime: '07:45 AM',
                    arrivalTime: '08:05 AM',
                    haltDurationMinutes: 20,
                    delayReason: 'Heavy Traffic Congestion / Arterial Jam',
                    speedAlert: false,
                })
            } else {
                alert(`Error: ${res.error?.message || 'Failed to log GPS halt'}`)
            }
        } catch (err) {
            console.error('Error creating GPS halt:', err)
        }
    }

    const handleAcknowledgeHalt = async (halt) => {
        try {
            const res = await cctvService.acknowledgeGpsHalt(halt.id, {
                acknowledgedBy: 'Control Room Officer',
                acknowledgedAt: new Date().toISOString(),
            })
            if (res.success) {
                setHalts((prev) => prev.map((h) => (h.id === halt.id ? { ...h, acknowledged: true } : h)))
                setFeedbackMessage(`Halt on ${halt.busNo} acknowledged by control room.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
            }
        } catch (err) {
            console.error('Failed to acknowledge halt:', err)
        }
    }

    const columns = [
        {
            key: 'id',
            label: 'Telemetry ID & Date',
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
            label: 'Bus & Route',
            required: true,
            render: (row) => (
                <div>
                    <div className='flex items-center gap-1.5'>
                        <Bus className='w-3.5 h-3.5 text-teal-600' />
                        <span className='font-bold text-slate-900 text-xs'>{row.busNo}</span>
                        <span className='px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-mono'>
                            {row.routeCode}
                        </span>
                    </div>
                    <div className='text-[11px] text-slate-500 mt-0.5'>Driver: {row.driverName}</div>
                </div>
            ),
        },
        {
            key: 'haltLocation',
            label: 'Halt Location & Landmark',
            required: true,
            render: (row) => (
                <div className='max-w-xs text-xs'>
                    <div className='flex items-center gap-1 font-medium text-slate-800'>
                        <MapPin className='w-3.5 h-3.5 text-rose-500 shrink-0' />
                        <span className='truncate' title={row.haltLocation}>{row.haltLocation}</span>
                    </div>
                    <div className='text-[10px] text-slate-400 font-mono mt-0.5 ml-4.5'>
                        Scheduled: {row.scheduledTime} · Actual: {row.arrivalTime}
                    </div>
                </div>
            ),
        },
        {
            key: 'haltDurationMinutes',
            label: 'Delay Duration',
            required: true,
            render: (row) => {
                const mins = Number(row.haltDurationMinutes) || 0
                return (
                    <div>
                        <span
                            className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                                mins >= 15
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                        >
                            +{mins} mins
                        </span>
                        {row.speedAlert && (
                            <div className='mt-1'>
                                <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white'>
                                    <Gauge className='w-2.5 h-2.5' /> Speed Alert
                                </span>
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            key: 'delayReason',
            label: 'Delay Rationale',
            required: true,
            render: (row) => (
                <div className='max-w-xs text-xs text-slate-800 truncate' title={row.delayReason}>
                    {row.delayReason}
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
                        onClick={() => setSelectedHalt(row)}
                        className='text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors'
                    >
                        Details
                    </button>
                    {!row.acknowledged ? (
                        <button
                            type='button'
                            onClick={() => handleAcknowledgeHalt(row)}
                            className='text-xs px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors shadow-xs'
                        >
                            Acknowledge
                        </button>
                    ) : (
                        <span className='inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium px-2 py-0.5 rounded bg-emerald-50'>
                            <CheckCircle2 className='w-3 h-3 text-emerald-600' /> Acknowledged
                        </span>
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
                            <Navigation className='w-4 h-4' />
                            Real-time Transport Telemetry
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            GPS &amp; Unscheduled Halt Register
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Transit control telemetry log tracking unscheduled fleet stoppages, en-route breakdowns, road delays, and speed threshold breach warnings.
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
                            Log Unscheduled Halt
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

            {/* KPI Summary Cards */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Total Unscheduled Halts</div>
                    <div className='text-2xl font-bold text-slate-900 mt-1 font-mono'>{kpiMetrics.total}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Logged across all routes</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Critical Delays (&gt;=15m)</div>
                    <div className='text-2xl font-bold text-rose-600 mt-1 font-mono'>{kpiMetrics.criticalDelays}</div>
                    <div className='text-[10px] text-rose-500 mt-0.5 font-semibold'>Impacting school assembly</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Speed Alerts Flagged</div>
                    <div className='text-2xl font-bold text-amber-600 mt-1 font-mono'>{kpiMetrics.speedAlerts}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Telemetry speed limit triggers</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Cumulative Stoppage Time</div>
                    <div className='text-2xl font-bold text-teal-700 mt-1 font-mono'>{kpiMetrics.totalDuration} <span className='text-xs font-normal text-slate-500'>mins</span></div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Total delay accumulated</div>
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
                            placeholder='Search bus, driver, or location...'
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

                    <label className='flex items-center gap-2 text-xs font-bold text-rose-800 cursor-pointer bg-rose-50 px-3 py-2 rounded-xl border border-rose-200'>
                        <input
                            type='checkbox'
                            checked={speedAlertOnly}
                            onChange={(e) => setSpeedAlertOnly(e.target.checked)}
                            className='rounded text-rose-600'
                        />
                        Speed Alerts Only
                    </label>
                </div>

                <div className='text-xs font-semibold text-slate-500'>
                    Showing {filteredHalts.length} telemetry logs
                </div>
            </div>

            {/* Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Unscheduled Bus Stoppage &amp; Telemetry Logs
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredHalts}
                        emptyMessage='No unscheduled halts recorded for the selected filter.'
                    />
                </div>
            </div>

            {/* Log Halt Modal */}
            {showCreateModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div className='flex items-center gap-2'>
                                <MapPin className='w-5 h-5 text-rose-600' />
                                <h3 className='text-base font-bold text-slate-900'>Log Unscheduled Bus Halt</h3>
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
                                        placeholder='e.g. BUS-04'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Route Code</label>
                                    <input
                                        type='text'
                                        value={form.routeCode}
                                        onChange={(e) => setForm({ ...form, routeCode: e.target.value })}
                                        placeholder='ROUTE-04'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Driver Name</label>
                                    <input
                                        type='text'
                                        value={form.driverName}
                                        onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Halt Location &amp; Landmark *</label>
                                <input
                                    type='text'
                                    required
                                    value={form.haltLocation}
                                    onChange={(e) => setForm({ ...form, haltLocation: e.target.value })}
                                    placeholder='e.g. Near District Collectorate Junction (Old Bypass)'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='grid grid-cols-3 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Scheduled Time</label>
                                    <input
                                        type='text'
                                        value={form.scheduledTime}
                                        onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Actual Arrival</label>
                                    <input
                                        type='text'
                                        value={form.arrivalTime}
                                        onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Delay (Mins) *</label>
                                    <input
                                        type='number'
                                        required
                                        value={form.haltDurationMinutes}
                                        onChange={(e) => setForm({ ...form, haltDurationMinutes: Number(e.target.value) })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Delay Rationale *</label>
                                <select
                                    value={form.delayReason}
                                    onChange={(e) => setForm({ ...form, delayReason: e.target.value })}
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                >
                                    {DELAY_REASONS.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <div className='p-3 rounded-xl bg-amber-50 border border-amber-200'>
                                <label className='flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer'>
                                    <input
                                        type='checkbox'
                                        checked={form.speedAlert}
                                        onChange={(e) => setForm({ ...form, speedAlert: e.target.checked })}
                                        className='rounded text-amber-600'
                                    />
                                    Trigger Speed Alert (Flag driver over-speeding telemetry)
                                </label>
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
                                    Record Stoppage Log
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedHalt && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <span className='text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono'>
                                    {selectedHalt.id}
                                </span>
                                <h3 className='text-sm font-bold text-slate-900 mt-1'>Unscheduled Halt Telemetry</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedHalt(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-3 text-xs'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5'>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Bus &amp; Route:</span>
                                    <span className='font-bold text-slate-900'>{selectedHalt.busNo} ({selectedHalt.routeCode})</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Driver Name:</span>
                                    <span className='text-slate-900 font-medium'>{selectedHalt.driverName}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Location:</span>
                                    <span className='text-slate-900 font-medium'>{selectedHalt.haltLocation}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Delay Duration:</span>
                                    <span className='font-mono font-bold text-rose-700'>+{selectedHalt.haltDurationMinutes} mins</span>
                                </div>
                            </div>

                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1'>
                                <span className='text-[11px] text-slate-500 block font-medium'>Logged Reason:</span>
                                <p className='text-slate-900'>{selectedHalt.delayReason}</p>
                            </div>

                            {selectedHalt.speedAlert && (
                                <div className='p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 flex items-center gap-2'>
                                    <Gauge className='w-4 h-4 text-rose-600' />
                                    <span className='font-semibold'>Speed telemetry threshold exceeded on this route section.</span>
                                </div>
                            )}
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end'>
                            <button
                                type='button'
                                onClick={() => setSelectedHalt(null)}
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

export default CctvGpsHalt
