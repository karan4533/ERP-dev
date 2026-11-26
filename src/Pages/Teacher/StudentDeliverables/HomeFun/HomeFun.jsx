import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon, Plus } from 'lucide-react'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import pdf_icon from '../../../../assets/images/pdf-icon.png'
import noAssign from '../../../../assets/images/no-assign.png'
import {
    DEFAULT_ROUTE_BASE,
    DELIVERABLE_TYPES,
    filterHomeFunItems,
    getHomeFunItems,
    getRecordAssessmentType,
    formatTotalSubmissions,
    SUBJECTS,
    CLASSES,
    SECTIONS,
    ASSIGNMENT_STATUSES,
    typeBadgeColor,
} from './homeFunData'
import {
    getStudentSubmissionStatus,
} from '../../../Student/StudentDeliverables/studentHomeFunSubmissions'
import { useActiveStudent } from '../../../../context/ActiveStudentContext'

const studentStatusBadgeColor = {
    Submitted: 'bg-[#4CAF5033] text-[#4CAF50]',
    Late: 'bg-[#F4433633] text-[#F44336]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
}

const emptyFilters = {
    search: '',
    type: '',
    subject: '',
    className: '',
    section: '',
    status: '',
    fromDate: null,
    toDate: null,
}

const HomeFunEmpty = ({ routeBase, viewMode }) => {
    const isStudent = viewMode === 'student'

    return (
    <div className='bg-white rounded-2xl shadow-md p-8 sm:p-12 min-h-[420px] flex items-center justify-center'>
        <div className='flex flex-col items-center text-center max-w-md mx-auto'>
            <img src={noAssign} alt='No deliverables found' className='w-72 h-72 object-contain' />
            <h2 className='text-xl sm:text-2xl font-semibold text-[#0C1E5B] mt-6'>
                No Assignment or Homework Found!
            </h2>
            <p className='text-sm sm:text-base text-[#667085] mt-2'>
                {isStudent
                    ? 'There are no assignments or homework available for you at the moment.'
                    : 'It looks like you haven&apos;t added any assignment or homework yet.'}
            </p>
            {!isStudent && (
                <NavLink
                    to={`${routeBase}/add`}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2 mt-8'
                >
                    <Plus size={16} />
                    Add Assignment / Homework
                </NavLink>
            )}
        </div>
    </div>
    )
}

const HomeFunList = ({ items, routeBase, viewMode }) => {
    const isStudent = viewMode === 'student'
    const { activeStudentId } = useActiveStudent()
    const [filters, setFilters] = useState(emptyFilters)
    const [exportModal, setExportModal] = useState(false)

    const filteredItems = useMemo(() => filterHomeFunItems(items, filters), [items, filters])
    const showTotalMarks = filters.type !== 'Homework'
    const tableColumnCount = showTotalMarks
        ? (isStudent ? 13 : 13)
        : (isStudent ? 12 : 12)

    const updateFilter = (key, value) => {
        setFilters((current) => ({ ...current, [key]: value }))
    }

    const clearFilters = () => setFilters(emptyFilters)

    return (
        <>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            value={filters.search}
                            onChange={(event) => updateFilter('search', event.target.value)}
                            placeholder='ID, title...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='type-filter' className='text-base font-medium text-[#808080]'>Assessment Type</label>
                        <select
                            id='type-filter'
                            value={filters.type}
                            onChange={(event) => updateFilter('type', event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {DELIVERABLE_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='subject-filter' className='text-base font-medium text-[#808080]'>Subject</label>
                        <select
                            id='subject-filter'
                            value={filters.subject}
                            onChange={(event) => updateFilter('subject', event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {SUBJECTS.map((subject) => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='class-filter'
                            value={filters.className}
                            onChange={(event) => updateFilter('className', event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {CLASSES.map((item) => (
                                <option key={item} value={item}>Class {item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-filter' className='text-base font-medium text-[#808080]'>Section</label>
                        <select
                            id='section-filter'
                            value={filters.section}
                            onChange={(event) => updateFilter('section', event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {SECTIONS.map((item) => (
                                <option key={item} value={item}>Section {item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status-filter'
                            value={filters.status}
                            onChange={(event) => updateFilter('status', event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {ASSIGNMENT_STATUSES.map((status) => (
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
                        <div className='relative'>
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

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Assignments & Homework List</h2>
                    {!isStudent && (
                        <div className='flex gap-x-2'>
                            <NavLink
                                to={`${routeBase}/add`}
                                className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                            >
                                <Plus size={16} />
                                Add Assignment / Homework
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
                    )}
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                        <option value='40'>40</option>
                        <option value='50'>50</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Assessment Type</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Title</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Description</th>
                                {showTotalMarks && (
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Total Marks</th>
                                )}
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Attachment</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Due Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Assigned Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>
                                    {isStudent ? 'My Status' : 'Total Submissions'}
                                </th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={tableColumnCount} className='px-2 py-8 text-center text-[#667085]'>
                                        No records match the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((record) => {
                                    const assessmentType = getRecordAssessmentType(record)
                                    const isHomework = assessmentType === 'Homework'

                                    return (
                                    <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.assignmentId}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${typeBadgeColor[assessmentType] ?? 'bg-[#EDEEF5] text-[#667085]'}`}>
                                                {assessmentType}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{record.assignmentTitle}</td>
                                        <td className='px-2 py-4'>{record.subject}</td>
                                        <td className='px-2 py-4'>{record.className}</td>
                                        <td className='px-2 py-4'>{record.section}</td>
                                        <td className='px-2 py-4 max-w-xs'>{record.assignmentDescription}</td>
                                        {showTotalMarks && (
                                            <td className='px-2 py-4'>{isHomework ? '—' : (record.totalMarks || '—')}</td>
                                        )}
                                        <td className='px-2 py-4'>
                                            {record.attachment && record.attachment !== '—' ? (
                                                <span className='flex items-center gap-x-2'>
                                                    <img src={pdf_icon} alt='attachment' className='w-6 h-6' />
                                                    <span className='text-sm font-normal text-[#515DEF] max-w-[120px] truncate' title={record.attachment}>
                                                        {record.attachment}
                                                    </span>
                                                </span>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className='px-2 py-4'>{record.dueDate}</td>
                                        <td className='px-2 py-4'>{record.assignedDate}</td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>
                                            {isStudent ? (
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${studentStatusBadgeColor[getStudentSubmissionStatus(record, activeStudentId)]}`}>
                                                    {getStudentSubmissionStatus(record, activeStudentId)}
                                                </span>
                                            ) : (
                                                formatTotalSubmissions(record)
                                            )}
                                        </td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={`${routeBase}/view/${record.id}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    View
                                                </NavLink>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing {filteredItems.length === 0 ? 0 : 1} to {filteredItems.length} of {filteredItems.length} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
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

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </>
    )
}

const HomeFun = ({ routeBase = DEFAULT_ROUTE_BASE, viewMode = 'teacher' }) => {
    const location = useLocation()
    const [items, setItems] = useState(() => getHomeFunItems())

    useEffect(() => {
        setItems(getHomeFunItems())
    }, [location.pathname])

    return (
        <section>
            {items.length === 0 ? (
                <HomeFunEmpty routeBase={routeBase} viewMode={viewMode} />
            ) : (
                <HomeFunList items={items} routeBase={routeBase} viewMode={viewMode} />
            )}
        </section>
    )
}

export default HomeFun
