import React, { useEffect, useState, useMemo } from 'react'
import {
    Camera,
    Plus,
    Calendar,
    Search,
    RefreshCw,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    X,
    Filter,
    Bus,
    Video,
    Wrench,
    Eye
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { cctvService } from '../../services/modules/cctvService'

const CAMERA_STATUSES = [
    'Online / Working',
    'Offline / Degraded',
    'No Video Signal',
    'Camera Obstructed',
]

const RECORDING_HEALTHS = ['Normal', 'Degraded', 'Error / Storage Full', 'Looping Glitch']

const CctvBusCameraMonitoring = () => {
    const [audits, setAudits] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterIncident, setFilterIncident] = useState('ALL')
    const [showAuditModal, setShowAuditModal] = useState(false)
    const [selectedAudit, setSelectedAudit] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        busNo: 'BUS-04',
        frontCameraStatus: 'Online / Working',
        cabinCameraStatus: 'Online / Working',
        rearCameraStatus: 'Online / Working',
        recordingHealth: 'Normal',
        footageQuality: '1080p Clear',
        safetyObservation: 'Driver wore seatbelt, speed maintained below 40 km/h, emergency door clear.',
        incidentReported: false,
        inspectorName: 'S. Selvakumar',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await cctvService.getBusCameraAudits()
            if (res.success && Array.isArray(res.data)) {
                setAudits(res.data)
            }
        } catch (err) {
            console.error('Failed to load bus camera audits:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredAudits = useMemo(() => {
        return audits.filter((a) => {
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                a.id?.toLowerCase().includes(q) ||
                a.busNo?.toLowerCase().includes(q) ||
                a.safetyObservation?.toLowerCase().includes(q) ||
                a.inspectorName?.toLowerCase().includes(q)

            const matchesIncident =
                filterIncident === 'ALL' ||
                (filterIncident === 'INCIDENT' && a.incidentReported) ||
                (filterIncident === 'NORMAL' && !a.incidentReported)

            return matchesSearch && matchesIncident
        })
    }, [audits, searchQuery, filterIncident])

    const kpiMetrics = useMemo(() => {
        const total = filteredAudits.length
        const allWorking = filteredAudits.filter(
            (a) =>
                a.frontCameraStatus.includes('Working') &&
                a.cabinCameraStatus.includes('Working') &&
                a.rearCameraStatus.includes('Working')
        ).length
        const defective = total - allWorking
        const incidents = filteredAudits.filter((a) => a.incidentReported).length
        return { total, allWorking, defective, incidents }
    }, [filteredAudits])

    const handleAuditSubmit = async (e) => {
        e.preventDefault()
        if (!form.busNo || !form.inspectorName) {
            alert('Please specify bus number and inspector.')
            return
        }

        try {
            const res = await cctvService.createBusCameraAudit(form)
            if (res.success) {
                setAudits((prev) => [res.data, ...prev])
                setShowAuditModal(false)
                setFeedbackMessage(`In-bus surveillance audit ${res.data.id} recorded for ${res.data.busNo}.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setForm({
                    date: new Date().toISOString().split('T')[0],
                    busNo: 'BUS-04',
                    frontCameraStatus: 'Online / Working',
                    cabinCameraStatus: 'Online / Working',
                    rearCameraStatus: 'Online / Working',
                    recordingHealth: 'Normal',
                    footageQuality: '1080p Clear',
                    safetyObservation: 'Driver wore seatbelt, speed maintained below 40 km/h, emergency door clear.',
                    incidentReported: false,
                    inspectorName: 'S. Selvakumar',
                })
            } else {
                alert(`Error: ${res.error?.message || 'Failed to submit camera audit'}`)
            }
        } catch (err) {
            console.error('Error submitting camera audit:', err)
        }
    }

    const triggerMaintenanceDefect = async (audit) => {
        try {
            const issuePayload = {
                date: new Date().toISOString().split('T')[0],
                zone: 'Transport Yard & Bus Bays',
                assetId: `BUS-CAM-${audit.busNo}`,
                assetName: `In-Bus Surveillance Kit (${audit.busNo})`,
                defectCategory: 'Camera Lens Scratched / Dirty',
                severity: 'High',
                reportedBy: audit.inspectorName || 'Camera Room Inspector',
                assignedTechnician: 'Transport Maintenance Bay',
                status: 'Open',
                notes: `Triggered from In-Bus Audit ${audit.id}: Cabin/Camera issues observed: ${audit.safetyObservation}`,
            }
            const res = await cctvService.createIssue(issuePayload)
            if (res.success) {
                setFeedbackMessage(`Maintenance defect ticket ${res.data.id} successfully dispatched to Transport Bay for ${audit.busNo}.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
            }
        } catch (err) {
            console.error('Failed to trigger maintenance defect:', err)
        }
    }

    const columns = [
        {
            key: 'id',
            label: 'Audit ID & Date',
            required: true,
            render: (row) => (
                <div>
                    <span className='font-mono font-bold text-xs text-slate-900'>{row.id}</span>
                    <div className='text-[10px] text-slate-400 font-mono mt-0.5'>{row.date}</div>
                </div>
            ),
        },
        {
            key: 'busNo',
            label: 'School Bus',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5'>
                    <Bus className='w-4 h-4 text-teal-600' />
                    <span className='font-bold text-slate-900 text-xs'>{row.busNo}</span>
                </div>
            ),
        },
        {
            key: 'camerasHealth',
            label: 'Triple-Channel Status (Front / Cabin / Rear)',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1 text-[10px] font-mono'>
                    <span
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                            row.frontCameraStatus.includes('Working')
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-rose-50 text-rose-800'
                        }`}
                        title={`Front: ${row.frontCameraStatus}`}
                    >
                        F: {row.frontCameraStatus.includes('Working') ? 'OK' : 'ERR'}
                    </span>
                    <span
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                            row.cabinCameraStatus.includes('Working')
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-rose-50 text-rose-800'
                        }`}
                        title={`Cabin: ${row.cabinCameraStatus}`}
                    >
                        C: {row.cabinCameraStatus.includes('Working') ? 'OK' : 'ERR'}
                    </span>
                    <span
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                            row.rearCameraStatus.includes('Working')
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-rose-50 text-rose-800'
                        }`}
                        title={`Rear: ${row.rearCameraStatus}`}
                    >
                        R: {row.rearCameraStatus.includes('Working') ? 'OK' : 'ERR'}
                    </span>
                </div>
            ),
        },
        {
            key: 'recordingHealth',
            label: 'Recording & Footage Quality',
            required: true,
            render: (row) => (
                <div className='text-xs'>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        row.recordingHealth === 'Normal' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                    }`}>
                        {row.recordingHealth}
                    </span>
                    <div className='text-[10px] text-slate-500 font-mono mt-0.5'>{row.footageQuality}</div>
                </div>
            ),
        },
        {
            key: 'safetyObservation',
            label: 'Driver Safety & Behavior',
            required: true,
            render: (row) => (
                <div className='max-w-xs text-xs'>
                    <div className='text-slate-800 truncate' title={row.safetyObservation}>
                        {row.safetyObservation}
                    </div>
                    {row.incidentReported && (
                        <div className='mt-0.5'>
                            <span className='inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded'>
                                <AlertTriangle className='w-2.5 h-2.5' /> Safety Incident Flagged
                            </span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'inspectorName',
            label: 'Inspector',
            required: true,
            render: (row) => (
                <div className='text-xs font-medium text-slate-700'>
                    {row.inspectorName}
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
                        onClick={() => setSelectedAudit(row)}
                        className='text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors'
                    >
                        Review
                    </button>
                    {(!row.frontCameraStatus.includes('Working') ||
                        !row.cabinCameraStatus.includes('Working') ||
                        !row.rearCameraStatus.includes('Working') ||
                        row.incidentReported) && (
                        <button
                            type='button'
                            onClick={() => triggerMaintenanceDefect(row)}
                            className='inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors shadow-xs'
                            title='Dispatch maintenance defect ticket'
                        >
                            <Wrench className='w-3 h-3' /> Ticket
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
                            <Camera className='w-4 h-4' />
                            In-Transit Fleet Surveillance &amp; Safety
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Bus Camera Monitoring &amp; Cabin Safety
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Multi-channel in-bus CCTV health audit, SD-card recording integrity checks, cabin student discipline monitoring, and driver safety compliance logging.
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
                            onClick={() => setShowAuditModal(true)}
                            className='inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Audit Bus Cameras
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

            {/* KPI Cards */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Buses Audited</div>
                    <div className='text-2xl font-bold text-slate-900 mt-1 font-mono'>{kpiMetrics.total}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>In-bus surveillance kits</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>100% Functional Kits</div>
                    <div className='text-2xl font-bold text-emerald-600 mt-1 font-mono'>{kpiMetrics.allWorking}</div>
                    <div className='text-[10px] text-emerald-600 mt-0.5 font-medium'>All 3 cameras operational</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Defects Flagged</div>
                    <div className='text-2xl font-bold text-amber-600 mt-1 font-mono'>{kpiMetrics.defective}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Lens blur / degraded channels</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Safety Incidents</div>
                    <div className='text-2xl font-bold text-rose-600 mt-1 font-mono'>{kpiMetrics.incidents}</div>
                    <div className='text-[10px] text-rose-500 mt-0.5 font-semibold'>Driver or cabin infractions</div>
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
                            placeholder='Search bus, inspector, behavior...'
                            className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        />
                    </div>

                    <select
                        value={filterIncident}
                        onChange={(e) => setFilterIncident(e.target.value)}
                        className='px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    >
                        <option value='ALL'>All Observations</option>
                        <option value='INCIDENT'>Incidents / Faults Only</option>
                        <option value='NORMAL'>Normal Operations Only</option>
                    </select>
                </div>

                <div className='text-xs font-semibold text-slate-500'>
                    Showing {filteredAudits.length} camera audit logs
                </div>
            </div>

            {/* Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        In-Bus CCTV Diagnostics &amp; Cabin Audit Register
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredAudits}
                        emptyMessage='No bus camera audits found.'
                    />
                </div>
            </div>

            {/* Audit Modal */}
            {showAuditModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div className='flex items-center gap-2'>
                                <Camera className='w-5 h-5 text-teal-600' />
                                <h3 className='text-base font-bold text-slate-900'>Audit In-Bus Surveillance System</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setShowAuditModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        <form onSubmit={handleAuditSubmit} className='mt-4 space-y-4'>
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

                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2'>
                                <span className='text-xs font-bold text-slate-800 uppercase tracking-wider block'>
                                    Triple Camera Health Check
                                </span>
                                <div className='grid grid-cols-3 gap-2'>
                                    <div>
                                        <label className='block text-[11px] font-semibold text-slate-700 mb-1'>Front Road Cam</label>
                                        <select
                                            value={form.frontCameraStatus}
                                            onChange={(e) => setForm({ ...form, frontCameraStatus: e.target.value })}
                                            className='w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white'
                                        >
                                            {CAMERA_STATUSES.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className='block text-[11px] font-semibold text-slate-700 mb-1'>Cabin Dome Cam</label>
                                        <select
                                            value={form.cabinCameraStatus}
                                            onChange={(e) => setForm({ ...form, cabinCameraStatus: e.target.value })}
                                            className='w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white'
                                        >
                                            {CAMERA_STATUSES.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className='block text-[11px] font-semibold text-slate-700 mb-1'>Rear Exit Cam</label>
                                        <select
                                            value={form.rearCameraStatus}
                                            onChange={(e) => setForm({ ...form, rearCameraStatus: e.target.value })}
                                            className='w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white'
                                        >
                                            {CAMERA_STATUSES.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Recording Engine Health</label>
                                    <select
                                        value={form.recordingHealth}
                                        onChange={(e) => setForm({ ...form, recordingHealth: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        {RECORDING_HEALTHS.map((h) => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Footage Resolution Specs</label>
                                    <input
                                        type='text'
                                        value={form.footageQuality}
                                        onChange={(e) => setForm({ ...form, footageQuality: e.target.value })}
                                        placeholder='1080p Clear (30fps)'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Driver &amp; Cabin Safety Observations *</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={form.safetyObservation}
                                    onChange={(e) => setForm({ ...form, safetyObservation: e.target.value })}
                                    placeholder='Specify driver discipline, seatbelt compliance, cabin order...'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Inspector Full Name *</label>
                                <input
                                    type='text'
                                    required
                                    value={form.inspectorName}
                                    onChange={(e) => setForm({ ...form, inspectorName: e.target.value })}
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='p-3 rounded-xl bg-rose-50 border border-rose-200'>
                                <label className='flex items-center gap-2 text-xs font-bold text-rose-800 cursor-pointer'>
                                    <input
                                        type='checkbox'
                                        checked={form.incidentReported}
                                        onChange={(e) => setForm({ ...form, incidentReported: e.target.checked })}
                                        className='rounded text-rose-600'
                                    />
                                    Report Safety / Conduct Infraction Incident
                                </label>
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowAuditModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Record Camera Audit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedAudit && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <span className='text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono'>
                                    {selectedAudit.id}
                                </span>
                                <h3 className='text-sm font-bold text-slate-900 mt-1'>Bus {selectedAudit.busNo} Surveillance Review</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedAudit(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-3 text-xs'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5'>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Audit Date:</span>
                                    <span className='font-mono font-bold text-slate-900'>{selectedAudit.date}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Inspector:</span>
                                    <span className='text-slate-900 font-medium'>{selectedAudit.inspectorName}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Recording Engine:</span>
                                    <span className='font-semibold text-slate-800'>{selectedAudit.recordingHealth}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Footage Resolution:</span>
                                    <span className='font-mono text-slate-700'>{selectedAudit.footageQuality}</span>
                                </div>
                            </div>

                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1'>
                                <span className='text-slate-600 font-bold block text-[11px]'>Camera Channels Status:</span>
                                <div className='grid grid-cols-3 gap-1 pt-1 text-[11px] font-mono'>
                                    <div className='p-2 bg-white rounded border border-slate-200'>
                                        <div className='text-[10px] text-slate-400'>Front Road</div>
                                        <div className='font-bold mt-0.5'>{selectedAudit.frontCameraStatus}</div>
                                    </div>
                                    <div className='p-2 bg-white rounded border border-slate-200'>
                                        <div className='text-[10px] text-slate-400'>Cabin Dome</div>
                                        <div className='font-bold mt-0.5'>{selectedAudit.cabinCameraStatus}</div>
                                    </div>
                                    <div className='p-2 bg-white rounded border border-slate-200'>
                                        <div className='text-[10px] text-slate-400'>Rear Exit</div>
                                        <div className='font-bold mt-0.5'>{selectedAudit.rearCameraStatus}</div>
                                    </div>
                                </div>
                            </div>

                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1'>
                                <span className='text-[11px] text-slate-500 block font-medium'>Safety Observations:</span>
                                <p className='text-slate-900'>{selectedAudit.safetyObservation}</p>
                            </div>
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end'>
                            <button
                                type='button'
                                onClick={() => setSelectedAudit(null)}
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

export default CctvBusCameraMonitoring
