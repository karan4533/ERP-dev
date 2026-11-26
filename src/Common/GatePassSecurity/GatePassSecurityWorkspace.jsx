import React, { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
    Shield,
    ShieldCheck,
    ShieldAlert,
    Truck,
    Users,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Plus,
    Search,
    Filter,
    Download,
    Eye,
    ChevronRight,
    Building2,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    Layers,
    UserCheck,
    LogOut,
    LogIn,
    X,
    Calendar,
    Phone,
    User,
    Printer,
    QrCode,
    ArrowRightLeft,
    RefreshCw,
    Briefcase
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import VisitorsWorkspace from '../Visitors/VisitorsWorkspace'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'
import {
    getGatePasses,
    getVisitorLogs,
    getStudentGatePasses,
    submitGatePass,
    updateGatePassApproval,
    recordSecurityGateExit,
    recordSecurityGateReturn,
    registerVisitorCheckIn,
    recordVisitorCheckOut,
    approveStudentGatePass,
    rejectStudentGatePass,
    recordStudentExit,
    recordStudentReturn,
    getAuthorizedStaffDirectory,
    getSecurityMovementAuditLogs,
    ID_PROOF_TYPES,
    CAMPUS_NAME
} from './gatePassSecurityData'
import { formatOutTimeForDisplay } from '../../Pages/FrontOffice/GatePass/gatePassData'

export default function GatePassSecurityWorkspace({ defaultTab = 'overview', roleOverride = null }) {
    const { role: authRole, email: authEmail, name: authName } = useAuth()
    const activeRole = roleOverride || authRole || 'gatekeeper'
    const cleanRole = String(activeRole || '').trim().toLowerCase().replace(/-/g, '')
    const roleLabel = getProfileLabel(activeRole)

    // Role Capabilities
    const isSecurityStaff = ['gatekeeper', 'gatekeepermanager'].includes(cleanRole)
    const isExecutiveApprover = ['director', 'principal', 'jointdirector', 'superadmin', 'admin'].includes(cleanRole)
    const isDA = cleanRole === 'jointdirectorassistant'
    const canViewExecutiveQueue = isExecutiveApprover || isDA
    const isFrontOfficeOrPRM = ['prm', 'admin', 'superadmin'].includes(cleanRole)

    // Route params
    const { tab } = useParams()
    const targetTab = tab || defaultTab

    // State
    const [activeTab, setActiveTab] = useState(targetTab)
    const [actionMessage, setActionMessage] = useState('')
    const [refreshKey, setRefreshKey] = useState(0)

    const notify = (msg) => {
        setActionMessage(msg)
        setTimeout(() => setActionMessage(''), 4000)
    }

    // Cross-tab and live sync listener
    useEffect(() => {
        const handleSync = () => setRefreshKey((k) => k + 1)
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

    // Queries
    const passes = useMemo(() => {
        void refreshKey
        return getGatePasses()
    }, [refreshKey])

    const visitors = useMemo(() => {
        void refreshKey
        return getVisitorLogs()
    }, [refreshKey])

    const studentPasses = useMemo(() => {
        void refreshKey
        return getStudentGatePasses()
    }, [refreshKey])

    const auditLogs = useMemo(() => {
        void refreshKey
        return getSecurityMovementAuditLogs()
    }, [refreshKey])

    const staffDirectory = useMemo(() => getAuthorizedStaffDirectory(), [])

    // Pending student approvals for Principal & Director of Academics
    const pendingStudentApprovals = useMemo(() => {
        return studentPasses.filter((p) => p.status === 'Pending Approval')
    }, [studentPasses])

    // Tabs
    const availableTabs = useMemo(() => {
        const base = [
            { id: 'overview', label: 'Security Overview', icon: BarChart3 },
            { id: 'student-passes', label: 'Student Gate Passes', icon: ArrowRightLeft },
            { id: 'visitors', label: 'Visitor Register', icon: Users },
            { id: 'material-passes', label: 'Material Passes', icon: Truck },
            { id: 'live-gate', label: 'Perimeter Live Gate', icon: ShieldCheck },
            { id: 'returnable-tracker', label: 'Returnable Tracker', icon: Clock },
            { id: 'audit-logs', label: 'Movement Logs', icon: Layers }
        ]
        return base
    }, [])

    useEffect(() => {
        const currentTarget = tab || defaultTab
        if (currentTarget && availableTabs.some((t) => t.id === currentTarget)) {
            setActiveTab(currentTarget)
        }
    }, [tab, defaultTab, availableTabs])

    // KPIs
    const kpis = useMemo(() => {
        const totalPasses = passes.length + studentPasses.length
        const activeInside = visitors.filter((v) => v.status === 'Checked In' || v.status === 'On Campus').length
        const returnableOverdue = passes.filter((p) => p.materialType === 'Returnable' && p.status === 'Overdue').length
        const awaitingExit = studentPasses.filter((p) => p.status === 'Approved' || p.status === 'Ready for Exit').length
        const studentsOutside = studentPasses.filter((p) => p.status === 'Exit Recorded').length
        const pendingApprovalsCount = pendingStudentApprovals.length

        return {
            totalPasses,
            visitorsInside: activeInside,
            returnableOverdue,
            awaitingExit,
            studentsOutside,
            pendingApprovalsCount
        }
    }, [passes, visitors, studentPasses, pendingStudentApprovals])

    // ==========================================
    // MODAL & SELECTION STATES
    // ==========================================
    const [isCreatePassModalOpen, setIsCreatePassModalOpen] = useState(false)
    const [passFormData, setPassFormData] = useState({
        passType: 'Material',
        materialType: 'Returnable',
        department: 'Science Laboratory',
        responsiblePerson: authName || 'Priya Menon',
        responsibleContact: '+91 98765 43210',
        destination: 'District Science Exhibition, Anna University',
        purpose: 'Science Olympiad robotics demonstration',
        vehicleNumber: '',
        expectedReturnDate: '10-11-2026',
        items: [
            { itemCode: 'LAB-MIC-01', description: 'Olympus CX23 Compound Microscope', serialNo: 'OLY-MIC-4401', qty: 2, uom: 'Units', condition: 'Good' }
        ]
    })

    // Minimal Visitor Check-in Form State (Section 3 requirement)
    const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false)
    const [visitorFormData, setVisitorFormData] = useState({
        visitorName: '',
        phone: '',
        visitorOrganization: '',
        personToMeet: staffDirectory[0]?.name || 'Dr. Ramanathan K',
        department: staffDirectory[0]?.department || 'Academics & Teaching',
        purpose: 'New Student Admission & Campus Tour',
        idProofType: 'Aadhaar Card',
        idProofNumber: '',
        numberOfVisitors: 1,
        gateNumber: 'Gate #1 (Main Gate)'
    })

    const [selectedBadgeVisitor, setSelectedBadgeVisitor] = useState(null)
    const [selectedStudentPassForView, setSelectedStudentPassForView] = useState(null)

    // Handlers
    const handlePersonToMeetChange = (e) => {
        const selectedName = e.target.value
        const found = staffDirectory.find((emp) => emp.name === selectedName)
        setVisitorFormData((prev) => ({
            ...prev,
            personToMeet: selectedName,
            department: found ? found.department : prev.department
        }))
    }

    const handleVisitorCheckinSubmit = (e) => {
        e.preventDefault()
        try {
            const newRecord = registerVisitorCheckIn({
                ...visitorFormData,
                recordedBy: `${authName || 'Kavita Reddy'} (${roleLabel})`
            })
            notify(`Visitor ${newRecord.visitorName} checked in! Badge ${newRecord.badgeNumber} generated.`)
            setIsVisitorModalOpen(false)
            setSelectedBadgeVisitor(newRecord) // Show instant printable badge
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleVisitorCheckout = (visitorId) => {
        try {
            const updated = recordVisitorCheckOut(visitorId, `${authName || 'Security Officer'} (${roleLabel})`)
            notify(`Visitor ${updated.visitorName} checked out! Exit recorded.`)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    // OR-Based Student Gate Pass Approval Handlers
    const handleApproveStudentPass = (passId) => {
        try {
            const result = approveStudentGatePass(
                passId,
                activeRole,
                authName || (activeRole === 'principal' ? 'Dr. Ramanathan K' : 'Dr. Kavita Sharma'),
                'Sanctioned by executive authority for campus exit.'
            )
            if (!result.success) {
                notify(result.message)
            } else {
                notify(`Gate Pass ${result.pass.gatePassId} sanctioned! Unique pass generated and routed to Gatekeeper.`)
            }
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleRejectStudentPass = (passId) => {
        const reason = prompt('Please specify the reason for declining this gate pass:')
        if (reason === null) return
        try {
            const result = rejectStudentGatePass(
                passId,
                activeRole,
                authName || (activeRole === 'principal' ? 'Dr. Ramanathan K' : 'Dr. Kavita Sharma'),
                reason || 'Declined by executive authority.'
            )
            notify(`Gate pass request rejected.`)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleGatekeeperExit = (passId) => {
        try {
            const pass = recordStudentExit(passId, `${authName || 'Ram Singh'} (Gatekeeper)`)
            notify(`Student ${pass.studentName} departure logged at gate. Status: Exit Recorded.`)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleGatekeeperReturn = (passId) => {
        try {
            const pass = recordStudentReturn(passId, `${authName || 'Ram Singh'} (Gatekeeper)`)
            notify(`Student ${pass.studentName} return verified. Pass closed.`)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    return (
        <div className='space-y-6 p-4 md:p-6 bg-slate-50/50 min-h-screen'>
            {/* Feedback Alert Toast */}
            {actionMessage && (
                <div className='flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs'>
                    <CheckCircle2 size={16} className='text-emerald-600 shrink-0' />
                    <span>{actionMessage}</span>
                </div>
            )}

            {/* Header: Title, Role Badge, Primary Actions */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs'>
                        <Shield size={22} />
                    </div>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-xl md:text-2xl font-bold tracking-tight text-slate-900'>
                                Gate Pass &amp; Campus Security
                            </h1>
                            <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100'>
                                {roleLabel}
                            </span>
                        </div>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            Perimeter movement security: synchronized student passes, visitor register, and material clearances.
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-2.5'>
                    <button
                        type='button'
                        onClick={() => setRefreshKey((k) => k + 1)}
                        className='rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 shadow-xs cursor-pointer'
                        title='Refresh Data'
                    >
                        <RefreshCw size={14} />
                    </button>
                    <button
                        type='button'
                        onClick={() => setIsVisitorModalOpen(true)}
                        className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer'
                    >
                        <UserCheck size={14} className='text-blue-600' /> Check-in Visitor
                    </button>
                </div>
            </div>

            {/* Executive Pending Approval Alert (Shown to Principal, Director, and Director Assistant) */}
            {canViewExecutiveQueue && pendingStudentApprovals.length > 0 && (
                <div className='rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3'>
                    <div className='flex items-center gap-3'>
                        <div className='rounded-xl bg-amber-100 p-2.5 text-amber-700'>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className='text-sm font-bold text-amber-950'>
                                {isDA ? `${pendingStudentApprovals.length} Student Gate Pass Request(s) Awaiting Principal Approval` : `${pendingStudentApprovals.length} Student Gate Pass Request(s) Awaiting Your Approval`}
                            </h3>
                            <p className='text-xs text-amber-800 mt-0.5'>
                                {isDA ? 'Executive visibility enabled: Monitor Principal sanction and gate movement in real time.' : 'OR-based approval: Once you approve, the pass is immediately sanctioned, generated, and cleared for the Gatekeeper.'}
                            </p>
                        </div>
                    </div>
                    <button
                        type='button'
                        onClick={() => setActiveTab('student-passes')}
                        className='inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 shadow-xs transition cursor-pointer shrink-0'
                    >
                        Open Approval Queue →
                    </button>
                </div>
            )}

            {/* Navigation Tabs Bar */}
            <div className='border-b border-slate-200/80 pb-px'>
                <div className='flex items-center gap-2 overflow-x-auto scrollbar-none'>
                    {availableTabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                type='button'
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                <span>{tab.label}</span>
                                {tab.id === 'student-passes' && canViewExecutiveQueue && pendingStudentApprovals.length > 0 && (
                                    <span className='rounded-full bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 animate-pulse'>
                                        {pendingStudentApprovals.length} pending
                                    </span>
                                )}
                                {tab.id === 'visitors' && kpis.visitorsInside > 0 && (
                                    <span className='rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.2'>
                                        {kpis.visitorsInside} on site
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: SECURITY OVERVIEW                                                  */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (
                <div className='space-y-6'>
                    {/* 4 Unified KPI Cards */}
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between'>
                            <div>
                                <span className='text-[11px] font-semibold text-slate-500 uppercase tracking-wider'>Visitors Inside</span>
                                <h3 className='text-2xl font-bold text-slate-900 mt-1'>{kpis.visitorsInside}</h3>
                                <p className='text-[10px] text-blue-600 font-medium mt-0.5'>Active guest badges</p>
                            </div>
                            <div className='rounded-xl bg-blue-50 p-3 text-blue-600'>
                                <Users size={22} />
                            </div>
                        </div>

                        <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between'>
                            <div>
                                <span className='text-[11px] font-semibold text-slate-500 uppercase tracking-wider'>Passes Awaiting Exit</span>
                                <h3 className='text-2xl font-bold text-slate-900 mt-1'>{kpis.awaitingExit}</h3>
                                <p className='text-[10px] text-emerald-600 font-medium mt-0.5'>Sanctioned &amp; ready</p>
                            </div>
                            <div className='rounded-xl bg-emerald-50 p-3 text-emerald-600'>
                                <ArrowRightLeft size={22} />
                            </div>
                        </div>

                        <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between'>
                            <div>
                                <span className='text-[11px] font-semibold text-slate-500 uppercase tracking-wider'>Students Outside</span>
                                <h3 className='text-2xl font-bold text-slate-900 mt-1'>{kpis.studentsOutside}</h3>
                                <p className='text-[10px] text-indigo-600 font-medium mt-0.5'>Exit logged at perimeter</p>
                            </div>
                            <div className='rounded-xl bg-indigo-50 p-3 text-indigo-600'>
                                <Clock size={22} />
                            </div>
                        </div>

                        <div className={`rounded-2xl border p-4 shadow-xs flex items-center justify-between ${
                            kpis.returnableOverdue > 0 ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200/80 bg-white'
                        }`}>
                            <div>
                                <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                                    kpis.returnableOverdue > 0 ? 'text-rose-700' : 'text-slate-500'
                                }`}>Overdue Returns</span>
                                <h3 className={`text-2xl font-bold mt-1 ${
                                    kpis.returnableOverdue > 0 ? 'text-rose-700' : 'text-slate-900'
                                }`}>{kpis.returnableOverdue}</h3>
                                <p className={`text-[10px] font-medium mt-0.5 ${
                                    kpis.returnableOverdue > 0 ? 'text-rose-600' : 'text-slate-400'
                                }`}>Past scheduled return</p>
                            </div>
                            <div className={`rounded-xl p-3 ${
                                kpis.returnableOverdue > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                                <AlertTriangle size={22} />
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        {/* Live Gate Queue */}
                        <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4'>
                            <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                                <h3 className='text-sm font-bold text-slate-900 flex items-center gap-2'>
                                    <ArrowRightLeft size={16} className='text-emerald-600' /> Approved Student Gate Passes Ready for Exit
                                </h3>
                                <button
                                    type='button'
                                    onClick={() => setActiveTab('student-passes')}
                                    className='text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer'
                                >
                                    View All Passes →
                                </button>
                            </div>
                            <div className='space-y-3'>
                                {studentPasses.filter((p) => p.status === 'Approved' || p.status === 'Ready for Exit').length === 0 ? (
                                    <p className='text-xs text-slate-400 py-4 text-center'>No student gate passes awaiting gate departure.</p>
                                ) : (
                                    studentPasses.filter((p) => p.status === 'Approved' || p.status === 'Ready for Exit').slice(0, 4).map((pass) => (
                                        <div key={pass.id} className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs'>
                                            <div>
                                                <div className='font-bold text-slate-900'>{pass.studentName} <span className='font-mono font-normal text-slate-400'>({pass.studentId})</span></div>
                                                <div className='text-[11px] text-slate-600'>Class: {pass.classSection} • Escort: {pass.accompanyingPerson}</div>
                                                <div className='text-[10px] text-slate-400'>Reason: {pass.reason}</div>
                                            </div>
                                            <div className='text-right'>
                                                <span className='font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]'>
                                                    {pass.gatePassId || pass.id}
                                                </span>
                                                <div className='text-[10px] text-slate-500 mt-1'>
                                                    Out: {formatOutTimeForDisplay(pass.expectedDepartureTime || pass.outTime)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Active Visitors Queue */}
                        <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4'>
                            <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                                <h3 className='text-sm font-bold text-slate-900 flex items-center gap-2'>
                                    <Users size={16} className='text-blue-600' /> Guests Inside Campus
                                </h3>
                                <button
                                    type='button'
                                    onClick={() => setActiveTab('visitors')}
                                    className='text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer'
                                >
                                    Open Register →
                                </button>
                            </div>
                            <div className='space-y-3'>
                                {visitors.filter((v) => v.status === 'Checked In' || v.status === 'On Campus').length === 0 ? (
                                    <p className='text-xs text-slate-400 py-4 text-center'>No outside visitors currently inside.</p>
                                ) : (
                                    visitors.filter((v) => v.status === 'Checked In' || v.status === 'On Campus').slice(0, 4).map((v) => (
                                        <div key={v.id} className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs'>
                                            <div>
                                                <div className='font-bold text-slate-900'>{v.visitorName}</div>
                                                <div className='text-[11px] text-slate-600'>Meeting: {v.personToMeet} ({v.department})</div>
                                                <div className='text-[10px] text-slate-400'>Checked in: {v.entryTime}</div>
                                            </div>
                                            <div className='text-right'>
                                                <span className='font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px]'>
                                                    {v.badgeNumber}
                                                </span>
                                                <button
                                                    type='button'
                                                    onClick={() => handleVisitorCheckout(v.id)}
                                                    className='block text-[10px] text-rose-600 font-semibold hover:underline mt-1 cursor-pointer'
                                                >
                                                    Check Out →
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: STUDENT GATE PASSES & APPROVAL WORKFLOW                           */}
            {/* ========================================================================= */}
            {activeTab === 'student-passes' && (
                <div className='space-y-6'>
                    {/* Executive Approval Queue (Prominent for Principal, Director, and Director Assistant) */}
                    {canViewExecutiveQueue && (
                        <div className='rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs space-y-4'>
                            <div className='flex items-center justify-between border-b border-amber-200/60 pb-3'>
                                <div>
                                    <h3 className='text-sm font-bold text-amber-950 flex items-center gap-2'>
                                        <ShieldCheck size={16} className='text-amber-600' />
                                        {isDA ? 'Director Assistant (DA) Oversight — Principal Approval Queue' : 'Executive Approval Queue (Principal / Director of Academics)'}
                                    </h3>
                                    <p className='text-xs text-amber-800 mt-0.5'>
                                        {isDA ? 'Live visibility for Director Assistant to monitor pending and approved Principal gate pass decisions.' : 'Simplified OR-based approval: Either you or the other authorized approver can sanction the request with a single click.'}
                                    </p>
                                </div>
                                <span className='rounded-full bg-amber-500 text-white text-xs font-bold px-3 py-1'>
                                    {pendingStudentApprovals.length} Pending
                                </span>
                            </div>

                            {pendingStudentApprovals.length === 0 ? (
                                <p className='text-xs text-amber-900 py-3 text-center font-medium'>
                                    All student gate pass requests have been reviewed. No pending requests.
                                </p>
                            ) : (
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    {pendingStudentApprovals.map((req) => (
                                        <div key={req.id} className='rounded-xl border border-amber-200 bg-white p-4 text-xs shadow-xs space-y-3'>
                                            <div className='flex items-start justify-between'>
                                                <div>
                                                    <span className='font-mono font-bold text-amber-900 text-[11px] block'>{req.id}</span>
                                                    <span className='text-sm font-bold text-slate-900'>{req.studentName}</span>
                                                    <span className='text-[11px] text-slate-500 font-mono block'>ID: {req.studentId} • {req.classSection}</span>
                                                </div>
                                                <span className='rounded bg-amber-100 text-amber-800 font-bold px-2 py-0.5 text-[10px]'>
                                                    Pending
                                                </span>
                                            </div>

                                            <div className='bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-[11px] text-slate-700'>
                                                <div><span className='text-slate-400'>Reason:</span> <span className='font-medium'>{req.reason}</span></div>
                                                <div><span className='text-slate-400'>Escort:</span> <span>{req.accompanyingPerson || 'Parent / Guardian'}</span></div>
                                                <div><span className='text-slate-400'>Scheduled Out:</span> <span className='font-mono font-semibold'>{formatOutTimeForDisplay(req.expectedDepartureTime || req.outTime)}</span> | Return: <span className='font-mono font-semibold'>{formatOutTimeForDisplay(req.expectedReturnTime)}</span></div>
                                                <div><span className='text-slate-400'>Requested By:</span> <span>{req.requesterName}</span></div>
                                            </div>

                                            <div className='flex items-center justify-end gap-2 pt-2 border-t border-slate-100'>
                                                {isExecutiveApprover ? (
                                                    <>
                                                        <button
                                                            type='button'
                                                            onClick={() => handleRejectStudentPass(req.id)}
                                                            className='rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer'
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            type='button'
                                                            onClick={() => handleApproveStudentPass(req.id)}
                                                            className='inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition cursor-pointer'
                                                        >
                                                            <CheckCircle2 size={13} /> Approve Gate Pass
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className='text-xs text-amber-700 italic font-medium'>
                                                        Awaiting Principal / Director sanction
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Master Student Gate Pass Register Table */}
                    <div className='rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden'>
                        <div className='p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between'>
                            <div>
                                <h3 className='text-xs font-bold uppercase tracking-wider text-slate-700'>
                                    Official Student Gate Pass Movement Ledger
                                </h3>
                                <p className='text-[11px] text-slate-500'>
                                    Real-time synchronized registry across PRM, Principal, Director, Gatekeeper and Gatekeeper Manager.
                                </p>
                            </div>
                            <span className='text-xs text-slate-500 font-medium'>Total: {studentPasses.length}</span>
                        </div>

                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3 px-4'>Gate Pass ID</th>
                                        <th className='py-3 px-4'>Student Information</th>
                                        <th className='py-3 px-4'>Class &amp; Dept</th>
                                        <th className='py-3 px-4'>Reason for Leaving</th>
                                        <th className='py-3 px-4'>Sanctioning Approver</th>
                                        <th className='py-3 px-4'>Scheduled Times</th>
                                        <th className='py-3 px-4 text-center'>Status</th>
                                        <th className='py-3 px-4 text-right'>Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {studentPasses.map((p) => {
                                        const isActionableExit = p.status === 'Approved' || p.status === 'Ready for Exit'
                                        const isActionableReturn = p.status === 'Exit Recorded' || p.isOverdue

                                        return (
                                            <tr key={p.id} className='hover:bg-slate-50/70 transition-colors'>
                                                <td className='py-3 px-4'>
                                                    <span className='font-mono font-bold text-slate-900'>{p.gatePassId || p.id}</span>
                                                    <span className='text-[10px] text-slate-400 block'>{p.date}</span>
                                                </td>
                                                <td className='py-3 px-4'>
                                                    <div className='font-semibold text-slate-900'>{p.studentName}</div>
                                                    <div className='font-mono text-[10px] text-blue-600'>{p.studentId}</div>
                                                </td>
                                                <td className='py-3 px-4'>
                                                    <div className='font-medium'>{p.classSection}</div>
                                                    <div className='text-[10px] text-slate-400 truncate max-w-[120px]' title={p.accompanyingPerson}>
                                                        Escort: {p.accompanyingPerson || 'Parent'}
                                                    </div>
                                                </td>
                                                <td className='py-3 px-4 max-w-xs truncate' title={p.reason}>{p.reason}</td>
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
                                                <td className='py-3 px-4 font-mono text-[11px]'>
                                                    <div>Dep: {formatOutTimeForDisplay(p.expectedDepartureTime || p.outTime)}</div>
                                                    <div>Ret: {formatOutTimeForDisplay(p.expectedReturnTime)}</div>
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
                                                <td className='py-3 px-4 text-right'>
                                                    <div className='flex items-center justify-end gap-1.5'>
                                                        <button
                                                            type='button'
                                                            onClick={() => setSelectedStudentPassForView(p)}
                                                            className='inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer'
                                                        >
                                                            <Eye size={12} /> View
                                                        </button>
                                                        {isSecurityStaff && isActionableExit && (
                                                            <button
                                                                type='button'
                                                                onClick={() => handleGatekeeperExit(p.id)}
                                                                className='rounded-lg bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 cursor-pointer'
                                                            >
                                                                Record Exit
                                                            </button>
                                                        )}
                                                        {isSecurityStaff && isActionableReturn && (
                                                            <button
                                                                type='button'
                                                                onClick={() => handleGatekeeperReturn(p.id)}
                                                                className='rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 cursor-pointer'
                                                            >
                                                                Record Return
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: VISITOR REGISTER (Minimal Check-in / Check-out Workspace)          */}
            {/* ========================================================================= */}
            {activeTab === 'visitors' && (
                <VisitorsWorkspace roleOverride={activeRole} />
            )}

            {/* ========================================================================= */}
            {/* TAB 4: MATERIAL GATE PASSES                                               */}
            {/* ========================================================================= */}
            {activeTab === 'material-passes' && (
                <div className='space-y-4'>
                    <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <div>
                                <h3 className='text-sm font-bold text-slate-900'>Equipment &amp; Goods Movement Registers</h3>
                                <p className='text-xs text-slate-500'>Separate workflow for institutional stores, repairs, and vendor consignments.</p>
                            </div>
                        </div>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500'>
                                        <th className='py-3 px-4'>Pass ID</th>
                                        <th className='py-3 px-4'>Type</th>
                                        <th className='py-3 px-4'>Requester &amp; Dept</th>
                                        <th className='py-3 px-4'>Destination &amp; Purpose</th>
                                        <th className='py-3 px-4'>Items</th>
                                        <th className='py-3 px-4 text-center'>Status</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {passes.map((p) => (
                                        <tr key={p.id} className='hover:bg-slate-50/70'>
                                            <td className='py-3 px-4 font-mono font-bold'>{p.id}</td>
                                            <td className='py-3 px-4 font-semibold'>{p.materialType}</td>
                                            <td className='py-3 px-4'>
                                                <div className='font-semibold'>{p.requesterName}</div>
                                                <div className='text-[10px] text-slate-400'>{p.department}</div>
                                            </td>
                                            <td className='py-3 px-4 max-w-xs truncate' title={p.purpose}>{p.destination}</td>
                                            <td className='py-3 px-4'>{p.items?.length || 0} item(s)</td>
                                            <td className='py-3 px-4 text-center'>
                                                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                                                    p.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: PERIMETER LIVE GATE TERMINAL                                       */}
            {/* ========================================================================= */}
            {activeTab === 'live-gate' && (
                <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4'>
                    <h3 className='text-sm font-bold text-slate-900 flex items-center gap-2'>
                        <ShieldCheck size={18} className='text-blue-600' /> Live Perimeter Verification Terminal
                    </h3>
                    <p className='text-xs text-slate-500'>
                        Gatekeeper terminal for scanning QR codes and confirming actual campus departure and re-entry.
                    </p>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-2'>
                            <div className='font-bold text-slate-900'>Student Passes Clearance</div>
                            <p className='text-slate-600'>Switch to the <strong>Student Gate Passes</strong> tab to record physical exit or return verification.</p>
                            <button
                                type='button'
                                onClick={() => setActiveTab('student-passes')}
                                className='rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer'
                            >
                                Open Student Passes Queue →
                            </button>
                        </div>
                        <div className='rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-2'>
                            <div className='font-bold text-slate-900'>Visitor Check-out Terminal</div>
                            <p className='text-slate-600'>Switch to the <strong>Visitor Register</strong> tab to verify visitor identity badges and stamp exit timestamps.</p>
                            <button
                                type='button'
                                onClick={() => setActiveTab('visitors')}
                                className='rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer'
                            >
                                Open Visitor Register →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: RETURNABLE TRACKER                                                 */}
            {/* ========================================================================= */}
            {activeTab === 'returnable-tracker' && (
                <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4'>
                    <h3 className='text-sm font-bold text-slate-900 flex items-center gap-2'>
                        <Clock size={18} className='text-indigo-600' /> Returnable Item Custodial Tracker
                    </h3>
                    <p className='text-xs text-slate-500'>
                        Tracks equipment, lab assets, and returnable items taken off-campus with overdue return alerts.
                    </p>
                    <div className='space-y-3'>
                        {passes.filter((p) => p.materialType === 'Returnable').map((p) => (
                            <div key={p.id} className={`rounded-xl border p-3 flex items-center justify-between text-xs ${
                                p.status === 'Overdue' ? 'border-rose-200 bg-rose-50/40' : 'border-slate-100 bg-slate-50/50'
                            }`}>
                                <div>
                                    <div className='font-bold text-slate-900'>{p.id} — {p.purpose}</div>
                                    <div className='text-slate-600'>{p.department} • Responsible: {p.responsiblePerson}</div>
                                    <div className='text-[10px] text-slate-500'>Exp Return: <span className='font-bold'>{p.expectedReturnDate}</span></div>
                                </div>
                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                    p.status === 'Overdue' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-800'
                                }`}>
                                    {p.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 7: MOVEMENT AUDIT LOGS                                                */}
            {/* ========================================================================= */}
            {activeTab === 'audit-logs' && (
                <div className='rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden'>
                    <div className='p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between'>
                        <h3 className='text-xs font-bold uppercase tracking-wider text-slate-700'>
                            Immutable Perimeter Security &amp; Gate Movement Logs
                        </h3>
                        <span className='text-xs text-slate-500'>Total Events: {auditLogs.length}</span>
                    </div>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-left text-xs'>
                            <thead>
                                <tr className='border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500'>
                                    <th className='py-3 px-4'>Timestamp</th>
                                    <th className='py-3 px-4'>Action</th>
                                    <th className='py-3 px-4'>Entity ID</th>
                                    <th className='py-3 px-4'>Performed By</th>
                                    <th className='py-3 px-4'>Remarks</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100 text-slate-700'>
                                {auditLogs.map((log) => (
                                    <tr key={log.id} className='hover:bg-slate-50/70'>
                                        <td className='py-3 px-4 font-mono text-[11px] text-slate-500'>{log.timestamp}</td>
                                        <td className='py-3 px-4 font-mono font-bold'>{log.action}</td>
                                        <td className='py-3 px-4 font-mono text-blue-700'>{log.entityId}</td>
                                        <td className='py-3 px-4 font-medium'>{log.actorName} ({log.actorRole})</td>
                                        <td className='py-3 px-4 max-w-sm truncate' title={log.remarks}>{log.remarks}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 1: MINIMAL VISITOR CHECK-IN FORM (Section 3 requirement)           */}
            {/* ========================================================================= */}
            {isVisitorModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <div>
                                <h3 className='text-base font-bold text-slate-900'>Front Office Visitor Check-in</h3>
                                <p className='text-[11px] text-slate-500'>Issue official campus security pass &amp; badge</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setIsVisitorModalOpen(false)}
                                className='text-slate-400 hover:text-slate-600 cursor-pointer'
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleVisitorCheckinSubmit} className='space-y-3.5 text-xs'>
                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>
                                    Visitor Full Name <span className='text-rose-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    value={visitorFormData.visitorName}
                                    onChange={(e) => setVisitorFormData({ ...visitorFormData, visitorName: e.target.value })}
                                    placeholder='e.g. Rajesh Kumar'
                                    className='w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none'
                                    required
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>
                                        Phone Number <span className='text-rose-500'>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        value={visitorFormData.phone}
                                        onChange={(e) => setVisitorFormData({ ...visitorFormData, phone: e.target.value })}
                                        placeholder='+91 98401 XXXXX'
                                        className='w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>
                                        Organization / Company
                                    </label>
                                    <input
                                        type='text'
                                        value={visitorFormData.visitorOrganization}
                                        onChange={(e) => setVisitorFormData({ ...visitorFormData, visitorOrganization: e.target.value })}
                                        placeholder='Optional'
                                        className='w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none'
                                    />
                                </div>
                            </div>

                            {/* Person to Meet (Searchable Dropdown) & Auto-Populated Department */}
                            <div className='grid grid-cols-1 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>
                                        Person to Meet (Staff Directory) <span className='text-rose-500'>*</span>
                                    </label>
                                    <select
                                        value={visitorFormData.personToMeet}
                                        onChange={handlePersonToMeetChange}
                                        className='w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none bg-white font-medium'
                                        required
                                    >
                                        {staffDirectory.map((emp) => (
                                            <option key={emp.id} value={emp.name}>
                                                {emp.name} — {emp.department} ({emp.designation})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>
                                        Department (Auto-populated from Staff Profile)
                                    </label>
                                    <input
                                        type='text'
                                        value={visitorFormData.department}
                                        readOnly
                                        className='w-full rounded-xl border border-slate-200 p-2.5 bg-slate-100 text-slate-600 cursor-not-allowed select-none font-medium'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>
                                    Purpose of Visit <span className='text-rose-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    value={visitorFormData.purpose}
                                    onChange={(e) => setVisitorFormData({ ...visitorFormData, purpose: e.target.value })}
                                    placeholder='e.g. Admission inquiry, vendor demo, textbook consultation...'
                                    className='w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none'
                                    required
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>ID Proof Type</label>
                                    <select
                                        value={visitorFormData.idProofType}
                                        onChange={(e) => setVisitorFormData({ ...visitorFormData, idProofType: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none bg-white'
                                    >
                                        {ID_PROOF_TYPES.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>ID Reference No.</label>
                                    <input
                                        type='text'
                                        value={visitorFormData.idProofNumber}
                                        onChange={(e) => setVisitorFormData({ ...visitorFormData, idProofNumber: e.target.value })}
                                        placeholder='Optional'
                                        className='w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none'
                                    />
                                </div>
                            </div>

                            <div className='flex items-center justify-between pt-3 border-t border-slate-100'>
                                <span className='text-[11px] text-slate-400'>
                                    Auto-generates Visitor ID, Badge &amp; QR
                                </span>
                                <div className='flex gap-2'>
                                    <button
                                        type='button'
                                        onClick={() => setIsVisitorModalOpen(false)}
                                        className='rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer'
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type='submit'
                                        className='rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs cursor-pointer'
                                    >
                                        Complete Check-in
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: PRINTABLE VISITOR BADGE MODAL (Section 3 requirement)            */}
            {/* ========================================================================= */}
            {selectedBadgeVisitor && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150'>
                        <div className='flex items-center justify-between bg-blue-900 px-4 py-3 text-white'>
                            <span className='text-xs font-bold uppercase tracking-wider'>Official Campus Visitor Pass</span>
                            <button
                                type='button'
                                onClick={() => setSelectedBadgeVisitor(null)}
                                className='rounded-lg p-1 text-slate-300 hover:text-white cursor-pointer'
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className='p-5 space-y-4 text-center bg-white'>
                            <div className='border-b border-slate-100 pb-3'>
                                <h3 className='text-base font-extrabold text-slate-900'>{CAMPUS_NAME}</h3>
                                <p className='text-[10px] uppercase font-bold text-blue-700 tracking-wider mt-0.5'>Official Visitor Pass</p>
                                <div className='inline-block mt-2 rounded bg-blue-50 border border-blue-200 px-3 py-1 font-mono text-sm font-bold text-blue-900'>
                                    {selectedBadgeVisitor.badgeNumber}
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
                                <span className='font-mono text-[9px] text-slate-400 mt-1'>
                                    VISITOR ID: {selectedBadgeVisitor.id}
                                </span>
                            </div>

                            <div className='space-y-1.5 text-xs text-left bg-slate-50 p-3 rounded-xl border border-slate-100'>
                                <div><span className='text-slate-400'>Visitor:</span> <span className='font-bold text-slate-900'>{selectedBadgeVisitor.visitorName}</span></div>
                                <div><span className='text-slate-400'>Person to Meet:</span> <span className='font-bold text-slate-900'>{selectedBadgeVisitor.personToMeet}</span></div>
                                <div><span className='text-slate-400'>Department:</span> <span className='font-semibold text-slate-800'>{selectedBadgeVisitor.department}</span></div>
                                <div><span className='text-slate-400'>Check-in Time:</span> <span className='font-mono font-bold text-slate-900'>{selectedBadgeVisitor.entryDate} {selectedBadgeVisitor.entryTime}</span></div>
                                <div><span className='text-slate-400'>Purpose:</span> <span className='text-slate-700'>{selectedBadgeVisitor.purpose}</span></div>
                            </div>
                        </div>

                        <div className='flex items-center justify-end gap-2 bg-slate-50 px-4 py-3 border-t border-slate-100'>
                            <button
                                type='button'
                                onClick={() => setSelectedBadgeVisitor(null)}
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

            {/* ========================================================================= */}
            {/* MODAL 3: STUDENT GATE PASS PREVIEW                                        */}
            {/* ========================================================================= */}
            {selectedStudentPassForView && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden'>
                        <div className='flex items-center justify-between bg-slate-900 px-5 py-3.5 text-white'>
                            <span className='text-xs font-bold uppercase tracking-wider'>Student Gate Pass</span>
                            <button
                                type='button'
                                onClick={() => setSelectedStudentPassForView(null)}
                                className='rounded-lg p-1 text-slate-300 hover:text-white cursor-pointer'
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className='p-5 space-y-3 text-xs bg-white'>
                            <div className='flex items-center justify-between border-b border-slate-100 pb-2'>
                                <div>
                                    <div className='text-sm font-bold text-slate-900'>{selectedStudentPassForView.studentName}</div>
                                    <div className='text-slate-500 font-mono'>{selectedStudentPassForView.studentId} • {selectedStudentPassForView.classSection}</div>
                                </div>
                                <span className='font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200'>
                                    {selectedStudentPassForView.gatePassId || selectedStudentPassForView.id}
                                </span>
                            </div>
                            <div><span className='text-slate-400'>Reason:</span> <span className='font-semibold text-slate-800'>{selectedStudentPassForView.reason}</span></div>
                            <div><span className='text-slate-400'>Accompanying Escort:</span> <span className='font-semibold text-slate-800'>{selectedStudentPassForView.accompanyingPerson || 'Parent'}</span></div>
                            <div><span className='text-slate-400'>Scheduled Movement:</span> <span className='font-mono font-bold'>{formatOutTimeForDisplay(selectedStudentPassForView.expectedDepartureTime || selectedStudentPassForView.outTime)} → {formatOutTimeForDisplay(selectedStudentPassForView.expectedReturnTime)}</span></div>
                            <div><span className='text-slate-400'>Approval:</span> <span className='text-emerald-700 font-medium'>{selectedStudentPassForView.approvedBy ? `${selectedStudentPassForView.approvedBy.name} (${selectedStudentPassForView.approvedBy.roleLabel})` : 'Pending Sanction'}</span></div>
                        </div>
                        <div className='flex items-center justify-end gap-2 bg-slate-50 px-4 py-3 border-t border-slate-100'>
                            <button
                                type='button'
                                onClick={() => setSelectedStudentPassForView(null)}
                                className='rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer'
                            >
                                Close
                            </button>
                            <button
                                type='button'
                                onClick={() => window.print()}
                                className='inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer'
                            >
                                <Printer size={13} /> Print Pass
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
