import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getCandidates, getJobs, nextId, saveCandidates } from '../domain/hrStore'
import { Badge, HrExport, Modal, PageIntro, PrimaryButton, SearchBox, Select, TableWrap, inputClass, td, th, useFilters, useHrTick, matches } from '../components/HrUi'

const SOURCES = ['Walk-in', 'Employee Referral', 'Consultancy', 'Job Portal', 'Internal', 'Campus', 'Other']
const STATUSES = ['Applied', 'Screening', 'Interview', 'Selected', 'Rejected', 'On Hold']
const empty = { jobId: '', name: '', dateOfBirth: '', gender: '', maritalStatus: '', address: '', mobile: '', email: '', qualification: '', experience: '', currentCompany: '', currentSalary: '', expectedSalary: '', noticePeriod: '', source: 'Walk-in', reference: '', resumeName: '', resumeSize: '', applicationDate: '2026-09-24', status: 'Applied' }

const Candidates = () => {
    const tick = useHrTick()
    const [params] = useSearchParams()
    const rows = useMemo(() => getCandidates(), [tick])
    const jobs = useMemo(() => getJobs(), [tick])
    const { filters, set } = useFilters({ search: '', source: '', status: params.get('status') || '' })
    const [form, setForm] = useState(null)
    const [selected, setSelected] = useState(null)
    const [exportOpen, setExportOpen] = useState(false)
    const filtered = rows.filter((row) => (!filters.source || row.source === filters.source) && (!filters.status || row.status === filters.status) && matches(`${row.name} ${row.id} ${row.position}`, filters.search))

    const save = (event) => {
        event.preventDefault()
        if (!form.name.trim()) return toast.error('Candidate name is required.')
        const job = jobs.find((item) => item.id === form.jobId)
        const record = { ...form, position: job?.position || form.position, currentSalary: Number(form.currentSalary) || 0, expectedSalary: Number(form.expectedSalary) || 0, id: form.id || nextId('CAN-2026', rows) }
        saveCandidates(form.id ? getCandidates().map((row) => (row.id === form.id ? record : row)) : [record, ...getCandidates()])
        toast.success('Candidate saved.')
        setForm(null)
    }

    return (
        <section>
            <PageIntro text='Candidate profiles stay linked to the job and, after joining, to the employee record.'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <SearchBox value={filters.search} onChange={set('search')} placeholder='Name or ID' />
                    <Select label='Source' value={filters.source} onChange={set('source')} options={SOURCES} />
                    <Select label='Status' value={filters.status} onChange={set('status')} options={STATUSES} />
                </div>
            </PageIntro>
            <TableWrap title='Candidates' action={<><PrimaryButton onClick={() => setForm({ ...empty, jobId: jobs[0]?.id || '' })}>Add Candidate</PrimaryButton><PrimaryButton onClick={() => setExportOpen(true)}>Export</PrimaryButton></>}>
                <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['ID', 'Name', 'Position', 'Source', 'Status', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                    <tbody>{filtered.map((row) => <tr key={row.id} className='border-b border-[#f2f4f7]'><td className={td}>{row.id}</td><td className={td}>{row.name}</td><td className={td}>{row.position}</td><td className={td}>{row.source}</td><td className={td}><Badge value={row.status} /></td><td className={td}><button type='button' className='text-[#515DEF] mr-3' onClick={() => setSelected(row)}>View</button><button type='button' className='text-[#515DEF]' onClick={() => setForm(row)}>Edit</button></td></tr>)}</tbody>
                </table>
            </TableWrap>
            {selected && <Modal title={selected.name} onClose={() => setSelected(null)}>
                <div className='grid sm:grid-cols-2 gap-3 text-sm'>{Object.entries(selected).map(([key, value]) => <p key={key}><span className='text-[#808080]'>{key}: </span>{String(value || '—')}</p>)}</div>
            </Modal>}
            {form && <Modal title='Candidate' onClose={() => setForm(null)} wide>
                <form onSubmit={save} className='grid md:grid-cols-2 gap-3'>
                    <Select label='Position' value={form.jobId} onChange={(e) => setForm({ ...form, jobId: e.target.value })} options={jobs.map((job) => job.id)} allLabel='Select' />
                    {['name', 'dateOfBirth', 'gender', 'maritalStatus', 'address', 'mobile', 'email', 'qualification', 'experience', 'currentCompany', 'currentSalary', 'expectedSalary', 'noticePeriod', 'reference', 'applicationDate'].map((key) => <input key={key} className={inputClass} placeholder={key} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
                    <Select label='Source' value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} options={SOURCES} allLabel='Select' />
                    <Select label='Status' value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={STATUSES} allLabel='Select' />
                    <input type='file' onChange={(e) => { const file = e.target.files?.[0]; if (file) setForm({ ...form, resumeName: file.name, resumeSize: `${Math.ceil(file.size / 1024)} KB` }) }} />
                    <PrimaryButton type='submit'>Save</PrimaryButton>
                </form>
            </Modal>}
            <HrExport open={exportOpen} setOpen={setExportOpen} filename='candidates' rows={filtered} />
        </section>
    )
}

export default Candidates
