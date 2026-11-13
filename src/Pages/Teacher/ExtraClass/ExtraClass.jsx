import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, EllipsisIcon, Plus, Download, CheckCircle2, Eye, Edit2, Trash2, X } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import EditRequestModal from '../../../Common/CommonComponents/EditRequestModal'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import { getExtraClasses, updateExtraClassStatus, SUBJECTS, CLASSES, SECTIONS } from './extraClassData'
import { useAuth } from '../../../context/AuthContext'
import { canRoleDelete } from '../../../Common/RBAC/actionPermissions'

const ExtraClass = ({ canCreate = true, listPath = null, addPath = null }) => {
    const { role } = useAuth()
    const canDelete = canRoleDelete(role)
    const location = useLocation()

    const basePath = listPath || (
        location.pathname.startsWith('/principal')
            ? '/principal/class/extra-class'
            : location.pathname.startsWith('/coordinator')
                ? '/coordinator/class/extra-class'
                : '/teacher/class/extra-class'
    )
    const effectiveAddPath = addPath || `${basePath}/add`

    const [classesList, setClassesList] = useState(getExtraClasses)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedSubject, setSelectedSubject] = useState('')
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedSection, setSelectedSection] = useState('')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)

    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)

    // Receive modal
    const [receiveModalItem, setReceiveModalItem] = useState(null)
    const [receiveNotes, setReceiveNotes] = useState('')

    const handleClearFilters = () => {
        setSearchTerm('')
        setSelectedSubject('')
        setSelectedClass('')
        setSelectedSection('')
        setFromDate(null)
        setToDate(null)
    }

    const filteredClasses = classesList.filter((record) => {
        const matchesSearch = !searchTerm ||
            record.extraClassId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.venue?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesSubject = !selectedSubject || record.subject === selectedSubject
        const matchesClass = !selectedClass || record.classSection?.includes(selectedClass)
        const matchesSection = !selectedSection || record.classSection?.includes(selectedSection)

        return matchesSearch && matchesSubject && matchesClass && matchesSection
    })

    const handleConfirmReceive = (e) => {
        e.preventDefault()
        if (!receiveModalItem) return
        const updated = updateExtraClassStatus(receiveModalItem.id, 'Received & Conducted', receiveNotes)
        setClassesList(updated)
        setReceiveModalItem(null)
        setReceiveNotes('')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={handleClearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <span className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                        Extended Class Management
                    </span>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            placeholder='ID, topic, venue...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-md px-3 py-2 w-full focus:outline-[#515DEF]'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='subject-filter' className='text-base font-medium text-[#808080]'>Subject</label>
                        <select
                            id='subject-filter'
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-md px-2 py-2 w-full focus:outline-[#515DEF]'
                        >
                            <option value=''>All Subjects</option>
                            {SUBJECTS.map((subject) => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='class-filter'
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-md px-2 py-2 w-full focus:outline-[#515DEF]'
                        >
                            <option value=''>All Classes</option>
                            {CLASSES.map((item) => (
                                <option key={item} value={item}>Class {item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-filter' className='text-base font-medium text-[#808080]'>Section</label>
                        <select
                            id='section-filter'
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-md px-2 py-2 w-full focus:outline-[#515DEF]'
                        >
                            <option value=''>All Sections</option>
                            {SECTIONS.map((item) => (
                                <option key={item} value={item}>Section {item}</option>
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
                                placeholderText='DD/MM/YYYY'
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-slate-700 border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-[#515DEF]'
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
                                placeholderText='DD/MM/YYYY'
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-slate-700 border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-[#515DEF]'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Extended Class List</h2>
                    <div className='flex gap-x-2'>
                        {canCreate && (
                            <NavLink
                                to={effectiveAddPath}
                                className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                            >
                                <Plus size={16} />
                                Create Extended Class
                            </NavLink>
                        )}
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
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Extended Class ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class & Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Topic</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Timings</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Venue</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg text-center'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClasses.map((record) => (
                                <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.extraClassId}</td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{record.subject}</td>
                                    <td className='px-2 py-4'>{record.classSection}</td>
                                    <td className='px-2 py-4 max-w-xs'>{record.topic}</td>
                                    <td className='px-2 py-4'>{record.date}</td>
                                    <td className='px-2 py-4'>{record.startTime} – {record.endTime}</td>
                                    <td className='px-2 py-4'>{record.venue}</td>
                                    <td className='px-2 py-4'>
                                        {record.status === 'Received & Conducted' ? (
                                            <span className='inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200'>
                                                <CheckCircle2 size={12} />
                                                Conducted
                                            </span>
                                        ) : (
                                            <span className='text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200'>
                                                Scheduled
                                            </span>
                                        )}
                                    </td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink
                                                to={`${basePath}/view/${record.id}`}
                                                className='flex items-center gap-2 w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer text-xs'
                                            >
                                                <Eye size={13} />
                                                View
                                            </NavLink>
                                            {record.status !== 'Received & Conducted' && (
                                                <button
                                                    type='button'
                                                    onClick={() => setReceiveModalItem(record)}
                                                    className='flex items-center gap-2 w-full text-left p-2 hover:bg-emerald-600 hover:text-white rounded cursor-pointer text-xs text-emerald-700 font-semibold'
                                                >
                                                    <CheckCircle2 size={13} />
                                                    Receive / Conduct
                                                </button>
                                            )}
                                            <button
                                                type='button'
                                                onClick={() => setEditRequestModal(true)}
                                                className='flex items-center gap-2 w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer text-xs'
                                            >
                                                <Edit2 size={13} />
                                                Edit
                                            </button>
                                            {canDelete && (
                                                <button
                                                    type='button'
                                                    onClick={() => setDeleteRequestModal(true)}
                                                    className='flex items-center gap-2 w-full text-left p-2 hover:bg-rose-600 hover:text-white rounded cursor-pointer text-xs text-rose-600'
                                                >
                                                    <Trash2 size={13} />
                                                    Delete
                                                </button>
                                            )}
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RECEIVE MODAL */}
            {receiveModalItem && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <div className='flex items-center gap-2'>
                                <CheckCircle2 className='text-emerald-600' size={20} />
                                <h3 className='text-lg font-bold text-slate-800'>Receive Extended Class</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setReceiveModalItem(null)}
                                className='p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className='bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1'>
                            <div className='font-semibold text-slate-900'>{receiveModalItem.subject} ({receiveModalItem.classSection})</div>
                            <div>Topic: {receiveModalItem.topic}</div>
                            <div>Scheduled: {receiveModalItem.date} ({receiveModalItem.startTime} – {receiveModalItem.endTime})</div>
                        </div>

                        <form onSubmit={handleConfirmReceive} className='space-y-4'>
                            <div>
                                <label className='text-xs font-semibold text-slate-700 block mb-1'>
                                    Session Notes & Completion Feedback
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={receiveNotes}
                                    onChange={(e) => setReceiveNotes(e.target.value)}
                                    className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    placeholder='Conducted extended class, covered key exercises and student Q&A...'
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t'>
                                <button
                                    type='button'
                                    onClick={() => setReceiveModalItem(null)}
                                    className='px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm'
                                >
                                    Mark as Conducted
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
            {canDelete && <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />}
        </section>
    )
}

export default ExtraClass
