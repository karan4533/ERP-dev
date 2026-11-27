import {
    ensureCampusSeed,
    hydrateCampusKey,
    loadCampusJson,
    saveCampusJson,
    usesCampusApiForKey,
} from '../../services/campusJsonStore'
import { issueLibraryBookApi, returnLibraryBookApi } from '../../services/opsApi'

export const BOOKS_KEY = 'schoolerp-library-books-v1'
export const ISSUES_KEY = 'schoolerp-library-issues-v1'
export const MEMBERS_KEY = 'schoolerp-library-members-v1'

const DEFAULT_BOOKS = [
    {
        id: 'LBK-1001',
        title: 'NCERT Physics Class XI',
        author: 'NCERT',
        isbn: '978-81-7450-567-5',
        category: 'Science',
        copies: 12,
        available: 9,
        status: 'Available',
    },
    {
        id: 'LBK-1002',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '978-0-06-112008-4',
        category: 'Literature',
        copies: 6,
        available: 2,
        status: 'Available',
    },
    {
        id: 'LBK-1003',
        title: 'Indian History — Class X',
        author: 'Bipan Chandra',
        isbn: '978-81-250-1234-5',
        category: 'History',
        copies: 8,
        available: 0,
        status: 'Issued Out',
    },
]

const DEFAULT_ISSUES = [
    {
        id: 'LIS-1001',
        bookId: 'LBK-1001',
        bookTitle: 'NCERT Physics Class XI',
        memberId: 'LMB-2001',
        memberName: 'Aarav Sharma',
        issueDate: '10-10-2026',
        dueDate: '24-10-2026',
        status: 'Issued',
    },
    {
        id: 'LIS-1002',
        bookId: 'LBK-1002',
        bookTitle: 'To Kill a Mockingbird',
        memberId: 'LMB-2002',
        memberName: 'Diya Menon',
        issueDate: '05-10-2026',
        dueDate: '19-10-2026',
        returnDate: '18-10-2026',
        status: 'Returned',
    },
]

const DEFAULT_MEMBERS = [
    {
        id: 'LMB-2001',
        name: 'Aarav Sharma',
        role: 'Student',
        className: '10',
        section: 'A',
        status: 'Active',
        booksIssued: 1,
    },
    {
        id: 'LMB-2002',
        name: 'Diya Menon',
        role: 'Student',
        className: '10',
        section: 'A',
        status: 'Active',
        booksIssued: 0,
    },
    {
        id: 'LMB-2003',
        name: 'Priya Nair',
        role: 'Teacher',
        className: '',
        section: '',
        status: 'Active',
        booksIssued: 2,
    },
]

const seedFor = (key, demo) => (usesCampusApiForKey(key) ? [] : demo)

export const getLibraryBooks = () => ensureCampusSeed(BOOKS_KEY, seedFor(BOOKS_KEY, DEFAULT_BOOKS))
export const saveLibraryBooks = (rows) => saveCampusJson(BOOKS_KEY, rows)
export const getLibraryIssues = () => ensureCampusSeed(ISSUES_KEY, seedFor(ISSUES_KEY, DEFAULT_ISSUES))
export const saveLibraryIssues = (rows) => saveCampusJson(ISSUES_KEY, rows)
export const getLibraryMembers = () => ensureCampusSeed(MEMBERS_KEY, seedFor(MEMBERS_KEY, DEFAULT_MEMBERS))
export const saveLibraryMembers = (rows) => saveCampusJson(MEMBERS_KEY, rows)

export const hydrateLibraryFromApi = async () => {
    if (!usesCampusApiForKey(BOOKS_KEY)) return false
    await Promise.all([
        hydrateCampusKey(BOOKS_KEY, []),
        hydrateCampusKey(ISSUES_KEY, []),
        hydrateCampusKey(MEMBERS_KEY, []),
    ])
    return true
}

/** Re-read all three collections after a server-side issue/return so books, members and loans agree. */
const refreshLibraryFromApi = () => hydrateLibraryFromApi()

const borrowLimitForRole = (role) => {
    const value = String(role || '').toLowerCase()
    if (value.includes('student')) return 1
    return 5 // Staff / Teacher
}

