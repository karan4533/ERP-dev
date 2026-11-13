import React, { useState, useMemo, useEffect } from 'react'
import {
    ClipboardList,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Plus,
    Search,
    Filter,
    Calendar,
    User,
    Users,
    Building2,
    MessageSquare,
    Send,
    History,
    Eye,
    Edit3,
    X,
    ArrowUpRight,
    Inbox,
    RotateCcw,
    FileText,
    Check,
    CheckSquare,
    Layers,
    ChevronRight,
    ShieldAlert,
    Paperclip,
    Trash2
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'
import {
    getAllTasks,
    getMyTasks,
    getTasksAssignedByMe,
    getTaskKpis,
    addTask,
    updateTaskStatus,
    updateTaskDetails,
    addTaskComment,
    closeTask,
    acknowledgeTask,
    startTask,
    cancelTask,
    rejectTask,
    submitTaskForVerification,
    verifyTaskCompletion,
    getDemoUserId,
    isTaskOverdue,
    ENTERPRISE_DEPARTMENTS,
    ENTERPRISE_TEAMS,
    getEmployeesByDepartment,
    parseTaskDate
} from './taskManagementData'
import { ENTERPRISE_EMPLOYEES } from '../AttendanceAndLeave/attendanceLeaveData'

// Status badge styling helper
const getStatusBadge = (status) => {
    switch (status) {
        case 'Draft':
            return { label: 'Draft', bg: 'bg-slate-100 text-slate-700 border-slate-200' }
        case 'Assigned':
            return { label: 'Assigned', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
        case 'Acknowledged':
            return { label: 'Acknowledged', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' }
        case 'In Progress':
            return { label: 'In Progress', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
        case 'Submitted':
        case 'Submitted for Verification':
            return { label: 'Submitted', bg: 'bg-purple-50 text-purple-700 border-purple-200' }
        case 'Completed':
        case 'Closed':
            return { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
        case 'Rejected':
        case 'Rework Required':
            return { label: 'Rejected', bg: 'bg-orange-50 text-orange-700 border-orange-200' }
        case 'Cancelled':
            return { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 border-rose-200' }
        default:
            return { label: status || 'Pending', bg: 'bg-slate-100 text-slate-700 border-slate-200' }
    }
}

// Priority badge styling helper
const getPriorityBadge = (priority) => {
    switch (priority) {
        case 'Critical':
        case 'Urgent':
            return { label: 'Critical', bg: 'bg-rose-50 text-rose-700 border-rose-200' }
        case 'High':
            return { label: 'High', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
        case 'Medium':
            return { label: 'Medium', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
        case 'Low':
            return { label: 'Low', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
        default:
            return { label: priority || 'Medium', bg: 'bg-slate-50 text-slate-700 border-slate-200' }
    }
}

export default function EnterpriseTaskWorkspace({ defaultTab = 'received', initialCreateOpen = false, roleOverride = null }) {
    const { role: authRole, email: authEmail, name: authName } = useAuth()
    const activeRole = roleOverride || authRole || 'teacher'
    const roleLabel = getProfileLabel(activeRole)
    const currentUserId = getDemoUserId(activeRole)
    const currentUserName = authName || roleLabel || 'Current User'

    // Tab state: 'received' | 'created'
    const [activeTab, setActiveTab] = useState(defaultTab === 'created' ? 'created' : 'received')
    const [refreshKey, setRefreshKey] = useState(0)
    const [bannerMessage, setBannerMessage] = useState('')

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(initialCreateOpen)
    const [selectedTask, setSelectedTask] = useState(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    // Details view tab: 'overview' | 'history' | 'comments'
    const [detailsSubTab, setDetailsSubTab] = useState('overview')

    // Filter toolbar state
    const [searchTerm, setSearchTerm] = useState('')
    const [filterDepartment, setFilterDepartment] = useState('')
    const [filterStaff, setFilterStaff] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterPriority, setFilterPriority] = useState('')
    const [filterDueDate, setFilterDueDate] = useState('')

    const notify = (msg) => {
        setBannerMessage(msg)
        setTimeout(() => setBannerMessage(''), 4000)
    }

    const refreshData = () => {
        setRefreshKey((k) => k + 1)
    }

    // Dynamic KPI calculation
    const kpis = useMemo(() => {
        void refreshKey
        return getTaskKpis(activeRole, currentUserId)
    }, [activeRole, currentUserId, refreshKey])

    // Tasks queries
    const receivedTasks = useMemo(() => {
        void refreshKey
        return getMyTasks(activeRole, currentUserId)
    }, [activeRole, currentUserId, refreshKey])

    const createdTasks = useMemo(() => {
        void refreshKey
        return getTasksAssignedByMe(activeRole, currentUserId)
    }, [activeRole, currentUserId, refreshKey])

    // Current tab tasks
    const activeTaskList = activeTab === 'created' ? createdTasks : receivedTasks

    // Filtered tasks
    const filteredTasks = useMemo(() => {
        return activeTaskList.filter((task) => {
            // Search by task title or description
            if (searchTerm) {
                const term = searchTerm.toLowerCase()
                const titleMatch = (task.title || '').toLowerCase().includes(term)
                const descMatch = (task.instructions || task.description || '').toLowerCase().includes(term)
                const idMatch = (task.id || '').toLowerCase().includes(term)
                if (!titleMatch && !descMatch && !idMatch) return false
            }

            // Department filter
            if (filterDepartment) {
                const dept = (task.department || task.assignedDepartment || '').toLowerCase()
                if (!dept.includes(filterDepartment.toLowerCase())) return false
            }

            // Staff filter
            if (filterStaff) {
                const staffTerm = filterStaff.toLowerCase()
                const assignees = (task.assigneeNames || []).join(' ').toLowerCase()
                if (!assignees.includes(staffTerm)) return false
            }

            // Status filter
            if (filterStatus) {
                const currentStatus = task.status || 'Pending'
                if (filterStatus === 'Submitted') {
                    if (currentStatus !== 'Submitted' && currentStatus !== 'Submitted for Verification') return false
                } else if (filterStatus === 'Completed') {
                    if (currentStatus !== 'Completed' && currentStatus !== 'Closed') return false
                } else if (currentStatus.toLowerCase() !== filterStatus.toLowerCase()) {
                    return false
                }
            }

            // Priority filter
            if (filterPriority) {
                const p = task.priority || 'Medium'
                if (filterPriority === 'Critical') {
                    if (p !== 'Critical' && p !== 'Urgent') return false
                } else if (p.toLowerCase() !== filterPriority.toLowerCase()) {
                    return false
                }
            }

            // Due date filter
            if (filterDueDate) {
                const taskDue = parseTaskDate(task.dueDate)
                const filterDue = parseTaskDate(filterDueDate)
                if (taskDue && filterDue) {
                    if (taskDue.toDateString() !== filterDue.toDateString()) return false
                }
            }

            return true
        })
    }, [activeTaskList, searchTerm, filterDepartment, filterStaff, filterStatus, filterPriority, filterDueDate])

    const clearFilters = () => {
        setSearchTerm('')
        setFilterDepartment('')
        setFilterStaff('')
        setFilterStatus('')
        setFilterPriority('')
        setFilterDueDate('')
    }

    const hasActiveFilters = Boolean(
        searchTerm || filterDepartment || filterStaff || filterStatus || filterPriority || filterDueDate
    )

    // Open detailed task view
    const handleViewTask = (task) => {
        setSelectedTask(task)
        setDetailsSubTab('overview')
        setIsDetailsOpen(true)
    }

    // Open quick update status modal
    const handleOpenStatusModal = (task, e) => {
        if (e) e.stopPropagation()
        setSelectedTask(task)
        setIsStatusModalOpen(true)
    }

    // Open edit modal
    const handleOpenEditModal = (task, e) => {
        if (e) e.stopPropagation()
        setSelectedTask(task)
        setIsEditModalOpen(true)
    }

    return (
        <div className="min-h-screen bg-slate-50/60 p-4 md:p-6 lg:p-8 space-y-6">
            {/* Banner Notification */}
            {bannerMessage && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-sm animate-fade-in">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-medium">{bannerMessage}</span>
                    </div>
                    <button
                        onClick={() => setBannerMessage('')}
                        className="text-emerald-600 hover:text-emerald-900"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task Management</h1>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Manage assigned tasks, team responsibilities, deadlines, and execution progress in one place.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Task</span>
                    </button>
                </div>
            </div>

            {/* 4 Compact KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Tasks */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.totalTasks}</p>
                        <span className="text-xs text-slate-400">All registered tasks</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Layers className="w-6 h-6" />
                    </div>
                </div>

                {/* 2. Received Tasks */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Received Tasks</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.receivedTasks}</p>
                        <span className="text-xs text-slate-400">Assigned to you or your team</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Inbox className="w-6 h-6" />
                    </div>
                </div>

                {/* 3. Created Tasks */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Created Tasks</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.createdTasks}</p>
                        <span className="text-xs text-slate-400">Delegated by you</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <ArrowUpRight className="w-6 h-6" />
                    </div>
                </div>

                {/* 4. Overdue Tasks */}
                <div className={`bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between ${kpis.overdueTasks > 0 ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'}`}>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue Tasks</p>
                        <p className={`text-2xl font-bold mt-1 ${kpis.overdueTasks > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{kpis.overdueTasks}</p>
                        <span className="text-xs text-slate-400">Past target deadline</span>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpis.overdueTasks > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Task Management Container: Tabs + Filter Toolbar + Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Primary Tabs */}
                <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveTab('received')}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                                activeTab === 'received'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <Inbox className="w-4 h-4" />
                            <span>Received Tasks</span>
                            <span
                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    activeTab === 'received' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                                {receivedTasks.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('created')}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                                activeTab === 'created'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <ArrowUpRight className="w-4 h-4" />
                            <span>Created Tasks</span>
                            <span
                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    activeTab === 'created' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                                {createdTasks.length}
                            </span>
                        </button>
                    </div>

                    <div className="text-xs text-slate-400 hidden sm:block">
                        Showing {filteredTasks.length} of {activeTaskList.length} tasks
                    </div>
                </div>

                {/* Compact Filter Toolbar */}
                <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400"
                        />
                    </div>

                    {/* Department Filter */}
                    <div className="min-w-[150px]">
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                        >
                            <option value="">All Departments</option>
                            {ENTERPRISE_DEPARTMENTS.map((d) => (
                                <option key={d.id} value={d.name}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Assigned Staff Filter */}
                    <div className="min-w-[140px]">
                        <input
                            type="text"
                            placeholder="Filter by staff..."
                            value={filterStaff}
                            onChange={(e) => setFilterStaff(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="min-w-[130px]">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                        >
                            <option value="">All Statuses</option>
                            <option value="Draft">Draft</option>
                            <option value="Assigned">Assigned</option>
                            <option value="Acknowledged">Acknowledged</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Completed">Completed</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Priority Filter */}
                    <div className="min-w-[120px]">
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                        >
                            <option value="">All Priorities</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>

                    {/* Due Date Filter */}
                    <div className="min-w-[130px]">
                        <input
                            type="date"
                            value={filterDueDate}
                            onChange={(e) => setFilterDueDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                        />
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Clear Filters</span>
                        </button>
                    )}
                </div>

                {/* Task Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="py-3 px-4">Task Title</th>
                                <th className="py-3 px-4">Assigned To</th>
                                <th className="py-3 px-4">Department</th>
                                <th className="py-3 px-4">Priority</th>
                                <th className="py-3 px-4">Due Date</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Created By</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-400">
                                        <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                        <p className="font-medium text-slate-600">No tasks found</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {hasActiveFilters
                                                ? 'Try clearing your filters to see more tasks.'
                                                : activeTab === 'created'
                                                ? 'You have not created any tasks yet.'
                                                : 'No tasks currently assigned to you.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => {
                                    const statusBadge = getStatusBadge(task.status)
                                    const priorityBadge = getPriorityBadge(task.priority)
                                    const overdue = isTaskOverdue(task)
                                    const assignees = task.assigneeNames || []
                                    const displayAssignee =
                                        assignees.length > 1
                                            ? `${assignees[0]} +${assignees.length - 1} more`
                                            : assignees[0] || task.assigneeRole || 'Unassigned'

                                    return (
                                        <tr
                                            key={task.id}
                                            onClick={() => handleViewTask(task)}
                                            className="hover:bg-blue-50/40 cursor-pointer transition group"
                                        >
                                            {/* Task Title */}
                                            <td className="py-3.5 px-4 max-w-xs">
                                                <div className="flex items-start gap-2">
                                                    <div>
                                                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition flex items-center gap-1.5">
                                                            <span>{task.title}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono">
                                                                #{task.id}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                                            {task.instructions || task.description || 'No instructions provided.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Assigned To */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    {task.scope === 'Entire Team' ? (
                                                        <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                    ) : task.scope === 'Department' ? (
                                                        <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                    ) : (
                                                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    )}
                                                    <span className="font-medium truncate max-w-[150px]">
                                                        {displayAssignee}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Department */}
                                            <td className="py-3.5 px-4 text-slate-600">
                                                {task.department || task.assignedDepartment || 'General'}
                                            </td>

                                            {/* Priority */}
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${priorityBadge.bg}`}
                                                >
                                                    {priorityBadge.label}
                                                </span>
                                            </td>

                                            {/* Due Date */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock
                                                        className={`w-3.5 h-3.5 ${
                                                            overdue ? 'text-rose-500' : 'text-slate-400'
                                                        }`}
                                                    />
                                                    <span
                                                        className={`font-medium ${
                                                            overdue ? 'text-rose-600 font-bold' : 'text-slate-700'
                                                        }`}
                                                    >
                                                        {task.dueDate || '—'}
                                                    </span>
                                                    {overdue && (
                                                        <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded">
                                                            Overdue
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.bg}`}
                                                >
                                                    {statusBadge.label}
                                                </span>
                                            </td>

                                            {/* Created By */}
                                            <td className="py-3.5 px-4 text-slate-600">
                                                <div className="truncate max-w-[140px]">
                                                    <span className="font-medium">{task.assignedBy || 'Authority'}</span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div
                                                    className="flex items-center justify-end gap-1.5"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={() => handleViewTask(task)}
                                                        title="View Task Details"
                                                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={(e) => handleOpenStatusModal(task, e)}
                                                        title="Update Status"
                                                        className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                                                    >
                                                        Status
                                                    </button>

                                                    {activeTab === 'created' && (
                                                        <button
                                                            onClick={(e) => handleOpenEditModal(task, e)}
                                                            title="Edit Task"
                                                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
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

            {/* CREATE TASK MODAL */}
            {isCreateOpen && (
                <CreateTaskModal
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={(created) => {
                        setIsCreateOpen(false)
                        refreshData()
                        notify(`Task '${created.title}' created successfully!`)
                    }}
                    activeRole={activeRole}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                />
            )}

            {/* TASK DETAILS MODAL / DRAWER */}
            {isDetailsOpen && selectedTask && (
                <TaskDetailsModal
                    task={selectedTask}
                    onClose={() => {
                        setIsDetailsOpen(false)
                        setSelectedTask(null)
                    }}
                    onUpdated={(updated) => {
                        setSelectedTask(updated)
                        refreshData()
                        notify('Task updated successfully!')
                    }}
                    activeRole={activeRole}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    subTab={detailsSubTab}
                    setSubTab={setDetailsSubTab}
                />
            )}

            {/* QUICK STATUS UPDATE MODAL */}
            {isStatusModalOpen && selectedTask && (
                <UpdateStatusModal
                    task={selectedTask}
                    onClose={() => {
                        setIsStatusModalOpen(false)
                        setSelectedTask(null)
                    }}
                    onUpdated={(updated) => {
                        setIsStatusModalOpen(false)
                        setSelectedTask(null)
                        refreshData()
                        notify(`Status updated to ${updated.status}`)
                    }}
                    currentUserName={currentUserName}
                />
            )}

            {/* EDIT TASK MODAL */}
            {isEditModalOpen && selectedTask && (
                <EditTaskModal
                    task={selectedTask}
                    onClose={() => {
                        setIsEditModalOpen(false)
                        setSelectedTask(null)
                    }}
                    onUpdated={(updated) => {
                        setIsEditModalOpen(false)
                        setSelectedTask(null)
                        refreshData()
                        notify('Task details updated!')
                    }}
                    currentUserName={currentUserName}
                />
            )}
        </div>
    )
}

// -------------------------------------------------------------
// CREATE TASK MODAL
// -------------------------------------------------------------
function CreateTaskModal({ onClose, onSuccess, activeRole, currentUserId, currentUserName }) {
    // Form fields
    const [title, setTitle] = useState('')
    const [department, setDepartment] = useState('Academics & Teaching')
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() + 5)
        return d.toISOString().split('T')[0]
    })
    const [priority, setPriority] = useState('Medium')
    const [scope, setScope] = useState('Individual') // 'Individual' | 'Entire Team' | 'Department'
    const [instructions, setInstructions] = useState('')

    // Scope-specific fields
    // 1. Individual
    const [selectedStaffIds, setSelectedStaffIds] = useState([])
    const [staffSearchQuery, setStaffSearchQuery] = useState('')

    // 2. Entire Team
    const [selectedTeamId, setSelectedTeamId] = useState(ENTERPRISE_TEAMS[0]?.id || '')
    const [excludedMemberIds, setExcludedMemberIds] = useState([])

    // Submitting state
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    // Employees in selected department
    const departmentStaff = useMemo(() => {
        return getEmployeesByDepartment(department)
    }, [department])

    // Filtered staff for individual search
    const filteredStaff = useMemo(() => {
        if (!staffSearchQuery) return departmentStaff
        const q = staffSearchQuery.toLowerCase()
        return departmentStaff.filter(
            (e) => e.name.toLowerCase().includes(q) || (e.designation || '').toLowerCase().includes(q)
        )
    }, [departmentStaff, staffSearchQuery])

    // Selected team object
    const selectedTeam = useMemo(() => {
        return ENTERPRISE_TEAMS.find((t) => t.id === selectedTeamId) || ENTERPRISE_TEAMS[0]
    }, [selectedTeamId])

    const handleToggleStaff = (id) => {
        setSelectedStaffIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }

    const handleSelectAllStaff = () => {
        if (selectedStaffIds.length === departmentStaff.length) {
            setSelectedStaffIds([])
        } else {
            setSelectedStaffIds(departmentStaff.map((e) => e.id))
        }
    }

    const handleToggleExcludeMember = (id) => {
        setExcludedMemberIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }

    const handleSubmit = (saveAsDraft = false) => {
        setErrorMsg('')
        if (!title.trim()) {
            setErrorMsg('Task Title is required.')
            return
        }
        if (!department) {
            setErrorMsg('Please select a Department.')
            return
        }
        if (!dueDate) {
            setErrorMsg('Due Date is required.')
            return
        }
        if (!instructions.trim()) {
            setErrorMsg('Detailed Instructions are required.')
            return
        }

        if (scope === 'Individual' && selectedStaffIds.length === 0) {
            setErrorMsg('Please select at least one staff member for Individual assignment.')
            return
        }

        setIsSubmitting(true)
        try {
            let assigneeRole = 'teacher'
            let assigneeUserIds = []
            let assigneeNames = []

            if (scope === 'Individual') {
                const selectedEmps = departmentStaff.filter((e) => selectedStaffIds.includes(e.id))
                assigneeNames = selectedEmps.map((e) => e.name)
                assigneeUserIds = selectedEmps.map((e) => e.id)
                if (selectedEmps.length > 0) {
                    assigneeRole = selectedEmps[0].roleKey || 'teacher'
                }
            } else if (scope === 'Entire Team') {
                const team = selectedTeam
                const activeMembers = team.members.filter((m) => !excludedMemberIds.includes(m.id))
                assigneeNames = [`Team: ${team.name} (${activeMembers.length} members)`]
                assigneeUserIds = activeMembers.map((m) => m.id)
                if (activeMembers.length > 0) {
                    assigneeRole = activeMembers[0].role || 'teacher'
                }
            } else if (scope === 'Department') {
                assigneeNames = [`Department: ${department} (${departmentStaff.length} staff)`]
                assigneeUserIds = departmentStaff.map((e) => e.id)
                if (departmentStaff.length > 0) {
                    assigneeRole = departmentStaff[0].roleKey || 'admin'
                }
            }

            const payload = {
                title: title.trim(),
                instructions: instructions.trim(),
                description: instructions.trim(),
                department,
                dueDate,
                priority,
                scope,
                assigneeRole,
                assigneeUserIds,
                assigneeNames,
                teamId: scope === 'Entire Team' ? selectedTeam?.id : null,
                teamName: scope === 'Entire Team' ? selectedTeam?.name : null,
                excludedMemberIds: scope === 'Entire Team' ? excludedMemberIds : [],
                status: saveAsDraft ? 'Draft' : 'Assigned',
                assignedByRole: activeRole,
                assignedBy: currentUserName,
                assignedById: currentUserId
            }

            const created = addTask(payload)
            onSuccess(created)
        } catch (err) {
            setErrorMsg(err.message || 'Failed to create task.')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Create New Task</h2>
                        <p className="text-xs text-slate-500">
                            Assign responsibilities, set deadlines, and configure execution scope.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body: Scrollable */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                    {errorMsg && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Section A — Task Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span>Section A — Task Information</span>
                        </div>

                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">
                                Task Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Grade 10 Model Examination Blueprint Moderation"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Department */}
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">
                                    Department <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={department}
                                    onChange={(e) => {
                                        setDepartment(e.target.value)
                                        setSelectedStaffIds([])
                                    }}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                >
                                    {ENTERPRISE_DEPARTMENTS.map((d) => (
                                        <option key={d.id} value={d.name}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">
                                    Due Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                />
                            </div>

                            {/* Priority Level */}
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">
                                    Priority Level <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section B — Assignment Scope */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span>Section B — Assignment Scope</span>
                        </div>

                        {/* Scope Selector Pills */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'Individual', label: 'Individual', icon: User, desc: 'Selected staff members' },
                                { id: 'Entire Team', label: 'Entire Team', icon: Users, desc: 'Functional school team' },
                                { id: 'Department', label: 'Department', icon: Building2, desc: 'All staff in department' }
                            ].map((s) => {
                                const Icon = s.icon
                                const active = scope === s.id
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setScope(s.id)}
                                        className={`p-3 rounded-xl border text-left transition flex flex-col items-start ${
                                            active
                                                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 text-blue-900'
                                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 font-bold text-xs">
                                            <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                                            <span>{s.label}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 mt-1">{s.desc}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Dynamic Sub-form based on Scope */}
                        {scope === 'Individual' && (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-800">
                                        Select Staff Members ({departmentStaff.length} available in {department})
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleSelectAllStaff}
                                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                                    >
                                        {selectedStaffIds.length === departmentStaff.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>

                                {/* Search within department staff */}
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search staff by name or designation..."
                                        value={staffSearchQuery}
                                        onChange={(e) => setStaffSearchQuery(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                    />
                                </div>

                                {/* Staff list with checkboxes */}
                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                    {filteredStaff.length === 0 ? (
                                        <p className="text-slate-400 text-center py-3">No matching staff found.</p>
                                    ) : (
                                        filteredStaff.map((emp) => {
                                            const isChecked = selectedStaffIds.includes(emp.id)
                                            return (
                                                <label
                                                    key={emp.id}
                                                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition ${
                                                        isChecked
                                                            ? 'bg-blue-50/60 border-blue-300'
                                                            : 'bg-white border-slate-200 hover:bg-slate-100/60'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => handleToggleStaff(emp.id)}
                                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <div>
                                                            <p className="font-semibold text-slate-800">{emp.name}</p>
                                                            <p className="text-[10px] text-slate-500">
                                                                {emp.designation || emp.roleLabel || emp.roleKey} • #{emp.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                                                        {emp.category || 'Staff'}
                                                    </span>
                                                </label>
                                            )
                                        })
                                    )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium">
                                    Selected: {selectedStaffIds.length} staff member{selectedStaffIds.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        )}

                        {scope === 'Entire Team' && (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">
                                        Select Target Team
                                    </label>
                                    <select
                                        value={selectedTeamId}
                                        onChange={(e) => {
                                            setSelectedTeamId(e.target.value)
                                            setExcludedMemberIds([])
                                        }}
                                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                                    >
                                        {ENTERPRISE_TEAMS.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} ({t.department})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <span className="block font-semibold text-slate-800 mb-1">
                                        Team Members ({selectedTeam.members.length} members)
                                    </span>
                                    <p className="text-[11px] text-slate-500 mb-2">
                                        All members below will receive the task. You may uncheck specific members to exclude them.
                                    </p>

                                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                        {selectedTeam.members.map((m) => {
                                            const isExcluded = excludedMemberIds.includes(m.id)
                                            return (
                                                <label
                                                    key={m.id}
                                                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer ${
                                                        !isExcluded
                                                            ? 'bg-white border-slate-200'
                                                            : 'bg-rose-50/40 border-rose-200 opacity-60'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={!isExcluded}
                                                            onChange={() => handleToggleExcludeMember(m.id)}
                                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <div>
                                                            <span className="font-semibold text-slate-800">{m.name}</span>
                                                            <span className="text-[10px] text-slate-500 ml-2">
                                                                ({m.designation})
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] font-bold ${isExcluded ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        {isExcluded ? 'Excluded' : 'Will Receive'}
                                                    </span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {scope === 'Department' && (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-800">
                                        Department Staff Recipients ({department})
                                    </span>
                                    <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                        {departmentStaff.length} recipients
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    The task directive will be officially routed to all active employees in this department:
                                </p>
                                <div className="max-h-36 overflow-y-auto space-y-1 bg-white p-2 rounded-lg border border-slate-200 pr-1">
                                    {departmentStaff.map((emp) => (
                                        <div key={emp.id} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 last:border-0">
                                            <span className="font-medium text-slate-800">{emp.name}</span>
                                            <span className="text-slate-500">{emp.designation || emp.roleKey}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section C — Detailed Instructions */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-900 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span>Section C — Detailed Instructions <span className="text-rose-500">*</span></span>
                        </div>
                        <textarea
                            rows={4}
                            placeholder="Describe the task, expected outcome, required actions, and any additional instructions..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400 font-sans"
                        />
                    </div>
                </div>

                {/* Modal Footer / Actions */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
                    >
                        Cancel
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleSubmit(true)}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition"
                        >
                            Save as Draft
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSubmit(false)}
                            disabled={isSubmitting}
                            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition active:scale-[0.98]"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// -------------------------------------------------------------
// TASK DETAILS MODAL (Overview, Lifecycle, History, Comments)
// -------------------------------------------------------------
function TaskDetailsModal({
    task,
    onClose,
    onUpdated,
    activeRole,
    currentUserId,
    currentUserName,
    subTab,
    setSubTab
}) {
    const isCreator =
        task.assignedByRole === activeRole ||
        (currentUserId && task.assignedById === currentUserId) ||
        ['super-admin', 'admin', 'director', 'principal'].includes(activeRole)

    const isAssignee =
        task.assigneeRole === activeRole ||
        (currentUserId && task.assigneeUserIds?.includes(currentUserId))

    const [commentText, setCommentText] = useState('')
    const [actionRemark, setActionRemark] = useState('')
    const [evidenceNote, setEvidenceNote] = useState('')
    const [isSubmittingAction, setIsSubmittingAction] = useState(false)
    const [actionPrompt, setActionPrompt] = useState(null) // 'submit' | 'cancel' | 'reject' | null

    const statusBadge = getStatusBadge(task.status)
    const priorityBadge = getPriorityBadge(task.priority)
    const overdue = isTaskOverdue(task)

    // Handle posting a comment
    const handlePostComment = (e) => {
        e.preventDefault()
        if (!commentText.trim()) return
        const updated = addTaskComment(task.id, {
            text: commentText.trim(),
            authorName: currentUserName,
            authorRole: activeRole
        })
        if (updated) {
            setCommentText('')
            onUpdated(updated)
        }
    }

    // Lifecycle Actions
    const handleAcknowledge = () => {
        setIsSubmittingAction(true)
        const updated = acknowledgeTask(task.id, currentUserName, 'Task acknowledged by assignee.')
        setIsSubmittingAction(false)
        if (updated) onUpdated(updated)
    }

    const handleStart = () => {
        setIsSubmittingAction(true)
        const updated = startTask(task.id, currentUserName, 'Assignee began execution of the task.')
        setIsSubmittingAction(false)
        if (updated) onUpdated(updated)
    }

    const handleSubmitEvidence = () => {
        if (!evidenceNote.trim()) return
        setIsSubmittingAction(true)
        const updated = submitTaskForVerification({
            taskId: task.id,
            evidenceText: evidenceNote.trim(),
            submitterName: currentUserName
        })
        setIsSubmittingAction(false)
        setActionPrompt(null)
        setEvidenceNote('')
        if (updated) onUpdated(updated)
    }

    const handleComplete = () => {
        setIsSubmittingAction(true)
        const updated = closeTask({
            taskId: task.id,
            actorName: currentUserName,
            closureRemarks: actionRemark || 'Task approved and completed.'
        })
        setIsSubmittingAction(false)
        setActionRemark('')
        if (updated) onUpdated(updated)
    }

    const handleReject = () => {
        if (!actionRemark.trim()) return
        setIsSubmittingAction(true)
        const updated = rejectTask(task.id, actionRemark.trim(), currentUserName)
        setIsSubmittingAction(false)
        setActionPrompt(null)
        setActionRemark('')
        if (updated) onUpdated(updated)
    }

    const handleCancel = () => {
        if (!actionRemark.trim()) return
        setIsSubmittingAction(true)
        const updated = cancelTask(task.id, actionRemark.trim(), currentUserName)
        setIsSubmittingAction(false)
        setActionPrompt(null)
        setActionRemark('')
        if (updated) onUpdated(updated)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 bg-slate-50/40">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
                                    {task.id}
                                </span>
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${priorityBadge.bg}`}>
                                    {priorityBadge.label} Priority
                                </span>
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}>
                                    {statusBadge.label}
                                </span>
                                {overdue && (
                                    <span className="text-[11px] font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                                        Overdue
                                    </span>
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{task.title}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Sub tabs: Overview | Audit History | Comments */}
                    <div className="flex items-center gap-2 mt-4">
                        <button
                            onClick={() => setSubTab('overview')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                                subTab === 'overview'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Overview</span>
                        </button>
                        <button
                            onClick={() => setSubTab('history')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                                subTab === 'history'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <History className="w-3.5 h-3.5" />
                            <span>Audit Trail ({task.statusHistory?.length || 0})</span>
                        </button>
                        <button
                            onClick={() => setSubTab('comments')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                                subTab === 'comments'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Discussion ({task.comments?.length || 0})</span>
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
                    {/* TAB 1: OVERVIEW */}
                    {subTab === 'overview' && (
                        <div className="space-y-5">
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                                    <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                                        {task.department || task.assignedDepartment || 'General'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Assignment Scope</span>
                                    <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                                        {task.scope || 'Individual'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Created By</span>
                                    <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                                        {task.assignedBy || 'Admin'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Due Date</span>
                                    <span className={`font-semibold text-xs mt-0.5 block ${overdue ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                                        {task.dueDate || '—'}
                                    </span>
                                </div>
                            </div>

                            {/* Assigned Staff Members */}
                            <div className="space-y-1.5">
                                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                                    Assigned Staff Members
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {(task.assigneeNames || []).map((name, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
                                        >
                                            <User className="w-3.5 h-3.5 text-blue-500" />
                                            <span>{name}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Detailed Instructions */}
                            <div className="space-y-1.5">
                                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                                    Detailed Instructions
                                </span>
                                <div className="p-4 bg-white border border-slate-200 rounded-xl whitespace-pre-wrap text-slate-700 leading-relaxed font-sans">
                                    {task.instructions || task.description || 'No detailed instructions recorded.'}
                                </div>
                            </div>

                            {/* Completion Evidence if present */}
                            {task.completionEvidence && (
                                <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                                            <Paperclip className="w-4 h-4 text-purple-600" />
                                            Submitted Completion Evidence
                                        </span>
                                        <span className="text-[10px] text-purple-600 font-medium">
                                            {task.completionEvidence.submittedAt}
                                        </span>
                                    </div>
                                    <p className="text-slate-700 bg-white p-3 rounded-lg border border-purple-100">
                                        {task.completionEvidence.text}
                                    </p>
                                    {task.completionEvidence.fileUrl && (
                                        <div className="flex items-center gap-2 text-blue-600 text-[11px] font-semibold">
                                            <FileText className="w-4 h-4" />
                                            <span>{task.completionEvidence.fileUrl}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Manager Feedback if present */}
                            {task.managerFeedback && (
                                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            Manager Review Feedback
                                        </span>
                                        <span className="text-[10px] text-emerald-600 font-medium">
                                            {task.managerFeedback.reviewedAt}
                                        </span>
                                    </div>
                                    <p className="text-slate-700 bg-white p-3 rounded-lg border border-emerald-100">
                                        {task.managerFeedback.remarks}
                                    </p>
                                </div>
                            )}

                            {/* Action Sub-Prompts for Submit / Cancel / Reject */}
                            {actionPrompt === 'submit' && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                                    <span className="font-bold text-blue-900 block">Submit Task with Deliverables / Evidence</span>
                                    <textarea
                                        rows={3}
                                        placeholder="Describe what was accomplished, deliverables completed, or attach file details..."
                                        value={evidenceNote}
                                        onChange={(e) => setEvidenceNote(e.target.value)}
                                        className="w-full p-2.5 text-xs bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setActionPrompt(null)}
                                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmitEvidence}
                                            disabled={!evidenceNote.trim() || isSubmittingAction}
                                            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                                        >
                                            Confirm Submission
                                        </button>
                                    </div>
                                </div>
                            )}

                            {actionPrompt === 'reject' && (
                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                                    <span className="font-bold text-orange-900 block">Reject Submission / Request Rework</span>
                                    <textarea
                                        rows={3}
                                        placeholder="State specific issues found or required corrections..."
                                        value={actionRemark}
                                        onChange={(e) => setActionRemark(e.target.value)}
                                        className="w-full p-2.5 text-xs bg-white border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800"
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setActionPrompt(null)}
                                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            disabled={!actionRemark.trim() || isSubmittingAction}
                                            className="px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm"
                                        >
                                            Confirm Rejection
                                        </button>
                                    </div>
                                </div>
                            )}

                            {actionPrompt === 'cancel' && (
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                                    <span className="font-bold text-rose-900 block">Cancel Task Directive</span>
                                    <textarea
                                        rows={2}
                                        placeholder="Reason for task cancellation..."
                                        value={actionRemark}
                                        onChange={(e) => setActionRemark(e.target.value)}
                                        className="w-full p-2.5 text-xs bg-white border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setActionPrompt(null)}
                                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                                        >
                                            Close
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            disabled={!actionRemark.trim() || isSubmittingAction}
                                            className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
                                        >
                                            Confirm Cancel Task
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: AUDIT TRAIL */}
                    {subTab === 'history' && (
                        <div className="space-y-3">
                            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                                Chronological Activity History
                            </span>
                            <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                {(task.statusHistory || []).map((h, i) => (
                                    <div key={h.id || i} className="relative pl-9 flex flex-col">
                                        <div className="absolute left-2.5 top-1.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-900 text-xs">
                                                    {h.actor || 'Authority'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {h.timestamp}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                                                    {h.action || 'STATUS_CHANGED'}
                                                </span>
                                                <span className="text-slate-600 text-xs">
                                                    {h.previousStatus && h.newStatus ? (
                                                        <span>
                                                            <strong className="text-slate-700">{h.previousStatus}</strong> &rarr; <strong className="text-blue-600">{h.newStatus}</strong>
                                                        </span>
                                                    ) : (
                                                        h.remarks
                                                    )}
                                                </span>
                                            </div>
                                            {h.remarks && h.previousStatus && (
                                                <p className="text-[11px] text-slate-600 mt-1 italic">
                                                    "{h.remarks}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: DISCUSSION / COMMENTS */}
                    {subTab === 'comments' && (
                        <div className="space-y-4">
                            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                                Task Discussion & Clarifications Thread
                            </span>

                            {/* Comments List */}
                            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                {!task.comments || task.comments.length === 0 ? (
                                    <p className="text-slate-400 text-center py-6">
                                        No comments posted yet. Ask a question or post an update below.
                                    </p>
                                ) : (
                                    task.comments.map((comm) => (
                                        <div key={comm.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-slate-800">{comm.authorName}</span>
                                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded uppercase font-semibold">
                                                        {comm.authorRole}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {comm.timestamp}
                                                </span>
                                            </div>
                                            <p className="text-slate-700 text-xs">{comm.text}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add Comment Input */}
                            <form onSubmit={handlePostComment} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Write a clarification or task update..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                />
                                <button
                                    type="submit"
                                    disabled={!commentText.trim()}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold transition"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Send</span>
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Footer: Contextual Lifecycle Actions */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 font-medium">
                        Progress: <strong className="text-slate-800">{task.progressPercentage || 0}%</strong>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Recipient Actions */}
                        {isAssignee && task.status === 'Assigned' && (
                            <button
                                onClick={handleAcknowledge}
                                disabled={isSubmittingAction}
                                className="px-3.5 py-1.5 text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-xl transition"
                            >
                                Acknowledge Task
                            </button>
                        )}

                        {isAssignee && (task.status === 'Assigned' || task.status === 'Acknowledged' || task.status === 'Rejected') && (
                            <button
                                onClick={handleStart}
                                disabled={isSubmittingAction}
                                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
                            >
                                Start Working
                            </button>
                        )}

                        {isAssignee && task.status === 'In Progress' && (
                            <>
                                <button
                                    onClick={() => setActionPrompt('submit')}
                                    disabled={isSubmittingAction}
                                    className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition"
                                >
                                    Submit Deliverables
                                </button>
                                <button
                                    onClick={handleComplete}
                                    disabled={isSubmittingAction}
                                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
                                >
                                    Mark Complete
                                </button>
                            </>
                        )}

                        {/* Creator Actions */}
                        {isCreator && (task.status === 'Submitted' || task.status === 'Submitted for Verification') && (
                            <>
                                <button
                                    onClick={() => setActionPrompt('reject')}
                                    disabled={isSubmittingAction}
                                    className="px-3.5 py-1.5 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition"
                                >
                                    Request Rework
                                </button>
                                <button
                                    onClick={handleComplete}
                                    disabled={isSubmittingAction}
                                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
                                >
                                    Approve & Complete
                                </button>
                            </>
                        )}

                        {isCreator && task.status !== 'Completed' && task.status !== 'Cancelled' && (
                            <button
                                onClick={() => setActionPrompt('cancel')}
                                disabled={isSubmittingAction}
                                className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            >
                                Cancel Task
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// -------------------------------------------------------------
// QUICK STATUS UPDATE MODAL
// -------------------------------------------------------------
function UpdateStatusModal({ task, onClose, onUpdated, currentUserName }) {
    const [status, setStatus] = useState(task.status || 'In Progress')
    const [remark, setRemark] = useState('')
    const [progress, setProgress] = useState(task.progressPercentage || 0)
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = () => {
        setIsSaving(true)
        const updated = updateTaskStatus(
            task.id,
            status,
            remark.trim() || `Status updated to ${status}`,
            currentUserName,
            status === 'Completed' ? 100 : progress
        )
        setIsSaving(false)
        if (updated) onUpdated(updated)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Update Task Status</h3>
                        <p className="text-[11px] text-slate-500">#{task.id} — {task.title}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-4 text-xs">
                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">New Status</label>
                        <select
                            value={status}
                            onChange={(e) => {
                                const s = e.target.value
                                setStatus(s)
                                if (s === 'Completed') setProgress(100)
                                else if (s === 'In Progress' && progress === 0) setProgress(30)
                            }}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
                        >
                            <option value="Draft">Draft</option>
                            <option value="Assigned">Assigned</option>
                            <option value="Acknowledged">Acknowledged</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Completed">Completed</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <div className="flex justify-between text-slate-700 font-semibold mb-1">
                            <span>Execution Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={progress}
                            onChange={(e) => setProgress(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">Status Note / Remarks</label>
                        <textarea
                            rows={3}
                            placeholder="Add execution note or remarks for audit history..."
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
                    >
                        {isSaving ? 'Saving...' : 'Update Status'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// -------------------------------------------------------------
// EDIT TASK MODAL (For creator to update title, due date, etc.)
// -------------------------------------------------------------
function EditTaskModal({ task, onClose, onUpdated, currentUserName }) {
    const [title, setTitle] = useState(task.title || '')
    const [dueDate, setDueDate] = useState(() => {
        const d = parseTaskDate(task.dueDate)
        return d ? d.toISOString().split('T')[0] : ''
    })
    const [priority, setPriority] = useState(task.priority || 'Medium')
    const [instructions, setInstructions] = useState(task.instructions || task.description || '')
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = () => {
        setIsSaving(true)
        const updated = updateTaskDetails(
            task.id,
            {
                title: title.trim(),
                dueDate,
                priority,
                instructions: instructions.trim()
            },
            currentUserName
        )
        setIsSaving(false)
        if (updated) onUpdated(updated)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Edit Task Directive</h3>
                        <p className="text-[11px] text-slate-500">#{task.id}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-4 text-xs">
                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">Task Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">Detailed Instructions</label>
                        <textarea
                            rows={4}
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !title.trim()}
                        className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}
