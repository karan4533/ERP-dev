import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    getLibraryBooks,
    getLibraryIssues,
    getLibraryMembers,
    hydrateLibraryFromApi,
    statusBadgeColor,
} from '../libraryData'

const Stat = ({ label, value, to }) => (
    <Link to={to} className='bg-white rounded-2xl shadow-md p-4 hover:ring-1 hover:ring-[#515DEF]/30 transition'>
        <p className='text-sm text-[#667085]'>{label}</p>
        <p className='text-2xl font-semibold text-[#0C1E5B] mt-1'>{value}</p>
    </Link>
)

const Dashboard = () => {
    const [tick, setTick] = useState(0)

    useEffect(() => {
        hydrateLibraryFromApi().finally(() => setTick((n) => n + 1))
    }, [])

    const data = useMemo(() => {
        void tick
        const books = getLibraryBooks()
        const issues = getLibraryIssues()
        const members = getLibraryMembers()
        const available = books.reduce((sum, row) => sum + Number(row.available || 0), 0)
        const openIssues = issues.filter((row) => row.status === 'Issued')
        const overdue = openIssues.filter((row) => {
            if (!row.dueDate) return false
            const parts = String(row.dueDate).includes('-') ? String(row.dueDate).split('-') : []
            if (parts.length === 3 && parts[0].length === 2) {
                const due = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
                return due < new Date(new Date().toDateString())
            }
            return false
        })
        return {
            books: books.length,
            available,
            members: members.length,
            openIssues: openIssues.length,
            overdue: overdue.length,
            recentIssues: issues.slice(0, 5),
            lowStock: books.filter((row) => Number(row.available || 0) === 0).slice(0, 5),
        }
    }, [tick])

    return (
        <section className='space-y-6'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>Librarian Dashboard</h1>
                <p className='text-sm text-[#667085] mt-1'>Live catalogue, issues and member totals from campus library store.</p>
            </div>
            <div className='grid grid-cols-2 lg:grid-cols-5 gap-4'>
                <Stat label='Titles' value={data.books} to='/librarian/book-management/book-list' />
                <Stat label='Copies available' value={data.available} to='/librarian/book-management/book-list' />
                <Stat label='Members' value={data.members} to='/librarian/members/member-list' />
                <Stat label='Open issues' value={data.openIssues} to='/librarian/issued-books/issued-book-list' />
                <Stat label='Overdue' value={data.overdue} to='/librarian/issued-books/issued-book-list' />
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <div className='flex justify-between items-center mb-3'>
                        <h2 className='text-lg font-medium'>Recent issues</h2>
                        <Link to='/librarian/issued-books/add-issued-book' className='text-sm text-[#515DEF]'>Issue book</Link>
                    </div>
                    <ul className='text-sm space-y-2 text-[#667085]'>
                        {data.recentIssues.length === 0 && <li>No issues recorded yet.</li>}
                        {data.recentIssues.map((row) => (
                            <li key={row.id} className='flex justify-between gap-2 border-b border-[#f2f4f7] pb-2'>
                                <span className='truncate'>{row.bookTitle} · {row.memberName || row.memberId}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusBadgeColor[row.status] || ''}`}>{row.status}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <div className='flex justify-between items-center mb-3'>
                        <h2 className='text-lg font-medium'>Fully issued titles</h2>
                        <Link to='/librarian/book-requests' className='text-sm text-[#515DEF]'>Book requests</Link>
                    </div>
                    <ul className='text-sm space-y-2 text-[#667085]'>
                        {data.lowStock.length === 0 && <li>All titles have at least one copy available.</li>}
                        {data.lowStock.map((row) => (
                            <li key={row.id}>{row.title} · 0 available / {row.copies} copies</li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    )
}

export default Dashboard
