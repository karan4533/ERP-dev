import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon, Plus } from 'lucide-react'
import pdf_icon from '../../assets/images/pdf-icon.png'
import Dropdown from '../CommonComponents/Dropdown'
import ExportModal from '../CommonComponents/ExportModal'
import {
    CATEGORY_OPTIONS,
    canCreateAnnouncements,
    getAnnouncementsForRole,
    parseAnnouncementDate,
} from './announcementData'
import { getAnnouncementRoutes, getAnnouncementViewPath } from './announcementConfigs'

const startOfDay = (date) => {
    const value = new Date(date)
    value.setHours(0, 0, 0, 0)
    return value
}

const endOfDay = (date) => {
    const value = new Date(date)
    value.setHours(23, 59, 59, 999)
    return value
}

export default function AnnouncementListView({ roleKey }) {
    const location = useLocation()
    const routes = getAnnouncementRoutes(roleKey)
    const canCreate = canCreateAnnouncements(roleKey)
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        setRefreshKey((value) => value + 1)
    }, [location.pathname])

    const announcements = useMemo(() => {
        void refreshKey
        return getAnnouncementsForRole(roleKey)
    }, [roleKey, refreshKey, location.key])

    const filteredAnnouncements = useMemo(() => {
        const query = search.trim().toLowerCase()
        return announcements.filter((item) => {
            if (categoryFilter && item.category !== categoryFilter) return false

            const itemDate = parseAnnouncementDate(item.announcementDate)
            if (fromDate && itemDate && itemDate < startOfDay(fromDate)) return false
            if (toDate && itemDate && itemDate > endOfDay(toDate)) return false

            if (!query) return true
            const haystack = `${item.id} ${item.title} ${item.message} ${item.sentBy} ${item.category}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [announcements, search, categoryFilter, fromDate, toDate])

    const clearFilters = () => {
        setSearch('')
        setCategoryFilter('')
        setFromDate(null)
        setToDate(null)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='category' className='text-base font-medium text-[#808080]'>Announcement Category</label>
                        <select
                            id='category'
                            value={categoryFilter}
                            onChange={(event) => setCategoryFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {CATEGORY_OPTIONS.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
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
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Announcement List</h2>
                    <div className='flex gap-x-2'>
                        {canCreate ? (
                            <NavLink
                                to={routes.add}
                                className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                            >
                                <Plus size={16} />
                                Add Announcement
                            </NavLink>
                        ) : null}
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Announcement ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Title</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Attachment</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Category</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Message</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Sent By</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAnnouncements.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>
                                        No announcements found.
                                    </td>
                                </tr>
                            ) : (
                                filteredAnnouncements.map((item) => (
                                    <tr key={item.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 rounded-s-lg'>{item.id}</td>
                                        <td className='px-2 py-4'>{item.title}</td>
                                        <td className='px-2 py-4'>
                                            {item.attachmentName ? (
                                                <span className='flex items-center gap-x-2'>
                                                    <img src={pdf_icon} alt='attachment' className='w-6 h-6' />
                                                    {item.attachmentName}
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className='px-2 py-4'>{item.category}</td>
                                        <td className='px-2 py-4 max-w-xs truncate'>{item.message}</td>
                                        <td className='px-2 py-4'>{item.sentBy}</td>
                                        <td className='px-2 py-4'>{item.announcementDate}</td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={getAnnouncementViewPath(roleKey, item.id)}
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
                    Showing {filteredAnnouncements.length === 0 ? 0 : 1} to {filteredAnnouncements.length} of {filteredAnnouncements.length} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'><ChevronLeft size={16} /></button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'>1</button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'><ChevronRight size={16} /></button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}
