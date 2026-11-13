import React, { useEffect, useState, useMemo } from 'react'
import {
    Clock,
    Plus,
    Calendar,
    Search,
    RefreshCw,
    Download,
    Printer,
    CheckCircle2,
    AlertTriangle,
    Camera,
    UserCheck,
    X,
    Filter,
    FileSpreadsheet
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { cctvService } from '../../services/modules/cctvService'

const GATES = [
    'Gate 1 (Main Entrance)',
    'Gate 2 (Faculty Gate)',
    'Gate 3 (Transport Bay & Sports Gate)',
]

const DEPARTMENTS = [
    'All Departments',
    'Mathematics',
    'Science & Biology',
    'English & Languages',
    'Social Science',
    'Computer Science',
    'Physical Education',
    'Commerce & Humanities',
]

const CctvTeachersLateReport = () => {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDept, setSelectedDept] = useState('All Departments')
    const [selectedGate, setSelectedGate] = useState('ALL')
    const [dateFilter, setDateFilter] = useState('')
    const [showLogModal, setShowLogModal] = useState(false)
    const [selectedReport, setSelectedReport] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        teacherId: 'EMP-TCH-005',
        teacherName: '',
        department: 'Mathematics',
        shiftInTime: '08:00 AM',
        actualArrivalTime: '08:20 AM',
        lateMinutes: 20,
        gateNo: 'Gate 1 (Main Entrance)',
        cameraId: 'CAM-01',
        reason: '',
        actionTaken: 'Gate entry late slip issued',
        status: 'Logged',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await cctvService.getTeachersLateReports()
            if (res.success && Array.isArray(res.data)) {
                setReports(res.data)
            }
        } catch (err) {
            console.error('Failed to load teachers late reports:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredReports = useMemo(() => {
        return reports.filter((r) => {
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                r.teacherName?.toLowerCase().includes(q) ||
                r.teacherId?.toLowerCase().includes(q) ||
                r.department?.toLowerCase().includes(q) ||
                r.reason?.toLowerCase().includes(q)

            const matchesDept = selectedDept === 'All Departments' || r.department === selectedDept
            const matchesGate = selectedGate === 'ALL' || r.gateNo === selectedGate
            const matchesDate = !dateFilter || r.date === dateFilter

            return matchesSearch && matchesDept && matchesGate && matchesDate
        })
    }, [reports, searchQuery, selectedDept, selectedGate, dateFilter])

    // KPI Metrics
    const kpiMetrics = useMemo(() => {
        const total = filteredReports.length
        const totalDelay = filteredReports.reduce((acc, curr) => acc + (Number(curr.lateMinutes) || 0), 0)
        const avgDelay = total > 0 ? Math.round(totalDelay / total) : 0
        const pendingAck = filteredReports.filter((r) => r.status === 'Logged').length
        const approvedCount = filteredReports.filter((r) => r.status === 'Approved' || r.status === 'Acknowledged').length
        return { total, avgDelay, pendingAck, approvedCount }
    }, [filteredReports])

    const handleCreateSubmit = async (e) => {
        e.preventDefault()
        if (!form.teacherName.trim() || !form.shiftInTime || !form.actualArrivalTime) {
            alert('Please fill in teacher name, shift time, and arrival time.')
            return
        }

        try {
            const res = await cctvService.createTeachersLateReport(form)
            if (res.success) {
                setReports((prev) => [res.data, ...prev])
                setShowLogModal(false)
                setFeedbackMessage(`Late arrival log recorded for ${res.data.teacherName} (+${res.data.lateMinutes} mins).`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setForm({
                    date: new Date().toISOString().split('T')[0],
                    teacherId: `EMP-TCH-${Math.floor(100 + Math.random() * 900)}`,
                    teacherName: '',
                    department: 'Mathematics',
                    shiftInTime: '08:00 AM',
                    actualArrivalTime: '08:20 AM',
                    lateMinutes: 20,
                    gateNo: 'Gate 1 (Main Entrance)',
                    cameraId: 'CAM-01',
                    reason: '',
                    actionTaken: 'Gate entry late slip issued',
                    status: 'Logged',
                })
            } else {
                alert(`Error: ${res.error?.message || 'Failed to log late report'}`)
            }
        } catch (err) {
            console.error('Error logging late report:', err)
        }
    }

    const exportToCsv = () => {
        if (filteredReports.length === 0) {
            alert('No records available to export.')
            return
        }

        const headers = ['Log ID', 'Date', 'Teacher ID', 'Teacher Name', 'Department', 'Shift In-Time', 'Actual Arrival', 'Late (Mins)', 'Gate No', 'Camera ID', 'Reason', 'Action Taken', 'Status']
        const rows = filteredReports.map((r) => [
            r.id,
            r.date,
            r.teacherId,
            `"${(r.teacherName || '').replace(/"/g, '""')}"`,
            `"${(r.department || '').replace(/"/g, '""')}"`,
            r.shiftInTime,
            r.actualArrivalTime,
            r.lateMinutes,
            `"${(r.gateNo || '').replace(/"/g, '""')}"`,
            r.cameraId,
            `"${(r.reason || '').replace(/"/g, '""')}"`,
            `"${(r.actionTaken || '').replace(/"/g, '""')}"`,
            r.status,
        ])

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `teachers_late_report_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handlePrint = () => {
        window.print()
    }

    const columns = [
        {
            key: 'teacher',
            label: 'Teacher Name & ID',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-bold text-slate-900 text-xs'>{row.teacherName}</div>
                    <div className='text-[10px] text-slate-400 font-mono mt-0.5'>{row.teacherId} · {row.department}</div>
                </div>
            ),
        },
        {
            key: 'date',
            label: 'Date & Shift Timing',
            required: true,
            render: (row) => (
                <div className='text-xs'>
                    <div className='font-mono font-bold text-slate-900'>{row.date}</div>
                    <div className='text-[11px] text-slate-500 mt-0.5'>Shift: {row.shiftInTime}</div>
                </div>
            ),
        },
        {
            key: 'actualArrivalTime',
            label: 'Arrival & Delay',
            required: true,
            render: (row) => (
                <div className='text-xs'>
                    <span className='font-mono font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded'>
                        {row.actualArrivalTime}
                    </span>
                    <div className='text-[10px] text-rose-600 font-bold mt-1'>
                        +{row.lateMinutes} mins late
                    </div>
                </div>
            ),
        },
        {
            key: 'gateCamera',
            label: 'Gate & Camera Verification',
            required: true,
            render: (row) => (
                <div className='text-xs'>
                    <div className='font-medium text-slate-800'>{row.gateNo}</div>
                    <div className='inline-flex items-center gap-1 text-[10px] text-teal-700 font-mono mt-0.5'>
                        <Camera className='w-3 h-3 text-teal-600' /> {row.cameraId}
                    </div>
                </div>
            ),
        },
        {
            key: 'reason',
            label: 'Reported Reason & Action',
            required: true,
            render: (row) => (
                <div className='max-w-xs text-xs'>
                    <div className='text-slate-800 font-medium truncate' title={row.reason}>{row.reason || 'No reason specified'}</div>
                    <div className='text-[10px] text-slate-500 mt-0.5 truncate' title={row.actionTaken}>Action: {row.actionTaken}</div>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            required: true,
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'actions',
            label: 'Review',
            required: true,
            render: (row) => (
                <button
                    type='button'
                    onClick={() => setSelectedReport(row)}
                    className='text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors'
                >
                    View Slip
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
                            <Clock className='w-4 h-4' />
                            Perimeter &amp; Gate Surveillance Logs
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Teachers Late Arrival Register
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Gate entry monitoring register capturing teacher arrivals, shift comparison, automated camera tag verification, and late slip administration.
                        </p>
                    </div>
                    <div className='flex items-center gap-2 flex-wrap'>
                        <button
                            type='button'
                            onClick={exportToCsv}
                            className='inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <FileSpreadsheet className='w-3.5 h-3.5 text-emerald-600' />
                            Export CSV
                        </button>
                        <button
                            type='button'
                            onClick={handlePrint}
                            className='inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <Printer className='w-3.5 h-3.5 text-slate-600' />
                            Print Roster
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
                            onClick={() => setShowLogModal(true)}
                            className='inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Log Late Arrival
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
                    <div className='text-xs font-medium text-slate-500'>Late Arrivals Logged</div>
                    <div className='text-2xl font-bold text-slate-900 mt-1 font-mono'>{kpiMetrics.total}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Across active filters</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Avg Delay Duration</div>
                    <div className='text-2xl font-bold text-rose-600 mt-1 font-mono'>+{kpiMetrics.avgDelay} <span className='text-xs font-normal text-slate-500'>mins</span></div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Per late entry</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Pending Acknowledgment</div>
                    <div className='text-2xl font-bold text-amber-600 mt-1 font-mono'>{kpiMetrics.pendingAck}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Slips awaiting teacher review</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Approved / Cleared</div>
                    <div className='text-2xl font-bold text-emerald-600 mt-1 font-mono'>{kpiMetrics.approvedCount}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Permitted by Coordinator / Principal</div>
                </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3'>
                <div className='flex items-center gap-2 w-full md:w-auto flex-wrap'>
                    <div className='relative w-full md:w-64'>
                        <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search teacher or ID...'
                            className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        />
                    </div>

                    <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className='px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    >
                        {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>

                    <select
                        value={selectedGate}
                        onChange={(e) => setSelectedGate(e.target.value)}
                        className='px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    >
                        <option value='ALL'>All Gates</option>
                        {GATES.map((g) => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>

                    <input
                        type='date'
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className='px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    />

                    {dateFilter && (
                        <button
                            type='button'
                            onClick={() => setDateFilter('')}
                            className='text-xs text-rose-600 hover:underline'
                        >
                            Clear Date
                        </button>
                    )}
                </div>

                <div className='text-xs font-semibold text-slate-500'>
                    Showing {filteredReports.length} recorded entries
                </div>
            </div>

            {/* Late Reports Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Teacher Gate Arrival Roster
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredReports}
                        emptyMessage='No late arrival entries match the selected filters.'
                    />
                </div>
            </div>

            {/* Log Late Arrival Modal */}
            {showLogModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div className='flex items-center gap-2'>
                                <Clock className='w-5 h-5 text-teal-600' />
                                <h3 className='text-base font-bold text-slate-900'>Log Teacher Gate Late Entry</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setShowLogModal(false)}
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
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Department *</label>
                                    <select
                                        value={form.department}
                                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        {DEPARTMENTS.filter((d) => d !== 'All Departments').map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Teacher Name *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.teacherName}
                                        onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                                        placeholder='e.g. Mrs. S. Meenakshi'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Teacher ID</label>
                                    <input
                                        type='text'
                                        value={form.teacherId}
                                        onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-3 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Shift In-Time *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.shiftInTime}
                                        onChange={(e) => setForm({ ...form, shiftInTime: e.target.value })}
                                        placeholder='08:00 AM'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Actual Arrival *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.actualArrivalTime}
                                        onChange={(e) => setForm({ ...form, actualArrivalTime: e.target.value })}
                                        placeholder='08:25 AM'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Late Delay (Mins)</label>
                                    <input
                                        type='number'
                                        value={form.lateMinutes}
                                        onChange={(e) => setForm({ ...form, lateMinutes: Number(e.target.value) })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Entry Gate *</label>
                                    <select
                                        value={form.gateNo}
                                        onChange={(e) => setForm({ ...form, gateNo: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        {GATES.map((g) => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Camera Tag ID</label>
                                    <input
                                        type='text'
                                        value={form.cameraId}
                                        onChange={(e) => setForm({ ...form, cameraId: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Reason for Late Arrival</label>
                                <textarea
                                    rows={2}
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    placeholder='Specify reason stated by teacher or verified by gate keeper...'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Action Taken</label>
                                    <input
                                        type='text'
                                        value={form.actionTaken}
                                        onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Initial Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        <option value='Logged'>Logged / Pending Review</option>
                                        <option value='Acknowledged'>Acknowledged by Staff</option>
                                        <option value='Approved'>Permission Approved</option>
                                    </select>
                                </div>
                            </div>

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
                                    Record Late Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Review Slip Modal */}
            {selectedReport && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <span className='text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono'>
                                    {selectedReport.id}
                                </span>
                                <h3 className='text-sm font-bold text-slate-900 mt-1'>Gate Entry Late Slip</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedReport(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-3 text-xs'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5'>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Teacher Name:</span>
                                    <span className='font-bold text-slate-900'>{selectedReport.teacherName}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Staff ID:</span>
                                    <span className='font-mono font-semibold text-slate-800'>{selectedReport.teacherId}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Department:</span>
                                    <span className='font-medium text-slate-800'>{selectedReport.department}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Gate &amp; Camera:</span>
                                    <span className='font-mono text-slate-700'>{selectedReport.gateNo} ({selectedReport.cameraId})</span>
                                </div>
                            </div>

                            <div className='p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-center justify-between'>
                                <div>
                                    <div className='text-[11px] text-rose-700'>Shift: {selectedReport.shiftInTime}</div>
                                    <div className='font-bold text-rose-900 text-sm'>Arrival: {selectedReport.actualArrivalTime}</div>
                                </div>
                                <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-rose-200 text-rose-800'>
                                    +{selectedReport.lateMinutes} mins late
                                </span>
                            </div>

                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1'>
                                <span className='text-[11px] text-slate-500 block font-medium'>Stated Reason:</span>
                                <p className='text-slate-900 italic'>{selectedReport.reason || 'No reason specified'}</p>
                            </div>

                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1'>
                                <span className='text-[11px] text-slate-500 block font-medium'>Action Taken:</span>
                                <p className='text-slate-900 font-semibold'>{selectedReport.actionTaken}</p>
                            </div>
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-2'>
                            <button
                                type='button'
                                onClick={() => setSelectedReport(null)}
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

export default CctvTeachersLateReport
