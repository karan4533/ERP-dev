import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEnquiriesApi } from '../../../services/admissionsApi'
import { listAnnouncementsApi } from '../../../services/announcementsApi'
import { listTcRequestsApi } from '../../../services/tcApi'

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
    const [tcPendingCount, setTcPendingCount] = useState(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setStatus('loading')
            setError('')
            try {
                const settled = await Promise.allSettled([
                    listEnquiriesApi(),
                    listAnnouncementsApi(),
                    listTcRequestsApi(),
                ])
                if (cancelled) return

                const valueAt = (index) =>
                    settled[index].status === 'fulfilled' ? settled[index].value : null
                const failures = settled
                    .map((result, index) => (result.status === 'rejected' ? index : -1))
                    .filter((index) => index >= 0)

                const enquiries = asArray(valueAt(0))
                const announcements = asArray(valueAt(1))
                const tcRequests = asArray(valueAt(2))
                const tcPending = tcRequests.filter((row) => {
                    const s = String(row.status || row.Status || '').toLowerCase()
                    return s.includes('pending')
                }).length

                setEnquiryCount(valueAt(0) == null && failures.includes(0) ? null : enquiries.length)
                setAnnouncementCount(
                    valueAt(1) == null && failures.includes(1) ? null : announcements.length,
                )
                setTcPendingCount(valueAt(2) == null && failures.includes(2) ? null : tcPending)

                if (failures.length === settled.length) {
                    const first = settled.find((result) => result.status === 'rejected')
                    setError(first?.reason?.message || 'Could not load PRM dashboard figures.')
                    setStatus('error')
                    return
                }
                if (failures.length) {
                    setError('Some dashboard figures could not be loaded. Showing available counts only.')
                }
                setStatus('ready')
            } catch (err) {
                if (cancelled) return
                setError(err?.message || 'Could not load PRM dashboard figures.')
                setStatus('error')
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <section className='space-y-4'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>PRM Dashboard</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Live front-office counts for enquiries, announcements, and pending TC requests.
                </p>
            </div>

            {status === 'loading' ? (
                <p className='text-sm text-[#667085]'>Loading front-office figures…</p>
            ) : null}
            {error ? (
                <p className='text-sm text-[#B42318] bg-[#FEF3F2] rounded-lg px-3 py-2'>{error}</p>
            ) : null}

            {status === 'ready' || status === 'error' ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <Card
                        label='Admission enquiries'
                        value={enquiryCount == null ? '—' : enquiryCount}
                        hint='From /admissions/enquiries'
                        to='/front-office/admission-enquiry'
                    />
                    <Card
                        label='Announcements'
                        value={announcementCount == null ? '—' : announcementCount}
                        hint='From /announcements'
                        to='/front-office/announcement'
                    />
                    <Card
                        label='Pending TC requests'
                        value={tcPendingCount == null ? '—' : tcPendingCount}
                        hint='From /tc-requests'
                        to='/front-office/tc-request'
                    />
                </div>
            ) : null}

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-lg font-medium text-[#1E1E1E] mb-3'>Quick links</h2>
                <div className='flex flex-wrap gap-2'>
                    <Link className='text-sm text-[#515DEF] hover:underline' to='/front-office/admission-enquiry'>
                        Admission Enquiry
                    </Link>
                    <span className='text-[#D0D5DD]'>·</span>
                    <Link className='text-sm text-[#515DEF] hover:underline' to='/front-office/admission-list'>
                        Admission List
                    </Link>
                    <span className='text-[#D0D5DD]'>·</span>
                    <Link className='text-sm text-[#515DEF] hover:underline' to='/front-office/student-management'>
                        Student Database
                    </Link>
                    <span className='text-[#D0D5DD]'>·</span>
                    <Link className='text-sm text-[#515DEF] hover:underline' to='/front-office/gate-pass-list'>
                        Gate Pass
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default Dashboard
