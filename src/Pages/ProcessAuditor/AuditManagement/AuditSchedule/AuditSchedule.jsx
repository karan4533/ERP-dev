import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, LayoutList, CalendarDays } from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import AuditScheduleCalendar from './AuditScheduleCalendar'
import {
    getAuditSchedules,
    DEPARTMENTS,
    FREQUENCIES,
    SCHEDULE_STATUSES,
    statusBadgeColor,
} from './auditScheduleData'

const AuditSchedule = () => {
    const location = useLocation()
    const [schedules, setSchedules] = useState(() => getAuditSchedules())
    const [viewMode, setViewMode] = useState('list')
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)

    useEffect(() => {
        setSchedules(getAuditSchedules())
    }, [location.pathname])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap items-center justify-between gap-4 mb-4'>
                    <p className='text-sm text-[#667085]'>
                        Displays upcoming audit schedules.
                    </p>
                    <div className='flex rounded-lg border border-[#D9D9D9] overflow-hidden text-sm font-medium'>
                        <button
                            type='button'
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-4 py-2 transition cursor-pointer ${viewMode === 'list'
                                ? 'bg-[#515DEF] text-white'
                                : 'text-[#667085] hover:bg-[#f2f4f7]'
                                }`}
                        >
                            <LayoutList size={16} />
                            List
                        </button>
                        <button
                            type='button'
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center gap-2 px-4 py-2 transition cursor-pointer ${viewMode === 'calendar'
                                ? 'bg-[#515DEF] text-white'
                                : 'text-[#667085] hover:bg-[#f2f4f7]'
                                }`}
                        >
                            <CalendarDays size={16} />
                            Calendar
                        </button>
                    </div>
                </div>

                {viewMode === 'list' && (
                    <>
                        <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                            <button type='button' className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>
                                Clear Filters
                            </button>
                            <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                                <option value=''>From Beginning</option>
                            </select>
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                            <div className='flex flex-col gap-y-2'>
                                <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                                <input type='text' id='search' placeholder='Schedule ID, audit ID, audit name...' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                            </div>
                            <div className='flex flex-col gap-y-2'>
                                <label htmlFor='department-filter' className='text-base font-medium text-[#808080]'>Department</label>
                                <select id='department-filter' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                                    <option value=''>All</option>
                                    {DEPARTMENTS.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='flex flex-col gap-y-2'>
                                <label htmlFor='frequency-filter' className='text-base font-medium text-[#808080]'>Frequency</label>
                                <select id='frequency-filter' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                                    <option value=''>All</option>
                                    {FREQUENCIES.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='flex flex-col gap-y-2'>
                                <label htmlFor='status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                                <select id='status-filter' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                                    <option value=''>All</option>
                                    {SCHEDULE_STATUSES.map((item) => (
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
                                        className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                                    />
                                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {viewMode === 'list' ? (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                        <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                            <h2 className='text-xl font-medium text-black'>Audit Schedule List</h2>
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
                            <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                                <option value='10'>10</option>
                                <option value='20'>20</option>
                                <option value='30'>30</option>
                            </select>
                            <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                        </div>
                        <div className='relative overflow-x-auto'>
                            <table className='w-full text-sm text-left rtl:text-right'>
                                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                    <tr className='rounded-lg'>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Schedule ID</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Audit ID</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Audit Name</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Assigned Date</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Due Date</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Assigned By</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedules.map((record) => (
                                        <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.scheduleId}</td>
                                            <td className='px-2 py-4 font-medium text-[#515DEF] whitespace-nowrap'>{record.auditId}</td>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E] max-w-[180px] truncate' title={record.auditName}>{record.auditName}</td>
                                            <td className='px-2 py-4 whitespace-nowrap'>{record.assignedDate}</td>
                                            <td className='px-2 py-4 whitespace-nowrap'>{record.dueDate}</td>
                                            <td className='px-2 py-4'>{record.assignedBy}</td>
                                            <td className='px-2 py-4 rounded-e-lg'>
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[record.status]}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className='flex justify-between items-center px-4 mt-4'>
                        <p className='text-sm font-medium text-[#515DEF]'>
                            Showing 1 to {schedules.length} of {schedules.length} entries
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
                </>
            ) : (
                <div className='mt-8'>
                    <AuditScheduleCalendar />
                </div>
            )}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default AuditSchedule
