import React, { useState, useMemo } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
    Calendar,
    ArrowLeft,
    BookOpen,
    Users,
    ShieldAlert,
    CheckCircle2,
    AlertCircle,
    BookmarkPlus,
    X,
    Info
} from 'lucide-react'
import QRScanner from './Components/QRScanner'
import {
    CATALOG_BOOKS,
    REGISTERED_MEMBERS,
    BORROWING_RULES,
    getIssuedBooks,
    issueBookToMember,
    submitBookRequest
} from '../libraryData'

const AddIssueBook = () => {
    const navigate = useNavigate()

    const [selectedBookId, setSelectedBookId] = useState(CATALOG_BOOKS[0]?.id || '')
    const [selectedMemberId, setSelectedMemberId] = useState(REGISTERED_MEMBERS[0]?.id || '')
    const [issuedDate, setIssuedDate] = useState(new Date())
    const [returnedDate, setReturnedDate] = useState(new Date(Date.now() + 14 * 86400000))
    const [returnComment, setReturnComment] = useState('Standard loan')
    const [notification, setNotification] = useState(null)

    // Requisition / Request Book Modal
    const [requestModalOpen, setRequestModalOpen] = useState(false)
    const [reqForm, setReqForm] = useState({
        title: '',
        author: '',
        isbn: '',
        category: 'Science',
        reason: ''
    })

    const selectedBook = useMemo(
        () => CATALOG_BOOKS.find((b) => b.id === selectedBookId) || CATALOG_BOOKS[0],
        [selectedBookId]
    )

    const selectedMember = useMemo(
        () => REGISTERED_MEMBERS.find((m) => m.id === selectedMemberId) || REGISTERED_MEMBERS[0],
        [selectedMemberId]
    )

    const isStudent = selectedMember.memberType === 'Student' || selectedMember.role === 'Student'
    const maxLimit = isStudent ? BORROWING_RULES.Student.maxBooks : BORROWING_RULES.Staff.maxBooks

    // Real-time active borrowed count from state
    const currentActiveBorrows = useMemo(() => {
        return getIssuedBooks().filter(
            (item) => item.memberId === selectedMember.id && item.status !== 'Returned'
        ).length
    }, [selectedMember.id])

    const isLimitExceeded = currentActiveBorrows >= maxLimit
    const isBookOutOfStock = selectedBook.availableCopies <= 0

    const handleMemberChange = (memberId) => {
        setSelectedMemberId(memberId)
        const member = REGISTERED_MEMBERS.find((m) => m.id === memberId)
        const isStud = member?.memberType === 'Student' || member?.role === 'Student'
        // adjust default return date: 14 days for students, 30 days for staff
        const days = isStud ? BORROWING_RULES.Student.loanPeriodDays : BORROWING_RULES.Staff.loanPeriodDays
        setReturnedDate(new Date(Date.now() + days * 86400000))
    }

    const handleIssueSubmit = (e) => {
        e.preventDefault()
        if (isLimitExceeded) {
            setNotification({
                type: 'error',
                message: `Borrowing limit exceeded: ${isStudent ? 'Students can only borrow 1 book' : 'Staff can borrow up to 5 books'}. Member currently holds ${currentActiveBorrows} active loans.`
            })
            return
        }

        if (isBookOutOfStock) {
            setNotification({
                type: 'error',
                message: `Cannot issue: Zero available copies of "${selectedBook.title}". Consider submitting a book requisition.`
            })
            return
        }

        const res = issueBookToMember({
            bookId: selectedBook.id,
            memberId: selectedMember.id,
            returnDate: returnedDate.toLocaleDateString('en-GB')
        })

        if (res.success) {
            setNotification({ type: 'success', message: res.message })
            setTimeout(() => {
                navigate('/librarian/issued-books/issued-books-list')
            }, 1800)
        } else {
            setNotification({ type: 'error', message: res.message })
        }
    }

    const handleRequisitionSubmit = (e) => {
        e.preventDefault()
        submitBookRequest({
            title: reqForm.title,
            author: reqForm.author,
            isbn: reqForm.isbn,
            category: reqForm.category,
            reason: reqForm.reason,
            requestedBy: selectedMember.name,
            requestedByRole: selectedMember.role,
            memberId: selectedMember.id
        })
        setRequestModalOpen(false)
        setNotification({
            type: 'success',
            message: `Book request for "${reqForm.title}" submitted to Chief Librarian review queue.`
        })
        setReqForm({ title: '', author: '', isbn: '', category: 'Science', reason: '' })
    }

    return (
        <section className='space-y-6 max-w-5xl mx-auto'>
            {/* Top Navigation Bar */}
            <div className='flex items-center justify-between'>
                <button
                    type='button'
                    onClick={() => navigate('/librarian/issued-books/issued-books-list')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-lg px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer font-medium'
                >
                    <ArrowLeft size={16} />
                    Back to Issued Books
                </button>
                <button
                    type='button'
                    onClick={() => setRequestModalOpen(true)}
                    className='inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-[#515DEF] border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all cursor-pointer'
                >
                    <BookmarkPlus size={15} />
                    Request New Book / Title
                </button>
            </div>

            {/* Notification Alert */}
            {notification && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                    notification.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                    {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Main Form Container */}
            <div className='bg-white rounded-2xl shadow-md p-6 space-y-6'>
                <div>
                    <h2 className='text-xl font-bold text-slate-900'>Issue Book from Central Catalog</h2>
                    <p className='text-xs text-slate-500 mt-1'>
                        Select registered member, select book title, and verify institutional borrowing rules before dispatching loan.
                    </p>
                </div>

                <form onSubmit={handleIssueSubmit} className='space-y-6'>
                    {/* SECTION 1: Member Selection & Quota Rules */}
                    <div className='p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4'>
                        <div className='flex items-center gap-2 text-sm font-bold text-slate-800'>
                            <Users className='text-[#515DEF]' size={18} />
                            <span>Borrower Member Identification & Loan Quota</span>
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                            <div>
                                <label className='text-xs font-semibold text-slate-600 block mb-1'>
                                    Select Borrower Member *
                                </label>
                                <select
                                    value={selectedMemberId}
                                    onChange={(e) => handleMemberChange(e.target.value)}
                                    className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF] bg-white font-medium text-slate-800'
                                >
                                    {REGISTERED_MEMBERS.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.memberType || m.role} • {m.classSection})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className='text-xs font-semibold text-slate-600 block mb-1'>
                                    Member Type / Role
                                </label>
                                <div className='px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold'>
                                    {selectedMember.memberType || selectedMember.role} ({selectedMember.classSection})
                                </div>
                            </div>

                            <div>
                                <label className='text-xs font-semibold text-slate-600 block mb-1'>
                                    Admission / Employee ID
                                </label>
                                <div className='px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold'>
                                    {selectedMember.admissionNumber}
                                </div>
                            </div>
                        </div>

                        {/* Borrowing Limit Status Banner */}
                        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                            isLimitExceeded
                                ? 'bg-rose-50 border-rose-200 text-rose-800'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                            <div className='flex items-center gap-2'>
                                {isLimitExceeded ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                                <span>
                                    <strong>Borrowing Quota:</strong> {isStudent ? 'Students max 1 book' : 'Staff max 5 books'}. Current active loans: <strong>{currentActiveBorrows} / {maxLimit}</strong>
                                </span>
                            </div>
                            {isLimitExceeded && (
                                <span className='font-bold uppercase tracking-wider text-[11px] text-rose-700'>
                                    Quota Limit Reached
                                </span>
                            )}
                        </div>
                    </div>

                    {/* SECTION 2: Book Catalog Selection */}
                    <div className='p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4'>
                        <div className='flex items-center gap-2 text-sm font-bold text-slate-800'>
                            <BookOpen className='text-[#515DEF]' size={18} />
                            <span>Catalog Book Selection & Availability</span>
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                            <div className='sm:col-span-2'>
                                <label className='text-xs font-semibold text-slate-600 block mb-1'>
                                    Book Title (From Catalog) *
                                </label>
                                <select
                                    value={selectedBookId}
                                    onChange={(e) => setSelectedBookId(e.target.value)}
                                    className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF] bg-white font-medium text-slate-800'
                                >
                                    {CATALOG_BOOKS.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.title} — By: {b.author} ({b.availableCopies} available)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className='text-xs font-semibold text-slate-600 block mb-1'>
                                    Book ID / Barcode
                                </label>
                                <div className='px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 font-bold'>
                                    {selectedBook.id}
                                </div>
                            </div>

                            <div>
                                <label className='text-xs font-semibold text-slate-600 block mb-1'>
                                    Author
                                </label>
                                <div className='px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700'>
                                    {selectedBook.author}
                                </div>
                            </div>

                            <div>
                                <label className='text-xs font-semibold text-slate-600 block mb-1'>
                                    ISBN Number
                                </label>
                                <div className='px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700'>
                                    {selectedBook.isbn}
                                </div>
                            </div>

                            <div>
                                <label className='text-xs font-semibold text-slate-600 block mb-1'>
                                    Shelf Location & Category
                                </label>
                                <div className='px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 font-medium'>
                                    {selectedBook.shelf} ({selectedBook.category})
                                </div>
                            </div>
                        </div>

                        {/* Available Copies Alert */}
                        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                            isBookOutOfStock
                                ? 'bg-rose-50 border-rose-200 text-rose-800'
                                : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}>
                            <div className='flex items-center gap-2'>
                                <Info size={16} />
                                <span>
                                    <strong>Circulation Inventory:</strong> Total copies: {selectedBook.totalCopies} • Available for loan: <strong>{selectedBook.availableCopies} copies</strong>
                                </span>
                            </div>
                            {isBookOutOfStock && (
                                <button
                                    type='button'
                                    onClick={() => {
                                        setReqForm({ ...reqForm, title: selectedBook.title, author: selectedBook.author })
                                        setRequestModalOpen(true)
                                    }}
                                    className='underline font-bold text-rose-700 hover:text-rose-900 cursor-pointer'
                                >
                                    Submit Requisition for More Copies
                                </button>
                            )}
                        </div>
                    </div>

                    {/* SECTION 3: Loan Dates & Return Comments */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                        <div>
                            <label className='text-xs font-semibold text-slate-600 block mb-1'>
                                Issue Date
                            </label>
                            <div className='relative'>
                                <DatePicker
                                    selected={issuedDate}
                                    onChange={(date) => setIssuedDate(date)}
                                    dateFormat='dd/MM/yyyy'
                                    className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                />
                                <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                            </div>
                        </div>

                        <div>
                            <label className='text-xs font-semibold text-slate-600 block mb-1'>
                                Due Return Date ({isStudent ? '14 Days' : '30 Days'})
                            </label>
                            <div className='relative'>
                                <DatePicker
                                    selected={returnedDate}
                                    onChange={(date) => setReturnedDate(date)}
                                    dateFormat='dd/MM/yyyy'
                                    className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                />
                                <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                            </div>
                        </div>

                        <div>
                            <label className='text-xs font-semibold text-slate-600 block mb-1'>
                                Loan Comments & Condition
                            </label>
                            <input
                                type='text'
                                value={returnComment}
                                onChange={(e) => setReturnComment(e.target.value)}
                                className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                placeholder='e.g. In good condition'
                            />
                        </div>
                    </div>

                    {/* QR Scanner Barcode Option */}
                    <div className='border-t pt-4'>
                        <span className='text-xs font-bold text-slate-700 uppercase block mb-2'>
                            Optional: Scan Book Barcode / Member ID Card
                        </span>
                        <QRScanner onScan={(val) => console.log('Scanned barcode:', val)} />
                    </div>

                    {/* Action Buttons */}
                    <div className='flex justify-end gap-3 pt-4 border-t'>
                        <button
                            type='button'
                            onClick={() => navigate('/librarian/issued-books/issued-books-list')}
                            className='px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            disabled={isLimitExceeded || isBookOutOfStock}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-all ${
                                isLimitExceeded || isBookOutOfStock
                                    ? 'bg-slate-300 cursor-not-allowed'
                                    : 'bg-[#515DEF] hover:bg-[#434ecb] cursor-pointer'
                            }`}
                        >
                            Confirm & Issue Book
                        </button>
                    </div>
                </form>
            </div>

            {/* REQUEST BOOK MODAL */}
            {requestModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <div className='flex items-center gap-2'>
                                <BookmarkPlus className='text-[#515DEF]' size={20} />
                                <h3 className='text-lg font-bold text-slate-900'>Submit Book Requisition Request</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setRequestModalOpen(false)}
                                className='p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleRequisitionSubmit} className='space-y-4 text-sm'>
                            <div>
                                <label className='text-xs font-semibold text-slate-700 block mb-1'>
                                    Requested Book Title *
                                </label>
                                <input
                                    type='text'
                                    required
                                    value={reqForm.title}
                                    onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })}
                                    className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    placeholder='e.g. S. Chand Principles of Physics'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='text-xs font-semibold text-slate-700 block mb-1'>
                                        Author *
                                    </label>
                                    <input
                                        type='text'
                                        required
                                        value={reqForm.author}
                                        onChange={(e) => setReqForm({ ...reqForm, author: e.target.value })}
                                        className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    />
                                </div>
                                <div>
                                    <label className='text-xs font-semibold text-slate-700 block mb-1'>
                                        Subject Category
                                    </label>
                                    <select
                                        value={reqForm.category}
                                        onChange={(e) => setReqForm({ ...reqForm, category: e.target.value })}
                                        className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    >
                                        <option value='Science'>Science</option>
                                        <option value='Mathematics'>Mathematics</option>
                                        <option value='Literature'>Literature</option>
                                        <option value='Social Studies'>Social Studies</option>
                                        <option value='Computer Science'>Computer Science</option>
                                        <option value='General'>General</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='text-xs font-semibold text-slate-700 block mb-1'>
                                    ISBN Number (If known)
                                </label>
                                <input
                                    type='text'
                                    value={reqForm.isbn}
                                    onChange={(e) => setReqForm({ ...reqForm, isbn: e.target.value })}
                                    className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    placeholder='978-xxxxxxxxxx'
                                />
                            </div>

                            <div>
                                <label className='text-xs font-semibold text-slate-700 block mb-1'>
                                    Purpose / Requisition Reason *
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={reqForm.reason}
                                    onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })}
                                    className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    placeholder='Academic project, competitive exam preparation, or reference requirement...'
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
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}

export default AddIssueBook
