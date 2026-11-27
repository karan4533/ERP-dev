import React, { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon } from 'lucide-react'
import Dropdown from '../CommonComponents/Dropdown'
import ExportModal from '../CommonComponents/ExportModal'
import { hydrateEnrolledStudentsFromApi } from '../StudentDatabase/enrolledStudentsData'
import { getStudentProfileImage, getStudentsList } from '../StudentDatabase/studentDatabaseData'
import { isApiStudentsEnabled } from '../../services/apiClient'

const parseLooseDate = (value) => {
    if (!value || value === '—') return null
    const direct = new Date(value)
    if (!Number.isNaN(direct.getTime())) return direct
    const parts = String(value).match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (!parts) return null
    const parsed = new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]))
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

const PAGE_SIZE = 10

const classLabel = (student) => {
    const cls = String(student.className || '').trim()
    const section = String(student.section || '').trim()
    if (student.classSection) return student.classSection
    return cls && section ? `${cls}-${section}` : cls || '—'
}

const StudentDatabaseListView = ({
    routeBase,
    title = 'Student Database',
    emptyMessage = 'No enrolled students yet. Enroll a student from the Admission List to see them here.',
    renderExtraActions,
}) => {
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [classFilter, setClassFilter] = useState('')
    const [sectionFilter, setSectionFilter] = useState('')
    const [genderFilter, setGenderFilter] = useState('')
    const [page, setPage] = useState(1)
    const [exportModal, setExportModal] = useState(false)
    const [rows, setRows] = useState(() => getStudentsList())
    const [loading, setLoading] = useState(isApiStudentsEnabled())

    useEffect(() => {
        let cancelled = false
        if (!isApiStudentsEnabled()) {
            setRows(getStudentsList())
            setLoading(false)
            return undefined
        }
        setLoading(true)
        hydrateEnrolledStudentsFromApi()
            .then(() => {
                if (!cancelled) setRows(getStudentsList())
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [])

    const statusOptions = useMemo(() => {
        const values = new Set()
        rows.forEach((row) => {
            const status = String(row.status || '').trim()
            if (status && status !== '—') values.add(status)
        })
        return Array.from(values).sort()
    }, [rows])

    const classOptions = useMemo(() => {
        const values = new Set(rows.map((row) => String(row.className || '').trim()).filter(Boolean))
        return Array.from(values).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    }, [rows])

    const sectionOptions = useMemo(() => {
        const values = new Set(
            rows
                .filter((row) => !classFilter || String(row.className || '').trim() === classFilter)
                .map((row) => String(row.section || '').trim())
                .filter(Boolean),
        )
        return Array.from(values).sort()
    }, [rows, classFilter])

    const genderOptions = useMemo(() => {
        const values = new Set(rows.map((row) => String(row.gender || '').trim()).filter((v) => v && v !== '—'))
        return Array.from(values).sort()
    }, [rows])

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase()
        const fromTime = fromDate ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime() : null
        const toTime = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999).getTime() : null

        return rows.filter((student) => {
            if (statusFilter && String(student.status || '') !== statusFilter) return false
            if (classFilter && String(student.className || '').trim() !== classFilter) return false
            if (sectionFilter && String(student.section || '').trim() !== sectionFilter) return false
            if (genderFilter && String(student.gender || '').trim() !== genderFilter) return false
            if (query) {
                const haystack = `${student.admissionNumber} ${student.name} ${student.email} ${student.mobileNumber}`.toLowerCase()
                if (!haystack.includes(query)) return false
            }
            if (fromTime != null || toTime != null) {
                const dob = parseLooseDate(student.dateOfBirth)
                if (!dob) return false
                const t = dob.getTime()
                if (fromTime != null && t < fromTime) return false
                if (toTime != null && t > toTime) return false
            }
            return true
        })
    }, [rows, search, statusFilter, classFilter, sectionFilter, genderFilter, fromDate, toDate])

    const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
    const currentPage = Math.min(page, pageCount)
    const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

    const withPageReset = (setter) => (value) => {
        setter(value)
        setPage(1)
    }

    const clearFilters = () => {
        setSearch('')
        setStatusFilter('')
        setClassFilter('')
        setSectionFilter('')
        setGenderFilter('')
        setFromDate(null)
        setToDate(null)
        setPage(1)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button type='button' onClick={clearFilters} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='student-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='student-search'
                            type='text'
                            value={search}
                            onChange={(e) => withPageReset(setSearch)(e.target.value)}
                            placeholder='Admission no, name...'
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='student-class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='student-class-filter'
                            value={classFilter}
                            onChange={(e) => {
                                withPageReset(setClassFilter)(e.target.value)
                                setSectionFilter('')
                            }}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {classOptions.map((value) => (
                                <option key={value} value={value}>{value}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='student-section-filter' className='text-base font-medium text-[#808080]'>Section</label>
                        <select
                            id='student-section-filter'
                            value={sectionFilter}
                            onChange={(e) => withPageReset(setSectionFilter)(e.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {sectionOptions.map((value) => (
                                <option key={value} value={value}>{value}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='student-gender-filter' className='text-base font-medium text-[#808080]'>Gender</label>
                        <select
                            id='student-gender-filter'
                            value={genderFilter}
                            onChange={(e) => withPageReset(setGenderFilter)(e.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {genderOptions.map((value) => (
                                <option key={value} value={value}>{value}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='student-status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='student-status-filter'
                            value={statusFilter}
                            onChange={(e) => withPageReset(setStatusFilter)(e.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Date of birth from</label>
                        <div className='relative'>
                            <DatePicker selected={fromDate} onChange={withPageReset(setFromDate)} isClearable showMonthYearDropdown scrollableMonthYearDropdown placeholderText='DOB from' className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Date of birth to</label>
                        <div className='relative'>
                            <DatePicker selected={toDate} onChange={withPageReset(setToDate)} isClearable showMonthYearDropdown scrollableMonthYearDropdown placeholderText='DOB to' className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>{title}</h2>
                    <button type='button' onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Profile</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Admission Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Gender</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Email</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Mobile Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date Of Birth</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Country</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>State</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>City</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={12} className='px-2 py-10 text-center text-[#667085]'>
                                        Loading students…
                                    </td>
                                </tr>
                            )}
                            {!loading && filteredRows.length === 0 && (
                                <tr>
                                    <td colSpan={12} className='px-2 py-10 text-center text-[#667085]'>
                                        {rows.length === 0
                                            ? emptyMessage
                                            : 'No students match the current filters.'}
                                    </td>
                                </tr>
                            )}
                            {!loading && pageRows.map((student) => (
                                <tr key={student.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className='px-2 py-4 flex justify-center rounded-s-lg'>
                                        <img src={getStudentProfileImage(student)} alt='' className='w-9 h-9 rounded-full object-cover' />
                                    </td>
                                    <td className='px-2 py-4'>{student.admissionNumber}</td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{student.name}</td>
                                    <td className='px-2 py-4 whitespace-nowrap'>{classLabel(student)}</td>
                                    <td className='px-2 py-4'>{student.gender}</td>
                                    <td className='px-2 py-4'>{student.email}</td>
                                    <td className='px-2 py-4'>{student.mobileNumber}</td>
                                    <td className='px-2 py-4'>{student.dateOfBirth}</td>
                                    <td className='px-2 py-4'>{student.country}</td>
                                    <td className='px-2 py-4'>{student.state}</td>
                                    <td className='px-2 py-4'>{student.city}</td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink to={`${routeBase}/view/${student.id}`} className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>View</NavLink>
                                            {renderExtraActions?.(student)}
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
                    {loading || filteredRows.length === 0
                        ? 'Showing 0 entries'
                        : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${(currentPage - 1) * PAGE_SIZE + pageRows.length} of ${filteredRows.length} entries`}
                </p>
                <div className='flex items-center gap-x-2'>
                    <button
                        type='button'
                        aria-label='Previous page'
                        disabled={currentPage <= 1}
                        onClick={() => setPage(currentPage - 1)}
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className='text-sm text-[#515DEF]'>{currentPage} / {pageCount}</span>
                    <button
                        type='button'
                        aria-label='Next page'
                        disabled={currentPage >= pageCount}
                        onClick={() => setPage(currentPage + 1)}
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='student-database'
                rows={filteredRows.map((s) => ({
                    admissionNumber: s.admissionNumber,
                    name: s.name,
                    classSection: classLabel(s),
                    status: s.status,
                    mobileNumber: s.mobileNumber,
                    email: s.email,
                }))}
                exportDescription={<>You are exporting {filteredRows.length} record{filteredRows.length === 1 ? '' : 's'}.</>}
            />
        </section>
    )
}

export default StudentDatabaseListView
