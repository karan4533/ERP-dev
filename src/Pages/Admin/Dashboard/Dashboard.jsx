import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { canUseDashboardApi, getAdminDashboardApi } from '../../../services/dashboardApi'

const CARDS = [
    { key: 'students', label: 'Students', to: '/admin/user-management/student-database', hint: 'Enrolled on this campus' },
    { key: 'employees', label: 'Employees', to: '/admin/user-management/employee-database', hint: 'HR records' },
    { key: 'leaveRequests', label: 'Leave requests', to: '/admin/leave-request/received', hint: 'Filed on this campus' },
    { key: 'openEscalations', label: 'Open escalations', to: '/admin/escalation-management', hint: 'Not yet closed' },
    { key: 'pendingTc', label: 'TC awaiting approval', to: '/admin/tc-request-approval', hint: 'Forwarded by PRM' },
    { key: 'unreadNotifications', label: 'Unread notifications', to: '/admin/notifications', hint: 'For this campus' },
    { key: 'announcementsThisMonth', label: 'Announcements this month', to: '/admin/announcement', hint: 'Sent in the current month' },
]

const Dashboard = () => {
    const api = canUseDashboardApi()
    const [snap, setSnap] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!api) return undefined
        let active = true
        getAdminDashboardApi()
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
                <h1 className='text-2xl font-semibold text-black'>Dashboard</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Live counts from the server for this campus{snap?.asOf ? ` · as of ${snap.asOf}` : ''}.
                </p>
            </div>
            {error ? <p className='text-sm text-[#B42318]'>{error}</p> : null}
            {!api ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-[#667085]'>Sign in with a backend account to see live figures.</div>
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
