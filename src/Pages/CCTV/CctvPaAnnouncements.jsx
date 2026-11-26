import React, { useEffect, useState, useMemo } from 'react'
import {
    Volume2,
    Plus,
    Calendar,
    Clock,
    Search,
    RefreshCw,
    ShieldAlert,
    Radio,
    Play,
    CheckCircle2,
    X,
    Filter,
    Users
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { cctvService } from '../../services/modules/cctvService'

const AUDIO_ZONES = [
    'Senior Academic Wing',
    'Junior Wing',
    'Quadrangle & Open Courtyard',
    'Dining Hall & Cafeteria',
    'Playgrounds & Sports Complex',
    'Transport Bay & Gates',
    'Main Auditorium & Seminar Halls',
]

const CATEGORIES = [
    'All Categories',
    'Bell & Assembly',
    'General',
    'Transport',
    'Event',
    'Emergency',
]

const CctvPaAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All Categories')
    const [emergencyOnly, setEmergencyOnly] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')
    const [simulatingAudio, setSimulatingAudio] = useState(null)

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'General',
        targetZones: ['Senior Academic Wing', 'Junior Wing'],
        message: '',
        announcedBy: 'S. Selvakumar (Control Room)',
        authorizedBy: 'Dr. K. S. Sundaram (Joint Director)',
        isEmergency: false,
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await cctvService.getPaAnnouncements()
            if (res.success && Array.isArray(res.data)) {
                setAnnouncements(res.data)
            }
        } catch (err) {
            console.error('Failed to load PA announcements:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredAnnouncements = useMemo(() => {
        return announcements.filter((a) => {
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                a.id?.toLowerCase().includes(q) ||
                a.message?.toLowerCase().includes(q) ||
                a.announcedBy?.toLowerCase().includes(q) ||
                a.authorizedBy?.toLowerCase().includes(q)

            const matchesCategory = selectedCategory === 'All Categories' || a.category === selectedCategory
            const matchesEmergency = !emergencyOnly || a.isEmergency

            return matchesSearch && matchesCategory && matchesEmergency
        })
    }, [announcements, searchQuery, selectedCategory, emergencyOnly])

    const kpiMetrics = useMemo(() => {
        const total = filteredAnnouncements.length
        const emergencies = filteredAnnouncements.filter((a) => a.isEmergency).length
        const todayStr = new Date().toISOString().split('T')[0]
        const todayCount = filteredAnnouncements.filter((a) => a.date === todayStr).length
        return { total, emergencies, todayCount }
    }, [filteredAnnouncements])

    const handleCreateSubmit = async (e) => {
        e.preventDefault()
        if (!form.message.trim() || form.targetZones.length === 0) {
            alert('Please provide announcement script/message and select at least one audio zone.')
            return
        }

        try {
            const res = await cctvService.createPaAnnouncement(form)
            if (res.success) {
                setAnnouncements((prev) => [res.data, ...prev])
                setShowCreateModal(false)
                setFeedbackMessage(`PA broadcast ${res.data.id} published to ${res.data.targetZones.length} audio zone(s).`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setForm({
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    category: 'General',
                    targetZones: ['Senior Academic Wing', 'Junior Wing'],
                    message: '',
                    announcedBy: 'S. Selvakumar (Control Room)',
                    authorizedBy: 'Dr. K. S. Sundaram (Joint Director)',
                    isEmergency: false,
                })
            } else {
                alert(`Error: ${res.error?.message || 'Failed to broadcast PA announcement'}`)
            }
        } catch (err) {
            console.error('Error creating PA announcement:', err)
        }
    }

    const toggleZone = (zone) => {
        setForm((prev) => {
            const exists = prev.targetZones.includes(zone)
            if (exists) {
                return { ...prev, targetZones: prev.targetZones.filter((z) => z !== zone) }
            } else {
                return { ...prev, targetZones: [...prev.targetZones, zone] }
            }
        })
    }

    const simulateBroadcastAudio = (announcement) => {
        setSimulatingAudio(announcement.id)
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel()
                const utter = new SpeechSynthesisUtterance(announcement.message)
                utter.rate = 0.95
                utter.onend = () => setSimulatingAudio(null)
                utter.onerror = () => setSimulatingAudio(null)
                window.speechSynthesis.speak(utter)
            } catch (err) {
                setTimeout(() => setSimulatingAudio(null), 2500)
            }
        } else {
            setTimeout(() => setSimulatingAudio(null), 2500)
        }
    }

    const columns = [
        {
            key: 'id',
            label: 'Broadcast ID & Time',
            required: true,
            render: (row) => (
                <div>
                    <span className='font-mono font-bold text-xs text-slate-900'>{row.id}</span>
                    <div className='text-[10px] text-slate-400 font-mono mt-0.5'>{row.date} · {row.time}</div>
                </div>
            ),
        },
        {
            key: 'category',
            label: 'Category & Priority',
            required: true,
            render: (row) => (
                <div>
                    <span className='text-xs font-semibold text-slate-800'>{row.category}</span>
                    <div className='mt-1'>
                        {row.isEmergency ? (
                            <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200'>
                                <ShieldAlert className='w-3 h-3' /> Emergency Broadcast
                            </span>
                        ) : (
                            <span className='px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600'>
                                Routine Public Address
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'targetZones',
            label: 'Target Audio Zones',
            required: true,
            render: (row) => (
                <div className='max-w-xs text-xs'>
                    <div className='flex flex-wrap gap-1'>
                        {Array.isArray(row.targetZones) ? (
                            row.targetZones.slice(0, 2).map((z, idx) => (
                                <span key={idx} className='bg-teal-50 text-teal-800 text-[10px] px-1.5 py-0.5 rounded font-medium'>
                                    {z}
                                </span>
                            ))
                        ) : (
                            <span className='bg-teal-50 text-teal-800 text-[10px] px-1.5 py-0.5 rounded'>
                                {row.targetZones}
                            </span>
                        )}
                        {Array.isArray(row.targetZones) && row.targetZones.length > 2 && (
                            <span className='text-[10px] text-slate-500 font-mono self-center'>
                                +{row.targetZones.length - 2} more
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'message',
            label: 'Script / Message Broadcast',
            required: true,
            render: (row) => (
                <div className='max-w-xs text-xs text-slate-800 truncate' title={row.message}>
                    {row.message}
                </div>
            ),
        },
        {
            key: 'authority',
            label: 'Operator & Authorization',
            required: true,
            render: (row) => (
                <div className='text-xs'>
                    <div className='font-medium text-slate-900'>{row.announcedBy}</div>
                    <div className='text-[10px] text-slate-500 mt-0.5'>Auth: {row.authorizedBy}</div>
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'Playback & Log',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5'>
                    <button
                        type='button'
                        onClick={() => simulateBroadcastAudio(row)}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors shadow-xs ${
                            simulatingAudio === row.id
                                ? 'bg-amber-600 text-white animate-pulse'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title='Play audio speech simulation'
                    >
                        <Volume2 className='w-3.5 h-3.5 text-teal-600' />
                        {simulatingAudio === row.id ? 'Broadcasting...' : 'Play'}
                    </button>
                    <button
                        type='button'
                        onClick={() => setSelectedAnnouncement(row)}
                        className='text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors'
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
                            <Volume2 className='w-4 h-4' />
                            Central Campus Acoustics &amp; Public Address
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            PA System Announcement Log
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Control room register for multi-zone PA broadcasts, scheduled bell announcements, transport dispatch calls, and emergency alert transmissions.
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
                            onClick={() => setShowCreateModal(true)}
                            className='inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            New PA Broadcast
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
                    <div className='text-xs font-medium text-slate-500'>Total Broadcasts</div>
                    <div className='text-2xl font-bold text-slate-900 mt-1 font-mono'>{kpiMetrics.total}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Logged in register</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Emergency Broadcasts</div>
                    <div className='text-2xl font-bold text-rose-600 mt-1 font-mono'>{kpiMetrics.emergencies}</div>
                    <div className='text-[10px] text-rose-500 mt-0.5 font-semibold'>High-priority priority overrides</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Active Audio Zones</div>
                    <div className='text-2xl font-bold text-teal-700 mt-1 font-mono'>{AUDIO_ZONES.length}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Campus speakers online</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Today's Transmissions</div>
                    <div className='text-2xl font-bold text-emerald-600 mt-1 font-mono'>{kpiMetrics.todayCount}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Broadcasted today</div>
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
                            placeholder='Search script or authority...'
                            className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        />
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className='px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    >
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    <label className='flex items-center gap-2 text-xs font-bold text-rose-800 cursor-pointer bg-rose-50 px-3 py-2 rounded-xl border border-rose-200'>
                        <input
                            type='checkbox'
                            checked={emergencyOnly}
                            onChange={(e) => setEmergencyOnly(e.target.checked)}
                            className='rounded text-rose-600'
                        />
                        Emergency Broadcasts Only
                    </label>
                </div>

                <div className='text-xs font-semibold text-slate-500'>
                    Showing {filteredAnnouncements.length} broadcasts
                </div>
            </div>

            {/* Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Public Address Broadcast Register
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredAnnouncements}
                        emptyMessage='No PA announcements found for the selected filter.'
                    />
                </div>
            </div>

            {/* New Announcement Modal */}
            {showCreateModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div className='flex items-center gap-2'>
                                <Volume2 className='w-5 h-5 text-teal-600' />
                                <h3 className='text-base font-bold text-slate-900'>Initiate PA Broadcast</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setShowCreateModal(false)}
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
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Category *</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Target Audio Zones (Select Zones) *</label>
                                <div className='grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200'>
                                    {AUDIO_ZONES.map((zone) => {
                                        const checked = form.targetZones.includes(zone)
                                        return (
                                            <label key={zone} className='flex items-center gap-2 text-xs text-slate-700 cursor-pointer'>
                                                <input
                                                    type='checkbox'
                                                    checked={checked}
                                                    onChange={() => toggleZone(zone)}
                                                    className='rounded text-teal-600'
                                                />
                                                <span className={checked ? 'font-semibold text-teal-900' : ''}>{zone}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Broadcast Script / Announcement Message *</label>
                                <textarea
                                    rows={4}
                                    required
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    placeholder='Type announcement message to be broadcasted over loudspeakers...'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Announced By</label>
                                    <input
                                        type='text'
                                        value={form.announcedBy}
                                        onChange={(e) => setForm({ ...form, announcedBy: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Authorized By</label>
                                    <input
                                        type='text'
                                        value={form.authorizedBy}
                                        onChange={(e) => setForm({ ...form, authorizedBy: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div className='p-3 rounded-xl bg-rose-50 border border-rose-200'>
                                <label className='flex items-center gap-2 text-xs font-bold text-rose-800 cursor-pointer'>
                                    <input
                                        type='checkbox'
                                        checked={form.isEmergency}
                                        onChange={(e) => setForm({ ...form, isEmergency: e.target.checked })}
                                        className='rounded text-rose-600'
                                    />
                                    Mark as Emergency Priority Broadcast (Overrides routine bell schedules)
                                </label>
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowCreateModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Broadcast Announcement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedAnnouncement && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <span className='text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono'>
                                    {selectedAnnouncement.id}
                                </span>
                                <h3 className='text-sm font-bold text-slate-900 mt-1'>{selectedAnnouncement.category} Broadcast</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedAnnouncement(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-3 text-xs'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5'>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Date &amp; Time:</span>
                                    <span className='font-mono font-bold text-slate-900'>{selectedAnnouncement.date} at {selectedAnnouncement.time}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Announced By:</span>
                                    <span className='text-slate-900 font-medium'>{selectedAnnouncement.announcedBy}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Authorized By:</span>
                                    <span className='text-slate-900 font-medium'>{selectedAnnouncement.authorizedBy}</span>
                                </div>
                            </div>

                            <div>
                                <span className='text-slate-500 font-medium block text-[11px]'>Acoustic Coverage Zones:</span>
                                <div className='flex flex-wrap gap-1 mt-1'>
                                    {Array.isArray(selectedAnnouncement.targetZones) ? (
                                        selectedAnnouncement.targetZones.map((z, idx) => (
                                            <span key={idx} className='bg-teal-50 text-teal-800 text-[11px] px-2 py-0.5 rounded font-medium border border-teal-100'>
                                                {z}
                                            </span>
                                        ))
                                    ) : (
                                        <span className='bg-teal-50 text-teal-800 text-[11px] px-2 py-0.5 rounded'>
                                            {selectedAnnouncement.targetZones}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1'>
                                <span className='text-[11px] text-slate-500 block font-medium'>Transmitted Message:</span>
                                <p className='text-slate-900 font-medium text-xs leading-relaxed'>"{selectedAnnouncement.message}"</p>
                            </div>
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-between'>
                            <button
                                type='button'
                                onClick={() => simulateBroadcastAudio(selectedAnnouncement)}
                                className='px-3 py-1.5 text-xs font-semibold rounded-xl bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors flex items-center gap-1.5'
                            >
                                <Volume2 className='w-4 h-4 text-teal-600' />
                                Test Audio Stream
                            </button>
                            <button
                                type='button'
                                onClick={() => setSelectedAnnouncement(null)}
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

export default CctvPaAnnouncements
