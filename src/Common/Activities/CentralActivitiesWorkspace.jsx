import React, { useState, useMemo, useEffect } from 'react'
import {
    Trophy,
    Palette,
    Dumbbell,
    Award,
    BookOpen,
    Landmark,
    Search,
    Filter,
    Calendar,
    Clock,
    MapPin,
    Users,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Plus,
    Download,
    Eye,
    ChevronRight,
    X,
    FileSpreadsheet,
    FileText,
    Sparkles,
    Check,
    List,
    LayoutGrid,
    CalendarDays
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import MultiTierApprovalModal from '../approvals/MultiTierApprovalModal'
import ApprovalHistoryTimeline from '../approvals/ApprovalHistoryTimeline'
import { WORKFLOW_TYPES, canUserActOnTier } from '../approvals/approvalEngine'
import {
    advanceActivityWorkflow,
    enrollStudentInActivity,
    updateStudentActivityAttendance,
    getActivities,
    saveActivities,
    MD_APPROVAL_STATUS,
    mdApprovalBadgeColor,
    getPersonInCharge
} from './activitiesData'

const CATEGORY_TABS = [
    { key: 'all', label: 'All Activities', icon: Trophy, color: 'text-blue-600' },
    { key: 'cultural', label: 'Cultural', icon: Palette, color: 'text-purple-600' },
    { key: 'sports', label: 'Sports & Athletics', icon: Dumbbell, color: 'text-emerald-600' },
    { key: 'chess', label: 'Chess Tournaments', icon: Trophy, color: 'text-amber-600' },
    { key: 'competition', label: 'Competitions & Olympiads', icon: Award, color: 'text-orange-600' },
    { key: 'academic', label: 'Academic & STEM', icon: BookOpen, color: 'text-cyan-600' },
    { key: 'administrative', label: 'Institutional Gala', icon: Landmark, color: 'text-indigo-600' },
]

export default function CentralActivitiesWorkspace({ defaultCategory = 'all', roleKey = 'admin' }) {
    const { role: userRole } = useAuth()
    const isDirectorOrAdmin = ['director', 'admin', 'super-admin'].includes(userRole || roleKey)

    const [activeCategory, setActiveCategory] = useState(defaultCategory)
    const [viewMode, setViewMode] = useState('table') // 'table' | 'cards' | 'timeline'
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'Approved' | 'Pending' | 'Rejected'
    const [selectedActivity, setSelectedActivity] = useState(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [actionFeedback, setActionFeedback] = useState('')
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
    const [activityForApproval, setActivityForApproval] = useState(null)
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
    const [enrollStudentName, setEnrollStudentName] = useState('')
    const [enrollClassName, setEnrollClassName] = useState('Grade 10-A')

    // Form state for new activity
    const [newActivity, setNewActivity] = useState({
        eventName: '',
        type: 'cultural',
        eventType: '',
        className: 'All Students',
        eventDate: '2025-10-15',
        startTime: '09:00 AM',
        endTime: '04:00 PM',
        venue: '',
        personInCharge: '',
        description: '',
        participantCount: 50,
    })

    // Fetch activities
    const allActivities = useMemo(() => {
        void refreshTrigger
        return getActivities()
    }, [refreshTrigger])

    // Filter by category, status, and search
    const filteredActivities = useMemo(() => {
        return allActivities.filter((item) => {
            // Category check
            if (activeCategory === 'chess') {
                const isChess =
                    String(item.eventName || '').toLowerCase().includes('chess') ||
                    String(item.eventType || '').toLowerCase().includes('chess')
                if (!isChess) return false
            } else if (activeCategory !== 'all') {
                if (item.type !== activeCategory) return false
            }

            // Status check
            if (statusFilter !== 'ALL' && item.mdApprovalStatus !== statusFilter) {
                return false
            }

            // Search query
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim()
                const haystack = [
                    item.id,
                    item.eventName,
                    item.eventType,
                    item.venue,
                    item.coordinator,
                    item.coach,
                    item.className,
                    item.description,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()

                if (!haystack.includes(query)) return false
            }

            return true
        })
    }, [allActivities, activeCategory, statusFilter, searchQuery])

    // Aggregated stats
    const stats = useMemo(() => {
        const total = allActivities.length
        const approved = allActivities.filter((a) => a.mdApprovalStatus === MD_APPROVAL_STATUS.APPROVED).length
        const pending = allActivities.filter((a) => a.mdApprovalStatus === MD_APPROVAL_STATUS.PENDING).length
        const totalParticipants = allActivities.reduce(
            (acc, curr) => acc + (curr.participantCount || (curr.players?.length || 30)),
            0
        )
        return { total, approved, pending, totalParticipants }
    }, [allActivities])

    // Handle MD Approval Decision
    const handleApprovalDecision = (activityId, newStatus) => {
        const updated = allActivities.map((act) => {
            if (act.id === activityId) {
                return {
                    ...act,
                    mdApprovalStatus: newStatus,
                    approvalDecisionDate: new Date().toLocaleDateString('en-GB'),
                }
            }
            return act
        })
        saveActivities(updated)
        setRefreshTrigger((k) => k + 1)
        if (selectedActivity && selectedActivity.id === activityId) {
            setSelectedActivity((prev) => ({
                ...prev,
                mdApprovalStatus: newStatus,
                approvalDecisionDate: new Date().toLocaleDateString('en-GB'),
            }))
        }
        setActionFeedback(`Activity marked as ${newStatus}`)
        setTimeout(() => setActionFeedback(''), 3000)
    }

    // Handle Add New Activity
    const handleCreateActivity = (e) => {
        e.preventDefault()
        if (!newActivity.eventName.trim() || !newActivity.venue.trim()) {
            alert('Please enter activity title and venue.')
            return
        }

        const idPrefix = newActivity.type === 'sports' ? 'SPT' : newActivity.type === 'cultural' ? 'CUL' : 'CMP'
        const randomNum = Math.floor(100 + Math.random() * 900)
        const id = `ACT-${idPrefix}-${randomNum}`

        const created = {
            id,
            type: newActivity.type,
            eventName: newActivity.eventName.trim(),
            eventType: newActivity.eventType.trim() || 'School Event',
            className: newActivity.className,
            eventDate: newActivity.eventDate,
            startTime: newActivity.startTime,
            endTime: newActivity.endTime,
            venue: newActivity.venue.trim(),
            coordinator: newActivity.type === 'sports' ? '' : newActivity.personInCharge.trim(),
            coach: newActivity.type === 'sports' ? newActivity.personInCharge.trim() : '',
            description: newActivity.description.trim() || 'Institutional extracurricular event.',
            submittedBy: userRole || 'Admin',
            mdApprovalStatus: isDirectorOrAdmin ? MD_APPROVAL_STATUS.APPROVED : MD_APPROVAL_STATUS.PENDING,
            submittedDate: new Date().toLocaleDateString('en-GB'),
            participantCount: Number(newActivity.participantCount) || 40,
        }

        const updated = [created, ...allActivities]
        saveActivities(updated)
        setRefreshTrigger((k) => k + 1)
        setIsAddModalOpen(false)
        setNewActivity({
            eventName: '',
            type: 'cultural',
            eventType: '',
            className: 'All Students',
            eventDate: '2025-10-15',
            startTime: '09:00 AM',
            endTime: '04:00 PM',
            venue: '',
            personInCharge: '',
            description: '',
            participantCount: 50,
        })
        setActionFeedback('Activity successfully created and logged into ledger.')
        setTimeout(() => setActionFeedback(''), 3000)
    }

    // Export activity records to CSV
    const handleExportCSV = () => {
        const headers = ['ID', 'Event Name', 'Category', 'Date', 'Venue', 'In Charge', 'Participants', 'MD Status']
        const rows = filteredActivities.map((a) => [
            a.id,
            `"${(a.eventName || '').replace(/"/g, '""')}"`,
            a.type,
            a.eventDate,
            `"${(a.venue || '').replace(/"/g, '""')}"`,
            `"${(a.coordinator || a.coach || '').replace(/"/g, '""')}"`,
            a.participantCount || a.players?.length || 0,
            a.mdApprovalStatus,
        ])
        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `activities_ledger_${activeCategory}_${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    
    const handleWorkflowDecision = async ({ decision, remarks, actor, actorRole }) => {
        if (!activityForApproval) return
        advanceActivityWorkflow({
            activityId: activityForApproval.id,
            decision,
            actor,
            actorRole,
            remarks
        })
        setActionFeedback(`Activity '${activityForApproval.id}' authorized with '${decision}' decision.`)
        setRefreshTrigger((k) => k + 1)
        setSelectedActivity(null)
        setTimeout(() => setActionFeedback(''), 4000)
    }

    const handleEnrollStudent = (e) => {
        e.preventDefault()
        if (!selectedActivity || !enrollStudentName.trim()) return
        enrollStudentInActivity(selectedActivity.id, {
            studentName: enrollStudentName.trim(),
            className: enrollClassName
        })
        setActionFeedback(`Student '${enrollStudentName.trim()}' enrolled in ${selectedActivity.eventName}.`)
        setEnrollStudentName('')
        setIsEnrollModalOpen(false)
        setRefreshTrigger((k) => k + 1)
        setTimeout(() => setActionFeedback(''), 3000)
    }

    return (
        <div className='space-y-6 pb-12 font-inter text-slate-800'>
            {/* Action Feedback Banner */}
            {actionFeedback && (
                <div className='flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-800 animate-fadeIn'>
                    <CheckCircle2 size={16} className='text-emerald-600 shrink-0' />
                    <span>{actionFeedback}</span>
                </div>
            )}

            {/* Header: Title + Primary Actions */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <div className='flex items-center gap-2.5'>
                        <div className='p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100'>
                            <Trophy size={20} />
                        </div>
                        <div>
                            <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                                Activities & Extracurricular Workspace
                            </h1>
                            <p className='text-xs text-slate-500 mt-0.5'>
                                Centralized ledger across Cultural, Sports, Competitions, Chess Championships, and Institutional Events.
                            </p>
                        </div>
                    </div>
                </div>

                <div className='flex items-center gap-2.5'>
                    <button
                        onClick={handleExportCSV}
                        className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition'
                    >
                        <Download size={14} /> Export Ledger
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition'
                    >
                        <Plus size={14} /> Add New Activity
                    </button>
                </div>
            </div>

            {/* Metric KPI Cards (Reference Visual Standard) */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='rounded-[1.25rem] border border-blue-100 bg-[#E8F1FD]/60 p-4 shadow-2xs'>
                    <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-slate-600'>Total Activities</span>
                        <Trophy size={16} className='text-blue-600' />
                    </div>
                    <p className='mt-2 text-2xl font-bold tracking-tight text-slate-900'>{stats.total}</p>
                    <p className='mt-1 text-[11px] text-slate-500'>Across 6 domains & campus wings</p>
                </div>

                <div className='rounded-[1.25rem] border border-emerald-100 bg-emerald-50/50 p-4 shadow-2xs'>
                    <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-slate-600'>MD Approved Events</span>
                        <CheckCircle2 size={16} className='text-emerald-600' />
                    </div>
                    <p className='mt-2 text-2xl font-bold tracking-tight text-emerald-900'>{stats.approved}</p>
                    <p className='mt-1 text-[11px] text-emerald-700 font-medium'>Ready & scheduled on calendar</p>
                </div>

                <div className='rounded-[1.25rem] border border-amber-100 bg-amber-50/50 p-4 shadow-2xs'>
                    <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-slate-600'>Pending MD Review</span>
                        <AlertCircle size={16} className='text-amber-600' />
                    </div>
                    <p className='mt-2 text-2xl font-bold tracking-tight text-amber-900'>{stats.pending}</p>
                    <p className='mt-1 text-[11px] text-amber-700 font-medium'>Awaiting director sign-off</p>
                </div>

                <div className='rounded-[1.25rem] border border-purple-100 bg-purple-50/50 p-4 shadow-2xs'>
                    <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-slate-600'>Total Student Engaged</span>
                        <Users size={16} className='text-purple-600' />
                    </div>
                    <p className='mt-2 text-2xl font-bold tracking-tight text-purple-900'>
                        {stats.totalParticipants.toLocaleString()}+
                    </p>
                    <p className='mt-1 text-[11px] text-purple-700 font-medium'>Active participant entries</p>
                </div>
            </div>

            {/* Category Navigation Pills */}
            <div className='flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none'>
                {CATEGORY_TABS.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeCategory === tab.key
                    const count =
                        tab.key === 'all'
                            ? allActivities.length
                            : tab.key === 'chess'
                            ? allActivities.filter((a) =>
                                  String(a.eventName || '').toLowerCase().includes('chess')
                              ).length
                            : allActivities.filter((a) => a.type === tab.key).length

                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveCategory(tab.key)}
                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                                isActive
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Icon size={14} className={isActive ? 'text-white' : tab.color} />
                            <span>{tab.label}</span>
                            <span
                                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Filter and Control Bar */}
            <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
                {/* Search */}
                <div className='relative flex-1 min-w-[240px]'>
                    <Search className='absolute left-3 top-2.5 text-slate-400' size={14} />
                    <input
                        type='text'
                        placeholder='Search activities by name, venue, coach or class...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none'
                    />
                </div>

                {/* Filters & View Modes */}
                <div className='flex items-center gap-2 flex-wrap'>
                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className='rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none'
                    >
                        <option value='ALL'>All Statuses</option>
                        <option value='Approved'>Approved Only</option>
                        <option value='Pending'>Pending Review</option>
                        <option value='Rejected'>Rejected</option>
                    </select>

                    {/* View Switcher */}
                    <div className='inline-flex items-center rounded-xl border border-slate-200 bg-slate-50/50 p-1'>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-lg transition ${
                                viewMode === 'table' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
                            }`}
                            title='Table View'
                        >
                            <List size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`p-1.5 rounded-lg transition ${
                                viewMode === 'cards' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
                            }`}
                            title='Cards Grid View'
                        >
                            <LayoutGrid size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`p-1.5 rounded-lg transition ${
                                viewMode === 'timeline' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
                            }`}
                            title='Chronological Timeline'
                        >
                            <CalendarDays size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area Based on viewMode */}
            {filteredActivities.length === 0 ? (
                <div className='rounded-2xl border border-slate-200 bg-white p-12 text-center'>
                    <div className='w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3'>
                        <Trophy size={24} />
                    </div>
                    <h3 className='text-sm font-bold text-slate-900'>No activities found</h3>
                    <p className='text-xs text-slate-500 mt-1 max-w-sm mx-auto'>
                        No activities match your current category and filter criteria. Adjust your filters or add a new activity above.
                    </p>
                </div>
            ) : viewMode === 'table' ? (
                /* TABLE VIEW */
                <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-left text-xs'>
                            <thead>
                                <tr className='border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                    <th className='py-3 px-4'>ID & Event</th>
                                    <th className='py-3 px-4'>Category</th>
                                    <th className='py-3 px-4'>Date & Time</th>
                                    <th className='py-3 px-4'>Venue</th>
                                    <th className='py-3 px-4'>Coordinator / Coach</th>
                                    <th className='py-3 px-4'>Participants</th>
                                    <th className='py-3 px-4'>MD Status</th>
                                    <th className='py-3 px-4 text-right'>Action</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100 text-slate-700'>
                                {filteredActivities.map((act) => {
                                    const inCharge = getPersonInCharge(act)
                                    const count = act.participantCount || act.players?.length || 30
                                    const isApproved = act.mdApprovalStatus === MD_APPROVAL_STATUS.APPROVED
                                    const isPending = act.mdApprovalStatus === MD_APPROVAL_STATUS.PENDING

                                    return (
                                        <tr key={act.id} className='hover:bg-slate-50/70 transition'>
                                            <td className='py-3 px-4'>
                                                <div className='min-w-[200px]'>
                                                    <span className='font-mono font-bold text-[10px] text-blue-600 block'>
                                                        {act.id}
                                                    </span>
                                                    <span className='font-semibold text-slate-900 block mt-0.5 line-clamp-1'>
                                                        {act.eventName}
                                                    </span>
                                                    <span className='text-[11px] text-slate-400'>
                                                        {act.eventType} · {act.className}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className='py-3 px-4'>
                                                <span className='capitalize font-medium text-slate-700'>
                                                    {act.type}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4 whitespace-nowrap'>
                                                <div className='flex items-center gap-1.5 text-slate-800 font-medium'>
                                                    <Calendar size={12} className='text-slate-400' />
                                                    <span>{act.eventDate}</span>
                                                </div>
                                                <div className='flex items-center gap-1 text-[11px] text-slate-400 mt-0.5'>
                                                    <Clock size={11} />
                                                    <span>
                                                        {act.startTime} - {act.endTime}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className='py-3 px-4'>
                                                <div className='flex items-center gap-1.5 text-slate-700 max-w-[180px] truncate'>
                                                    <MapPin size={12} className='text-slate-400 shrink-0' />
                                                    <span className='truncate'>{act.venue}</span>
                                                </div>
                                            </td>
                                            <td className='py-3 px-4'>
                                                <span className='font-medium text-slate-800'>{inCharge || 'Principal Office'}</span>
                                            </td>
                                            <td className='py-3 px-4'>
                                                <span className='rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-700 text-[11px]'>
                                                    {count} Students
                                                </span>
                                            </td>
                                            <td className='py-3 px-4'>
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                        isApproved
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                            : isPending
                                                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                            : 'bg-red-50 text-red-700 border border-red-100'
                                                    }`}
                                                >
                                                    {isApproved ? (
                                                        <CheckCircle2 size={10} />
                                                    ) : isPending ? (
                                                        <AlertCircle size={10} />
                                                    ) : (
                                                        <XCircle size={10} />
                                                    )}
                                                    {act.mdApprovalStatus}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4 text-right'>
                                                <button
                                                    onClick={() => setSelectedActivity(act)}
                                                    className='inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition'
                                                >
                                                    <Eye size={12} /> Inspect
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : viewMode === 'cards' ? (
                /* CARDS GRID VIEW */
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
                    {filteredActivities.map((act) => {
                        const inCharge = getPersonInCharge(act)
                        const count = act.participantCount || act.players?.length || 30
                        const isApproved = act.mdApprovalStatus === MD_APPROVAL_STATUS.APPROVED

                        return (
                            <div
                                key={act.id}
                                className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-blue-300 transition flex flex-col justify-between'
                            >
                                <div>
                                    <div className='flex items-center justify-between gap-2 mb-2'>
                                        <span className='rounded bg-blue-50 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-700'>
                                            {act.id}
                                        </span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                isApproved
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                                            }`}
                                        >
                                            {act.mdApprovalStatus}
                                        </span>
                                    </div>

                                    <h4 className='font-bold text-slate-900 text-sm line-clamp-2'>
                                        {act.eventName}
                                    </h4>
                                    <p className='text-xs text-slate-500 mt-1 line-clamp-2'>{act.description}</p>

                                    <div className='mt-4 space-y-2 text-xs border-t border-slate-100 pt-3'>
                                        <div className='flex items-center gap-2 text-slate-700'>
                                            <Calendar size={13} className='text-slate-400' />
                                            <span>
                                                {act.eventDate} ({act.startTime} - {act.endTime})
                                            </span>
                                        </div>
                                        <div className='flex items-center gap-2 text-slate-700'>
                                            <MapPin size={13} className='text-slate-400' />
                                            <span className='truncate'>{act.venue}</span>
                                        </div>
                                        <div className='flex items-center gap-2 text-slate-700'>
                                            <Users size={13} className='text-slate-400' />
                                            <span>
                                                {count} Participants · In charge: {inCharge || 'Principal Office'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className='mt-4 pt-3 border-t border-slate-100 flex items-center justify-between'>
                                    <span className='capitalize text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded'>
                                        {act.type}
                                    </span>
                                    <button
                                        onClick={() => setSelectedActivity(act)}
                                        className='inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800'
                                    >
                                        Inspect Details <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                /* CHRONOLOGICAL TIMELINE VIEW */
                <div className='rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs'>
                    <div className='relative border-l-2 border-blue-200 ml-4 space-y-8 pl-6 py-2'>
                        {filteredActivities.map((act) => {
                            const inCharge = getPersonInCharge(act)
                            const isApproved = act.mdApprovalStatus === MD_APPROVAL_STATUS.APPROVED

                            return (
                                <div key={act.id} className='relative group'>
                                    {/* Circle dot on line */}
                                    <div
                                        className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                                            isApproved ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`}
                                    />

                                    <div className='rounded-xl border border-slate-100 bg-slate-50/60 p-4 hover:bg-blue-50/30 transition'>
                                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                                            <div>
                                                <span className='text-[10px] font-bold font-mono text-blue-600'>
                                                    {act.eventDate} · {act.startTime}
                                                </span>
                                                <h4 className='font-bold text-slate-900 text-sm mt-0.5'>
                                                    {act.eventName}
                                                </h4>
                                            </div>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold self-start ${
                                                    isApproved
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                }`}
                                            >
                                                {act.mdApprovalStatus}
                                            </span>
                                        </div>

                                        <p className='text-xs text-slate-500 mt-1'>{act.description}</p>
                                        <div className='mt-2 flex items-center gap-4 text-[11px] text-slate-500'>
                                            <span className='flex items-center gap-1'>
                                                <MapPin size={11} /> {act.venue}
                                            </span>
                                            <span>In Charge: {inCharge || 'Principal Office'}</span>
                                        </div>

                                        <div className='mt-3 flex justify-end'>
                                            <button
                                                onClick={() => setSelectedActivity(act)}
                                                className='text-xs font-semibold text-blue-600 hover:underline'
                                            >
                                                View Complete Details →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* DETAIL SLIDE-OVER DRAWER */}
            {selectedActivity && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-scaleUp'>
                        {/* Drawer Header */}
                        <div className='flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70'>
                            <div className='flex items-center gap-2'>
                                <span className='font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded'>
                                    {selectedActivity.id}
                                </span>
                                <span className='capitalize text-xs font-semibold text-slate-600'>
                                    {selectedActivity.type} Activity
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedActivity(null)}
                                className='p-1.5 rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700'
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className='flex-1 overflow-y-auto p-6 space-y-5 text-xs'>
                            <div>
                                <h3 className='text-lg font-bold text-slate-900 leading-snug'>
                                    {selectedActivity.eventName}
                                </h3>
                                <p className='text-slate-500 text-xs mt-1'>{selectedActivity.description}</p>
                            </div>

                            {/* Details Grid */}
                            <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                                <div className='rounded-xl bg-slate-50 p-3'>
                                    <span className='text-[10px] text-slate-400 font-semibold uppercase'>Event Date</span>
                                    <p className='font-bold text-slate-900 mt-0.5'>{selectedActivity.eventDate}</p>
                                </div>
                                <div className='rounded-xl bg-slate-50 p-3'>
                                    <span className='text-[10px] text-slate-400 font-semibold uppercase'>Timing</span>
                                    <p className='font-bold text-slate-900 mt-0.5'>
                                        {selectedActivity.startTime} - {selectedActivity.endTime}
                                    </p>
                                </div>
                                <div className='rounded-xl bg-slate-50 p-3'>
                                    <span className='text-[10px] text-slate-400 font-semibold uppercase'>Venue</span>
                                    <p className='font-bold text-slate-900 mt-0.5 truncate'>{selectedActivity.venue}</p>
                                </div>
                                <div className='rounded-xl bg-slate-50 p-3'>
                                    <span className='text-[10px] text-slate-400 font-semibold uppercase'>Person in Charge</span>
                                    <p className='font-bold text-slate-900 mt-0.5'>
                                        {getPersonInCharge(selectedActivity) || 'Principal Office'}
                                    </p>
                                </div>
                                <div className='rounded-xl bg-slate-50 p-3'>
                                    <span className='text-[10px] text-slate-400 font-semibold uppercase'>Target Audience</span>
                                    <p className='font-bold text-slate-900 mt-0.5'>{selectedActivity.className}</p>
                                </div>
                                <div className='rounded-xl bg-slate-50 p-3'>
                                    <span className='text-[10px] text-slate-400 font-semibold uppercase'>MD Approval</span>
                                    <p className='font-bold text-emerald-700 mt-0.5'>{selectedActivity.mdApprovalStatus}</p>
                                </div>
                            </div>


                            {/* Multi-Tier Approval Decision History */}
                            {selectedActivity.approvalHistory && selectedActivity.approvalHistory.length > 0 && (
                                <div className='pt-2'>
                                    <ApprovalHistoryTimeline history={selectedActivity.approvalHistory} title='Approval Chain Decisions' />
                                </div>
                            )}

                            {/* Enrolled Participants Roster */}
                            {selectedActivity.participants && selectedActivity.participants.length > 0 && (
                                <div className='space-y-2 border-t border-slate-100 pt-4'>
                                    <div className='flex items-center justify-between'>
                                        <h4 className='font-bold text-slate-900 text-xs flex items-center gap-1.5'>
                                            <Users size={14} className='text-blue-600' /> Enrolled Student Participants ({selectedActivity.participants.length})
                                        </h4>
                                    </div>
                                    <div className='overflow-x-auto rounded-xl border border-slate-200'>
                                        <table className='w-full text-left text-xs'>
                                            <thead className='bg-slate-50 text-[10px] text-slate-500 uppercase font-semibold'>
                                                <tr>
                                                    <th className='py-2 px-3'>Student</th>
                                                    <th className='py-2 px-3'>Class</th>
                                                    <th className='py-2 px-3'>Enrolled Date</th>
                                                    <th className='py-2 px-3 text-center'>Attendance</th>
                                                    <th className='py-2 px-3'>Result / Award</th>
                                                </tr>
                                            </thead>
                                            <tbody className='divide-y divide-slate-100'>
                                                {selectedActivity.participants.map((p) => (
                                                    <tr key={p.studentId} className='hover:bg-slate-50'>
                                                        <td className='py-2 px-3 font-semibold text-slate-800'>{p.studentName}</td>
                                                        <td className='py-2 px-3 text-slate-600'>{p.className}</td>
                                                        <td className='py-2 px-3 text-slate-500 font-mono text-[11px]'>{p.enrolledAt}</td>
                                                        <td className='py-2 px-3 text-center'>
                                                            <button
                                                                onClick={() => {
                                                                    updateStudentActivityAttendance(selectedActivity.id, p.studentId, !p.attended)
                                                                    setRefreshTrigger((k) => k + 1)
                                                                }}
                                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                                    p.attended
                                                                        ? 'bg-emerald-100 text-emerald-800'
                                                                        : 'bg-slate-100 text-slate-600'
                                                                }`}
                                                            >
                                                                {p.attended ? '✓ Attended' : 'Mark Present'}
                                                            </button>
                                                        </td>
                                                        <td className='py-2 px-3 font-medium text-blue-700'>{p.award || p.result || 'Enrolled'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Players Table if Tournament / Chess results */}
                            {selectedActivity.players && selectedActivity.players.length > 0 && (
                                <div className='space-y-2 border-t border-slate-100 pt-4'>
                                    <div className='flex items-center justify-between'>
                                        <h4 className='font-bold text-slate-900 text-xs flex items-center gap-1.5'>
                                            <Trophy size={14} className='text-amber-500' /> Participant Rankings & Tournament Standings
                                        </h4>
                                        <span className='text-[11px] text-slate-500 font-semibold'>
                                            {selectedActivity.players.length} Competitors
                                        </span>
                                    </div>

                                    <div className='overflow-x-auto rounded-xl border border-slate-200'>
                                        <table className='w-full text-left text-xs'>
                                            <thead>
                                                <tr className='bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase'>
                                                    <th className='py-2 px-3'>Rank</th>
                                                    <th className='py-2 px-3'>Player Name</th>
                                                    <th className='py-2 px-3'>Category</th>
                                                    <th className='py-2 px-3'>Class</th>
                                                    <th className='py-2 px-3'>Score</th>
                                                    <th className='py-2 px-3'>Result</th>
                                                </tr>
                                            </thead>
                                            <tbody className='divide-y divide-slate-100'>
                                                {selectedActivity.players.map((p) => (
                                                    <tr key={p.id} className='hover:bg-slate-50'>
                                                        <td className='py-2 px-3 font-mono font-bold text-slate-800'>
                                                            #{p.rank}
                                                        </td>
                                                        <td className='py-2 px-3 font-semibold text-slate-900'>{p.name}</td>
                                                        <td className='py-2 px-3 text-slate-600'>{p.category}</td>
                                                        <td className='py-2 px-3 text-slate-600'>{p.className}</td>
                                                        <td className='py-2 px-3 font-mono font-bold text-blue-700'>
                                                            {p.score}
                                                        </td>
                                                        <td className='py-2 px-3'>
                                                            <span
                                                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                                                    p.result === 'Winner'
                                                                        ? 'bg-emerald-50 text-emerald-700'
                                                                        : p.result === 'Runner Up'
                                                                        ? 'bg-blue-50 text-blue-700'
                                                                        : 'bg-slate-100 text-slate-600'
                                                                }`}
                                                            >
                                                                {p.result}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Drawer Actions */}
                        <div className='border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-between'>
                            <button
                                onClick={() => setSelectedActivity(null)}
                                className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100'
                            >
                                Close
                            </button>

                            <div className='flex items-center gap-2'>
                                <button
                                    onClick={() => setIsEnrollModalOpen(true)}
                                    className='rounded-xl border border-blue-200 bg-blue-50 text-blue-700 px-3 py-2 text-xs font-semibold hover:bg-blue-100 transition'
                                >
                                    + Enroll Participant
                                </button>
                                {selectedActivity.mdApprovalStatus !== 'Approved' && (
                                    <button
                                        onClick={() => {
                                            setActivityForApproval(selectedActivity)
                                            setIsApprovalModalOpen(true)
                                        }}
                                        className='rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-bold hover:bg-blue-700 shadow-xs transition'
                                    >
                                        Review & Authorize ✍️
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* MULTI-TIER APPROVAL MODAL */}
            <MultiTierApprovalModal
                isOpen={isApprovalModalOpen}
                onClose={() => {
                    setIsApprovalModalOpen(false)
                    setActivityForApproval(null)
                }}
                workflowType={WORKFLOW_TYPES.EXTRA_CURRICULAR_ACTIVITY}
                entity={activityForApproval}
                onConfirmDecision={handleWorkflowDecision}
                currentUserRole={userRole || roleKey}
                currentUserName={userRole || 'Authorized Approver'}
            />

            {/* ENROLL STUDENT MODAL */}
            {isEnrollModalOpen && selectedActivity && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn font-inter'>
                    <div className='w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-sm font-bold text-slate-900'>Enroll Student Participant</h3>
                            <button onClick={() => setIsEnrollModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleEnrollStudent} className='space-y-3 text-xs'>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Student Full Name *</label>
                                <input
                                    type='text'
                                    required
                                    value={enrollStudentName}
                                    onChange={(e) => setEnrollStudentName(e.target.value)}
                                    placeholder='e.g. Aarav Sharma'
                                    className='w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-blue-500'
                                />
                            </div>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Grade & Section</label>
                                <input
                                    type='text'
                                    value={enrollClassName}
                                    onChange={(e) => setEnrollClassName(e.target.value)}
                                    placeholder='e.g. Grade 10-A'
                                    className='w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-blue-500'
                                />
                            </div>
                            <div className='flex justify-end gap-2 pt-2'>
                                <button
                                    type='button'
                                    onClick={() => setIsEnrollModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 shadow-xs'
                                >
                                    Confirm Enrolment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD ACTIVITY MODAL */}
            {isAddModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-scaleUp'>
                        <div className='flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70'>
                            <div className='flex items-center gap-2'>
                                <Plus size={16} className='text-blue-600' />
                                <h3 className='font-bold text-slate-900 text-sm'>Create Institutional Activity</h3>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className='p-1.5 rounded-lg text-slate-400 hover:bg-slate-200/60'
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateActivity} className='p-6 space-y-4 text-xs'>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Event Title / Name *</label>
                                <input
                                    type='text'
                                    required
                                    value={newActivity.eventName}
                                    onChange={(e) =>
                                        setNewActivity((prev) => ({ ...prev, eventName: e.target.value }))
                                    }
                                    placeholder='e.g., Annual Science Fest & Robotics Exposition'
                                    className='w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Activity Category</label>
                                    <select
                                        value={newActivity.type}
                                        onChange={(e) =>
                                            setNewActivity((prev) => ({ ...prev, type: e.target.value }))
                                        }
                                        className='w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none'
                                    >
                                        <option value='cultural'>Cultural & Arts</option>
                                        <option value='sports'>Sports & Athletics</option>
                                        <option value='competition'>Competition & Olympiad</option>
                                        <option value='academic'>Academic & STEM</option>
                                        <option value='administrative'>Institutional Gala</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Subtype / Event Format</label>
                                    <input
                                        type='text'
                                        value={newActivity.eventType}
                                        onChange={(e) =>
                                            setNewActivity((prev) => ({ ...prev, eventType: e.target.value }))
                                        }
                                        placeholder='e.g., Debate / Tournament / Quiz'
                                        className='w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none'
                                    >
                                    </input>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Event Date</label>
                                    <input
                                        type='date'
                                        required
                                        value={newActivity.eventDate}
                                        onChange={(e) =>
                                            setNewActivity((prev) => ({ ...prev, eventDate: e.target.value }))
                                        }
                                        className='w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Venue / Location *</label>
                                    <input
                                        type='text'
                                        required
                                        value={newActivity.venue}
                                        onChange={(e) =>
                                            setNewActivity((prev) => ({ ...prev, venue: e.target.value }))
                                        }
                                        placeholder='e.g., Main Auditorium, Senior Lab 1'
                                        className='w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Coordinator / Coach</label>
                                    <input
                                        type='text'
                                        value={newActivity.personInCharge}
                                        onChange={(e) =>
                                            setNewActivity((prev) => ({ ...prev, personInCharge: e.target.value }))
                                        }
                                        placeholder='e.g., Sunita Rao / Coach Vikram'
                                        className='w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Expected Participants</label>
                                    <input
                                        type='number'
                                        value={newActivity.participantCount}
                                        onChange={(e) =>
                                            setNewActivity((prev) => ({ ...prev, participantCount: e.target.value }))
                                        }
                                        className='w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Description & Objective</label>
                                <textarea
                                    rows={3}
                                    value={newActivity.description}
                                    onChange={(e) =>
                                        setNewActivity((prev) => ({ ...prev, description: e.target.value }))
                                    }
                                    placeholder='Brief summary of activity objectives, rules, and student schedule...'
                                    className='w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none resize-none'
                                />
                            </div>

                            <div className='border-t border-slate-100 pt-4 flex items-center justify-end gap-2'>
                                <button
                                    type='button'
                                    onClick={() => setIsAddModalOpen(false)}
                                    className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs'
                                >
                                    Save & Publish Activity
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

