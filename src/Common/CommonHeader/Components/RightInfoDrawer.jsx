import React, { useState } from 'react'
import {
    Bell,
    CheckCircle2,
    UserPlus,
    Wrench,
    Radio,
    Clock,
    X,
    MessageSquare,
    ExternalLink,
    ChevronRight,
    Search
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const NOTIFICATIONS = [
    {
        id: 'notif-1',
        type: 'bug',
        title: 'You fixed a bug.',
        description: 'Ticket #TK-2026-08 resolved by IT Support.',
        timestamp: 'Just now',
        read: false,
        icon: Wrench,
        iconBg: 'bg-blue-100 text-blue-600',
    },
    {
        id: 'notif-2',
        type: 'user',
        title: 'New user registered.',
        description: 'Grade 10 Mentor assigned to section 10-B.',
        timestamp: '59 minutes ago',
        read: false,
        icon: UserPlus,
        iconBg: 'bg-slate-100 text-slate-700',
    },
    {
        id: 'notif-3',
        type: 'bug',
        title: 'Attendance synced.',
        description: 'ESSL Biometric logs ingested (1,248 records).',
        timestamp: '12 hours ago',
        read: true,
        icon: CheckCircle2,
        iconBg: 'bg-blue-100 text-blue-600',
    },
    {
        id: 'notif-4',
        type: 'radio',
        title: 'Andi Lane submitted request.',
        description: 'Store replenishment for A4 paper and blue pens.',
        timestamp: 'Today, 11:59 AM',
        read: true,
        icon: Radio,
        iconBg: 'bg-emerald-100 text-emerald-700',
    },
]

const ACTIVITIES = [
    {
        id: 'act-1',
        user: 'Natali Craig',
        role: 'Academics Coordinator',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        ringColor: 'ring-emerald-400',
        action: 'Changed the style.',
        context: 'Updated Grade 10 rubric weights for Split Tests.',
        timestamp: 'Just now',
    },
    {
        id: 'act-2',
        user: 'Drew Cano',
        role: 'Principal',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
        ringColor: 'ring-blue-500',
        action: 'Released a new version.',
        context: 'Published Annual Exam timetable and seating plan.',
        timestamp: '59 minutes ago',
    },
    {
        id: 'act-3',
        user: 'Andi Lane',
        role: 'Stores Officer',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
        ringColor: 'ring-purple-400',
        action: 'Submitted a bug.',
        context: 'Printer cartridge replaced in Senior Lab 2.',
        timestamp: '12 hours ago',
    },
    {
        id: 'act-4',
        user: 'Koray Okumus',
        role: 'Accountant',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
        ringColor: 'ring-amber-400',
        action: 'Modified A data in Page X.',
        context: 'Updated parent cheque bounce penalty status.',
        timestamp: 'Today, 11:59 AM',
    },
    {
        id: 'act-5',
        user: 'Kate Morrison',
        role: 'Transport Manager',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces',
        ringColor: 'ring-cyan-500',
        action: 'Deleted a page in Project X.',
        context: 'Archived retired Route #7 passenger roster.',
        timestamp: 'Feb 2, 2026',
    },
]

const CONTACTS = [
    {
        id: 'con-1',
        name: 'Natali Craig',
        role: 'Director of Academics',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        status: 'online',
    },
    {
        id: 'con-2',
        name: 'Drew Cano',
        role: 'Principal',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
        status: 'online',
    },
    {
        id: 'con-3',
        name: 'Andi Lane',
        role: 'Stores Head',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
        status: 'busy',
    },
    {
        id: 'con-4',
        name: 'Koray Okumus',
        role: 'Finance Officer',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
        status: 'away',
    },
    {
        id: 'con-5',
        name: 'Kate Morrison',
        role: 'Transport Lead',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces',
        status: 'offline',
    },
    {
        id: 'con-6',
        name: 'Melody Macy',
        role: 'HR Executive',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
        status: 'online',
    },
]

const RightInfoDrawer = ({ open, onClose }) => {
    const [activeTab, setActiveTab] = useState('all')
    const [searchContact, setSearchContact] = useState('')

    const filteredContacts = CONTACTS.filter((c) =>
        c.name.toLowerCase().includes(searchContact.toLowerCase()) ||
        c.role.toLowerCase().includes(searchContact.toLowerCase())
    )

    if (!open) return null

    return (
        <aside
            aria-label='Operational Intelligence & Team Activity'
            className='fixed right-0 top-[4.75rem] z-190 flex h-[calc(100vh-4.75rem)] w-[300px] flex-col border-l border-slate-200 bg-white shadow-xl transition-all duration-200 lg:shadow-none'
        >
            {/* Header */}
            <div className='flex items-center justify-between border-b border-slate-100 px-5 py-3.5'>
                <div className='flex items-center gap-2'>
                    <div className='flex size-2 rounded-full bg-blue-500 animate-pulse' />
                    <h2 className='text-sm font-semibold tracking-tight text-slate-900'>Live Activity & Team</h2>
                </div>
                <button
                    type='button'
                    onClick={onClose}
                    aria-label='Close drawer'
                    className='rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                >
                    <X size={16} />
                </button>
            </div>

            {/* Scrollable Content Container */}
            <div className='flex-1 space-y-6 overflow-y-auto p-4 sidebar-scroll-hide'>
                {/* 1. Notifications Section */}
                <section>
                    <div className='mb-3 flex items-center justify-between'>
                        <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-500'>Notifications</h3>
                        <span className='rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600'>
                            {NOTIFICATIONS.filter((n) => !n.read).length} New
                        </span>
                    </div>
                    <div className='space-y-3'>
                        {NOTIFICATIONS.map((item) => {
                            const Icon = item.icon
                            return (
                                <article
                                    key={item.id}
                                    className={`group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50 ${
                                        !item.read ? 'bg-blue-50/40' : ''
                                    }`}
                                >
                                    <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${item.iconBg}`}>
                                        <Icon size={14} />
                                    </div>
                                    <div className='min-w-0 flex-1'>
                                        <p className='text-xs font-semibold text-slate-800 leading-snug'>{item.title}</p>
                                        <p className='mt-0.5 text-[11px] text-slate-500 line-clamp-1'>{item.description}</p>
                                        <span className='mt-1 block text-[10px] text-slate-400'>{item.timestamp}</span>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                </section>

                <hr className='border-slate-100' />

                {/* 2. Activities Timeline Section */}
                <section>
                    <div className='mb-3 flex items-center justify-between'>
                        <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-500'>Activities</h3>
                        <NavLink to='/super-admin/audit-logs' className='text-[11px] font-medium text-blue-600 hover:underline'>
                            View Log
                        </NavLink>
                    </div>
                    <div className='space-y-3.5'>
                        {ACTIVITIES.map((act) => (
                            <div key={act.id} className='flex items-start gap-3'>
                                <img
                                    src={act.avatar}
                                    alt={act.user}
                                    className={`size-7 shrink-0 rounded-full object-cover ring-2 ${act.ringColor}`}
                                />
                                <div className='min-w-0 flex-1 text-xs'>
                                    <p className='font-semibold text-slate-800 leading-snug'>{act.action}</p>
                                    <p className='mt-0.5 text-[11px] text-slate-500 line-clamp-1'>{act.context}</p>
                                    <div className='mt-1 flex items-center gap-1.5 text-[10px] text-slate-400'>
                                        <span>{act.user}</span>
                                        <span>·</span>
                                        <span>{act.timestamp}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <hr className='border-slate-100' />

                {/* 3. Quick Contacts Directory */}
                <section>
                    <div className='mb-2.5 flex items-center justify-between'>
                        <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-500'>Contacts</h3>
                        <span className='text-[10px] text-slate-400'>{CONTACTS.length} Staff</span>
                    </div>

                    <div className='relative mb-2.5'>
                        <Search size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400' />
                        <input
                            type='text'
                            value={searchContact}
                            onChange={(e) => setSearchContact(e.target.value)}
                            placeholder='Search staff...'
                            className='w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-7 pr-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none'
                        />
                    </div>

                    <div className='space-y-2'>
                        {filteredContacts.map((contact) => (
                            <div
                                key={contact.id}
                                className='flex items-center justify-between rounded-lg p-1.5 hover:bg-slate-50 transition-colors'
                            >
                                <div className='flex items-center gap-2.5 min-w-0'>
                                    <div className='relative shrink-0'>
                                        <img
                                            src={contact.avatar}
                                            alt={contact.name}
                                            className='size-7 rounded-full object-cover'
                                        />
                                        <span
                                            className={`absolute bottom-0 right-0 size-2 rounded-full border border-white ${
                                                contact.status === 'online'
                                                    ? 'bg-emerald-500'
                                                    : contact.status === 'busy'
                                                    ? 'bg-red-500'
                                                    : contact.status === 'away'
                                                    ? 'bg-amber-400'
                                                    : 'bg-slate-300'
                                            }`}
                                        />
                                    </div>
                                    <div className='min-w-0'>
                                        <p className='truncate text-xs font-medium text-slate-800'>{contact.name}</p>
                                        <p className='truncate text-[10px] text-slate-400'>{contact.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </aside>
    )
}

export default RightInfoDrawer

