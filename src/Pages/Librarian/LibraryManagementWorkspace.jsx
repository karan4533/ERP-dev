import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
    Library,
    BookOpen,
    BookMarked,
    Plus,
    Search,
    Filter,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ArrowRight,
    Clock,
    User,
    RotateCcw,
    BarChart3,
    Layers,
    ShieldAlert,
    Info,
    ChevronRight,
    Download,
    X
} from 'lucide-react'
import {
    getCatalogBooks,
    saveCatalogBooks,
    getIssuedBooks,
    saveIssuedBooks,
    REGISTERED_MEMBERS,
    BORROWING_RULES,
    issueBookToMember,
    returnBookIssue
} from './libraryData'

const LibraryManagementWorkspace = ({ defaultTab = 'catalog' }) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()

    // Determine active tab from URL query param "?tab=" or fallback to defaultTab prop
    const tabFromUrl = searchParams.get('tab')
    const [activeTab, setActiveTab] = useState(tabFromUrl || defaultTab)

    useEffect(() => {
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl)
        }
    }, [tabFromUrl])

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey)
        setSearchParams({ tab: tabKey })
    }

    // State for Catalog & Circulation
    const [catalogBooks, setCatalogBooks] = useState(getCatalogBooks())
    const [issuedBooks, setIssuedBooks] = useState(getIssuedBooks())

    // Feedback notifications
    const [notification, setNotification] = useState(null)

    // Clear notification after 4s
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 4000)
            return () => clearTimeout(timer)
        }
    }, [notification])

    /* =========================================================
       TAB 1: CATALOG & INVENTORY STATE
       ========================================================= */
    const [catalogSearch, setCatalogSearch] = useState('')
    const [catalogCategory, setCatalogCategory] = useState('')
    const [catalogStockFilter, setCatalogStockFilter] = useState('All')

    const categories = useMemo(() => {
        return [...new Set(catalogBooks.map((b) => b.category).filter(Boolean))]
    }, [catalogBooks])

    const filteredCatalog = useMemo(() => {
        return catalogBooks.filter((book) => {
            if (catalogCategory && book.category !== catalogCategory) return false
            if (catalogStockFilter === 'InStock' && book.availableCopies <= 0) return false
            if (catalogStockFilter === 'LowStock' && (book.availableCopies === 0 || book.availableCopies > 3)) return false
            if (catalogStockFilter === 'OutOfStock' && book.availableCopies > 0) return false

            if (!catalogSearch.trim()) return true
            const q = catalogSearch.trim().toLowerCase()
            return (
                book.id.toLowerCase().includes(q) ||
                book.title.toLowerCase().includes(q) ||
                book.author.toLowerCase().includes(q) ||
                book.isbn.toLowerCase().includes(q) ||
                (book.shelf && book.shelf.toLowerCase().includes(q))
            )
        })
    }, [catalogBooks, catalogSearch, catalogCategory, catalogStockFilter])

    // Quick Catalog Stats
    const totalTitles = catalogBooks.length
    const totalCopies = catalogBooks.reduce((acc, b) => acc + (Number(b.totalCopies) || 0), 0)
    const availableCopies = catalogBooks.reduce((acc, b) => acc + (Number(b.availableCopies) || 0), 0)
    const issuedCopies = Math.max(0, totalCopies - availableCopies)

    /* =========================================================
       TAB 2: CIRCULATION & ISSUE/RETURN STATE
       ========================================================= */
    const [selectedMemberId, setSelectedMemberId] = useState(REGISTERED_MEMBERS[0]?.id || '')
    const [selectedBookId, setSelectedBookId] = useState(catalogBooks[0]?.id || '')
    const [issueDueDate, setIssueDueDate] = useState(() => {
        const firstMember = REGISTERED_MEMBERS[0]
        const isStud = firstMember?.memberType === 'Student' || firstMember?.role === 'Student'
        const days = isStud ? BORROWING_RULES.Student.loanPeriodDays : BORROWING_RULES.Staff.loanPeriodDays
        return new Date(Date.now() + days * 86400000)
    })

    const [circulationSearch, setCirculationSearch] = useState('')
    const [circulationStatusFilter, setCirculationStatusFilter] = useState('All')

    // Selected member calculation & borrowing limit enforcement
    const selectedMember = useMemo(() => {
        return REGISTERED_MEMBERS.find((m) => m.id === selectedMemberId) || REGISTERED_MEMBERS[0]
    }, [selectedMemberId])

    const isStudentBorrower = selectedMember?.memberType === 'Student' || selectedMember?.role === 'Student'
    const allowedLimit = isStudentBorrower ? BORROWING_RULES.Student.maxBooks : BORROWING_RULES.Staff.maxBooks

    // Real-time active borrowed count for selected member
    const activeBorrowedCount = useMemo(() => {
        if (!selectedMember) return 0
        return issuedBooks.filter(
            (item) => item.memberId === selectedMember.id && item.status !== 'Returned'
        ).length
    }, [selectedMember, issuedBooks])

    const isMemberLimitReached = activeBorrowedCount >= allowedLimit

    const selectedBook = useMemo(() => {
        return catalogBooks.find((b) => b.id === selectedBookId) || catalogBooks[0]
    }, [catalogBooks, selectedBookId])

    const isBookOutOfStock = (selectedBook?.availableCopies || 0) <= 0

    // Handle member selection change & adjust due date
    const handleMemberSelect = (memberId) => {
        setSelectedMemberId(memberId)
        const mem = REGISTERED_MEMBERS.find((m) => m.id === memberId)
        const isStud = mem?.memberType === 'Student' || mem?.role === 'Student'
        const loanDays = isStud ? BORROWING_RULES.Student.loanPeriodDays : BORROWING_RULES.Staff.loanPeriodDays
        setIssueDueDate(new Date(Date.now() + loanDays * 86400000))
    }

    // Trigger Issue Book
    const handleIssueBookSubmit = (e) => {
        e.preventDefault()

        if (isMemberLimitReached) {
            setNotification({
                type: 'error',
                message: `Borrowing Limit Enforced (Decision 10): ${isStudentBorrower ? 'Students are restricted to 1 active book' : 'Staff are restricted to 5 active books'}. ${selectedMember.name} already holds ${activeBorrowedCount} active loan(s).`
            })
            return
        }

        if (isBookOutOfStock) {
            setNotification({
                type: 'error',
                message: `Out of Stock: Zero copies available for "${selectedBook.title}".`
            })
            return
        }

        const res = issueBookToMember({
            bookId: selectedBook.id,
            memberId: selectedMember.id,
            returnDate: issueDueDate.toLocaleDateString('en-GB')
        })

        if (res.success) {
            setCatalogBooks(getCatalogBooks())
            setIssuedBooks(getIssuedBooks())
            setNotification({
                type: 'success',
                message: res.message
            })
        } else {
            setNotification({
                type: 'error',
                message: res.message
            })
        }
    }

    // Trigger Return Book
    const handleReturnBook = (issueId) => {
        const res = returnBookIssue({
            issueId,
            returnComment: 'Returned in good condition'
        })

        if (res.success) {
            setCatalogBooks(getCatalogBooks())
            setIssuedBooks(getIssuedBooks())
            setNotification({
                type: 'success',
                message: res.message
            })
        }
    }

    // Quick Issue from Catalog Tab
    const handleQuickIssueFromCatalog = (bookId) => {
        setSelectedBookId(bookId)
        handleTabChange('circulation')
    }

    // Filtered Issued Books List
    const filteredIssuedBooks = useMemo(() => {
        return issuedBooks.filter((item) => {
            if (circulationStatusFilter !== 'All' && item.status !== circulationStatusFilter) return false
            if (!circulationSearch.trim()) return true
            const q = circulationSearch.trim().toLowerCase()
            return (
                item.id.toLowerCase().includes(q) ||
                item.bookTitle.toLowerCase().includes(q) ||
                item.memberName.toLowerCase().includes(q) ||
                item.memberId.toLowerCase().includes(q) ||
                (item.author && item.author.toLowerCase().includes(q))
            )
        })
    }, [issuedBooks, circulationSearch, circulationStatusFilter])

    /* =========================================================
       TAB 3: HISTORY & ANALYTICS DATA
       ========================================================= */
    const totalReturned = issuedBooks.filter((i) => i.status === 'Returned').length
    const totalOverdue = issuedBooks.filter((i) => i.status === 'Overdue').length
    const totalActiveLoans = issuedBooks.filter((i) => i.status !== 'Returned').length
    const totalFinesCollected = issuedBooks
        .filter((i) => i.status === 'Returned' && i.lateFee > 0)
        .reduce((acc, curr) => acc + (Number(curr.lateFee) || 0), 120) // include baseline collection

    return (
        <div className="space-y-6 pb-12">
            {/* Header with Title and Unified Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="p-2.5 rounded-2xl bg-indigo-50 text-[#515DEF] border border-indigo-100">
                            <Library className="w-6 h-6" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold text-slate-800">Library Management Workspace</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Unified Desk
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Central Catalog, Real-Time Circulation, and Borrowing Limits (Student: 1, Staff: 5)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/librarian/book-management/add-book"
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#515DEF] hover:bg-indigo-600 text-white flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                            <Plus className="w-4 h-4" /> Add New Book
                        </Link>
                        <Link
                            to="/librarian/book-requests"
                            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors"
                        >
                            <BookOpen className="w-4 h-4 text-[#515DEF]" /> Requisitions
                        </Link>
                    </div>
                </div>

                {/* Workspace Navigation Tabs */}
                <div className="mt-6 flex items-center gap-2 border-b border-slate-200">
                    <button
                        type="button"
                        onClick={() => handleTabChange('catalog')}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                            activeTab === 'catalog'
                                ? 'border-[#515DEF] text-[#515DEF] bg-indigo-50/50 rounded-t-lg'
                                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        Book Catalog &amp; Inventory
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
                            {totalTitles}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('circulation')}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                            activeTab === 'circulation'
                                ? 'border-[#515DEF] text-[#515DEF] bg-indigo-50/50 rounded-t-lg'
                                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <BookMarked className="w-4 h-4" />
                        Book Circulation &amp; Issue/Return
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-[#515DEF]">
                            {totalActiveLoans} Active
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('history')}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                            activeTab === 'history'
                                ? 'border-[#515DEF] text-[#515DEF] bg-indigo-50/50 rounded-t-lg'
                                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        History &amp; Circulation Analytics
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {notification && (
                <div
                    className={`p-4 rounded-xl text-xs flex items-center justify-between border shadow-xs ${
                        notification.type === 'error'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                >
                    <div className="flex items-center gap-2.5">
                        {notification.type === 'error' ? (
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <span className="font-medium">{notification.message}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setNotification(null)}
                        className="text-slate-400 hover:text-slate-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* =========================================================
               TAB 1: BOOK CATALOG & INVENTORY
               ========================================================= */}
            {activeTab === 'catalog' && (
                <div className="space-y-6">
                    {/* Catalog KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                            <div>
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Titles</div>
                                <div className="text-2xl font-black text-slate-800 mt-1">{totalTitles}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">Across {categories.length} categories</div>
                            </div>
                            <span className="p-3 rounded-2xl bg-indigo-50 text-[#515DEF]">
                                <BookOpen className="w-5 h-5" />
                            </span>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                            <div>
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Stock / Copies</div>
                                <div className="text-2xl font-black text-slate-800 mt-1">{totalCopies}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">Physical books cataloged</div>
                            </div>
                            <span className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                                <Layers className="w-5 h-5" />
                            </span>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                            <div>
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Available on Shelves</div>
                                <div className="text-2xl font-black text-emerald-600 mt-1">{availableCopies}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">Ready for immediate issue</div>
                            </div>
                            <span className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="w-5 h-5" />
                            </span>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                            <div>
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Currently Issued</div>
                                <div className="text-2xl font-black text-amber-600 mt-1">{issuedCopies}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">Out on member loans</div>
                            </div>
                            <span className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                                <BookMarked className="w-5 h-5" />
                            </span>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={catalogSearch}
                                    onChange={(e) => setCatalogSearch(e.target.value)}
                                    placeholder="Search by title, author, ISBN, or shelf..."
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#515DEF]"
                                />
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <select
                                    value={catalogCategory}
                                    onChange={(e) => setCatalogCategory(e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>

                                <select
                                    value={catalogStockFilter}
                                    onChange={(e) => setCatalogStockFilter(e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white"
                                >
                                    <option value="All">All Stock Levels</option>
                                    <option value="InStock">In Stock (&gt; 0)</option>
                                    <option value="LowStock">Low Stock (&le; 3)</option>
                                    <option value="OutOfStock">Out of Stock (0)</option>
                                </select>

                                {(catalogSearch || catalogCategory || catalogStockFilter !== 'All') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCatalogSearch('')
                                            setCatalogCategory('')
                                            setCatalogStockFilter('All')
                                        }}
                                        className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Book Catalog Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3.5">Book Code / ISBN</th>
                                        <th className="px-4 py-3.5">Title &amp; Author</th>
                                        <th className="px-4 py-3.5">Category</th>
                                        <th className="px-4 py-3.5">Shelf Location</th>
                                        <th className="px-4 py-3.5 text-center">Available / Total</th>
                                        <th className="px-4 py-3.5">Price</th>
                                        <th className="px-4 py-3.5 text-center">Quick Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredCatalog.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                                                No books matched your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCatalog.map((book) => {
                                            const isAvailable = book.availableCopies > 0
                                            const isLow = book.availableCopies > 0 && book.availableCopies <= 3

                                            return (
                                                <tr key={book.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="px-4 py-3.5 font-mono">
                                                        <div className="font-bold text-slate-800">{book.id}</div>
                                                        <div className="text-[11px] text-slate-400">{book.isbn}</div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-bold text-slate-800">{book.title}</div>
                                                        <div className="text-slate-500 text-[11px]">{book.author}</div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                                                            {book.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 font-medium text-slate-600">
                                                        {book.shelf || 'Main Stacks'}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <span
                                                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                                                !isAvailable
                                                                    ? 'bg-rose-100 text-rose-700'
                                                                    : isLow
                                                                    ? 'bg-amber-100 text-amber-800'
                                                                    : 'bg-emerald-100 text-emerald-800'
                                                            }`}
                                                        >
                                                            {book.availableCopies} / {book.totalCopies} Available
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 font-semibold text-slate-700">
                                                        ₹{book.price || 400}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <button
                                                            type="button"
                                                            disabled={!isAvailable}
                                                            onClick={() => handleQuickIssueFromCatalog(book.id)}
                                                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                                                                isAvailable
                                                                    ? 'bg-[#515DEF] text-white hover:bg-indigo-600 shadow-xs'
                                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            Issue Book →
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               TAB 2: BOOK CIRCULATION & ISSUE/RETURN
               ========================================================= */}
            {activeTab === 'circulation' && (
                <div className="space-y-6">
                    {/* Decision 10 Policy Enforcing Banner */}
                    <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border border-indigo-200/80 rounded-2xl p-4.5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <span className="p-2 rounded-xl bg-[#515DEF] text-white shrink-0 mt-0.5">
                                    <ShieldAlert className="w-5 h-5" />
                                </span>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">
                                        Institutional Borrowing Policy Active (Decision 10)
                                    </h3>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        Borrowing limits are strictly validated in real-time. Students: <strong>Max 1 Book (14 Days)</strong> • Staff / Teachers: <strong>Max 5 Books (30 Days)</strong>.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white/80 px-3 py-1.5 rounded-xl border border-indigo-100 shrink-0">
                                <span>Student Fine: <strong>₹5/day</strong></span>
                                <span className="text-slate-300">|</span>
                                <span>Staff Fine: <strong>₹2/day</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Issue Book Desk (Interactive Loan Panel) */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
                            <BookMarked className="w-4 h-4 text-[#515DEF]" />
                            Issue Book to Member (Desk Live Dispatch)
                        </h2>

                        <form onSubmit={handleIssueBookSubmit} className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Member Selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Select Borrower / Member *
                                    </label>
                                    <select
                                        value={selectedMemberId}
                                        onChange={(e) => handleMemberSelect(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-hidden focus:border-[#515DEF]"
                                    >
                                        {REGISTERED_MEMBERS.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({m.memberType || m.role}) — {m.admissionNumber}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Member Limit Status Indicator */}
                                    <div className="mt-2 text-xs flex items-center justify-between">
                                        <span className="text-slate-500">
                                            Limit: <strong className="text-slate-700">{allowedLimit} Book{allowedLimit > 1 ? 's' : ''}</strong>
                                        </span>
                                        <span
                                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                                                isMemberLimitReached
                                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                    : 'bg-emerald-100 text-emerald-800'
                                            }`}
                                        >
                                            {activeBorrowedCount} / {allowedLimit} Active {isMemberLimitReached && '(Limit Reached)'}
                                        </span>
                                    </div>
                                </div>

                                {/* Book Selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Select Book to Issue *
                                    </label>
                                    <select
                                        value={selectedBookId}
                                        onChange={(e) => setSelectedBookId(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-hidden focus:border-[#515DEF]"
                                    >
                                        {catalogBooks.map((b) => (
                                            <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                                                {b.title} — {b.availableCopies} available ({b.shelf || 'Shelf'})
                                            </option>
                                        ))}
                                    </select>

                                    {/* Book Stock Indicator */}
                                    <div className="mt-2 text-xs flex items-center justify-between">
                                        <span className="text-slate-500">
                                            Stock: <strong className="text-slate-700">{selectedBook?.availableCopies} / {selectedBook?.totalCopies} Copies</strong>
                                        </span>
                                        <span className={`font-bold text-[11px] ${isBookOutOfStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {isBookOutOfStock ? 'Out of Stock' : 'Available'}
                                        </span>
                                    </div>
                                </div>

                                {/* Due Date & Dispatch Button */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Calculated Due Date (Editable)
                                    </label>
                                    <div className="relative">
                                        <DatePicker
                                            selected={issueDueDate}
                                            onChange={(date) => setIssueDueDate(date)}
                                            dateFormat="dd-MM-yyyy"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-hidden focus:border-[#515DEF]"
                                        />
                                    </div>

                                    <div className="mt-2 text-[11px] text-slate-500">
                                        Default: {isStudentBorrower ? '14 Days (Student)' : '30 Days (Staff)'}
                                    </div>
                                </div>
                            </div>

                            {/* Warning message if blocked */}
                            {isMemberLimitReached && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                    <span>
                                        <strong>Cannot Issue:</strong> Member has reached their maximum quota of {allowedLimit} book{allowedLimit > 1 ? 's' : ''}. A previously issued book must be returned first.
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={isMemberLimitReached || isBookOutOfStock}
                                    className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all shadow-xs flex items-center gap-2 ${
                                        isMemberLimitReached || isBookOutOfStock
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            : 'bg-[#515DEF] text-white hover:bg-indigo-600'
                                    }`}
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Confirm Book Issue
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Active Loans & Circulation Register Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">
                                    Circulation Register &amp; Active Loans
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Track issued books, overdue loans, and record returns
                                </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={circulationSearch}
                                        onChange={(e) => setCirculationSearch(e.target.value)}
                                        placeholder="Search member or book..."
                                        className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                                    />
                                </div>

                                <select
                                    value={circulationStatusFilter}
                                    onChange={(e) => setCirculationStatusFilter(e.target.value)}
                                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Issued">Issued (Active)</option>
                                    <option value="Overdue">Overdue</option>
                                    <option value="Returned">Returned</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">Loan ID</th>
                                        <th className="px-4 py-3">Book Title</th>
                                        <th className="px-4 py-3">Borrower / Member</th>
                                        <th className="px-4 py-3">Issue Date</th>
                                        <th className="px-4 py-3">Due Date</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Fine (₹)</th>
                                        <th className="px-4 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredIssuedBooks.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                                                No circulation records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredIssuedBooks.map((item) => {
                                            const isReturned = item.status === 'Returned'
                                            const isOverdue = item.status === 'Overdue'

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                                                        {item.id}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-slate-800">{item.bookTitle}</div>
                                                        <div className="text-[11px] text-slate-500">{item.author}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-slate-800">{item.memberName}</div>
                                                        <div className="text-[11px] text-slate-500">
                                                            {item.memberType || 'Member'} • {item.admissionNumber || item.memberId}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">{item.issuedDate}</td>
                                                    <td className="px-4 py-3 text-slate-600 font-medium">{item.dueDate}</td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                                isReturned
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : isOverdue
                                                                    ? 'bg-rose-100 text-rose-800 animate-pulse'
                                                                    : 'bg-blue-100 text-blue-800'
                                                            }`}
                                                        >
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-slate-700">
                                                        {item.lateFee ? `₹${item.lateFee}` : '₹0'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {isReturned ? (
                                                            <span className="text-[11px] text-slate-400 font-medium">
                                                                Returned ({item.returnDate || 'Done'})
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleReturnBook(item.id)}
                                                                className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1 mx-auto"
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5" /> Return Book
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               TAB 3: HISTORY & ANALYTICS
               ========================================================= */}
            {activeTab === 'history' && (
                <div className="space-y-6">
                    {/* Analytics KPI Tiles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed Returns</div>
                            <div className="text-2xl font-black text-slate-800 mt-1">{totalReturned}</div>
                            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Returned in good condition</div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overdue Alerts</div>
                            <div className="text-2xl font-black text-rose-600 mt-1">{totalOverdue}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Pending fine settlement</div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fines Collected</div>
                            <div className="text-2xl font-black text-slate-800 mt-1">₹{totalFinesCollected}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Automated late fee revenue</div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Compliance Rate</div>
                            <div className="text-2xl font-black text-emerald-600 mt-1">94.8%</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Timely return ratio</div>
                        </div>
                    </div>

                    {/* Breakdown & Popular Titles Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Circulation Distribution by Member Role */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-[#515DEF]" />
                                Circulation Demographics by Member Role
                            </h3>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <div className="flex justify-between font-semibold mb-1">
                                        <span>Teachers &amp; Academic Staff (Limit: 5)</span>
                                        <span className="text-[#515DEF]">55% of loans</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-[#515DEF] h-2 rounded-full" style={{ width: '55%' }} />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between font-semibold mb-1">
                                        <span>Students (Limit: 1)</span>
                                        <span className="text-emerald-600">35% of loans</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '35%' }} />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between font-semibold mb-1">
                                        <span>Coordinators &amp; Leadership (Limit: 5)</span>
                                        <span className="text-purple-600">10% of loans</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '10%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Most Borrowed Books */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-[#515DEF]" />
                                Top Borrowed Titles this Term
                            </h3>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                                    <div>
                                        <div className="font-bold text-slate-800">Concepts of Physics (Vol 1)</div>
                                        <div className="text-[11px] text-slate-500">H.C. Verma • Science</div>
                                    </div>
                                    <span className="font-bold text-[#515DEF]">42 Loans</span>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                                    <div>
                                        <div className="font-bold text-slate-800">Wings of Fire: An Autobiography</div>
                                        <div className="text-[11px] text-slate-500">Dr. A.P.J. Abdul Kalam • Biography</div>
                                    </div>
                                    <span className="font-bold text-[#515DEF]">38 Loans</span>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                                    <div>
                                        <div className="font-bold text-slate-800">Computer Science with Python</div>
                                        <div className="text-[11px] text-slate-500">Sumita Arora • CS</div>
                                    </div>
                                    <span className="font-bold text-[#515DEF]">29 Loans</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Full Audit Log */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800">Circulation Audit Trail</h3>
                            <span className="text-xs text-slate-400">All historical issue and return entries</span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                                    <tr>
                                        <th className="px-4 py-2.5">Loan ID</th>
                                        <th className="px-4 py-2.5">Book Title</th>
                                        <th className="px-4 py-2.5">Borrower</th>
                                        <th className="px-4 py-2.5">Issue Date</th>
                                        <th className="px-4 py-2.5">Return Date</th>
                                        <th className="px-4 py-2.5">Condition / Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {issuedBooks.map((record) => (
                                        <tr key={record.id} className="hover:bg-slate-50/70">
                                            <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{record.id}</td>
                                            <td className="px-4 py-2.5 font-medium text-slate-800">{record.bookTitle}</td>
                                            <td className="px-4 py-2.5 text-slate-600">{record.memberName}</td>
                                            <td className="px-4 py-2.5 text-slate-500">{record.issuedDate}</td>
                                            <td className="px-4 py-2.5 text-slate-500">{record.returnDate || 'Active Loan'}</td>
                                            <td className="px-4 py-2.5 text-slate-600 italic">
                                                {record.returnComment || 'Standard circulation loan'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LibraryManagementWorkspace
