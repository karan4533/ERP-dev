import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { DEPARTMENTS } from '../domain/hrStatus'
import { getJobs, nextId, pushNotification, saveJobs } from '../domain/hrStore'
import { Badge, HrExport, Modal, PageIntro, PrimaryButton, SearchBox, Select, TableWrap, inputClass, td, th, useFilters, useHrTick, matches } from '../components/HrUi'

const STATUSES = ['Draft', 'Open', 'On Hold', 'Closed', 'Filled']
const empty = { position: '', department: 'Academic', designation: '', openings: 1, employmentType: 'Full Time', experience: '', qualification: '', location: 'Main Campus', postedDate: '2026-09-24', closingDate: '', hiringManager: '', status: 'Draft', description: '', rolesText: '', rolesFileName: '', rolesFileType: '', internalPosting: false }

const JobOpenings = () => {
    const tick = useHrTick()
    const rows = useMemo(() => getJobs(), [tick])
    const { filters, set } = useFilters({ search: '', department: '', status: '' })
    const [form, setForm] = useState(null)
    const [exportOpen, setExportOpen] = useState(false)
    const filtered = rows.filter((row) => (!filters.department || row.department === filters.department) && (!filters.status || row.status === filters.status) && matches(`${row.id} ${row.position}`, filters.search))

    const save = (event) => {
        event.preventDefault()
        if (!form.position || !form.closingDate) return toast.error('Position and closing date are required.')
        const record = { ...form, openings: Number(form.openings) || 1, internalPosting: Boolean(form.internalPosting), id: form.id || nextId('JOB-2026', rows) }
        saveJobs(form.id ? getJobs().map((row) => (row.id === form.id ? record : row)) : [record, ...getJobs()])
        if (record.internalPosting && record.status === 'Open') {
            pushNotification({ type: 'Internal Job', title: 'Internal Job Opening', message: `${record.position} is open for internal applicants until ${record.closingDate}.`, relatedDate: record.closingDate })
        }
        toast.success('Job opening saved.')
        setForm(null)
    }

    return (
        <section>
            <PageIntro text='Internal postings create an HR notification for staff. No external job board is called.'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <SearchBox value={filters.search} onChange={set('search')} placeholder='Job title or ID' />
                    <Select label='Department' value={filters.department} onChange={set('department')} options={DEPARTMENTS} />
                    <Select label='Status' value={filters.status} onChange={set('status')} options={STATUSES} />
                </div>
            </PageIntro>
            <TableWrap title='Job Openings' action={<><PrimaryButton onClick={() => setForm(empty)}>Add Opening</PrimaryButton><PrimaryButton onClick={() => setExportOpen(true)}>Export</PrimaryButton></>}>
                <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['Job ID', 'Position', 'Department', 'Openings', 'Roles', 'Internal', 'Status', 'Closing', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                    <tbody>{filtered.map((row) => <tr key={row.id} className='border-b border-[#f2f4f7]'><td className={td}>{row.id}</td><td className={td}>{row.position}</td><td className={td}>{row.department}</td><td className={td}>{row.openings}</td><td className={td}>{row.rolesText || row.rolesFileName || '—'}</td><td className={td}>{row.internalPosting ? 'Yes' : 'No'}</td><td className={td}><Badge value={row.status} /></td><td className={td}>{row.closingDate}</td><td className={td}><button type='button' className='text-[#515DEF]' onClick={() => setForm(row)}>Edit</button></td></tr>)}</tbody>
                </table>
            </TableWrap>
            {form && <Modal title='Job Opening' onClose={() => setForm(null)} wide>
                <form onSubmit={save} className='grid md:grid-cols-2 gap-3'>
                    {['position', 'designation', 'experience', 'qualification', 'location', 'postedDate', 'closingDate', 'hiringManager', 'description'].map((key) => <input key={key} className={inputClass} placeholder={key} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
                    <input className={inputClass} type='number' min='1' value={form.openings} onChange={(e) => setForm({ ...form, openings: e.target.value })} />
                    <Select label='Department' value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} options={DEPARTMENTS} allLabel='Select' />
                    <Select label='Status' value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={STATUSES} allLabel='Select' />
                    <textarea className={`${inputClass} md:col-span-2`} placeholder='Roles and responsibilities' value={form.rolesText || ''} onChange={(e) => setForm({ ...form, rolesText: e.target.value })} />
                    <label className='text-sm md:col-span-2'>Roles file (PDF or JPG metadata only)
                        <input type='file' accept='application/pdf,image/jpeg,image/jpg' onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; setForm({ ...form, rolesFileName: file.name, rolesFileType: file.type }) }} />
                        {form.rolesFileName && <span className='block text-xs text-[#667085] mt-1'>{form.rolesFileName} · {form.rolesFileType}</span>}
                    </label>
                    <label className='text-sm flex items-center gap-2'><input type='checkbox' checked={!!form.internalPosting} onChange={(e) => setForm({ ...form, internalPosting: e.target.checked })} /> Internal job posting</label>
                    <PrimaryButton type='submit'>Save</PrimaryButton>
                </form>
            </Modal>}
            <HrExport open={exportOpen} setOpen={setExportOpen} filename='job-openings' rows={filtered} />
        </section>
    )
}

export default JobOpenings
