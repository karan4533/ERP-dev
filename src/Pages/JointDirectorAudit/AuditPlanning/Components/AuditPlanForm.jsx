import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    AUDIT_TYPES,
    DEPARTMENTS,
    AUDITORS,
    PRIORITY_OPTIONS,
} from '../auditPlanningData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const SectionTitle = ({ children }) => (
    <h3 className='text-base font-semibold text-[#0C1E5B] border-b border-[#EEF0F6] pb-2 mb-4 mt-2 first:mt-0'>
        {children}
    </h3>
)

const AuditPlanForm = ({ initialData = {}, submitLabel = 'Save Changes' }) => {
    const [plannedDate, setPlannedDate] = useState(
        initialData.plannedDate ? new Date(initialData.plannedDate.split('-').reverse().join('-')) : new Date()
    )
    const [expectedCompletionDate, setExpectedCompletionDate] = useState(
        initialData.expectedCompletionDate
            ? new Date(initialData.expectedCompletionDate.split('-').reverse().join('-'))
            : new Date()
    )

    return (
        <div className='space-y-6'>
            <div>
                <SectionTitle>Audit Information</SectionTitle>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2 lg:col-span-3'>
                        <label htmlFor='audit-title' className='text-base font-medium text-[#1E1E1E]'>Audit Title</label>
                        <input
                            type='text'
                            id='audit-title'
                            defaultValue={initialData.title ?? ''}
                            className={inputClass}
                            placeholder='Enter audit title'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='audit-type' className='text-base font-medium text-[#1E1E1E]'>Audit Type</label>
                        <select id='audit-type' className={selectClass} defaultValue={initialData.auditType ?? ''}>
                            <option value='' disabled>Select audit type</option>
                            {AUDIT_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='department' className='text-base font-medium text-[#1E1E1E]'>Department</label>
                        <select id='department' className={selectClass} defaultValue={initialData.department ?? ''}>
                            <option value='' disabled>Select department</option>
                            {DEPARTMENTS.map((dept) => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <SectionTitle>Assignment</SectionTitle>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='assigned-auditor' className='text-base font-medium text-[#1E1E1E]'>Assigned Auditor</label>
                        <select id='assigned-auditor' className={selectClass} defaultValue={initialData.assignedAuditor ?? ''}>
                            <option value='' disabled>Select auditor</option>
                            {AUDITORS.map((auditor) => (
                                <option key={auditor} value={auditor}>{auditor}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2 lg:col-span-2'>
                        <label htmlFor='audit-team' className='text-base font-medium text-[#1E1E1E]'>Audit Team</label>
                        <input
                            type='text'
                            id='audit-team'
                            defaultValue={initialData.auditTeam ?? ''}
                            className={inputClass}
                            placeholder='e.g. R. Mehta, S. Priya'
                        />
                    </div>
                </div>
            </div>

            <div>
                <SectionTitle>Schedule</SectionTitle>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='planned-date' className='text-base font-medium text-[#1E1E1E]'>Planned Date</label>
                        <div className='relative'>
                            <DatePicker
                                id='planned-date'
                                selected={plannedDate}
                                onChange={(date) => setPlannedDate(date)}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='expected-completion' className='text-base font-medium text-[#1E1E1E]'>Expected Completion Date</label>
                        <div className='relative'>
                            <DatePicker
                                id='expected-completion'
                                selected={expectedCompletionDate}
                                onChange={(date) => setExpectedCompletionDate(date)}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <SectionTitle>Scope</SectionTitle>
                <div className='grid grid-cols-1 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='audit-scope' className='text-base font-medium text-[#1E1E1E]'>Audit Scope</label>
                        <textarea
                            id='audit-scope'
                            rows={3}
                            defaultValue={initialData.auditScope ?? ''}
                            className={`${inputClass} resize-none`}
                            placeholder='Describe the areas and processes covered by this audit'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='objectives' className='text-base font-medium text-[#1E1E1E]'>Objectives</label>
                        <textarea
                            id='objectives'
                            rows={3}
                            defaultValue={initialData.objectives ?? ''}
                            className={`${inputClass} resize-none`}
                            placeholder='Define audit objectives and expected outcomes'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='checklist-reference' className='text-base font-medium text-[#1E1E1E]'>Checklist Reference</label>
                        <input
                            type='text'
                            id='checklist-reference'
                            defaultValue={initialData.checklistReference ?? ''}
                            className={inputClass}
                            placeholder='e.g. FIN-CHK-2026-Q2'
                        />
                    </div>
                </div>
            </div>

            <div>
                <SectionTitle>Priority</SectionTitle>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='priority' className='text-base font-medium text-[#1E1E1E]'>Priority</label>
                        <select id='priority' className={selectClass} defaultValue={initialData.priority ?? ''}>
                            <option value='' disabled>Select priority</option>
                            {PRIORITY_OPTIONS.map((priority) => (
                                <option key={priority} value={priority}>{priority}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <input type='hidden' name='submit-label' value={submitLabel} readOnly />
        </div>
    )
}

export default AuditPlanForm
