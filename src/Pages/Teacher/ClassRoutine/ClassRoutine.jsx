import React from 'react'
import TeacherWeeklyTimetable from './Components/TeacherWeeklyTimetable'
// Hidden for now — re-enable when timetable change requests are implemented.
// import TimetableChangePanel from '../../../Common/ClassTimetable/TimetableChangePanel'
import { useTeacherAssignments } from '../../../Common/Teacher/useTeacherAssignments'

const ClassRoutine = () => {
    const assignments = useTeacherAssignments()
    const teacherName = assignments.profile.name || 'Teacher'
    const employeeId = assignments.profile.employeeId || '—'
    const subjects = assignments.subjects

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-medium text-black'>Class Timetable</h2>
                <p className='text-sm text-[#808080] mt-1'>
                    Weekly view for {teacherName} ({employeeId})
                    {subjects.length ? ` — ${subjects.join(', ')}` : ''}
                </p>
                {assignments.emptyReason ? (
                    <p className='text-sm text-[#B54708] mt-2'>{assignments.emptyReason}</p>
                ) : null}
                {!assignments.weeklyFromTimetables.hasData && assignments.ready ? (
                    <p className='text-sm text-[#667085] mt-2'>
                        No approved/pending class timetable periods match your name yet. Ask Principal to publish a Class Timetable that lists you as the teacher.
                    </p>
                ) : null}
            </div>

            {/* <TimetableChangePanel requestedBy={teacherName} requestedByRole='Teacher' /> */}
            <TeacherWeeklyTimetable />
        </section>
    )
}

export default ClassRoutine
