import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnlineClassForm from './Components/OnlineClassForm'
import { addOnlineClass } from './onlineClassData'
import { useTeacherAssignments } from '../../../Common/Teacher/useTeacherAssignments'

const AddOnlineClass = ({ listPath = '/teacher/class/online-class' }) => {
    const navigate = useNavigate()
    const assignments = useTeacherAssignments()
    const [error, setError] = useState('')

    const handleSubmit = (values) => {
        if (!values.subject || !values.className || !values.section || !values.topic || !values.date) {
            setError('Subject, class, section, topic, and date are required.')
            return
        }
        addOnlineClass(values, {
            teacherEmail: assignments.profile.email,
            teacherName: assignments.profile.name,
            createdBy: assignments.profile.email,
        })
        navigate(listPath)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Online Class Information</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Saved to the campus academics database. Class options are limited to your assigned classes.
                </p>
                {error ? <p className='text-sm text-[#B42318] mt-3'>{error}</p> : null}
                {assignments.emptyReason ? (
                    <p className='text-sm text-[#B54708] mt-3'>{assignments.emptyReason}</p>
                ) : null}
                <OnlineClassForm
                    formId='online-class-form'
                    onSubmit={handleSubmit}
                    classOptions={assignments.classes}
                    sectionOptions={assignments.sectionsFor('')}
                    subjectOptions={assignments.subjects}
                />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate(listPath)}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='submit'
                    form='online-class-form'
                    disabled={!assignments.classes.length}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-40'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddOnlineClass
