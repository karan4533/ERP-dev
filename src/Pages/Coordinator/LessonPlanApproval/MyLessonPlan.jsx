import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import MarkAsDoneConfirmModal from './Components/MarkAsDoneConfirmModal'
import {
    approvalStatusColor,
    CLASS_OPTIONS,
    emptyLessonPlanFilters,
    filterLessonPlans,
    getActiveFilterLabels,
    getApprovedLessonPlansBySubmitter,
    markLessonPlanAsDone,
    SECTION_OPTIONS,
    SUBJECT_OPTIONS,
    COORDINATOR_NAME,
} from '../../../Common/LessonPlanApproval/lessonPlanApprovalData'

const filterInputClass =
    'text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'

const MyLessonPlan = () => {
    const location = useLocation()
    const [plans, setPlans] = useState(() => getApprovedLessonPlansBySubmitter(COORDINATOR_NAME))
    const [filters, setFilters] = useState(emptyLessonPlanFilters)
    const [exportModal, setExportModal] = useState(false)
    const [confirmPlan, setConfirmPlan] = useState(null)

    const filteredPlans = useMemo(() => filterLessonPlans(plans, filters), [plans, filters])
    const activeFilterLabels = useMemo(() => getActiveFilterLabels(filters), [filters])

    useEffect(() => {
        setPlans(getApprovedLessonPlansBySubmitter(COORDINATOR_NAME))
    }, [location.key])

    const refreshPlans = () => {
        setPlans(getApprovedLessonPlansBySubmitter(COORDINATOR_NAME))
    }

    const updateFilter = (key, value) => {
        setFilters((current) => ({ ...current, [key]: value }))
    }

    const clearFilters = () => {
        setFilters(emptyLessonPlanFilters)
    }

    const handleMarkAsDoneClick = (plan) => {
        if (plan.markAsDone) return
        setConfirmPlan(plan)
    }

    const handleConfirmMarkAsDone = () => {
        if (!confirmPlan) return
        markLessonPlanAsDone(confirmPlan.id)
        setConfirmPlan(null)
        refreshPlans()
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
                    <h2 className='text-xl font-medium text-black'>My Lesson Plan</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>S.No</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Description</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>From Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>To Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Submitted At</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Mark as Done</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPlans.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className='px-2 py-8 text-center text-[#667085]'>
                                        {plans.length === 0
                                            ? 'No approved lesson plans available yet.'
                                            : 'No lesson plans match the selected filters.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredPlans.map((plan, index) => (
                                    <tr key={plan.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 rounded-s-lg'>{index + 1}</td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{plan.subject}</td>
                                        <td className='px-2 py-4'>{plan.className}</td>
                                        <td className='px-2 py-4'>{plan.section}</td>
                                        <td className='px-2 py-4 max-w-[220px] truncate' title={plan.description}>{plan.description}</td>
                                        <td className='px-2 py-4 whitespace-nowrap'>{plan.fromDate ?? '—'}</td>
                                        <td className='px-2 py-4 whitespace-nowrap'>{plan.toDate ?? '—'}</td>
                                        <td className='px-2 py-4 whitespace-nowrap'>{plan.submittedAt}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${approvalStatusColor[plan.approvalStatus]}`}>
                                                {plan.approvalStatus}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 rounded-e-lg'>
                                            <label className={`inline-flex items-center gap-2 ${plan.markAsDone ? 'cursor-default' : 'cursor-pointer'}`}>
                                                <input
                                                    type='checkbox'
                                                    checked={Boolean(plan.markAsDone)}
                                                    disabled={Boolean(plan.markAsDone)}
                                                    onChange={() => handleMarkAsDoneClick(plan)}
                                                    className='size-4 accent-[#515DEF] cursor-pointer disabled:cursor-default'
                                                />
                                                <span className='text-sm text-[#1E1E1E]'>
                                                    {plan.markAsDone ? 'Done' : 'Mark as Done'}
                                                </span>
                                            </label>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filteredPlans.length} of {filteredPlans.length} entries
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
            <MarkAsDoneConfirmModal
                open={Boolean(confirmPlan)}
                plan={confirmPlan}
                onCancel={() => setConfirmPlan(null)}
                onConfirm={handleConfirmMarkAsDone}
            />
        </section>
    )
}

export default MyLessonPlan
