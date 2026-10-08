import React from 'react'
import { getDepartmentInfo } from '../executeAuditData'

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-xs font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E]'>{value || '—'}</span>
    </div>
)

const DepartmentInfoCard = ({ header }) => {
    const dept = getDepartmentInfo(header.department)

    return (
        <div className='bg-white rounded-2xl shadow-md p-4'>
            <h3 className='text-base font-semibold text-black mb-4'>Department Information</h3>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 pb-4 border-b border-[#EDEEF5]'>
                <Field label='Department Head' value={dept.departmentHead} />
                <Field label='Coordinator' value={dept.coordinator} />
                <Field label='Location' value={dept.location} />
                <Field label='Audit Frequency' value={header.frequency ?? dept.frequency} />
                <Field label='Previous Score' value={`${dept.previousScore}%`} />
                <Field label='Previous Audit Date' value={dept.previousAuditDate} />
            </div>

            <h3 className='text-base font-semibold text-black mb-4'>Audit Information</h3>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'>
                <Field label='Audit Number' value={header.auditNumber} />
                <Field label='Audit Name' value={header.auditName} />
                <Field label='Department' value={header.department} />
                <Field label='Campus' value={header.campus} />
                <Field label='Building' value={header.building} />
                <Field label='Floor' value={header.floor} />
                <Field label='Area' value={header.area} />
                <Field label='Auditor Name' value={header.auditorName} />
                <Field label='Audit Date' value={header.auditDate} />
                <Field label='Audit Time' value={header.auditTime} />
                <Field label='Version' value={header.version} />
            </div>
        </div>
    )
}

export default DepartmentInfoCard
