import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ExamScheduleForm from './Components/ExamScheduleForm'
import { addExamSchedule } from './createExamScheduleData'

const AddExamSchedule = () => {
    const navigate = useNavigate()
    const [error, setError] = useState('')

    const handleSave = async (values) => {
        setError('')
        try {
            await addExamSchedule(values)
            navigate('/teacher/student-evaluation/exam')
        } catch (err) {
            setError(err?.message || 'Could not create exam schedule.')
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Create Exam Schedule Information</h2>
                <p className='mt-2 text-sm text-[#667085]'>
                    Campus create/submit needs Principal or Coordinator permission. Teachers should use the Principal timetable workflow.
                </p>
                {error ? <p className='mt-3 rounded-md border border-[#FDA29B] bg-[#FEF3F2] px-3 py-2 text-sm text-[#B42318]'>{error}</p> : null}
                <ExamScheduleForm onSubmit={handleSave} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/teacher/student-evaluation/exam')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='submit'
                    form='exam-schedule-form'
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddExamSchedule
