import React from 'react'
import { Users } from 'lucide-react'
import { formatDisplayDate } from '../../financeDomain/financeHelpers'

const Field = ({ label, value }) => (
    <div>
        <p className='text-[11px] uppercase tracking-wide text-[#808080]'>{label}</p>
        <p className='text-sm font-medium text-[#1E1E1E] mt-0.5'>{value || '—'}</p>
    </div>
)

const StudentFeeProfile = ({ student, siblings = [], onViewSiblings }) => {
    if (!student) return null

    return (
        <div className='bg-white rounded-2xl shadow-md p-4'>
            <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4'>
                <div>
                    <h3 className='text-lg font-semibold text-[#1E1E1E]'>{student.name}</h3>
                    <p className='text-sm text-[#667085] mt-0.5'>
                        {student.className}-{student.section} · {student.academicYear}
                    </p>
                </div>
                {siblings.length > 0 && (
                    <button
                        type='button'
                        onClick={onViewSiblings}
                        className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                    >
                        <Users size={16} />
                        View Sibling Fees
                    </button>
                )}
            </div>

            <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'>
                <Field label='Admission No.' value={student.admissionNo} />
                <Field label='Roll No.' value={student.rollNo} />
                <Field label='Class / Section' value={`${student.className}-${student.section}`} />
                <Field label='Academic Year' value={student.academicYear} />
                <Field label='Date of Birth' value={formatDisplayDate(student.dateOfBirth)} />
                <Field label='Blood Group' value={student.bloodGroup} />
                <Field label='Father Name' value={student.fatherName} />
                <Field label='Mother Name' value={student.motherName} />
                <Field label='Primary Phone' value={student.phone} />
                <Field label='Sibling Information' value={siblings.length ? siblings.map((item) => item.name).join(', ') : '—'} />
            </div>
        </div>
    )
}

export default StudentFeeProfile
