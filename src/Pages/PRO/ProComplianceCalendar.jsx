import React, { useEffect, useState, useMemo } from 'react'
import {
    Calendar as CalendarIcon,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Filter,
    Plus,
    Building2,
    RefreshCw,
    Search,
    ChevronRight,
    Tag,
    X,
    ShieldAlert
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { proService } from '../../services/modules/proService'

const ProComplianceCalendar = () => {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [urgencyFilter, setUrgencyFilter] = useState('ALL')
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    // New event form state
    const [newEvent, setNewEvent] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        type: 'Correspondence',
        department: '',
        priority: 'Normal',
        notes: '',
        statutoryAuthority: '',
    })

    const loadCalendarEvents = async () => {
        setLoading(true)
        try {
            const res = await proService.getComplianceCalendar()
            if (res.success && Array.isArray(res.data)) {
                setEvents(res.data)
            }
        } catch (err) {
            console.error('Failed to load compliance calendar:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadCalendarEvents()
    }, [])

    const filteredEvents = useMemo(() => {
        return events.filter((ev) => {
            const matchesUrgency =
                urgencyFilter === 'ALL' ||
                (urgencyFilter === 'CRITICAL' && ev.priority === 'Critical') ||
                (urgencyFilter === 'URGENT' && ev.priority === 'Urgent') ||
                (urgencyFilter === 'NORMAL' && ev.priority === 'Normal')

            const matchesCategory =
                categoryFilter === 'ALL' || ev.type === categoryFilter

            const query = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !query ||
                ev.title.toLowerCase().includes(query) ||
                ev.department?.toLowerCase().includes(query) ||
                ev.type.toLowerCase().includes(query)

            return matchesUrgency && matchesCategory && matchesSearch
        })
    }, [events, urgencyFilter, categoryFilter, searchQuery])

    const handleCreateEvent = async (e) => {
        e.preventDefault()
        if (!newEvent.title || !newEvent.department || !newEvent.date) {
            alert('Please fill in all mandatory fields.')
            return
        }

        const customItem = {
            id: `CAL-CUSTOM-${Date.now()}`,
            title: newEvent.title,
            date: newEvent.date,
            type: newEvent.type,
            department: newEvent.department,
            status: 'Scheduled',
            priority: newEvent.priority,
            notes: newEvent.notes,
        }

        setEvents((prev) => [...prev, customItem].sort((a, b) => new Date(a.date) - new Date(b.date)))
        setShowAddModal(false)
        setNewEvent({
            title: '',
            date: new Date().toISOString().split('T')[0],
            type: 'Correspondence',
            department: '',
            priority: 'Normal',
            notes: '',
            statutoryAuthority: '',
        })
        setFeedbackMessage('New compliance milestone recorded in statutory calendar.')
        setTimeout(() => setFeedbackMessage(''), 4000)
    }

    const handleToggleStatus = (eventId) => {
        setEvents((prev) =>
            prev.map((ev) => {
                if (ev.id === eventId) {
                    const isClosed = ev.status === 'Complied & Closed' || ev.status === 'Completed'
                    return {
                        ...ev,
                        status: isClosed ? 'Pending Compliance' : 'Complied & Closed',
                    }
                }
                return ev
            })
        )
        setFeedbackMessage('Compliance milestone status updated.')
        setTimeout(() => setFeedbackMessage(''), 3000)
    }

    const columns = [
        {
            key: 'date',
            label: 'Deadline Date',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-2'>
                    <CalendarIcon className='w-4 h-4 text-slate-400' />
                    <span className='font-mono font-medium text-slate-900'>{row.date}</span>
                </div>
            ),
        },
        {
            key: 'title',
            label: 'Milestone / Compliance Obligation',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-semibold text-slate-900'>{row.title}</div>
                    <div className='text-xs text-slate-500 flex items-center gap-2 mt-0.5'>
                        <span className='bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]'>{row.type}</span>
                        <span>{row.department}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'priority',
            label: 'Urgency Tier',
            required: true,
            render: (row) => (
                <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        row.priority === 'Critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : row.priority === 'Urgent'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                    }`}
                >
                    {row.priority}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Compliance Status',
            required: true,
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'actions',
            label: 'Action',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => handleToggleStatus(row.id)}
                        className='text-xs px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold transition-colors'
                    >
                        {row.status === 'Complied & Closed' || row.status === 'Completed' ? 'Re-open' : 'Mark Complied'}
                    </button>
                    <button
                        type='button'
                        onClick={() => setSelectedEvent(row)}
                        className='text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors'
                    >
                        Details
                    </button>
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
                            <Building2 className='w-4 h-4' />
                            Statutory &amp; Regulatory Compliance
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Statutory Compliance Calendar
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Master registry of government filing deadlines, NOC expirations, inspection schedules, and board compliance submissions.
                        </p>
                    </div>
                    <div className='flex items-center gap-3'>
                        <button
                            type='button'
                            onClick={loadCalendarEvents}
                            className='inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            type='button'
                            onClick={() => setShowAddModal(true)}
                            className='inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Add Compliance Event
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
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div className='flex flex-wrap items-center gap-2'>
                    <div className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700'>
                        <Filter className='w-3.5 h-3.5 text-slate-500' />
                        <span>Urgency:</span>
                    </div>
                    {['ALL', 'CRITICAL', 'URGENT', 'NORMAL'].map((urg) => (
                        <button
                            key={urg}
                            type='button'
                            onClick={() => setUrgencyFilter(urg)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                                urgencyFilter === urg
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                            {urg === 'ALL' ? 'All Tiers' : urg.charAt(0) + urg.slice(1).toLowerCase()}
                        </button>
                    ))}

                    <div className='h-4 w-px bg-slate-200 mx-2 hidden sm:block' />

                    <div className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700'>
                        <Tag className='w-3.5 h-3.5 text-slate-500' />
                        <span>Category:</span>
                    </div>
                    {['ALL', 'Correspondence', 'Permit Renewal', 'Government Inspection'].map((cat) => (
                        <button
                            key={cat}
                            type='button'
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                                categoryFilter === cat
                                    ? 'bg-teal-700 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                            {cat === 'ALL' ? 'All Types' : cat}
                        </button>
                    ))}
                </div>

                <div className='relative w-full md:w-64'>
                    <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search compliance items...'
                        className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
                    />
                </div>
            </div>

            {/* Events Data Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Statutory Event Schedule ({filteredEvents.length} items)
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredEvents}
                        emptyMessage='No compliance calendar events found matching the selected filters.'
                    />
                </div>
            </div>

            {/* Add Event Modal */}
            {showAddModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-4 border-b border-slate-100'>
                            <h3 className='text-base font-bold text-slate-900'>Add Statutory Compliance Deadline</h3>
                            <button
                                type='button'
                                onClick={() => setShowAddModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>
                        <form onSubmit={handleCreateEvent} className='mt-4 space-y-4'>
                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Milestone / Obligation Title *</label>
                                <input
                                    type='text'
                                    required
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder='e.g. CBSE Affiliation Extension Report Submission'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Deadline Date *</label>
                                    <input
                                        type='date'
                                        required
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Category *</label>
                                    <select
                                        value={newEvent.type}
                                        onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        <option value='Correspondence'>Correspondence</option>
                                        <option value='Permit Renewal'>Permit Renewal</option>
                                        <option value='Government Inspection'>Government Inspection</option>
                                        <option value='Board Statutory Filing'>Board Statutory Filing</option>
                                    </select>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Authority / Department *</label>
                                    <input
                                        type='text'
                                        required
                                        value={newEvent.department}
                                        onChange={(e) => setNewEvent({ ...newEvent, department: e.target.value })}
                                        placeholder='e.g. CBSE Regional Office'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Urgency Tier</label>
                                    <select
                                        value={newEvent.priority}
                                        onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        <option value='Normal'>Normal</option>
                                        <option value='Urgent'>Urgent</option>
                                        <option value='Critical'>Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Compliance Notes</label>
                                <textarea
                                    rows={3}
                                    value={newEvent.notes}
                                    onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                                    placeholder='Enter details, required documentation, or reference links...'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowAddModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Save Compliance Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <h3 className='text-sm font-bold text-slate-900'>Compliance Obligation Details</h3>
                            <button
                                type='button'
                                onClick={() => setSelectedEvent(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>
                        <div className='mt-4 space-y-3 text-xs'>
                            <div>
                                <span className='text-slate-400 block text-[11px] font-medium'>Milestone / Title</span>
                                <span className='text-slate-900 font-bold text-sm'>{selectedEvent.title}</span>
                            </div>
                            <div className='grid grid-cols-2 gap-2'>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Due Date</span>
                                    <span className='font-mono font-semibold text-slate-800'>{selectedEvent.date}</span>
                                </div>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Category</span>
                                    <span className='font-semibold text-slate-800'>{selectedEvent.type}</span>
                                </div>
                            </div>
                            <div>
                                <span className='text-slate-400 block text-[11px] font-medium'>Authority / Department</span>
                                <span className='text-slate-800 font-medium'>{selectedEvent.department}</span>
                            </div>
                            <div className='grid grid-cols-2 gap-2'>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Urgency</span>
                                    <span className='font-bold text-rose-700'>{selectedEvent.priority}</span>
                                </div>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Status</span>
                                    <StatusBadge status={selectedEvent.status} />
                                </div>
                            </div>
                            {selectedEvent.refId && (
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>System Linkage Ref</span>
                                    <span className='font-mono text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded'>
                                        {selectedEvent.refId}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end'>
                            <button
                                type='button'
                                onClick={() => setSelectedEvent(null)}
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

export default ProComplianceCalendar
