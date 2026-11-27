import React, { useCallback } from 'react'
import AdminLiveDataList from '../../Components/AdminLiveDataList'
import { getLibraryBooks, hydrateLibraryFromApi } from '../../../Librarian/libraryData'

const COLUMNS = [
    { key: 'id', label: 'Book ID' },
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'author', label: 'Author' },
    { key: 'copies', label: 'Total Copies' },
    { key: 'available', label: 'Available' },
    { key: 'status', label: 'Status' },
]

export default function BookList() {
    const loadRows = useCallback(async () => {
        await hydrateLibraryFromApi()
        return getLibraryBooks()
    }, [])

    return (
        <AdminLiveDataList
            title='Library Book List'
            description='Live library books collection (same source as Librarian portal).'
            columns={COLUMNS}
            loadRows={loadRows}
            searchKeys={['id', 'title', 'author', 'category']}
            addPath='/admin/library-details/add-books'
        />
    )
}