export const issueLibraryBook = async ({ bookId, memberId, memberName, memberRole, issueDate, dueDate, clientRequestId }) => {
    if (usesCampusApiForKey(ISSUES_KEY)) {
        try {
            const issue = await issueLibraryBookApi({ bookId, memberId, issueDate, dueDate, clientRequestId })
            await refreshLibraryFromApi()
            return { success: true, issue }
        } catch (error) {
            return { success: false, message: error?.message || 'The issue could not be saved.' }
        }
    }
    const books = getLibraryBooks()
    const book = books.find((row) => row.id === bookId)
    if (!book) return { success: false, message: 'Choose a book from the catalogue.' }
    if (Number(book.available) <= 0) return { success: false, message: 'No copies are available to issue.' }
    const members = getLibraryMembers()
    const memberRow = members.find((row) => row.id === memberId)
        || members.find((row) => String(row.name || '').toLowerCase() === String(memberName || '').trim().toLowerCase())
    const member = String(memberRow?.name || memberName || '').trim()
    if (!member) return { success: false, message: 'Select a library member.' }
    const role = memberRow?.role || memberRole || 'Student'
    const openCount = getLibraryIssues().filter(
        (row) => row.status === 'Issued' && (
            (memberRow && row.memberId === memberRow.id)
            || String(row.memberName || '').toLowerCase() === member.toLowerCase()
        ),
    ).length
    const limit = borrowLimitForRole(role)
    if (openCount >= limit) {
        return {
            success: false,
            message: `${role} borrowing limit is ${limit}. ${member} already has ${openCount} open loan(s).`,
        }
    }
    const issue = {
        id: `LIS-${Date.now()}`,
        bookId: book.id,
        bookTitle: book.title,
        memberId: memberRow?.id || '',
        memberName: member,
        memberRole: role,
        issueDate: issueDate || '',
        dueDate: dueDate || '',
        status: 'Issued',
    }
    const nextBooks = books.map((row) => {
        if (row.id !== book.id) return row
        const available = Math.max(0, Number(row.available || 0) - 1)
        return { ...row, available, status: available > 0 ? 'Available' : 'Issued Out' }
    })
    const nextMembers = members.map((row) => (
        row.id === memberRow?.id
            ? { ...row, booksIssued: Number(row.booksIssued || 0) + 1 }
            : row
    ))
    saveLibraryBooks(nextBooks)
    if (memberRow) saveLibraryMembers(nextMembers)
    saveLibraryIssues([issue, ...getLibraryIssues()])
    return { success: true, issue }
}

export const returnLibraryBook = async (issueId) => {
    if (usesCampusApiForKey(ISSUES_KEY)) {
        try {
            await returnLibraryBookApi(issueId)
            await refreshLibraryFromApi()
            return { success: true }
        } catch (error) {
            return { success: false, message: error?.message || 'The return could not be saved.' }
        }
    }
    const issues = getLibraryIssues()
    const issue = issues.find((row) => row.id === issueId)
    if (!issue || issue.status === 'Returned') return { success: false, message: 'That issue is already closed.' }
    const nextIssues = issues.map((row) => (
        row.id === issueId ? { ...row, status: 'Returned', returnDate: new Date().toISOString().slice(0, 10) } : row
    ))
    const nextBooks = getLibraryBooks().map((row) => {
        if (row.id !== issue.bookId) return row
        const available = Number(row.available || 0) + 1
        const copies = Math.max(Number(row.copies || 0), available)
        return { ...row, available, copies, status: 'Available' }
    })
    saveLibraryIssues(nextIssues)
    saveLibraryBooks(nextBooks)
    return { success: true }
}

export const statusBadgeColor = {
    Available: 'bg-[#4CAF5033] text-[#4CAF50]',
    'Issued Out': 'bg-[#FF980033] text-[#FF9800]',
    Issued: 'bg-[#2196F333] text-[#2196F3]',
    Returned: 'bg-[#4CAF5033] text-[#4CAF50]',
    Overdue: 'bg-[#FF000033] text-[#FF0000]',
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    Inactive: 'bg-[#66708533] text-[#667085]',
}

// keep load helper available for diagnostics
export const peekLibraryBooks = () => loadCampusJson(BOOKS_KEY, DEFAULT_BOOKS)
