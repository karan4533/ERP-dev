import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import Dropdown from '../CommonComponents/Dropdown'
import ExportModal from '../CommonComponents/ExportModal'
import {
    MD_APPROVAL_STATUS,
    deleteActivity,
    getActivitiesByType,
    getPersonInCharge,
    mdApprovalBadgeColor,
} from './activitiesData'
import { getActivityConfig, getActivityRoutes, getActivityEditPath, getActivityViewPath } from './activityConfigs'
import { getClassDisplayLabel, getClassSelectOptions } from '../RBAC/academicsCatalogData'

export default function ActivityListView({ roleKey, activityType }) {
    const location = useLocation()
    const config = getActivityConfig(activityType)
    const routes = getActivityRoutes(activityType, roleKey)
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [statusFilter, setStatusFilter] = useState('')
    const [classFilter, setClassFilter] = useState('')
    const [search, setSearch] = useState('')
    const [refreshKey, setRefreshKey] = useState(0)
    const classOptions = useMemo(() => getClassSelectOptions(), [])

    const activities = useMemo(() => {
        void refreshKey
        return getActivitiesByType(activityType)
    }, [activityType, refreshKey, location.key])

    useEffect(() => {
        setRefreshKey((value) => value + 1)
    }, [location.pathname])

    const filteredActivities = useMemo(() => {
        const query = search.trim().toLowerCase()
        return activities.filter((item) => {
            if (statusFilter && item.mdApprovalStatus !== statusFilter) return false
            if (classFilter && item.className !== classFilter) return false
            if (!query) return true
            const haystack = `${item.eventName} ${item.eventType} ${item.className} ${item.venue}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [activities, search, statusFilter, classFilter])

    const handleDelete = (activity) => {
        if (!window.confirm(`Delete "${activity.eventName}"? This cannot be undone.`)) return
        deleteActivity(activity.id)
        setRefreshKey((value) => value + 1)
        toast.success('Activity deleted.')
    }

    const personLabel = config.personLabel
    const approvalStatusHeader = roleKey === 'admin' ? 'Super Admin Approval Status' : 'MD Approval Status'
    const showPlayersColumn = activityType === 'sports'

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearch('')
                            setStatusFilter('')
                            setClassFilter('')
                        }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Event name, type...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All classes</option>
                            <option value='All Students'>All Students</option>
                            {classOptions.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>
                            {roleKey === 'admin' ? 'Super Admin Approval Status' : 'MD Approval Status'}
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            <option value={MD_APPROVAL_STATUS.PENDING}>Pending</option>
                            <option value={MD_APPROVAL_STATUS.APPROVED}>Approved</option>
                            <option value={MD_APPROVAL_STATUS.REJECTED}>Rejected</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
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
                    <div className='flex gap-x-2'>
                        <NavLink
                            to={routes.add}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            {config.addButtonLabel}
                        </NavLink>
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
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Event Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Event Type</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Event Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Start Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>End Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Venue</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>{personLabel}</th>
                                {showPlayersColumn && (
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Players</th>
                                )}
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Submitted By</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>{approvalStatusHeader}</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredActivities.length === 0 ? (
                                <tr>
                                    <td colSpan={showPlayersColumn ? 12 : 11} className='px-2 py-8 text-center text-[#667085]'>
                                        No activities found.
                                    </td>
                                </tr>
                            ) : (
                                filteredActivities.map((activity) => (
                                    <tr key={activity.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 rounded-s-lg'>{activity.eventName}</td>
                                        <td className='px-2 py-4'>{activity.eventType}</td>
                                        <td className='px-2 py-4'>{getClassDisplayLabel(activity.className)}</td>
                                        <td className='px-2 py-4'>{activity.eventDate}</td>
                                        <td className='px-2 py-4'>{activity.startTime}</td>
                                        <td className='px-2 py-4'>{activity.endTime}</td>
                                        <td className='px-2 py-4'>{activity.venue}</td>
                                        <td className='px-2 py-4'>{getPersonInCharge(activity, config.personField)}</td>
                                        {showPlayersColumn && (
                                            <td className='px-2 py-4'>{activity.players?.length || 0}</td>
                                        )}
                                        <td className='px-2 py-4'>{activity.submittedBy}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${mdApprovalBadgeColor[activity.mdApprovalStatus]}`}>
                                                {activity.mdApprovalStatus}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={getActivityViewPath(activityType, roleKey, activity.id)}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    View
                                                </NavLink>
                                                <NavLink
                                                    to={getActivityEditPath(activityType, roleKey, activity.id)}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    Edit
                                                </NavLink>
                                                <button
                                                    type='button'
                                                    onClick={() => handleDelete(activity)}
                                                    className='w-full text-left p-2 text-[#F44336] hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
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
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing {filteredActivities.length} of {activities.length} entries
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

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}
