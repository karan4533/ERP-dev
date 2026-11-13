const STORAGE_ISSUED_KEY = 'schoolerp-library-issued-books'
const STORAGE_REQUESTS_KEY = 'schoolerp-library-book-requests'
const STORAGE_CATALOG_KEY = 'schoolerp-library-catalog-books'

export const BORROWING_RULES = {
    Student: { maxBooks: 1, loanPeriodDays: 14, finePerDay: 5 },
    Staff: { maxBooks: 5, loanPeriodDays: 30, finePerDay: 2 },
    Teacher: { maxBooks: 5, loanPeriodDays: 30, finePerDay: 2 },
    Coordinator: { maxBooks: 5, loanPeriodDays: 30, finePerDay: 2 },
}

export const CATALOG_BOOKS = [
    {
        id: 'BK-1001',
        title: 'Concepts of Physics (Vol 1)',
        author: 'H.C. Verma',
        isbn: '978-8177091877',
        publisher: 'Bharati Bhawan',
        category: 'Science',
        shelf: 'Rack A-04',
        totalCopies: 12,
        availableCopies: 8,
        price: 450
    },
    {
        id: 'BK-1002',
        title: 'Higher Engineering Mathematics',
        author: 'B.S. Grewal',
        isbn: '978-8193328491',
        publisher: 'Khanna Publishers',
        category: 'Mathematics',
        shelf: 'Rack M-02',
        totalCopies: 15,
        availableCopies: 6,
        price: 680
    },
    {
        id: 'BK-1003',
        title: 'A Brief History of Time',
        author: 'Stephen Hawking',
        isbn: '978-0553380163',
        publisher: 'Bantam Books',
        category: 'Science / Cosmology',
        shelf: 'Rack G-01',
        totalCopies: 8,
        availableCopies: 5,
        price: 399
    },
    {
        id: 'BK-1004',
        title: 'Wings of Fire: An Autobiography',
        author: 'Dr. A.P.J. Abdul Kalam',
        isbn: '978-8173711466',
        publisher: 'Universities Press',
        category: 'Biography',
        shelf: 'Rack B-03',
        totalCopies: 10,
        availableCopies: 3,
        price: 295
    },
    {
        id: 'BK-1005',
        title: 'Computer Science with Python (Class 12)',
        author: 'Sumita Arora',
        isbn: '978-9389332156',
        publisher: 'Dhanpat Rai & Co.',
        category: 'Computer Science',
        shelf: 'Rack CS-01',
        totalCopies: 20,
        availableCopies: 14,
        price: 520
    },
    {
        id: 'BK-1006',
        title: 'Oxford Advanced Learner Dictionary (10th Ed)',
        author: 'A.S. Hornby',
        isbn: '978-0194798792',
        publisher: 'Oxford University Press',
        category: 'Languages & Reference',
        shelf: 'Rack R-01',
        totalCopies: 6,
        availableCopies: 4,
        price: 850
    },
    {
        id: 'BK-1007',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '978-0060935467',
        publisher: 'Harper Perennial',
        category: 'English Literature',
        shelf: 'Rack L-02',
        totalCopies: 9,
        availableCopies: 2,
        price: 350
    }
]

export const REGISTERED_MEMBERS = [
    {
        id: 'STU-2024-1042',
        name: 'Aarav Sharma',
        memberType: 'Student',
        role: 'Student',
        classSection: 'Class 10-A',
        admissionNumber: 'ADM-2024-1042',
        email: 'aarav.sharma@school.edu',
        currentlyBorrowedCount: 0,
        maxBorrowLimit: 1
    },
    {
        id: 'STU-2024-1087',
        name: 'Diya Nair',
        memberType: 'Student',
        role: 'Student',
        classSection: 'Class 10-A',
        admissionNumber: 'ADM-2024-1087',
        email: 'diya.nair@school.edu',
        currentlyBorrowedCount: 1,
        maxBorrowLimit: 1
    },
    {
        id: 'STU-2024-1156',
        name: 'Rohan Verma',
        memberType: 'Student',
        role: 'Student',
        classSection: 'Class 10-A',
        admissionNumber: 'ADM-2024-1156',
        email: 'rohan.verma@school.edu',
        currentlyBorrowedCount: 0,
        maxBorrowLimit: 1
    },
    {
        id: 'TEA-1001',
        name: 'Anita Verma',
        memberType: 'Staff',
        role: 'Teacher',
        classSection: 'Mathematics Dept',
        admissionNumber: 'TEA-1001',
        email: 'anita.verma@school.edu',
        currentlyBorrowedCount: 2,
        maxBorrowLimit: 5
    },
    {
        id: 'TEA-1002',
        name: 'Dr. Subramanian',
        memberType: 'Staff',
        role: 'Teacher',
        classSection: 'Physics Dept',
        admissionNumber: 'TEA-1002',
        email: 'subramanian@school.edu',
        currentlyBorrowedCount: 5,
        maxBorrowLimit: 5
    },
    {
        id: 'COORD-2001',
        name: 'Priya Nair',
        memberType: 'Staff',
        role: 'Coordinator',
        classSection: 'Secondary Wing',
        admissionNumber: 'COORD-2001',
        email: 'priya.nair@school.edu',
        currentlyBorrowedCount: 1,
        maxBorrowLimit: 5
    }
]

