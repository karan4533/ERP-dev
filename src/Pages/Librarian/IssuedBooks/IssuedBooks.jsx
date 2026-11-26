import React, { useState, useMemo } from 'react'
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
    AlertCircle,
    X,
    Filter,
    Edit2,
    Trash2,
    BookOpen
} from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import EditRequestModal from '../../../Common/CommonComponents/EditRequestModal'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import { getIssuedBooks, saveIssuedBooks } from '../libraryData'
import { useAuth } from '../../../context/AuthContext'
import { canRoleDelete } from '../../../Common/RBAC/actionPermissions'

const IssuedBooks = () => {
    const { role } = useAuth()
    const canDelete = canRoleDelete(role)

    const [issuedList, setIssuedList] = useState(getIssuedBooks())
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)

    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)
    const [viewModalItem, setViewModalItem] = useState(null)

    const bagdeColor = {
        Returned: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        Issued: 'bg-blue-50 text-blue-700 border border-blue-200',
        Overdue: 'bg-rose-50 text-rose-700 border border-rose-200',
    }

    const handleClearFilters = () => {
        setSearchTerm('')
        setStatusFilter('All')
        setFromDate(null)
        setToDate(null)
    }

    const filteredList = useMemo(() => {
        return issuedList.filter((item) => {
            const matchesSearch =
                !searchTerm ||
                item.bookTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.bookId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesStatus =
                statusFilter === 'All' || item.status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [issuedList, searchTerm, statusFilter])

    const handleMarkReturned = (issueId) => {
        const updated = issuedList.map((item) =>
            item.id === issueId
                ? { ...item, status: 'Returned', returnDate: new Date().toLocaleDateString('en-GB') }
                : item
        )
        setIssuedList(updated)
        saveIssuedBooks(updated)
    }

    return (
        <section className='space-y-4'>
            {/* Filter Box */}
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
                        Circulation Registry
                    </span>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            placeholder='Title, Book ID, borrower name...'
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
                            <option value='Issued'>Issued</option>
                            <option value='Overdue'>Overdue</option>
                            <option value='Returned'>Returned</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From Date</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable
                                placeholderText='DD/MM/YYYY'
                                className='w-full text-sm text-slate-700 border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-[#515DEF]'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To Date</label>
                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable
                                placeholderText='DD/MM/YYYY'
                                className='w-full text-sm text-slate-700 border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-[#515DEF]'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            {/* Issued Books Table */}
            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>Issued Book Records</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>Tracking active loans, return deadlines, and overdue fines</p>
                    </div>
                    <div className='flex gap-x-2'>
                        <NavLink
                            to='/librarian/issued-books/add-issued-book'
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Issue Book
                        </NavLink>
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
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Book ID & Title</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Borrower Member</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Role</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Issued Date</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Due Date</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Late Fine</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg text-center'>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='text-center py-8 text-slate-400'>
                                        No issued book records matching filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map((item) => (
                                    <tr key={item.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                        <td className='px-3 py-4 rounded-s-lg max-w-xs'>
                                            <span className='font-bold text-slate-900 block'>{item.bookTitle}</span>
                                            <span className='text-xs text-[#515DEF] font-semibold'>{item.bookId} • By: {item.author}</span>
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap'>
                                            <span className='font-semibold text-slate-800 block'>{item.memberName}</span>
                                            <span className='text-xs text-slate-400'>{item.admissionNumber}</span>
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap'>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                item.memberType === 'Student'
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                                            }`}>
                                                {item.memberType}
                                            </span>
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap font-medium text-slate-700'>{item.issuedDate}</td>
                                        <td className='px-3 py-4 whitespace-nowrap font-medium text-slate-700'>{item.dueDate}</td>
                                        <td className='px-3 py-4 whitespace-nowrap'>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${bagdeColor[item.status] || 'bg-slate-100 text-slate-700'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap font-bold text-slate-900'>
                                            {item.lateFee > 0 ? (
                                                <span className='text-rose-600'>₹{item.lateFee} ({item.daysOverdue}d)</span>
                                            ) : (
                                                <span className='text-slate-400 font-normal'>₹0</span>
                                            )}
                                        </td>
                                        <td className='px-3 py-4 text-center rounded-e-lg whitespace-nowrap'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <button
                                                    type='button'
                                                    onClick={() => setViewModalItem(item)}
                                                    className='flex items-center gap-2 w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer text-xs'
                                                >
                                                    <Eye size={13} />
                                                    View Details
                                                </button>
                                                {item.status !== 'Returned' && (
                                                    <button
                                                        type='button'
                                                        onClick={() => handleMarkReturned(item.id)}
                                                        className='flex items-center gap-2 w-full text-left p-2 hover:bg-emerald-600 hover:text-white rounded cursor-pointer text-xs text-emerald-700 font-semibold'
                                                    >
                                                        <CheckCircle2 size={13} />
                                                        Mark Returned
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filteredList.length} of {issuedList.length} entries
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
            {viewModalItem && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <h3 className='text-lg font-bold text-slate-900'>Loan Transaction Details</h3>
                            <button
                                type='button'
                                onClick={() => setViewModalItem(null)}
                                className='p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className='space-y-3 text-sm'>
                            <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
                                <span className='text-xs text-slate-400 block'>Book Title & ID</span>
                                <span className='font-bold text-slate-900'>{viewModalItem.bookTitle}</span>
                                <span className='text-xs text-[#515DEF] block mt-0.5'>{viewModalItem.bookId} • By {viewModalItem.author}</span>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <span className='text-xs text-slate-400 block'>Borrower Member</span>
                                    <span className='font-semibold text-slate-800'>{viewModalItem.memberName}</span>
                                </div>
                                <div>
                                    <span className='text-xs text-slate-400 block'>Role / ID</span>
                                    <span className='font-semibold text-slate-800'>{viewModalItem.memberType} ({viewModalItem.admissionNumber})</span>
                                </div>
                                <div>
                                    <span className='text-xs text-slate-400 block'>Issued Date</span>
                                    <span className='font-semibold text-slate-800'>{viewModalItem.issuedDate}</span>
                                </div>
                                <div>
                                    <span className='text-xs text-slate-400 block'>Due Return Date</span>
                                    <span className='font-semibold text-slate-800'>{viewModalItem.dueDate}</span>
                                </div>
                            </div>

                            {viewModalItem.returnDate && (
                                <div>
                                    <span className='text-xs text-slate-400 block'>Actual Return Date</span>
                                    <span className='font-semibold text-emerald-700'>{viewModalItem.returnDate}</span>
                                </div>
                            )}

                            {viewModalItem.lateFee > 0 && (
                                <div className='p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800'>
                                    <strong>Late Return Overdue:</strong> {viewModalItem.daysOverdue} days past deadline. Fine amount: ₹{viewModalItem.lateFee}.
                                </div>
                            )}

                            {viewModalItem.returnComment && (
                                <div>
                                    <span className='text-xs text-slate-400 block'>Circulation Notes</span>
                                    <p className='text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1'>
                                        {viewModalItem.returnComment}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className='flex justify-end pt-2 border-t'>
                            <button
                                type='button'
                                onClick={() => setViewModalItem(null)}
                                className='px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium'
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />
        </section>
    )
}

export default IssuedBooks
