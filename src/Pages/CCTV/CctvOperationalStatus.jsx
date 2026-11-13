import React, { useEffect, useState, useMemo } from 'react'
import {
    ShieldCheck,
    Plus,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Camera,
    Search,
    UserCheck,
    X,
    ClipboardCheck,
    Wrench
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { cctvService } from '../../services/modules/cctvService'

const SHIFTS = [
    'Morning Shift (06:00 - 14:00)',
    'Evening Shift (14:00 - 22:00)',
    'Night Shift (22:00 - 06:00)',
]

const CctvOperationalStatus = () => {
    const [checks, setChecks] = useState([])
    const [cameras, setCameras] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showLogModal, setShowLogModal] = useState(false)
    const [selectedCheck, setSelectedCheck] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')
    const [resolvingAnomaly, setResolvingAnomaly] = useState(null)
    const [resolveForm, setResolveForm] = useState({
        rectifiedDate: new Date().toISOString().split('T')[0],
        rectifiedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        rectifiedBy: 'S. Selvakumar (Technician)',
        resolutionNotes: '',
    })

    // Form state
    const [form, setForm] = useState({
        checkDate: new Date().toISOString().split('T')[0],
        shift: 'Morning Shift (06:00 - 14:00)',
        inspectorId: 'EMP-CCTV-001',
        inspectorName: 'S. Selvakumar (Camera Room In-charge)',
        totalCamerasMonitored: 45,
        onlineCount: 43,
        offlineCount: 1,
        underMaintenanceCount: 1,
        nvrStorageBufferHealth: '100% OK',
        anomaliesText: '',
        raiseTicket: true,
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const [checksRes, camsRes] = await Promise.all([
                cctvService.getDailyChecks(),
                cctvService.getCameras(),
            ])

            if (checksRes.success && Array.isArray(checksRes.data)) {
                setChecks(checksRes.data)
            }
            if (camsRes.success && Array.isArray(camsRes.data)) {
                setCameras(camsRes.data)
                setForm((prev) => ({
                    ...prev,
                    totalCamerasMonitored: camsRes.data.length,
                    onlineCount: camsRes.data.filter((c) => c.currentStatus === 'Online / Active').length,
                    offlineCount: camsRes.data.filter((c) => c.currentStatus === 'Offline').length,
                    underMaintenanceCount: camsRes.data.filter((c) => c.currentStatus === 'Under Maintenance').length,
                }))
            }
        } catch (err) {
            console.error('Failed to load CCTV operational checks:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredChecks = useMemo(() => {
        return checks.filter((c) => {
            const q = searchQuery.toLowerCase().trim()
            return (
                !q ||
                c.shift.toLowerCase().includes(q) ||
                c.inspectorName.toLowerCase().includes(q) ||
                c.checkDate.toLowerCase().includes(q)
            )
        })
    }, [checks, searchQuery])

    const handleLogSubmit = async (e) => {
        e.preventDefault()
        if (!form.checkDate || !form.shift || !form.inspectorName) {
            alert('Please fill in check date, shift, and inspector name.')
            return
        }

        const anomalies = []
        if (form.anomaliesText.trim()) {
            anomalies.push({
                cameraId: 'CAM-MULTIPLE',
                anomalyDescription: form.anomaliesText,
                actionTaken: form.raiseTicket ? 'High priority ticket automatically raised in IT/Maintenance queue.' : 'Noted in shift log.',
                ticketRaised: form.raiseTicket,
            })
        }

        const payload = {
            checkDate: form.checkDate,
            shift: form.shift,
            inspectorId: form.inspectorId,
            inspectorName: form.inspectorName,
            totalCamerasMonitored: Number(form.totalCamerasMonitored),
            onlineCount: Number(form.onlineCount),
            offlineCount: Number(form.offlineCount),
            underMaintenanceCount: Number(form.underMaintenanceCount),
            nvrStorageBufferHealth: form.nvrStorageBufferHealth,
            findingsAndAnomalies: anomalies,
        }

        try {
            const res = await cctvService.logDailyCheck(payload)
            if (res.success) {
                setChecks((prev) => [res.data, ...prev])
                setShowLogModal(false)
                setFeedbackMessage(`Operational shift check logged successfully. Status: ${res.data.status}`)
                setTimeout(() => setFeedbackMessage(''), 4000)
            } else {
                alert(`Error: ${res.error?.message || 'Failed to log daily check'}`)
            }
        } catch (err) {
            console.error('Check submission failed:', err)
        }
    }

    const openResolveModal = (check, anomalyIndex) => {
        setResolvingAnomaly({ check, index: anomalyIndex })
        setResolveForm({
            rectifiedDate: new Date().toISOString().split('T')[0],
            rectifiedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            rectifiedBy: 'S. Selvakumar (Technician)',
            resolutionNotes: '',
        })
    }

    const handleResolveSubmit = async (e) => {
        e.preventDefault()
        if (!resolvingAnomaly) return

        const { check, index } = resolvingAnomaly
        try {
            const res = await cctvService.resolveCheckAnomaly(check.id, index, resolveForm)
            if (res.success) {
                // Update checks list
                setChecks((prev) => prev.map((c) => (c.id === check.id ? res.data : c)))
                if (selectedCheck && selectedCheck.id === check.id) {
                    setSelectedCheck(res.data)
                }
                setResolvingAnomaly(null)
                setFeedbackMessage(`Anomaly marked as rectified successfully. Check status updated to: ${res.data.status}`)
                setTimeout(() => setFeedbackMessage(''), 4000)
            } else {
                alert(`Error: ${res.error || 'Failed to resolve anomaly'}`)
            }
        } catch (err) {
            console.error('Resolution submission failed:', err)
        }
    }

    const columns = [
        {
            key: 'checkDate',
            label: 'Inspection Date & Shift',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-mono font-bold text-xs text-slate-900'>{row.checkDate}</div>
                    <div className='text-[11px] text-teal-700 font-semibold mt-0.5'>{row.shift}</div>
                </div>
            ),
        },
        {
            key: 'inspectorName',
            label: 'Shift Inspector',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-bold text-slate-900 text-xs'>{row.inspectorName}</div>
                    <div className='text-[10px] text-slate-400 font-mono mt-0.5'>{row.inspectorId}</div>
                </div>
            ),
        },
        {
            key: 'cameraTelemetry',
            label: 'Telemetry Breakdown',
            required: true,
            render: (row) => (
                <div className='text-xs font-mono flex items-center gap-2'>
                    <span className='text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded'>
                        {row.onlineCount} Online
                    </span>
                    <span className='text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded'>
                        {row.offlineCount} Offline
                    </span>
                    {row.underMaintenanceCount > 0 && (
                        <span className='text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded'>
                            {row.underMaintenanceCount} Maint
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'nvrStorageBufferHealth',
            label: 'NVR Storage Health',
            required: true,
            render: (row) => (
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    row.nvrStorageBufferHealth?.includes('OK')
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-amber-50 text-amber-800'
                }`}>
                    {row.nvrStorageBufferHealth || '100% OK'}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Shift Status',
            required: true,
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'actions',
            label: 'Log Details',
            required: true,
            render: (row) => (
                <button
                    type='button'
                    onClick={() => setSelectedCheck(row)}
                    className='text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors'
                >
                    Review Log
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
                            <ShieldCheck className='w-4 h-4' />
                            Operational Health Monitoring
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Daily Shift Inspection &amp; Operational Health
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Routine shift-wise camera diagnostics (Morning, Evening, Night), automated ticketing for offline hardware, and storage health monitoring.
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
                            onClick={() => setShowLogModal(true)}
                            className='inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Log Shift Health Check
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
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-4'>
                <div className='flex items-center gap-2 text-xs font-semibold text-slate-500'>
                    <span>Daily Inspection Log Register</span>
                </div>

                <div className='relative w-full md:w-72'>
                    <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search shift, date, or inspector...'
                        className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    />
                </div>
            </div>

            {/* Shift Check Logs Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Recorded Shift Inspections ({filteredChecks.length})
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredChecks}
                        emptyMessage='No shift inspection records found.'
                    />
                </div>
            </div>

            {/* Log Shift Health Check Modal */}
            {showLogModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <h3 className='text-base font-bold text-slate-900'>Log Operational Shift Health Check</h3>
                            <button
                                type='button'
                                onClick={() => setShowLogModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        <form onSubmit={handleLogSubmit} className='mt-4 space-y-4'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Check Date *</label>
                                    <input
                                        type='date'
                                        required
                                        value={form.checkDate}
                                        onChange={(e) => setForm({ ...form, checkDate: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Shift Timing *</label>
                                    <select
                                        value={form.shift}
                                        onChange={(e) => setForm({ ...form, shift: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        {SHIFTS.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Inspector Name *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.inspectorName}
                                        onChange={(e) => setForm({ ...form, inspectorName: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Inspector ID</label>
                                    <input
                                        type='text'
                                        value={form.inspectorId}
                                        onChange={(e) => setForm({ ...form, inspectorId: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                            </div>

                            {/* Camera health count diagnostics */}
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2'>
                                <span className='text-xs font-bold text-slate-800 uppercase tracking-wider block'>
                                    Shift Diagnostics
                                </span>
                                <div className='grid grid-cols-3 gap-2'>
                                    <div>
                                        <label className='block text-[11px] font-semibold text-emerald-700 mb-1'>Online Count</label>
                                        <input
                                            type='number'
                                            value={form.onlineCount}
                                            onChange={(e) => setForm({ ...form, onlineCount: Number(e.target.value) })}
                                            className='w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white font-mono'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-[11px] font-semibold text-rose-700 mb-1'>Offline Count</label>
                                        <input
                                            type='number'
                                            value={form.offlineCount}
                                            onChange={(e) => setForm({ ...form, offlineCount: Number(e.target.value) })}
                                            className='w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white font-mono'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-[11px] font-semibold text-amber-700 mb-1'>Maintenance</label>
                                        <input
                                            type='number'
                                            value={form.underMaintenanceCount}
                                            onChange={(e) => setForm({ ...form, underMaintenanceCount: Number(e.target.value) })}
                                            className='w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white font-mono'
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>NVR Storage Buffer Health</label>
                                <select
                                    value={form.nvrStorageBufferHealth}
                                    onChange={(e) => setForm({ ...form, nvrStorageBufferHealth: e.target.value })}
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                >
                                    <option value='100% OK'>100% OK (Healthy Buffer)</option>
                                    <option value='Warning > 85% Full'>Warning &gt; 85% Full</option>
                                    <option value='Storage Degraded'>Storage Degraded</option>
                                </select>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Anomalies, Feed Glitches &amp; Offline Notes</label>
                                <textarea
                                    rows={2}
                                    value={form.anomaliesText}
                                    onChange={(e) => setForm({ ...form, anomaliesText: e.target.value })}
                                    placeholder='Specify camera ID and symptom (e.g. CAM-02 offline due to power surge)...'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            {form.anomaliesText && (
                                <label className='flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer p-2 rounded-lg bg-rose-50 border border-rose-100'>
                                    <input
                                        type='checkbox'
                                        checked={form.raiseTicket}
                                        onChange={(e) => setForm({ ...form, raiseTicket: e.target.checked })}
                                        className='rounded text-teal-600'
                                    />
                                    Automatically raise high-priority Maintenance ticket for offline hardware
                                </label>
                            )}

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowLogModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Submit Shift Log
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Inspection Review Modal */}
            {selectedCheck && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-sm font-bold text-slate-900'>Shift Inspection Review</h3>
                                <p className='text-xs text-slate-500 font-mono mt-0.5'>{selectedCheck.checkDate} · {selectedCheck.shift}</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedCheck(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-3 text-xs'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-slate-500'>Inspector:</span>
                                    <span className='font-bold text-slate-900'>{selectedCheck.inspectorName}</span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-slate-500'>Total Cameras:</span>
                                    <span className='font-mono text-slate-800 font-semibold'>{selectedCheck.totalCamerasMonitored}</span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-slate-500'>NVR Buffer Health:</span>
                                    <span className='font-semibold text-emerald-700'>{selectedCheck.nvrStorageBufferHealth}</span>
                                </div>
                            </div>

                            {selectedCheck.findingsAndAnomalies?.length > 0 ? (
                                <div className='space-y-2'>
                                    <span className='font-bold text-rose-800 block text-[11px]'>Reported Anomalies &amp; Rectification:</span>
                                    {selectedCheck.findingsAndAnomalies.map((a, idx) => (
                                        <div key={idx} className={`p-3 rounded-xl border text-xs ${a.isRectified ? 'bg-emerald-50/60 border-emerald-200 text-slate-800' : 'bg-rose-50 border-rose-100 text-rose-900'}`}>
                                            <div className='flex items-start justify-between gap-2'>
                                                <div className='font-semibold'>{a.anomalyDescription}</div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${a.isRectified ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                    {a.isRectified ? 'Rectified' : 'Unresolved'}
                                                </span>
                                            </div>
                                            <div className='text-[10px] text-slate-600 mt-1'>Action: {a.actionTaken}</div>
                                            {a.isRectified ? (
                                                <div className='mt-2 p-2 bg-white/80 rounded-lg border border-emerald-100 text-[11px] space-y-0.5'>
                                                    <div className='font-semibold text-emerald-800 flex items-center gap-1'>
                                                        <CheckCircle2 className='w-3.5 h-3.5 text-emerald-600' />
                                                        Rectified on {a.rectifiedDate} at {a.rectifiedTime} by {a.rectifiedBy}
                                                    </div>
                                                    {a.resolutionNotes && (
                                                        <div className='text-slate-600 italic'>Notes: {a.resolutionNotes}</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className='mt-2 pt-2 border-t border-rose-100 flex justify-end'>
                                                    <button
                                                        type='button'
                                                        onClick={() => openResolveModal(selectedCheck, idx)}
                                                        className='inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                                    >
                                                        <Wrench className='w-3.5 h-3.5' />
                                                        Mark Rectified / Resolved
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className='p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-1.5'>
                                    <CheckCircle2 className='w-4 h-4 text-emerald-600' />
                                    No hardware faults or signal anomalies logged during shift.
                                </div>
                            )}
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end'>
                            <button
                                type='button'
                                onClick={() => setSelectedCheck(null)}
                                className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rectify Anomaly Modal */}
            {resolvingAnomaly && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div className='flex items-center gap-2'>
                                <Wrench className='w-4 h-4 text-teal-600' />
                                <h3 className='text-sm font-bold text-slate-900'>Record Anomaly Rectification</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setResolvingAnomaly(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <form onSubmit={handleResolveSubmit} className='mt-4 space-y-4'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700'>
                                <div className='font-bold text-slate-900 mb-1'>Anomaly Details</div>
                                <div>{resolvingAnomaly.check.findingsAndAnomalies[resolvingAnomaly.index]?.anomalyDescription}</div>
                            </div>

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

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Rectified By (Technician / Operator) *</label>
                                <input
                                    type='text'
                                    required
                                    value={resolveForm.rectifiedBy}
                                    onChange={(e) => setResolveForm({ ...resolveForm, rectifiedBy: e.target.value })}
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    placeholder='e.g. S. Selvakumar / IT Network Technician'
                                />
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Resolution Notes &amp; Diagnostics *</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={resolveForm.resolutionNotes}
                                    onChange={(e) => setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })}
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    placeholder='Specify steps taken to rectify the hardware/network issue...'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setResolvingAnomaly(null)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Confirm Rectification
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}

export default CctvOperationalStatus
