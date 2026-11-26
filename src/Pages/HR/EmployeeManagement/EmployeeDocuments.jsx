import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { DataTable } from '../../../Common/ui'
import { getDocuments, getEmployees, nextId, saveDocuments } from '../domain/hrStore'
import { Badge, HrExport, Modal, PageIntro, PrimaryButton, SearchBox, Select, TableWrap, inputClass } from '../components/HrUi'
import { matches, useFilters, useHrTick } from '../components/hrUiState'

const empty = { employeeId: '', type: 'ID Proof', name: '', files: [], expiryDate: '', status: 'Pending' }

const EmployeeDocuments = () => {
    const tick = useHrTick()
    const rows = useMemo(() => {
        void tick
        return getDocuments()
    }, [tick])
    const employees = useMemo(() => {
        void tick
        return getEmployees()
    }, [tick])
    const { filters, set } = useFilters({ search: '', status: '' })
    const [form, setForm] = useState(null)
    const [preview, setPreview] = useState('')
    const [exportOpen, setExportOpen] = useState(false)
    const activeForm = form || empty
    const filtered = rows.filter((row) => (!filters.status || row.status === filters.status) && matches(`${row.name} ${row.fileName} ${row.employeeId}`, filters.search))

    const closeForm = () => {
        if (preview) URL.revokeObjectURL(preview)
        setPreview('')
        setForm(null)
    }

    const onFile = (event) => {
        const selected = [...(event.target.files || [])].map((file) => ({
            fileName: file.name,
            fileSize: `${Math.ceil(file.size / 1024)} KB`,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        }))
        if (!selected.length) return
        setPreview(selected.find((file) => file.preview)?.preview || '')
        setForm((current) => {
            const next = current || empty
            return { ...next, files: [...(next.files || []), ...selected], name: next.name || selected[0].fileName }
        })
    }

    const save = (event) => {
        event.preventDefault()
        if (!form) return
        const files = form.files || []
        if (!form.employeeId || !form.type || !files.length) return toast.error('Employee, type, and at least one file are required.')
        const employee = employees.find((item) => item.id === form.employeeId)
        if (!employee) return toast.error('Select a valid employee.')
        const records = files.map((file, index) => ({ id: `${nextId('DOC', rows)}-${index + 1}`, uploadedDate: '24-09-2026', uploadedBy: 'HR', employeeId: employee.id, type: form.type, name: form.name, fileName: file.fileName, fileSize: file.fileSize, expiryDate: form.expiryDate, status: form.status }))
        saveDocuments([...records, ...getDocuments()])
        toast.success('Document metadata saved. File binary is not stored.')
        closeForm()
    }

    const columns = [
        {
            key: 'employeeId',
            label: 'Employee',
            required: true,
            render: (row) => {
                const employee = employees.find((item) => item.id === row.employeeId)
                return <span className='block'><span className='block font-medium text-[#1E1E1E]'>{employee?.name || 'Unknown employee'}</span><span className='block text-xs text-[#667085]'>{row.employeeId}</span></span>
            },
        },
        { key: 'type', label: 'Type' },
        { key: 'name', label: 'Name', required: true },
        { key: 'fileName', label: 'File' },
        { key: 'fileSize', label: 'Size' },
        { key: 'uploadedDate', label: 'Uploaded' },
        { key: 'expiryDate', label: 'Expiry', render: (row) => row.expiryDate || '—' },
        { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
    ]

    return (
        <section>
            <PageIntro text='Document metadata is saved in this browser. File contents stay in the current session only.'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <SearchBox value={filters.search} onChange={set('search')} placeholder='Document or employee' />
                    <Select label='Status' value={filters.status} onChange={set('status')} options={['Verified', 'Pending', 'Expired']} />
                </div>
            </PageIntro>
            <TableWrap title='Employee Documents' action={<><PrimaryButton onClick={() => setForm({ ...empty, employeeId: employees[0]?.id || '' })}>Add Document</PrimaryButton><PrimaryButton onClick={() => setExportOpen(true)}>Export</PrimaryButton></>}>
                <DataTable
                    caption='Employee document metadata register'
                    rows={filtered}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No employee documents found'
                    emptyDescription='Adjust the search or status filter, or add document metadata for an employee.'
                />
            </TableWrap>
            {form && <Modal title='Document metadata' onClose={closeForm}>
                <form onSubmit={save} className='grid gap-3'>
                    <Select label='Employee' value={activeForm.employeeId} onChange={(e) => setForm({ ...activeForm, employeeId: e.target.value })} options={employees.map((item) => item.id)} allLabel='Select' />
                    <input className={inputClass} placeholder='Document type' value={activeForm.type} onChange={(e) => setForm({ ...activeForm, type: e.target.value })} />
                    <input className={inputClass} placeholder='Document name' value={activeForm.name} onChange={(e) => setForm({ ...activeForm, name: e.target.value })} />
                    <input type='file' multiple onChange={onFile} />
                    <ul className='text-sm text-[#667085]'>{(activeForm.files || []).map((file) => <li key={file.fileName} className='flex justify-between gap-2'><span>{file.fileName} · {file.fileSize}</span><button type='button' className='text-[#515DEF]' onClick={() => setForm({ ...activeForm, files: activeForm.files.filter((item) => item.fileName !== file.fileName) })}>Remove</button></li>)}</ul>
                    <input className={inputClass} type='date' value={activeForm.expiryDate} onChange={(e) => setForm({ ...activeForm, expiryDate: e.target.value })} />
                    {preview && <img src={preview} alt='Preview' className='max-h-40 object-contain' />}
                    <PrimaryButton type='submit'>Save metadata</PrimaryButton>
                </form>
            </Modal>}
            <HrExport open={exportOpen} setOpen={setExportOpen} filename='hr-documents' rows={filtered} />
        </section>
    )
}

export default EmployeeDocuments
