import React from 'react'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import { formatGradeSection } from '../studentPortalConfig'

const StudentDashboard = () => {
    const { activeStudent, isParentPortal } = useActiveStudent()

    return (
        <div className='bg-white rounded-lg border border-[#e4e7ec] p-6'>
            <p className='text-sm font-medium text-[#515DEF] uppercase tracking-wide'>
                {isParentPortal ? 'Parent Portal' : 'Student Portal'}
            </p>
            <h2 className='text-xl font-semibold text-[#313131] mt-2'>
                Welcome, {activeStudent.name}
            </h2>
            <p className='text-sm text-[#667085] mt-2'>
                {formatGradeSection(activeStudent)} · Roll No. {activeStudent.rollNumber}
            </p>
            <p className='text-sm text-[#667085] mt-2'>
                Your student portal is ready. Use the sidebar to access class, evaluation, deliverables, and more.
            </p>
        </div>
    )
}

export default StudentDashboard
