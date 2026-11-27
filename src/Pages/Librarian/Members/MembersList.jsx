import React, { useEffect, useState } from 'react'
import {
    getLibraryMembers,
    hydrateLibraryFromApi,
    statusBadgeColor,
} from '../libraryData'

const MembersList = () => {
    const [rows, setRows] = useState(() => getLibraryMembers())

    useEffect(() => {
        hydrateLibraryFromApi().finally(() => setRows(getLibraryMembers()))
    }, [])

    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold'>Library Members</h2>
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <p className='text-sm text-[#515DEF] mb-3'>Total Records: {rows.length}</p>
                <table className='w-full text-sm'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>
                            {['Member ID', 'Name', 'Role', 'Class', 'Section', 'Books Issued', 'Status'].map((label) => (
                                <th key={label} className='px-2 py-3 text-left'>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>{row.id}</td>
                                <td className='px-2 py-3'>{row.name}</td>
                                <td className='px-2 py-3'>{row.role}</td>
                                <td className='px-2 py-3'>{row.className || '—'}</td>
                                <td className='px-2 py-3'>{row.section || '—'}</td>
                                <td className='px-2 py-3'>{row.booksIssued}</td>
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
        </section>
    )
}

export default MembersList
