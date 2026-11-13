import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, EllipsisIcon, ChevronLeft, ChevronRight, Plus, Download } from 'lucide-react'
import mo_user from '../../../../assets/images/no-profile.png'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import EditRequestModal from '../../../../Common/CommonComponents/EditRequestModal'
import DeleteRequestModal from '../../../../Common/CommonComponents/DeleteRequestModal'
import { CATALOG_BOOKS } from '../../libraryData'

const BookList = () => {
    const [books] = useState(CATALOG_BOOKS)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)

    const categories = useMemo(() => {
        return [...new Set(books.map((b) => b.category).filter(Boolean))]
    }, [books])

    const filteredBooks = useMemo(() => {
        return books.filter((book) => {
            if (categoryFilter && book.category !== categoryFilter) return false
            if (!search.trim()) return true
            const q = search.trim().toLowerCase()
            return (
                book.id.toLowerCase().includes(q) ||
                book.title.toLowerCase().includes(q) ||
                book.author.toLowerCase().includes(q) ||
                (book.category && book.category.toLowerCase().includes(q)) ||
                (book.shelf && book.shelf.toLowerCase().includes(q))
            )
        })
    }, [books, search, categoryFilter])

    const handleClearFilters = () => {
        setSearch('')
        setCategoryFilter('')
    }

    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={handleClearFilters}
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
                            type='text'
                            id='search'
                            placeholder='Search by ID, title, author, category...'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='category' className='text-base font-medium text-[#808080]'>Category</label>
                        <select
                            id='category'
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable={true}
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
                    <h2 className='text-xl font-medium text-black'>Book List</h2>
                    <div className='flex gap-x-2'>
                        <NavLink to='/librarian/book-management/add-book' className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Plus size={16} />
                            Add New Book
                        </NavLink>
                        <button type='button' onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
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
                        <option value='40'>40</option>
                        <option value='50'>50</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Book Image</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Book ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Book Title</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Category</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Author</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Published Year</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Total Copies</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Available Copies</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Shelf Location</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Publisher Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Language</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredBooks.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className='px-2 py-8 text-center text-[#667085]'>
                                        No books found matching the current search criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredBooks.map((book) => (
                                    <tr key={book.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                        <td className='px-2 py-4 object-cover flex justify-center rounded-s-lg'>
                                            <img src={mo_user} alt='book cover' className='w-9 h-9' />
                                        </td>
                                        <td className='px-2 py-4 font-medium text-slate-800'>{book.id}</td>
                                        <td className='px-2 py-4 font-semibold text-slate-900'>{book.title}</td>
                                        <td className='px-2 py-4'>{book.category}</td>
                                        <td className='px-2 py-4'>{book.author}</td>
                                        <td className='px-2 py-4'>{book.publishedYear || '2024'}</td>
                                        <td className='px-2 py-4'>{book.totalCopies}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${book.availableCopies > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                {book.availableCopies}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4'>{book.shelf}</td>
                                        <td className='px-2 py-4'>{book.publisher}</td>
                                        <td className='px-2 py-4'>English</td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown
                                                buttonContent={<EllipsisIcon size={16} className='text-black' />}
                                            >
                                                <button type='button' className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>
                                                    View
                                                </button>
                                                <button type='button' onClick={() => setEditRequestModal(true)} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>
                                                    Edit
                                                </button>
                                                <button type='button' onClick={() => setDeleteRequestModal(true)} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>
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

            {/* Pagination */}
            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>Showing 1 to {filteredBooks.length} of {filteredBooks.length} entries</p>

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
            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />
        </section>
    )
}

export default BookList
