import React, { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { Download, Trash2, Upload } from 'lucide-react'
import { deleteFileApi, fileDownloadUrl, listFilesApi, uploadLibraryFileApi } from '../../../services/filesApi'
import { canShowDeleteOption } from '../../../Common/CommonComponents/approvalGates'
import { useAuth } from '../../../context/AuthContext'

const KINDS = [
    { id: '', label: 'All files' },
    { id: 'library', label: 'Uploaded here' },
    { id: 'module', label: 'From other modules' },
]

const formatSize = (bytes) => {
    const value = Number(bytes) || 0
    if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
    if (value >= 1024) return `${Math.round(value / 1024)} KB`
    return `${value} B`
}

const formatDate = (iso) => {
    const date = new Date(iso)
    return Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Campus file library for Admin/Super Admin (users.write) and File Room (documents.library.*).
 * Files uploaded here (PDF, JPG, PNG up to 10 MB) can be deleted; module-owned files are listed
 * read-only and must be removed in their own module.
 */
const FileManagement = () => {
    const { role } = useAuth() || {}
    const showDelete = canShowDeleteOption(role)
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [kind, setKind] = useState('')
    const [busyId, setBusyId] = useState('')
    const inputRef = useRef(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            setRows(await listFilesApi({ search, kind }))
        } catch (error) {
            toast.error(error?.message || 'Could not load files.')
            setRows([])
        } finally {
            setLoading(false)
        }
    }, [search, kind])

    useEffect(() => {
        const timer = setTimeout(load, 250)
        return () => clearTimeout(timer)
    }, [load])

    const upload = async (event) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        setBusyId('upload')
        try {
            await uploadLibraryFileApi(file)
            toast.success(`${file.name} uploaded.`)
            await load()
        } catch (error) {
            toast.error(error?.message || 'Upload failed. Only PDF, JPG or PNG files are accepted.')
        } finally {
            setBusyId('')
        }
    }

    const remove = async (row) => {
        if (!showDelete) return
        if (!window.confirm(`Delete ${row.original_name}? This cannot be undone.`)) return
        setBusyId(row.id)
        try {
            await deleteFileApi(row.id)
            toast.success('File deleted.')
            setRows((current) => current.filter((item) => item.id !== row.id))
        } catch (error) {
            toast.error(error?.message || 'Could not delete the file.')
        } finally {
            setBusyId('')
        }
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap items-start justify-between gap-4'>
                    <div>
                        <h2 className='text-xl font-semibold text-[#0C1E5B]'>File Management</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Upload school files (PDF, JPG or PNG, up to 10 MB). Files that belong to documents, announcements,
                            messages or photos are shown here read-only; manage those in their own module.
                        </p>
                    </div>
                    <div>
                        <input ref={inputRef} type='file' accept='.pdf,.png,.jpg,.jpeg' className='hidden' onChange={upload} />
                        <button
                            type='button'
                            onClick={() => inputRef.current?.click()}
                            disabled={busyId === 'upload'}
                            className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer disabled:opacity-50'
                        >
                            <Upload size={16} /> {busyId === 'upload' ? 'Uploading…' : 'Upload file'}
                        </button>
                    </div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='file-search' className='text-sm font-medium text-[#808080]'>Search</label>
                        <input
                            id='file-search'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='File name'
                            className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='file-kind' className='text-sm font-medium text-[#808080]'>Show</label>
                        <select
                            id='file-kind'
                            value={kind}
                            onChange={(event) => setKind(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2'
                        >
                            {KINDS.map((item) => (
                                <option key={item.id} value={item.id}>{item.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5] uppercase text-[#0C1E5B]'>
                        <tr>
                            <th className='px-2 py-3'>File</th>
                            <th className='px-2 py-3'>Type</th>
                            <th className='px-2 py-3'>Size</th>
                            <th className='px-2 py-3'>Used by</th>
                            <th className='px-2 py-3'>Uploaded by</th>
                            <th className='px-2 py-3'>Date</th>
                            <th className='px-2 py-3'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(loading || rows.length === 0) && (
                            <tr>
                                <td colSpan={7} className='px-2 py-8 text-center text-[#667085]'>
                                    {loading ? 'Loading files…' : 'No files found.'}
                                </td>
                            </tr>
                        )}
                        {!loading && rows.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7] text-[#667085]'>
                                <td className='px-2 py-3 text-[#1E1E1E] font-medium break-all'>{row.original_name}</td>
                                <td className='px-2 py-3'>{row.content_type}</td>
                                <td className='px-2 py-3 whitespace-nowrap'>{formatSize(row.size_bytes)}</td>
                                <td className='px-2 py-3'>{row.resource_type === 'library' ? 'File Management' : row.resource_type}</td>
                                <td className='px-2 py-3'>{row.uploaded_by || '—'}</td>
                                <td className='px-2 py-3 whitespace-nowrap'>{formatDate(row.created_at)}</td>
                                <td className='px-2 py-3'>
                                    <div className='flex items-center gap-3'>
                                        <a
                                            href={fileDownloadUrl(row.download_url)}
                                            target='_blank'
                                            rel='noreferrer'
                                            className='inline-flex items-center gap-1 text-[#515DEF] hover:underline'
                                        >
                                            <Download size={14} /> Download
                                        </a>
                                        {row.deletable && showDelete ? (
                                            <button
                                                type='button'
                                                onClick={() => remove(row)}
                                                disabled={busyId === row.id}
                                                className='inline-flex items-center gap-1 text-[#B42318] hover:underline cursor-pointer disabled:opacity-50'
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        ) : row.deletable ? null : (
                                            <span className='text-xs text-[#98A2B3]' title='Managed by another module'>In use</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export default FileManagement
