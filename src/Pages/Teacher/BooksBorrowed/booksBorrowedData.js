import {
    getLibraryBooks,
    getLibraryIssues,
    getLibraryMembers,
    hydrateLibraryFromApi,
} from '../../Librarian/libraryData'
import { usesCampusApiForKey } from '../../../services/campusJsonStore'

export const BOOK_STATUSES = ['Borrowed', 'Overdue', 'Returned', 'Issued']

export const statusBadgeColor = {
    Borrowed: 'bg-[#FF980033] text-[#FF9800]',
    Issued: 'bg-[#FF980033] text-[#FF9800]',
    Overdue: 'bg-[#FF000033] text-[#FF0000]',
    Returned: 'bg-[#4CAF5033] text-[#4CAF50]',
}

const parseLooseDate = (value) => {
    const text = String(value || '').trim()
    const dmy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(text)
    if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
    const direct = new Date(text)
    return Number.isNaN(direct.getTime()) ? null : direct
}

const mapIssueStatus = (issue) => {
    const status = String(issue.status || '').trim()
    if (/return/i.test(status)) return 'Returned'
    if (/overdue/i.test(status)) return 'Overdue'
    const due = parseLooseDate(issue.dueDate)
    if (due && due.getTime() < Date.now() && !/return/i.test(status)) return 'Overdue'
    if (/issued|borrow/i.test(status)) return 'Borrowed'
    return status || 'Borrowed'
}

/**
 * Issues for the signed-in teacher only (library member match by name / employeeId / email).
 */
export const getMyBorrowedBooks = ({ name = '', employeeId = '', email = '' } = {}) => {
    const nameKey = String(name || '').trim().toLowerCase()
    const empKey = String(employeeId || '').trim().toLowerCase()
    const emailKey = String(email || '').trim().toLowerCase()
    const members = getLibraryMembers()
    const booksById = new Map(getLibraryBooks().map((book) => [String(book.id), book]))

    const myMemberIds = new Set(
        members
            .filter((member) => {
                const memberName = String(member.name || '').trim().toLowerCase()
                const memberEmail = String(member.email || '').trim().toLowerCase()
                const memberCode = String(member.employeeId || member.staffCode || member.id || '')
                    .trim()
                    .toLowerCase()
                const role = String(member.role || '').toLowerCase()
                if (emailKey && memberEmail && memberEmail === emailKey) return true
                if (empKey && memberCode && (memberCode === empKey || memberCode.includes(empKey))) return true
                if (nameKey && memberName && memberName === nameKey && (!role || role.includes('teacher'))) {
                    return true
                }
                return false
            })
            .map((member) => String(member.id)),
    )

    // Also match issues that stored the teacher name directly on the row.
    return getLibraryIssues()
        .filter((issue) => {
            if (myMemberIds.has(String(issue.memberId))) return true
            const memberName = String(issue.memberName || '').trim().toLowerCase()
            return Boolean(nameKey && memberName && memberName === nameKey)
        })
        .map((issue) => {
            const book = booksById.get(String(issue.bookId)) || {}
            return {
                id: issue.id,
                bookId: issue.bookId || book.id || '—',
                bookName: issue.bookTitle || book.title || '—',
                authorName: book.author || issue.authorName || '—',
                issuedDate: issue.issueDate || '—',
                returnDate: issue.returnDate || issue.dueDate || '—',
                status: mapIssueStatus(issue),
            }
        })
}

export const hydrateMyBorrowedBooks = async () => {
    if (!usesCampusApiForKey('schoolerp-library-issues-v1')) return false
    return hydrateLibraryFromApi()
}

/** @deprecated seed — do not render in API mode */
export const BORROWED_BOOKS_LIST = []
