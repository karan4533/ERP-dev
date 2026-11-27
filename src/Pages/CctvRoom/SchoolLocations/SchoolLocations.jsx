import React, { useEffect, useMemo, useState } from 'react'
import { listOpsCollectionApi } from '../../../services/opsApi'

const COLLECTION = 'security-cameras'

/**
 * Read-only locations derived from authorized camera register metadata.
 * Does not invent campus maps or unverified site data.
 */
const SchoolLocations = () => {
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
                setError(err?.message || 'Could not load camera locations.')
                setStatus('error')
            })
        return () => { cancelled = true }
    }, [])

    const locations = useMemo(() => {
        const map = new Map()
        rows.forEach((row) => {
            const key = String(row.location || '').trim() || 'Unspecified'
            const entry = map.get(key) || { location: key, cameras: 0, active: 0, offline: 0 }
            entry.cameras += 1
            if (row.status === 'Active') entry.active += 1
            if (row.status === 'Offline') entry.offline += 1
            map.set(key, entry)
        })
        return [...map.values()].sort((a, b) => a.location.localeCompare(b.location))
    }, [rows])

    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-[#0C1E5B]'>School Locations</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Distinct locations taken from the campus camera register. This is not a floor-plan or GIS map.
                </p>
            </div>

            {status === 'loading' ? (
                <p className='text-sm text-[#667085]'>Loading locations…</p>
            ) : null}
            {status === 'error' ? (
                <p className='text-sm text-[#B42318] bg-[#FEF3F2] rounded-lg px-3 py-2'>{error}</p>
            ) : null}

            {status === 'ready' ? (
                <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] uppercase text-[#0C1E5B]'>
                            <tr>
                                <th className='px-2 py-3'>Location</th>
                                <th className='px-2 py-3'>Cameras</th>
                                <th className='px-2 py-3'>Active</th>
                                <th className='px-2 py-3'>Offline</th>
                            </tr>
                        </thead>
                        <tbody>
                            {locations.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className='px-2 py-8 text-center text-[#667085]'>
                                        No camera locations on the register yet.
                                    </td>
                                </tr>
                            ) : (
                                locations.map((row) => (
                                    <tr key={row.location} className='border-b border-[#f2f4f7] text-[#667085]'>
                                        <td className='px-2 py-3 text-[#1E1E1E] font-medium'>{row.location}</td>
                                        <td className='px-2 py-3'>{row.cameras}</td>
                                        <td className='px-2 py-3'>{row.active}</td>
                                        <td className='px-2 py-3'>{row.offline}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </section>
    )
}

export default SchoolLocations
