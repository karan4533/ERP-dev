import React, { useEffect, useMemo, useState } from 'react'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import {
    getLibraryIssues,
    hydrateLibraryFromApi,
    statusBadgeColor,
} from '../../Librarian/libraryData'

const BorrowedBooksList = () => {
    const { activeStudent } = useActiveStudent()
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        hydrateLibraryFromApi()
            .then(() => {
                if (!cancelled) setRows(getLibraryIssues())
            })
            .catch((err) => {
                if (!cancelled) {
                    setRows([])
                    setError(err.message || 'Could not load library issues.')
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [activeStudent?.id])

    const filtered = useMemo(() => {
        const studentHint = String(activeStudent?.name || '').trim().toLowerCase()
        const admissionHint = String(activeStudent?.admissionNumber || '').trim().toLowerCase()
        const query = search.trim().toLowerCase()
        return rows.filter((row) => {
            const member = `${row.memberName || ''} ${row.studentName || ''} ${row.admissionNumber || ''} ${row.memberId || ''}`.toLowerCase()
            const belongs =
                !studentHint
                || member.includes(studentHint)
                || (admissionHint && member.includes(admissionHint))
            if (!belongs) return false
            if (status && String(row.status || '') !== status) return false
            if (query) {
                const hay = `${row.bookTitle || row.title || ''} ${row.accessionNo || row.bookId || ''}`.toLowerCase()
                if (!hay.includes(query)) return false
            }
            return true
        })
    }, [rows, activeStudent, search, status])

    const statuses = useMemo(
        () => [...new Set(rows.map((r) => r.status).filter(Boolean))],
        [rows],
    )

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap gap-4 justify-between items-end'>
                    <button
                        type='button'
                        onClick={() => { setSearch(''); setStatus('') }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 rounded-lg'
                    >
                        Clear Filters
                    </button>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-w-xl'>
                        <input
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Search book…'
                            className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2'
                        />
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2'
                        >
                            <option value=''>All statuses</option>
                            {statuses.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <h2 className='text-xl font-medium text-black mb-4'>Borrowed Books</h2>
                {error && <p className='text-sm text-[#B54708] mb-3'>{error}</p>}
                {loading ? (
                    <p className='text-sm text-[#667085] py-8 text-center'>Loading…</p>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-[#EDEEF5]'>
                                <tr>
                                    <th className='px-2 py-3'>Book</th>
                                    <th className='px-2 py-3'>Issue date</th>
                                    <th className='px-2 py-3'>Due date</th>
                                    <th className='px-2 py-3'>Return date</th>
                                    <th className='px-2 py-3'>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className='px-2 py-10 text-center text-[#667085]'>
                                            No borrowed books on record for this student.
                                        </td>
                                    </tr>
                                )}
                                {filtered.map((row) => (
                                    <tr key={row.id || `${row.bookId}-${row.issueDate}`} className='border-b border-[#f2f4f7]'>
                                        <td className='px-2 py-4'>{row.bookTitle || row.title || row.bookId || '—'}</td>
                                        <td className='px-2 py-4'>{row.issueDate || '—'}</td>
                                        <td className='px-2 py-4'>{row.dueDate || '—'}</td>
                                        <td className='px-2 py-4'>{row.returnDate || '—'}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[row.status] || 'bg-[#EDEEF5] text-[#667085]'}`}>
                                                {row.status || '—'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    )
}

export default BorrowedBooksList
