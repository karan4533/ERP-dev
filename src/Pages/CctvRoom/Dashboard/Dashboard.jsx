import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listOpsCollectionApi } from '../../../services/opsApi'

const COLLECTION = 'security-cameras'
const STATUSES = ['Active', 'Offline', 'Under Maintenance', 'Removed']

const Card = ({ label, value, hint, to }) => {
    const body = (
        <>
            <p className='text-sm text-[#667085]'>{label}</p>
            <p className='mt-2 text-2xl font-semibold text-[#1E1E1E]'>{value}</p>
            {hint ? <p className='mt-1 text-xs text-[#98A2B3]'>{hint}</p> : null}
        </>
    )
    if (to) {
        return (
            <Link
                to={to}
                className='block bg-white rounded-2xl shadow-md p-4 border border-transparent hover:border-[#515DEF]/40 transition-colors'
            >
                {body}
            </Link>
        )
    }
    return <div className='bg-white rounded-2xl shadow-md p-4'>{body}</div>
}

const Dashboard = () => {
    const [status, setStatus] = useState('loading')
    const [error, setError] = useState('')
    const [rows, setRows] = useState([])

    useEffect(() => {
        let cancelled = false
        listOpsCollectionApi(COLLECTION)
            .then((data) => {
                if (cancelled) return
                setRows(Array.isArray(data) ? data : [])
                setStatus('ready')
            })
            .catch((err) => {
                if (cancelled) return
                setError(err?.message || 'Could not load the camera register.')
                setStatus('error')
            })
        return () => { cancelled = true }
    }, [])

    const counts = useMemo(() => {
        const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]))
        rows.forEach((row) => {
            if (byStatus[row.status] != null) byStatus[row.status] += 1
        })
        return byStatus
    }, [rows])

    const locationCount = useMemo(
        () => new Set(rows.map((row) => String(row.location || '').trim()).filter(Boolean)).size,
        [rows],
    )

    return (
        <section className='space-y-4'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>CCTV Room Dashboard</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Live counts from the campus camera register only. The ERP does not play video or invent incidents.
                </p>
            </div>

            {status === 'loading' ? (
                <p className='text-sm text-[#667085]'>Loading camera register…</p>
            ) : null}
            {status === 'error' ? (
                <p className='text-sm text-[#B42318] bg-[#FEF3F2] rounded-lg px-3 py-2'>{error}</p>
            ) : null}

            {status === 'ready' ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <Card
                        label='Registered cameras'
                        value={rows.length}
                        hint='From /ops/security-cameras'
                        to='/cctv-room/camera-management'
                    />
                    <Card label='Active' value={counts.Active} hint='Register status' />
                    <Card label='Offline' value={counts.Offline} hint='Register status' />
                    <Card label='Under maintenance' value={counts['Under Maintenance']} hint='Register status' />
                    <Card
                        label='Distinct locations'
                        value={locationCount}
                        hint='Derived from camera metadata'
                        to='/cctv-room/school-locations'
                    />
                </div>
            ) : null}

            <div className='bg-white rounded-2xl shadow-md p-4 space-y-2'>
                <h2 className='text-base font-semibold text-black'>Non-Academics focus</h2>
                <p className='text-sm text-[#667085]'>
                    Daily camera status checks and footage request / approval tracking are live
                    (Non-Academics §4.14). Open{' '}
                    <Link className='text-[#515DEF] underline' to='/cctv-room/camera-status'>Daily Camera Status</Link>
                    {' '}or{' '}
                    <Link className='text-[#515DEF] underline' to='/cctv-room/footage-requests'>Footage Requests</Link>.
                    Camera Room may also update register status on the shared camera register.
                </p>
                <p className='text-sm text-[#667085]'>
                    Live Monitoring, Recording &amp; Playback, NVR alerts, and Security Reports have no ERP/NVR
                    integration yet.
                </p>
            </div>
        </section>
    )
}

export default Dashboard
