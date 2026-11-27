import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getLibraryBooks, hydrateLibraryFromApi, saveLibraryBooks } from '../../libraryData'

const inputClass = 'text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 w-full'

const empty = {
    title: '',
    author: '',
    isbn: '',
    category: '',
    copies: '1',
}

const AddBooks = () => {
    const navigate = useNavigate()
    const [form, setForm] = useState(empty)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        hydrateLibraryFromApi()
    }, [])

    const setField = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

    const save = async () => {
        const title = form.title.trim()
        const author = form.author.trim()
        const copies = Number(form.copies)
        if (!title || !author) {
            setError('Title and author are required.')
            return
        }
        if (!Number.isFinite(copies) || copies < 1) {
            setError('Copies must be at least 1.')
            return
        }
        setSaving(true)
        setError('')
        try {
            await hydrateLibraryFromApi()
            const book = {
                id: `LBK-${Date.now()}`,
                title,
                author,
                isbn: form.isbn.trim(),
                category: form.category.trim() || 'General',
                copies,
                available: copies,
                status: 'Available',
            }
            saveLibraryBooks([book, ...getLibraryBooks()])
            toast.success('Book saved.')
            navigate('/librarian/book-management/book-list')
        } catch (err) {
            setError(err?.message || 'The book could not be saved.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-6 space-y-4'>
                <h2 className='text-xl font-semibold text-black'>Add book</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <label className='text-sm text-[#344054]'>Title
                        <input className={inputClass} value={form.title} onChange={setField('title')} />
                    </label>
                    <label className='text-sm text-[#344054]'>Author
                        <input className={inputClass} value={form.author} onChange={setField('author')} />
                    </label>
                    <label className='text-sm text-[#344054]'>ISBN
                        <input className={inputClass} value={form.isbn} onChange={setField('isbn')} />
                    </label>
                    <label className='text-sm text-[#344054]'>Category
                        <input className={inputClass} value={form.category} onChange={setField('category')} placeholder='Science, Literature…' />
                    </label>
                    <label className='text-sm text-[#344054]'>Copies
                        <input className={inputClass} type='number' min='1' value={form.copies} onChange={setField('copies')} />
                    </label>
                </div>
                {error && <p className='text-sm text-red-600' role='alert'>{error}</p>}
            </div>
            <div className='flex justify-end gap-3'>
                <button type='button' onClick={() => navigate('/librarian/book-management/book-list')} className='border border-[#515DEF] text-[#515DEF] px-6 py-2 rounded-md cursor-pointer'>Discard</button>
                <button type='button' disabled={saving} onClick={save} className='bg-[#515DEF] text-white px-6 py-2 rounded-md cursor-pointer disabled:opacity-60'>{saving ? 'Saving…' : 'Save book'}</button>
            </div>
        </section>
    )
}

export default AddBooks