export const INITIAL_ISSUED_BOOKS = [
    {
        id: 'ISS-201',
        bookId: 'BK-1001',
        bookTitle: 'Concepts of Physics (Vol 1)',
        author: 'H.C. Verma',
        memberId: 'STU-2024-1087',
        memberName: 'Diya Nair',
        memberType: 'Student',
        admissionNumber: 'ADM-2024-1087',
        issuedDate: '15-03-2026',
        dueDate: '29-03-2026',
        returnDate: null,
        status: 'Overdue',
        daysOverdue: 8,
        lateFee: 40,
        returnComment: 'Book renewal requested'
    },
    {
        id: 'ISS-202',
        bookId: 'BK-1002',
        bookTitle: 'Higher Engineering Mathematics',
        author: 'B.S. Grewal',
        memberId: 'TEA-1001',
        memberName: 'Anita Verma',
        memberType: 'Staff',
        admissionNumber: 'TEA-1001',
        issuedDate: '20-03-2026',
        dueDate: '20-04-2026',
        returnDate: null,
        status: 'Issued',
        daysOverdue: 0,
        lateFee: 0,
        returnComment: 'In active use for Class 10/12 syllabus'
    },
    {
        id: 'ISS-203',
        bookId: 'BK-1005',
        bookTitle: 'Computer Science with Python (Class 12)',
        author: 'Sumita Arora',
        memberId: 'TEA-1001',
        memberName: 'Anita Verma',
        memberType: 'Staff',
        admissionNumber: 'TEA-1001',
        issuedDate: '22-03-2026',
        dueDate: '22-04-2026',
        returnDate: null,
        status: 'Issued',
        daysOverdue: 0,
        lateFee: 0,
        returnComment: 'Practical reference'
    },
    {
        id: 'ISS-204',
        bookId: 'BK-1004',
        bookTitle: 'Wings of Fire: An Autobiography',
        author: 'Dr. A.P.J. Abdul Kalam',
        memberId: 'COORD-2001',
        memberName: 'Priya Nair',
        memberType: 'Staff',
        admissionNumber: 'COORD-2001',
        issuedDate: '01-03-2026',
        dueDate: '31-03-2026',
        returnDate: '28-03-2026',
        status: 'Returned',
        daysOverdue: 0,
        lateFee: 0,
        returnComment: 'Returned in excellent condition'
    }
]

export const INITIAL_BOOK_REQUESTS = [
    {
        id: 'REQ-101',
        title: 'Ignited Minds: Unleashing the Power Within India',
        author: 'Dr. A.P.J. Abdul Kalam',
        isbn: '978-0143424123',
        category: 'Inspirational / Science',
        requestedBy: 'Anita Verma',
        requestedByRole: 'Teacher',
        memberId: 'TEA-1001',
        requestDate: '02-04-2026',
        reason: 'Required for Student Reading Club & Morning Assembly inspiration',
        status: 'Pending Review',
        librarianRemarks: ''
    },
    {
        id: 'REQ-102',
        title: 'NCERT Exemplar Problems - Mathematics Class 10',
        author: 'NCERT Editorial',
        isbn: '978-9352920251',
        category: 'Mathematics',
        requestedBy: 'Aarav Sharma',
        requestedByRole: 'Student',
        memberId: 'STU-2024-1042',
        requestDate: '04-04-2026',
        reason: 'Preparation for National Talent Search Examination (NTSE)',
        status: 'Approved & Reserved',
        librarianRemarks: 'Copy ordered from central distributor; arriving next Tuesday.'
    },
    {
        id: 'REQ-103',
        title: 'Cosmos',
        author: 'Carl Sagan',
        isbn: '978-0345539434',
        category: 'Science / Astronomy',
        requestedBy: 'Dr. Subramanian',
        requestedByRole: 'Teacher',
        memberId: 'TEA-1002',
        requestDate: '28-03-2026',
        reason: 'Reference for Astronomy and Space Science Club members',
        status: 'Ready for Pickup',
        librarianRemarks: 'Procured 2 copies; available at Circulation Counter Shelf 1.'
    }
]

