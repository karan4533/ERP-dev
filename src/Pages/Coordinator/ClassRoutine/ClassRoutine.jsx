import React from 'react'
import TeacherWeeklyTimetable from './Components/TeacherWeeklyTimetable'
import TimetableChangePanel from '../../../Common/ClassTimetable/TimetableChangePanel'
import { TEACHER_TIMETABLE_INFO } from './classRoutineData'

const ClassRoutine = () => {
    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-medium text-black'>Class Timetable</h2>
                <p className='text-sm text-[#808080] mt-1'>
                    Weekly view for {TEACHER_TIMETABLE_INFO.subject} — {TEACHER_TIMETABLE_INFO.teacherName} ({TEACHER_TIMETABLE_INFO.employeeId})
                </p>
            </div>

            <TimetableChangePanel requestedBy='Priya Nair' requestedByRole='Coordinator' />
            <TeacherWeeklyTimetable />
        </section>
    )
}

export default ClassRoutine
