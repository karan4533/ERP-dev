import React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    ACADEMIC_YEARS,
    GRADES,
    ORIGINAL_TC_OPTIONS,
    SECTIONS,
    STATUS_OPTIONS,
} from '../studentReEnrollmentData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const parseDisplayDate = (value) => {
    if (!value) return null
    if (value instanceof Date) return value
    const parts = String(value).split('-')
    if (parts.length === 3) {
        const [day, month, year] = parts
        const parsed = new Date(`${year}-${month}-${day}`)
        return Number.isNaN(parsed.getTime()) ? null : parsed
    }
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatDisplayDate = (value) => {
    if (!value) return '—'
    const date = parseDisplayDate(value)
    return date ? date.toLocaleDateString('en-GB').replace(/\//g, '-') : String(value)
}

const DateField = ({ label, value, onChange, readOnly }) => (
    <div className='flex flex-col gap-y-2'>
        <label className='text-base font-medium text-[#1E1E1E]'>{label}</label>
        {readOnly ? (
            <input type='text' value={formatDisplayDate(value)} readOnly className={inputClass} />
        ) : (
            <div className='relative'>
                <DatePicker
                    selected={parseDisplayDate(value)}
                    onChange={onChange}
                    dateFormat='dd/MM/yyyy'
                    isClearable
                    className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                />
                <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
            </div>
        )}
    </div>
)

const Field = ({ label, value, onChange, readOnly, type = 'text', placeholder, as = 'input', options = [] }) => (
    <div className='flex flex-col gap-y-2'>
        <label className='text-base font-medium text-[#1E1E1E]'>{label}</label>
        {readOnly ? (
            <input type='text' value={value || '—'} readOnly className={inputClass} />
        ) : as === 'select' ? (
            <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
                <option value=''>Select</option>
                {options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        ) : (
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={inputClass}
            />
        )}
    </div>
)

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h3 className='text-lg font-semibold text-black mb-4'>{title}</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>{children}</div>
    </div>
)

const StudentReEnrollmentForm = ({ form, onChange, readOnly = false }) => {
    const updateField = (key, value) => onChange({ ...form, [key]: value })

    return (
        <div className='space-y-6'>
            <Section title='Student Information'>
                <Field label='Admission Number:' value={form.admissionNumber} onChange={(v) => updateField('admissionNumber', v)} readOnly={readOnly} placeholder='ADM-NO1845' />
                <Field label='Student Name:' value={form.studentName} onChange={(v) => updateField('studentName', v)} readOnly={readOnly} />
                <Field label='Father / Guardian Name:' value={form.guardianName} onChange={(v) => updateField('guardianName', v)} readOnly={readOnly} />
                <Field label='Mobile Number:' value={form.mobileNumber} onChange={(v) => updateField('mobileNumber', v)} readOnly={readOnly} />
                <Field label='Previous Academic Year:' value={form.previousAcademicYear} onChange={(v) => updateField('previousAcademicYear', v)} readOnly={readOnly} as='select' options={ACADEMIC_YEARS} />
                <Field label='Previous Class (Grade 10):' value={form.previousClass} onChange={(v) => updateField('previousClass', v)} readOnly={readOnly} as='select' options={GRADES} />
                <Field label='Previous Section:' value={form.previousSection} onChange={(v) => updateField('previousSection', v)} readOnly={readOnly} as='select' options={SECTIONS} />
            </Section>

            <Section title='TC Information'>
                <Field label='TC Number:' value={form.tcNumber} onChange={(v) => updateField('tcNumber', v)} readOnly={readOnly} placeholder='TC/2025/0142' />
                <DateField label='TC Issued Date:' value={form.tcIssuedDate} onChange={(date) => updateField('tcIssuedDate', date)} readOnly={readOnly} />
                <DateField label='TC Returned Date:' value={form.tcReturnedDate} onChange={(date) => updateField('tcReturnedDate', date)} readOnly={readOnly} />
                <Field label='Original TC Received (Yes / No):' value={form.originalTcReceived} onChange={(v) => updateField('originalTcReceived', v)} readOnly={readOnly} as='select' options={ORIGINAL_TC_OPTIONS} />
            </Section>

            <Section title='New Admission Details'>
                <Field label='Academic Year:' value={form.academicYear} onChange={(v) => updateField('academicYear', v)} readOnly={readOnly} as='select' options={ACADEMIC_YEARS} />
                <Field label='New Class (Grade 11):' value={form.newClass} onChange={(v) => updateField('newClass', v)} readOnly={readOnly} as='select' options={GRADES} />
                <Field label='Section:' value={form.section} onChange={(v) => updateField('section', v)} readOnly={readOnly} as='select' options={SECTIONS} />
                <Field label='Roll Number:' value={form.rollNumber} onChange={(v) => updateField('rollNumber', v)} readOnly={readOnly} />
            </Section>

            <Section title='Status'>
                <Field label='Status:' value={form.status} onChange={(v) => updateField('status', v)} readOnly={readOnly} as='select' options={STATUS_OPTIONS} />
            </Section>
        </div>
    )
}

export default StudentReEnrollmentForm
