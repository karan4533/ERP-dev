import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { EllipsisIcon } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import { resolveTcNocManager } from '../../../Common/TcRequest/managerNocConfig'
import {
    getPendingManagerNocCount,
    hydrateTcRequestsFromApi,
    statusBadgeColor,
} from '../../../Common/TcRequest/tcRequestData'
import { canUseTcApi } from '../../../services/tcApi'

const TcNocList = () => {
    const location = useLocation()
    const manager = resolveTcNocManager(location.pathname)
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!canUseTcApi()) {
            setRows([])
            setError('Sign in with API auth to load TC NOC requests.')
            setLoading(false)
            return undefined
        }
        let active = true
        setLoading(true)
        hydrateTcRequestsFromApi()
            .then((list) => {
                if (!active) return
                setRows(list)
                setError('')
            })
            .catch((err) => {
                if (!active) return
                setRows([])
                setError(err?.message || 'Could not load TC NOC requests.')
            })
            .finally(() => {
                if (active) setLoading(false)
            })
        return () => { active = false }
    }, [])

    const pendingCount = useMemo(
        () => rows.filter((row) => {
            const mine = (row.nocs || []).find((n) => n.roleCode === manager.roleCode)
            return row.status === 'Pending Manager NOCs' && mine?.status === 'Pending'
        }).length,
        [rows, manager.roleCode],
    )

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-2xl font-semibold text-black'>TC NOC Clearance</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    {manager.label} NOC for Transfer Certificate dues / clearance.
                </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-sm font-medium text-[#808080]'>Assigned requests</p>
                    <p className='text-2xl font-semibold text-[#515DEF] mt-2'>{rows.length}</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-sm font-medium text-[#808080]'>Pending your NOC</p>
                    <p className='text-2xl font-semibold text-[#9C27B0] mt-2'>{pendingCount || getPendingManagerNocCount()}</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-sm font-medium text-[#808080]'>Completed / closed</p>
                    <p className='text-2xl font-semibold text-[#4CAF50] mt-2'>
                        {rows.filter((row) => {
                            const mine = (row.nocs || []).find((n) => n.roleCode === manager.roleCode)
                            return mine && mine.status !== 'Pending'
                        }).length}
                    </p>
                </div>
            </div>

            {loading ? <p className='text-sm text-[#667085]'>Loading…</p> : null}
            {error ? <p className='text-sm text-[#B42318]'>{error}</p> : null}

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-medium text-black mb-4'>TC requests needing {manager.label} NOC</h2>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5]'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Request</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>NOC</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className='px-2 py-8 text-center text-[#667085]'>
                                        {loading ? 'Loading…' : 'No TC NOC assignments for your role.'}
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => {
                                    const mine = (row.nocs || []).find((n) => n.roleCode === manager.roleCode)
                                    return (
                                        <tr key={row.id} className='border-b border-[#f2f4f7] text-[#667085] hover:bg-[#f2f4f7]'>
                                            <td className='px-2 py-4'>{row.requestId || row.id}</td>
                                            <td className='px-2 py-4'>{row.studentName}</td>
                                            <td className='px-2 py-4'>{row.classSection}</td>
                                            <td className='px-2 py-4'>
                                                <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[row.status] || statusBadgeColor.Pending}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className='px-2 py-4'>
                                                <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[mine?.status] || statusBadgeColor.Pending}`}>
                                                    {mine?.status || '—'}
                                                </span>
                                            </td>
                                            <td className='px-2 py-4'>
                                                <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                    <NavLink
                                                        to={`${manager.basePath}/view/${row.id}`}
                                                        className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        View / Decide
                                                    </NavLink>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}

export default TcNocList
