import React, { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    DUTY_STATUSES,
    MY_DUTIES,
    SHIFTS,
    dutyStatusBadgeColor,
    filterMyDuties,
} from './myDutyData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const MyDuty = () => {
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [search, setSearch] = useState('')
    const [shift, setShift] = useState('')
    const [status, setStatus] = useState('')
    const [period, setPeriod] = useState('')
    const [exportModal, setExportModal] = useState(false)

    const filteredDuties = useMemo(() => filterMyDuties({
        duties: MY_DUTIES,
        search,
        shift,
        status,
        fromDate,
        toDate,
    }), [search, shift, status, fromDate, toDate])

    const clearFilters = () => {
        setSearch('')
        setShift('')
        setStatus('')
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
                        <option value='week'>This Week</option>
                        <option value='month'>This Month</option>
                    </select>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='duty-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='duty-search'
                            type='text'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Duty ID, route, vehicle...'
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='shift-filter' className='text-base font-medium text-[#808080]'>Shift</label>
                        <select
                            id='shift-filter'
                            value={shift}
                            onChange={(event) => setShift(event.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {SHIFTS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status-filter' className='text-base font-medium text-[#808080]'>Duty Status</label>
                        <select
                            id='status-filter'
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {DUTY_STATUSES.map((item) => (
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
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-semibold text-black'>My Duty List</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>

                <div className='flex gap-x-2 items-center my-2 mb-4'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md text-sm'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                    </select>
                    <span className='text-sm text-[#515DEF]'>Entries Per Page</span>
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left min-w-[1200px]'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Duty ID</th>
                                <th className={thClass}>Duty Date</th>
                                <th className={thClass}>Shift</th>
                                <th className={thClass}>Reporting Time</th>
                                <th className={thClass}>Departure Time</th>
                                <th className={thClass}>Vehicle Number</th>
                                <th className={thClass}>Route Name</th>
                                <th className={thClass}>Pickup Time</th>
                                <th className={thClass}>Drop Time</th>
                                <th className={thClass}>Assigned By</th>
                                <th className={`${thClass} rounded-e-lg`}>Duty Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDuties.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className='px-2 py-8 text-center text-[#667085]'>
                                        No duties found for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredDuties.map((duty) => (
                                    <tr key={duty.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className={`${tdClass} rounded-s-lg font-medium text-[#1E1E1E]`}>
                                            {duty.dutyId}
                                        </td>
                                        <td className={tdClass}>{duty.dutyDate}</td>
                                        <td className={tdClass}>{duty.shift}</td>
                                        <td className={tdClass}>{duty.reportingTime}</td>
                                        <td className={tdClass}>{duty.departureTime}</td>
                                        <td className={tdClass}>{duty.vehicleNumber}</td>
                                        <td className={tdClass}>{duty.routeName}</td>
                                        <td className={tdClass}>{duty.pickupTime}</td>
                                        <td className={tdClass}>{duty.dropTime}</td>
                                        <td className={tdClass}>{duty.assignedBy}</td>
                                        <td className={`${tdClass} rounded-e-lg`}>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${dutyStatusBadgeColor[duty.dutyStatus]}`}>
                                                {duty.dutyStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-2'>
                    <p className='text-sm font-medium text-[#515DEF]'>
                        Showing 1 to {filteredDuties.length} of {filteredDuties.length} entries
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

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default MyDuty
