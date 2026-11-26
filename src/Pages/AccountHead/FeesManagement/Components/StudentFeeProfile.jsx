import React from 'react'
import { BookOpen, Users } from 'lucide-react'
import { formatDisplayDate } from '../../financeDomain/financeHelpers'

const Field = ({ label, value }) => (
    <div>
        <p className='text-[11px] uppercase tracking-wide text-[#808080]'>{label}</p>
        <p className='text-sm font-medium text-[#1E1E1E] mt-0.5'>{value || '—'}</p>
    </div>
)

const StudentFeeProfile = ({ student, siblings = [], onViewSiblings }) => {
    if (!student) return null

    // Per-student vendor book fee details (Client Review Item)
    const bookFee = student.bookFee || 4850
    const bookVendor = student.bookVendor || 'Orient BlackSwan / NCERT Distribution Partner'
    const bookKit = student.bookKit || `${student.className || 'Class 10'} Standard Curriculum & Worksheet Kit`

    return (
        <div className='bg-white rounded-2xl shadow-md p-4 space-y-4'>
            <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4'>
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

            {/* Vendor Book Fee Breakdown Component (Direct Pass-Through) */}
            <div className='rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3'>
                <div className='flex items-start gap-2.5'>
                    <span className='rounded-lg bg-indigo-100 p-2 text-indigo-700 mt-0.5'>
                        <BookOpen size={18} />
                    </span>
                    <div>
                        <p className='text-xs font-bold text-indigo-950 uppercase tracking-wide'>
                            Vendor Book Fee Breakdown (Direct Pass-Through)
                        </p>
                        <p className='text-xs text-indigo-800 mt-0.5 font-medium'>
                            {bookKit}
                        </p>
                        <p className='text-[11px] text-slate-500 mt-0.5'>
                            Authorized Publisher: <span className='font-semibold text-slate-700'>{bookVendor}</span> · Zero institutional mark-up
                        </p>
                    </div>
                </div>
                <div className='flex items-center gap-3 self-end md:self-center'>
                    <div className='text-right'>
                        <span className='text-[10px] text-slate-500 uppercase block font-semibold'>Book Fee</span>
                        <span className='text-base font-bold text-indigo-700'>₹{bookFee.toLocaleString('en-IN')}</span>
                    </div>
                    <span className='rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800'>
                        Pass-Through Verified
                    </span>
                </div>
            </div>
        </div>
    )
}

export default StudentFeeProfile
