import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, BookmarkPlus, X, CheckCircle2 } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { BORROWED_BOOKS_LIST, BOOK_STATUSES, statusBadgeColor } from './booksBorrowedData'
import { submitBookRequest } from '../../Librarian/libraryData'

const BooksBorrowed = () => {
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [exportModal, setExportModal] = useState(false)

    // Request Book Modal
    const [requestModalOpen, setRequestModalOpen] = useState(false)
    const [reqNotice, setReqNotice] = useState('')
    const [reqForm, setReqForm] = useState({
        title: '',
        author: '',
        isbn: '',
        category: 'Mathematics',
        reason: ''
    })

    const handleClearFilters = () => {
        setSearchTerm('')
        setStatusFilter('All')
        setFromDate(null)
        setToDate(null)
    }

    const filteredBooks = BORROWED_BOOKS_LIST.filter((b) => {
        const matchesSearch =
            !searchTerm ||
            b.bookId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.bookName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.authorName.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'All' || b.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const handleRequestSubmit = (e) => {
        e.preventDefault()
        submitBookRequest({
            title: reqForm.title,
            author: reqForm.author,
            isbn: reqForm.isbn,
            category: reqForm.category,
            reason: reqForm.reason,
            requestedBy: 'Anita Verma',
            requestedByRole: 'Teacher',
            memberId: 'TEA-1001'
        })
        setRequestModalOpen(false)
        setReqNotice(`Book request for "${reqForm.title}" submitted to Library Desk.`)
        setTimeout(() => setReqNotice(''), 4000)
        setReqForm({ title: '', author: '', isbn: '', category: 'Mathematics', reason: '' })
    }

    return (
        <section className='space-y-6'>
            {/* Notice */}
            {reqNotice && (
                <div className='p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2'>
                    <CheckCircle2 size={16} className='text-emerald-600 shrink-0' />
                    <span>{reqNotice}</span>
                </div>
            )}

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
                        My Library Borrowing History
                    </span>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            placeholder='Book ID, name, author...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-md px-3 py-2 w-full focus:outline-[#515DEF]'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status-filter'
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm font-normal text-slate-700 border border-[#D9D9D9] rounded-md px-3 py-2 w-full focus:outline-[#515DEF]'
                        >
                            <option value='All'>All Statuses</option>
                            {BOOK_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
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

            {/* Borrowed Books List */}
            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>Borrowed Books List</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>Staff borrowing allowance: <strong>Max 5 books</strong></p>
                    </div>
                    <div className='flex gap-x-2'>
                        <button
                            type='button'
                            onClick={() => setRequestModalOpen(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <BookmarkPlus size={16} />
                            Request Book
                        </button>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='border border-slate-200 text-slate-700 text-sm px-4 py-2 rounded-lg hover:bg-slate-50 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
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
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Book ID</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Book Name</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Author Name</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Issued Date</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase'>Due Date</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBooks.map((item) => (
                                <tr key={item.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                    <td className='px-3 py-4 font-semibold text-slate-800 rounded-s-lg'>{item.bookId}</td>
                                    <td className='px-3 py-4 font-bold text-slate-900'>{item.bookName}</td>
                                    <td className='px-3 py-4 text-slate-700'>{item.authorName}</td>
                                    <td className='px-3 py-4'>{item.issuedDate}</td>
                                    <td className='px-3 py-4'>{item.returnDate}</td>
                                    <td className='px-3 py-4 rounded-e-lg'>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeColor[item.status] || 'bg-slate-100 text-slate-700'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* REQUEST BOOK MODAL */}
            {requestModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <div className='flex items-center gap-2'>
                                <BookmarkPlus className='text-[#515DEF]' size={20} />
                                <h3 className='text-lg font-bold text-slate-900'>Request Book Requisition</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setRequestModalOpen(false)}
                                className='p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleRequestSubmit} className='space-y-3.5 text-sm'>
                            <div>
                                <label className='text-xs font-semibold text-slate-700 block mb-1'>Book Title *</label>
                                <input
                                    type='text'
                                    required
                                    value={reqForm.title}
                                    onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })}
                                    className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    placeholder='e.g. NCERT Exemplar Mathematics'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='text-xs font-semibold text-slate-700 block mb-1'>Author *</label>
                                    <input
                                        type='text'
                                        required
                                        value={reqForm.author}
                                        onChange={(e) => setReqForm({ ...reqForm, author: e.target.value })}
                                        className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    />
                                </div>
                                <div>
                                    <label className='text-xs font-semibold text-slate-700 block mb-1'>Category</label>
                                    <select
                                        value={reqForm.category}
                                        onChange={(e) => setReqForm({ ...reqForm, category: e.target.value })}
                                        className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    >
                                        <option value='Mathematics'>Mathematics</option>
                                        <option value='Science'>Science</option>
                                        <option value='English'>English</option>
                                        <option value='Social Studies'>Social Studies</option>
                                        <option value='General'>General</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='text-xs font-semibold text-slate-700 block mb-1'>ISBN (Optional)</label>
                                <input
                                    type='text'
                                    value={reqForm.isbn}
                                    onChange={(e) => setReqForm({ ...reqForm, isbn: e.target.value })}
                                    className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    placeholder='978-xxxxxxxxxx'
                                />
                            </div>

                            <div>
                                <label className='text-xs font-semibold text-slate-700 block mb-1'>Academic Reason / Purpose *</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={reqForm.reason}
                                    onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })}
                                    className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    placeholder='Lesson preparation, competitive exam coaching...'
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-3 border-t'>
                                <button
                                    type='button'
                                    onClick={() => setRequestModalOpen(false)}
                                    className='px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 bg-[#515DEF] hover:bg-[#434ecb] text-white rounded-lg text-sm font-semibold shadow-sm'
                                >
                                    Submit Book Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default BooksBorrowed
