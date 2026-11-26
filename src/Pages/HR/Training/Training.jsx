import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DataTable } from '../../../Common/ui'
import { DEPARTMENTS } from '../domain/hrStatus'
import { employeeName, getEmployees, getTraining, nextId, pushNotification, saveTraining } from '../domain/hrStore'
import { Badge, Modal, PageIntro, PrimaryButton, TableWrap, inputClass } from '../components/HrUi'
import { useHrTick } from '../components/hrUiState'

const Training = () => {
    const path = useLocation().pathname
    const mode = path.includes('feedback') ? 'feedback' : path.includes('records') ? 'records' : 'schedule'
    const tick = useHrTick()
    const rows = useMemo(() => {
        void tick
        return getTraining().filter((row) => row?.id)
    }, [tick])
    const employees = useMemo(() => {
        void tick
        return getEmployees().filter((row) => row?.id)
    }, [tick])
    const [form, setForm] = useState(null)
    const [feedback, setFeedback] = useState(null)

    const save = (event) => {
        event.preventDefault()
        if (!form?.title || !form.startDate) return toast.error('Title and date are required.')
        const participantIds = String(form.participants || '').split(',').map((item) => item.trim()).filter(Boolean)
        const record = { id: nextId('TRN-2026', rows), title: form.title, category: form.category || 'General', trainer: form.trainer, department: form.department, participantIds, startDate: form.startDate, endDate: form.endDate || form.startDate, time: form.time, location: form.location, mode: form.mode, description: form.description, status: 'Scheduled', photos: form.photoName ? [{ name: form.photoName, size: form.photoSize }] : [], attendance: {}, feedback: [] }
        saveTraining([record, ...getTraining()])
        pushNotification({ type: 'Training', title: 'Upcoming Training', message: `${record.title} on ${record.startDate} at ${record.time}.`, relatedDate: record.startDate })
        toast.success('Training scheduled and notification created.')
        setForm(null)
    }

    const mark = (session, employeeId, status) => {
        if (!session) return
        saveTraining(getTraining().filter(Boolean).map((item) => item.id === session.id ? { ...item, attendance: { ...(item.attendance || {}), [employeeId]: status } } : item))
    }

    const saveFeedback = (event) => {
        event.preventDefault()
        if (!feedback) return
        const entry = { employeeId: feedback.employeeId, relevance: Number(feedback.relevance), trainer: Number(feedback.trainer), content: Number(feedback.content), usefulness: Number(feedback.usefulness), overall: Number(feedback.overall), comments: feedback.comments || '' }
        saveTraining(getTraining().filter(Boolean).map((item) => item.id === feedback.trainingId ? { ...item, feedback: [...(item.feedback || []).filter((row) => row && row.employeeId !== entry.employeeId), entry] } : item))
        toast.success('Feedback stored.')
        setFeedback(null)
    }

    const completed = rows.filter((item) => item?.status === 'Completed').length
    const columns = [
        {
            key: 'title',
            label: 'Title',
            required: true,
            render: (row) => <span className='block'><span className='block font-medium text-[#1E1E1E]'>{row.title}</span><span className='block text-xs text-[#667085]'>{row.category} · {row.trainer || 'Trainer pending'}</span></span>,
        },
        { key: 'department', label: 'Department' },
        { key: 'startDate', label: 'When', render: (row) => `${row.startDate} ${row.time || ''}`.trim() },
        {
            key: 'participantIds',
            label: 'Participants',
            required: true,
            render: (row) => {
                const participants = row.participantIds || []
                const attendance = row.attendance || {}
                return (
                    <div className='space-y-2'>
                        <p>{participants.map((id) => employeeName(id)).join(', ') || 'No participants assigned'}</p>
                        {mode === 'records' && participants.map((id) => (
                            <label key={id} className='flex flex-wrap items-center gap-2 text-xs'>
                                <span>{employeeName(id)}</span>
                                <select aria-label={`Attendance for ${employeeName(id)} in ${row.title}`} className='min-h-9 rounded border border-[#D9D9D9] px-2' value={attendance[id] || ''} onChange={(event) => mark(row, id, event.target.value)}>
                                    <option value=''>Mark attendance</option><option>Present</option><option>Absent</option>
                                </select>
                            </label>
                        ))}
                    </div>
                )
            },
        },
        { key: 'status', label: 'Status', render: (row) => <span className='block'><Badge value={row.status} /><span className='mt-1 block text-xs text-[#667085]'>{(row.feedback || []).filter((entry) => entry && typeof entry === 'object').length} feedback</span></span> },
    ]

    return (
        <section>
            <PageIntro text={`Training completion: ${completed} of ${rows.length} sessions completed. Photos keep file metadata only.`}>
                {mode === 'schedule' && <PrimaryButton onClick={() => setForm({ title: '', category: 'Soft Skills', trainer: '', department: 'Academic', participants: employees.slice(0, 2).map((item) => item?.id).filter(Boolean).join(', '), startDate: '2026-09-25', endDate: '2026-09-25', time: '10:00 AM', location: 'Seminar Hall', mode: 'In Person', description: '' })}>Schedule Training</PrimaryButton>}
            </PageIntro>
            <TableWrap title={mode === 'feedback' ? 'Training Feedback' : mode === 'records' ? 'Training Records' : 'Training Schedule'}>
                <DataTable
                    caption={mode === 'feedback' ? 'Training feedback register' : mode === 'records' ? 'Training attendance register' : 'Training schedule register'}
                    rows={rows}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No training sessions found'
                    emptyDescription='Schedule a training session to create the first record.'
                    renderActions={mode === 'feedback' ? (row) => {
                        const participants = row.participantIds || []
                        return <button type='button' className='min-h-9 rounded-md border border-[#515DEF] px-3 text-xs font-semibold text-[#515DEF] hover:bg-[#F1F2FF]' onClick={() => setFeedback({ trainingId: row.id, employeeId: participants[0] || employees[0]?.id || '', relevance: 3, trainer: 3, content: 3, usefulness: 3, overall: 3, comments: '' })}>Add feedback</button>
                    } : undefined}
                />
            </TableWrap>
            {form && <Modal title='Schedule training' onClose={() => setForm(null)}>
                <form onSubmit={save} className='grid gap-3'>
                    {['title', 'category', 'trainer', 'participants', 'startDate', 'time', 'location', 'description'].map((key) => <input key={key} className={inputClass} placeholder={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
                    <select className={inputClass} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>{DEPARTMENTS.map((item) => <option key={item}>{item}</option>)}</select>
                    <input type='file' accept='image/*' onChange={(e) => { const file = e.target.files?.[0]; if (file) setForm({ ...form, photoName: file.name, photoSize: `${Math.ceil(file.size / 1024)} KB` }) }} />
                    <PrimaryButton type='submit'>Save</PrimaryButton>
                </form>
            </Modal>}
            {feedback && <Modal title='Training feedback' onClose={() => setFeedback(null)}>
                <form onSubmit={saveFeedback} className='grid gap-3'>
                    <select className={inputClass} value={feedback.employeeId} onChange={(e) => setFeedback({ ...feedback, employeeId: e.target.value })}>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                    {['relevance', 'trainer', 'content', 'usefulness', 'overall'].map((key) => <select key={key} className={inputClass} value={feedback[key]} onChange={(e) => setFeedback({ ...feedback, [key]: Number(e.target.value) })}>{[1, 2, 3].map((n) => <option key={n} value={n}>{key} {n}</option>)}</select>)}
                    <input className={inputClass} placeholder='Comments' value={feedback.comments} onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })} />
                    <PrimaryButton type='submit'>Save</PrimaryButton>
                </form>
            </Modal>}
        </section>
    )
}

export default Training
