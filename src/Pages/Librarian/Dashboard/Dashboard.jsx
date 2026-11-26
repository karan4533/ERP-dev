import React, { useState, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import {
    BookOpen,
    BookMarked,
    Clock,
    Users,
    Plus,
    CheckCircle2,
    AlertCircle,
    Download,
    ArrowUpRight,
    Search,
    BookmarkCheck,
    Send,
    Eye,
    TrendingUp,
    ShieldAlert
} from 'lucide-react'
import {
    CATALOG_BOOKS,
    REGISTERED_MEMBERS,
    getIssuedBooks,
    getBookRequests,
    saveBookRequests,
    BORROWING_RULES
} from '../libraryData'

const Dashboard = () => {
    const [issuedList, setIssuedList] = useState(getIssuedBooks())
    const [bookRequests, setBookRequests] = useState(getBookRequests())
    const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'overdue' | 'requests'
    const [actionNotice, setActionNotice] = useState('')

    const totalTitles = 1480
    const totalCopies = 6240
    const activeCirculation = issuedList.filter((b) => b.status === 'Issued' || b.status === 'Overdue').length
    const overdueBooks = issuedList.filter((b) => b.status === 'Overdue')

    const handleApproveRequest = (reqId) => {
        const updated = bookRequests.map((r) =>
            r.id === reqId
                ? { ...r, status: 'Approved & Reserved', librarianRemarks: 'Approved by Chief Librarian; reserved on Shelf R-01.' }
                : r
        )
        setBookRequests(updated)
        saveBookRequests(updated)
        setActionNotice(`Book request #${reqId} approved and allocated to borrower.`)
        setTimeout(() => setActionNotice(''), 4000)
    }

    const handleMarkReturned = (issueId) => {
        const updated = issuedList.map((i) =>
            i.id === issueId
                ? { ...i, status: 'Returned', returnDate: new Date().toLocaleDateString('en-GB') }
                : i
        )
        setIssuedList(updated)
        setActionNotice(`Book returned and restored to circulation shelf.`)
        setTimeout(() => setActionNotice(''), 4000)
    }

    const handleSendReminder = (borrowerName, bookTitle) => {
        setActionNotice(`Overdue return notification and SMS alert dispatched to ${borrowerName} for "${bookTitle}".`)
        setTimeout(() => setActionNotice(''), 4000)
    }

    return (
        <section className='space-y-6 pb-10'>
            {/* Header & Quick Action Hub */}
            <div className='bg-white rounded-2xl shadow-sm border border-slate-100 p-6'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2.5'>
                            <div className='p-2.5 bg-indigo-50 text-[#515DEF] rounded-xl'>
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h1 className='text-2xl font-bold text-slate-900'>Central Library Dashboard</h1>
                                <p className='text-xs text-slate-500 mt-0.5'>
                                    Institutional catalog, circulation transactions, borrowing rules enforcement, and reservation queues.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className='flex items-center gap-2 flex-wrap'>
                        <NavLink
                            to='/librarian/issued-books/add-issued-book'
                            className='inline-flex items-center gap-1.5 px-4 py-2 bg-[#515DEF] hover:bg-[#434ecb] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer'
                        >
                            <Plus size={15} /> Issue Book
                        </NavLink>
                        <NavLink
                            to='/librarian/book-management/add-book'
                            className='inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer'
                        >
                            <Plus size={15} /> Add New Title
                        </NavLink>
                    </div>
                </div>

                {/* Borrowing Rules Banner */}
                <div className='mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-indigo-50/50 p-3 rounded-xl border border-indigo-100'>
                    <div className='flex items-center gap-2 text-indigo-900 font-semibold'>
                        <ShieldAlert size={16} className='text-[#515DEF]' />
                        <span>Institutional Borrowing Limits:</span>
                    </div>
                    <div className='flex items-center gap-4 text-indigo-800'>
                        <span>Students: <strong>Max 1 Book</strong> (14 Days Loan)</span>
                        <span>•</span>
                        <span>Staff & Faculty: <strong>Max 5 Books</strong> (30 Days Loan)</span>
                        <span>•</span>
                        <span>Late Fee: <strong>₹5/day (Student)</strong> / <strong>₹2/day (Staff)</strong></span>
                    </div>
                </div>
            </div>

            {/* Action Notice */}
            {actionNotice && (
                <div className='p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in'>
                    <CheckCircle2 size={16} className='text-emerald-600 shrink-0' />
                    <span>{actionNotice}</span>
                </div>
            )}

            {/* 4 Core KPI Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='bg-white p-5 rounded-2xl border border-slate-100 shadow-sm'>
                    <div className='flex items-center justify-between text-slate-500'>
                        <span className='text-xs font-semibold uppercase tracking-wider'>Catalog Titles</span>
                        <BookMarked size={18} className='text-[#515DEF]' />
                    </div>
                    <div className='mt-3 flex items-baseline gap-2'>
                        <span className='text-2xl font-bold text-slate-900'>{totalTitles.toLocaleString()}</span>
                        <span className='text-xs text-slate-400'>({totalCopies.toLocaleString()} copies)</span>
                    </div>
                    <span className='text-xs text-emerald-600 font-medium block mt-1'>
                        98.2% catalog verified
                    </span>
                </div>

                <div className='bg-white p-5 rounded-2xl border border-slate-100 shadow-sm'>
                    <div className='flex items-center justify-between text-slate-500'>
                        <span className='text-xs font-semibold uppercase tracking-wider'>Active Circulation</span>
                        <Clock size={18} className='text-blue-600' />
                    </div>
                    <div className='mt-3 flex items-baseline gap-2'>
                        <span className='text-2xl font-bold text-blue-600'>{activeCirculation}</span>
                        <span className='text-xs text-slate-400'>books currently issued</span>
                    </div>
                    <span className='text-xs text-slate-500 font-medium block mt-1'>
                        Across students & faculty
                    </span>
                </div>

                <div className='bg-white p-5 rounded-2xl border border-slate-100 shadow-sm'>
                    <div className='flex items-center justify-between text-slate-500'>
                        <span className='text-xs font-semibold uppercase tracking-wider'>Overdue Returns</span>
                        <AlertCircle size={18} className='text-rose-600' />
                    </div>
                    <div className='mt-3 flex items-baseline gap-2'>
                        <span className='text-2xl font-bold text-rose-600'>{overdueBooks.length}</span>
                        <span className='text-xs text-rose-500'>requires attention</span>
                    </div>
                    <span className='text-xs text-rose-600 font-medium block mt-1'>
                        Total fines pending: ₹{overdueBooks.reduce((acc, curr) => acc + (curr.lateFee || 0), 0)}
                    </span>
                </div>

                <div className='bg-white p-5 rounded-2xl border border-slate-100 shadow-sm'>
                    <div className='flex items-center justify-between text-slate-500'>
                        <span className='text-xs font-semibold uppercase tracking-wider'>Registered Members</span>
                        <Users size={18} className='text-emerald-600' />
                    </div>
                    <div className='mt-3 flex items-baseline gap-2'>
                        <span className='text-2xl font-bold text-emerald-600'>1,250</span>
                        <span className='text-xs text-slate-400'>active</span>
                    </div>
                    <span className='text-xs text-slate-500 font-medium block mt-1'>
                        1,180 Students • 70 Faculty
                    </span>
                </div>
            </div>

            {/* View Switcher Tabs */}
            <div className='flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit'>
                <button
                    type='button'
                    onClick={() => setActiveTab('overview')}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'overview'
                            ? 'bg-white text-[#515DEF] shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    Circulation & Overdue Books ({overdueBooks.length})
                </button>
                <button
                    type='button'
                    onClick={() => setActiveTab('requests')}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'requests'
                            ? 'bg-white text-[#515DEF] shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    Book Requisitions & Requests ({bookRequests.length})
                </button>
            </div>

            {/* TAB 1: Overdue Books & Active Circulation */}
            {activeTab === 'overview' && (
                <div className='space-y-6'>
                    {/* Overdue Books Table */}
                    <div className='bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden'>
                        <div className='p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
                            <div>
                                <div className='flex items-center gap-2'>
                                    <AlertCircle className='text-rose-600' size={18} />
                                    <h3 className='text-base font-bold text-slate-900'>Overdue Books Tracking</h3>
                                </div>
                                <p className='text-xs text-slate-500 mt-0.5'>Books that have exceeded loan duration; automated fine calculations applied.</p>
                            </div>
                            <span className='text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200'>
                                {overdueBooks.length} Overdue Loans
                            </span>
                        </div>

                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm text-left'>
                                <thead className='text-xs bg-slate-50 text-slate-600 uppercase font-semibold'>
                                    <tr>
                                        <th className='px-4 py-3'>Book Details</th>
                                        <th className='px-4 py-3'>Borrower</th>
                                        <th className='px-4 py-3'>Member Type</th>
                                        <th className='px-4 py-3'>Due Date</th>
                                        <th className='px-4 py-3'>Days Overdue</th>
                                        <th className='px-4 py-3'>Accrued Fine</th>
                                        <th className='px-4 py-3 text-right'>Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {overdueBooks.map((item) => (
                                        <tr key={item.id} className='hover:bg-slate-50/50'>
                                            <td className='px-4 py-3.5'>
                                                <span className='font-bold text-slate-900 block'>{item.bookTitle}</span>
                                                <span className='text-xs text-slate-400'>ID: {item.bookId} • Author: {item.author}</span>
                                            </td>
                                            <td className='px-4 py-3.5'>
                                                <span className='font-semibold text-slate-800 block'>{item.memberName}</span>
                                                <span className='text-xs text-slate-400'>{item.admissionNumber}</span>
                                            </td>
                                            <td className='px-4 py-3.5'>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    item.memberType === 'Student'
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                                                }`}>
                                                    {item.memberType}
                                                </span>
                                            </td>
                                            <td className='px-4 py-3.5 font-semibold text-slate-700'>{item.dueDate}</td>
                                            <td className='px-4 py-3.5 font-bold text-rose-600'>{item.daysOverdue} days</td>
                                            <td className='px-4 py-3.5 font-bold text-slate-900'>₹{item.lateFee}</td>
                                            <td className='px-4 py-3.5 text-right whitespace-nowrap space-x-2'>
                                                <button
                                                    type='button'
                                                    onClick={() => handleSendReminder(item.memberName, item.bookTitle)}
                                                    className='inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all'
                                                >
                                                    <Send size={11} /> Send Reminder
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => handleMarkReturned(item.id)}
                                                    className='inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all'
                                                >
                                                    <CheckCircle2 size={11} /> Mark Returned
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Category Distribution Cards */}
                    <div className='bg-white rounded-2xl shadow-sm border border-slate-100 p-5'>
                        <h3 className='text-sm font-bold text-slate-900 mb-4'>Collection by Subject Category</h3>
                        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center'>
                            {[
                                { name: 'Science & Physics', count: '480 Titles', color: 'bg-blue-50 text-blue-700' },
                                { name: 'Mathematics', count: '320 Titles', color: 'bg-purple-50 text-purple-700' },
                                { name: 'Literature & Fiction', count: '290 Titles', color: 'bg-rose-50 text-rose-700' },
                                { name: 'Computer Science', count: '180 Titles', color: 'bg-cyan-50 text-cyan-700' },
                                { name: 'History & Civics', count: '110 Titles', color: 'bg-amber-50 text-amber-700' },
                                { name: 'Reference & Dict', count: '100 Titles', color: 'bg-emerald-50 text-emerald-700' },
                            ].map((cat) => (
                                <div key={cat.name} className={`p-3 rounded-xl border border-slate-100 ${cat.color}`}>
                                    <span className='font-bold text-xs block'>{cat.name}</span>
                                    <span className='text-xs opacity-80 mt-1 block font-medium'>{cat.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: Book Requests & Requisitions Queue */}
            {activeTab === 'requests' && (
                <div className='bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden'>
                    <div className='p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
                        <div>
                            <div className='flex items-center gap-2'>
                                <BookmarkCheck className='text-[#515DEF]' size={18} />
                                <h3 className='text-base font-bold text-slate-900'>Student & Staff Book Requests</h3>
                            </div>
                            <p className='text-xs text-slate-500 mt-0.5'>Review requisition requests for new titles or reserved library acquisitions.</p>
                        </div>
                        <span className='text-xs font-semibold text-[#515DEF] bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200'>
                            {bookRequests.length} Total Requests
                        </span>
                    </div>

                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-slate-50 text-slate-600 uppercase font-semibold'>
                                <tr>
                                    <th className='px-4 py-3'>Requisition ID</th>
                                    <th className='px-4 py-3'>Requested Book & Author</th>
                                    <th className='px-4 py-3'>Category</th>
                                    <th className='px-4 py-3'>Requested By</th>
                                    <th className='px-4 py-3'>Reason / Purpose</th>
                                    <th className='px-4 py-3'>Status</th>
                                    <th className='px-4 py-3 text-right'>Action</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100'>
                                {bookRequests.map((req) => (
                                    <tr key={req.id} className='hover:bg-slate-50/50'>
                                        <td className='px-4 py-3.5 font-bold text-slate-800'>{req.id}</td>
                                        <td className='px-4 py-3.5'>
                                            <span className='font-bold text-slate-900 block'>{req.title}</span>
                                            <span className='text-xs text-slate-400'>By: {req.author} • ISBN: {req.isbn}</span>
                                        </td>
                                        <td className='px-4 py-3.5 text-xs text-slate-600 font-medium'>{req.category}</td>
                                        <td className='px-4 py-3.5'>
                                            <span className='font-semibold text-slate-800 block text-xs'>{req.requestedBy}</span>
                                            <span className='text-xs text-slate-400'>{req.requestedByRole}</span>
                                        </td>
                                        <td className='px-4 py-3.5 text-xs text-slate-600 max-w-xs'>{req.reason}</td>
                                        <td className='px-4 py-3.5'>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                req.status === 'Approved & Reserved'
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    : req.status === 'Ready for Pickup'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {req.status}
                                            </span>
                                            {req.librarianRemarks && (
                                                <span className='block text-[11px] text-slate-400 mt-0.5 italic'>
                                                    {req.librarianRemarks}
                                                </span>
                                            )}
                                        </td>
                                        <td className='px-4 py-3.5 text-right whitespace-nowrap'>
                                            {req.status === 'Pending Review' ? (
                                                <button
                                                    type='button'
                                                    onClick={() => handleApproveRequest(req.id)}
                                                    className='inline-flex items-center gap-1 px-3 py-1.5 bg-[#515DEF] hover:bg-[#434ecb] text-white text-xs font-bold rounded-lg shadow-xs transition-all'
                                                >
                                                    <CheckCircle2 size={12} /> Approve & Reserve
                                                </button>
                                            ) : (
                                                <span className='text-xs font-semibold text-emerald-600'>Processed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    )
}

export default Dashboard
