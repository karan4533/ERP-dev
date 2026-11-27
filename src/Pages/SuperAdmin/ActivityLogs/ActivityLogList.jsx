import React, { useEffect, useMemo, useState } from 'react'
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
    statusBadgeColor,
} from './activityLogsData'
import {
    cacheLiveAuditRows,
    canUseLiveAuditLogs,
    filterRowsForLogType,
    listLiveAuditLogsApi,
    mapAuditApiRow,
} from './liveAuditLogs'

const PAGE_SIZE = 25

const inDateRange = (iso, fromDate, toDate) => {
    if (!fromDate && !toDate) return true
    if (!iso) return false
    const ts = new Date(iso).getTime()
    if (Number.isNaN(ts)) return false
    if (fromDate) {
        const start = new Date(fromDate)
        start.setHours(0, 0, 0, 0)
        if (ts < start.getTime()) return false
    }
    if (toDate) {
        const end = new Date(toDate)
        end.setHours(23, 59, 59, 999)
        if (ts > end.getTime()) return false
    }
    return true
}

const ActivityLogList = ({ logType }) => {
    const config = LOG_TYPES[logType]
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [page, setPage] = useState(1)

    useEffect(() => {
        if (!canUseLiveAuditLogs()) {
            setRecords([])
            setLoadError('Sign in with API auth to load live audit logs.')
            setLoading(false)
            return undefined
        }
        let active = true
        setLoading(true)
        listLiveAuditLogsApi()
            .then((rows) => {
                if (!active) return
                // Cache every campus row (all log-type views) so View can resolve any id.
                const allMapped = (Array.isArray(rows) ? rows : []).map((row) => mapAuditApiRow(row, 'audit-logs'))
                cacheLiveAuditRows(allMapped)
                const typed = filterRowsForLogType(rows, logType).map((row) => mapAuditApiRow(row, logType))
                setRecords(typed)
                setLoadError('')
            })
            .catch((err) => {
                if (!active) return
                setRecords([])
                setLoadError(err?.message || 'Audit logs could not be loaded.')
            })
            .finally(() => {
                if (active) setLoading(false)
            })
        return () => { active = false }
    }, [logType])

    const columns = useMemo(() => getListColumns(logType), [logType])
    const statusOptions = useMemo(() => getLogStatusOptions(records), [records])

    const filteredRecords = useMemo(
        () => filterActivityLogs(
            records.filter((row) => inDateRange(row.createdAtRaw, fromDate, toDate)),
            { search, status },
        ),
        [records, search, status, fromDate, toDate],
    )

    const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE) || 1)
    const currentPage = Math.min(page, pageCount)
    const pageRows = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return filteredRecords.slice(start, start + PAGE_SIZE)
    }, [filteredRecords, currentPage])

    useEffect(() => {
        setPage(1)
    }, [search, status, fromDate, toDate, logType])

    const summaryCards = useMemo(() => getLogSummary(logType, filteredRecords), [logType, filteredRecords])

    const clearFilters = () => {
        setSearch('')
        setStatus('')
        setFromDate(null)
        setToDate(null)
        setPage(1)
    }

    const exportColumns = useMemo(
        () => [
            ...columns.map((col) => ({ key: col.key, label: col.label })),
            { key: 'userId', label: 'User ID' },
            { key: 'userEmail', label: 'Email' },
            { key: 'description', label: 'Description' },
            { key: 'ipAddress', label: 'IP Address' },
            { key: 'oldValue', label: 'Previous Value' },
            { key: 'newValue', label: 'Updated Value' },
        ],
        [columns],
    )

    if (!config) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                Unknown activity log type.
            </section>
        )
    }

    const showingFrom = filteredRecords.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
    const showingTo = Math.min(currentPage * PAGE_SIZE, filteredRecords.length)

    return (
        <section>
            {loading ? <p className='text-sm text-[#667085] mb-4'>Loading live logs…</p> : null}
            {loadError ? <p className='text-sm text-[#B42318] mb-4'>{loadError}</p> : null}
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
                    <select
                        className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'
                        value={fromDate || toDate ? 'range' : ''}
                        onChange={(e) => {
                            if (e.target.value === '') {
                                setFromDate(null)
                                setToDate(null)
                            }
                        }}
                    >
                        <option value=''>From Beginning</option>
                        <option value='range'>Custom date range</option>
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
                                placeholderText='Any date'
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
                                placeholderText='Any date'
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
                        Download Records
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
                            {pageRows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + 1} className='px-2 py-8 text-center text-[#667085]'>
                                        {loading ? 'Loading…' : 'No activity logs found.'}
                                    </td>
                                </tr>
                            ) : (
                                pageRows.map((record) => (
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
                                                    to={`${ROUTE_BASE}/view/${record.id}?type=${encodeURIComponent(logType)}`}
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
                    Showing {showingFrom} to {showingTo} of {filteredRecords.length} entries
                </p>
                <div className='flex gap-x-2'>
                    <button
                        type='button'
                        disabled={currentPage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer disabled:opacity-40'
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'>
                        {currentPage}
                    </button>
                    <button
                        type='button'
                        disabled={currentPage >= pageCount}
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer disabled:opacity-40'
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename={`super-admin-activity-logs-${logType}`}
                title={config.listTitle || config.label}
                columns={exportColumns}
                rows={filteredRecords.map((row) => {
                    const out = {}
                    exportColumns.forEach((col) => {
                        const match = columns.find((c) => c.key === col.key)
                        out[col.key] = match ? getCellValue(row, match) : (row[col.key] ?? '—')
                    })
                    return out
                })}
                exportDescription={<>You are exporting {filteredRecords.length} filtered record(s).</>}
            />
        </section>
    )
}

export default ActivityLogList
