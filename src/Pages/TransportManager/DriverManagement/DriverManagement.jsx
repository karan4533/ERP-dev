import React, { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, EllipsisIcon, Download } from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import ListPagination, { PageSizeSelect } from '../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../Common/useListPagination'
import { emptyListMessage } from '../../../Common/listPagination'
import { filterListRows } from '../../../Common/listFiltering'
import {
    getDrivers,
    hydrateDriversFromApi,
    DRIVER_STATUSES,
    getDriverDisplayName,
} from './driverManagementData'

const DriverManagement = () => {
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [DRIVERS, setDrivers] = useState(() => getDrivers())

    useEffect(() => {
        hydrateDriversFromApi().finally(() => setDrivers(getDrivers()))
    }, [])

    const filteredDrivers = useMemo(
        () => filterListRows(
            DRIVERS.map((driver) => ({ ...driver, displayName: getDriverDisplayName(driver) })),
            {
                search,
                searchKeys: ['displayName', 'id', 'email', 'mobileNumber', 'licenseNumber', 'experience', 'city', 'state'],
                fromDate,
                toDate,
                dateKeys: ['joiningDate'],
            },
        ).filter((driver) => !status || (driver.status || 'Active') === status),
        [DRIVERS, search, status, fromDate, toDate],
    )
    const pagination = useListPagination(filteredDrivers, {
        resetKey: [search, status, fromDate?.getTime(), toDate?.getTime()].join('|'),
    })

    const clearFilters = () => {
        setSearch('')
        setStatus('')
        setFromDate(null)
        setToDate(null)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button type='button' onClick={clearFilters} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>
                        Clear Filters
                    </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input type='text' id='search' value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Name, ID, license...' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>Status</label>
                        <select id='status' value={status} onChange={(e) => setStatus(e.target.value)} className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {DRIVER_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Joined From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Joined To</label>
                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
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
                    <h2 className='text-xl font-medium text-black'>Driver Management</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <PageSizeSelect pagination={pagination} className='my-2' />
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Profile</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Driver Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Driver-ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Email-ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Gender</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Mobile Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>License Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Experience</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>City</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>State</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDrivers.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className='px-2 py-8 text-center text-[#667085]'>{emptyListMessage(DRIVERS.length)}</td>
                                </tr>
                            ) : null}
                            {pagination.rows.map((driver) => (
                                <tr key={driver.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                    <td className='px-2 py-4 object-cover flex justify-center rounded-s-lg'>
                                        <img src={driver.profileImage || mo_user} alt='' className='w-9 h-9 rounded-full object-cover' />
                                    </td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{getDriverDisplayName(driver)}</td>
                                    <td className='px-2 py-4'>{driver.id}</td>
                                    <td className='px-2 py-4'>{driver.email}</td>
                                    <td className='px-2 py-4'>{driver.gender}</td>
                                    <td className='px-2 py-4'>{driver.mobileNumber}</td>
                                    <td className='px-2 py-4'>{driver.licenseNumber}</td>
                                    <td className='px-2 py-4'>{driver.experience}</td>
                                    <td className='px-2 py-4'>{driver.city}</td>
                                    <td className='px-2 py-4'>{driver.state}</td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink
                                                to={`/transport-manager/driver-management/view/${driver.id}`}
                                                className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                            >
                                                View
                                            </NavLink>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ListPagination pagination={pagination} />

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='drivermanagement'
                title='DriverManagement'
                rows={filteredDrivers}
                exportDescription={<>You are exporting {filteredDrivers.length} record(s).</>}
            />
        </section>
    )
}

export default DriverManagement
