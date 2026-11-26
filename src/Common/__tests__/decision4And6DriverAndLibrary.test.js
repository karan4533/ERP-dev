import test from 'node:test'
import assert from 'node:assert/strict'

// Mock localStorage for Node test environment
if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map()
    globalThis.localStorage = {
        getItem: (key) => store.get(key) || null,
        setItem: (key, val) => store.set(key, String(val)),
        removeItem: (key) => store.delete(key),
        clear: () => store.clear(),
    }
}

import { ROUTE_DETAILS } from '../../Pages/Driver/MyRoute/routeDetailsData.js'
import { VEHICLE_DETAILS } from '../../Pages/Driver/VehicleManagement/vehicleDetailsData.js'
import { DEFAULT_DRIVER } from '../../Pages/Driver/FuelRequest/fuelRequestData.js'
import {
    BORROWING_RULES,
    CATALOG_BOOKS,
    REGISTERED_MEMBERS,
    getCatalogBooks,
    getIssuedBooks,
    saveIssuedBooks,
    saveCatalogBooks,
    issueBookToMember,
    returnBookIssue
} from '../../Pages/Librarian/libraryData.js'

test('Decision 4: Driver Vehicle & Route alignment with Route 5 and TN-09-AB-4521', () => {
    assert.equal(ROUTE_DETAILS.routeName, 'Route 5 — North Campus')
    assert.equal(ROUTE_DETAILS.vehicleNumber, 'TN-09-AB-4521')
    assert.equal(ROUTE_DETAILS.routeId, 'RT-1001')

    assert.equal(VEHICLE_DETAILS.vehicleNumber, 'TN-09-AB-4521')
    assert.equal(VEHICLE_DETAILS.assignedDriver, 'Sandy Selva')
    assert.equal(VEHICLE_DETAILS.assignedRoute, 'Route 5 — North Campus')

    assert.equal(DEFAULT_DRIVER.vehicleNumber, 'TN-09-AB-4521')
    assert.equal(DEFAULT_DRIVER.driverName, 'Sandy Selva')
    assert.equal(DEFAULT_DRIVER.assignedRoute, 'Route 5 — North Campus')
})

test('Decision 6: Library Borrowing Rules strictly enforce 1 book for Student and 5 books for Staff (Decision 10)', () => {
    assert.equal(BORROWING_RULES.Student.maxBooks, 1, 'Students can only borrow up to 1 book')
    assert.equal(BORROWING_RULES.Student.loanPeriodDays, 14, 'Student loan period is 14 days')
    assert.equal(BORROWING_RULES.Student.finePerDay, 5, 'Student overdue fine is ₹5/day')

    assert.equal(BORROWING_RULES.Staff.maxBooks, 5, 'Staff can borrow up to 5 books')
    assert.equal(BORROWING_RULES.Staff.loanPeriodDays, 30, 'Staff loan period is 30 days')
    assert.equal(BORROWING_RULES.Staff.finePerDay, 2, 'Staff overdue fine is ₹2/day')

    assert.equal(BORROWING_RULES.Teacher.maxBooks, 5)
    assert.equal(BORROWING_RULES.Coordinator.maxBooks, 5)
})

test('Decision 6: Issue Book enforces student borrowing limit of 1 and decrements/increments catalog copies', () => {
    localStorage.clear()

    // Setup fresh catalog
    const testCatalog = [
        {
            id: 'BK-TEST-1',
            title: 'Test Physics Volume',
            author: 'Test Author',
            totalCopies: 5,
            availableCopies: 5,
            price: 300
        }
    ]
    saveCatalogBooks(testCatalog)

    // Aarav Sharma (Student) has 0 active issues initially
    const studentMember = REGISTERED_MEMBERS.find((m) => m.name === 'Aarav Sharma')
    assert.ok(studentMember, 'Student member found')

    // Empty initial issued list
    saveIssuedBooks([])

    // 1. Issue first book to student - should succeed
    const firstIssueResult = issueBookToMember({
        bookId: 'BK-TEST-1',
        memberId: studentMember.id,
        returnDate: '25-04-2026'
    })
    assert.equal(firstIssueResult.success, true, 'First issue for student should succeed')

    // Catalog available copies should now be 4
    const catalogAfterFirst = getCatalogBooks()
    const bookAfterFirst = catalogAfterFirst.find((b) => b.id === 'BK-TEST-1')
    assert.equal(bookAfterFirst.availableCopies, 4, 'Available copies must decrement from 5 to 4')

    // 2. Issue second book to student - must FAIL because student limit is 1
    const secondIssueResult = issueBookToMember({
        bookId: 'BK-TEST-1',
        memberId: studentMember.id,
        returnDate: '25-04-2026'
    })
    assert.equal(secondIssueResult.success, false, 'Second issue for student must fail')
    assert.match(secondIssueResult.message, /Borrowing limit exceeded/, 'Must cite borrowing limit')

    // 3. Return the first book - should restore catalog copies
    const issuedList = getIssuedBooks()
    const activeIssue = issuedList.find((i) => i.memberId === studentMember.id && i.status !== 'Returned')
    assert.ok(activeIssue, 'Active issue found')

    const returnResult = returnBookIssue({ issueId: activeIssue.id, returnComment: 'Returned in test' })
    assert.equal(returnResult.success, true, 'Return should succeed')

    const catalogAfterReturn = getCatalogBooks()
    const bookAfterReturn = catalogAfterReturn.find((b) => b.id === 'BK-TEST-1')
    assert.equal(bookAfterReturn.availableCopies, 5, 'Available copies must restore to 5 upon return')

    // 4. Now that the book is returned, student can borrow again
    const reIssueResult = issueBookToMember({
        bookId: 'BK-TEST-1',
        memberId: studentMember.id,
        returnDate: '30-04-2026'
    })
    assert.equal(reIssueResult.success, true, 'Student can borrow again once previous loan is returned')
})
