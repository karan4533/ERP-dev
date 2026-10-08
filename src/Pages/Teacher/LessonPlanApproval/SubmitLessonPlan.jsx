import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, Plus } from 'lucide-react'
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
    getLessonPlansBySubmitter,
    groupLessonPlansByTeacherSubject,
    SECTION_OPTIONS,
    SUBJECT_OPTIONS,
    TEACHER_NAME,
} from '../../../Common/LessonPlanApproval/lessonPlanApprovalData'

const filterInputClass =
    'text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'

const SubmitLessonPlan = () => {
    const location = useLocation()
    const [plans, setPlans] = useState(() => getLessonPlansBySubmitter(TEACHER_NAME))
    const [filters, setFilters] = useState(emptyLessonPlanFilters)
    const [exportModal, setExportModal] = useState(false)

    const filteredPlans = useMemo(() => filterLessonPlans(plans, filters), [plans, filters])
    const groupedPlans = useMemo(() => groupLessonPlansByTeacherSubject(filteredPlans), [filteredPlans])
    const activeFilterLabels = useMemo(() => getActiveFilterLabels(filters), [filters])
    const routePrefix = location.pathname.startsWith('/coordinator') ? '/coordinator' : '/teacher'

    useEffect(() => {
        setPlans(getLessonPlansBySubmitter(TEACHER_NAME))
    }, [location.key])

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
                            placeholder='Plan ID, subject, description...'
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
                    <h2 className='text-xl font-medium text-black'>My Submitted Lesson Plans</h2>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to={`${routePrefix}/lesson-plan-approval/add`}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Add Lesson Plan
                        </NavLink>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <FilterChips filters={filters} onFiltersChange={setFilters} />
                <LessonPlanGroupedTable
                    groups={groupedPlans}
                    showTeacherColumn={false}
                    statusMode='approval'
                    actionLabel='View'
                    getGroupHref={(group) =>
                        buildLessonPlanGroupHref(routePrefix, group.submitterName, group.subject, 'submissions')
                    }
                    emptyTitle={plans.length === 0 ? 'No submissions yet' : 'No matching groups'}
                    emptyMessage={
                        plans.length === 0
                            ? 'You have not submitted any lesson plans yet. Use Add Lesson Plan to get started.'
                            : 'No lesson plan groups match the selected filters. Try clearing a filter chip above.'
                    }
                    emptyIcon={plans.length === 0 ? 'clipboard' : 'inbox'}
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

export default SubmitLessonPlan
