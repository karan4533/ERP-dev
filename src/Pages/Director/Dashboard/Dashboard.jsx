import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { apiRequest, getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'

const CARDS = [
    { key: 'students', label: 'Students', to: '/director/user-management/student-database', hint: 'Enrolled on this campus' },
    { key: 'employees', label: 'Employees', to: '/director/user-management/employee-database', hint: 'Campus HR directory' },
    { key: 'tasks', label: 'Open tasks', to: '/director/task-management/my-tasks', hint: 'Assigned to you' },
    { key: 'leave', label: 'Leave inbox', to: '/director/leave-request/received', hint: 'Awaiting your decision' },
    { key: 'approvals', label: 'Request approvals', to: '/director/request-approvals', hint: 'Pending campus requests' },
    { key: 'escalations', label: 'Open escalations', to: '/director/escalation-management', hint: 'Not yet closed' },
    { key: 'notifications', label: 'Notifications', to: '/director/notifications', hint: 'For your account' },
    { key: 'announcements', label: 'Announcements', to: '/director/broadcast', hint: 'Campus notices' },
]

const countList = (payload) => (Array.isArray(payload) ? payload.length : 0)

const openEscalations = (rows) =>
    Array.isArray(rows)
        ? rows.filter((row) => {
            const status = String(row?.status || '').toLowerCase()
            return status && status !== 'closed' && status !== 'resolved'
        }).length
        : 0

const pendingApprovals = (rows) =>
    Array.isArray(rows)
        ? rows.filter((row) => {
            const status = String(row?.status || row?.approvalStatus || '').toLowerCase()
            return !status || status === 'pending' || status === 'submitted'
        }).length
        : 0

const loadSnapshot = async () => {
    const [students, employees, tasks, leave, approvals, escalations, notifications, announcements] =
        await Promise.allSettled([
            apiRequest('/students'),
            apiRequest('/hr/portal/employees'),
            apiRequest('/tasks'),
            apiRequest('/leave-requests?box=received'),
            apiRequest('/request-approvals'),
            apiRequest('/escalations'),
            apiRequest('/notifications'),
            apiRequest('/announcements'),
        ])

    const value = (result, mapper = countList) =>
        result.status === 'fulfilled' ? mapper(result.value) : 0

    return {
        students: value(students),
        employees: value(employees),
        tasks: value(tasks),
        leave: value(leave),
        approvals: value(approvals, pendingApprovals),
        escalations: value(escalations, openEscalations),
        notifications: value(notifications),
        announcements: value(announcements),
        asOf: new Date().toISOString().slice(0, 10),
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
                <h1 className='text-2xl font-semibold text-black'>Director Dashboard</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Live counts from APIs you already have access to
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
