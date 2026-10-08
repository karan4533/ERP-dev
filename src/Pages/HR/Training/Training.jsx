import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DEPARTMENTS } from '../domain/hrStatus'
import { employeeName, getEmployees, getTraining, nextId, pushNotification, saveTraining } from '../domain/hrStore'
import { Badge, Modal, PageIntro, PrimaryButton, TableWrap, inputClass, td, th, useHrTick } from '../components/HrUi'

const Training = () => {
    const path = useLocation().pathname
    const mode = path.includes('feedback') ? 'feedback' : path.includes('records') ? 'records' : 'schedule'
    const tick = useHrTick()
    const rows = useMemo(() => getTraining().filter((row) => row?.id), [tick])
    const employees = useMemo(() => getEmployees().filter((row) => row?.id), [tick])
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

    return (
        <section>
            <PageIntro text={`Training completion: ${completed} of ${rows.length} sessions completed. Photos keep file metadata only.`}>
                {mode === 'schedule' && <PrimaryButton onClick={() => setForm({ title: '', category: 'Soft Skills', trainer: '', department: 'Academic', participants: employees.slice(0, 2).map((item) => item?.id).filter(Boolean).join(', '), startDate: '2026-09-25', endDate: '2026-09-25', time: '10:00 AM', location: 'Seminar Hall', mode: 'In Person', description: '' })}>Schedule Training</PrimaryButton>}
            </PageIntro>
            <TableWrap title={mode === 'feedback' ? 'Training Feedback' : mode === 'records' ? 'Training Records' : 'Training Schedule'}>
                <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['Title', 'Department', 'When', 'Participants', 'Status', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                    <tbody>{rows.map((row) => {
                        if (!row) return null
                        const participants = row.participantIds || []
                        const attendance = row.attendance || {}
                        const feedbackRows = (row.feedback || []).filter((entry) => entry && typeof entry === 'object')
                        return <tr key={row.id} className='border-b border-[#f2f4f7] align-top'><td className={td}>{row.title}<div className='text-xs'>{row.category} · {row.trainer}</div></td><td className={td}>{row.department}</td><td className={td}>{row.startDate} {row.time}</td><td className={td}>{participants.map((id) => employeeName(id)).join(', ')}{mode === 'records' && <div className='mt-2 space-y-1'>{participants.map((id) => <div key={id} className='flex gap-2 items-center'><span>{employeeName(id)}</span><select className='border rounded px-1' value={attendance[id] || ''} onChange={(e) => mark(row, id, e.target.value)}><option value=''>Mark</option><option>Present</option><option>Absent</option></select></div>)}</div>}</td><td className={td}><Badge value={row.status} /><div className='text-xs mt-1'>{feedbackRows.length} feedback</div></td><td className={td}>{mode === 'feedback' && <button type='button' className='text-[#515DEF]' onClick={() => setFeedback({ trainingId: row.id, employeeId: participants[0] || employees[0]?.id || '', relevance: 3, trainer: 3, content: 3, usefulness: 3, overall: 3, comments: '' })}>Add feedback</button>}</td></tr>
                    })}</tbody>
                </table>
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
