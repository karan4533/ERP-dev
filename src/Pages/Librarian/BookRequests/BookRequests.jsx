import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import {
    ensureCampusSeed,
    hydrateCampusKey,
    persistCampusJsonItem,
    usesCampusApiForKey,
} from '../../../services/campusJsonStore'
import { filterListRows } from '../../../Common/listFiltering'
import { getLibraryBooks, hydrateLibraryFromApi } from '../libraryData'

export const BOOK_REQUESTS_KEY = 'schoolerp-library-book-requests-v1'

const BookRequests = () => {
    const [rows, setRows] = useState([])
    const [books, setBooks] = useState([])
    const [bookId, setBookId] = useState('')
    const [requesterName, setRequesterName] = useState('')
    const [requesterRole, setRequesterRole] = useState('Student')
    const [notes, setNotes] = useState('')
    const [search, setSearch] = useState('')
    const [saving, setSaving] = useState(false)

    const refresh = () => setRows(ensureCampusSeed(BOOK_REQUESTS_KEY, []))

    useEffect(() => {
        let active = true
        Promise.all([
            hydrateLibraryFromApi(),
            usesCampusApiForKey(BOOK_REQUESTS_KEY)
                ? hydrateCampusKey(BOOK_REQUESTS_KEY, [])
                : Promise.resolve(false),
        ]).finally(() => {
            if (!active) return
            setBooks(getLibraryBooks())
            refresh()
        })
        return () => { active = false }
    }, [])

    const filtered = useMemo(
        () => filterListRows(rows, {
            search,
            searchKeys: ['id', 'bookTitle', 'requesterName', 'status'],
        }),
        [rows, search],
    )

    const submit = async (event) => {
        event.preventDefault()
        const book = books.find((row) => row.id === bookId)
        if (!book) {
            toast.error('Select a book from the catalogue.')
            return
        }
        if (!requesterName.trim()) {
            toast.error('Requester name is required.')
            return
        }
        setSaving(true)
        try {
            const record = {
                id: `LBR-${Date.now()}`,
                bookId: book.id,
                bookTitle: book.title,
                requesterName: requesterName.trim(),
                requesterRole,
                notes: notes.trim(),
                status: Number(book.available) > 0 ? 'Queued' : 'Waitlisted',
                requestedAt: new Date().toISOString(),
            }
            const result = await persistCampusJsonItem(BOOK_REQUESTS_KEY, record)
            if (result?.success === false) {
                // Keep the form filled so the librarian can retry; nothing is saved in the browser.
                toast.error(result.message || 'Could not save book request.')
                return
            }
            refresh()
            setBookId('')
            setRequesterName('')
            setNotes('')
            toast.success('Book request recorded.')
        } finally {
            setSaving(false)
        }
    }

    const decide = async (row, status) => {
        const next = { ...row, status, decidedAt: new Date().toISOString() }
        const result = await persistCampusJsonItem(BOOK_REQUESTS_KEY, next)
        if (result?.success === false) {
            toast.error(result.message || 'Could not update request.')
            return
        }
        refresh()
        toast.success(`Request marked ${status}.`)
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-xl font-semibold text-black'>Request Book</h1>
                <p className='text-sm text-[#667085] mt-1'>Queue or waitlist a catalogue title. Staff may hold up to 5 open loans; students 1.</p>
                <form onSubmit={submit} className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-4'>
                    <select value={bookId} onChange={(event) => setBookId(event.target.value)} className='border rounded-md px-2 py-2 text-sm' required>
                        <option value=''>Select book</option>
                        {books.map((book) => (
                            <option key={book.id} value={book.id}>
                                {book.title} ({book.available} available)
                            </option>
                        ))}
                    </select>
                    <input value={requesterName} onChange={(event) => setRequesterName(event.target.value)} placeholder='Requester name' className='border rounded-md px-2 py-2 text-sm' required />
                    <select value={requesterRole} onChange={(event) => setRequesterRole(event.target.value)} className='border rounded-md px-2 py-2 text-sm'>
                        <option>Student</option>
                        <option>Staff</option>
                        <option>Teacher</option>
                    </select>
                    <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder='Notes (optional)' className='border rounded-md px-2 py-2 text-sm' />
                    <button type='submit' disabled={saving} className='bg-[#515DEF] text-white rounded-md text-sm px-4 py-2 cursor-pointer disabled:opacity-50 md:col-span-2'>
                        {saving ? 'Saving…' : 'Submit request'}
                    </button>
                </form>
                <label className='flex flex-col gap-1 text-sm text-[#808080] mt-4 max-w-md'>
                    Search
                    <input value={search} onChange={(event) => setSearch(event.target.value)} className='border rounded-md px-2 py-2 text-sm' />
                </label>
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>
                            {['ID', 'Book', 'Requester', 'Role', 'Status', 'Action'].map((label) => (
                                <th key={label} className='px-2 py-3 text-left text-[#0C1E5B]'>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr><td colSpan={6} className='px-2 py-6 text-center text-[#667085]'>No book requests yet.</td></tr>
                        )}
                        {filtered.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>{row.id}</td>
                                <td className='px-2 py-3'>{row.bookTitle}</td>
                                <td className='px-2 py-3'>{row.requesterName}</td>
                                <td className='px-2 py-3'>{row.requesterRole}</td>
                                <td className='px-2 py-3'>{row.status}</td>
                                <td className='px-2 py-3'>
                                    {['Queued', 'Waitlisted'].includes(row.status) && (
                                        <div className='flex gap-2'>
                                            <button type='button' onClick={() => decide(row, 'Fulfilled')} className='text-[#4CAF50] text-xs cursor-pointer'>Fulfill</button>
                                            <button type='button' onClick={() => decide(row, 'Cancelled')} className='text-[#FF0000] text-xs cursor-pointer'>Cancel</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export default BookRequests
