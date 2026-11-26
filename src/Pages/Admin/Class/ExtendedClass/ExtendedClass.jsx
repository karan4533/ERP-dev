import { useState, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
    Calendar,
    EllipsisIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Download,
    Eye,
    CheckCircle2,
    Clock,
    X,
    Filter,
    Edit2,
    Trash2
} from 'lucide-react'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import EditRequestModal from '../../../../Common/CommonComponents/EditRequestModal'
import DeleteRequestModal from '../../../../Common/CommonComponents/DeleteRequestModal'
import { useAuth } from '../../../../context/AuthContext'
import { canRoleDelete } from '../../../../Common/RBAC/actionPermissions'

const INITIAL_EXTENDED_CLASSES = [
    {
        id: 'EXT-101',
        className: 'Class 12',
        section: 'A',
        teacher: 'Sandy Selva',
        subject: 'English',
        createdBy: 'Admin User',
        createdDate: '02/04/2026',
        scheduledDate: '10/04/2026',
        startTime: '06:30 PM',
        endTime: '07:30 PM',
        venue: 'Seminar Hall Room 1',
        topic: 'Advanced Essay Composition & Literary Analysis',
        status: 'Scheduled',
        enrolledCount: 38,
        attendedCount: null,
        receivedBy: null,
        receivedDate: null,
        sessionNotes: ''
    },
    {
        id: 'EXT-102',
        className: 'Class 10',
        section: 'A',
        teacher: 'Anita Verma',
        subject: 'Mathematics',
        createdBy: 'Priya Nair (Coordinator)',
        createdDate: '03/04/2026',
        scheduledDate: '08/04/2026',
        startTime: '04:00 PM',
        endTime: '05:30 PM',
        venue: 'Math Lab / Room 304',
        topic: 'Quadratic Equations & Trigonometric Identities Mastery',
        status: 'Received & Completed',
        enrolledCount: 42,
        attendedCount: 40,
        receivedBy: 'Anita Verma',
        receivedDate: '08/04/2026',
        sessionNotes: 'All key formulas reviewed. 40/42 students attended with active participation.'
    },
    {
        id: 'EXT-103',
        className: 'Class 11',
        section: 'B',
        teacher: 'Dr. Subramanian',
        subject: 'Physics',
        createdBy: 'Admin User',
        createdDate: '04/04/2026',
        scheduledDate: '11/04/2026',
        startTime: '04:30 PM',
        endTime: '06:00 PM',
        venue: 'Senior Physics Lab',
        topic: 'Rotational Dynamics & Practical Demonstration',
        status: 'Scheduled',
        enrolledCount: 35,
        attendedCount: null,
        receivedBy: null,
        receivedDate: null,
        sessionNotes: ''
    },
    {
        id: 'EXT-104',
        className: 'Class 9',
        section: 'A',
        teacher: 'Ananya Roy',
        subject: 'Chemistry',
        createdBy: 'Admin User',
        createdDate: '01/04/2026',
        scheduledDate: '06/04/2026',
        startTime: '04:00 PM',
        endTime: '05:00 PM',
        venue: 'Chemistry Lab',
        topic: 'Stoichiometry & Chemical Bonding Revision',
        status: 'Received & Completed',
        enrolledCount: 32,
        attendedCount: 31,
        receivedBy: 'Ananya Roy',
        receivedDate: '06/04/2026',
        sessionNotes: 'Completed hands-on titration practice and problem set review.'
    }
]

