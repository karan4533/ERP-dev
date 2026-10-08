import React, { useMemo, useState } from 'react'
import { Bell, Calendar, Search, UserRound } from 'lucide-react'
import { filterNotifications } from './filterNotifications'

const emptyFilters = { search: '', type: '' }

const NotificationsListView = ({
    notifications,
    notificationTypes,
    typeBadgeColor,
    title = 'Notifications',
}) => {
    const [filters, setFilters] = useState(emptyFilters)
    const [expandedId, setExpandedId] = useState(null)

    const filtered = useMemo(
        () => filterNotifications(notifications, filters),
        [notifications, filters],
    )

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col lg:flex-row lg:items-end gap-4'>
                    <div className='flex-1 flex flex-col gap-y-2'>
                        <label htmlFor='notification-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <div className='relative'>
                            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                            <input
                                id='notification-search'
                                type='text'
                                value={filters.search}
                                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                                placeholder='Search notifications...'
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                            />
                        </div>
                    </div>
                    <div className='w-full lg:max-w-xs flex flex-col gap-y-2'>
                        <label htmlFor='notification-type' className='text-base font-medium text-[#808080]'>Type</label>
                        <select
                            id='notification-type'
                            value={filters.type}
                            onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All Types</option>
                            {notificationTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type='button'
                        onClick={() => setFilters(emptyFilters)}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer lg:mb-0.5'
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            <div className='flex items-center justify-between gap-3 px-1'>
                <h2 className='text-xl font-medium text-black'>{title}</h2>
                <span className='text-sm text-[#667085]'>{filtered.length} notification(s)</span>
            </div>

            {filtered.length === 0 ? (
                <div className='bg-white rounded-2xl shadow-md p-12 text-center text-[#667085]'>
                    No notifications found.
                </div>
            ) : (
                <div className='flex flex-col gap-3'>
                    {filtered.map((record) => {
                        const isExpanded = expandedId === record.id
                        const isUnread = record.isRead === false

                        return (
                            <article
                                key={record.id}
                                className={`bg-white rounded-2xl shadow-md border transition-all duration-200 ${
                                    isUnread ? 'border-[#515DEF33] bg-[#FAFBFF]' : 'border-[#EEF0F6]'
                                }`}
                            >
                                <div className='p-5'>
                                    <div className='flex items-start justify-between gap-3'>
                                        <div className='flex items-start gap-3 min-w-0'>
                                            <div className={`shrink-0 size-10 rounded-xl flex items-center justify-center ${typeBadgeColor[record.type] ?? 'bg-[#515DEF33] text-[#515DEF]'}`}>
                                                <Bell size={18} />
                                            </div>
                                            <div className='min-w-0'>
                                                <div className='flex flex-wrap items-center gap-2'>
                                                    <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${typeBadgeColor[record.type] ?? 'bg-[#515DEF33] text-[#515DEF]'}`}>
                                                        {record.type}
                                                    </span>
                                                    {isUnread && (
                                                        <span className='px-2 py-0.5 rounded-lg text-xs font-semibold bg-[#515DEF] text-white'>
                                                            New
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className='text-base font-semibold text-[#1E1E1E] mt-2'>{record.title}</h3>
                                                {record.meta && (
                                                    <p className='text-xs text-[#515DEF] mt-1'>{record.meta}</p>
                                                )}
                                            </div>
                                        </div>
                                        <span className='text-xs text-[#808080] whitespace-nowrap'>{record.notificationDate}</span>
                                    </div>

                                    <p className={`text-sm text-[#667085] mt-4 ${isExpanded ? '' : 'line-clamp-2'}`}>
                                        {record.message}
                                    </p>

                                    <div className='flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[#F2F4F7] text-xs text-[#808080]'>
                                        <span className='inline-flex items-center gap-1.5'>
                                            <UserRound size={14} />
                                            {record.postedBy}
                                        </span>
                                        <span className='inline-flex items-center gap-1.5'>
                                            <Calendar size={14} />
                                            Related: {record.relatedDate}
                                        </span>
                                    </div>

                                    <button
                                        type='button'
                                        onClick={() => setExpandedId(isExpanded ? null : record.id)}
                                        className='mt-4 text-sm font-medium text-[#515DEF] hover:underline cursor-pointer'
                                    >
                                        {isExpanded ? 'Show less' : 'Read more'}
                                    </button>
                                </div>
                            </article>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

export default NotificationsListView
