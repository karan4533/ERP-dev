import React from 'react'
import { CLASS_LEVEL_OPTIONS } from '../classDetailsOptions'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const ClassInfo = ({
    form,
    teachers = [],
    onChange,
}) => {
    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='className' className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                <select
                    id='className'
                    value={form.className}
                    onChange={(e) => onChange('className', e.target.value)}
                    className={inputClass}
                >
                    <option value=''>Select Class</option>
                    {CLASS_LEVEL_OPTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='classTeacher' className='text-base font-medium text-[#1E1E1E]'>Class Teacher:</label>
                <select
                    id='classTeacher'
                    value={form.classTeacherEmail}
                    onChange={(e) => {
                        const teacher = teachers.find((item) => item.email === e.target.value)
                        onChange({
                            classTeacherEmail: e.target.value,
                            classTeacher: teacher?.name || '',
                        })
                    }}
                    className={inputClass}
                >
                    <option value=''>Select Teacher</option>
                    {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.email}>
                            {teacher.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='classCapacity' className='text-base font-medium text-[#1E1E1E]'>Class Capacity:</label>
                <input
                    id='classCapacity'
                    type='text'
                    value={form.classCapacity}
                    onChange={(e) => onChange('classCapacity', e.target.value)}
                    placeholder='e.g. 40'
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='classRoomNumber' className='text-base font-medium text-[#1E1E1E]'>Class Room Number:</label>
                <input
                    id='classRoomNumber'
                    type='text'
                    value={form.classRoomNumber}
                    onChange={(e) => onChange('classRoomNumber', e.target.value)}
                    placeholder='e.g. 102'
                    className={inputClass}
                />
            </div>
        </div>
    )
}

export default ClassInfo
