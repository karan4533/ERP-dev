import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Download, FileText, Plus, X, Send, Users, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react'
import { NavLink, useSearchParams } from 'react-router-dom'
import DataTable from '../ui/DataTable'
import DataToolbar from '../ui/DataToolbar'
import IntegrationNotice from '../ui/IntegrationNotice'
import PageHeader from '../ui/PageHeader'
import Pagination from '../ui/Pagination'
import StatusBadge from '../ui/StatusBadge'
import FileDropzone from '../ui/FileDropzone'
import { paginateRows, parseTableState, serializeTableState } from '../ui/dataTableState'
import {
    CATEGORY_OPTIONS,
    canCreateAnnouncements,
    getAnnouncementsForRole,
    parseAnnouncementDate,
    addAnnouncement,
    formatAnnouncementDate
} from './announcementData'
import { getAnnouncementRoutes, getAnnouncementViewPath } from './announcementConfigs'
import { ANNOUNCEMENT_AUDIENCE_GROUPS, resolveAnnouncementAudience } from './announcementComposerState.js'
import { toast } from 'react-toastify'

export default function AnnouncementListView({ roleKey }) {
    const routes = getAnnouncementRoutes(roleKey)
    const canCreate = canCreateAnnouncements(roleKey)
    const [urlParams, setUrlParams] = useSearchParams()
    const initialTableState = parseTableState(urlParams)
    const [fromDate, setFromDate] = useState(initialTableState.filters.fromDate || '')
    const [toDate, setToDate] = useState(initialTableState.filters.toDate || '')
    const [search, setSearch] = useState(initialTableState.query)
    const [categoryFilter, setCategoryFilter] = useState(initialTableState.filters.category || '')
    const [page, setPage] = useState(initialTableState.page)
    const [pageSize, setPageSize] = useState(initialTableState.pageSize)
    const [refreshNonce, setRefreshNonce] = useState(0)

    // Modal State for In-Page Announcement Creation
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        category: 'Staff Notice',
        priority: 'Normal',
        audienceGroup: 'all-school',
        message: '',
        attachmentName: '',
        requireAcknowledgement: true,
    })

    const announcements = useMemo(() => {
        void refreshNonce
        return getAnnouncementsForRole(roleKey)
    }, [roleKey, refreshNonce])

    const filteredAnnouncements = useMemo(() => {
        const query = search.trim().toLowerCase()
        const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
        const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null
        return announcements.filter((item) => {
            if (categoryFilter && item.category !== categoryFilter) return false
            const itemDate = parseAnnouncementDate(item.announcementDate)
            if (from && itemDate && itemDate < from) return false
            if (to && itemDate && itemDate > to) return false
            if (!query) return true
            return [item.id, item.title, item.message, item.sentBy, item.category]
                .some((value) => String(value || '').toLowerCase().includes(query))
        })
    }, [announcements, search, categoryFilter, fromDate, toDate])
    const pagination = paginateRows(filteredAnnouncements, { page, pageSize })

    useEffect(() => {
        setUrlParams(serializeTableState({
            query: search,
            page: pagination.page,
            pageSize,
            filters: { category: categoryFilter, fromDate, toDate },
        }), { replace: true })
    }, [categoryFilter, fromDate, pageSize, pagination.page, search, setUrlParams, toDate])

    const resetFilters = () => {
        setSearch('')
        setCategoryFilter('')
        setFromDate('')
        setToDate('')
        setPage(1)
    }

    const handleCreateAnnouncementSubmit = (e) => {
        e.preventDefault()
        if (!formData.title.trim()) {
            toast.error('Please enter an announcement title.')
            return
        }
        if (!formData.message.trim()) {
            toast.error('Please enter the announcement message content.')
            return
        }

        const audienceGroupObj = ANNOUNCEMENT_AUDIENCE_GROUPS.find((g) => g.id === formData.audienceGroup)
        const resolvedAudience = resolveAnnouncementAudience(formData.audienceGroup)

        try {
            const newNotice = addAnnouncement({
                title: formData.title,
                category: formData.category,
                priority: formData.priority,
                message: formData.message,
                attachmentName: formData.attachmentName,
                sentBy: routes.sentByDefault || 'School Faculty',
                announcementDate: new Date(),
                audience: resolvedAudience,
                audienceLabel: audienceGroupObj?.label || 'Target School Audience',
                requireAcknowledgement: formData.requireAcknowledgement,
            }, roleKey)

            toast.success(`Announcement ${newNotice.id} published successfully!`)
            setIsCreateModalOpen(false)
            setFormData({
                title: '',
                category: 'Staff Notice',
                priority: 'Normal',
                audienceGroup: 'all-school',
                message: '',
                attachmentName: '',
                requireAcknowledgement: true,
            })
            setRefreshNonce((n) => n + 1)
        } catch (err) {
            toast.error(err.message || 'Failed to publish announcement.')
        }
    }

    const columns = [
        { key: 'id', label: 'Announcement ID', required: true, render: (item) => <span className='font-semibold text-[var(--erp-ink)]'>{item.id}</span> },
        {
            key: 'title',
            label: 'Announcement',
            render: (item) => (
                <span>
                    <div className='flex items-center gap-1.5'>
                        <span className='font-medium text-[var(--erp-ink)]'>{item.title}</span>
                        {item.priority === 'Urgent' && (
                            <span className='px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-md'>Urgent</span>
                        )}
                        {item.priority === 'Important' && (
                            <span className='px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-md'>Important</span>
                        )}
                    </div>
                    <span className='line-clamp-1 max-w-sm text-xs text-[var(--erp-muted)]'>{item.message}</span>
                </span>
            )
        },
        {
            key: 'category',
            label: 'Category',
            render: (item) => {
                let badgeStatus = 'info'
                if (item.category === 'Emergency') badgeStatus = 'danger'
                else if (item.category === 'Stores & Material Collection') badgeStatus = 'success'
                else if (item.category === 'Examination') badgeStatus = 'warning'
                return <StatusBadge status={badgeStatus} label={item.category} />
            }
        },
        { key: 'sentBy', label: 'Published by' },
        { key: 'announcementDate', label: 'Published' },
        {
            key: 'audienceLabel',
            label: 'Target Audience',
            render: (item) => <span className='text-xs text-gray-600'>{item.audienceLabel || 'All School Roles'}</span>
        },
        { key: 'attachmentName', label: 'Attachment', render: (item) => item.attachmentName ? <span className='inline-flex items-center gap-1.5'><FileText aria-hidden='true' size={15} /> {item.attachmentName}</span> : 'None' },
    ]

    return (
        <section className='space-y-5'>
            <PageHeader
                title='Announcements'
                description='Published school notices, broadcasts, and operational alerts.'
                context={`${announcements.length} available · ${filteredAnnouncements.length} matching`}
                actions={canCreate ? (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className='inline-flex min-h-10 items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 text-sm font-semibold text-white shadow-xs transition'
                    >
                        <Plus aria-hidden='true' size={16} /> Create Announcement
                    </button>
                ) : null}
            />

            <IntegrationNotice state='demo' title='Browser-stored announcements' description='Publication, audience visibility, acknowledgement and replies are local to this browser. Delivery receipts and production notifications are not connected.' />

            <div className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white shadow-xs'>
                <DataToolbar
                    query={search}
                    onQueryChange={(value) => { setSearch(value); setPage(1) }}
                    searchPlaceholder='Search title, message or sender'
                    resultCount={filteredAnnouncements.length}
                    onReset={resetFilters}
                    filters={(
                        <>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Category
                                <select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                    <option value=''>All categories</option>
                                    {CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}
                                </select>
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Published from
                                <input type='date' value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-3 text-sm' />
                            </label>
                            <label className='grid gap-1 text-xs font-medium text-[var(--erp-slate)]'>Published to
                                <input type='date' value={toDate} onChange={(event) => { setToDate(event.target.value); setPage(1) }} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-3 text-sm' />
                            </label>
                        </>
                    )}
                    actions={<button type='button' disabled title='Export service is not connected' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-65'><Download aria-hidden='true' size={16} /> Export unavailable</button>}
                />
                <DataTable
                    caption='Announcements'
                    rows={pagination.rows}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No announcements found'
                    emptyDescription='No announcements match the current filters or role audience.'
                    renderActions={(item) => (
                        <NavLink to={getAnnouncementViewPath(roleKey, item.id)} className='inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--erp-line-strong)] px-3 text-xs font-semibold text-[var(--erp-ink)] hover:bg-gray-50'>
                            Read <ArrowUpRight aria-hidden='true' size={14} />
                        </NavLink>
                    )}
                />
                <Pagination {...pagination} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} />
            </div>

            {/* Direct Create Announcement Dialog Modal */}
            {isCreateModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto'>
                    <div className='w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl space-y-4 my-8'>
                        <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
                            <div className='flex items-center gap-2'>
                                <div className='p-2 bg-indigo-50 text-indigo-600 rounded-lg'>
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h3 className='text-base font-bold text-gray-900'>Create New Announcement</h3>
                                    <p className='text-xs text-gray-500'>Broadcast notice or alert to authorized recipient groups</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className='p-1 text-gray-400 hover:text-gray-600 rounded-lg'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAnnouncementSubmit} className='space-y-4 text-xs'>
                            <div>
                                <label className='font-semibold text-gray-700 mb-1 block'>Announcement Title <span className='text-rose-500'>*</span></label>
                                <input
                                    type='text'
                                    placeholder='e.g., Annual Science Exhibition Registration Notice'
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className='w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-indigo-500 focus:outline-hidden'
                                    required
                                />
                            </div>

                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-gray-700 mb-1 block'>Notice Category <span className='text-rose-500'>*</span></label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className='w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-indigo-500 focus:outline-hidden bg-white'
                                    >
                                        {CATEGORY_OPTIONS.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className='font-semibold text-gray-700 mb-1 block'>Priority Level</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className='w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-indigo-500 focus:outline-hidden bg-white'
                                    >
                                        <option value='Normal'>Normal</option>
                                        <option value='Important'>Important</option>
                                        <option value='Urgent'>Urgent / Immediate Action</option>
                                    </select>
                                </div>
                            </div>

                            {/* Who can receive / Target Audience Selector */}
                            <div>
                                <label className='font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5'>
                                    <Users size={14} className='text-indigo-600' />
                                    <span>Who Can Receive (Audience Category) <span className='text-rose-500'>*</span></span>
                                </label>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                                    {ANNOUNCEMENT_AUDIENCE_GROUPS.map((group) => (
                                        <label
                                            key={group.id}
                                            className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                                                formData.audienceGroup === group.id
                                                    ? 'border-indigo-500 bg-indigo-50/50'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type='radio'
                                                name='audienceGroupSelect'
                                                value={group.id}
                                                checked={formData.audienceGroup === group.id}
                                                onChange={() => setFormData({ ...formData, audienceGroup: group.id })}
                                                className='mt-0.5 accent-indigo-600'
                                            />
                                            <div>
                                                <div className='font-semibold text-gray-900 text-xs'>{group.label}</div>
                                                <div className='text-[10px] text-gray-500 leading-tight mt-0.5'>{group.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className='font-semibold text-gray-700 mb-1 block'>Message Content <span className='text-rose-500'>*</span></label>
                                <textarea
                                    rows={4}
                                    placeholder='Provide detailed instructions, time schedule, affected locations, and required action from recipients...'
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className='w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-indigo-500 focus:outline-hidden'
                                    required
                                />
                            </div>

                            <div>
                                <label className='font-semibold text-gray-700 mb-1 block'>Supporting Document / Attachment (PDF, PNG, JPG)</label>
                                <FileDropzone
                                    value={formData.attachmentName}
                                    onChange={(value) => setFormData({ ...formData, attachmentName: value })}
                                    valueMode='name'
                                    label='Upload circular scan, guidelines, or notice document'
                                    acceptDocuments
                                />
                            </div>

                            <div className='flex items-center justify-between pt-3 border-t border-gray-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className='px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs'
                                >
                                    <Send size={14} /> Publish Announcement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}
