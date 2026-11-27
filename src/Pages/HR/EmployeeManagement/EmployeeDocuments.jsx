import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { getDocuments, getEmployees, nextId, saveDocuments } from '../domain/hrStore'
import { hrFileDownloadUrl, uploadHrFile } from '../../../services/hrApi'
import { Badge, HrExport, Modal, PageIntro, PrimaryButton, SearchBox, Select, TableWrap, inputClass, td, th, useFilters, useHrTick, matches } from '../components/HrUi'

const empty = { employeeId: '', type: 'ID Proof', name: '', files: [], expiryDate: '', status: 'Pending' }
const DOC_STATUSES = ['Pending', 'Verified', 'Expired']

const EmployeeDocuments = () => {
    const tick = useHrTick()
    const rows = useMemo(() => getDocuments(), [tick])
    const employees = useMemo(() => getEmployees(), [tick])
    const { filters, set } = useFilters({ search: '', status: '' })
    const [form, setForm] = useState(null)
    const [preview, setPreview] = useState('')
    const [exportOpen, setExportOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [busyId, setBusyId] = useState('')
    const filtered = rows.filter((row) => (!filters.status || row.status === filters.status) && matches(`${row.name} ${row.fileName} ${row.employeeId}`, filters.search))

    const onFile = (event) => {
        const selected = [...(event.target.files || [])].map((file) => ({
            file,
            fileName: file.name,
            fileSize: `${Math.ceil(file.size / 1024)} KB`,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        }))
        if (!selected.length) return
        setPreview(selected.find((item) => item.preview)?.preview || '')
        setForm((current) => ({ ...current, files: [...(current.files || []), ...selected], name: current.name || selected[0].fileName }))
    }

    const setDocumentStatus = (documentId, status) => {
        if (busyId) return
        const current = getDocuments()
        const target = current.find((row) => row.id === documentId)
        if (!target) return toast.error('Document not found.')
        if (target.status === status) return
        setBusyId(documentId)
        try {
            const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
            saveDocuments(
                current.map((row) =>
                    row.id === documentId
                        ? {
                              ...row,
                              status,
                              verifiedBy: status === 'Verified' ? 'HR' : row.verifiedBy || '',
                              verifiedDate: status === 'Verified' ? today : row.verifiedDate || '',
                          }
                        : row,
                ),
            )
            toast.success(
                status === 'Verified'
                    ? 'Document verified.'
                    : status === 'Expired'
                      ? 'Document marked expired.'
                      : 'Document moved back to pending.',
            )
        } catch (error) {
            toast.error(error?.message || 'Could not update document status.')
        } finally {
            setBusyId('')
        }
    }

    const save = async (event) => {
        event.preventDefault()
        const files = form.files || []
        if (!form.employeeId || !form.type || !files.length) return toast.error('Employee, type, and at least one file are required.')
        const employee = employees.find((item) => item.id === form.employeeId)
        if (!employee) return toast.error('Select a valid employee.')
        setSaving(true)
        try {
            const records = []
            for (const [index, item] of files.entries()) {
                let fileId = null
                let downloadUrl = ''
                if (item.file) {
                    try {
                        const uploaded = await uploadHrFile(item.file, 'hr_document', form.employeeId)
                        fileId = uploaded.id
                        downloadUrl = uploaded.download_url
                    } catch {
                        // Keep metadata even when the upload API is offline.
                    }
                }
                const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
                const status = form.status || 'Pending'
                records.push({
                    id: `${nextId('DOC', [...rows, ...records])}-${index + 1}`,
                    uploadedDate: today,
                    uploadedBy: 'HR',
                    employeeId: employee.id,
                    type: form.type,
                    name: form.name,
                    fileName: item.fileName,
                    fileSize: item.fileSize,
                    expiryDate: form.expiryDate,
                    status,
                    verifiedBy: status === 'Verified' ? 'HR' : '',
                    verifiedDate: status === 'Verified' ? today : '',
                    fileId,
                    downloadUrl,
                })
            }
            saveDocuments([...records, ...getDocuments()])
            toast.success(records.some((row) => row.fileId) ? 'Document saved with file upload.' : 'Document metadata saved. File upload was skipped.')
            setForm(null)
            if (preview) URL.revokeObjectURL(preview)
            setPreview('')
        } catch (error) {
            toast.error(error?.message || 'Could not save the document.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section>
            <PageIntro text='HR uploads staff documents and verifies them here. Pending → Verified is done by HR (no separate approver).'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <SearchBox value={filters.search} onChange={set('search')} placeholder='Document or employee' />
                    <Select label='Status' value={filters.status} onChange={set('status')} options={DOC_STATUSES} />
                </div>
            </PageIntro>
            <TableWrap title='Employee Documents' action={<><PrimaryButton onClick={() => setForm({ ...empty, employeeId: employees[0]?.id || '' })}>Add Document</PrimaryButton><PrimaryButton onClick={() => setExportOpen(true)}>Export</PrimaryButton></>}>
                <table className='w-full text-left'>
                    <thead className='bg-[#EDEEF5]'>
                        <tr>
                            {['Employee', 'Type', 'Name', 'File', 'Size', 'Uploaded', 'Expiry', 'Status', 'Actions'].map((h) => (
                                <th key={h} className={th}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((row) => {
                            const employee = employees.find((item) => item.id === row.employeeId)
                            const href = hrFileDownloadUrl(row.downloadUrl)
                            const busy = busyId === row.id
                            return (
                                <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                    <td className={td}>{employee?.name}<div className='text-xs'>{row.employeeId}</div></td>
                                    <td className={td}>{row.type}</td>
                                    <td className={td}>{row.name}</td>
                                    <td className={td}>{href ? <a className='text-[#515DEF]' href={href} target='_blank' rel='noreferrer'>{row.fileName}</a> : row.fileName}</td>
                                    <td className={td}>{row.fileSize}</td>
                                    <td className={td}>{row.uploadedDate}</td>
                                    <td className={td}>{row.expiryDate || '—'}</td>
                                    <td className={td}><Badge value={row.status} /></td>
                                    <td className={td}>
                                        <div className='flex flex-wrap gap-2'>
                                            {row.status !== 'Verified' && (
                                                <button
                                                    type='button'
                                                    disabled={busy}
                                                    onClick={() => setDocumentStatus(row.id, 'Verified')}
                                                    className='text-sm text-[#027A48] font-medium hover:underline cursor-pointer disabled:opacity-50'
                                                >
                                                    {busy ? 'Saving…' : 'Verify'}
                                                </button>
                                            )}
                                            {row.status !== 'Pending' && (
                                                <button
                                                    type='button'
                                                    disabled={busy}
                                                    onClick={() => setDocumentStatus(row.id, 'Pending')}
                                                    className='text-sm text-[#515DEF] hover:underline cursor-pointer disabled:opacity-50'
                                                >
                                                    Pending
                                                </button>
                                            )}
                                            {row.status !== 'Expired' && (
                                                <button
                                                    type='button'
                                                    disabled={busy}
                                                    onClick={() => setDocumentStatus(row.id, 'Expired')}
                                                    className='text-sm text-[#B42318] hover:underline cursor-pointer disabled:opacity-50'
                                                >
                                                    Expire
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </TableWrap>
            {form && (
                <Modal title='Document upload' onClose={() => !saving && setForm(null)}>
                    <form onSubmit={save} className='grid gap-3'>
                        <Select label='Employee' value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} options={employees.map((item) => item.id)} allLabel='Select' />
                        <input className={inputClass} placeholder='Document type' value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
                        <input className={inputClass} placeholder='Document name' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <input type='file' multiple onChange={onFile} />
                        <ul className='text-sm text-[#667085]'>
                            {(form.files || []).map((file) => (
                                <li key={file.fileName} className='flex justify-between gap-2'>
                                    <span>{file.fileName} · {file.fileSize}</span>
                                    <button type='button' className='text-[#515DEF]' onClick={() => setForm({ ...form, files: form.files.filter((item) => item.fileName !== file.fileName) })}>Remove</button>
                                </li>
                            ))}
                        </ul>
                        <input className={inputClass} type='date' value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                        <label className='text-base font-medium text-[#808080] flex flex-col gap-y-2'>Status
                            <select className={inputClass} value={form.status || 'Pending'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                {DOC_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </label>
                        {preview && <img src={preview} alt='Preview' className='max-h-40 object-contain' />}
                        <PrimaryButton type='submit'>{saving ? 'Saving…' : 'Save document'}</PrimaryButton>
                    </form>
                </Modal>
            )}
            <HrExport open={exportOpen} setOpen={setExportOpen} filename='hr-documents' rows={filtered} />
        </section>
    )
}

export default EmployeeDocuments
