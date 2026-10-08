import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon, Plus } from 'lucide-react'
import Dropdown from '../CommonComponents/Dropdown'
import ExportModal from '../CommonComponents/ExportModal'
import { getRoleConfig } from './escalationRoleConfig'
import {
    getReceivedEscalations,
    getSentEscalations,
    statusBadgeColor,
} from './escalationData'
import { formatEscalatedToDisplay } from './escalationUsersData'
import { useEscalationContext } from './useEscalationContext'

const EscalationListPage = ({ roleKey }) => {
    const roleConfig = getRoleConfig(roleKey)
    const { currentUser } = useEscalationContext(roleKey)
    const canAdd = Boolean(roleConfig?.escalatesToRoleKey)
    const [listView, setListView] = useState(canAdd ? 'sent' : 'received')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [search, setSearch] = useState('')
    const [entriesPerPage, setEntriesPerPage] = useState(10)
    const [exportModal, setExportModal] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const sentEscalations = useMemo(
        () => getSentEscalations(roleKey, currentUser),
        [roleKey, currentUser, refreshKey],
    )
    const receivedEscalations = useMemo(
        () => getReceivedEscalations(roleKey, currentUser),
        [roleKey, currentUser, refreshKey],
    )

    const activeList = listView === 'received' ? receivedEscalations : sentEscalations

    const filtered = useMemo(() => {
        return activeList.filter((item) => {
            const matchesSearch =
                !search ||
                item.id.toLowerCase().includes(search.toLowerCase()) ||
                item.escalatedBy.toLowerCase().includes(search.toLowerCase()) ||
                item.description.toLowerCase().includes(search.toLowerCase()) ||
                item.escalatedTo.toLowerCase().includes(search.toLowerCase())

            return matchesSearch
        })
    }, [activeList, search])

    const clearFilters = () => {
        setSearch('')
        setFromDate(null)
        setToDate(null)
        setRefreshKey((value) => value + 1)
    }

    const listTitle = listView === 'received' ? 'Received Escalations' : 'My Escalations'

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col gap-3 mb-4'>
                    <p className='text-sm text-[#667085]'>
                        Escalation hierarchy: {roleConfig?.hierarchyLabel || '—'}
                    </p>
                    <div className='flex flex-wrap gap-2'>
                        {canAdd && (
                            <button
                                type='button'
                                onClick={() => setListView('sent')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${listView === 'sent' ? 'bg-[#515DEF] text-white' : 'bg-[#EDEEF5] text-[#515DEF]'}`}
                            >
                                My Escalations ({sentEscalations.length})
                            </button>
                        )}
                        <button
                            type='button'
                            onClick={() => setListView('received')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${listView === 'received' ? 'bg-[#515DEF] text-white' : 'bg-[#EDEEF5] text-[#515DEF]'}`}
                        >
                            Received Escalations ({receivedEscalations.length})
                        </button>
                    </div>
                </div>

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
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Escalation ID, name...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
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
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
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
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>{listTitle}</h2>
                    <div className='flex flex-wrap gap-x-2 items-center'>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Download size={16} />
                            Export
                        </button>
                        {canAdd && listView === 'sent' && (
                            <NavLink
                                to={`${roleConfig.routeBase}/add-escalation`}
                                className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-6 py-2 rounded-md hover:opacity-90 transition-all duration-200'
                            >
                                <Plus size={16} />
                                Add Escalation
                            </NavLink>
                        )}
                    </div>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select
                        value={entriesPerPage}
                        onChange={(event) => setEntriesPerPage(Number(event.target.value))}
                        className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>
                                    Escalation ID
                                </th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Escalated By</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Escalated To</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Description</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='px-2 py-8 text-center text-[#667085]'>
                                        No escalations found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.slice(0, entriesPerPage).map((escalation) => (
                                    <tr
                                        key={escalation.id}
                                        className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'
                                    >
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>
                                            {escalation.id}
                                        </td>
                                        <td className='px-2 py-4'>
                                            <span className='block text-[#1E1E1E]'>{escalation.escalatedBy}</span>
                                            <span className='text-xs text-[#808080]'>{escalation.escalatedByRole}</span>
                                        </td>
                                        <td className='px-2 py-4'>{formatEscalatedToDisplay(escalation)}</td>
                                        <td
                                            className='px-2 py-4 max-w-[220px] truncate'
                                            title={escalation.description}
                                        >
                                            {escalation.description}
                                        </td>
                                        <td className='px-2 py-4'>{escalation.escalationDate}</td>
                                        <td className='px-2 py-4'>
                                            <span
                                                className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[escalation.status] ?? 'bg-[#66708533] text-[#667085]'}`}
                                            >
                                                {escalation.status}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={`${roleConfig.routeBase}/view/${escalation.id}`}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer block'
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

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {Math.min(filtered.length, entriesPerPage)} of {filtered.length} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button
                        type='button'
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        type='button'
                        className='size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer'
                    >
                        1
                    </button>
                    <button
                        type='button'
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </section>
    )
}

export default EscalationListPage
