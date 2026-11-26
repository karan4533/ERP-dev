import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import {
  getCatalogBooks,
  saveCatalogBooks,
  getIssuedBooks,
  saveIssuedBooks,
  issueBookToMember,
  returnBookIssue,
  submitBookRequest,
} from '../../../src/Pages/Librarian/libraryData.js';

test('F06-T2-01: issueBookToMember rejects checkout when availableCopies is zero', () => {
  globalThis.localStorage.clear();
  const catalog = getCatalogBooks();
  // Set availableCopies of first book to 0
  const zeroStockBook = { ...catalog[0], availableCopies: 0 };
  const updatedCatalog = [zeroStockBook, ...catalog.slice(1)];
  saveCatalogBooks(updatedCatalog);

  const res = issueBookToMember({
    bookId: zeroStockBook.id,
    memberId: 'STU-2024-1156', // Rohan Verma has 0 borrowed books
  });

  assert.equal(res.success, false);
  assert.match(res.message, /No copies currently available/i);
});

test('F06-T2-02: issueBookToMember rejects checkout when student exceeds limit of 1 book', () => {
  globalThis.localStorage.clear();
  // In seed data, Diya Nair (STU-2024-1087) already has 1 book borrowed (ISS-202)
  const catalog = getCatalogBooks();
  const availableBook = catalog.find((b) => b.availableCopies > 0);
  assert.ok(availableBook);

  const res = issueBookToMember({
    bookId: availableBook.id,
    memberId: 'STU-2024-1087',
  });

  assert.equal(res.success, false);
  assert.match(res.message, /Borrowing limit exceeded/i);
});

test('F06-T2-03: issueBookToMember rejects checkout for non-existent book ID', () => {
  const res = issueBookToMember({
    bookId: 'BK-NONEXISTENT-999',
    memberId: 'STU-2024-1042',
  });

  assert.equal(res.success, false);
  assert.match(res.message, /not found in catalog/i);
});

test('F06-T2-04: issueBookToMember rejects checkout for non-existent member ID', () => {
  const catalog = getCatalogBooks();
  const res = issueBookToMember({
    bookId: catalog[0].id,
    memberId: 'MEM-INVALID-000',
  });

  assert.equal(res.success, false);
  assert.match(res.message, /member was not found/i);
});

test('F06-T2-05: returnBookIssue returns error message when issue ID does not exist', () => {
  const res = returnBookIssue({
    issueId: 'ISS-DOES-NOT-EXIST',
  });

  assert.equal(res.success, false);
  assert.match(res.message, /record not found/i);
});

test('F06-T2-06: submitBookRequest provides fallbacks when optional fields (isbn, reason) are empty', () => {
  const res = submitBookRequest({
    title: 'Advanced Robotics Workshop Manual',
    author: 'Robotics Club',
  });

  assert.equal(res.success, true);
  assert.ok(res.request.id);
  assert.equal(res.request.isbn, '—');
  assert.equal(res.request.status, 'Pending Review');
});
