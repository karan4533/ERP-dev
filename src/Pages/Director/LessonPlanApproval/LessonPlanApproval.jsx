import React, { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import FilterChips from '../../../Common/LessonPlanApproval/Components/FilterChips'
import LessonPlanGroupedTable from '../../../Common/LessonPlanApproval/Components/LessonPlanGroupedTable'
import {
    APPROVAL_STATUSES,
    buildLessonPlanGroupHref,
    CLASS_OPTIONS,
    emptyLessonPlanFilters,
    filterLessonPlans,
    getActiveFilterLabels,
    getLessonPlans,
    getSummaryCounts,
    groupLessonPlansByTeacherSubject,
    SECTION_OPTIONS,
    SUBJECT_OPTIONS,
    SUBMITTER_ROLES,
    TRACK_STATUSES,
} from '../../../Common/LessonPlanApproval/lessonPlanApprovalData'

const SUMMARY_CARDS = [
    { key: 'pendingApprovals', label: 'Pending approvals' },
    { key: 'onTrack', label: 'On track' },
    { key: 'behindSchedule', label: 'Behind schedule' },
    { key: 'completed', label: 'Completed' },
]

const filterInputClass =
    'text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'

const LessonPlanApproval = () => {
    const [plans, setPlans] = useState(() => getLessonPlans())
    const [filters, setFilters] = useState(emptyLessonPlanFilters)
    const [exportModal, setExportModal] = useState(false)

    const summary = useMemo(() => getSummaryCounts(plans), [plans])
    const filteredPlans = useMemo(() => filterLessonPlans(plans, filters), [plans, filters])
    const groupedPlans = useMemo(() => groupLessonPlansByTeacherSubject(filteredPlans), [filteredPlans])
    const activeFilterLabels = useMemo(() => getActiveFilterLabels(filters), [filters])

    const updateFilter = (key, value) => {
        setFilters((current) => ({ ...current, [key]: value }))
    }

    const clearFilters = () => {
        setFilters(emptyLessonPlanFilters)
    }

    const exportDescription = (
        <>
            You are exporting {String(filteredPlans.length).padStart(2, '0')} records
            {activeFilterLabels.length > 0 ? (
                <>
                    {' '}
                    <span className='text-[#515DEF]'>( Filtered: {activeFilterLabels.join(', ')} )</span>
                </>
            ) : null}
        </>
    )

    return (
        <section className='space-y-8'>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                {SUMMARY_CARDS.map((card) => {
                    const isPendingCard = card.key === 'pendingApprovals'
                    const isPendingActive = filters.approvalStatus === 'Pending'

                    return (
                        <div
                            key={card.key}
                            role={isPendingCard ? 'button' : undefined}
                            tabIndex={isPendingCard ? 0 : undefined}
                            onClick={
                                isPendingCard
                                    ? () => updateFilter('approvalStatus', isPendingActive ? '' : 'Pending')
                                    : undefined
                            }
                            onKeyDown={
                                isPendingCard
                                    ? (event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault()
                                            updateFilter('approvalStatus', isPendingActive ? '' : 'Pending')
                                        }
                                    }
                                    : undefined
                            }
                            className={`bg-white rounded-2xl shadow-md p-5 transition-all ${
                                isPendingCard
                                    ? 'cursor-pointer hover:border hover:border-[#515DEF] hover:shadow-lg'
                                    : ''
                            } ${isPendingCard && isPendingActive ? 'ring-2 ring-[#515DEF] border border-[#515DEF]' : ''}`}
                        >
                            <p className='text-sm font-medium text-[#808080]'>{card.label}</p>
                            <p className='text-3xl font-bold text-[#0C1E5B] mt-2'>{summary[card.key]}</p>
                            {isPendingCard ? (
                                <p className='text-xs text-[#515DEF] mt-2'>
                                    {isPendingActive ? 'Filter active — click to clear' : 'Click to filter pending'}
                                </p>
                            ) : null}
                        </div>
                    )
                })}
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className={`${filterInputClass} md:max-w-xs sm:max-w-full`}>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            placeholder='Plan ID, subject, teacher...'
                            className={filterInputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='subject-filter' className='text-base font-medium text-[#808080]'>Subject</label>
                        <select
                            id='subject-filter'
                            value={filters.subject}
                            onChange={(e) => updateFilter('subject', e.target.value)}
                            className={filterInputClass}
                        >
                            <option value=''>All</option>
                            {SUBJECT_OPTIONS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='class-filter'
                            value={filters.className}
                            onChange={(e) => updateFilter('className', e.target.value)}
                            className={filterInputClass}
                        >
                            <option value=''>All</option>
                            {CLASS_OPTIONS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-filter' className='text-base font-medium text-[#808080]'>Section</label>
                        <select
                            id='section-filter'
                            value={filters.section}
                            onChange={(e) => updateFilter('section', e.target.value)}
                            className={filterInputClass}
                        >
                            <option value=''>All</option>
                            {SECTION_OPTIONS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status-filter' className='text-base font-medium text-[#808080]'>Approval Status</label>
                        <select
                            id='status-filter'
                            value={filters.approvalStatus}
                            onChange={(e) => updateFilter('approvalStatus', e.target.value)}
                            className={filterInputClass}
                        >
                            <option value=''>All</option>
                            {APPROVAL_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='track-filter' className='text-base font-medium text-[#808080]'>Track Status</label>
                        <select
                            id='track-filter'
                            value={filters.trackStatus}
                            onChange={(e) => updateFilter('trackStatus', e.target.value)}
                            className={filterInputClass}
                        >
                            <option value=''>All</option>
                            {TRACK_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='role-filter' className='text-base font-medium text-[#808080]'>Submitter Role</label>
                        <select
                            id='role-filter'
                            value={filters.submitterRole}
                            onChange={(e) => updateFilter('submitterRole', e.target.value)}
                            className={filterInputClass}
                        >
                            <option value=''>All</option>
                            {SUBMITTER_ROLES.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={filters.fromDate}
                                onChange={(date) => updateFilter('fromDate', date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={filters.toDate}
                                onChange={(date) => updateFilter('toDate', date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Lesson Plan Approval List</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <FilterChips filters={filters} onFiltersChange={setFilters} />
                <LessonPlanGroupedTable
                    groups={groupedPlans}
                    showTeacherColumn
                    statusMode='approval'
                    actionLabel='Review'
                    getGroupHref={(group) =>
                        buildLessonPlanGroupHref('/director', group.submitterName, group.subject, 'submissions')
                    }
                    emptyTitle={
                        filters.approvalStatus === 'Pending' && groupedPlans.length === 0
                            ? 'All caught up'
                            : 'No matching groups'
                    }
                    emptyMessage={
                        filters.approvalStatus === 'Pending' && groupedPlans.length === 0
                            ? 'No pending approvals — all lesson plans have been reviewed.'
                            : filteredPlans.length === 0
                                ? 'No lesson plans match the selected filters. Try clearing a filter chip above.'
                                : 'No lesson plan groups match the selected filters.'
                    }
                    emptyIcon={
                        filters.approvalStatus === 'Pending' && groupedPlans.length === 0 ? 'check' : 'inbox'
                    }
                />
            </div>

            <div className='flex justify-between items-center px-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {groupedPlans.length} of {groupedPlans.length} groups ({filteredPlans.length} lesson plans)
                </p>
                <div className='flex gap-x-2'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} exportDescription={exportDescription} />
        </section>
    )
}

export default LessonPlanApproval
