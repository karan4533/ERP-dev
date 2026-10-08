import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { getDocuments, getEmployees, nextId, saveDocuments } from '../domain/hrStore'
import { Badge, HrExport, Modal, PageIntro, PrimaryButton, SearchBox, Select, TableWrap, inputClass, td, th, useFilters, useHrTick, matches } from '../components/HrUi'

const empty = { employeeId: '', type: 'ID Proof', name: '', files: [], expiryDate: '', status: 'Pending' }

const EmployeeDocuments = () => {
    const tick = useHrTick()
    const rows = useMemo(() => getDocuments(), [tick])
    const employees = useMemo(() => getEmployees(), [tick])
    const { filters, set } = useFilters({ search: '', status: '' })
    const [form, setForm] = useState(null)
    const [preview, setPreview] = useState('')
    const [exportOpen, setExportOpen] = useState(false)
    const filtered = rows.filter((row) => (!filters.status || row.status === filters.status) && matches(`${row.name} ${row.fileName} ${row.employeeId}`, filters.search))

    const onFile = (event) => {
        const selected = [...(event.target.files || [])].map((file) => ({
            fileName: file.name,
            fileSize: `${Math.ceil(file.size / 1024)} KB`,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        }))
        if (!selected.length) return
        setPreview(selected.find((file) => file.preview)?.preview || '')
        setForm((current) => ({ ...current, files: [...(current.files || []), ...selected], name: current.name || selected[0].fileName }))
    }

    const save = (event) => {
        event.preventDefault()
        const files = form.files || []
        if (!form.employeeId || !form.type || !files.length) return toast.error('Employee, type, and at least one file are required.')
        const employee = employees.find((item) => item.id === form.employeeId)
        const records = files.map((file, index) => ({ id: `${nextId('DOC', rows)}-${index + 1}`, uploadedDate: '24-09-2026', uploadedBy: 'HR', employeeId: employee.id, type: form.type, name: form.name, fileName: file.fileName, fileSize: file.fileSize, expiryDate: form.expiryDate, status: form.status }))
        saveDocuments([...records, ...getDocuments()])
        toast.success('Document metadata saved. File binary is not stored.')
        setForm(null)
        if (preview) URL.revokeObjectURL(preview)
        setPreview('')
    }

    return (
        <section>
            <PageIntro text='Document metadata is saved in this browser. File contents stay in the current session only.'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <SearchBox value={filters.search} onChange={set('search')} placeholder='Document or employee' />
                    <Select label='Status' value={filters.status} onChange={set('status')} options={['Verified', 'Pending', 'Expired']} />
                </div>
            </PageIntro>
            <TableWrap title='Employee Documents' action={<><PrimaryButton onClick={() => setForm({ ...empty, employeeId: employees[0]?.id || '' })}>Add Document</PrimaryButton><PrimaryButton onClick={() => setExportOpen(true)}>Export</PrimaryButton></>}>
                <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['Employee', 'Type', 'Name', 'File', 'Size', 'Uploaded', 'Expiry', 'Status'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                    <tbody>{filtered.map((row) => {
                        const employee = employees.find((item) => item.id === row.employeeId)
                        return <tr key={row.id} className='border-b border-[#f2f4f7]'><td className={td}>{employee?.name}<div className='text-xs'>{row.employeeId}</div></td><td className={td}>{row.type}</td><td className={td}>{row.name}</td><td className={td}>{row.fileName}</td><td className={td}>{row.fileSize}</td><td className={td}>{row.uploadedDate}</td><td className={td}>{row.expiryDate || '—'}</td><td className={td}><Badge value={row.status} /></td></tr>
                    })}</tbody>
                </table>
            </TableWrap>
            {form && <Modal title='Document metadata' onClose={() => setForm(null)}>
                <form onSubmit={save} className='grid gap-3'>
                    <Select label='Employee' value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} options={employees.map((item) => item.id)} allLabel='Select' />
                    <input className={inputClass} placeholder='Document type' value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
                    <input className={inputClass} placeholder='Document name' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <input type='file' multiple onChange={onFile} />
                    <ul className='text-sm text-[#667085]'>{(form.files || []).map((file) => <li key={file.fileName} className='flex justify-between gap-2'><span>{file.fileName} · {file.fileSize}</span><button type='button' className='text-[#515DEF]' onClick={() => setForm({ ...form, files: form.files.filter((item) => item.fileName !== file.fileName) })}>Remove</button></li>)}</ul>
                    <input className={inputClass} type='date' value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                    {preview && <img src={preview} alt='Preview' className='max-h-40 object-contain' />}
                    <PrimaryButton type='submit'>Save metadata</PrimaryButton>
                </form>
            </Modal>}
            <HrExport open={exportOpen} setOpen={setExportOpen} filename='hr-documents' rows={filtered} />
        </section>
    )
}

export default EmployeeDocuments
