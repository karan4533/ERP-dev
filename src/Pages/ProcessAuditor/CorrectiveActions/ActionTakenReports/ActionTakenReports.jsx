import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon, Search } from 'lucide-react'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import { getAtrRecords, getAtrLoadState, hydrateFromApi, DEPARTMENTS, ATR_STATUSES, statusBadgeColor } from './atrData'

const ActionTakenReports = () => {
    const location = useLocation()
    const [records, setRecords] = useState(() => getAtrRecords())
    const [loadState, setLoadState] = useState(() => getAtrLoadState())
    const [searchInput, setSearchInput] = useState('')
    const [appliedSearch, setAppliedSearch] = useState('')
    const [department, setDepartment] = useState('')
    const [status, setStatus] = useState('')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)

    useEffect(() => {
        let active = true
        setLoadState(getAtrLoadState())
        hydrateFromApi().finally(() => {
            if (!active) return
            setRecords(getAtrRecords())
            setLoadState(getAtrLoadState())
        })
        return () => {
            active = false
        }
    }, [location.pathname])

    const loading = loadState.api && (loadState.status === 'idle' || loadState.status === 'loading')
    const loadFailed = loadState.api && loadState.status === 'failed'

    const clearFilters = () => {
        setSearchInput('')
        setAppliedSearch('')
        setDepartment('')
        setStatus('')
        setFromDate(null)
        setToDate(null)
    }

    const filtered = useMemo(() => {
        const query = appliedSearch.toLowerCase()
        return records.filter((record) => {
            if (department && record.department !== department) return false
            if (status && record.status !== status) return false
            if (!query) return true
            return [record.atrNumber, record.observationId, record.auditNumber, record.assignedTo, record.reportTo]
                .some((value) => String(value || '').toLowerCase().includes(query))
        })
    }, [records, appliedSearch, department, status])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-sm text-[#667085] mb-4'>
                    Review actions actually performed by employees after RCA approval.
                </p>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button type='button' onClick={clearFilters} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>
                        Clear Filters
                    </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <div className='flex gap-2'>
                            <input
                                type='text'
                                id='search'
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                onKeyDown={(event) => { if (event.key === 'Enter') setAppliedSearch(searchInput.trim()) }}
                                placeholder='ATR number, observation ID...'
                                className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                            />
                            <button
                                type='button'
                                onClick={() => setAppliedSearch(searchInput.trim())}
                                className='shrink-0 bg-[#515DEF] text-white text-sm px-3 py-2 rounded-md hover:opacity-90 cursor-pointer inline-flex items-center gap-1'
                            >
                                <Search size={14} />
                                Search
                            </button>
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='department-filter' className='text-base font-medium text-[#808080]'>Department</label>
                        <select id='department-filter' value={department} onChange={(event) => setDepartment(event.target.value)} className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {DEPARTMENTS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select id='status-filter' value={status} onChange={(event) => setStatus(event.target.value)} className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {ATR_STATUSES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Date From</label>
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
                        <label className='text-base font-medium text-[#808080]'>Date To</label>
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
                    <h2 className='text-xl font-medium text-black'>Action Taken Reports</h2>
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
                    <table className='w-full text-sm text-left rtl:text-right min-w-[1000px]'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>ATR Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Observation ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Audit Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Department</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Assigned To</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Report To</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Submitted By</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Submitted On</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan={10} className='px-2 py-6 text-center text-[#667085]'>Loading action taken reports…</td></tr>
                            )}
                            {loadFailed && (
                                <tr><td colSpan={10} className='px-2 py-6 text-center text-[#B42318]'>
                                    Could not load action taken reports from the server{loadState.error ? `: ${loadState.error}` : ''}. Refresh to try again.
                                </td></tr>
                            )}
                            {!loading && !loadFailed && filtered.length === 0 && (
                                <tr><td colSpan={10} className='px-2 py-6 text-center text-[#667085]'>
                                    {records.length === 0 ? 'No action taken reports yet.' : 'No records match the selected filters.'}
                                </td></tr>
                            )}
                            {!loading && !loadFailed && filtered.map((record) => (
                                <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className='px-2 py-4 font-medium text-[#515DEF] rounded-s-lg whitespace-nowrap'>{record.atrNumber}</td>
                                    <td className='px-2 py-4 whitespace-nowrap'>{record.observationId}</td>
                                    <td className='px-2 py-4 whitespace-nowrap'>{record.auditNumber}</td>
                                    <td className='px-2 py-4 whitespace-nowrap'>{record.department}</td>
                                    <td className='px-2 py-4 whitespace-nowrap'>{record.assignedTo}</td>
                                    <td className='px-2 py-4 whitespace-nowrap'>{record.reportTo}</td>
                                    <td className='px-2 py-4'>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[record.status]}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className='px-2 py-4 whitespace-nowrap'>{record.submittedBy}</td>
                                    <td className='px-2 py-4 whitespace-nowrap'>
                                        {record.submittedOn}
                                        <span className='block text-xs text-[#808080]'>{record.submittedOnTime}</span>
                                    </td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink
                                                to={`/process-auditor/corrective-actions/action-taken-reports/view/${record.id}`}
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

            <div className='flex justify-between items-center px-4 mt-4'>
                        <p className='text-sm font-medium text-[#515DEF]'>
                            Showing 1 to {filtered.length} of {filtered.length} entries
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

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                rows={filtered}
                columns={[
                    { key: 'atrNumber', label: 'ATR Number' },
                    { key: 'observationId', label: 'Observation ID' },
                    { key: 'auditNumber', label: 'Audit Number' },
                    { key: 'department', label: 'Department' },
                    { key: 'assignedTo', label: 'Assigned To' },
                    { key: 'status', label: 'Status' },
                ]}
                filename='action-taken-reports'
                title='Action Taken Reports'
                exportDescription={<>You are exporting {filtered.length} ATR record(s) for the selected filters.</>}
            />
        </section>
    )
}

export default ActionTakenReports
