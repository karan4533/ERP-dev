import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, EllipsisIcon, ChevronLeft, ChevronRight, Plus, Download, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import EditRequestModal from '../../../Common/CommonComponents/EditRequestModal'
import {
    getStoredExamDetails,
    deleteExamDetail,
} from './examDetailsData'

const ExamDetailsList = () => {
    const [records, setRecords] = useState(() => getStoredExamDetails())
    const [searchTerm, setSearchTerm] = useState('')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [selectedRecordId, setSelectedRecordId] = useState(null)

    useEffect(() => {
        const handleSync = () => setRecords(getStoredExamDetails())
        window.addEventListener('schoolerp-exam-details-sync', handleSync)
        return () => window.removeEventListener('schoolerp-exam-details-sync', handleSync)
    }, [])

    const handleDelete = (id) => {
        const updated = deleteExamDetail(id)
        setRecords(updated)
        toast.success('Exam detail deleted successfully.')
    }

    const filteredRecords = records.filter((r) => {
        if (!searchTerm) return true
        const query = searchTerm.toLowerCase()
        return (
            (r.examName || '').toLowerCase().includes(query) ||
            (r.className || '').toLowerCase().includes(query) ||
            (r.subject || '').toLowerCase().includes(query) ||
            (r.room || '').toLowerCase().includes(query) ||
            (r.invigilator || '').toLowerCase().includes(query)
        )
    })

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearchTerm('')
                            setFromDate(null)
                            setToDate(null)
                        }}
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
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder='Search by exam, class, subject...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable={true}
                                dateFormat='dd/MM/yyyy'
                                showMonthYearDropdown={true}
                                scrollableMonthYearDropdown={true}
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
                                isClearable={true}
                                dateFormat='dd/MM/yyyy'
                                showMonthYearDropdown={true}
                                scrollableMonthYearDropdown={true}
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
                    <h2 className='text-xl font-medium text-black'>Exam Details List</h2>
                    <div className='flex gap-x-2 items-center'>
                        <NavLink
                            to='/admin/exam-details/add-exam-details'
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Add New Exam
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
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Exam Type</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Exam Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Start Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>End Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Room Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Invigilator</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg text-right'>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className='py-8 text-center text-slate-400'>
                                        No exam records found. Click &quot;Add New Exam&quot; to configure exams.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                        <td className='px-2 py-4 font-medium text-slate-900 rounded-s-lg'>{record.examName}</td>
                                        <td className='px-2 py-4'>{record.className} - {record.section || 'A'}</td>
                                        <td className='px-2 py-4 font-semibold text-slate-800'>{record.subject}</td>
                                        <td className='px-2 py-4'>{record.examDate}</td>
                                        <td className='px-2 py-4'>{record.startTime}</td>
                                        <td className='px-2 py-4'>{record.endTime}</td>
                                        <td className='px-2 py-4'>{record.room}</td>
                                        <td className='px-2 py-4'>{record.invigilator}</td>
                                        <td className='px-2 py-4 text-right rounded-e-lg'>
                                            <button
                                                type='button'
                                                onClick={() => handleDelete(record.id)}
                                                className='inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-semibold text-xs px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer'
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default ExamDetailsList
