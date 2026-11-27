import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Plus, Download } from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import { filterListRows } from '../../../../Common/listFiltering'
import {
    getLibraryBooks,
    hydrateLibraryFromApi,
    saveLibraryBooks,
    statusBadgeColor,
} from '../../libraryData'

const BookList = () => {
    const [rows, setRows] = useState(() => getLibraryBooks())
    const [exportModal, setExportModal] = useState(false)
    const [search, setSearch] = useState('')

    useEffect(() => {
        hydrateLibraryFromApi().finally(() => setRows(getLibraryBooks()))
    }, [])

    const filtered = filterListRows(rows, {
        search,
        searchKeys: ['title', 'author', 'isbn', 'category', 'id'],
    })

    const seedIfEmpty = () => {
        if (rows.length) return
        const next = getLibraryBooks()
        saveLibraryBooks(next)
        setRows(next)
    }

    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center flex-col md:flex-row gap-3'>
                    <h2 className='text-xl font-semibold'>Book List</h2>
                    <div className='flex gap-2'>
                        <NavLink
                            to='/librarian/book-management/add-books'
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md inline-flex items-center gap-2'
                        >
                            <Plus size={16} /> Add Book
                        </NavLink>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md inline-flex items-center gap-2'
                        >
                            <Download size={16} /> Export
                        </button>
                    </div>
                </div>
                <div className='mt-4'>
                    <label className='text-sm text-[#808080]'>Search</label>
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onFocus={seedIfEmpty}
                        className='mt-1 text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-md'
                        placeholder='Title, author, ISBN…'
                    />
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <p className='text-sm text-[#515DEF] mb-3'>Total Records: {filtered.length}</p>
                <table className='w-full text-sm'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>
                            {['Book ID', 'Title', 'Author', 'Category', 'Copies', 'Available', 'Status'].map((label) => (
                                <th key={label} className='px-2 py-3 text-left'>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>{row.id}</td>
                                <td className='px-2 py-3'>{row.title}</td>
                                <td className='px-2 py-3'>{row.author}</td>
                                <td className='px-2 py-3'>{row.category}</td>
                                <td className='px-2 py-3'>{row.copies}</td>
                                <td className='px-2 py-3'>{row.available}</td>
                                <td className='px-2 py-3'>
                                    <span className={`px-2 py-1 rounded text-xs ${statusBadgeColor[row.status] || ''}`}>
                                        {row.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} rows={filtered} filename="library-books" />
        </section>
    )
}

export default BookList
