import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Calendar, EllipsisIcon, ChevronLeft, ChevronRight, Plus, Download } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import EditRequestModal from '../../../../Common/CommonComponents/EditRequestModal'
import DeleteRequestModal from '../../../../Common/CommonComponents/DeleteRequestModal'
import {
    getClassDetails,
    removeClassDetails,
} from '../../../../Common/RBAC/academicsCatalogData'

const ClassDetails = () => {
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)
    const [search, setSearch] = useState('')
    const [records, setRecords] = useState(() => getClassDetails())
    const [pendingDeleteId, setPendingDeleteId] = useState(null)

    const refresh = () => setRecords(getClassDetails())

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return records
        return records.filter((item) => {
            const sectionNames = (item.sections || []).map((section) => section.name).join(', ')
            return (
                item.className.toLowerCase().includes(query)
                || (item.displayName || '').toLowerCase().includes(query)
                || sectionNames.toLowerCase().includes(query)
                || (item.classTeacher || '').toLowerCase().includes(query)
            )
        })
    }, [records, search])

    const confirmDelete = () => {
        if (!pendingDeleteId) return
        removeClassDetails(pendingDeleteId)
        setPendingDeleteId(null)
        setDeleteRequestModal(false)
        refresh()
        toast.success('Class details deleted.')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => setSearch('')}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
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
                            id='search'
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Class, section, teacher...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>Status</label>
                        <select id='status' className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable={true}
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
                                isClearable={true}
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Class Details List</h2>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to='/admin/class/add-class-details'
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Add New Class
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

                {filteredRecords.length === 0 ? (
                    <div className='py-16 text-center'>
                        <h3 className='text-lg font-semibold text-[#0C1E5B]'>No class details yet</h3>
                        <p className='text-sm text-[#667085] mt-2 max-w-md mx-auto'>
                            Create classes and sections here. They will appear in Mark Entry and student creation dropdowns.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className='flex gap-x-2 items-center my-2'>
                            <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                                <option value='10'>10</option>
                                <option value='20'>20</option>
                                <option value='30'>30</option>
                                <option value='40'>40</option>
                                <option value='50'>50</option>
                            </select>
                            <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                        </div>
                        <div className='relative overflow-x-auto'>
                            <table className='w-full text-sm text-left rtl:text-right'>
                                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                    <tr className='rounded-lg'>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Class</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section Capacity</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class Capacity</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class Teacher</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class Room Number</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map((record) => {
                                        const sectionNames = (record.sections || []).map((section) => section.name).join(', ')
                                        const sectionCapacities = (record.sections || [])
                                            .map((section) => `${section.name}=${section.capacity || '—'}`)
                                            .join(', ')

                                        return (
                                            <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                                <td className='px-2 py-4 rounded-s-lg'>{record.className || record.displayName}</td>
                                                <td className='px-2 py-4'>{sectionNames || '—'}</td>
                                                <td className='px-2 py-4'>{sectionCapacities || '—'}</td>
                                                <td className='px-2 py-4'>{record.classCapacity || '—'}</td>
                                                <td className='px-2 py-4'>{record.classTeacher || '—'}</td>
                                                <td className='px-2 py-4'>{record.classRoomNumber || '—'}</td>
                                                <td className='px-2 py-4 text-center rounded-e-lg'>
                                                    <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                        <button
                                                            type='button'
                                                            onClick={() => setEditRequestModal(true)}
                                                            className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type='button'
                                                            onClick={() => {
                                                                setPendingDeleteId(record.id)
                                                                setDeleteRequestModal(true)
                                                            }}
                                                            className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                        >
                                                            Delete
                                                        </button>
                                                    </Dropdown>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className='flex justify-between items-center px-4 mt-4'>
                            <p className='text-sm font-medium text-[#515DEF]'>
                                Showing 1 to {filteredRecords.length} of {filteredRecords.length} entries
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
                )}
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
            <DeleteRequestModal
                deleteRequestModal={deleteRequestModal}
                setDeleteRequestModal={(open) => {
                    setDeleteRequestModal(open)
                    if (!open) setPendingDeleteId(null)
                }}
                onConfirm={confirmDelete}
                title='Delete Class Details?'
                message='This will remove the class and its sections from Mark Entry and student assignment dropdowns.'
                confirmLabel='Delete'
            />
        </section>
    )
}

export default ClassDetails
