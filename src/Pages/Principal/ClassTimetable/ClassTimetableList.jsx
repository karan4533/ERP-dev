import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronRight, Download, Eye, Plus, EllipsisIcon } from 'lucide-react'
import EditRequestModal from '../../../Common/CommonComponents/EditRequestModal'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ClassTimeTableModal from './Components/ClassTimeTableModal'
import {
    CREATE_ROUTE,
    approvalStatusColor,
    getClassSectionLabel,
    decideTimetableChangeRequest,
    getClassTimetables,
    getTimetableChangeRequests,
} from './classTimetableData'

const ClassTimetableList = () => {
    const location = useLocation()
    const [records, setRecords] = useState(() => getClassTimetables())
    const [changes, setChanges] = useState(() => getTimetableChangeRequests())
    const [rejectReason, setRejectReason] = useState('')
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)
    const [exportModal, setExportModal] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)
    const [search, setSearch] = useState('')
    const [classFilter, setClassFilter] = useState('')
    const [sectionFilter, setSectionFilter] = useState('')

    useEffect(() => {
        setRecords(getClassTimetables())
        setChanges(getTimetableChangeRequests())
    }, [location.key])

    const reviewChange = (id, approved) => {
        if (!approved && !rejectReason.trim()) return
        decideTimetableChangeRequest(id, approved, 'Principal', rejectReason.trim())
        setChanges(getTimetableChangeRequests())
        setRecords(getClassTimetables())
        setRejectReason('')
    }

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase()
        return records.filter((record) => {
            if (classFilter && record.className !== classFilter) return false
            if (sectionFilter && record.section !== sectionFilter) return false
            if (!query) return true
            const haystack = `${record.id} ${getClassSectionLabel(record)} ${record.academicYear} ${record.term}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [records, search, classFilter, sectionFilter])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='class-filter'
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            <option value='Grade 9'>Grade 9</option>
                            <option value='Grade 10'>Grade 10</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-filter' className='text-base font-medium text-[#808080]'>Section</label>
                        <select
                            id='section-filter'
                            value={sectionFilter}
                            onChange={(e) => setSectionFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            <option value='A'>A</option>
                            <option value='B'>B</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <h2 className='text-xl font-medium text-black'>Timetable change requests</h2>
                <p className='text-sm text-[#667085] mt-1 mb-3'>Only the Principal approves or rejects these requests.</p>
                <input value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder='Rejection reason' className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full max-w-md mb-3' />
                {changes.length === 0 && <p className='text-sm text-[#667085]'>No change requests yet.</p>}
                <ul className='space-y-2'>
                    {changes.map((item) => (
                        <li key={item.id} className='border border-[#EDEEF5] rounded-md p-3 text-sm flex flex-wrap justify-between gap-2'>
                            <span>{item.requestedByRole} · {item.className} {item.section} · {item.day} · {item.currentSubject} → {item.requestedSubject} · {item.status}</span>
                            {item.status === 'Pending' && (
                                <span className='flex gap-2'>
                                    <button type='button' onClick={() => reviewChange(item.id, true)} className='text-[#515DEF] cursor-pointer'>Approve</button>
                                    <button type='button' onClick={() => reviewChange(item.id, false)} className='text-[#FF5722] cursor-pointer'>Reject</button>
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>Class Timetable List</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Class timetables are owned by the Principal. Teacher and Coordinator change requests are approved here.
                        </p>
                    </div>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to={CREATE_ROUTE}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Create Timetable
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
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Timetable ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class & Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Academic Year</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Timelines</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Submitted Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Approval Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>View Timetable</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>
                                        No class timetables found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 rounded-s-lg'>{record.id}</td>
                                        <td className='px-2 py-4'>{getClassSectionLabel(record)}</td>
                                        <td className='px-2 py-4'>{record.academicYear}</td>
                                        <td className='px-2 py-4'>{record.timelines?.length ?? 0}</td>
                                        <td className='px-2 py-4'>{record.submittedDate}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`text-sm font-medium border rounded-md px-2 py-1 ${approvalStatusColor[record.approvalStatus]}`}>
                                                {record.approvalStatus}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4'>
                                            <button
                                                type='button'
                                                onClick={() => setSelectedRecord(record)}
                                                className='bg-[#515DEF] text-white text-sm px-2 py-1.5 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                                            >
                                                <Eye size={16} />
                                                View Timetable
                                            </button>
                                        </td>
                                        <td className='px-2 py-4 rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <button
                                                    type='button'
                                                    onClick={() => setSelectedRecord(record)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    View
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => setEditRequestModal(true)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => setDeleteRequestModal(true)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
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
                    Showing {filteredRecords.length} entries
                </p>
                <div className='flex justify-center gap-x-2'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] rounded-full cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />
            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <ClassTimeTableModal
                open={Boolean(selectedRecord)}
                onClose={() => setSelectedRecord(null)}
                record={selectedRecord}
            />
        </section>
    )
}

export default ClassTimetableList
