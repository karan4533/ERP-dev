import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon } from 'lucide-react'
import mo_user from '../../assets/images/no-profile.png'
import Dropdown from '../CommonComponents/Dropdown'
import ExportModal from '../CommonComponents/ExportModal'
import { DEPARTMENTS, EMPLOYEES_LIST } from '../EmployeeDatabase/employeeDatabaseData'
import { canUseEmployeeDirectoryApi, loadEmployeeDirectory } from '../../services/employeeDirectoryApi'

const PAGE_SIZE = 10

// Joining dates arrive as YYYY-MM-DD or DD-MM-YYYY.
const parseDay = (value) => {
    const text = String(value || '').trim()
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    const dmy = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
    return null
}

const dayStart = (date) => (date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null)

// HR data mixes "Teacher" and "teacher"; one option per value regardless of case.
const sortedValues = (rows, pick) => {
    const byKey = new Map()
    rows.forEach((row) => {
        const value = String(pick(row) || '').trim()
        if (!value || value === '—') return
        const key = value.toLowerCase()
        if (!byKey.has(key) || /^[A-Z]/.test(value)) byKey.set(key, value)
    })
    return [...byKey.values()].sort((a, b) => a.localeCompare(b))
}

const sameText = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase()

const EmployeeDatabaseListView = ({
    routeBase,
    title = 'Employee Database',
    subtitle = 'Employees created through User Creation appear here automatically.',
    fixedDepartmentFilter = '',
    showDepartmentFilter = true,
    // (employee) => boolean; when given, a Teaching / Non-teaching filter is shown.
    isTeachingStaff = null,
}) => {
    const location = useLocation()
    const api = canUseEmployeeDirectoryApi()
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [search, setSearch] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState(fixedDepartmentFilter)
    const [roleFilter, setRoleFilter] = useState('')
    const [staffTypeFilter, setStaffTypeFilter] = useState('')
    const [page, setPage] = useState(1)
    const [employees, setEmployees] = useState(() => (api ? [] : [...EMPLOYEES_LIST]))
    const [loadError, setLoadError] = useState('')

    useEffect(() => {
        if (!api) {
            setEmployees([...EMPLOYEES_LIST])
            return undefined
        }
        let active = true
        loadEmployeeDirectory()
            .then(({ records }) => {
                if (!active) return
                // The directory returns { row, detail } pairs; the table works on rows.
                setEmployees((records || []).map(({ row, detail }) => ({
                    ...row,
                    designation: detail?.employmentInfo?.designation || row.role,
                    joiningDate: detail?.professionalInfo?.joiningDate || '',
                })))
                setLoadError('')
            })
            .catch((error) => {
                if (!active) return
                setEmployees([])
                setLoadError(error?.message || 'Employees could not be loaded.')
            })
        return () => {
            active = false
        }
    }, [api, location.key])

    useEffect(() => {
        setDepartmentFilter(fixedDepartmentFilter)
    }, [fixedDepartmentFilter])

    const departmentOptions = useMemo(
        () => sortedValues([...DEPARTMENTS.map((department) => ({ department })), ...employees], (e) => e.department),
        [employees],
    )
    const roleOptions = useMemo(() => sortedValues(employees, (e) => e.role), [employees])

    const filteredEmployees = useMemo(() => {
        const query = search.trim().toLowerCase()
        const from = dayStart(fromDate)
        const to = dayStart(toDate)
        return employees.filter((employee) => {
            if (departmentFilter && !sameText(employee.department, departmentFilter)) return false
            if (roleFilter && !sameText(employee.role, roleFilter)) return false
            if (staffTypeFilter && isTeachingStaff) {
                const teaching = Boolean(isTeachingStaff(employee))
                if ((staffTypeFilter === 'teaching') !== teaching) return false
            }
            if (from || to) {
                const joined = parseDay(employee.joiningDate)
                if (!joined) return false
                if ((from && joined < from) || (to && joined > to)) return false
            }
            if (!query) return true
            const haystack = `${employee.employeeId} ${employee.name} ${employee.department} ${employee.role} ${employee.email}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [employees, search, departmentFilter, roleFilter, staffTypeFilter, isTeachingStaff, fromDate, toDate])

    const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE))
    const currentPage = Math.min(page, pageCount)
    const pageEmployees = filteredEmployees.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    const withPageReset = (setter) => (value) => {
        setter(value)
        setPage(1)
    }

    const clearFilters = () => {
        setSearch('')
        setRoleFilter('')
        setStaffTypeFilter('')
        setFromDate(null)
        setToDate(null)
        setPage(1)
        if (!fixedDepartmentFilter) {
            setDepartmentFilter('')
        }
    }

    return (
        <section>
            {loadError ? <p className='text-sm text-[#B42318] mb-3'>{loadError}</p> : null}
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-end'>
                    <button type='button' onClick={clearFilters} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:mt-6 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='employee-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input id='employee-search' type='text' value={search} onChange={(e) => withPageReset(setSearch)(e.target.value)} placeholder='Employee ID, name...' className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    {isTeachingStaff && (
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='employee-staff-type' className='text-base font-medium text-[#808080]'>Staff type</label>
                            <select id='employee-staff-type' value={staffTypeFilter} onChange={(e) => withPageReset(setStaffTypeFilter)(e.target.value)} className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                                <option value=''>All</option>
                                <option value='teaching'>Teaching</option>
                                <option value='non-teaching'>Non-teaching</option>
                            </select>
                        </div>
                    )}
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='employee-role' className='text-base font-medium text-[#808080]'>Role</label>
                        <select id='employee-role' value={roleFilter} onChange={(e) => withPageReset(setRoleFilter)(e.target.value)} className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {roleOptions.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    {showDepartmentFilter && (
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='employee-department' className='text-base font-medium text-[#808080]'>Department</label>
                            <select id='employee-department' value={departmentFilter} onChange={(e) => withPageReset(setDepartmentFilter)(e.target.value)} disabled={Boolean(fixedDepartmentFilter)} className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                                <option value=''>All</option>
                                {departmentOptions.map((department) => (
                                    <option key={department} value={department}>{department}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Joining date from</label>
                        <div className='relative'>
                            <DatePicker selected={fromDate} onChange={withPageReset(setFromDate)} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Joining date to</label>
                        <div className='relative'>
                            <DatePicker selected={toDate} onChange={withPageReset(setToDate)} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>{title}</h2>
                        {subtitle ? <p className='text-sm text-[#667085] mt-1'>{subtitle}</p> : null}
                    </div>
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
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Employee ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Department</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Role</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Gender</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Email</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Mobile Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date Of Birth</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Qualification</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Experience</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Country</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>State</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>City</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={15} className='px-2 py-8 text-center text-[#667085]'>No employees found.</td>
                                </tr>
                            ) : (
                                pageEmployees.map((employee) => (
                                    <tr key={employee.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 flex justify-center rounded-s-lg'>
                                            <img src={employee.profileImage || mo_user} alt='' className='w-9 h-9 rounded-full object-cover' />
                                        </td>
                                        <td className='px-2 py-4'>{employee.employeeId}</td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{employee.name}</td>
                                        <td className='px-2 py-4'>{employee.department}</td>
                                        <td className='px-2 py-4'>{employee.role}</td>
                                        <td className='px-2 py-4'>{employee.gender}</td>
                                        <td className='px-2 py-4'>{employee.email}</td>
                                        <td className='px-2 py-4'>{employee.mobileNumber}</td>
                                        <td className='px-2 py-4'>{employee.dateOfBirth}</td>
                                        <td className='px-2 py-4'>{employee.qualification}</td>
                                        <td className='px-2 py-4'>{employee.experience}</td>
                                        <td className='px-2 py-4'>{employee.country}</td>
                                        <td className='px-2 py-4'>{employee.state}</td>
                                        <td className='px-2 py-4'>{employee.city}</td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink to={`${routeBase}/view/${employee.id}`} className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>View</NavLink>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    {filteredEmployees.length === 0
                        ? `Showing 0 of ${employees.length} entries`
                        : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, filteredEmployees.length)} of ${filteredEmployees.length} entries${filteredEmployees.length !== employees.length ? ` (${employees.length} total)` : ''}`}
                </p>
                <div className='flex items-center gap-x-2'>
                    <button type='button' aria-label='Previous page' disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'><ChevronLeft size={16} /></button>
                    <span className='text-sm text-[#515DEF]'>{currentPage} / {pageCount}</span>
                    <button type='button' aria-label='Next page' disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)} className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'><ChevronRight size={16} /></button>
                </div>
            </div>

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='employee-database'
                rows={filteredEmployees.map((e) => ({
                    employeeId: e.employeeId || e.id,
                    name: e.name,
                    department: e.department,
                    designation: e.designation,
                    status: e.status,
                    email: e.email,
                }))}
                exportDescription={<>You are exporting {filteredEmployees.length} record{filteredEmployees.length === 1 ? '' : 's'}.</>}
            />
        </section>
    )
}

export default EmployeeDatabaseListView
