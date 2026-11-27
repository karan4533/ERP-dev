import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { apiRequest, getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'

const today = () => new Date().toISOString().slice(0, 10)

const CARDS = [
    { key: 'students', label: 'Students', to: '/coordinator/user-management/students-list', hint: 'Campus roster (students.read)' },
    { key: 'attendance', label: 'Attendance marks today', to: '/coordinator/attendance/class-attendance', hint: `For ${today()}` },
    { key: 'lessonPlans', label: 'My lesson plans', to: '/coordinator/lesson-plan/my-lesson-plan', hint: 'Submitted plans' },
    { key: 'tasks', label: 'My tasks', to: '/coordinator/task-management/my-tasks', hint: 'Assigned to you' },
    { key: 'leave', label: 'My leave', to: '/coordinator/leave-request/my-requests', hint: 'Filed by you' },
    { key: 'notifications', label: 'Notifications', to: '/coordinator/notifications', hint: 'For your account' },
    { key: 'announcements', label: 'Announcements', to: '/coordinator/announcement', hint: 'Campus notices' },
    { key: 'exams', label: 'Exam schedules', to: '/coordinator/student-evaluation/exam', hint: 'Schedules (exams.write available)' },
]

const countList = (payload) => (Array.isArray(payload) ? payload.length : 0)

const loadSnapshot = async () => {
    const [students, attendance, lessonPlans, tasks, leave, notifications, announcements, exams] =
        await Promise.allSettled([
            apiRequest('/students'),
            apiRequest(`/attendance?date=${today()}`),
            apiRequest('/lesson-plans?mine=true'),
            apiRequest('/tasks'),
            apiRequest('/leave-requests?box=mine'),
            apiRequest('/notifications'),
            apiRequest('/announcements'),
            apiRequest('/exams'),
        ])

    const value = (result) => (result.status === 'fulfilled' ? countList(result.value) : 0)

    return {
        students: value(students),
        attendance: value(attendance),
        lessonPlans: value(lessonPlans),
        tasks: value(tasks),
        leave: value(leave),
        notifications: value(notifications),
        announcements: value(announcements),
        exams: value(exams),
        asOf: today(),
    }
}

const Dashboard = () => {
    const api = isApiAuthEnabled() && Boolean(getAccessToken())
    const [snap, setSnap] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!api) return undefined
        let active = true
        loadSnapshot()
            .then((row) => {
                if (active) {
                    setSnap(row)
                    setError('')
                }
            })
            .catch((caught) => {
                if (active) setError(caught?.message || 'Dashboard figures could not be loaded.')
            })
        return () => {
            active = false
        }
    }, [api])

    return (
        <section className='space-y-6'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>Coordinator Dashboard</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Live counts from APIs available to your role
                    {snap?.asOf ? ` · as of ${snap.asOf}` : ''}.
                </p>
            </div>
            {error ? <p className='text-sm text-[#B42318]'>{error}</p> : null}
            {!api ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-[#667085]'>
                    Sign in with a backend account to see live figures.
                </div>
            ) : !snap && !error ? (
                <p className='text-[#667085]'>Loading dashboard…</p>
            ) : snap ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {CARDS.map((card) => (
                        <NavLink
                            key={card.key}
                            to={card.to}
                            className='bg-white rounded-2xl shadow-md p-5 border border-[#EEF0F6] hover:border-[#515DEF] transition-colors'
                        >
                            <p className='text-sm font-medium text-[#808080]'>{card.label}</p>
                            <p className='text-3xl font-bold text-[#0C1E5B] mt-2'>{snap[card.key] ?? 0}</p>
                            <p className='text-xs text-[#667085] mt-1'>{card.hint}</p>
                        </NavLink>
                    ))}
                </div>
            ) : null}
        </section>
    )
}

export default Dashboard
