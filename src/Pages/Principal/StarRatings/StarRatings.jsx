import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { EllipsisIcon, ChevronLeft, ChevronRight, Plus, Download, Trophy, Star } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import EditRequestModal from '../../../Common/CommonComponents/EditRequestModal'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import StarRatingDisplay from './Components/StarRatingDisplay'
import {
    ACADEMIC_YEARS,
    EMPLOYEE_TYPE_OPTIONS,
    MOCK_SOM_RATINGS,
    RATING_CATEGORY,
    ROUTE_BASE,
    SOY_MONTH_COUNT,
    getAvailableSomMonths,
    getConsolidatedSoyRatings,
    getEmployeeTypeLabel,
    getStarOfMonth,
    getStarOfYear,
} from './starRatingsData'

const StarRatings = ({ view = 'som' }) => {
    const isSom = view === 'som'
    const months = useMemo(() => getAvailableSomMonths(), [])
    const [search, setSearch] = useState('')
    const [employeeType, setEmployeeType] = useState('')
    const [selectedMonth, setSelectedMonth] = useState(months[months.length - 1] ?? '')
    const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[0])
    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)

    const somRatings = useMemo(() => {
        return MOCK_SOM_RATINGS.filter((item) => {
            const matchesMonth = !selectedMonth || item.month === selectedMonth
            const matchesType = !employeeType || item.employeeType === employeeType
            const query = search.trim().toLowerCase()
            const matchesSearch = !query
                || item.employeeName.toLowerCase().includes(query)
                || item.employeeId.toLowerCase().includes(query)
                || item.department.toLowerCase().includes(query)
                || item.ratingId.toLowerCase().includes(query)
            return matchesMonth && matchesType && matchesSearch
        })
    }, [selectedMonth, employeeType, search])

    const soyRatings = useMemo(
        () => getConsolidatedSoyRatings(academicYear),
        [academicYear],
    )

    const filteredSoyRatings = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return soyRatings
        return soyRatings.filter((item) =>
            item.employeeName.toLowerCase().includes(query)
            || item.employeeId.toLowerCase().includes(query)
            || item.department.toLowerCase().includes(query),
        )
    }, [soyRatings, search])

    const starOfMonth = useMemo(
        () => (selectedMonth ? getStarOfMonth(selectedMonth) : null),
        [selectedMonth],
    )

    const starOfYear = useMemo(
        () => getStarOfYear(academicYear),
        [academicYear],
    )

    const clearFilters = () => {
        setSearch('')
        setEmployeeType('')
        if (isSom) {
            setSelectedMonth(months[months.length - 1] ?? '')
        } else {
            setAcademicYear(ACADEMIC_YEARS[0])
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    {!isSom && (
                        <p className='text-sm text-[#667085]'>
                            Annual rating consolidated from {SOY_MONTH_COUNT} months of SOM data.
                        </p>
                    )}
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:mt-6 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Name, ID, department...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='employee-type' className='text-base font-medium text-[#808080]'>Employee Type</label>
                        <select
                            id='employee-type'
                            value={employeeType}
                            onChange={(e) => setEmployeeType(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'
                        >
                            <option value=''>All</option>
                            {EMPLOYEE_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    {isSom ? (
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='month' className='text-base font-medium text-[#808080]'>Month</label>
                            <select
                                id='month'
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'
                            >
                                {months.map((month) => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='academic-year' className='text-base font-medium text-[#808080]'>Academic Year</label>
                            <select
                                id='academic-year'
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                                className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'
                            >
                                {ACADEMIC_YEARS.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {isSom && starOfMonth && (
                <div
                    className='mt-6 rounded-2xl shadow-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
                    style={{ background: 'linear-gradient(135deg, #515DEF14 0%, #FFC10714 100%)' }}
                >
                    <div className='flex items-center gap-4'>
                        <div className='size-12 rounded-full bg-[#FFC10733] flex items-center justify-center'>
                            <Trophy className='text-[#B8860B]' size={24} />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-[#B8860B]'>Star of the Month — {starOfMonth.month}</p>
                            <h3 className='text-xl font-bold text-[#0C1E5B]'>{starOfMonth.employeeName}</h3>
                            <p className='text-sm text-[#667085]'>
                                {getEmployeeTypeLabel(starOfMonth.employeeType)} · {starOfMonth.department} · {starOfMonth.employeeId}
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#FFC10766]'>
                        <Star size={18} className='fill-[#FFC107] text-[#FFC107]' />
                        <StarRatingDisplay rating={starOfMonth.rating} />
                    </div>
                </div>
            )}

            {!isSom && starOfYear && (
                <div
                    className='mt-6 rounded-2xl shadow-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
                    style={{ background: 'linear-gradient(135deg, #515DEF14 0%, #FFC10714 100%)' }}
                >
                    <div className='flex items-center gap-4'>
                        <div className='size-12 rounded-full bg-[#FFC10733] flex items-center justify-center'>
                            <Trophy className='text-[#B8860B]' size={24} />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-[#B8860B]'>Star of the Year — {academicYear}</p>
                            <h3 className='text-xl font-bold text-[#0C1E5B]'>{starOfYear.employeeName}</h3>
                            <p className='text-sm text-[#667085]'>
                                {getEmployeeTypeLabel(starOfYear.employeeType)} · {starOfYear.department} · {starOfYear.employeeId}
                            </p>
                        </div>
                    </div>
                    <div className='text-right'>
                        <p className='text-xs text-[#808080] mb-1'>
                            Avg across {starOfYear.monthsRated}/{SOY_MONTH_COUNT} months
                        </p>
                        <div className='flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#FFC10766]'>
                            <Star size={18} className='fill-[#FFC107] text-[#FFC107]' />
                            <span className='text-lg font-bold text-[#0C1E5B]'>{starOfYear.averageRating}</span>
                            <StarRatingDisplay rating={starOfYear.annualRating} />
                        </div>
                    </div>
                </div>
            )}

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>
                        {isSom ? 'Star of the Month' : 'Star of the Year'}
                    </h2>
                    <div className='flex gap-x-2'>
                        {isSom && (
                            <NavLink
                                to={`${ROUTE_BASE}/add-ratings`}
                                className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                            >
                                <Plus size={16} />
                                Add Ratings
                            </NavLink>
                        )}
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

                {isSom ? (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left rtl:text-right'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr className='rounded-lg'>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Rating ID</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Month</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Employee Type</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Employee Name</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Employee ID</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Department</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>{RATING_CATEGORY}</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Description</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {somRatings.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className='px-2 py-8 text-center text-[#667085]'>
                                            No star ratings found for the selected filters.
                                        </td>
                                    </tr>
                                ) : (
                                    somRatings.map((entry) => (
                                        <tr
                                            key={entry.ratingId}
                                            className={`border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg ${
                                                starOfMonth?.ratingId === entry.ratingId ? 'bg-[#FFC10708]' : ''
                                            }`}
                                        >
                                            <td className='px-2 py-4 rounded-s-lg'>{entry.ratingId}</td>
                                            <td className='px-2 py-4'>{entry.month}</td>
                                            <td className='px-2 py-4'>{getEmployeeTypeLabel(entry.employeeType)}</td>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{entry.employeeName}</td>
                                            <td className='px-2 py-4'>{entry.employeeId}</td>
                                            <td className='px-2 py-4'>{entry.department}</td>
                                            <td className='px-2 py-4'>
                                                <StarRatingDisplay rating={entry.rating} />
                                            </td>
                                            <td className='px-2 py-4 max-w-xs truncate' title={entry.description}>
                                                {entry.description}
                                            </td>
                                            <td className='px-2 py-4 text-center rounded-e-lg'>
                                                <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                    <button type='button' className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>
                                                        View
                                                    </button>
                                                    <button
                                                        type='button'
                                                        onClick={() => setEditRequestModal(true)}
                                                        className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type='button'
                                                        onClick={() => setDeleteRequestModal(true)}
                                                        className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        Delete
                                                    </button>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left rtl:text-right'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr className='rounded-lg'>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Employee Type</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Employee Name</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Employee ID</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Department</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Months Rated</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Average Rating</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Annual Rating</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Academic Year</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSoyRatings.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>
                                            No consolidated ratings found for the selected academic year.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSoyRatings.map((entry) => (
                                        <tr
                                            key={entry.employeeId}
                                            className={`border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg ${
                                                starOfYear?.employeeId === entry.employeeId ? 'bg-[#FFC10708]' : ''
                                            }`}
                                        >
                                            <td className='px-2 py-4 rounded-s-lg'>{getEmployeeTypeLabel(entry.employeeType)}</td>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{entry.employeeName}</td>
                                            <td className='px-2 py-4'>{entry.employeeId}</td>
                                            <td className='px-2 py-4'>{entry.department}</td>
                                            <td className='px-2 py-4'>{entry.monthsRated} / {SOY_MONTH_COUNT}</td>
                                            <td className='px-2 py-4 font-semibold text-[#0C1E5B]'>{entry.averageRating}</td>
                                            <td className='px-2 py-4'>
                                                <StarRatingDisplay rating={entry.annualRating} />
                                            </td>
                                            <td className='px-2 py-4 rounded-e-lg'>{entry.academicYear}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing {isSom ? somRatings.length : filteredSoyRatings.length} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />
        </section>
    )
}

export default StarRatings
