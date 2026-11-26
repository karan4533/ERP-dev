import React, { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
    Activity,
    Users,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Search,
    Filter,
    Download,
    Eye,
    ChevronRight,
    Building2,
    Layers,
    BarChart3,
    ArrowUpRight,
    Briefcase,
    Calendar,
    ChevronDown,
    User,
    ShieldAlert,
    ShieldCheck,
    CheckSquare,
    XCircle,
    MessageSquare,
    TrendingUp,
    RefreshCw
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'
import {
    getAllEmployeeActivities,
    getHierarchicalActivityMonitoring,
    reviewEmployeeActivity
} from './employeeActivityMonitoringData'
import { ENTERPRISE_EMPLOYEES } from '../AttendanceAndLeave/attendanceLeaveData'

export default function DepartmentActivityMonitoringWorkspace({ defaultTab = 'overview', roleOverride = null }) {
    const { role: authRole, email: authEmail, name: authName } = useAuth()
    const { tab } = useParams()
    const activeRole = roleOverride || authRole || 'director'
    const cleanRole = String(activeRole || '').trim().toLowerCase().replace(/-/g, '')
    const roleLabel = getProfileLabel(activeRole)

    // Role Capabilities & Institutional Authorization
    const AUTHORIZED_MONITORING_ROLES = [
        'superadmin',
        'admin',
        'director',
        'principal',
        'jointdirector',
        'jointdirectorassistant',
        'prm',
        'hr',
        'coordinator',
        'processauditor',
        'qualityauditor',
        'jointdirectoraudit',
        'canteenmanager',
        'transportmanager',
        'housekeepingmanager',
        'itsupportmanager',
        'stationerystoremanager',
        'accounthead'
    ]
    const isAuthorized = AUTHORIZED_MONITORING_ROLES.includes(cleanRole)

    const targetTab = tab || defaultTab
    // State
    const [activeTab, setActiveTab] = useState(targetTab)
    const [actionMessage, setActionMessage] = useState('')
    const [refreshKey, setRefreshKey] = useState(0)

    // Drill-down State: Org -> Dept -> Employee
    const [selectedDept, setSelectedDept] = useState('ALL')
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('ALL')
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [reviewFilter, setReviewFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedActivityForReview, setSelectedActivityForReview] = useState(null)
    const [reviewDecision, setReviewDecision] = useState('Approved')
    const [reviewRemarks, setReviewRemarks] = useState('')

    const notify = (msg) => {
        setActionMessage(msg)
        setTimeout(() => setActionMessage(''), 4000)
    }

    // Dynamic Hierarchical Query
    const monitoringData = useMemo(() => {
        void refreshKey
        return getHierarchicalActivityMonitoring({
            viewerRole: activeRole,
            viewerEmployeeId: 'EMP-ADM-001',
            departmentFilter: selectedDept,
            employeeFilter: selectedEmployeeId
        })
    }, [activeRole, selectedDept, selectedEmployeeId, refreshKey])

    // Tabs
    const availableTabs = useMemo(() => {
        const pendingCount = monitoringData.summary?.pendingReviewCount || 0
        return [
            { id: 'overview', label: 'Monitoring Overview', icon: BarChart3 },
            { id: 'activity-stream', label: 'Team Activity Stream', icon: Activity },
            { id: 'pending-approvals', label: 'Pending HOD Approvals', icon: ShieldCheck, badge: pendingCount },
            { id: 'hierarchical-drilldown', label: 'Hierarchical Drill-Down', icon: Layers },
            { id: 'delayed-activities', label: 'Bottlenecks & Delays', icon: AlertTriangle }
        ]
    }, [monitoringData.summary?.pendingReviewCount])

    useEffect(() => {
        const currentTarget = tab || defaultTab
        if (currentTarget && availableTabs.some((t) => t.id === currentTarget)) {
            setActiveTab(currentTarget)
        }
    }, [tab, defaultTab, availableTabs])

    const handleCommitReview = (e) => {
        e.preventDefault()
        if (!selectedActivityForReview) return
        if (reviewDecision !== 'Approved' && !reviewRemarks.trim()) {
            notify('Remarks are mandatory when requesting revision.')
            return
        }

        try {
            reviewEmployeeActivity({
                activityId: selectedActivityForReview.id,
                decision: reviewDecision,
                reviewerName: authName || roleLabel,
                reviewerRole: activeRole,
                remarks: reviewRemarks.trim() || 'Reviewed and signed off by Department Overseer.'
            })
            notify(`Activity ${selectedActivityForReview.id} marked as '${reviewDecision}' successfully.`)
            setSelectedActivityForReview(null)
            setReviewRemarks('')
            setRefreshKey((k) => k + 1)
        } catch (err) {
            notify(err.message || 'Failed to record review decision.')
        }
    }

    // Filtered Stream
    const filteredActivities = useMemo(() => {
        return (monitoringData.activities || []).filter((act) => {
            if (categoryFilter !== 'ALL' && act.category !== categoryFilter) return false
            if (statusFilter !== 'ALL' && act.status !== statusFilter) return false
            if (reviewFilter !== 'ALL' && act.reviewStatus !== reviewFilter) return false

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim()
                const match = `${act.employeeName} ${act.activityTitle} ${act.department} ${act.details}`.toLowerCase()
                if (!match.includes(q)) return false
            }
            return true
        })
    }, [monitoringData.activities, categoryFilter, statusFilter, reviewFilter, searchQuery])

    // Unique departments present in employee directory
    const availableDepartments = useMemo(() => {
        const set = new Set(ENTERPRISE_EMPLOYEES.map((e) => e.department))
        return Array.from(set).sort()
    }, [])

    // Employees in currently selected department
    const departmentEmployees = useMemo(() => {
        if (selectedDept === 'ALL') return ENTERPRISE_EMPLOYEES
        return ENTERPRISE_EMPLOYEES.filter((e) => e.department === selectedDept)
    }, [selectedDept])

    if (!isAuthorized) {
        return (
            <div className='p-6 md:p-12 min-h-[60vh] flex items-center justify-center'>
                <div className='max-w-lg w-full bg-white rounded-3xl border border-slate-200/90 p-8 text-center shadow-xl space-y-4'>
                    <div className='size-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs'>
                        <ShieldAlert size={30} />
                    </div>
                    <div>
                        <span className='inline-block text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200'>
                            Access Restricted
                        </span>
                        <h2 className='text-lg font-bold text-slate-900 mt-2'>Activity Monitoring Access Restricted</h2>
                        <p className='text-xs text-slate-500 mt-2 leading-relaxed'>
                            Department and team activity monitoring is restricted to supervisors, department heads, auditors, and executive administration. Your current user profile ({roleLabel}) does not have permission to inspect employee activity streams.
                        </p>
                    </div>
                    <div className='pt-3 border-t border-slate-100 text-[11px] text-slate-400'>
                        If you believe you require access to operational activity streams, contact your Department Head or System Administrator.
                    </div>
                </div>
            </div>
        )
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

            {/* Header: Title, Role Badge */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs'>
                        <Activity size={22} />
                    </div>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                                Hierarchical Employee Activity Monitoring
                            </h1>
                            <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100'>
                                {roleLabel} • Transparency Portal
                            </span>
                        </div>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            Upward management visibility: cross-department operational trail (tasks, helpdesk tickets, store issues, and gate movements).
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-2.5'>
                    <button
                        onClick={() => {
                            setRefreshKey((k) => k + 1)
                            notify('Activity telemetry synchronized.')
                        }}
                        className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition'
                    >
                        <RefreshCw size={14} className='text-blue-600' /> Sync Live Feed
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
                                {tab.id === 'delayed-activities' && monitoringData.summary.delayedActivities > 0 && (
                                    <span className='rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2'>
                                        {monitoringData.summary.delayedActivities} delayed
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
                                <span className='text-xs font-semibold text-slate-600'>Logged Activities</span>
                                <Activity size={16} className='text-blue-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-slate-900'>{monitoringData.summary.totalActivities}</span>
                                <span className='text-[11px] font-medium text-blue-700'>Operational Events</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-emerald-100 bg-emerald-50/50 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Completed Tasks</span>
                                <CheckCircle2 size={16} className='text-emerald-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-emerald-700'>{monitoringData.summary.completedTasks}</span>
                                <span className='text-[11px] font-medium text-emerald-800'>Verified Deliverables</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-amber-100 bg-amber-50/50 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Pending / Active Tasks</span>
                                <Clock size={16} className='text-amber-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-amber-700'>{monitoringData.summary.pendingTasks}</span>
                                <span className='text-[11px] font-medium text-amber-800'>In Execution</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-indigo-100 bg-indigo-50/50 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Tickets Closed</span>
                                <CheckCircle2 size={16} className='text-indigo-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-indigo-700'>{monitoringData.summary.ticketsClosed}</span>
                                <span className='text-[11px] font-medium text-indigo-800'>CSAT Confirmed</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-rose-100 bg-rose-50/50 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Delayed Activities</span>
                                <AlertTriangle size={16} className='text-rose-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-rose-600'>{monitoringData.summary.delayedActivities}</span>
                                <span className='text-[11px] font-medium text-rose-700'>Overdue Actions</span>
                            </div>
                        </div>
                    </div>

                    {/* Department Productivity Breakdown */}
                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                        {/* Department Distribution */}
                        <div className='lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                            <div className='flex items-center justify-between mb-4 border-b border-slate-100 pb-3'>
                                <div>
                                    <h3 className='text-sm font-semibold text-slate-900'>Department Operational Workload</h3>
                                    <p className='text-xs text-slate-500'>Completed vs Pending action items across school divisions</p>
                                </div>
                            </div>

                            <div className='space-y-3'>
                                {Object.entries(monitoringData.summary.departmentBreakdown).map(([deptName, stats]) => (
                                    <div key={deptName} className='rounded-xl border border-slate-100 p-3 bg-slate-50/50 space-y-2'>
                                        <div className='flex items-center justify-between text-xs'>
                                            <span className='font-bold text-slate-900'>{deptName}</span>
                                            <span className='font-mono font-semibold text-slate-600'>{stats.total} Total Actions</span>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <div className='h-2 flex-1 rounded-full bg-slate-200 overflow-hidden flex'>
                                                <div
                                                    className='bg-emerald-500 h-full'
                                                    style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                                                />
                                                <div
                                                    className='bg-rose-500 h-full'
                                                    style={{ width: `${stats.total > 0 ? (stats.delayed / stats.total) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className='flex items-center justify-between text-[11px] text-slate-500'>
                                            <span className='text-emerald-700 font-semibold'>{stats.completed} Completed</span>
                                            <span className='text-rose-700 font-semibold'>{stats.delayed} Delayed</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Filter Drilldown Card */}
                        <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4'>
                            <div>
                                <h3 className='text-sm font-semibold text-slate-900'>Hierarchical Filter</h3>
                                <p className='text-xs text-slate-500'>Scope monitoring view to specific team or individual</p>
                            </div>

                            <div className='space-y-3 text-xs'>
                                <div>
                                    <label className='font-semibold text-slate-700 block mb-1'>Select Department</label>
                                    <select
                                        value={selectedDept}
                                        onChange={(e) => {
                                            setSelectedDept(e.target.value)
                                            setSelectedEmployeeId('ALL')
                                        }}
                                        className='w-full rounded-xl border border-slate-200 p-2'
                                    >
                                        <option value='ALL'>All Campus Departments</option>
                                        {availableDepartments.map((dept) => (
                                            <option key={dept} value={dept}>
                                                {dept}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className='font-semibold text-slate-700 block mb-1'>Select Individual Employee</label>
                                    <select
                                        value={selectedEmployeeId}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                        className='w-full rounded-xl border border-slate-200 p-2'
                                    >
                                        <option value='ALL'>All Staff Members in Selection</option>
                                        {departmentEmployees.map((emp) => (
                                            <option key={emp.employeeId} value={emp.employeeId}>
                                                {emp.name} ({emp.employeeId} - {emp.designation})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={() => setActiveTab('hierarchical-drilldown')}
                                    className='w-full rounded-xl bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 transition'
                                >
                                    Open Detailed Dossier →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: TEAM ACTIVITY STREAM                                               */}
            {/* ========================================================================= */}
            {activeTab === 'activity-stream' && (
                <div className='space-y-4'>
                    {/* Filters Bar */}
                    <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
                        <div className='relative flex-1 min-w-[220px]'>
                            <Search className='absolute left-3 top-2.5 text-slate-400' size={14} />
                            <input
                                type='text'
                                placeholder='Search employee name, task title, action details...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className='w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden'
                            />
                        </div>

                        <div className='flex items-center gap-2 flex-wrap'>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className='rounded-xl border border-slate-200 px-3 py-1.5 text-xs'
                            >
                                <option value='ALL'>All Categories</option>
                                <option value='Task Management'>Task Management</option>
                                <option value='Department Ticketing'>Department Ticketing</option>
                                <option value='Stores & Procurement'>Stores & Procurement</option>
                                <option value='Gate Pass & Security'>Gate Pass & Security</option>
                                <option value='Physical File Room'>Physical File Room</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className='rounded-xl border border-slate-200 px-3 py-1.5 text-xs'
                            >
                                <option value='ALL'>All Statuses</option>
                                <option value='Completed'>Completed</option>
                                <option value='In-Progress'>In-Progress</option>
                                <option value='Delayed'>Delayed</option>
                            </select>
                            <select
                                value={reviewFilter}
                                onChange={(e) => setReviewFilter(e.target.value)}
                                className='rounded-xl border border-slate-200 px-3 py-1.5 text-xs'
                            >
                                <option value='ALL'>All Review Stages</option>
                                <option value='Pending Approval'>Pending Approval</option>
                                <option value='Approved'>Approved by HOD</option>
                                <option value='Needs Revision'>Needs Revision</option>
                            </select>
                        </div>
                    </div>

                    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3 px-4'>Date & Time</th>
                                        <th className='py-3 px-4'>Employee & Role</th>
                                        <th className='py-3 px-4'>Department</th>
                                        <th className='py-3 px-4'>Category</th>
                                        <th className='py-3 px-4'>Activity Description</th>
                                        <th className='py-3 px-4 text-center'>Task Status</th>
                                        <th className='py-3 px-4 text-center'>HOD Review</th>
                                        <th className='py-3 px-4 text-right'>Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {filteredActivities.map((act) => (
                                        <tr key={act.id} className='hover:bg-slate-50/70'>
                                            <td className='py-3 px-4 text-slate-500 font-mono text-[11px]'>{act.timestamp}</td>
                                            <td className='py-3 px-4'>
                                                <div className='font-semibold text-slate-900'>{act.employeeName}</div>
                                                <div className='text-[11px] text-slate-400'>{act.employeeId} • {act.role}</div>
                                            </td>
                                            <td className='py-3 px-4 text-slate-600'>{act.department}</td>
                                            <td className='py-3 px-4 font-medium text-slate-800'>{act.category}</td>
                                            <td className='py-3 px-4'>
                                                <div className='font-semibold text-slate-900'>{act.activityTitle}</div>
                                                <div className='text-[11px] text-slate-500'>{act.details}</div>
                                            </td>
                                            <td className='py-3 px-4 text-center'>
                                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                    act.status === 'Completed'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : act.status === 'Delayed'
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {act.status}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4 text-center'>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                    act.reviewStatus === 'Approved'
                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                        : act.reviewStatus === 'Needs Revision'
                                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                }`}>
                                                    {act.reviewStatus || 'Pending Approval'}
                                                </span>
                                                {act.reviewedBy && (
                                                    <div className='text-[10px] text-slate-400 mt-0.5'>by {act.reviewedBy}</div>
                                                )}
                                            </td>
                                            <td className='py-3 px-4 text-right whitespace-nowrap'>
                                                <button
                                                    onClick={() => {
                                                        setSelectedActivityForReview(act)
                                                        setReviewDecision(act.reviewStatus === 'Needs Revision' ? 'Needs Revision' : 'Approved')
                                                        setReviewRemarks(act.reviewRemarks || '')
                                                    }}
                                                    className='inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition'
                                                >
                                                    <ShieldCheck size={13} />
                                                    {act.reviewStatus === 'Approved' ? 'View Sign-Off' : 'Review & Sign-Off'}
                                                </button>
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
            {/* TAB: PENDING HOD APPROVALS                                                */}
            {/* ========================================================================= */}
            {activeTab === 'pending-approvals' && (
                <div className='space-y-4'>
                    <div className='rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs flex items-center justify-between'>
                        <div>
                            <h3 className='text-sm font-bold text-amber-950'>Department Overseer Pending Review Queue</h3>
                            <p className='text-xs text-amber-800'>
                                Subordinates have logged daily operational tasks awaiting managerial sign-off and performance point validation.
                            </p>
                        </div>
                        <span className='rounded-full bg-amber-600 px-3 py-1 text-xs font-bold text-white shadow-xs'>
                            {filteredActivities.filter((a) => a.reviewStatus === 'Pending Approval').length} Pending Review
                        </span>
                    </div>

                    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3 px-4'>Date & Time</th>
                                        <th className='py-3 px-4'>Employee & Department</th>
                                        <th className='py-3 px-4'>Activity Description</th>
                                        <th className='py-3 px-4'>Module & Evidence</th>
                                        <th className='py-3 px-4 text-right'>Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {filteredActivities.filter((a) => a.reviewStatus === 'Pending Approval').length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className='py-8 text-center text-xs text-slate-400'>
                                                ✓ All logged activities in this scope have been reviewed and approved!
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredActivities
                                            .filter((a) => a.reviewStatus === 'Pending Approval')
                                            .map((act) => (
                                                <tr key={act.id} className='hover:bg-amber-50/40 transition'>
                                                    <td className='py-3 px-4 font-mono text-[11px] text-slate-600'>{act.timestamp}</td>
                                                    <td className='py-3 px-4'>
                                                        <div className='font-semibold text-slate-900'>{act.employeeName}</div>
                                                        <div className='text-[11px] text-slate-500'>{act.employeeId} · {act.department}</div>
                                                    </td>
                                                    <td className='py-3 px-4'>
                                                        <div className='font-semibold text-slate-900'>{act.activityTitle}</div>
                                                        <div className='text-[11px] text-slate-500'>{act.details}</div>
                                                    </td>
                                                    <td className='py-3 px-4'>
                                                        <span className='rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700'>
                                                            {act.category}
                                                        </span>
                                                        {act.evidence && (
                                                            <div className='text-[10px] text-blue-600 mt-0.5'>📎 {act.evidence}</div>
                                                        )}
                                                    </td>
                                                    <td className='py-3 px-4 text-right'>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedActivityForReview(act)
                                                                setReviewDecision('Approved')
                                                                setReviewRemarks('Reviewed and endorsed.')
                                                            }}
                                                            className='rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition'
                                                        >
                                                            Sign-Off Activity ✍️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: HIERARCHICAL DRILL-DOWN                                            */}
            {/* ========================================================================= */}
            {activeTab === 'hierarchical-drilldown' && (
                <div className='space-y-4'>
                    <div className='rounded-2xl border border-blue-100 bg-[#E8F1FD]/40 p-4 shadow-xs flex items-center justify-between'>
                        <div>
                            <h3 className='text-sm font-bold text-blue-950'>Organizational Transparency Dossier</h3>
                            <p className='text-xs text-blue-800'>
                                Drill down from School Board level down to individual team member operational output.
                            </p>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {/* Selected Individual Card */}
                        {departmentEmployees.slice(0, 6).map((emp) => {
                            const empActivities = monitoringData.activities.filter((a) => a.employeeId === emp.employeeId)
                            const completedCount = empActivities.filter((a) => a.status === 'Completed').length
                            return (
                                <div key={emp.employeeId} className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3'>
                                    <div className='flex items-center justify-between'>
                                        <div>
                                            <span className='font-mono text-xs font-bold text-blue-600'>{emp.employeeId}</span>
                                            <h4 className='text-sm font-bold text-slate-900'>{emp.name}</h4>
                                            <p className='text-xs text-slate-500'>{emp.designation}</p>
                                        </div>
                                        <span className='rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600'>
                                            {emp.department}
                                        </span>
                                    </div>

                                    <div className='rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs space-y-1.5'>
                                        <div className='flex items-center justify-between'>
                                            <span className='text-slate-500'>Active Deliverables:</span>
                                            <span className='font-bold text-slate-900'>{empActivities.length} Actions</span>
                                        </div>
                                        <div className='flex items-center justify-between'>
                                            <span className='text-slate-500'>Completion Rate:</span>
                                            <span className='font-bold text-emerald-700'>
                                                {empActivities.length > 0 ? Math.round((completedCount / empActivities.length) * 100) : 100}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className='space-y-1 text-xs'>
                                        <div className='font-semibold text-slate-700 text-[11px]'>Recent Action Items:</div>
                                        {empActivities.length === 0 ? (
                                            <div className='text-[11px] text-slate-400'>Standard daily operational cadence.</div>
                                        ) : (
                                            empActivities.slice(0, 2).map((a) => (
                                                <div key={a.id} className='text-[11px] text-slate-600 truncate'>
                                                    • {a.activityTitle} ({a.status})
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: DELAYED ACTIVITIES & BOTTLENECKS                                    */}
            {/* ========================================================================= */}
            {activeTab === 'delayed-activities' && (
                <div className='space-y-4'>
                    <div className='rounded-2xl border border-rose-100 bg-rose-50/40 p-4 shadow-xs flex items-center justify-between'>
                        <div>
                            <h3 className='text-sm font-bold text-rose-950'>Delayed Activities & Operational Bottlenecks</h3>
                            <p className='text-xs text-rose-800'>
                                Escalations requiring supervisory intervention to unblock workflow deadlines.
                            </p>
                        </div>
                    </div>

                    <div className='space-y-3'>
                        {monitoringData.activities.filter((a) => a.status === 'Delayed').map((act) => (
                            <div key={act.id} className='rounded-2xl border border-rose-200 bg-white p-4 shadow-xs flex items-center justify-between'>
                                <div className='space-y-1'>
                                    <div className='flex items-center gap-2'>
                                        <span className='rounded bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5'>
                                            Delayed
                                        </span>
                                        <span className='font-bold text-sm text-slate-900'>{act.activityTitle}</span>
                                    </div>
                                    <div className='text-xs text-slate-600'>
                                        <b>Owner:</b> {act.employeeName} ({act.department}) • <b>Category:</b> {act.category}
                                    </div>
                                    <div className='text-[11px] text-slate-500'>{act.details}</div>
                                </div>
                                <button
                                    onClick={() => notify(`Supervisory reminder dispatched to ${act.employeeName}.`)}
                                    className='rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700'
                                >
                                    Escalate Reminder
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* REVIEW MODAL */}
            {selectedActivityForReview && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <div className='flex items-center gap-2'>
                                <ShieldCheck className='text-blue-600' size={20} />
                                <h3 className='text-sm font-bold text-slate-800'>Supervisory Activity Review</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedActivityForReview(null)}
                                className='p-1 text-slate-400 hover:text-slate-600 rounded-lg'
                            >
                                <XCircle size={18} />
                            </button>
                        </div>

                        <div className='bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5'>
                            <div><strong className='text-slate-700'>Activity:</strong> {selectedActivityForReview.activityTitle}</div>
                            <div><strong className='text-slate-700'>Owner:</strong> {selectedActivityForReview.employeeName} ({selectedActivityForReview.department})</div>
                            <div><strong className='text-slate-700'>Category:</strong> {selectedActivityForReview.category}</div>
                            <div><strong className='text-slate-700'>Details:</strong> {selectedActivityForReview.details}</div>
                        </div>

                        <form onSubmit={handleCommitReview} className='space-y-3 text-xs'>
                            <div>
                                <label className='font-semibold text-slate-700 block mb-1'>Review Decision</label>
                                <select
                                    value={reviewDecision}
                                    onChange={(e) => setReviewDecision(e.target.value)}
                                    className='w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-blue-600'
                                >
                                    <option value='Approved'>Approved (Sign Off)</option>
                                    <option value='Needs Revision'>Needs Revision (Request Rework)</option>
                                    <option value='Escalated'>Escalate to Executive Leadership</option>
                                </select>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 block mb-1'>
                                    Supervisory Remarks / Feedback {reviewDecision !== 'Approved' && <span className='text-rose-500'>*</span>}
                                </label>
                                <textarea
                                    rows={3}
                                    value={reviewRemarks}
                                    onChange={(e) => setReviewRemarks(e.target.value)}
                                    placeholder='Provide feedback, directives, or approval comments...'
                                    className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-2 border-t'>
                                <button
                                    type='button'
                                    onClick={() => setSelectedActivityForReview(null)}
                                    className='px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs'
                                >
                                    Submit Decision
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