export const getCatalogBooks = () => {
    try {
        const stored = localStorage.getItem(STORAGE_CATALOG_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return CATALOG_BOOKS
}

export const saveCatalogBooks = (records) => {
    localStorage.setItem(STORAGE_CATALOG_KEY, JSON.stringify(records))
}

export const getIssuedBooks = () => {
    try {
        const stored = localStorage.getItem(STORAGE_ISSUED_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return INITIAL_ISSUED_BOOKS
}

export const saveIssuedBooks = (records) => {
    localStorage.setItem(STORAGE_ISSUED_KEY, JSON.stringify(records))
}

export const getBookRequests = () => {
    try {
        const stored = localStorage.getItem(STORAGE_REQUESTS_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return INITIAL_BOOK_REQUESTS
}

export const saveBookRequests = (records) => {
    localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(records))
}

export const issueBookToMember = ({ bookId, memberId, returnDate }) => {
    const catalog = getCatalogBooks()
    const book = catalog.find((b) => b.id === bookId)
    const member = REGISTERED_MEMBERS.find((m) => m.id === memberId)

    if (!book) return { success: false, message: 'Selected book was not found in catalog.' }
    if (!member) return { success: false, message: 'Selected member was not found.' }
    if (book.availableCopies <= 0) return { success: false, message: `No copies currently available for "${book.title}".` }

    const isStudent = member.memberType === 'Student' || member.role === 'Student'
    const limit = isStudent ? BORROWING_RULES.Student.maxBooks : BORROWING_RULES.Staff.maxBooks

    // Check existing active issues
    const currentIssues = getIssuedBooks().filter(
        (item) => item.memberId === memberId && item.status !== 'Returned'
    )

    if (currentIssues.length >= limit) {
        return {
            success: false,
            message: `Borrowing limit exceeded! ${isStudent ? 'Students can only borrow up to 1 book' : 'Staff can borrow up to 5 books'}. Current active loans: ${currentIssues.length}.`
        }
    }

    // Decrement available copies in catalog
    const updatedCatalog = catalog.map((b) =>
        b.id === bookId ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b
    )
    saveCatalogBooks(updatedCatalog)

    const loanDays = isStudent ? BORROWING_RULES.Student.loanPeriodDays : BORROWING_RULES.Staff.loanPeriodDays
    const newIssue = {
        id: `ISS-${200 + getIssuedBooks().length + 1}`,
        bookId: book.id,
        bookTitle: book.title,
        author: book.author,
        memberId: member.id,
        memberName: member.name,
        memberType: member.memberType || member.role,
        admissionNumber: member.admissionNumber,
        issuedDate: new Date().toLocaleDateString('en-GB'),
        dueDate: returnDate || new Date(Date.now() + loanDays * 86400000).toLocaleDateString('en-GB'),
        returnDate: null,
        status: 'Issued',
        daysOverdue: 0,
        lateFee: 0,
        returnComment: 'Standard circulation loan'
    }

    const updated = [newIssue, ...getIssuedBooks()]
    saveIssuedBooks(updated)
    return { success: true, message: `Book "${book.title}" successfully issued to ${member.name}.`, issue: newIssue }
}

export const returnBookIssue = ({ issueId, returnComment = 'Returned in good condition' }) => {
    const issues = getIssuedBooks()
    const target = issues.find((item) => item.id === issueId)
    if (!target) return { success: false, message: 'Issue record not found.' }

    const returnDateStr = new Date().toLocaleDateString('en-GB')
    const updatedIssues = issues.map((item) =>
        item.id === issueId
            ? { ...item, status: 'Returned', returnDate: returnDateStr, returnComment }
            : item
    )
    saveIssuedBooks(updatedIssues)

    // Restore available copy to catalog
    const catalog = getCatalogBooks()
    const updatedCatalog = catalog.map((b) =>
        b.id === target.bookId ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) } : b
    )
    saveCatalogBooks(updatedCatalog)

    return { success: true, message: `Book "${target.bookTitle}" returned successfully.`, issue: target }
}

export const submitBookRequest = ({ title, author, isbn, category, reason, requestedBy, requestedByRole, memberId }) => {
    const newReq = {
        id: `REQ-${100 + getBookRequests().length + 1}`,
        title,
        author,
        isbn: isbn || '—',
        category: category || 'General',
        requestedBy: requestedBy || 'Staff Member',
        requestedByRole: requestedByRole || 'Staff',
        memberId: memberId || 'MEM-001',
        requestDate: new Date().toLocaleDateString('en-GB'),
        reason: reason || 'Academic reference',
        status: 'Pending Review',
        librarianRemarks: ''
    }
    const updated = [newReq, ...getBookRequests()]
    saveBookRequests(updated)
    return { success: true, message: `Requisition for "${title}" submitted to Library Desk.`, request: newReq }
}

