import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, EllipsisIcon, Download, Plus } from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import ListPagination, { PageSizeSelect } from '../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../Common/useListPagination'
import { emptyListMessage } from '../../../Common/listPagination'
import {
    STATUS_OPTIONS,
    deleteStudentGatePass,
    filterStudentGatePasses,
    formatOutTimeForDisplay,
    getStudentGatePasses,
    hydrateStudentGatePassesFromApi,
    statusBadgeColor,
} from './gatePassData'
import { frontOfficeApiOn } from '../frontOfficeStore'
import { canShowDeleteOption } from '../../../Common/CommonComponents/approvalGates'
import { useAuth } from '../../../context/AuthContext'

const GatePassList = () => {
    const { role } = useAuth() || {}
    const showDelete = canShowDeleteOption(role)
    const location = useLocation()
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [records, setRecords] = useState(() => (frontOfficeApiOn() ? [] : getStudentGatePasses()))
    const [loadError, setLoadError] = useState('')

    useEffect(() => {
        if (!frontOfficeApiOn()) {
            setRecords(getStudentGatePasses())
            return undefined
        }
        let active = true
        hydrateStudentGatePassesFromApi()
            .then((rows) => {
                if (active) {
                    setRecords(rows)
                    setLoadError('')
                }
            })
            .catch((error) => {
                if (active) setLoadError(error?.message || 'Could not load gate passes.')
            })
        return () => {
            active = false
        }
    }, [location.key])

    const refresh = () => setRecords(getStudentGatePasses())

    const filteredRecords = useMemo(
        () => filterStudentGatePasses(records, { search, status, fromDate, toDate }),
        [records, search, status, fromDate, toDate],
    )

    const pagination = useListPagination(filteredRecords, {
        resetKey: [search, status, fromDate?.getTime(), toDate?.getTime()].join('|'),
    })
    const visibleRecords = pagination.rows

    const clearFilters = () => {
        setSearch('')
        setStatus('')
        setFromDate(null)
        setToDate(null)
    }

    const handleDelete = async (id) => {
        if (!showDelete) return
        const result = await deleteStudentGatePass(id)
        if (!result.success) {
            toast.error(result.message || 'Delete failed.')
            return
        }
        refresh()
        toast.success('Gate pass deleted.')
    }

    return (
        <section>
            {loadError ? <p className='text-sm text-[#B42318] mb-3'>{loadError}</p> : null}
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Student ID, name, reason...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status'
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {STATUS_OPTIONS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
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
                    <h2 className='text-xl font-medium text-black'>Student Gate Pass List</h2>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to='/front-office/add-gate-pass'
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Add Student Gate Pass
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
                <PageSizeSelect pagination={pagination} className='my-2' />
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Profile</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class & Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Gender</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Mobile Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>City</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Reason</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Out Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleRecords.length === 0 && (
                                <tr>
                                    <td colSpan={12} className='px-2 py-10 text-center text-[#667085]'>
                                        {emptyListMessage(records.length)}
                                    </td>
                                </tr>
                            )}
                            {visibleRecords.map((record) => (
                                <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                    <td className='px-2 py-4 object-cover flex justify-center rounded-s-lg'>
                                        <img src={record.profileImage || mo_user} alt='' className='w-9 h-9 rounded-full object-cover' />
                                    </td>
                                    <td className='px-2 py-4'>{record.studentId}</td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{record.studentName}</td>
                                    <td className='px-2 py-4'>{record.classSection}</td>
                                    <td className='px-2 py-4'>{record.gender}</td>
                                    <td className='px-2 py-4'>{record.mobileNumber}</td>
                                    <td className='px-2 py-4'>{record.city}</td>
                                    <td className='px-2 py-4'>{record.reason}</td>
                                    <td className='px-2 py-4'>{record.date}</td>
                                    <td className='px-2 py-4'>{formatOutTimeForDisplay(record.outTime)}</td>
                                    <td className='px-2 py-4'>
                                        <span className={`text-xs font-medium px-2 py-1 rounded ${statusBadgeColor[record.status] || ''}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink
                                                to={`/front-office/student-gate-pass/view/${record.id}`}
                                                className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                            >
                                                View
                                            </NavLink>
                                            <NavLink
                                                to={`/front-office/student-gate-pass/edit/${record.id}`}
                                                className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                            >
                                                Edit
                                            </NavLink>
                                            {showDelete ? (
                                                <button
                                                    type='button'
                                                    onClick={() => handleDelete(record.id)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    Delete
                                                </button>
                                            ) : null}
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ListPagination pagination={pagination} />

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='student-gate-passes'
                title='Student Gate Passes'
                enableDateRange
                dateKeys={['date']}
                rows={filteredRecords.map((r) => ({
                    id: r.id || r.publicId,
                    studentName: r.studentName,
                    classSection: r.classSection,
                    reason: r.reason,
                    date: r.date,
                    status: r.status,
                }))}
                columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'studentName', label: 'Student' },
                    { key: 'classSection', label: 'Class' },
                    { key: 'reason', label: 'Reason' },
                    { key: 'date', label: 'Date' },
                    { key: 'status', label: 'Status' },
                ]}
                exportDescription={<>You are exporting {filteredRecords.length} record{filteredRecords.length === 1 ? '' : 's'} from the current filters. Optionally narrow by date range.</>}
            />
        </section>
    )
}

export default GatePassList
