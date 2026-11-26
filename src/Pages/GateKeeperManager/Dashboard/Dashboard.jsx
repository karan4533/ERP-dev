import React, { useState, useEffect, useMemo } from 'react'
import {
    ShieldAlert,
    Users,
    ArrowRightLeft,
    Clock,
    CheckCircle2,
    Search,
    Download,
    Layers,
    Filter,
    FileText,
    Calendar,
    Printer,
    UserCheck,
    Eye,
    RefreshCw
} from 'lucide-react'
import {
    getUnifiedGatekeeperKPIs,
    getVisitorLogs,
    getStudentGatePasses,
    getGatePasses,
    getSecurityMovementAuditLogs,
    CAMPUS_NAME
} from '../../../Common/GatePassSecurity/gatePassSecurityData'
import { formatOutTimeForDisplay } from '../../FrontOffice/GatePass/gatePassData'

export default function GateKeeperManagerDashboard() {
    const [refreshKey, setRefreshKey] = useState(0)
    const [activeTab, setActiveTab] = useState('active-movements') // 'active-movements' | 'all-passes' | 'visitors' | 'audit-logs'
    const [search, setSearch] = useState('')

    const refresh = () => setRefreshKey((k) => k + 1)

    useEffect(() => {
        const handleSync = () => refresh()
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

    const kpis = useMemo(() => {
        void refreshKey
        return getUnifiedGatekeeperKPIs()
    }, [refreshKey])

    const visitors = useMemo(() => {
        void refreshKey
        return getVisitorLogs()
    }, [refreshKey])

    const studentPasses = useMemo(() => {
        void refreshKey
        return getStudentGatePasses()
    }, [refreshKey])

    const materialPasses = useMemo(() => {
        void refreshKey
        return getGatePasses()
    }, [refreshKey])

    const auditLogs = useMemo(() => {
        void refreshKey
        return getSecurityMovementAuditLogs()
    }, [refreshKey])

    // Filter active movements
    const activeVisitors = visitors.filter((v) => v.status === 'Checked In' || v.status === 'On Campus')
    const studentsOutside = studentPasses.filter((p) => p.status === 'Exit Recorded' || p.isOverdue)
    const passesAwaitingExit = studentPasses.filter((p) => p.status === 'Approved' || p.status === 'Ready for Exit')

    return (
        <section className='space-y-6'>
            {/* Header */}
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div>
                    <h1 className='text-xl font-bold tracking-tight text-slate-900'>
                        Gatekeeper Manager Operations &amp; Audit Desk
                    </h1>
                    <p className='text-xs text-slate-500'>
                        Central security oversight: live perimeter telemetry, executive approval compliance, and immutable movement logs.
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => window.print()}
                        className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer'
                    >
                        <Printer size={14} /> Print Audit Report
                    </button>
                    <button
                        type='button'
                        onClick={refresh}
                        className='rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 shadow-xs cursor-pointer'
                        title='Refresh Data'
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* 4 Unified KPI Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between'>
                    <div>
                        <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-500'>Visitors Inside Campus</p>
                        <h3 className='text-2xl font-bold text-slate-900 mt-1'>{kpis.visitorsCurrentlyInside}</h3>
                        <p className='text-[10px] text-blue-600 font-medium mt-0.5'>Active guest badges</p>
                    </div>
                    <div className='rounded-xl bg-blue-50 p-3 text-blue-600'>
                        <Users size={22} />
                    </div>
                </div>

                <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between'>
                    <div>
                        <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-500'>Student Passes Awaiting Exit</p>
                        <h3 className='text-2xl font-bold text-slate-900 mt-1'>{kpis.studentPassesAwaitingExit}</h3>
                        <p className='text-[10px] text-emerald-600 font-medium mt-0.5'>Approved by Principal/Director</p>
                    </div>
                    <div className='rounded-xl bg-emerald-50 p-3 text-emerald-600'>
                        <ArrowRightLeft size={22} />
                    </div>
                </div>

                <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between'>
                    <div>
                        <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-500'>Students Currently Outside</p>
                        <h3 className='text-2xl font-bold text-slate-900 mt-1'>{kpis.studentsCurrentlyOutside}</h3>
                        <p className='text-[10px] text-indigo-600 font-medium mt-0.5'>Departures logged at gate</p>
                    </div>
                    <div className='rounded-xl bg-indigo-50 p-3 text-indigo-600'>
                        <Clock size={22} />
                    </div>
                </div>

                <div className={`rounded-2xl border p-4 shadow-xs flex items-center justify-between ${
                    kpis.overdueReturns > 0 ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200/80 bg-white'
                }`}>
                    <div>
                        <p className={`text-[11px] font-semibold uppercase tracking-wider ${
                            kpis.overdueReturns > 0 ? 'text-rose-700' : 'text-slate-500'
                        }`}>Overdue Returns</p>
                        <h3 className={`text-2xl font-bold mt-1 ${
                            kpis.overdueReturns > 0 ? 'text-rose-700' : 'text-slate-900'
                        }`}>{kpis.overdueReturns}</h3>
                        <p className={`text-[10px] font-medium mt-0.5 ${
                            kpis.overdueReturns > 0 ? 'text-rose-600' : 'text-slate-400'
                        }`}>Students &amp; Material past expected time</p>
                    </div>
                    <div className={`rounded-xl p-3 ${
                        kpis.overdueReturns > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                        <ShieldAlert size={22} />
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className='flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold'>
                <button
                    type='button'
                    onClick={() => setActiveTab('active-movements')}
                    className={`rounded-xl px-4 py-2 transition cursor-pointer ${
                        activeTab === 'active-movements'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Live Active Movements ({kpis.visitorsCurrentlyInside + kpis.studentsCurrentlyOutside})
                </button>
                <button
                    type='button'
                    onClick={() => setActiveTab('all-passes')}
                    className={`rounded-xl px-4 py-2 transition cursor-pointer ${
                        activeTab === 'all-passes'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Student Passes Registry ({studentPasses.length})
                </button>
                <button
                    type='button'
                    onClick={() => setActiveTab('visitors')}
                    className={`rounded-xl px-4 py-2 transition cursor-pointer ${
                        activeTab === 'visitors'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Visitors Master Log ({visitors.length})
                </button>
                <button
                    type='button'
                    onClick={() => setActiveTab('audit-logs')}
                    className={`rounded-xl px-4 py-2 transition cursor-pointer ${
                        activeTab === 'audit-logs'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Security Audit Trail ({auditLogs.length})
                </button>
            </div>

            {/* TAB CONTENT: ACTIVE MOVEMENTS */}
            {activeTab === 'active-movements' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    {/* Active Visitors Panel */}
                    <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-sm font-bold text-slate-900 flex items-center gap-2'>
                                <Users size={16} className='text-blue-600' /> Guests Currently Inside Campus ({activeVisitors.length})
                            </h3>
                            <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200'>
                                Active Badges
                            </span>
                        </div>
                        <div className='space-y-3'>
                            {activeVisitors.length === 0 ? (
                                <p className='text-xs text-slate-400 py-4 text-center'>No outside visitors currently on campus.</p>
                            ) : (
                                activeVisitors.map((v) => (
                                    <div key={v.id} className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs'>
                                        <div>
                                            <div className='font-bold text-slate-900'>{v.visitorName}</div>
                                            <div className='text-[11px] text-slate-500'>
                                                Meeting: <span className='font-semibold text-slate-700'>{v.personToMeet}</span> ({v.department})
                                            </div>
                                            <div className='text-[10px] text-slate-400'>
                                                Checked in at {v.entryTime} by {v.recordedBy}
                                            </div>
                                        </div>
                                        <div className='text-right'>
                                            <span className='font-mono font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded'>
                                                {v.badgeNumber}
                                            </span>
                                            <div className='text-[10px] text-slate-500 mt-1'>{v.gateNumber}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Students Outside Campus Panel */}
                    <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-sm font-bold text-slate-900 flex items-center gap-2'>
                                <Clock size={16} className='text-indigo-600' /> Students Currently Outside ({studentsOutside.length})
                            </h3>
                            <span className='rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200'>
                                Exit Cleared
                            </span>
                        </div>
                        <div className='space-y-3'>
                            {studentsOutside.length === 0 ? (
                                <p className='text-xs text-slate-400 py-4 text-center'>No students currently outside campus.</p>
                            ) : (
                                studentsOutside.map((p) => (
                                    <div key={p.id} className={`flex items-center justify-between rounded-xl border p-3 text-xs ${
                                        p.isOverdue ? 'border-rose-200 bg-rose-50/40' : 'border-slate-100 bg-slate-50/60'
                                    }`}>
                                        <div>
                                            <div className='font-bold text-slate-900'>{p.studentName} <span className='text-slate-400 font-normal font-mono'>({p.studentId})</span></div>
                                            <div className='text-[11px] text-slate-600'>Class: {p.classSection} • Escort: {p.accompanyingPerson}</div>
                                            <div className='text-[10px] text-slate-500'>
                                                Exit Time: {p.actualDepartureTime} | Exp Return: <span className='font-semibold'>{p.expectedReturnTime}</span>
                                            </div>
                                        </div>
                                        <div className='text-right'>
                                            <span className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                                                p.isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-800'
                                            }`}>
                                                {p.gatePassId || p.id}
                                            </span>
                                            <div className='text-[10px] text-slate-400 mt-1'>
                                                Appr: {p.approvedBy?.name ? p.approvedBy.name.split(' ').slice(0, 2).join(' ') : 'Exec'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: ALL STUDENT PASSES */}
            {activeTab === 'all-passes' && (
                <div className='rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden'>
                    <div className='p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between'>
                        <h3 className='text-xs font-bold uppercase tracking-wider text-slate-700'>
                            Complete Student Gate Pass Register &amp; Approval Record
                        </h3>
                        <span className='text-xs text-slate-500'>Total Passes: {studentPasses.length}</span>
                    </div>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-left text-xs'>
                            <thead>
                                <tr className='border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                    <th className='py-3 px-4'>Pass ID</th>
                                    <th className='py-3 px-4'>Student Name &amp; ID</th>
                                    <th className='py-3 px-4'>Class</th>
                                    <th className='py-3 px-4'>Reason for Leaving</th>
                                    <th className='py-3 px-4'>Approving Authority</th>
                                    <th className='py-3 px-4'>Scheduled Times</th>
                                    <th className='py-3 px-4'>Gate Movement</th>
                                    <th className='py-3 px-4 text-center'>Status</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100 text-slate-700'>
                                {studentPasses.map((p) => (
                                    <tr key={p.id} className='hover:bg-slate-50/70'>
                                        <td className='py-3 px-4 font-mono font-bold text-slate-900'>{p.gatePassId || p.id}</td>
                                        <td className='py-3 px-4'>
                                            <div className='font-semibold text-slate-900'>{p.studentName}</div>
                                            <div className='font-mono text-[10px] text-blue-600'>{p.studentId}</div>
                                        </td>
                                        <td className='py-3 px-4'>{p.classSection}</td>
                                        <td className='py-3 px-4 max-w-xs truncate' title={p.reason}>{p.reason}</td>
                                        <td className='py-3 px-4'>
                                            {p.approvedBy ? (
                                                <div>
                                                    <span className='font-semibold text-emerald-800'>{p.approvedBy.name}</span>
                                                    <span className='text-[10px] text-emerald-600 block'>{p.approvedBy.roleLabel}</span>
                                                </div>
                                            ) : (
                                                <span className='text-amber-600 italic text-[11px]'>Pending Sanction</span>
                                            )}
                                        </td>
                                        <td className='py-3 px-4 font-mono text-[11px]'>
                                            <div>Dep: {p.expectedDepartureTime || p.outTime}</div>
                                            <div>Ret: {p.expectedReturnTime}</div>
                                        </td>
                                        <td className='py-3 px-4 text-[11px]'>
                                            <div>Exit: <span className='font-mono'>{p.actualDepartureTime || '—'}</span></div>
                                            <div>Return: <span className='font-mono'>{p.actualReturnTime || '—'}</span></div>
                                        </td>
                                        <td className='py-3 px-4 text-center'>
                                            <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                                                p.isOverdue ? 'bg-rose-50 text-rose-700 border-rose-300' :
                                                p.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                p.status === 'Exit Recorded' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                p.status === 'Returned' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                                                'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {p.isOverdue ? 'Overdue Return' : p.displayStatus || p.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: VISITORS MASTER LOG */}
            {activeTab === 'visitors' && (
                <div className='rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden'>
                    <div className='p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between'>
                        <h3 className='text-xs font-bold uppercase tracking-wider text-slate-700'>
                            Complete Campus Visitor Check-in &amp; Check-out Ledger
                        </h3>
                        <span className='text-xs text-slate-500'>Total Visitors: {visitors.length}</span>
                    </div>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-left text-xs'>
                            <thead>
                                <tr className='border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                    <th className='py-3 px-4'>Badge / ID</th>
                                    <th className='py-3 px-4'>Visitor Name &amp; Contact</th>
                                    <th className='py-3 px-4'>Person to Meet</th>
                                    <th className='py-3 px-4'>Department</th>
                                    <th className='py-3 px-4'>Purpose of Visit</th>
                                    <th className='py-3 px-4'>Check-in Time</th>
                                    <th className='py-3 px-4'>Check-out Time</th>
                                    <th className='py-3 px-4 text-center'>Status</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100 text-slate-700'>
                                {visitors.map((v) => (
                                    <tr key={v.id} className='hover:bg-slate-50/70'>
                                        <td className='py-3 px-4 font-mono font-bold text-slate-900'>{v.badgeNumber}</td>
                                        <td className='py-3 px-4'>
                                            <div className='font-semibold text-slate-900'>{v.visitorName}</div>
                                            <div className='text-[10px] text-slate-400'>{v.phone} • {v.visitorOrganization}</div>
                                        </td>
                                        <td className='py-3 px-4 font-medium'>{v.personToMeet}</td>
                                        <td className='py-3 px-4 text-slate-600'>{v.department}</td>
                                        <td className='py-3 px-4 max-w-xs truncate' title={v.purpose}>{v.purpose}</td>
                                        <td className='py-3 px-4 font-mono'>{v.entryDate} {v.entryTime}</td>
                                        <td className='py-3 px-4 font-mono'>{v.exitTime || '—'}</td>
                                        <td className='py-3 px-4 text-center'>
                                            <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                                                v.status === 'Checked In' || v.status === 'On Campus'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                                {v.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: IMMUTABLE AUDIT LOGS */}
            {activeTab === 'audit-logs' && (
                <div className='rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden'>
                    <div className='p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between'>
                        <h3 className='text-xs font-bold uppercase tracking-wider text-slate-700'>
                            Immutable Perimeter Security &amp; Gate Movement Audit Trail
                        </h3>
                        <span className='text-xs text-slate-500'>Audit Records: {auditLogs.length}</span>
                    </div>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-left text-xs'>
                            <thead>
                                <tr className='border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                    <th className='py-3 px-4'>Timestamp</th>
                                    <th className='py-3 px-4'>Action</th>
                                    <th className='py-3 px-4'>Entity ID</th>
                                    <th className='py-3 px-4'>Actor / Performed By</th>
                                    <th className='py-3 px-4'>Transition</th>
                                    <th className='py-3 px-4'>Audit Remarks</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100 text-slate-700'>
                                {auditLogs.map((log) => (
                                    <tr key={log.id} className='hover:bg-slate-50/70'>
                                        <td className='py-3 px-4 font-mono text-[11px] text-slate-500'>{log.timestamp}</td>
                                        <td className='py-3 px-4 font-mono font-bold text-slate-900'>{log.action}</td>
                                        <td className='py-3 px-4 font-mono text-blue-700'>{log.entityId}</td>
                                        <td className='py-3 px-4 font-medium text-slate-800'>{log.actorName} ({log.actorRole})</td>
                                        <td className='py-3 px-4'>
                                            <span className='text-slate-400'>{log.previousState}</span> → <span className='font-semibold text-slate-900'>{log.newState}</span>
                                        </td>
                                        <td className='py-3 px-4 text-slate-600 max-w-sm truncate' title={log.remarks}>{log.remarks}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    )
}
