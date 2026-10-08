import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Download, EllipsisIcon } from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import RemoveAllocationModal from './Components/RemoveAllocationModal'
import {
    DEPARTMENTS,
    GRADES,
    ROUTE_BASE,
    SUBJECTS,
    ALLOCATION_STATUSES,
    allocationStatusColor,
    emptyTeacherAllocationFilters,
    filterTeacherAllocationRows,
    getTeacherAllocationRows,
    removeTeacherAllocation,
} from './teacherAllocationData'

const filterInputClass =
    'text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'

const TeacherAllocationList = () => {
    const location = useLocation()
    const [rows, setRows] = useState(() => getTeacherAllocationRows())
    const [filters, setFilters] = useState(emptyTeacherAllocationFilters)
    const [exportModal, setExportModal] = useState(false)
    const [entriesPerPage, setEntriesPerPage] = useState(10)
    const [removeTarget, setRemoveTarget] = useState(null)

    const filteredRows = useMemo(() => filterTeacherAllocationRows(rows, filters), [rows, filters])

    useEffect(() => {
        setRows(getTeacherAllocationRows())
    }, [location.key])

    const refreshRows = () => setRows(getTeacherAllocationRows())

    const updateFilter = (key, value) => {
        setFilters((current) => ({ ...current, [key]: value }))
    }

    const clearFilters = () => setFilters(emptyTeacherAllocationFilters)

    const handleRemoveConfirm = () => {
        if (!removeTarget) return
        removeTeacherAllocation(removeTarget.employeeId)
        setRemoveTarget(null)
        refreshRows()
    }

    const exportDescription = (
        <>
            You are exporting {String(filteredRows.length).padStart(2, '0')} teacher allocation records.
        </>
    )

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-sm text-[#667085] mb-4'>
                    Allocate newly joined and existing teachers to classes, subjects, and class teacher roles.
                </p>
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
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            placeholder='Employee ID, name...'
                            className={filterInputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='department' className='text-base font-medium text-[#808080]'>Department</label>
                        <select
                            id='department'
                            value={filters.department}
                            onChange={(e) => updateFilter('department', e.target.value)}
                            className={filterInputClass}
                        >
                            <option value=''>All</option>
                            {DEPARTMENTS.map((item) => (
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
                            {GRADES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
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
                            {SUBJECTS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status-filter'
                            value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value)}
                            className={filterInputClass}
                        >
                            <option value=''>All</option>
                            {ALLOCATION_STATUSES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Teacher Allocation List</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select
                        value={entriesPerPage}
                        onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                        className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Employee ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Teacher Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Profile Photo</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class Teacher</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Teaching Classes</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Assigned Subjects</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.slice(0, entriesPerPage).map((row) => (
                                <tr key={row.employeeId} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{row.employeeId}</td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{row.name}</td>
                                    <td className='px-2 py-4'>
                                        <img
                                            src={row.profilePhoto || mo_user}
                                            alt={row.name}
                                            className='w-10 h-10 rounded-full object-cover'
                                        />
                                    </td>
                                    <td className='px-2 py-4 whitespace-nowrap'>{row.classTeacherLabel}</td>
                                    <td className='px-2 py-4 max-w-[180px] truncate' title={row.teachingClassesLabel}>{row.teachingClassesLabel}</td>
                                    <td className='px-2 py-4 max-w-[160px] truncate' title={row.subjectsLabel}>{row.subjectsLabel}</td>
                                    <td className='px-2 py-4'>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${allocationStatusColor[row.status]}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink
                                                to={`${ROUTE_BASE}/allocate/${row.employeeId}`}
                                                className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                            >
                                                Allocate
                                            </NavLink>
                                            {row.status !== 'Not Allocated' && (
                                                <>
                                                    <NavLink
                                                        to={`${ROUTE_BASE}/view/${row.employeeId}`}
                                                        className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        View
                                                    </NavLink>
                                                    <NavLink
                                                        to={`${ROUTE_BASE}/edit/${row.employeeId}`}
                                                        className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        Edit
                                                    </NavLink>
                                                    <button
                                                        type='button'
                                                        onClick={() => setRemoveTarget(row)}
                                                        className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        Remove Allocation
                                                    </button>
                                                </>
                                            )}
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {Math.min(filteredRows.length, entriesPerPage)} of {filteredRows.length} entries
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
            <RemoveAllocationModal
                open={Boolean(removeTarget)}
                teacherName={removeTarget?.name}
                onCancel={() => setRemoveTarget(null)}
                onConfirm={handleRemoveConfirm}
            />
        </section>
    )
}

export default TeacherAllocationList
