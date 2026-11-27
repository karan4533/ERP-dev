import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import {
    decideHostelGatePassApproval,
    filterHostelGatePasses,
    formatOutTimeForDisplay,
    getHostelApprovalStatus,
    getHostelGatePasses,
    getHostelPrincipalApproval,
    hydrateHostelGatePassesFromApi,
    approvalStatusColor,
} from '../../FrontOffice/HostelGatePass/hostelGatePassData'
import { frontOfficeApiOn } from '../../FrontOffice/frontOfficeStore'

/**
 * Principal approval inbox for hostel leave / outing gate passes.
 * Parent OR Principal approval is sufficient; Warden is not required (#45).
 */
const HostelGatePassApprovals = () => {
    const [records, setRecords] = useState(() => (frontOfficeApiOn() ? [] : getHostelGatePasses()))
    const [loading, setLoading] = useState(() => frontOfficeApiOn())
    const [loadError, setLoadError] = useState('')
    const [search, setSearch] = useState('')
    const [busyId, setBusyId] = useState('')

    const loadFromApi = (isActive = () => true) =>
        hydrateHostelGatePassesFromApi()
            .then(() => {
                if (!isActive()) return
                setRecords(getHostelGatePasses())
                setLoadError('')
            })
            .catch((error) => {
                if (!isActive()) return
                setRecords([])
                setLoadError(error?.message || 'Could not load hostel gate passes.')
            })
            .finally(() => {
                if (isActive()) setLoading(false)
            })

    const refresh = () => (frontOfficeApiOn() ? loadFromApi() : setRecords(getHostelGatePasses()))

    useEffect(() => {
        if (!frontOfficeApiOn()) return undefined
        let active = true
        loadFromApi(() => active)
        return () => {
            active = false
        }
    }, [])

    const pending = useMemo(() => {
        const filtered = filterHostelGatePasses(records, { search })
        return filtered.filter((row) => getHostelApprovalStatus(row) === 'Pending')
    }, [records, search])

    const decide = async (id, status) => {
        setBusyId(id)
        try {
            const result = await decideHostelGatePassApproval(id, { actor: 'principal', status })
            if (!result.success) {
                toast.error(result.message || 'Could not update hostel gate pass.')
                return
            }
            toast.success(`Hostel outing ${status.toLowerCase()}.`)
            await refresh()
        } finally {
            setBusyId('')
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-sm text-[#667085] mb-4'>
                    Review pending hostel leave / outing gate passes. Parent or Principal approval alone is enough — Warden is not in the chain.
                </p>
                <div className='flex flex-col gap-y-2 max-w-md'>
                    <label htmlFor='principal-hgp-search' className='text-base font-medium text-[#808080]'>Search</label>
                    <input
                        id='principal-hgp-search'
                        type='text'
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder='Student, hostel, leave type…'
                        className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                    />
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <h2 className='text-xl font-medium text-black mb-4'>Pending Hostel Outing Approvals</h2>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Gate Pass ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Hostel</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Leave Type</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Out</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Parent</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Principal</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>
                                        Loading hostel outing requests…
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
                                        No pending hostel outing approvals.
                                    </td>
                                </tr>
                            ) : (
                                pending.map((row) => (
                                    <tr key={row.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 font-medium text-[#515DEF] rounded-s-lg whitespace-nowrap'>{row.gatePassId || row.id}</td>
                                        <td className='px-2 py-4'>{row.studentName}</td>
                                        <td className='px-2 py-4 whitespace-nowrap'>{row.hostel}</td>
                                        <td className='px-2 py-4 whitespace-nowrap'>{row.leaveType}</td>
                                        <td className='px-2 py-4 whitespace-nowrap'>
                                            {row.outDate} {formatOutTimeForDisplay(row.outTime)}
                                        </td>
                                        <td className='px-2 py-4'>
                                            <span className={`font-medium ${approvalStatusColor[row.parentApproval] || ''}`}>
                                                {row.parentApproval || 'Pending'}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4'>
                                            <span className={`font-medium ${approvalStatusColor[getHostelPrincipalApproval(row)] || ''}`}>
                                                {getHostelPrincipalApproval(row)}
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

export default HostelGatePassApprovals
