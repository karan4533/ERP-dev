import React, { useMemo } from 'react'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    STATUS_OPTIONS,
    getEnrolledStudentSelectOptions,
    mapStudentForGatePass,
    parseGatePassDate,
    formatGatePassDate,
    parseOutTimeForInput,
} from '../gatePassData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const readOnlyClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-[#F9FAFB] cursor-not-allowed'

const selectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '46px',
        borderColor: state.isFocused ? '#515DEF' : '#D9D9D9',
        boxShadow: state.isFocused ? '0 0 0 1px #515DEF' : 'none',
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
        '&:hover': {
            borderColor: '#515DEF',
        },
    }),
    menu: (base) => ({
        ...base,
        zIndex: 30,
        fontSize: '0.875rem',
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#515DEF' : state.isFocused ? '#EDEEF5' : '#fff',
        color: state.isSelected ? '#fff' : '#1E1E1E',
    }),
    placeholder: (base) => ({
        ...base,
        color: '#808080',
    }),
}

const StudentGatePassForm = ({ formData, onChange, errors = {} }) => {
    const studentOptions = useMemo(() => getEnrolledStudentSelectOptions(), [])

    const selectedStudent = useMemo(
        () => studentOptions.find((option) => option.value === formData.studentId) ?? null,
        [studentOptions, formData.studentId],
    )

    const gatePassDate = useMemo(
        () => (formData.date ? parseGatePassDate(formData.date) : new Date()),
        [formData.date],
    )

    const updateField = (key, value) => {
        onChange({ ...formData, [key]: value })
    }

    const handleStudentChange = (option) => {
        if (!option) {
            onChange({
                ...formData,
                studentId: '',
                studentName: '',
                classSection: '',
                gender: '',
                mobileNumber: '',
                city: '',
                profileImage: '',
            })
            return
        }

        const mapped = mapStudentForGatePass(option.value)
        if (!mapped) {
            onChange({ ...formData, studentId: option.value })
            return
        }

        onChange({
            ...formData,
            ...mapped,
        })
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2 md:col-span-2 lg:col-span-1'>
                <label htmlFor='studentId' className='text-base font-medium text-[#1E1E1E]'>
                    Student ID:
                </label>
                <Select
                    inputId='studentId'
                    options={studentOptions}
                    value={selectedStudent}
                    onChange={handleStudentChange}
                    isClearable
                    isSearchable
                    placeholder={studentOptions.length ? 'Search student ID or name...' : 'No enrolled students found'}
                    noOptionsMessage={() => 'No matching students'}
                    styles={selectStyles}
                    classNamePrefix='student-gate-pass-select'
                />
                {errors.studentId && <p className='text-xs text-[#FF0000]'>{errors.studentId}</p>}
                {studentOptions.length === 0 && (
                    <p className='text-xs text-[#667085]'>
                        Enroll students from the Admission List before creating a gate pass.
                    </p>
                )}
            </div>

            <div className='flex flex-col gap-y-2'>
                <label htmlFor='studentName' className='text-base font-medium text-[#1E1E1E]'>
                    Student Name:
                </label>
                <input
                    type='text'
                    id='studentName'
                    value={formData.studentName}
                    readOnly
                    placeholder='Auto-filled from student ID'
                    className={readOnlyClass}
                />
            </div>

            <div className='flex flex-col gap-y-2'>
                <label htmlFor='classSection' className='text-base font-medium text-[#1E1E1E]'>
                    Class & Section:
                </label>
                <input
                    type='text'
                    id='classSection'
                    value={formData.classSection}
                    readOnly
                    placeholder='Auto-filled from student ID'
                    className={readOnlyClass}
                />
            </div>

            <div className='flex flex-col gap-y-2'>
                <label htmlFor='gender' className='text-base font-medium text-[#1E1E1E]'>
                    Gender:
                </label>
                <input
                    type='text'
                    id='gender'
                    value={formData.gender}
                    readOnly
                    placeholder='Auto-filled from student ID'
                    className={readOnlyClass}
                />
            </div>

            <div className='flex flex-col gap-y-2'>
                <label htmlFor='mobileNumber' className='text-base font-medium text-[#1E1E1E]'>
                    Mobile Number:
                </label>
                <input
                    type='text'
                    id='mobileNumber'
                    value={formData.mobileNumber}
                    readOnly
                    placeholder='Auto-filled from student ID'
                    className={readOnlyClass}
                />
            </div>

            <div className='flex flex-col gap-y-2'>
                <label htmlFor='city' className='text-base font-medium text-[#1E1E1E]'>
                    City:
                </label>
                <input
                    type='text'
                    id='city'
                    value={formData.city}
                    readOnly
                    placeholder='Auto-filled from student ID'
                    className={readOnlyClass}
                />
            </div>

            <div className='flex flex-col gap-y-2 lg:col-span-3'>
                <label htmlFor='reason' className='text-base font-medium text-[#1E1E1E]'>
                    Reason:
                </label>
                <textarea
                    id='reason'
                    value={formData.reason}
                    onChange={(e) => updateField('reason', e.target.value)}
                    placeholder='Going to Hospital'
                    className={inputClass}
                    rows={2}
                />
                {errors.reason && <p className='text-xs text-[#FF0000]'>{errors.reason}</p>}
            </div>

            <div className='flex flex-col gap-y-2'>
                <label htmlFor='gatePassDate' className='text-base font-medium text-[#1E1E1E]'>
                    Date:
                </label>
                <div className='relative w-full'>
                    <DatePicker
                        id='gatePassDate'
                        selected={gatePassDate}
                        onChange={(date) => updateField('date', formatGatePassDate(date))}
                        isClearable
                        showMonthYearDropdown
                        scrollableMonthYearDropdown
                        dateFormat='dd/MM/yyyy'
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar
                        size={16}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                    />
                </div>
                {errors.date && <p className='text-xs text-[#FF0000]'>{errors.date}</p>}
            </div>

            <div className='flex flex-col gap-y-2'>
                <label htmlFor='outTime' className='text-base font-medium text-[#1E1E1E]'>
                    Out Time:
                </label>
                <input
                    type='time'
                    id='outTime'
                    value={parseOutTimeForInput(formData.outTime)}
                    onChange={(e) => updateField('outTime', e.target.value)}
                    className={inputClass}
                />
                {errors.outTime && <p className='text-xs text-[#FF0000]'>{errors.outTime}</p>}
            </div>

            <div className='flex flex-col gap-y-2'>
                <label htmlFor='status' className='text-base font-medium text-[#1E1E1E]'>
                    Status:
                </label>
                <select
                    id='status'
                    value={formData.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className={inputClass}
                >
                    {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
                {errors.status && <p className='text-xs text-[#FF0000]'>{errors.status}</p>}
            </div>
        </div>
    )
}

export default StudentGatePassForm
