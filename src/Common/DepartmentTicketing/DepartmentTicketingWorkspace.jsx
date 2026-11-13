import React, { useState, useMemo, useEffect } from 'react'
import {
    LifeBuoy,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Plus,
    Search,
    Filter,
    Download,
    Eye,
    ChevronRight,
    Building2,
    UserCheck,
    BarChart3,
    Layers,
    Star,
    MessageSquare,
    Check,
    X,
    Send,
    User,
    ArrowUpRight,
    Briefcase,
    ShieldAlert,
    HelpCircle,
    Calendar,
    Sparkles
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'
import {
    DEPARTMENT_CONFIGS,
    getDepartmentTickets,
    raiseDepartmentTicket,
    assignTicketToStaff,
    updateTicketProgress,
    confirmTicketClosure
} from './departmentTicketingData'
import { ENTERPRISE_EMPLOYEES } from '../AttendanceAndLeave/attendanceLeaveData'

export default function DepartmentTicketingWorkspace({ defaultTab = 'overview', roleOverride = null }) {
    const { role: authRole, email: authEmail, name: authName } = useAuth()
    const activeRole = roleOverride || authRole || 'employee'
    const roleLabel = getProfileLabel(activeRole)

    // Match role to relevant department
    const userDepartment = useMemo(() => {
        if (activeRole.includes('it-support')) return 'IT Support'
        if (activeRole.includes('housekeeping')) return 'Housekeeping'
        if (activeRole.includes('maintenance')) return 'Maintenance & Electrical'
        if (activeRole.includes('transport')) return 'Transport'
        if (activeRole.includes('store') || activeRole.includes('stationery')) return 'Stores & Procurement'
        if (activeRole.includes('account')) return 'Accounts'
        if (activeRole.includes('security') || activeRole.includes('gatekeeper')) return 'Security'
        if (activeRole.includes('teacher') || activeRole.includes('coordinator') || activeRole.includes('principal')) return 'Academic'
        if (activeRole.includes('hr')) return 'HR & Admin'
        if (activeRole.includes('librarian')) return 'Library'
        return 'Academic'
    }, [activeRole])

    const isHOD = [
        'it-support-manager',
        'itsupportmanager',
        'transport-manager',
        'transportmanager',
        'stationery-store-manager',
        'stationerystoremanager',
        'gatekeeper-manager',
        'gatekeepermanager',
        'housekeeping-manager',
        'housekeepingmanager',
        'maintenance-manager',
        'maintenancemanager',
        'account-head',
        'accounthead',
        'hr',
        'coordinator',
        'director',
        'principal',
        'super-admin',
        'superadmin',
        'admin'
    ].includes(String(activeRole || '').toLowerCase())

    // State
    const [activeTab, setActiveTab] = useState(defaultTab)
    const [actionMessage, setActionMessage] = useState('')
    const [refreshKey, setRefreshKey] = useState(0)

    const notify = (msg) => {
        setActionMessage(msg)
        setTimeout(() => setActionMessage(''), 4000)
    }

    // Queries
    const allTickets = useMemo(() => {
        void refreshKey
        return getDepartmentTickets()
    }, [refreshKey])

    // Tabs
    const availableTabs = useMemo(() => {
        const tabs = [
            { id: 'overview', label: 'Helpdesk Overview', icon: BarChart3 },
            { id: 'my-tickets', label: 'My Submitted Tickets', icon: MessageSquare }
        ]

        tabs.push({ id: 'department-queue', label: `${userDepartment} Queue`, icon: LifeBuoy })
        tabs.push({ id: 'assigned-to-me', label: 'Assigned to Me', icon: UserCheck })
        tabs.push({ id: 'sla-analytics', label: 'SLA & Performance', icon: Layers })

        return tabs
    }, [userDepartment])

    useEffect(() => {
        if (defaultTab && availableTabs.some((t) => t.id === defaultTab)) {
            setActiveTab(defaultTab)
        }
    }, [defaultTab, availableTabs])

    // KPIs
    const kpis = useMemo(() => {
        const total = allTickets.length
        const open = allTickets.filter((t) => ['Open', 'In-Progress'].includes(t.status)).length
        const breached = allTickets.filter((t) => t.isSlaBreached).length
        const awaitingConfirm = allTickets.filter((t) => t.status === 'Resolved (Awaiting Confirmation)').length
        const closed = allTickets.filter((t) => t.status === 'Closed').length

        // Average CSAT
        const ratedTickets = allTickets.filter((t) => t.requesterRating > 0)
        const avgRating = ratedTickets.length > 0
            ? (ratedTickets.reduce((acc, t) => acc + t.requesterRating, 0) / ratedTickets.length).toFixed(1)
            : '5.0'

        return {
            total,
            open,
            breached,
            awaitingConfirm,
            closed,
            avgRating
        }
    }, [allTickets])

    // ==========================================
    // MODAL STATES
    // ==========================================
    const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false)
    const [ticketFormData, setTicketFormData] = useState({
        targetDepartment: 'IT Support',
        category: 'Projector / Audio-Visual Fault',
        title: '',
        description: '',
        priority: 'High',
        location: 'Room 304, Secondary Wing',
        selectedMembers: []
    })

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [selectedTicketForAssign, setSelectedTicketForAssign] = useState(null)
    const [assignFormData, setAssignFormData] = useState({
        assignedStaffName: 'Vikram Joshi (Senior Tech)',
        assignedStaffId: 'EMP-IT-002',
        internalNotes: 'Assigned with priority dispatch.'
    })

    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
    const [selectedTicketForResolve, setSelectedTicketForResolve] = useState(null)
    const [resolveFormData, setResolveFormData] = useState({
        status: 'Resolved (Awaiting Confirmation)',
        resolutionRemarks: 'Component diagnosed, cable harness replaced, tested functional.'
    })

    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
    const [selectedTicketForFeedback, setSelectedTicketForFeedback] = useState(null)
    const [feedbackFormData, setFeedbackFormData] = useState({
        rating: 5,
        feedback: 'Prompt and courteous resolution!'
    })

    // Filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [deptFilter, setDeptFilter] = useState('ALL')
    const [priorityFilter, setPriorityFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')

    const filteredTickets = useMemo(() => {
        return allTickets.filter((t) => {
            if (deptFilter !== 'ALL' && t.targetDepartment !== deptFilter) return false
            if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false
            if (statusFilter !== 'ALL' && t.status !== statusFilter) return false

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim()
                const match = `${t.ticketNumber} ${t.title} ${t.targetDepartment} ${t.raisedByName} ${t.location}`.toLowerCase()
                if (!match.includes(q)) return false
            }
            return true
        })
    }, [allTickets, deptFilter, priorityFilter, statusFilter, searchQuery])

    // Department Queue specific
    const departmentQueue = useMemo(() => {
        return allTickets.filter((t) => t.targetDepartment.toLowerCase().includes(userDepartment.toLowerCase()) || isHOD)
    }, [allTickets, userDepartment, isHOD])

    // ==========================================
    // ACTION HANDLERS
    // ==========================================
    const handleRaiseTicketSubmit = (e) => {
        e.preventDefault()
        try {
            const result = raiseDepartmentTicket({
                raisedByEmployeeId: 'EMP-SEC-012',
                raisedByName: authName || 'Sunita Verma',
                raisedByDepartment: 'Academic - Secondary',
                raisedByRole: activeRole,
                targetDepartment: ticketFormData.targetDepartment,
                category: ticketFormData.category,
                priority: ticketFormData.priority,
                title: ticketFormData.title,
                description: ticketFormData.description,
                location: ticketFormData.location
            })
            notify(`Ticket ${result.ticketNumber} raised successfully! Routed to ${result.targetDepartment}.`)
            setIsRaiseModalOpen(false)
            setTicketFormData({
                targetDepartment: 'IT Support',
                category: 'Projector / Audio-Visual Fault',
                title: '',
                description: '',
                priority: 'High',
                location: 'Room 304, Secondary Wing'
            })
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleAssignSubmit = (e) => {
        e.preventDefault()
        if (!selectedTicketForAssign) return
        try {
            assignTicketToStaff({
                ticketNumber: selectedTicketForAssign.ticketNumber,
                assignedStaffId: assignFormData.assignedStaffId,
                assignedStaffName: assignFormData.assignedStaffName,
                assignedByStaffName: authName || 'HOD / Manager',
                notes: assignFormData.internalNotes
            })
            notify(`Ticket ${selectedTicketForAssign.ticketNumber} assigned to ${assignFormData.assignedStaffName}!`)
            setIsAssignModalOpen(false)
            setSelectedTicketForAssign(null)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleResolveSubmit = (e) => {
        e.preventDefault()
        if (!selectedTicketForResolve) return
        try {
            updateTicketProgress({
                ticketNumber: selectedTicketForResolve.ticketNumber,
                status: resolveFormData.status,
                updatedByName: authName || 'Technician',
                resolutionRemarks: resolveFormData.resolutionRemarks
            })
            notify(`Ticket ${selectedTicketForResolve.ticketNumber} resolved! Requester closure confirmation requested.`)
            setIsResolveModalOpen(false)
            setSelectedTicketForResolve(null)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleFeedbackSubmit = (e) => {
        e.preventDefault()
        if (!selectedTicketForFeedback) return
        try {
            confirmTicketClosure({
                ticketNumber: selectedTicketForFeedback.ticketNumber,
                requesterRating: feedbackFormData.rating,
                requesterFeedback: feedbackFormData.feedback,
                requesterName: authName || selectedTicketForFeedback.raisedByName
            })
            notify(`Ticket ${selectedTicketForFeedback.ticketNumber} closed with ${feedbackFormData.rating}★ rating!`)
            setIsFeedbackModalOpen(false)
            setSelectedTicketForFeedback(null)
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

            {/* Header: Title, Role Badge, Primary Action */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs'>
                        <LifeBuoy size={22} />
                    </div>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                                Department Ticketing & Service Desk
                            </h1>
                            <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100'>
                                {roleLabel} • {userDepartment}
                            </span>
                        </div>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            Inter-department service desk: dynamic ticket routing across 11 departments, automated SLA countdowns, and 5-star closure verification.
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-2.5'>
                    <button
                        onClick={() => setIsRaiseModalOpen(true)}
                        className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition'
                    >
                        <Plus size={14} /> Raise Department Ticket
                    </button>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className='border-b border-slate-200/80 pb-px'>
                <div className='flex items-center gap-2 overflow-x-auto scrollbar-none'>
                    {availableTabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition whitespace-nowrap ${
                                    isActive
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                <span>{tab.label}</span>
                                {tab.id === 'department-queue' && kpis.open > 0 && (
                                    <span className='rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.2'>
                                        {departmentQueue.filter((t) => t.status !== 'Closed').length}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: OVERVIEW                                                           */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (
                <div className='space-y-6'>
                    {/* KPI Cards */}
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5'>
                        <div className='rounded-[1.25rem] border border-blue-100 bg-[#E8F1FD]/60 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Total Helpdesk Tickets</span>
                                <LifeBuoy size={16} className='text-blue-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-slate-900'>{kpis.total}</span>
                                <span className='text-[11px] font-medium text-blue-700'>Across All 11 Depts</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-amber-100 bg-amber-50/50 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Active / In-Progress</span>
                                <Clock size={16} className='text-amber-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-amber-700'>{kpis.open}</span>
                                <span className='text-[11px] font-medium text-amber-800'>Being Serviced</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-rose-100 bg-rose-50/50 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>SLA Breached</span>
                                <AlertTriangle size={16} className='text-rose-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-rose-600'>{kpis.breached}</span>
                                <span className='text-[11px] font-medium text-rose-700'>Escalation Triggered</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-indigo-100 bg-indigo-50/50 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Awaiting Requester Sign-off</span>
                                <UserCheck size={16} className='text-indigo-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-indigo-700'>{kpis.awaitingConfirm}</span>
                                <span className='text-[11px] font-medium text-indigo-800'>Feedback Due</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-emerald-100 bg-emerald-50/50 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Avg Requester Rating</span>
                                <Star size={16} className='text-amber-500 fill-amber-400' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-emerald-700'>{kpis.avgRating} ★</span>
                                <span className='text-[11px] font-medium text-emerald-800'>{kpis.closed} Closed</span>
                            </div>
                        </div>
                    </div>

                    {/* Department Directory Routing Cards */}
                    <div className='space-y-3'>
                        <h3 className='text-sm font-semibold text-slate-900'>11 Integrated Department Helpdesks & Standard SLAs</h3>
                        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'>
                            {DEPARTMENT_CONFIGS.slice(0, 6).map((dept) => {
                                const deptTickets = allTickets.filter((t) => t.targetDepartment === dept.name)
                                const openCount = deptTickets.filter((t) => t.status !== 'Closed').length
                                return (
                                    <div
                                        key={dept.id}
                                        onClick={() => {
                                            setTicketFormData((prev) => ({ ...prev, targetDepartment: dept.name, category: dept.categories[0] }))
                                            setIsRaiseModalOpen(true)
                                        }}
                                        className='rounded-xl border border-slate-200/80 bg-white p-3 hover:border-blue-400 hover:shadow-xs cursor-pointer transition text-xs space-y-1'
                                    >
                                        <div className='font-bold text-slate-900 truncate'>{dept.name}</div>
                                        <div className='text-slate-500 text-[11px]'>Head: {dept.headOfDepartment}</div>
                                        <div className='flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]'>
                                            <span className='text-blue-600 font-bold'>SLA: {dept.slaHours}h</span>
                                            <span className='font-semibold text-slate-600'>{openCount} active</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Active Queue Snapshot Table */}
                    <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                        <div className='flex items-center justify-between mb-4 border-b border-slate-100 pb-3'>
                            <div>
                                <h3 className='text-sm font-semibold text-slate-900'>Live Service Desk Operations Queue</h3>
                                <p className='text-xs text-slate-500'>Prioritized operational tasks with dynamic SLA countdown timers</p>
                            </div>
                            <button
                                onClick={() => setActiveTab('department-queue')}
                                className='text-xs font-semibold text-blue-600 hover:text-blue-700'
                            >
                                View My Department Queue →
                            </button>
                        </div>

                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-2.5 px-3'>Ticket #</th>
                                        <th className='py-2.5 px-3'>Subject & Location</th>
                                        <th className='py-2.5 px-3'>Target Dept</th>
                                        <th className='py-2.5 px-3'>Priority</th>
                                        <th className='py-2.5 px-3'>Assigned Tech</th>
                                        <th className='py-2.5 px-3'>SLA Target</th>
                                        <th className='py-2.5 px-3 text-center'>Status</th>
                                        <th className='py-2.5 px-3 text-right'>Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {allTickets.slice(0, 6).map((t) => (
                                        <tr key={t.ticketNumber} className='hover:bg-slate-50/70'>
                                            <td className='py-2.5 px-3 font-mono font-bold text-slate-900'>{t.ticketNumber}</td>
                                            <td className='py-2.5 px-3'>
                                                <div className='font-semibold text-slate-900'>{t.title}</div>
                                                <div className='text-[11px] text-slate-400'>{t.location} • By {t.raisedByName}</div>
                                            </td>
                                            <td className='py-2.5 px-3 font-medium text-slate-800'>{t.targetDepartment}</td>
                                            <td className='py-2.5 px-3'>
                                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                                    t.priority === 'Critical'
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : t.priority === 'High'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {t.priority}
                                                </span>
                                            </td>
                                            <td className='py-2.5 px-3 text-slate-600'>{t.assignedStaffName || 'Unassigned'}</td>
                                            <td className='py-2.5 px-3'>
                                                <span className={`font-mono text-[11px] font-semibold ${
                                                    t.isSlaBreached ? 'text-rose-600 font-bold' : 'text-slate-600'
                                                }`}>
                                                    {t.slaHours}h target
                                                </span>
                                            </td>
                                            <td className='py-2.5 px-3 text-center'>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                    t.status === 'Closed'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : t.status === 'Resolved (Awaiting Confirmation)'
                                                        ? 'bg-indigo-50 text-indigo-700'
                                                        : t.status === 'In-Progress'
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className='py-2.5 px-3 text-right'>
                                                <div className='flex items-center justify-end gap-1'>
                                                    {t.status === 'Open' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTicketForAssign(t)
                                                                setIsAssignModalOpen(true)
                                                            }}
                                                            className='rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100'
                                                        >
                                                            Assign
                                                        </button>
                                                    )}
                                                    {t.status === 'In-Progress' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTicketForResolve(t)
                                                                setIsResolveModalOpen(true)
                                                            }}
                                                            className='rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700'
                                                        >
                                                            Resolve
                                                        </button>
                                                    )}
                                                    {t.status === 'Resolved (Awaiting Confirmation)' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTicketForFeedback(t)
                                                                setIsFeedbackModalOpen(true)
                                                            }}
                                                            className='rounded-lg bg-amber-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-600'
                                                        >
                                                            Rate & Close ★
                                                        </button>
                                                    )}
                                                </div>
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
            {/* TAB 2: MY SUBMITTED TICKETS                                               */}
            {/* ========================================================================= */}
            {activeTab === 'my-tickets' && (
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h2 className='text-sm font-semibold text-slate-900'>My Department Service Requests</h2>
                            <p className='text-xs text-slate-500'>
                                Track status, view technician notes, and confirm ticket resolutions.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsRaiseModalOpen(true)}
                            className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700'
                        >
                            <Plus size={14} /> Raise Ticket
                        </button>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {allTickets.map((t) => (
                            <div key={t.ticketNumber} className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3'>
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <span className='font-mono text-xs font-bold text-slate-900'>{t.ticketNumber}</span>
                                        <h4 className='text-sm font-bold text-slate-900'>{t.title}</h4>
                                        <p className='text-xs text-slate-500'>Target: <b>{t.targetDepartment}</b> • Category: {t.category}</p>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                        t.status === 'Closed'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : t.status === 'Resolved (Awaiting Confirmation)'
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'bg-amber-50 text-amber-700'
                                    }`}>
                                        {t.status}
                                    </span>
                                </div>

                                <div className='rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs space-y-1.5'>
                                    <div><b>Location:</b> {t.location}</div>
                                    <div><b>Description:</b> {t.description}</div>
                                    <div><b>Assigned Staff:</b> {t.assignedStaffName || 'Pending Assignment'}</div>
                                    {t.resolutionRemarks && (
                                        <div className='pt-1 text-emerald-800 font-medium'>
                                            <b>Resolution:</b> {t.resolutionRemarks}
                                        </div>
                                    )}
                                    {t.requesterRating > 0 && (
                                        <div className='flex items-center gap-1 text-amber-600 font-bold pt-1'>
                                            <span>Rating:</span>
                                            {'★'.repeat(t.requesterRating)}
                                            <span className='text-slate-500 font-normal'>- "{t.requesterFeedback}"</span>
                                        </div>
                                    )}
                                </div>

                                <div className='flex items-center justify-end pt-1'>
                                    {t.status === 'Resolved (Awaiting Confirmation)' && (
                                        <button
                                            onClick={() => {
                                                setSelectedTicketForFeedback(t)
                                                setIsFeedbackModalOpen(true)
                                            }}
                                            className='rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-600'
                                        >
                                            Confirm Resolution & Rate ★
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: DEPARTMENT QUEUE                                                   */}
            {/* ========================================================================= */}
            {activeTab === 'department-queue' && (
                <div className='space-y-4'>
                    <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
                        <div>
                            <h3 className='text-sm font-semibold text-slate-900'>{userDepartment} Incoming Service Queue</h3>
                            <p className='text-xs text-slate-500'>Service tickets dispatched by teachers, admin, and staff</p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className='rounded-xl border border-slate-200 px-3 py-1.5 text-xs'
                            >
                                <option value='ALL'>All Priorities</option>
                                <option value='Critical'>Critical</option>
                                <option value='High'>High</option>
                                <option value='Medium'>Medium</option>
                            </select>
                        </div>
                    </div>

                    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3 px-4'>Ticket Number</th>
                                        <th className='py-3 px-4'>Requester & Dept</th>
                                        <th className='py-3 px-4'>Issue Description</th>
                                        <th className='py-3 px-4'>Location</th>
                                        <th className='py-3 px-4'>Priority</th>
                                        <th className='py-3 px-4'>Assigned Technician</th>
                                        <th className='py-3 px-4 text-center'>Status</th>
                                        <th className='py-3 px-4 text-right'>Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {departmentQueue.map((t) => (
                                        <tr key={t.ticketNumber} className='hover:bg-slate-50/70'>
                                            <td className='py-3 px-4 font-mono font-bold text-slate-900'>{t.ticketNumber}</td>
                                            <td className='py-3 px-4'>
                                                <div className='font-semibold text-slate-900'>{t.raisedByName}</div>
                                                <div className='text-[11px] text-slate-400'>{t.raisedByDepartment}</div>
                                            </td>
                                            <td className='py-3 px-4'>
                                                <div className='font-semibold text-slate-900'>{t.title}</div>
                                                <div className='text-[11px] text-slate-500'>{t.description}</div>
                                            </td>
                                            <td className='py-3 px-4 text-slate-600'>{t.location}</td>
                                            <td className='py-3 px-4'>
                                                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                                    t.priority === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {t.priority}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4 font-medium text-slate-900'>{t.assignedStaffName || 'Unassigned'}</td>
                                            <td className='py-3 px-4 text-center'>
                                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                    t.status === 'Closed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4 text-right'>
                                                <div className='flex items-center justify-end gap-1.5'>
                                                    {t.status === 'Open' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTicketForAssign(t)
                                                                setIsAssignModalOpen(true)
                                                            }}
                                                            className='rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700'
                                                        >
                                                            Assign Staff
                                                        </button>
                                                    )}
                                                    {t.status === 'In-Progress' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTicketForResolve(t)
                                                                setIsResolveModalOpen(true)
                                                            }}
                                                            className='rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700'
                                                        >
                                                            Resolve
                                                        </button>
                                                    )}
                                                </div>
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
            {/* TAB 4: ASSIGNED TO ME                                                     */}
            {/* ========================================================================= */}
            {activeTab === 'assigned-to-me' && (
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h2 className='text-sm font-semibold text-slate-900'>My Active Work Orders</h2>
                            <p className='text-xs text-slate-500'>Tickets assigned directly to your operational roster</p>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {allTickets.filter((t) => t.assignedStaffName).map((t) => (
                            <div key={t.ticketNumber} className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3'>
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <span className='font-mono text-xs font-bold text-slate-900'>{t.ticketNumber}</span>
                                        <h4 className='text-sm font-bold text-slate-900'>{t.title}</h4>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                        t.status === 'Closed' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                                    }`}>
                                        {t.status}
                                    </span>
                                </div>

                                <div className='rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs space-y-1'>
                                    <div><b>Requester:</b> {t.raisedByName} ({t.raisedByDepartment})</div>
                                    <div><b>Location:</b> {t.location}</div>
                                    <div><b>Priority:</b> {t.priority}</div>
                                    <div><b>Issue:</b> {t.description}</div>
                                </div>

                                <div className='flex justify-end pt-1'>
                                    {t.status !== 'Closed' && (
                                        <button
                                            onClick={() => {
                                                setSelectedTicketForResolve(t)
                                                setIsResolveModalOpen(true)
                                            }}
                                            className='rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700'
                                        >
                                            Mark as Resolved
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: SLA ANALYTICS                                                      */}
            {/* ========================================================================= */}
            {activeTab === 'sla-analytics' && (
                <div className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                            <h3 className='text-sm font-semibold text-slate-900 mb-1'>Department SLA Compliance</h3>
                            <p className='text-xs text-slate-500 mb-4'>Resolution within agreed hours</p>
                            <div className='space-y-2 text-xs'>
                                {DEPARTMENT_CONFIGS.slice(0, 5).map((d) => (
                                    <div key={d.id} className='flex items-center justify-between p-2 rounded-lg bg-slate-50'>
                                        <span className='font-medium text-slate-700'>{d.name}</span>
                                        <span className='font-bold text-emerald-700'>98.2% on-time</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                            <h3 className='text-sm font-semibold text-slate-900 mb-1'>Customer Satisfaction (CSAT)</h3>
                            <p className='text-xs text-slate-500 mb-4'>Based on 5-star closure verifications</p>
                            <div className='space-y-2 text-xs'>
                                <div className='p-3 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-between'>
                                    <span className='font-bold text-amber-900'>Overall Satisfaction</span>
                                    <span className='font-bold text-lg text-amber-700'>{kpis.avgRating} / 5.0 ★</span>
                                </div>
                                <p className='text-[11px] text-slate-500 pt-1'>
                                    100% of tickets require requester sign-off rating before being marked permanently Closed in the database.
                                </p>
                            </div>
                        </div>

                        <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                            <h3 className='text-sm font-semibold text-slate-900 mb-1'>Export Helpdesk Reports</h3>
                            <p className='text-xs text-slate-500 mb-4'>Download resolution logs & metrics</p>
                            <div className='space-y-2'>
                                <button
                                    onClick={() => notify('Helpdesk SLA report exported to CSV.')}
                                    className='w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5'
                                >
                                    <Download size={14} /> Export SLA Performance (CSV)
                                </button>
                                <button
                                    onClick={() => notify('Customer Satisfaction ratings exported.')}
                                    className='w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5'
                                >
                                    <Download size={14} /> Export Feedback Register (CSV)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: RAISE TICKET                                                       */}
            {/* ========================================================================= */}
            {isRaiseModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900'>Raise Department Service Ticket</h3>
                            <button onClick={() => setIsRaiseModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleRaiseTicketSubmit} className='space-y-3 text-xs'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Target Department</label>
                                    <select
                                        value={ticketFormData.targetDepartment}
                                        onChange={(e) => setTicketFormData({ ...ticketFormData, targetDepartment: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                    >
                                        {DEPARTMENT_CONFIGS.map((d) => (
                                            <option key={d.id} value={d.name}>
                                                {d.name} (SLA: {d.slaHours}h)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Priority Level</label>
                                    <select
                                        value={ticketFormData.priority}
                                        onChange={(e) => setTicketFormData({ ...ticketFormData, priority: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2'
                                    >
                                        <option value='Low'>Low Priority</option>
                                        <option value='Medium'>Medium Priority</option>
                                        <option value='High'>High Priority</option>
                                        <option value='Critical'>Critical (Urgent Classroom/Facility Impact)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Specific Campus Location / Room</label>
                                <input
                                    type='text'
                                    placeholder='e.g., Room 302, Senior Wing, Block B'
                                    value={ticketFormData.location}
                                    onChange={(e) => setTicketFormData({ ...ticketFormData, location: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                    required
                                />
                            </div>

                            {/* Multi-Member Selection */}
                            <div>
                                <label className='font-semibold text-slate-700 mb-1 flex items-center justify-between'>
                                    <span>Select Affected / Involved Members</span>
                                    <span className='text-[10px] text-slate-400 font-normal'>Multi-member selection</span>
                                </label>

                                {/* Selected Member Chips */}
                                {ticketFormData.selectedMembers?.length > 0 && (
                                    <div className='flex flex-wrap gap-1.5 mb-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80'>
                                        {ticketFormData.selectedMembers.map((member) => (
                                            <span
                                                key={member}
                                                className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100'
                                            >
                                                <User size={12} />
                                                <span>{member}</span>
                                                <button
                                                    type='button'
                                                    onClick={() =>
                                                        setTicketFormData({
                                                            ...ticketFormData,
                                                            selectedMembers: ticketFormData.selectedMembers.filter((m) => m !== member)
                                                        })
                                                    }
                                                    className='hover:text-indigo-900 transition'
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Member Dropdown Picker */}
                                <div className='flex gap-2'>
                                    <select
                                        onChange={(e) => {
                                            const val = e.target.value
                                            if (val && !ticketFormData.selectedMembers?.includes(val)) {
                                                setTicketFormData({
                                                    ...ticketFormData,
                                                    selectedMembers: [...(ticketFormData.selectedMembers || []), val]
                                                })
                                            }
                                            e.target.value = ''
                                        }}
                                        defaultValue=''
                                        className='w-full rounded-xl border border-slate-200 p-2 text-slate-700 font-medium'
                                    >
                                        <option value='' disabled>+ Add staff or team member...</option>
                                        {ENTERPRISE_EMPLOYEES.map((emp) => (
                                            <option
                                                key={emp.id}
                                                value={`${emp.name} (${emp.designation})`}
                                                disabled={ticketFormData.selectedMembers?.includes(`${emp.name} (${emp.designation})`)}
                                            >
                                                {emp.name} — {emp.designation} [{emp.department}]
                                            </option>
                                        ))}
                                    </select>
                                    {ticketFormData.selectedMembers?.length > 0 && (
                                        <button
                                            type='button'
                                            onClick={() => setTicketFormData({ ...ticketFormData, selectedMembers: [] })}
                                            className='shrink-0 px-2.5 py-1 text-slate-500 hover:text-slate-800 text-[11px] font-semibold'
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Ticket Title / Brief Subject</label>
                                <input
                                    type='text'
                                    placeholder='e.g., Projector ceiling mount HDMI signal intermittent'
                                    value={ticketFormData.title}
                                    onChange={(e) => setTicketFormData({ ...ticketFormData, title: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                    required
                                />
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Detailed Issue Description</label>
                                <textarea
                                    rows={3}
                                    placeholder='Describe symptoms, steps to reproduce, or urgent requirements...'
                                    value={ticketFormData.description}
                                    onChange={(e) => setTicketFormData({ ...ticketFormData, description: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                    required
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsRaiseModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700'
                                >
                                    Dispatch Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: ASSIGN TICKET                                                      */}
            {/* ========================================================================= */}
            {isAssignModalOpen && selectedTicketForAssign && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900'>Assign Staff Technician</h3>
                            <button onClick={() => setIsAssignModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAssignSubmit} className='space-y-3 text-xs'>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-100'>
                                <div className='font-mono font-bold text-slate-900'>{selectedTicketForAssign.ticketNumber}</div>
                                <div className='text-slate-800 font-semibold'>{selectedTicketForAssign.title}</div>
                                <div className='text-slate-500 text-[11px]'>{selectedTicketForAssign.location}</div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Assign Technician / Staff Member</label>
                                <input
                                    type='text'
                                    value={assignFormData.assignedStaffName}
                                    onChange={(e) => setAssignFormData({ ...assignFormData, assignedStaffName: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                    required
                                />
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Manager Dispatch Notes</label>
                                <input
                                    type='text'
                                    value={assignFormData.internalNotes}
                                    onChange={(e) => setAssignFormData({ ...assignFormData, internalNotes: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsAssignModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700'
                                >
                                    Confirm Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: RESOLVE TICKET                                                     */}
            {/* ========================================================================= */}
            {isResolveModalOpen && selectedTicketForResolve && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900'>Log Ticket Resolution</h3>
                            <button onClick={() => setIsResolveModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleResolveSubmit} className='space-y-3 text-xs'>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-100'>
                                <div className='font-mono font-bold text-slate-900'>{selectedTicketForResolve.ticketNumber}</div>
                                <div className='text-slate-800 font-semibold'>{selectedTicketForResolve.title}</div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Work Completed Remarks</label>
                                <textarea
                                    rows={3}
                                    value={resolveFormData.resolutionRemarks}
                                    onChange={(e) => setResolveFormData({ ...resolveFormData, resolutionRemarks: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                    required
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsResolveModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700'
                                >
                                    Submit Resolution
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: FEEDBACK & CLOSURE CONFIRMATION                                    */}
            {/* ========================================================================= */}
            {isFeedbackModalOpen && selectedTicketForFeedback && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900'>Requester Closure Sign-off</h3>
                            <button onClick={() => setIsFeedbackModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleFeedbackSubmit} className='space-y-4 text-xs'>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-100'>
                                <div className='font-mono font-bold text-slate-900'>{selectedTicketForFeedback.ticketNumber}</div>
                                <div className='text-slate-800 font-semibold'>{selectedTicketForFeedback.title}</div>
                                <div className='text-emerald-700 mt-1 font-medium'>
                                    <b>Resolved As:</b> {selectedTicketForFeedback.resolutionRemarks}
                                </div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Rate Resolution Quality</label>
                                <div className='flex items-center gap-2'>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type='button'
                                            onClick={() => setFeedbackFormData({ ...feedbackFormData, rating: star })}
                                            className={`text-2xl transition ${
                                                star <= feedbackFormData.rating ? 'text-amber-400' : 'text-slate-200'
                                            }`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                    <span className='font-bold text-slate-800 ml-2'>{feedbackFormData.rating} / 5 Stars</span>
                                </div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Feedback / Comments</label>
                                <textarea
                                    rows={2}
                                    value={feedbackFormData.feedback}
                                    onChange={(e) => setFeedbackFormData({ ...feedbackFormData, feedback: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsFeedbackModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700'
                                >
                                    Confirm Closure & Save Rating
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

