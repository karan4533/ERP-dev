import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    LOG_TYPES,
    ROUTE_BASE,
    filterActivityLogs,
    getCellValue,
    getListColumns,
    getLogStatusOptions,
    getLogSummary,
    getLogsByType,
    statusBadgeColor,
} from './activityLogsData'

const ActivityLogList = ({ logType }) => {
    const config = LOG_TYPES[logType]
    const [records] = useState(() => getLogsByType(logType))
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [exportModal, setExportModal] = useState(false)

    const columns = useMemo(() => getListColumns(logType), [logType])
    const statusOptions = useMemo(() => getLogStatusOptions(records), [records])

    const filteredRecords = useMemo(
        () => filterActivityLogs(records, { search, status }),
        [records, search, status],
    )

    const summaryCards = useMemo(() => getLogSummary(logType, records), [logType, records])

    const clearFilters = () => {
        setSearch('')
        setStatus('')
        setFromDate(new Date())
        setToDate(new Date())
    }

    if (!config) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                Unknown activity log type.
            </section>
        )
    }

    return (
        <section>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
                {summaryCards.map((card) => (
                    <div key={card.label} className='bg-white rounded-2xl shadow-md p-4'>
                        <p className='text-sm font-medium text-[#808080]'>{card.label}</p>
                        <p className='text-2xl font-semibold text-[#515DEF] mt-2'>{card.value}</p>
                    </div>
                ))}
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={config.searchPlaceholder}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    {statusOptions.length > 0 && (
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='status' className='text-base font-medium text-[#808080]'>Status</label>
                            <select
                                id='status'
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                            >
                                <option value=''>All</option>
                                {statusOptions.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative'>
                            <DatePicker
                                selected={fromDate}
                                onChange={setFromDate}
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
                                onChange={setToDate}
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
                    <h2 className='text-xl font-medium text-black'>{config.listTitle}</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                {columns.map((column, index) => (
                                    <th
                                        key={column.key}
                                        className={`px-2 py-3.5 text-[#0C1E5B] font-medium uppercase ${
                                            index === 0 ? 'rounded-s-lg' : ''
                                        }`}
                                    >
                                        {column.label}
                                    </th>
                                ))}
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + 1} className='px-2 py-8 text-center text-[#667085]'>
                                        No activity logs found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        {columns.map((column, index) => {
                                            const value = getCellValue(record, column)
                                            return (
                                                <td
                                                    key={column.key}
                                                    className={`px-2 py-4 ${index === 0 ? 'rounded-s-lg' : ''}`}
                                                >
                                                    {column.badge ? (
                                                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[value] ?? statusBadgeColor.Pending}`}>
                                                            {value}
                                                        </span>
                                                    ) : (
                                                        value
                                                    )}
                                                </td>
                                            )
                                        })}
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={`${ROUTE_BASE}/view/${record.id}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    View
                                                </NavLink>
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
                    Showing 1 to {filteredRecords.length} of {filteredRecords.length} entries
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

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default ActivityLogList
