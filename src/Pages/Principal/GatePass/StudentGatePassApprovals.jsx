import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import {
    decideStudentGatePassStatus,
    filterStudentGatePasses,
    formatOutTimeForDisplay,
    getStudentGatePasses,
    hydrateStudentGatePassesFromApi,
    statusBadgeColor,
} from '../../FrontOffice/GatePass/gatePassData'
import { frontOfficeApiOn } from '../../FrontOffice/frontOfficeStore'

/**
 * Principal approval inbox for student gate passes raised by Front Office.
 * Does not broaden FO create rights — status decision only.
 */
const StudentGatePassApprovals = () => {
    const [records, setRecords] = useState(() => (frontOfficeApiOn() ? [] : getStudentGatePasses()))
    const [loading, setLoading] = useState(() => frontOfficeApiOn())
    const [loadError, setLoadError] = useState('')
    const [search, setSearch] = useState('')
    const [busyId, setBusyId] = useState('')

    const loadFromApi = (isActive = () => true) =>
        hydrateStudentGatePassesFromApi()
            .then(() => {
                if (!isActive()) return
                setRecords(getStudentGatePasses())
                setLoadError('')
            })
            .catch((error) => {
                if (!isActive()) return
                setRecords([])
                setLoadError(error?.message || 'Could not load student gate passes.')
            })
            .finally(() => {
                if (isActive()) setLoading(false)
            })

    const refresh = () => (frontOfficeApiOn() ? loadFromApi() : setRecords(getStudentGatePasses()))

    useEffect(() => {
        if (!frontOfficeApiOn()) return undefined
        let active = true
        loadFromApi(() => active)
        return () => {
            active = false
        }
    }, [])

    const pending = useMemo(
        () => filterStudentGatePasses(records, { search, status: 'Pending' }),
        [records, search],
    )

    const decide = async (id, status) => {
        setBusyId(id)
        try {
            const result = await decideStudentGatePassStatus(id, status)
            if (!result.success) {
                toast.error(result.message || 'Could not update gate pass.')
                return
            }
            toast.success(`Gate pass ${status.toLowerCase()}.`)
            await refresh()
        } finally {
            setBusyId('')
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-sm text-[#667085] mb-4'>
                    Review pending student gate passes submitted by Front Office. Approve or reject without editing the request details.
                </p>
                <div className='flex flex-col gap-y-2 max-w-md'>
                    <label htmlFor='principal-gp-search' className='text-base font-medium text-[#808080]'>Search</label>
                    <input
                        id='principal-gp-search'
                        type='text'
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder='Student, reason, ID…'
                        className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                    />
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <h2 className='text-xl font-medium text-black mb-4'>Pending Student Gate Passes</h2>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Gate Pass ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Reason</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Out Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>
                                        Loading student gate passes…
                                    </td>
                                </tr>
                            ) : loadError ? (
                                <tr>
                                    <td colSpan={8} className='px-2 py-8 text-center text-[#B42318]'>
                                        {loadError}
                                    </td>
                                </tr>
                            ) : pending.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>
                                        No pending student gate passes.
                                    </td>
                                </tr>
                            ) : (
                                pending.map((row) => (
                                    <tr key={row.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 font-medium text-[#515DEF] rounded-s-lg whitespace-nowrap'>{row.gatePassId || row.id}</td>
                                        <td className='px-2 py-4'>{row.studentName}</td>
                                        <td className='px-2 py-4 whitespace-nowrap'>{row.classSection}</td>
                                        <td className='px-2 py-4 max-w-[200px] truncate' title={row.reason}>{row.reason}</td>
                                        <td className='px-2 py-4 whitespace-nowrap'>{row.date}</td>
                                        <td className='px-2 py-4 whitespace-nowrap'>{formatOutTimeForDisplay?.(row.outTime) || row.outTime}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[row.status]}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 rounded-e-lg'>
                                            <div className='flex flex-wrap gap-2'>
                                                <button
                                                    type='button'
                                                    disabled={busyId === row.id}
                                                    onClick={() => decide(row.id, 'Approved')}
                                                    className='bg-[#4CAF50] text-white text-xs px-3 py-1.5 rounded-md hover:opacity-90 disabled:opacity-60 cursor-pointer'
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    type='button'
                                                    disabled={busyId === row.id}
                                                    onClick={() => decide(row.id, 'Rejected')}
                                                    className='bg-[#B42318] text-white text-xs px-3 py-1.5 rounded-md hover:opacity-90 disabled:opacity-60 cursor-pointer'
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}

export default StudentGatePassApprovals
