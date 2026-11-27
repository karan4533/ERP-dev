import React, { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon } from 'lucide-react'
import mo_user from '../../../../assets/images/no-profile.png'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import { DEPARTMENTS, EMPLOYEES_LIST, ROUTE_BASE } from './employeeDatabaseData'
import { useEmployeeDirectory } from './useEmployeeDirectory'

const SOURCE_LABEL = { hr: 'HR record', rbac: 'User Creation' }

const EmployeesList = () => {
    const location = useLocation()
    const directory = useEmployeeDirectory()
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [search, setSearch] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState('')
    // Local mode re-reads the browser store on every navigation to this screen (location.key).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const localEmployees = useMemo(() => [...EMPLOYEES_LIST], [location.key])

    const apiMode = directory.apiMode
    const employees = useMemo(
        () => (apiMode ? directory.records.map((record) => record.row) : localEmployees),
        [apiMode, directory.records, localEmployees],
    )
    // HR and User Creation name departments differently, so API mode offers what is actually there.
    const departmentOptions = useMemo(
        () => (apiMode
            ? [...new Set(employees.map((employee) => employee.department).filter((value) => value && value !== '—'))].sort()
            : DEPARTMENTS),
        [apiMode, employees],
    )
    const loading = apiMode && directory.status === 'loading'
    const failed = apiMode && directory.status === 'error'

    const filteredEmployees = useMemo(() => {
        const query = search.trim().toLowerCase()
        return employees.filter((employee) => {
            if (departmentFilter && employee.department !== departmentFilter) return false
            if (!query) return true
            const haystack = `${employee.employeeId} ${employee.name} ${employee.department} ${employee.role} ${employee.email}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [employees, search, departmentFilter])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button type='button' onClick={() => { setSearch(''); setDepartmentFilter('') }} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Search</label>
                        <input type='text' value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Employee ID, name...' className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Department</label>
                        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {departmentOptions.map((department) => (
                                <option key={department} value={department}>{department}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative'>
                            <DatePicker selected={fromDate} onChange={setFromDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker selected={toDate} onChange={setToDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>Employee Database</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            {apiMode
                                ? 'Employee records come from HR. Staff logins created through User Creation are included.'
                                : 'Employees created through User Creation appear here automatically.'}
                        </p>
                    </div>
                    <button type='button' onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                        <Download size={16} />
                        Export
                    </button>
                </div>
                {apiMode && directory.warnings.length > 0 ? (
                    <div role='status' className='mb-4 rounded-lg border border-[#F5C242] bg-[#FFF8E1] p-3 text-sm text-[#7A5B00]'>
                        {directory.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                        <button type='button' onClick={directory.reload} className='mt-1 text-[#515DEF] hover:underline cursor-pointer'>Retry</button>
                    </div>
                ) : null}
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
                            {loading ? (
                                <tr>
                                    <td colSpan={15} className='px-2 py-8 text-center text-[#667085]'>Loading employees…</td>
                                </tr>
                            ) : failed ? (
                                <tr>
                                    <td colSpan={15} className='px-2 py-8 text-center text-[#F44336]' role='alert'>
                                        {directory.error}{' '}
                                        <button type='button' onClick={directory.reload} className='text-[#515DEF] hover:underline cursor-pointer'>Retry</button>
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={15} className='px-2 py-8 text-center text-[#667085]'>
                                        {employees.length === 0 && apiMode ? 'No employees have been added yet.' : 'No employees found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((employee) => (
                                    <tr key={employee.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 flex justify-center rounded-s-lg'>
                                            <img src={employee.profileImage || mo_user} alt='' className='w-9 h-9 rounded-full object-cover' />
                                        </td>
                                        <td className='px-2 py-4'>
                                            {employee.employeeId}
                                            {apiMode && SOURCE_LABEL[employee.source] ? (
                                                <span className='block text-[11px] text-[#98A2B3]'>{SOURCE_LABEL[employee.source]}</span>
                                            ) : null}
                                        </td>
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
                                                <NavLink to={`${ROUTE_BASE}/view/${employee.id}`} className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>View</NavLink>
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
                <p className='text-sm font-medium text-[#515DEF]'>{loading || failed ? '' : `Showing ${filteredEmployees.length} of ${employees.length} entries`}</p>
                <div className='flex gap-x-2'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'><ChevronLeft size={16} /></button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'>1</button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'><ChevronRight size={16} /></button>
                </div>
            </div>

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='employees-list'
                rows={Array.isArray(filteredEmployees) ? filteredEmployees : []}
                exportDescription={<>You are exporting {Array.isArray(filteredEmployees) ? filteredEmployees.length : 0} record(s).</>}
            />
        </section>
    )
}

export default EmployeesList
