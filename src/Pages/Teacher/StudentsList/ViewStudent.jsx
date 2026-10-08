import React from 'react'
import { useNavigate, useParams, NavLink } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { getStudentById } from './studentsListData'
import StudentAttendanceDetails from './Components/StudentAttendanceDetails'
import StudentResultDetails from './Components/StudentResultDetails'

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>
            {value || '—'}
        </span>
    </div>
)

const ViewStudent = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const student = getStudentById(id)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/teacher/user-management/students-list')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!student ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Student record not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-wrap items-start gap-4 mb-6'>
                            <img src={student.profile} alt={student.name} className='w-16 h-16 rounded-full object-cover' />
                            <div>
                                <h1 className='text-2xl font-semibold text-black'>{student.name}</h1>
                                <p className='text-sm text-[#667085] mt-1'>
                                    {student.admissionNumber} · Class {student.classSection}
                                </p>
                            </div>
                        </div>

                        <h2 className='text-xl font-semibold text-black mb-6'>Personal Information</h2>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Full Name' value={student.name} />
                            <Field label='Email address' value={student.email} />
                            <Field label='Mobile Number' value={student.mobileNumber} />
                            <Field label='Class & Section' value={student.classSection} />
                            <Field label='Roll Number' value={student.rollNumber} />
                            <Field label='Admission Number' value={student.admissionNumber} />
                            <Field label='Date Of Birth' value={student.dateOfBirth} />
                        </div>

                        <NavLink
                            to={`/teacher/user-management/students-list/view/${id}/full`}
                            className='inline-flex items-center gap-2 mt-6 text-sm font-medium text-[#515DEF] hover:opacity-80 transition-opacity'
                        >
                            View more
                            <ChevronRight size={16} />
                        </NavLink>
                    </div>

                    <div>
                        <h2 className='text-xl font-semibold text-black mb-4'>Attendance Information</h2>
                        <StudentAttendanceDetails />
                    </div>

                    <div>
                        <h2 className='text-xl font-semibold text-black mb-4'>Results</h2>
                        <StudentResultDetails />
                    </div>
                </>
            )}
        </section>
    )
}

export default ViewStudent
