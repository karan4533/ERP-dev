import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon, Plus } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    APPROVAL_STATUSES,
    FUEL_REQUESTS,
    approvalStatusBadgeColor,
    filterFuelRequests,
} from './fuelRequestData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const FuelRequest = () => {
    const [search, setSearch] = useState('')
    const [approvalStatus, setApprovalStatus] = useState('')
    const [period, setPeriod] = useState('')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)

    const filteredRecords = useMemo(() => filterFuelRequests({
        records: FUEL_REQUESTS,
        search,
        approvalStatus,
        fromDate,
        toDate,
    }), [search, approvalStatus, fromDate, toDate])

    const clearFilters = () => {
        setSearch('')
        setApprovalStatus('')
        setPeriod('')
        setFromDate(null)
        setToDate(null)
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center md:flex-row flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select
                        value={period}
                        onChange={(event) => setPeriod(event.target.value)}
                        className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs'
                    >
                        <option value=''>From Beginning</option>
                        <option value='month'>This Month</option>
                        <option value='quarter'>This Quarter</option>
                    </select>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='fuel-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='fuel-search'
                            type='text'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Request ID, vehicle, driver...'
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='approval-filter' className='text-base font-medium text-[#808080]'>Approval Status</label>
                        <select
                            id='approval-filter'
                            value={approvalStatus}
                            onChange={(event) => setApprovalStatus(event.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {APPROVAL_STATUSES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                dateFormat='dd-MM-yyyy'
                                placeholderText='Select date'
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                dateFormat='dd-MM-yyyy'
                                placeholderText='Select date'
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4'>
                    <h2 className='text-xl font-semibold text-black'>Fuel Request List</h2>
                    <div className='flex flex-wrap items-center gap-2'>
                        <NavLink
                            to='/driver/fuel-request/add'
                            className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                        >
                            <Plus size={16} />
                            Add Fuel Request
                        </NavLink>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer uppercase'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                <div className='flex gap-x-2 items-center mb-4'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md text-sm'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                    </select>
                    <span className='text-sm text-[#515DEF]'>Entries Per Page</span>
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left min-w-[1300px]'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Fuel Request ID</th>
                                <th className={thClass}>Vehicle Number</th>
                                <th className={thClass}>Driver Name</th>
                                <th className={thClass}>Driver ID</th>
                                <th className={thClass}>Assigned Route</th>
                                <th className={thClass}>Current Odometer Reading</th>
                                <th className={thClass}>Current Fuel Level</th>
                                <th className={thClass}>Requested Quantity</th>
                                <th className={thClass}>Request Date</th>
                                <th className={thClass}>Approval Status</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className='px-2 py-8 text-center text-[#667085]'>
                                        No fuel requests found for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className={`${tdClass} rounded-s-lg font-medium text-[#1E1E1E]`}>
                                            {record.fuelRequestId}
                                        </td>
                                        <td className={tdClass}>{record.vehicleNumber}</td>
                                        <td className={tdClass}>{record.driverName}</td>
                                        <td className={tdClass}>{record.driverId}</td>
                                        <td className={tdClass}>{record.assignedRoute}</td>
                                        <td className={tdClass}>{record.currentOdometerReading}</td>
                                        <td className={tdClass}>{record.currentFuelLevel}</td>
                                        <td className={tdClass}>{record.requestedQuantity}</td>
                                        <td className={tdClass}>{record.requestDate}</td>
                                        <td className={tdClass}>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${approvalStatusBadgeColor[record.approvalStatus]}`}>
                                                {record.approvalStatus}
                                            </span>
                                        </td>
                                        <td className={`${tdClass} rounded-e-lg text-center`}>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={`/driver/fuel-request/view/${record.id}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    View
                                                </NavLink>
                                                <NavLink
                                                    to={`/driver/fuel-request/edit/${record.id}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    Edit
                                                </NavLink>
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

                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-2'>
                    <p className='text-sm font-medium text-[#515DEF]'>
                        Showing 1 to {filteredRecords.length} of {filteredRecords.length} entries
                    </p>
                    <div className='flex items-center gap-2'>
                        <button type='button' className='size-8 flex items-center justify-center rounded-full border border-[#E2E8F0] text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                            <ChevronLeft size={16} />
                        </button>
                        <button type='button' className='size-8 flex items-center justify-center rounded-full bg-[#515DEF] text-white text-sm font-medium cursor-pointer'>
                            1
                        </button>
                        <button type='button' className='size-8 flex items-center justify-center rounded-full border border-[#E2E8F0] text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <DeleteRequestModal
                deleteRequestModal={deleteRequestModal}
                setDeleteRequestModal={setDeleteRequestModal}
            />
            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default FuelRequest
