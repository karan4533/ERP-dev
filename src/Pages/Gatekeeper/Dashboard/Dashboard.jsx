import React, { useState, useEffect, useMemo } from 'react'
import {
    Users,
    ArrowRightLeft,
    Clock,
    AlertTriangle,
    Shield,
    ShieldCheck,
    CheckCircle2,
    Search,
    Printer,
    Eye,
    LogOut,
    LogIn,
    X,
    Filter,
    QrCode,
    Calendar,
    Phone,
    User,
    Building2,
    RefreshCw
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
    getUnifiedGatekeeperKPIs,
    getActiveVisitors,
    getVisitorLogs,
    getStudentGatePasses,
    recordVisitorCheckOut,
    recordStudentExit,
    recordStudentReturn,
    statusBadgeColor,
    CAMPUS_NAME
} from '../../../Common/GatePassSecurity/gatePassSecurityData'
import { formatOutTimeForDisplay } from '../../FrontOffice/GatePass/gatePassData'

export default function GatekeeperDashboard() {
    const [refreshKey, setRefreshKey] = useState(0)
    const [visitorSearch, setVisitorSearch] = useState('')
    const [studentSearch, setStudentSearch] = useState('')
    const [selectedVisitor, setSelectedVisitor] = useState(null)
    const [selectedStudentPass, setSelectedStudentPass] = useState(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [activeVisitorFilter, setActiveVisitorFilter] = useState('active') // 'active' or 'all'
    const [activeStudentFilter, setActiveStudentFilter] = useState('actionable') // 'actionable' or 'all'

    const refreshData = () => setRefreshKey((k) => k + 1)

    // Listen for live cross-tab/cross-role updates
    useEffect(() => {
        const handleSync = () => refreshData()
        if (typeof window !== 'undefined') {
            window.addEventListener('schoolerp-gatepass-security-sync', handleSync)
            window.addEventListener('schoolerp-visitor-updated', handleSync)
            window.addEventListener('schoolerp-gate-pass-updated', handleSync)
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('schoolerp-gatepass-security-sync', handleSync)
                window.removeEventListener('schoolerp-visitor-updated', handleSync)
                window.removeEventListener('schoolerp-gate-pass-updated', handleSync)
            }
        }
    }, [])

    // Dynamic KPIs calculated from backend storage
    const kpis = useMemo(() => {
        void refreshKey
        return getUnifiedGatekeeperKPIs()
    }, [refreshKey])

    // Visitors dataset
    const allVisitors = useMemo(() => {
        void refreshKey
        return getVisitorLogs()
    }, [refreshKey])

    const filteredVisitors = useMemo(() => {
        const list = activeVisitorFilter === 'active'
            ? allVisitors.filter((v) => v.status === 'Checked In' || v.status === 'On Campus')
            : allVisitors

        const query = visitorSearch.trim().toLowerCase()
        if (!query) return list

        return list.filter((v) =>
            [v.visitorName, v.badgeNumber, v.personToMeet, v.department, v.phone, v.id].some(
                (val) => String(val || '').toLowerCase().includes(query)
            )
        )
    }, [allVisitors, activeVisitorFilter, visitorSearch])

    // Student Gate Passes dataset
    const allStudentPasses = useMemo(() => {
        void refreshKey
        return getStudentGatePasses()
    }, [refreshKey])

    const filteredStudentPasses = useMemo(() => {
        const list = activeStudentFilter === 'actionable'
            ? allStudentPasses.filter((p) =>
                p.status === 'Approved' ||
                p.status === 'Ready for Exit' ||
                p.status === 'Exit Recorded' ||
                p.isOverdue
            )
            : allStudentPasses

        const query = studentSearch.trim().toLowerCase()
        if (!query) return list

        return list.filter((p) =>
            [p.studentName, p.studentId, p.classSection, p.gatePassId, p.id, p.accompanyingPerson, p.reason].some(
                (val) => String(val || '').toLowerCase().includes(query)
            )
        )
    }, [allStudentPasses, activeStudentFilter, studentSearch])

    // Handlers
    const handleVisitorCheckout = (visitorId) => {
        try {
            setActionLoading(true)
            const updated = recordVisitorCheckOut(visitorId, 'Ram Singh (Gatekeeper Main Gate)')
            toast.success(`Visitor ${updated.visitorName} successfully checked out. Badge surrendered.`)
            refreshData()
        } catch (err) {
            toast.error(err.message || 'Error recording visitor check-out.')
        } finally {
            setActionLoading(false)
        }
    }

    const handleRecordExit = (passId) => {
        try {
            setActionLoading(true)
            const pass = recordStudentExit(passId, 'Ram Singh (Gatekeeper Main Gate)')
            toast.success(`Student ${pass.studentName} exit recorded at Main Gate. Pass marked as Exit Recorded.`)
            refreshData()
            if (selectedStudentPass) setSelectedStudentPass(null)
        } catch (err) {
            toast.error(err.message || 'Cannot record exit.')
        } finally {
            setActionLoading(false)
        }
    }

    const handleRecordReturn = (passId) => {
        try {
            setActionLoading(true)
            const pass = recordStudentReturn(passId, 'Ram Singh (Gatekeeper Main Gate)')
            toast.success(`Student ${pass.studentName} safe return recorded. Movement completed.`)
            refreshData()
            if (selectedStudentPass) setSelectedStudentPass(null)
        } catch (err) {
            toast.error(err.message || 'Cannot record return.')
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <section className='space-y-6'>
            {/* Header Toolbar */}
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div>
                    <h1 className='text-xl font-bold tracking-tight text-slate-900'>Gatekeeper Command Dashboard</h1>
                    <p className='text-xs text-slate-500'>
                        Live campus perimeter terminal: verify visitor badges, scan student gate passes, and record entry/exit movements.
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                    <span className='inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800'>
                        <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' /> Gate Terminal Active (Main Gate #1)
                    </span>
                    <button
                        type='button'
                        onClick={refreshData}
                        className='rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition shadow-xs cursor-pointer'
                        title='Refresh Data'
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* 4 Dashboard KPI Cards (Strict requirement: Section 6) */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                {/* 1. Visitors Currently Inside */}
                <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between'>
                    <div>
                        <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                            Visitors Currently Inside
                        </p>
                        <h3 className='text-2xl font-bold text-slate-900 mt-1'>{kpis.visitorsCurrentlyInside}</h3>
                        <p className='text-[10px] text-blue-600 font-medium mt-0.5'>Active badges on campus</p>
                    </div>
                    <div className='rounded-xl bg-blue-50 p-3 text-blue-600'>
                        <Users size={22} />
                    </div>
                </div>

                {/* 2. Student Gate Passes Awaiting Exit */}
                <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between'>
                    <div>
                        <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                            Student Passes Awaiting Exit
                        </p>
                        <h3 className='text-2xl font-bold text-slate-900 mt-1'>{kpis.studentPassesAwaitingExit}</h3>
                        <p className='text-[10px] text-emerald-600 font-medium mt-0.5'>Sanctioned &amp; Ready for Exit</p>
                    </div>
                    <div className='rounded-xl bg-emerald-50 p-3 text-emerald-600'>
                        <ArrowRightLeft size={22} />
                    </div>
                </div>

                {/* 3. Students Currently Outside */}
                <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between'>
                    <div>
                        <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                            Students Currently Outside
                        </p>
                        <h3 className='text-2xl font-bold text-slate-900 mt-1'>{kpis.studentsCurrentlyOutside}</h3>
                        <p className='text-[10px] text-indigo-600 font-medium mt-0.5'>Departure logged, awaiting return</p>
                    </div>
                    <div className='rounded-xl bg-indigo-50 p-3 text-indigo-600'>
                        <Clock size={22} />
                    </div>
                </div>

                {/* 4. Overdue Returns */}
                <div className={`rounded-2xl border p-4 shadow-xs flex items-center justify-between ${
                    kpis.overdueReturns > 0
                        ? 'border-rose-200 bg-rose-50/40'
                        : 'border-slate-200/80 bg-white'
                }`}>
                    <div>
                        <p className={`text-[11px] font-semibold uppercase tracking-wider ${
                            kpis.overdueReturns > 0 ? 'text-rose-700' : 'text-slate-500'
                        }`}>
                            Overdue Returns
                        </p>
                        <h3 className={`text-2xl font-bold mt-1 ${
                            kpis.overdueReturns > 0 ? 'text-rose-700' : 'text-slate-900'
                        }`}>
                            {kpis.overdueReturns}
                        </h3>
                        <p className={`text-[10px] font-medium mt-0.5 ${
                            kpis.overdueReturns > 0 ? 'text-rose-600' : 'text-slate-400'
                        }`}>
                            {kpis.overdueReturns > 0 ? 'Immediate security attention' : 'All returns within schedule'}
                        </p>
                    </div>
                    <div className={`rounded-xl p-3 ${
                        kpis.overdueReturns > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                        <AlertTriangle size={22} />
                    </div>
                </div>
            </div>

            {/* SECTION 1: VISITORS REGISTER (Strict requirement: Section 6) */}
            <div className='rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50'>
                    <div className='flex items-center gap-2'>
                        <div className='rounded-lg bg-blue-100 p-1.5 text-blue-700'>
                            <Users size={16} />
                        </div>
                        <div>
                            <h2 className='text-sm font-bold text-slate-900'>1. Campus Visitors Register</h2>
                            <p className='text-[11px] text-slate-500'>
                                Active guests and parent check-ins synchronized from Front Office / PRM.
                            </p>
                        </div>
                    </div>

                    <div className='flex items-center gap-2'>
                        <div className='relative w-48 md:w-64'>
                            <Search size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400' />
                            <input
                                type='text'
                                value={visitorSearch}
                                onChange={(e) => setVisitorSearch(e.target.value)}
                                placeholder='Search visitor, badge, person...'
                                className='w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none'
                            />
                        </div>
                        <div className='flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs'>
                            <button
                                type='button'
                                onClick={() => setActiveVisitorFilter('active')}
                                className={`rounded-md px-2.5 py-1 font-semibold transition cursor-pointer ${
                                    activeVisitorFilter === 'active'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Inside ({kpis.visitorsCurrentlyInside})
                            </button>
                            <button
                                type='button'
                                onClick={() => setActiveVisitorFilter('all')}
                                className={`rounded-md px-2.5 py-1 font-semibold transition cursor-pointer ${
                                    activeVisitorFilter === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                All History
                            </button>
                        </div>
                    </div>
                </div>

                <div className='overflow-x-auto'>
                    <table className='w-full text-left text-xs'>
                        <thead>
                            <tr className='border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                <th className='py-3 px-4'>Visitor Name</th>
                                <th className='py-3 px-4'>Person to Meet</th>
                                <th className='py-3 px-4'>Department</th>
                                <th className='py-3 px-4'>Check-in Time</th>
                                <th className='py-3 px-4'>Badge ID</th>
                                <th className='py-3 px-4 text-center'>Status</th>
                                <th className='py-3 px-4 text-right'>Action</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100 text-slate-700'>
                            {filteredVisitors.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='py-8 text-center text-slate-400'>
                                        No visitors currently found in this register.
                                    </td>
                                </tr>
                            ) : (
                                filteredVisitors.map((v) => {
                                    const isInside = v.status === 'Checked In' || v.status === 'On Campus'
                                    return (
                                        <tr key={v.id} className='hover:bg-slate-50/70 transition-colors'>
                                            <td className='py-3 px-4'>
                                                <div className='font-semibold text-slate-900'>{v.visitorName}</div>
                                                <div className='text-[10px] text-slate-400'>
                                                    {v.phone} • {v.visitorOrganization || 'Guest'}
                                                </div>
                                            </td>
                                            <td className='py-3 px-4'>
                                                <div className='font-medium text-slate-800'>{v.personToMeet}</div>
                                                <div className='text-[10px] text-slate-400 truncate max-w-xs' title={v.purpose}>
                                                    Purpose: {v.purpose}
                                                </div>
                                            </td>
                                            <td className='py-3 px-4 text-slate-600 font-medium'>
                                                {v.department}
                                            </td>
                                            <td className='py-3 px-4'>
                                                <div className='font-mono text-slate-800'>{v.entryTime}</div>
                                                <div className='text-[10px] text-slate-400'>{v.entryDate}</div>
                                            </td>
                                            <td className='py-3 px-4'>
                                                <span className='rounded bg-blue-50 px-2.5 py-0.5 font-mono font-bold text-blue-700 border border-blue-200'>
                                                    {v.badgeNumber}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4 text-center'>
                                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                    isInside
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                }`}>
                                                    {isInside ? 'Checked In' : 'Checked Out'}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4 text-right'>
                                                <div className='flex items-center justify-end gap-1.5'>
                                                    <button
                                                        type='button'
                                                        onClick={() => setSelectedVisitor(v)}
                                                        className='inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer'
                                                    >
                                                        <Eye size={12} /> Verify Visitor
                                                    </button>
                                                    {isInside && (
                                                        <button
                                                            type='button'
                                                            disabled={actionLoading}
                                                            onClick={() => handleVisitorCheckout(v.id)}
                                                            className='inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-700 transition cursor-pointer disabled:opacity-50'
                                                        >
                                                            <LogOut size={12} /> Record Check-out
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECTION 2: STUDENT GATE PASSES (Strict requirement: Section 6) */}
            <div className='rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50'>
                    <div className='flex items-center gap-2'>
                        <div className='rounded-lg bg-emerald-100 p-1.5 text-emerald-700'>
                            <ArrowRightLeft size={16} />
                        </div>
                        <div>
                            <h2 className='text-sm font-bold text-slate-900'>2. Student Gate Passes Register</h2>
                            <p className='text-[11px] text-slate-500'>
                                Approved passes awaiting departure or outside campus. Verification &amp; exit/return logging.
                            </p>
                        </div>
                    </div>

                    <div className='flex items-center gap-2'>
                        <div className='relative w-48 md:w-64'>
                            <Search size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400' />
                            <input
                                type='text'
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                placeholder='Search student, class, pass ID...'
                                className='w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none'
                            />
                        </div>
                        <div className='flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs'>
                            <button
                                type='button'
                                onClick={() => setActiveStudentFilter('actionable')}
                                className={`rounded-md px-2.5 py-1 font-semibold transition cursor-pointer ${
                                    activeStudentFilter === 'actionable'
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Active &amp; Ready ({kpis.studentPassesAwaitingExit + kpis.studentsCurrentlyOutside})
                            </button>
                            <button
                                type='button'
                                onClick={() => setActiveStudentFilter('all')}
                                className={`rounded-md px-2.5 py-1 font-semibold transition cursor-pointer ${
                                    activeStudentFilter === 'all'
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                All Passes
                            </button>
                        </div>
                    </div>
                </div>

                <div className='overflow-x-auto'>
                    <table className='w-full text-left text-xs'>
                        <thead>
                            <tr className='border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                <th className='py-3 px-4'>Student Name &amp; ID</th>
                                <th className='py-3 px-4'>Class &amp; Section</th>
                                <th className='py-3 px-4'>Gate Pass ID</th>
                                <th className='py-3 px-4'>Approved By</th>
                                <th className='py-3 px-4'>Departure Time</th>
                                <th className='py-3 px-4'>Expected Return</th>
                                <th className='py-3 px-4 text-center'>Status</th>
                                <th className='py-3 px-4 text-right'>Action</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100 text-slate-700'>
                            {filteredStudentPasses.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='py-8 text-center text-slate-400'>
                                        No student gate passes in this register view.
                                    </td>
                                </tr>
                            ) : (
                                filteredStudentPasses.map((p) => {
                                    const canRecordExit = p.status === 'Approved' || p.status === 'Ready for Exit'
                                    const canRecordReturn = p.status === 'Exit Recorded' || p.isOverdue
                                    const isCompleted = p.status === 'Returned'

                                    return (
                                        <tr key={p.id} className='hover:bg-slate-50/70 transition-colors'>
                                            <td className='py-3 px-4'>
                                                <div className='font-semibold text-slate-900'>{p.studentName}</div>
                                                <div className='font-mono text-[10px] text-blue-600'>{p.studentId}</div>
                                            </td>
                                            <td className='py-3 px-4'>
                                                <div className='font-medium text-slate-800'>{p.classSection}</div>
                                                <div className='text-[10px] text-slate-400 truncate max-w-[140px]' title={p.accompanyingPerson}>
                                                    Escort: {p.accompanyingPerson || 'Parent / Guardian'}
                                                </div>
                                            </td>
                                            <td className='py-3 px-4'>
                                                <span className='font-mono font-bold text-slate-900'>
                                                    {p.gatePassId || p.id}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4'>
                                                {p.approvedBy ? (
                                                    <div>
                                                        <div className='font-semibold text-emerald-800'>{p.approvedBy.name}</div>
                                                        <div className='text-[10px] text-emerald-600'>{p.approvedBy.roleLabel}</div>
                                                    </div>
                                                ) : (
                                                    <span className='text-[11px] text-amber-600 italic'>Awaiting Sanction</span>
                                                )}
                                            </td>
                                            <td className='py-3 px-4 font-mono'>
                                                <div>{formatOutTimeForDisplay(p.expectedDepartureTime || p.outTime)}</div>
                                                {p.actualDepartureTime && (
                                                    <div className='text-[10px] text-indigo-600 font-semibold'>
                                                        Exit: {p.actualDepartureTime.split(' ').slice(1).join(' ')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className='py-3 px-4 font-mono'>
                                                <div>{formatOutTimeForDisplay(p.expectedReturnTime)}</div>
                                                {p.actualReturnTime && (
                                                    <div className='text-[10px] text-emerald-600 font-semibold'>
                                                        Ret: {p.actualReturnTime.split(' ').slice(1).join(' ')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className='py-3 px-4 text-center'>
                                                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                                                    p.isOverdue
                                                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                                                        : p.status === 'Approved' || p.status === 'Ready for Exit'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : p.status === 'Exit Recorded'
                                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                        : p.status === 'Returned'
                                                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    {p.isOverdue ? 'Overdue Return' : p.displayStatus || p.status}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4 text-right'>
                                                <div className='flex items-center justify-end gap-1.5'>
                                                    <button
                                                        type='button'
                                                        onClick={() => setSelectedStudentPass(p)}
                                                        className='inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer'
                                                        title='Verify Student & Scan QR'
                                                    >
                                                        <QrCode size={12} /> Verify Student
                                                    </button>
                                                    {canRecordExit && (
                                                        <button
                                                            type='button'
                                                            disabled={actionLoading}
                                                            onClick={() => handleRecordExit(p.id)}
                                                            className='inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 transition cursor-pointer disabled:opacity-50'
                                                        >
                                                            <LogOut size={12} /> Record Exit
                                                        </button>
                                                    )}
                                                    {canRecordReturn && (
                                                        <button
                                                            type='button'
                                                            disabled={actionLoading}
                                                            onClick={() => handleRecordReturn(p.id)}
                                                            className='inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50'
                                                        >
                                                            <LogIn size={12} /> Record Return
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL 1: VISITOR BADGE VERIFICATION (Printable Badge) */}
            {selectedVisitor && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden'>
                        <div className='flex items-center justify-between bg-blue-900 px-4 py-3 text-white'>
                            <span className='text-xs font-bold uppercase tracking-wider'>Visitor Gate Pass Badge</span>
                            <button
                                type='button'
                                onClick={() => setSelectedVisitor(null)}
                                className='rounded-lg p-1 text-slate-300 hover:text-white cursor-pointer'
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className='p-5 space-y-4 text-center bg-white'>
                            <div className='border-b border-slate-100 pb-3'>
                                <h3 className='text-base font-extrabold text-slate-900'>{selectedVisitor.campusName || CAMPUS_NAME}</h3>
                                <p className='text-[10px] uppercase font-bold text-blue-700 tracking-wider mt-0.5'>Official Visitor Pass</p>
                                <div className='inline-block mt-2 rounded bg-blue-50 border border-blue-200 px-3 py-1 font-mono text-sm font-bold text-blue-900'>
                                    {selectedVisitor.badgeNumber}
                                </div>
                            </div>

                            {/* Stylized QR Code Matrix */}
                            <div className='flex flex-col items-center justify-center p-2'>
                                <svg viewBox='0 0 100 100' className='w-24 h-24'>
                                    <rect width='100' height='100' fill='white' />
                                    <rect x='10' y='10' width='25' height='25' fill='#1E3A8A' />
                                    <rect x='15' y='15' width='15' height='15' fill='white' />
                                    <rect x='18' y='18' width='9' height='9' fill='#1E3A8A' />

                                    <rect x='65' y='10' width='25' height='25' fill='#1E3A8A' />
                                    <rect x='70' y='15' width='15' height='15' fill='white' />
                                    <rect x='73' y='18' width='9' height='9' fill='#1E3A8A' />

                                    <rect x='10' y='65' width='25' height='25' fill='#1E3A8A' />
                                    <rect x='15' y='70' width='15' height='15' fill='white' />
                                    <rect x='18' y='73' width='9' height='9' fill='#1E3A8A' />

                                    <rect x='45' y='15' width='10' height='10' fill='#1E3A8A' />
                                    <rect x='45' y='35' width='10' height='10' fill='#1E3A8A' />
                                    <rect x='25' y='45' width='10' height='10' fill='#1E3A8A' />
                                    <rect x='45' y='55' width='10' height='10' fill='#1E3A8A' />
                                    <rect x='65' y='45' width='10' height='10' fill='#1E3A8A' />
                                    <rect x='75' y='65' width='15' height='15' fill='#1E3A8A' />
                                    <rect x='45' y='75' width='10' height='10' fill='#1E3A8A' />
                                </svg>
                                <span className='font-mono text-[9px] text-slate-400 mt-1'>BARCODE: {selectedVisitor.badgeBarcode || selectedVisitor.badgeNumber}</span>
                            </div>

                            <div className='space-y-1.5 text-xs text-left bg-slate-50 p-3 rounded-xl border border-slate-100'>
                                <div><span className='text-slate-400'>Visitor:</span> <span className='font-bold text-slate-900'>{selectedVisitor.visitorName}</span></div>
                                <div><span className='text-slate-400'>Meeting:</span> <span className='font-bold text-slate-900'>{selectedVisitor.personToMeet}</span></div>
                                <div><span className='text-slate-400'>Department:</span> <span className='font-semibold text-slate-800'>{selectedVisitor.department}</span></div>
                                <div><span className='text-slate-400'>Entry Time:</span> <span className='font-mono font-bold text-slate-900'>{selectedVisitor.entryDate} {selectedVisitor.entryTime}</span></div>
                                <div><span className='text-slate-400'>Visitors Count:</span> <span className='font-semibold'>{selectedVisitor.numberOfVisitors || 1} Person(s)</span></div>
                                <div><span className='text-slate-400'>Recorded By:</span> <span className='text-slate-600'>{selectedVisitor.recordedBy}</span></div>
                            </div>
                        </div>
                        <div className='flex items-center justify-end gap-2 bg-slate-50 px-4 py-3 border-t border-slate-100'>
                            <button
                                type='button'
                                onClick={() => setSelectedVisitor(null)}
                                className='rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer'
                            >
                                Close
                            </button>
                            <button
                                type='button'
                                onClick={() => window.print()}
                                className='inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer'
                            >
                                <Printer size={13} /> Print Badge
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: STUDENT PASS VERIFICATION & SECURITY ACTIONS */}
            {selectedStudentPass && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden'>
                        <div className='flex items-center justify-between bg-slate-900 px-5 py-3.5 text-white'>
                            <div className='flex items-center gap-2'>
                                <ShieldCheck size={18} className='text-emerald-400' />
                                <span className='text-xs font-bold uppercase tracking-wider'>Gatekeeper Pass Verification</span>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedStudentPass(null)}
                                className='rounded-lg p-1 text-slate-300 hover:text-white cursor-pointer'
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className='p-5 space-y-4 text-xs bg-white'>
                            <div className='border-b border-slate-100 pb-3 flex items-start justify-between'>
                                <div>
                                    <div className='text-sm font-bold text-slate-900'>{selectedStudentPass.studentName}</div>
                                    <div className='text-slate-500 font-mono'>ID: {selectedStudentPass.studentId} • {selectedStudentPass.classSection}</div>
                                    <div className='text-slate-600 font-medium mt-1'>{selectedStudentPass.department}</div>
                                </div>
                                <span className='rounded bg-emerald-50 border border-emerald-200 px-2.5 py-1 font-mono font-bold text-emerald-800 text-[11px]'>
                                    {selectedStudentPass.gatePassId || selectedStudentPass.id}
                                </span>
                            </div>

                            <div className='grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100'>
                                <div>
                                    <span className='text-[10px] uppercase font-bold text-slate-400 block'>Reason</span>
                                    <span className='font-medium text-slate-800'>{selectedStudentPass.reason}</span>
                                </div>
                                <div>
                                    <span className='text-[10px] uppercase font-bold text-slate-400 block'>Escort</span>
                                    <span className='font-medium text-slate-800'>{selectedStudentPass.accompanyingPerson || 'Parent / Guardian'}</span>
                                </div>
                                <div>
                                    <span className='text-[10px] uppercase font-bold text-slate-400 block'>Scheduled Departure</span>
                                    <span className='font-mono font-medium text-slate-800'>{formatOutTimeForDisplay(selectedStudentPass.expectedDepartureTime || selectedStudentPass.outTime)}</span>
                                </div>
                                <div>
                                    <span className='text-[10px] uppercase font-bold text-slate-400 block'>Scheduled Return</span>
                                    <span className='font-mono font-medium text-slate-800'>{formatOutTimeForDisplay(selectedStudentPass.expectedReturnTime)}</span>
                                </div>
                            </div>

                            <div className='rounded-xl border border-emerald-200 bg-emerald-50/70 p-3'>
                                <div className='text-[10px] uppercase font-bold text-emerald-800'>Sanctioning Approver</div>
                                <div className='font-bold text-emerald-950 text-xs mt-0.5'>
                                    {selectedStudentPass.approvedBy ? selectedStudentPass.approvedBy.name : 'Pending Sanction'}
                                </div>
                                <div className='text-[10px] text-emerald-700'>
                                    {selectedStudentPass.approvedBy ? `${selectedStudentPass.approvedBy.roleLabel} • ${selectedStudentPass.approvedBy.timestamp}` : 'Cannot clear exit without authorized executive approval'}
                                </div>
                            </div>

                            <div className='rounded-xl border border-slate-200 bg-white p-3 space-y-1'>
                                <div className='text-[10px] uppercase font-bold text-slate-500'>Perimeter Movement Record</div>
                                <div className='text-[11px] text-slate-700'>
                                    Actual Exit: <span className='font-mono font-semibold'>{selectedStudentPass.actualDepartureTime || 'Not yet exited'}</span>
                                </div>
                                <div className='text-[11px] text-slate-700'>
                                    Actual Return: <span className='font-mono font-semibold'>{selectedStudentPass.actualReturnTime || 'Not yet returned'}</span>
                                </div>
                            </div>
                        </div>

                        <div className='flex items-center justify-end gap-2 bg-slate-50 px-5 py-3 border-t border-slate-100'>
                            <button
                                type='button'
                                onClick={() => setSelectedStudentPass(null)}
                                className='rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer'
                            >
                                Close
                            </button>
                            {(selectedStudentPass.status === 'Approved' || selectedStudentPass.status === 'Ready for Exit') && (
                                <button
                                    type='button'
                                    disabled={actionLoading}
                                    onClick={() => handleRecordExit(selectedStudentPass.id)}
                                    className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer'
                                >
                                    <LogOut size={13} /> Confirm Exit Recorded
                                </button>
                            )}
                            {(selectedStudentPass.status === 'Exit Recorded' || selectedStudentPass.isOverdue) && (
                                <button
                                    type='button'
                                    disabled={actionLoading}
                                    onClick={() => handleRecordReturn(selectedStudentPass.id)}
                                    className='inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer'
                                >
                                    <LogIn size={13} /> Confirm Student Returned
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
