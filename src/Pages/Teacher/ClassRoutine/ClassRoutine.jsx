import React, { useState } from 'react'
import { Calendar, Users, GraduationCap, ShieldCheck } from 'lucide-react'
import TeacherWeeklyTimetable from './Components/TeacherWeeklyTimetable'
import TimetableChangePanel from '../../../Common/ClassTimetable/TimetableChangePanel'
import { useAuth } from '../../../context/AuthContext'
import {
    TEACHER_TIMETABLE_INFO,
    WEEKLY_SCHEDULE,
    ALLOTTED_CLASS_INFO,
    ALLOTTED_CLASS_SCHEDULE,
} from './classRoutineData'

const COORDINATOR_SUPERVISED_CLASSES = [
    { id: '10-A', name: 'Grade 10 - Section A', teacher: 'Anita Verma', room: 'Room 304', students: 42 },
    { id: '10-B', name: 'Grade 10 - Section B', teacher: 'Mr. Ravi Kumar', room: 'Room 305', students: 40 },
    { id: '9-A', name: 'Grade 9 - Section A', teacher: 'Ms. Anitha Verma', room: 'Room 204', students: 38 },
    { id: '9-B', name: 'Grade 9 - Section B', teacher: 'Mrs. Priya Nair', room: 'Room 205', students: 39 },
    { id: '11-A', name: 'Grade 11 - Science', teacher: 'Dr. Subramanian', room: 'Room 401', students: 35 },
    { id: '12-A', name: 'Grade 12 - Science', teacher: 'Dr. Suresh Menon', room: 'Room 402', students: 32 },
]

const ClassRoutine = () => {
    const { user } = useAuth()
    const roleKey = (user?.role || '').toLowerCase()
    const isCoordinator = roleKey.includes('coordinator')
    const isPrincipal = roleKey.includes('principal') || roleKey.includes('director') || roleKey.includes('admin')

    const [activeTab, setActiveTab] = useState('my-schedule')
    const [selectedCoordinatorClass, setSelectedCoordinatorClass] = useState(COORDINATOR_SUPERVISED_CLASSES[0].id)

    const activeSupervisedClass = COORDINATOR_SUPERVISED_CLASSES.find((c) => c.id === selectedCoordinatorClass) || COORDINATOR_SUPERVISED_CLASSES[0]

    return (
        <section className='space-y-6'>
            {/* Header & Role Scope Context */}
            <div className='bg-white rounded-2xl shadow-sm border border-slate-100 p-5'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h2 className='text-xl font-bold text-slate-800'>Academic Timetable</h2>
                            {isCoordinator && (
                                <span className='inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200'>
                                    <ShieldCheck size={13} />
                                    Secondary Wing Supervision (Grades 9–12)
                                </span>
                            )}
                            {!isCoordinator && !isPrincipal && (
                                <span className='inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200'>
                                    Class Teacher Scope Restricted
                                </span>
                            )}
                        </div>
                        <p className='text-sm text-slate-500 mt-1'>
                            {activeTab === 'my-schedule'
                                ? `Personal teaching schedule for ${user?.name || TEACHER_TIMETABLE_INFO.teacherName} (${TEACHER_TIMETABLE_INFO.employeeId})`
                                : isCoordinator
                                ? `Supervised wing class routine: ${activeSupervisedClass.name} (Mentor: ${activeSupervisedClass.teacher} • ${activeSupervisedClass.room})`
                                : `Allotted class routine for ${ALLOTTED_CLASS_INFO.className} (Class Teacher: ${ALLOTTED_CLASS_INFO.classTeacher} • ${ALLOTTED_CLASS_INFO.room} • ${ALLOTTED_CLASS_INFO.totalStudents} Students)`}
                        </p>
                    </div>

                    {/* View Switcher Tabs */}
                    <div className='flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-xl self-start md:self-auto'>
                        <button
                            type='button'
                            onClick={() => setActiveTab('my-schedule')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                                activeTab === 'my-schedule'
                                    ? 'bg-white text-[#515DEF] shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Calendar size={16} />
                            My Timetable
                        </button>
                        <button
                            type='button'
                            onClick={() => setActiveTab('class-routine')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                                activeTab === 'class-routine'
                                    ? 'bg-white text-[#515DEF] shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Users size={16} />
                            {isCoordinator ? 'Supervised Wing Classes' : `Allotted Class (${ALLOTTED_CLASS_INFO.className})`}
                        </button>
                    </div>
                </div>

                {/* Coordinator Wing Class Selector */}
                {isCoordinator && activeTab === 'class-routine' && (
                    <div className='mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100'>
                        <div className='flex items-center gap-2 text-xs font-semibold text-purple-900'>
                            <GraduationCap size={16} className='text-purple-600' />
                            <span>Select Supervised Class (Grades 9 to 12 only):</span>
                        </div>
                        <select
                            value={selectedCoordinatorClass}
                            onChange={(e) => setSelectedCoordinatorClass(e.target.value)}
                            className='px-3 py-1.5 text-xs font-semibold bg-white border border-purple-200 rounded-lg text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-400'
                        >
                            {COORDINATOR_SUPERVISED_CLASSES.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} — Class Teacher: {c.teacher} ({c.room})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <TimetableChangePanel
                requestedBy={user?.name || TEACHER_TIMETABLE_INFO.teacherName}
                requestedByRole={isCoordinator ? 'Academic Coordinator' : 'Class Teacher'}
            />

            {activeTab === 'my-schedule' ? (
                <TeacherWeeklyTimetable
                    schedule={WEEKLY_SCHEDULE}
                    mode='teacher'
                    teacherName={user?.name || TEACHER_TIMETABLE_INFO.teacherName}
                />
            ) : (
                <TeacherWeeklyTimetable
                    schedule={ALLOTTED_CLASS_SCHEDULE}
                    mode='class'
                    teacherName={user?.name || TEACHER_TIMETABLE_INFO.teacherName}
                />
            )}
        </section>
    )
}

export default ClassRoutine
