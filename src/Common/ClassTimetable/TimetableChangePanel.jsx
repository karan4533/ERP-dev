import { useState } from 'react'
import { toast } from 'react-toastify'
import { DAYS, SUBJECTS, TEACHERS, addTimetableChangeRequest, getTimetableChangeRequests } from '../../Pages/Principal/ClassTimetable/classTimetableData'

const inputClass = 'text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full'

export default function TimetableChangePanel({ requestedBy, requestedByRole }) {
    const [rows, setRows] = useState(() => getTimetableChangeRequests().filter((item) => item.requestedByRole === requestedByRole))
    const [form, setForm] = useState({
        className: 'Grade 10',
        section: 'A',
        day: 'Monday',
        periodNumber: '1',
        currentSubject: 'Mathematics',
        requestedSubject: 'Science',
        requestedTeacher: TEACHERS[0],
        reason: '',
    })

    const submit = (event) => {
        event.preventDefault()
        if (!form.reason.trim()) {
            toast.error('A reason is required.')
            return
        }
        addTimetableChangeRequest({ ...form, requestedBy, requestedByRole })
        setRows(getTimetableChangeRequests().filter((item) => item.requestedByRole === requestedByRole))
        setForm((current) => ({ ...current, reason: '' }))
        toast.success('Change request sent to the Principal.')
    }

    return (
        <section className='bg-white rounded-2xl shadow-md p-4 space-y-4'>
            <div>
                <h2 className='text-lg font-semibold'>Request a timetable change</h2>
                <p className='text-sm text-[#667085] mt-1'>The Principal reviews this request. Director approval is not used.</p>
            </div>
            <form onSubmit={submit} className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                <input className={inputClass} value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })} placeholder='Class' />
                <input className={inputClass} value={form.section} onChange={(event) => setForm({ ...form, section: event.target.value })} placeholder='Section' />
                <select className={inputClass} value={form.day} onChange={(event) => setForm({ ...form, day: event.target.value })}>{DAYS.map((day) => <option key={day}>{day}</option>)}</select>
                <input className={inputClass} value={form.periodNumber} onChange={(event) => setForm({ ...form, periodNumber: event.target.value })} placeholder='Period' />
                <select className={inputClass} value={form.currentSubject} onChange={(event) => setForm({ ...form, currentSubject: event.target.value })}>{SUBJECTS.map((item) => <option key={item}>{item}</option>)}</select>
                <select className={inputClass} value={form.requestedSubject} onChange={(event) => setForm({ ...form, requestedSubject: event.target.value })}>{SUBJECTS.map((item) => <option key={item}>{item}</option>)}</select>
                <select className={inputClass} value={form.requestedTeacher} onChange={(event) => setForm({ ...form, requestedTeacher: event.target.value })}>{TEACHERS.map((item) => <option key={item}>{item}</option>)}</select>
                <input className={`${inputClass} md:col-span-2`} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder='Reason for the change' />
                <button type='submit' className='bg-[#515DEF] text-white text-sm rounded-md cursor-pointer'>Send to Principal</button>
            </form>
            {rows.length > 0 && (
                <ul className='text-sm text-[#667085] space-y-1'>
                    {rows.map((row) => (
                        <li key={row.id}>{row.className} {row.section} · {row.day} · {row.currentSubject} → {row.requestedSubject} · {row.status}</li>
                    ))}
                </ul>
            )}
        </section>
    )
}
