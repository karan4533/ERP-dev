import React, { useEffect, useState } from 'react'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import { apiRequest, getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'

const BusRouteDetails = () => {
    const { activeStudent } = useActiveStudent()
    const [status, setStatus] = useState('loading')
    const [assignment, setAssignment] = useState(null)
    const [route, setRoute] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!isApiAuthEnabled() || !getAccessToken()) {
            setStatus('empty')
            return undefined
        }
        let cancelled = false
        setStatus('loading')
        apiRequest('/ops/my-transport')
            .then((payload) => {
                if (cancelled) return
                const keys = new Set([
                    String(activeStudent?.id || ''),
                    String(activeStudent?.admissionNumber || activeStudent?.admissionNo || ''),
                ].filter(Boolean))
                const rows = payload?.assignments || []
                const match = rows.find((row) => keys.has(String(row.studentId || row.student_id || ''))) || rows[0] || null
                const routeId = String(match?.routeId || match?.route || '')
                const foundRoute = (payload?.routes || []).find((row) => (
                    String(row.id || '') === routeId
                    || String(row.routeName || row.name || '') === routeId
                )) || null
                setAssignment(match)
                setRoute(foundRoute)
                setStatus(match ? 'ready' : 'empty')
            })
            .catch((err) => {
                if (cancelled) return
                setError(err?.message || 'Transport details could not be loaded.')
                setStatus('error')
            })
        return () => { cancelled = true }
    }, [activeStudent?.id, activeStudent?.admissionNumber, activeStudent?.admissionNo])

    return (
        <section className='bg-white rounded-2xl shadow-md p-6 space-y-3'>
            <h2 className='text-xl font-semibold text-black'>Bus Route Details</h2>
            {status === 'loading' && <p className='text-sm text-[#667085]'>Loading transport assignment…</p>}
            {status === 'error' && <p className='text-sm text-red-600'>{error}</p>}
            {status === 'empty' && (
                <p className='text-sm text-[#667085]'>
                    {activeStudent?.name
                        ? `No transport route is assigned for ${activeStudent.name} yet.`
                        : 'No transport route is assigned yet.'}
                </p>
            )}
            {status === 'ready' && assignment && (
                <dl className='grid gap-2 text-sm text-[#344054] sm:grid-cols-2'>
                    <div><dt className='text-[#667085]'>Student</dt><dd>{assignment.studentName || activeStudent?.name || assignment.studentId}</dd></div>
                    <div><dt className='text-[#667085]'>Route</dt><dd>{route?.routeName || route?.name || assignment.routeName || assignment.routeId || 'Assigned'}</dd></div>
                    <div><dt className='text-[#667085]'>Stop</dt><dd>{assignment.stopName || assignment.pickupPoint || assignment.stop || '—'}</dd></div>
                    <div><dt className='text-[#667085]'>Vehicle</dt><dd>{assignment.vehicleNumber || assignment.vehicle || route?.vehicleNumber || '—'}</dd></div>
                    <div><dt className='text-[#667085]'>Driver</dt><dd>{assignment.driverName || route?.driverName || '—'}</dd></div>
                </dl>
            )}
            <p className='text-xs text-[#667085]'>Use Track Bus for live GPS when the school has linked a vehicle.</p>
        </section>
    )
}

export default BusRouteDetails
