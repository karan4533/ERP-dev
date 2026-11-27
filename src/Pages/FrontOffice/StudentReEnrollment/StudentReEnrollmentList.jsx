import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Download, EllipsisIcon, Plus } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import ListPagination from '../../../Common/CommonComponents/ListPagination'
import { useListPagination } from '../../../Common/useListPagination'
import { emptyListMessage } from '../../../Common/listPagination'
import EditRequestModal from '../../../Common/CommonComponents/EditRequestModal'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import {
    ADD_ROUTE,
    ROUTE_BASE,
    STATUS_OPTIONS,
    getReEnrollments,
    hydrateReEnrollmentsFromApi,
    statusBadgeColor,
} from './studentReEnrollmentData'
import { frontOfficeApiOn } from '../frontOfficeStore'

const StudentReEnrollmentList = () => {
    const location = useLocation()
    const [records, setRecords] = useState(() => (frontOfficeApiOn() ? [] : getReEnrollments()))
    const [loadError, setLoadError] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)

    useEffect(() => {
        if (!frontOfficeApiOn()) {
            setRecords(getReEnrollments())
            setLoadError('')
            return undefined
        }
        let active = true
        hydrateReEnrollmentsFromApi()
            .then(() => {
                if (active) {
                    setRecords(getReEnrollments())
                    setLoadError('')
                }
            })
            .catch((error) => {
                if (active) {
                    setRecords([])
                    setLoadError(error?.message || 'Could not load re-enrollment records.')
                }
            })
        return () => {
            active = false
        }
    }, [location.key])

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase()
        return records.filter((record) => {
            if (statusFilter && record.status !== statusFilter) return false
            if (!query) return true
            const haystack = `${record.id} ${record.admissionNumber} ${record.studentName} ${record.tcNumber}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [records, search, statusFilter])
    const pagination = useListPagination(filteredRecords, { resetKey: `${search}|${statusFilter}` })

    return (
        <section>
            {loadError ? <p className='text-sm text-[#B42318] mb-3'>{loadError}</p> : null}
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Admission no, student name, TC number...'
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex items-end'>
                        <button
                            type='button'
                            onClick={() => { setSearch(''); setStatusFilter('') }}
                            className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>Student Re-Enrollment List</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Record TC return and reactivate students continuing in the same school.
                        </p>
                    </div>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to={ADD_ROUTE}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            New Re-Enrollment
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

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Re-Enrollment ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Admission Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Previous Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>New Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>TC Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>TC Returned</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Admission Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className='px-2 py-8 text-center text-[#667085]'>{emptyListMessage(records.length)}</td>
                                </tr>
                            ) : (
                                pagination.rows.map((record) => (
                                    <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 rounded-s-lg'>{record.id}</td>
                                        <td className='px-2 py-4'>{record.admissionNumber}</td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{record.studentName}</td>
                                        <td className='px-2 py-4'>{record.previousClass} - {record.previousSection}</td>
                                        <td className='px-2 py-4'>{record.newClass} - {record.section}</td>
                                        <td className='px-2 py-4'>{record.tcNumber}</td>
                                        <td className='px-2 py-4'>{record.tcReturnedDate}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`text-sm font-medium ${record.admissionStatus === 'Active' ? 'text-[#4CAF50]' : 'text-[#667085]'}`}>
                                                {record.admissionStatus}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4'>
                                            <span className={`text-sm font-medium border rounded-md px-2 py-1 ${statusBadgeColor[record.status]}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink to={`${ROUTE_BASE}/view/${record.id}`} className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>View</NavLink>
                                                <NavLink to={`${ROUTE_BASE}/edit/${record.id}`} className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>Edit</NavLink>
                                                <button type='button' onClick={() => setDeleteRequestModal(true)} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>Delete</button>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ListPagination pagination={pagination} showPageSize />

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='student-re-enrollments'
                rows={filteredRecords.map((r) => ({
                    id: r.id || r.publicId,
                    studentName: r.studentName,
                    admissionNumber: r.admissionNumber || r.studentId,
                    classSection: r.classSection,
                    status: r.status,
                    date: r.date || r.requestedOn,
                }))}
                exportDescription={<>You are exporting {filteredRecords.length} record{filteredRecords.length === 1 ? '' : 's'}.</>}
            />
            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />
        </section>
    )
}

export default StudentReEnrollmentList
