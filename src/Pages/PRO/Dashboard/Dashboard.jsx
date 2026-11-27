import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEnquiriesApi } from '../../../services/admissionsApi'
import { listAnnouncementsApi } from '../../../services/announcementsApi'
import { listActivitiesApi } from '../../../services/activitiesApi'

const asArray = (value) => (Array.isArray(value) ? value : [])

const Card = ({ label, value, hint, to }) => (
    <Link
        to={to}
        className='block bg-white rounded-2xl shadow-md p-4 border border-transparent hover:border-[#515DEF]/40 transition-colors'
    >
        <p className='text-sm text-[#667085]'>{label}</p>
        <p className='mt-2 text-2xl font-semibold text-[#1E1E1E]'>{value}</p>
        {hint ? <p className='mt-1 text-xs text-[#98A2B3]'>{hint}</p> : null}
    </Link>
)

const Dashboard = () => {
    const [status, setStatus] = useState('loading')
    const [error, setError] = useState('')
    const [enquiryCount, setEnquiryCount] = useState(null)
    const [announcementCount, setAnnouncementCount] = useState(null)
    const [activityCount, setActivityCount] = useState(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setStatus('loading')
            setError('')
            try {
                // allSettled: one failing endpoint must not blank the whole dashboard.
                const settled = await Promise.allSettled([
                    listEnquiriesApi(),
                    listAnnouncementsApi(),
                    listActivitiesApi('cultural'),
                    listActivitiesApi('sports'),
                    listActivitiesApi('competition'),
                ])
                if (cancelled) return

                const valueAt = (index) =>
                    settled[index].status === 'fulfilled' ? settled[index].value : null
                const failures = settled
                    .map((result, index) => (result.status === 'rejected' ? index : -1))
                    .filter((index) => index >= 0)

                const enquiries = asArray(valueAt(0))
                const announcements = asArray(valueAt(1))
                const activities = [
                    ...asArray(valueAt(2)),
                    ...asArray(valueAt(3)),
                    ...asArray(valueAt(4)),
                ]

                setEnquiryCount(valueAt(0) == null && failures.includes(0) ? null : enquiries.length)
                setAnnouncementCount(
                    valueAt(1) == null && failures.includes(1) ? null : announcements.length,
                )
                const activityFailed = [2, 3, 4].every((index) => failures.includes(index))
                setActivityCount(activityFailed ? null : activities.length)

                if (failures.length === settled.length) {
                    const first = settled.find((result) => result.status === 'rejected')
                    setError(first?.reason?.message || 'Could not load PRO dashboard figures.')
                    setStatus('error')
                    return
                }

                if (failures.length) {
                    setError('Some dashboard figures could not be loaded. Showing available counts only.')
                }
                setStatus('ready')
            } catch (err) {
                if (cancelled) return
                setError(err?.message || 'Could not load PRO dashboard figures.')
                setStatus('error')
            }
        })()
        return () => { cancelled = true }
    }, [])

    return (
        <section className='space-y-4'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>PRO Dashboard</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Live counts from admissions enquiries, announcements, and school activities. No demo figures.
                </p>
            </div>

            {status === 'loading' ? (
                <p className='text-sm text-[#667085]'>Loading public-relations figures…</p>
            ) : null}
            {error ? (
                <p className='text-sm text-[#B42318] bg-[#FEF3F2] rounded-lg px-3 py-2'>{error}</p>
            ) : null}

            {status === 'ready' ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <Card
                        label='Open enquiries'
                        value={enquiryCount == null ? '—' : enquiryCount}
                        hint='From /admissions/enquiries'
                        to='/pro/enquiries'
                    />
                    <Card
                        label='Announcements visible'
                        value={announcementCount == null ? '—' : announcementCount}
                        hint='From /announcements (read-only)'
                        to='/pro/announcements'
                    />
                    <Card
                        label='School activities'
                        value={activityCount == null ? '—' : activityCount}
                        hint='Cultural + sports + competitions'
                        to='/pro/events'
                    />
                </div>
            ) : null}

            <div className='bg-white rounded-2xl shadow-md p-4 space-y-2'>
                <h2 className='text-base font-semibold text-black'>Non-Academics focus</h2>
                <p className='text-sm text-[#667085]'>
                    Government Liaison Cases track correspondence, permits, and deadlines (Non-Academics §9.2).
                    Open <Link className='text-[#515DEF] underline' to='/pro/government-cases'>Government Liaison Cases</Link>.
                </p>
                <p className='text-sm text-[#667085]'>
                    Communication Reports and Settings remain pending. Announcements stay read-only for this role.
                </p>
            </div>
        </section>
    )
}

export default Dashboard
