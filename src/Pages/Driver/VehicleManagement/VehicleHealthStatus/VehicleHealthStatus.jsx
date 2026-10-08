import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon, Plus } from 'lucide-react'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import DeleteRequestModal from '../../../../Common/CommonComponents/DeleteRequestModal'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import {
    CONDITION_OPTIONS,
    HEALTH_STATUS_RECORDS,
    VEHICLE_NUMBERS,
    filterHealthStatusRecords,
} from './vehicleHealthStatusData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const VehicleHealthStatus = () => {
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)
    const [exportModal, setExportModal] = useState(false)
    const [search, setSearch] = useState('')
    const [vehicleNumber, setVehicleNumber] = useState('')
    const [engineStatus, setEngineStatus] = useState('')
    const [tyreCondition, setTyreCondition] = useState('')
    const [period, setPeriod] = useState('')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)

    const filteredRecords = useMemo(() => filterHealthStatusRecords({
        records: HEALTH_STATUS_RECORDS,
        search,
        vehicleNumber,
        engineStatus,
        tyreCondition,
        fromDate,
        toDate,
    }), [search, vehicleNumber, engineStatus, tyreCondition, fromDate, toDate])

    const clearFilters = () => {
        setSearch('')
        setVehicleNumber('')
        setEngineStatus('')
        setTyreCondition('')
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
                        <label htmlFor='health-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='health-search'
                            type='text'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Vehicle, remarks, odometer...'
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='vehicle-filter' className='text-base font-medium text-[#808080]'>Vehicle Number</label>
                        <select
                            id='vehicle-filter'
                            value={vehicleNumber}
                            onChange={(event) => setVehicleNumber(event.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {VEHICLE_NUMBERS.map((number) => (
                                <option key={number} value={number}>{number}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='engine-filter' className='text-base font-medium text-[#808080]'>Engine Status</label>
                        <select
                            id='engine-filter'
                            value={engineStatus}
                            onChange={(event) => setEngineStatus(event.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {CONDITION_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='tyre-filter' className='text-base font-medium text-[#808080]'>Tyre Condition</label>
                        <select
                            id='tyre-filter'
                            value={tyreCondition}
                            onChange={(event) => setTyreCondition(event.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {CONDITION_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Last Service From</label>
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
                        <label className='text-base font-medium text-[#808080]'>Last Service To</label>
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
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Vehicle Health Status</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Track vehicle condition, service dates, and health metrics
                        </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                        <NavLink
                            to='/driver/vehicle-management/vehicle-health-status/add'
                            className='inline-flex items-center justify-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                        >
                            <Plus size={16} />
                            Add Health Status
                        </NavLink>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
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
                    <table className='w-full text-sm text-left min-w-[1100px]'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Vehicle Number</th>
                                <th className={thClass}>Last Service Date</th>
                                <th className={thClass}>Next Service Date</th>
                                <th className={thClass}>Odometer Reading</th>
                                <th className={thClass}>Fuel Level</th>
                                <th className={thClass}>Tyre Condition</th>
                                <th className={thClass}>Battery Status</th>
                                <th className={thClass}>Engine Status</th>
                                <th className={thClass}>Remarks</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className='px-2 py-8 text-center text-[#667085]'>
                                        No health status records found for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className={`${tdClass} rounded-s-lg font-medium text-[#1E1E1E]`}>
                                            {record.vehicleNumber}
                                        </td>
                                        <td className={tdClass}>{record.lastServiceDate}</td>
                                        <td className={tdClass}>{record.nextServiceDate}</td>
                                        <td className={tdClass}>{record.odometerReading}</td>
                                        <td className={tdClass}>{record.fuelLevel}</td>
                                        <td className={tdClass}>{record.tyreCondition}</td>
                                        <td className={tdClass}>{record.batteryStatus}</td>
                                        <td className={tdClass}>{record.engineStatus}</td>
                                        <td className={`${tdClass} max-w-[220px] truncate`} title={record.remarks}>
                                            {record.remarks}
                                        </td>
                                        <td className={`${tdClass} rounded-e-lg text-center`}>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={`/driver/vehicle-management/vehicle-health-status/view/${record.id}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    View
                                                </NavLink>
                                                <NavLink
                                                    to={`/driver/vehicle-management/vehicle-health-status/edit/${record.id}`}
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
                    <p className='text-sm text-[#515DEF]'>
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

export default VehicleHealthStatus
