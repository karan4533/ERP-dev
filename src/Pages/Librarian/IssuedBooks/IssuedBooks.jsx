import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import {
    getLibraryIssues,
    hydrateLibraryFromApi,
    returnLibraryBook,
    statusBadgeColor,
} from '../libraryData'

const IssuedBooks = ({ addPath = '/librarian/issued-books/add-issue-book' }) => {
    const [rows, setRows] = useState(() => getLibraryIssues())

    useEffect(() => {
        hydrateLibraryFromApi().finally(() => setRows(getLibraryIssues()))
    }, [])

    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-4 flex justify-between items-center flex-col sm:flex-row gap-3'>
                <h2 className='text-xl font-semibold'>Issued Books</h2>
                <NavLink
                    to={addPath}
                    className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md inline-flex items-center gap-2'
                >
                    <Plus size={16} /> Issue Book
                </NavLink>
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <p className='text-sm text-[#515DEF] mb-3'>Total Records: {rows.length}</p>
                <table className='w-full text-sm'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>
                            {['Issue ID', 'Book', 'Member', 'Issue Date', 'Due Date', 'Status', ''].map((label) => (
                                <th key={label} className='px-2 py-3 text-left'>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>{row.id}</td>
                                <td className='px-2 py-3'>{row.bookTitle}</td>
                                <td className='px-2 py-3'>{row.memberName}</td>
                                <td className='px-2 py-3'>{row.issueDate}</td>
                                <td className='px-2 py-3'>{row.dueDate}</td>
                                <td className='px-2 py-3'>
                                    <span className={`px-2 py-1 rounded text-xs ${statusBadgeColor[row.status] || ''}`}>
                                        {row.status}
                                    </span>
                                </td>
                                <td className='px-2 py-3'>
                                    {row.status !== 'Returned' && (
                                        <button
                                            type='button'
                                            className='text-[#515DEF] text-sm cursor-pointer'
                                            onClick={async () => {
                                                const result = await returnLibraryBook(row.id)
                                                if (!result.success) {
                                                    toast.error(result.message)
                                                    return
                                                }
                                                toast.success('Book returned.')
                                                setRows(getLibraryIssues())
                                            }}
                                        >
                                            Return
                                        </button>
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

export default IssuedBooks
