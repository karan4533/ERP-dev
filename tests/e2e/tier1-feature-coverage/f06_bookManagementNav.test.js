import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import '../harness/setup.js';
import {
  getCatalogBooks,
  getIssuedBooks,
  BORROWING_RULES,
  issueBookToMember,
  returnBookIssue,
  CATALOG_BOOKS,
} from '../../../src/Pages/Librarian/libraryData.js';

test('F06-T1-01: Central Stores workspace defines dedicated store tabs without duplicate book management tab', () => {
  const storesWorkspacePath = path.resolve('src/Common/StoresProcurement/StoresProcurementWorkspace.jsx');
  const source = fs.readFileSync(storesWorkspacePath, 'utf-8');

  // Verify that availableTabs in Stores does not contain book-management or catalog
  assert.equal(
    source.includes("id: 'book-management'"),
    false,
    'Central stores must not declare a book-management tab'
  );
  assert.equal(
    source.includes("label: 'Book Management'"),
    false,
    'Central stores must not have Book Management tab label'
  );
  assert.ok(source.includes("id: 'inventory'"), 'Stores inventory tab must be present');
  assert.ok(source.includes("id: 'requisitions'"), 'Stores requisitions tab must be present');
  assert.ok(source.includes("id: 'purchase-orders'"), 'Stores purchase-orders tab must be present');
});

test('F06-T1-02: Library data service supplies complete catalog books with shelf coordinates and copies', () => {
  const catalog = getCatalogBooks();
  assert.ok(Array.isArray(catalog), 'Catalog books must be an array');
  assert.ok(catalog.length >= 6, 'Seed catalog should have multiple books');

  const firstBook = catalog[0];
  assert.ok(firstBook.id, 'Book must have id');
  assert.ok(firstBook.title, 'Book must have title');
  assert.ok(firstBook.author, 'Book must have author');
  assert.ok(firstBook.isbn, 'Book must have isbn');
  assert.ok(firstBook.shelf, 'Book must have shelf location');
  assert.ok(typeof firstBook.availableCopies === 'number', 'Book must have availableCopies number');
  assert.ok(typeof firstBook.totalCopies === 'number', 'Book must have totalCopies number');
});

test('F06-T1-03: Library borrowing rules enforce role-based limits', () => {
  assert.deepEqual(BORROWING_RULES.Student, { maxBooks: 1, loanPeriodDays: 14, finePerDay: 5 });
  assert.deepEqual(BORROWING_RULES.Staff, { maxBooks: 5, loanPeriodDays: 30, finePerDay: 2 });
  assert.deepEqual(BORROWING_RULES.Teacher, { maxBooks: 5, loanPeriodDays: 30, finePerDay: 2 });
});

test('F06-T1-04: issueBookToMember decrements availableCopies in catalog and creates active loan record', () => {
  globalThis.localStorage.clear();
  const initialCatalog = getCatalogBooks();
  const targetBook = initialCatalog.find((b) => b.availableCopies > 0);
  assert.ok(targetBook, 'Must have at least one book with stock');
  const initialCopies = targetBook.availableCopies;

  const issueRes = issueBookToMember({
    bookId: targetBook.id,
    memberId: 'STU-2024-1042',
  });

  assert.equal(issueRes.success, true);
  assert.ok(issueRes.issue, 'Issue record must be returned');
  assert.equal(issueRes.issue.bookId, targetBook.id);
  assert.equal(issueRes.issue.status, 'Issued');

  const updatedCatalog = getCatalogBooks();
  const updatedBook = updatedCatalog.find((b) => b.id === targetBook.id);
  assert.equal(updatedBook.availableCopies, initialCopies - 1, 'availableCopies must be decremented');
});

test('F06-T1-05: returnBookIssue marks issue returned and restocks book availableCopies', () => {
  const issues = getIssuedBooks();
  const activeIssue = issues.find((i) => i.status === 'Issued');
  assert.ok(activeIssue, 'Must find an active issued book to test return');

  const catalogBefore = getCatalogBooks();
  const bookBefore = catalogBefore.find((b) => b.id === activeIssue.bookId);
  const copiesBefore = bookBefore ? bookBefore.availableCopies : 0;

  const returnRes = returnBookIssue({
    issueId: activeIssue.id,
    returnComment: 'Book returned in good condition',
  });

  assert.equal(returnRes.success, true);
  const updatedIssues = getIssuedBooks();
  const returnedRecord = updatedIssues.find((i) => i.id === activeIssue.id);
  assert.ok(returnedRecord);
  assert.equal(returnedRecord.status, 'Returned');

  const catalogAfter = getCatalogBooks();
  const bookAfter = catalogAfter.find((b) => b.id === activeIssue.bookId);
  if (bookAfter) {
    assert.equal(bookAfter.availableCopies, copiesBefore + 1, 'availableCopies must increment upon return');
  }
});