const ExtendedClass = () => {
    const { role } = useAuth()
    const canDelete = canRoleDelete(role)

    const [classesList, setClassesList] = useState(INITIAL_EXTENDED_CLASSES)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)

    // Modals
    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)
    const [viewModalClass, setViewModalClass] = useState(null)
    const [receiveModalClass, setReceiveModalClass] = useState(null)
    const [createModalOpen, setCreateModalOpen] = useState(false)

    // Receive Form State
    const [receiveForm, setReceiveForm] = useState({
        attendedCount: '',
        receivedBy: 'Class Teacher',
        sessionNotes: ''
    })

    // Create Form State
    const [createForm, setCreateForm] = useState({
        className: 'Class 10',
        section: 'A',
        teacher: 'Anita Verma',
        subject: 'Mathematics',
        scheduledDate: '2026-04-15',
        startTime: '04:00 PM',
        endTime: '05:00 PM',
        venue: 'Room 304',
        topic: '',
        enrolledCount: 40
    })

    const handleClearFilters = () => {
        setSearchTerm('')
        setStatusFilter('All')
        setFromDate(null)
        setToDate(null)
    }

    const filteredClasses = useMemo(() => {
        return classesList.filter((item) => {
            const matchesSearch =
                !searchTerm ||
                item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesStatus =
                statusFilter === 'All' || item.status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [classesList, searchTerm, statusFilter])

    const handleOpenReceive = (cls) => {
        setReceiveModalClass(cls)
        setReceiveForm({
            attendedCount: cls.enrolledCount || '',
            receivedBy: cls.teacher || 'Class Teacher',
            sessionNotes: ''
        })
    }

    const handleSubmitReceive = (e) => {
        e.preventDefault()
        if (!receiveModalClass) return

        setClassesList((prev) =>
            prev.map((item) =>
                item.id === receiveModalClass.id
                    ? {
                          ...item,
                          status: 'Received & Completed',
                          attendedCount: Number(receiveForm.attendedCount) || item.enrolledCount,
                          receivedBy: receiveForm.receivedBy,
                          receivedDate: new Date().toLocaleDateString('en-GB'),
                          sessionNotes: receiveForm.sessionNotes
                      }
                    : item
            )
        )
        setReceiveModalClass(null)
    }

    const handleCreateSubmit = (e) => {
        e.preventDefault()
        const newClass = {
            id: `EXT-${100 + classesList.length + 1}`,
            className: createForm.className,
            section: createForm.section,
            teacher: createForm.teacher,
            subject: createForm.subject,
            createdBy: 'Admin User',
            createdDate: new Date().toLocaleDateString('en-GB'),
            scheduledDate: createForm.scheduledDate,
            startTime: createForm.startTime,
            endTime: createForm.endTime,
            venue: createForm.venue,
            topic: createForm.topic || 'Extended Topic Session',
            status: 'Scheduled',
            enrolledCount: Number(createForm.enrolledCount) || 30,
            attendedCount: null,
            receivedBy: null,
            receivedDate: null,
            sessionNotes: ''
        }
        setClassesList([newClass, ...classesList])
        setCreateModalOpen(false)
        setCreateForm({
            className: 'Class 10',
            section: 'A',
            teacher: 'Anita Verma',
            subject: 'Mathematics',
            scheduledDate: '2026-04-15',
            startTime: '04:00 PM',
            endTime: '05:00 PM',
            venue: 'Room 304',
            topic: '',
            enrolledCount: 40
        })
    }

    return (
        <section>
            {/* Filters Box */}
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={handleClearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <div className='flex items-center gap-2'>
                        <Filter size={16} className='text-slate-400' />
                        <span className='text-xs font-semibold text-slate-500 uppercase'>Extended Class Oversight</span>
                    </div>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            placeholder='ID, Topic, Subject, Teacher...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-md px-3 py-2 w-full focus:outline-[#515DEF]'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status'
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-md px-3 py-2 w-full focus:outline-[#515DEF]'
                        >
                            <option value='All'>All Statuses</option>
                            <option value='Scheduled'>Scheduled</option>
                            <option value='Received & Completed'>Received & Completed</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From Date</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable={true}
                                placeholderText='DD/MM/YYYY'
                                showMonthYearDropdown={true}
                                scrollableMonthYearDropdown={true}
                                className='w-full text-sm text-slate-700 border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-[#515DEF]'
                            />
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>

                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To Date</label>
                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable={true}
                                placeholderText='DD/MM/YYYY'
                                showMonthYearDropdown={true}
                                scrollableMonthYearDropdown={true}
                                className='w-full text-sm text-slate-700 border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-[#515DEF]'
                            />
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>Extended Class Sessions</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>Create, Receive (Check-in/Complete), and View extended learning classes</p>
                    </div>
                    <div className='flex gap-x-2'>
                        <button
                            type='button'
                            onClick={() => setCreateModalOpen(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Create Extended Class
                        </button>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='border border-slate-200 text-slate-700 text-sm px-4 py-2 rounded-md hover:bg-slate-50 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
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
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Class & Sec</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject & Topic</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Teacher</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date & Time</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Venue</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Receive Action</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg text-center'>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredClasses.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='text-center py-8 text-slate-400'>
                                        No extended class records found matching filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredClasses.map((item) => (
                                    <tr key={item.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                        <td className='px-3 py-4 font-semibold text-slate-800 rounded-s-lg whitespace-nowrap'>
                                            {item.className} - {item.section}
                                            <span className='block text-xs font-normal text-slate-400'>{item.id}</span>
                                        </td>
                                        <td className='px-3 py-4 max-w-xs'>
                                            <span className='font-medium text-slate-900 block'>{item.subject}</span>
                                            <span className='text-xs text-slate-500 line-clamp-1'>{item.topic}</span>
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap text-slate-700'>{item.teacher}</td>
                                        <td className='px-3 py-4 whitespace-nowrap'>
                                            <span className='block text-slate-800 font-medium'>{item.scheduledDate}</span>
                                            <span className='block text-xs text-slate-400'>{item.startTime} – {item.endTime}</span>
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap text-slate-600'>{item.venue}</td>
                                        <td className='px-3 py-4 whitespace-nowrap'>
                                            {item.status === 'Received & Completed' ? (
                                                <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'>
                                                    <CheckCircle2 size={12} />
                                                    Received ({item.attendedCount}/{item.enrolledCount})
                                                </span>
                                            ) : (
                                                <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200'>
                                                    <Clock size={12} />
                                                    Scheduled
                                                </span>
                                            )}
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap'>
                                            {item.status === 'Scheduled' ? (
                                                <button
                                                    type='button'
                                                    onClick={() => handleOpenReceive(item)}
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all'
                                                >
                                                    <CheckCircle2 size={13} />
                                                    Receive Class
                                                </button>
                                            ) : (
                                                <span className='text-xs text-emerald-600 font-medium'>
                                                    Received on {item.receivedDate}
                                                </span>
                                            )}
                                        </td>
                                        <td className='px-3 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <button
                                                    type='button'
                                                    onClick={() => setViewModalClass(item)}
                                                    className='w-full flex items-center gap-2 text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer text-xs'
                                                >
                                                    <Eye size={14} />
                                                    View Details
                                                </button>
                                                {item.status === 'Scheduled' && (
                                                    <button
                                                        type='button'
                                                        onClick={() => handleOpenReceive(item)}
                                                        className='w-full flex items-center gap-2 text-left p-2 hover:bg-emerald-600 hover:text-white rounded cursor-pointer text-xs text-emerald-700 font-semibold'
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        Receive / Complete
                                                    </button>
                                                )}
                                                <button
                                                    type='button'
                                                    onClick={() => setEditRequestModal(true)}
                                                    className='w-full flex items-center gap-2 text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer text-xs'
                                                >
                                                    <Edit2 size={14} />
                                                    Edit
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        type='button'
                                                        onClick={() => setDeleteRequestModal(true)}
                                                        className='w-full flex items-center gap-2 text-left p-2 hover:bg-rose-600 hover:text-white rounded cursor-pointer text-xs text-rose-600'
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete
                                                    </button>
                                                )}
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filteredClasses.length} of {classesList.length} entries
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

            {/* VIEW MODAL */}
            {viewModalClass && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <h3 className='text-lg font-bold text-slate-800'>Extended Class Details</h3>
                            <button
                                type='button'
                                onClick={() => setViewModalClass(null)}
                                className='p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className='space-y-3 text-sm'>
                            <div className='grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100'>
                                <div>
                                    <span className='text-xs text-slate-400 block'>Class & Section</span>
                                    <span className='font-semibold text-slate-800'>{viewModalClass.className} - {viewModalClass.section}</span>
                                </div>
                                <div>
                                    <span className='text-xs text-slate-400 block'>Extended Class ID</span>
                                    <span className='font-semibold text-slate-800'>{viewModalClass.id}</span>
                                </div>
                                <div>
                                    <span className='text-xs text-slate-400 block'>Subject</span>
                                    <span className='font-semibold text-slate-800'>{viewModalClass.subject}</span>
                                </div>
                                <div>
                                    <span className='text-xs text-slate-400 block'>Assigned Teacher</span>
                                    <span className='font-semibold text-slate-800'>{viewModalClass.teacher}</span>
                                </div>
                            </div>

                            <div>
                                <span className='text-xs text-slate-400 block'>Session Topic & Objectives</span>
                                <p className='text-slate-700 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1'>
                                    {viewModalClass.topic}
                                </p>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <span className='text-xs text-slate-400 block'>Scheduled Date</span>
                                    <span className='font-medium text-slate-700'>{viewModalClass.scheduledDate}</span>
                                </div>
                                <div>
                                    <span className='text-xs text-slate-400 block'>Timings</span>
                                    <span className='font-medium text-slate-700'>{viewModalClass.startTime} – {viewModalClass.endTime}</span>
                                </div>
                                <div>
                                    <span className='text-xs text-slate-400 block'>Venue</span>
                                    <span className='font-medium text-slate-700'>{viewModalClass.venue}</span>
                                </div>
                                <div>
                                    <span className='text-xs text-slate-400 block'>Enrolled Students</span>
                                    <span className='font-medium text-slate-700'>{viewModalClass.enrolledCount} students</span>
                                </div>
                            </div>

                            {viewModalClass.status === 'Received & Completed' && (
                                <div className='bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1.5'>
                                    <span className='text-xs font-semibold text-emerald-800 uppercase tracking-wide block'>
                                        Reception & Completion Summary
                                    </span>
                                    <div className='grid grid-cols-2 gap-2 text-xs text-emerald-900'>
                                        <div>Attended Students: <strong>{viewModalClass.attendedCount} / {viewModalClass.enrolledCount}</strong></div>
                                        <div>Received By: <strong>{viewModalClass.receivedBy}</strong></div>
                                        <div>Received Date: <strong>{viewModalClass.receivedDate}</strong></div>
                                    </div>
                                    {viewModalClass.sessionNotes && (
                                        <p className='text-xs text-emerald-950 mt-1 italic'>
                                            Notes: &quot;{viewModalClass.sessionNotes}&quot;
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className='flex justify-end pt-2 border-t'>
                            <button
                                type='button'
                                onClick={() => setViewModalClass(null)}
                                className='px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium'
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RECEIVE MODAL */}
            {receiveModalClass && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <div className='flex items-center gap-2'>
                                <CheckCircle2 className='text-emerald-600' size={20} />
                                <h3 className='text-lg font-bold text-slate-800'>Receive Extended Class</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setReceiveModalClass(null)}
                                className='p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className='bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1'>
                            <div className='font-semibold text-slate-900'>{receiveModalClass.subject} ({receiveModalClass.className} - {receiveModalClass.section})</div>
                            <div>Scheduled: {receiveModalClass.scheduledDate} ({receiveModalClass.startTime} – {receiveModalClass.endTime})</div>
                            <div>Assigned Teacher: {receiveModalClass.teacher}</div>
                        </div>

                        <form onSubmit={handleSubmitReceive} className='space-y-4'>
                            <div>
                                <label className='text-xs font-semibold text-slate-700 block mb-1'>
                                    Attended Students Count (out of {receiveModalClass.enrolledCount})
                                </label>
                                <input
                                    type='number'
                                    required
                                    min='0'
                                    max={receiveModalClass.enrolledCount}
                                    value={receiveForm.attendedCount}
                                    onChange={(e) => setReceiveForm({ ...receiveForm, attendedCount: e.target.value })}
                                    className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    placeholder='e.g. 38'
                                />
                            </div>

                            <div>
                                <label className='text-xs font-semibold text-slate-700 block mb-1'>
                                    Received / Verified By
                                </label>
                                <input
                                    type='text'
                                    required
                                    value={receiveForm.receivedBy}
                                    onChange={(e) => setReceiveForm({ ...receiveForm, receivedBy: e.target.value })}
                                    className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                />
                            </div>

                            <div>
                                <label className='text-xs font-semibold text-slate-700 block mb-1'>
                                    Session Notes & Completion Feedback
                                </label>
                                <textarea
                                    rows={3}
                                    value={receiveForm.sessionNotes}
                                    onChange={(e) => setReceiveForm({ ...receiveForm, sessionNotes: e.target.value })}
                                    className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    placeholder='Describe topics covered, student doubts resolved...'
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t'>
                                <button
                                    type='button'
                                    onClick={() => setReceiveModalClass(null)}
                                    className='px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm'
                                >
                                    Confirm Reception & Complete
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            {createModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <div className='flex items-center gap-2'>
                                <Plus className='text-[#515DEF]' size={20} />
                                <h3 className='text-lg font-bold text-slate-800'>Create Extended Class</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setCreateModalOpen(false)}
                                className='p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className='space-y-3.5'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='text-xs font-semibold text-slate-700 block mb-1'>Class</label>
                                    <select
                                        value={createForm.className}
                                        onChange={(e) => setCreateForm({ ...createForm, className: e.target.value })}
                                        className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    >
                                        <option value='Class 9'>Class 9</option>
                                        <option value='Class 10'>Class 10</option>
                                        <option value='Class 11'>Class 11</option>
                                        <option value='Class 12'>Class 12</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='text-xs font-semibold text-slate-700 block mb-1'>Section</label>
                                    <select
                                        value={createForm.section}
                                        onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })}
                                        className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    >
                                        <option value='A'>Section A</option>
                                        <option value='B'>Section B</option>
                                        <option value='C'>Section C</option>
                                    </select>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='text-xs font-semibold text-slate-700 block mb-1'>Subject</label>
                                    <select
                                        value={createForm.subject}
                                        onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                                        className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    >
                                        <option value='Mathematics'>Mathematics</option>
                                        <option value='Physics'>Physics</option>
                                        <option value='Chemistry'>Chemistry</option>
                                        <option value='English'>English</option>
                                        <option value='Biology'>Biology</option>
                                        <option value='Computer Science'>Computer Science</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='text-xs font-semibold text-slate-700 block mb-1'>Teacher</label>
                                    <input
                                        type='text'
                                        required
                                        value={createForm.teacher}
                                        onChange={(e) => setCreateForm({ ...createForm, teacher: e.target.value })}
                                        className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='text-xs font-semibold text-slate-700 block mb-1'>Topic / Objectives</label>
                                <input
                                    type='text'
                                    required
                                    placeholder='e.g. Remedial Concept Revision, Board Exam Prep...'
                                    value={createForm.topic}
                                    onChange={(e) => setCreateForm({ ...createForm, topic: e.target.value })}
                                    className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                />
                            </div>

                            <div className='grid grid-cols-3 gap-3'>
                                <div>
                                    <label className='text-xs font-semibold text-slate-700 block mb-1'>Date</label>
                                    <input
                                        type='date'
                                        required
                                        value={createForm.scheduledDate}
                                        onChange={(e) => setCreateForm({ ...createForm, scheduledDate: e.target.value })}
                                        className='w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    />
                                </div>
                                <div>
                                    <label className='text-xs font-semibold text-slate-700 block mb-1'>Start Time</label>
                                    <input
                                        type='text'
                                        required
                                        value={createForm.startTime}
                                        onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
                                        className='w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    />
                                </div>
                                <div>
                                    <label className='text-xs font-semibold text-slate-700 block mb-1'>End Time</label>
                                    <input
                                        type='text'
                                        required
                                        value={createForm.endTime}
                                        onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })}
                                        className='w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='text-xs font-semibold text-slate-700 block mb-1'>Venue</label>
                                    <input
                                        type='text'
                                        required
                                        value={createForm.venue}
                                        onChange={(e) => setCreateForm({ ...createForm, venue: e.target.value })}
                                        className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    />
                                </div>
                                <div>
                                    <label className='text-xs font-semibold text-slate-700 block mb-1'>Enrolled Students Count</label>
                                    <input
                                        type='number'
                                        required
                                        min='1'
                                        value={createForm.enrolledCount}
                                        onChange={(e) => setCreateForm({ ...createForm, enrolledCount: e.target.value })}
                                        className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    />
                                </div>
                            </div>

                            <div className='flex justify-end gap-2 pt-3 border-t'>
                                <button
                                    type='button'
                                    onClick={() => setCreateModalOpen(false)}
                                    className='px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 bg-[#515DEF] hover:bg-[#434ecb] text-white rounded-lg text-sm font-semibold shadow-sm'
                                >
                                    Schedule Extended Class
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />
        </section>
    )
}

export default ExtendedClass
