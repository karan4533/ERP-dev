import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listDocumentRecordsApi } from '../../../services/documentsApi'
import { listFilesApi } from '../../../services/filesApi'

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
    const [studentCount, setStudentCount] = useState(null)
    const [staffCount, setStaffCount] = useState(null)
    const [libraryCount, setLibraryCount] = useState(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setStatus('loading')
            setError('')
            try {
                const [students, employees, library] = await Promise.all([
                    listDocumentRecordsApi('students'),
                    listDocumentRecordsApi('employees'),
                    listFilesApi({ kind: 'library' }),
                ])
                if (cancelled) return
                setStudentCount(Array.isArray(students) ? students.length : 0)
                setStaffCount(Array.isArray(employees) ? employees.length : 0)
                setLibraryCount(Array.isArray(library) ? library.length : 0)
                setStatus('ready')
            } catch (err) {
                if (cancelled) return
                setError(err?.message || 'Could not load File Room dashboard figures.')
                setStatus('error')
            }
        })()
        return () => { cancelled = true }
    }, [])

    return (
        <section className='space-y-4'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>File Room Dashboard</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Live counts from campus document folders and the file library. No demo figures.
                </p>
            </div>

            {status === 'loading' ? (
                <p className='text-sm text-[#667085]'>Loading campus document counts…</p>
            ) : null}
            {status === 'error' ? (
                <p className='text-sm text-[#B42318] bg-[#FEF3F2] rounded-lg px-3 py-2'>{error}</p>
            ) : null}

            {status === 'ready' ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <Card
                        label='Student document folders'
                        value={studentCount}
                        hint='From /documents/students'
                        to='/file-room/student-records'
                    />
                    <Card
                        label='Staff document folders'
                        value={staffCount}
                        hint='From /documents/employees'
                        to='/file-room/staff-records'
                    />
                    <Card
                        label='File library uploads'
                        value={libraryCount}
                        hint='From /files?kind=library'
                        to='/file-room/file-management'
                    />
                </div>
            ) : null}

            <div className='bg-white rounded-2xl shadow-md p-4 space-y-2'>
                <h2 className='text-base font-semibold text-black'>Non-Academics focus</h2>
                <p className='text-sm text-[#667085]'>
                    File Register and Issue / Return requests are live on campus ops collections
                    (Non-Academics §4.15). Open{' '}
                    <Link className='text-[#515DEF] underline' to='/file-room/file-register'>File Register</Link>
                    {' '}or{' '}
                    <Link className='text-[#515DEF] underline' to='/file-room/file-requests'>File Requests</Link>.
                </p>
                <p className='text-sm text-[#667085]'>
                    Archive &amp; Disposal automation, Activity &amp; Reports, and Settings remain pending.
                </p>
            </div>
        </section>
    )
}

export default Dashboard
