import React, { useMemo } from 'react'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, User, Clock, ShieldCheck, Info } from 'lucide-react'
import {
    getEnrolledStudentSelectOptions,
    mapStudentForGatePass,
    parseGatePassDate,
    formatGatePassDate,
    parseOutTimeForInput,
} from '../gatePassData'

const inputClass =
    'text-sm font-normal text-slate-800 border border-slate-300 rounded-lg px-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white'

const readOnlyClass =
    'text-sm font-normal text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5 w-full bg-slate-50 cursor-not-allowed select-none'

const selectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '42px',
        borderColor: state.isFocused ? '#3B82F6' : '#CBD5E1',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        '&:hover': {
            borderColor: '#3B82F6',
        },
    }),
    menu: (base) => ({
        ...base,
        zIndex: 50,
        fontSize: '0.875rem',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#2563EB' : state.isFocused ? '#EFF6FF' : '#fff',
        color: state.isSelected ? '#fff' : '#1E293B',
        cursor: 'pointer',
    }),
    placeholder: (base) => ({
        ...base,
        color: '#94A3B8',
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
                department: '',
                gender: '',
                mobileNumber: '',
                city: '',
                parentGuardianInfo: '',
                accompanyingPerson: '',
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
        <div className='space-y-6'>
            {/* Notice Banner */}
            <div className='rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 flex items-start gap-3 text-xs text-blue-900'>
                <Info size={18} className='text-blue-600 shrink-0 mt-0.5' />
                <div>
                    <span className='font-semibold'>Simplified OR-Based Workflow:</span> Requests submitted by PRM / Front Office are automatically routed to both the <strong>Principal</strong> and <strong>Director of Academics</strong>. Either executive can sanction the pass, instantly generating the official security Gate Pass ID &amp; QR Code for Gatekeeper verification.
                </div>
            </div>

            {/* Section 1: Student Information (Auto-populated) */}
            <div>
                <h4 className='text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5'>
                    <User size={14} className='text-slate-400' /> 1. Student Identification (Auto-populated from SIS)
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='flex flex-col gap-1.5 md:col-span-2 lg:col-span-1'>
                        <label htmlFor='studentId' className='text-xs font-semibold text-slate-700'>
                            Student Search / ID <span className='text-rose-500'>*</span>
                        </label>
                        <Select
                            inputId='studentId'
                            options={studentOptions}
                            value={selectedStudent}
                            onChange={handleStudentChange}
                            isClearable
                            isSearchable
                            placeholder='Search student ID, name or class...'
                            noOptionsMessage={() => 'No students found'}
                            styles={selectStyles}
                            classNamePrefix='student-gate-pass-select'
                        />
                        {errors.studentId && <p className='text-xs text-rose-500'>{errors.studentId}</p>}
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label className='text-xs font-semibold text-slate-700'>Student Full Name</label>
                        <input
                            type='text'
                            value={formData.studentName || ''}
                            readOnly
                            placeholder='Auto-filled from student selection'
                            className={readOnlyClass}
                        />
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label className='text-xs font-semibold text-slate-700'>Class &amp; Section</label>
                        <input
                            type='text'
                            value={formData.classSection || ''}
                            readOnly
                            placeholder='Auto-filled'
                            className={readOnlyClass}
                        />
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label className='text-xs font-semibold text-slate-700'>Academic Department</label>
                        <input
                            type='text'
                            value={formData.department || 'Academics - Secondary'}
                            readOnly
                            className={readOnlyClass}
                        />
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label className='text-xs font-semibold text-slate-700'>Student Contact / City</label>
                        <input
                            type='text'
                            value={`${formData.mobileNumber || '—'} • ${formData.city || 'Madurai'}`}
                            readOnly
                            className={readOnlyClass}
                        />
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label className='text-xs font-semibold text-slate-700'>Parent / Guardian on Record</label>
                        <input
                            type='text'
                            value={formData.parentGuardianInfo || ''}
                            readOnly
                            placeholder='Auto-filled from SIS profile'
                            className={readOnlyClass}
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Exit Logistics & Timings */}
            <div>
                <h4 className='text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5'>
                    <Clock size={14} className='text-slate-400' /> 2. Departure Details &amp; Timings
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='flex flex-col gap-1.5'>
                        <label htmlFor='gatePassDate' className='text-xs font-semibold text-slate-700'>
                            Date of Movement <span className='text-rose-500'>*</span>
                        </label>
                        <div className='relative w-full'>
                            <DatePicker
                                id='gatePassDate'
                                selected={gatePassDate}
                                onChange={(date) => updateField('date', formatGatePassDate(date))}
                                showMonthYearDropdown
                                dateFormat='dd-MM-yyyy'
                                className='w-full text-sm text-slate-800 border border-slate-300 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                            />
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
                            />
                        </div>
                        {errors.date && <p className='text-xs text-rose-500'>{errors.date}</p>}
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label htmlFor='expectedDepartureTime' className='text-xs font-semibold text-slate-700'>
                            Expected Departure Time <span className='text-rose-500'>*</span>
                        </label>
                        <input
                            type='text'
                            id='expectedDepartureTime'
                            value={formData.expectedDepartureTime || formData.outTime || ''}
                            onChange={(e) => {
                                updateField('expectedDepartureTime', e.target.value)
                                updateField('outTime', e.target.value)
                            }}
                            placeholder='e.g. 11:30 AM'
                            className={inputClass}
                        />
                        {errors.expectedDepartureTime && (
                            <p className='text-xs text-rose-500'>{errors.expectedDepartureTime}</p>
                        )}
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label htmlFor='expectedReturnTime' className='text-xs font-semibold text-slate-700'>
                            Expected Return Time <span className='text-rose-500'>*</span>
                        </label>
                        <input
                            type='text'
                            id='expectedReturnTime'
                            value={formData.expectedReturnTime || ''}
                            onChange={(e) => updateField('expectedReturnTime', e.target.value)}
                            placeholder='e.g. 03:00 PM'
                            className={inputClass}
                        />
                        {errors.expectedReturnTime && (
                            <p className='text-xs text-rose-500'>{errors.expectedReturnTime}</p>
                        )}
                    </div>

                    <div className='flex flex-col gap-1.5 md:col-span-2'>
                        <label htmlFor='accompanyingPerson' className='text-xs font-semibold text-slate-700'>
                            Accompanying Person / Escort
                        </label>
                        <input
                            type='text'
                            id='accompanyingPerson'
                            value={formData.accompanyingPerson || ''}
                            onChange={(e) => updateField('accompanyingPerson', e.target.value)}
                            placeholder='e.g. Suresh Sharma (Father, Contact: +91 98401 22334) or Self'
                            className={inputClass}
                        />
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label className='text-xs font-semibold text-slate-700'>Approval Workflow Status</label>
                        <div className='flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-xs font-semibold text-amber-800'>
                            <ShieldCheck size={16} className='text-amber-600' />
                            <span>Pending Approval (Principal / Director)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Reason & Instructions */}
            <div className='space-y-4'>
                <div className='flex flex-col gap-1.5'>
                    <label htmlFor='reason' className='text-xs font-semibold text-slate-700'>
                        Reason for Leaving <span className='text-rose-500'>*</span>
                    </label>
                    <textarea
                        id='reason'
                        value={formData.reason || ''}
                        onChange={(e) => updateField('reason', e.target.value)}
                        placeholder='State the verified medical, family, academic or emergency reason...'
                        className={inputClass}
                        rows={2}
                    />
                    {errors.reason && <p className='text-xs text-rose-500'>{errors.reason}</p>}
                </div>

                <div className='flex flex-col gap-1.5'>
                    <label htmlFor='remarks' className='text-xs font-semibold text-slate-700'>
                        Detailed Instructions / Special Security Remarks (Optional)
                    </label>
                    <input
                        type='text'
                        id='remarks'
                        value={formData.remarks || ''}
                        onChange={(e) => updateField('remarks', e.target.value)}
                        placeholder='e.g. Doctor appointment slip verified; student will re-enter via Gate #1'
                        className={inputClass}
                    />
                </div>
            </div>
        </div>
    )
}

export default StudentGatePassForm
