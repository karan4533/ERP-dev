import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { CLASSES, SECTIONS, SUBJECTS, VENUES } from '../extraClassData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const textareaClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full min-h-[100px] resize-y'

const parseDate = (value) => {
    if (!value) return new Date()
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return new Date()
    return new Date(year, month - 1, day)
}

const ExtraClassForm = ({ record }) => {
    const [extraClassDate, setExtraClassDate] = useState(() => parseDate(record?.date))

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='subject' className='text-base font-medium text-[#1E1E1E]'>Subject:</label>
                <select id='subject' defaultValue={record?.subject ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {SUBJECTS.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='class-name' className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                <select id='class-name' defaultValue={record?.className ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {CLASSES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='section' className='text-base font-medium text-[#1E1E1E]'>Section:</label>
                <select id='section' defaultValue={record?.section ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {SECTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                <label htmlFor='topic' className='text-base font-medium text-[#1E1E1E]'>Topic:</label>
                <input type='text' id='topic' defaultValue={record?.topic ?? ''} placeholder='e.g. Quadratic Equations' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={extraClassDate}
                        onChange={(date) => setExtraClassDate(date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='start-time' className='text-base font-medium text-[#1E1E1E]'>Start Time:</label>
                <input type='text' id='start-time' defaultValue={record?.startTime ?? ''} placeholder='e.g. 03:30 PM' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='end-time' className='text-base font-medium text-[#1E1E1E]'>End Time:</label>
                <input type='text' id='end-time' defaultValue={record?.endTime ?? ''} placeholder='e.g. 04:30 PM' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='venue' className='text-base font-medium text-[#1E1E1E]'>Venue:</label>
                <select id='venue' defaultValue={record?.venue ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {VENUES.map((venue) => (
                        <option key={venue} value={venue}>{venue}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                <label htmlFor='reason' className='text-base font-medium text-[#1E1E1E]'>Reason:</label>
                <textarea id='reason' defaultValue={record?.reason ?? ''} placeholder='Reason for scheduling extended class...' className={textareaClass} />
            </div>
        </div>
    )
}

export default ExtraClassForm
