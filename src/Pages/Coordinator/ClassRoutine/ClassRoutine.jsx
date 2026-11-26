import { useState } from 'react'
import { Calendar, Users, ShieldCheck } from 'lucide-react'
import TeacherWeeklyTimetable from './Components/TeacherWeeklyTimetable'
import TimetableChangePanel from '../../../Common/ClassTimetable/TimetableChangePanel'
import {
    COORDINATOR_INFO,
    COORDINATOR_OWN_SCHEDULE,
    SUPERVISED_CLASSES_LIST,
    SUPERVISED_SCHEDULES_BY_CLASS
} from './classRoutineData'

const ClassRoutine = () => {
    const [activeTab, setActiveTab] = useState('my-schedule')
    const [selectedClassId, setSelectedClassId] = useState('10-A')

    const currentSupervisedClass = SUPERVISED_CLASSES_LIST.find((c) => c.id === selectedClassId) || SUPERVISED_CLASSES_LIST[0]
    const currentClassSchedule = SUPERVISED_SCHEDULES_BY_CLASS[selectedClassId] || SUPERVISED_SCHEDULES_BY_CLASS['10-A']

    return (
        <section className='space-y-6'>
            {/* Header & Role Scope Context */}
            <div className='bg-white rounded-2xl shadow-sm border border-slate-100 p-5'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h2 className='text-xl font-bold text-slate-800'>Coordinator Timetable Oversight</h2>
                            <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200'>
                                <ShieldCheck size={12} />
                                {COORDINATOR_INFO.wing}
                            </span>
                        </div>
                        <p className='text-sm text-slate-500 mt-1'>
                            {activeTab === 'my-schedule'
                                ? `Personal schedule & academic walkthroughs for ${COORDINATOR_INFO.coordinatorName} (${COORDINATOR_INFO.employeeId})`
                                : `Supervising timetable for ${currentSupervisedClass.name} (Class Teacher: ${currentSupervisedClass.classTeacher} • Room ${currentSupervisedClass.room} • ${currentSupervisedClass.totalStudents} Students)`
                            }
                        </p>
                    </div>

                    {/* View Switcher Tabs */}
                    <div className='flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl self-start md:self-auto'>
                        <button
                            type='button'
                            onClick={() => setActiveTab('my-schedule')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
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
                            onClick={() => setActiveTab('supervised-classes')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === 'supervised-classes'
                                    ? 'bg-white text-[#515DEF] shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Users size={16} />
                            Supervised Classes & Teachers
                        </button>
                    </div>
                </div>

                {/* Class selector for Supervised view */}
                {activeTab === 'supervised-classes' && (
                    <div className='mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3'>
                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Select Supervised Class:</span>
                            <div className='flex flex-wrap gap-1.5'>
                                {SUPERVISED_CLASSES_LIST.map((cls) => (
                                    <button
                                        key={cls.id}
                                        type='button'
                                        onClick={() => setSelectedClassId(cls.id)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                                            selectedClassId === cls.id
                                                ? 'bg-[#515DEF] text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                    >
                                        {cls.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <span className='text-xs text-slate-400'>
                            Restricted to Secondary Wing (Grades 9 to 12)
                        </span>
                    </div>
                )}
            </div>

            <TimetableChangePanel
                requestedBy={COORDINATOR_INFO.coordinatorName}
                requestedByRole='Coordinator'
            />

            {activeTab === 'my-schedule' ? (
                <TeacherWeeklyTimetable
                    schedule={COORDINATOR_OWN_SCHEDULE}
                    mode='coordinator'
                    coordinatorName={COORDINATOR_INFO.coordinatorName}
                />
            ) : (
                <TeacherWeeklyTimetable
                    schedule={currentClassSchedule}
                    mode='class'
                    coordinatorName={COORDINATOR_INFO.coordinatorName}
                />
            )}
        </section>
    )
}

export default ClassRoutine
