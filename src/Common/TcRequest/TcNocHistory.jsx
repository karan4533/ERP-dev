import React from 'react'
import { statusBadgeColor } from './tcRequestData'

const formatWhen = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return String(iso)
    return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })
}

/** Shared manager NOC timeline for FO / Admin / TM / Student views. */
const TcNocHistory = ({ nocs = [], title = 'Manager NOC clearance' }) => {
    const rows = Array.isArray(nocs) ? nocs : []
    if (!rows.length) {
        return (
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black mb-2'>{title}</h2>
                <p className='text-sm text-[#667085]'>No manager NOCs required for this student.</p>
            </div>
        )
    }

    return (
        <div className='bg-white rounded-2xl shadow-md p-4'>
            <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
            <div className='overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>
                            <th className='px-2 py-3 text-[#0C1E5B] font-medium uppercase'>Authority</th>
                            <th className='px-2 py-3 text-[#0C1E5B] font-medium uppercase'>Status</th>
                            <th className='px-2 py-3 text-[#0C1E5B] font-medium uppercase'>Decided by</th>
                            <th className='px-2 py-3 text-[#0C1E5B] font-medium uppercase'>When</th>
                            <th className='px-2 py-3 text-[#0C1E5B] font-medium uppercase'>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((noc) => (
                            <tr key={noc.id || noc.roleCode} className='border-b border-[#f2f4f7] text-[#667085] align-top'>
                                <td className='px-2 py-3'>
                                    {noc.roleLabel || noc.roleCode}
                                    {noc.status === 'Pending' && noc.clearingUserActive === false ? (
                                        <p className='text-xs text-[#B42318] mt-1'>No active user holds this role on the campus.</p>
                                    ) : null}
                                </td>
                                <td className='px-2 py-3'>
                                    <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[noc.status] || statusBadgeColor.Pending}`}>
                                        {noc.status}
                                    </span>
                                    {noc.overridden ? (
                                        <span className='ml-1 inline-flex px-2 py-1 rounded-lg text-xs font-semibold bg-[#7A5AF833] text-[#6941C6]'>
                                            Admin override
                                        </span>
                                    ) : null}
                                </td>
                                <td className='px-2 py-3'>
                                    {noc.decidedByEmail || noc.decidedByName || '—'}
                                    {noc.overridden && noc.override?.overriddenByRole ? (
                                        <p className='text-xs text-[#667085] mt-1'>Role: {noc.override.overriddenByRole}</p>
                                    ) : null}
                                </td>
                                <td className='px-2 py-3'>{formatWhen(noc.decidedAt)}</td>
                                <td className='px-2 py-3 whitespace-pre-wrap'>
                                    {noc.overridden && noc.override ? (
                                        <>
                                            <span className='block'>Override reason: {noc.override.reason || '—'}</span>
                                            <span className='block text-xs mt-1'>
                                                {noc.override.activeClearingUserExisted
                                                    ? 'An active clearing user existed at the time of override.'
                                                    : 'No active clearing user existed at the time of override.'}
                                            </span>
                                        </>
                                    ) : (
                                        noc.remarks || '—'
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default TcNocHistory
