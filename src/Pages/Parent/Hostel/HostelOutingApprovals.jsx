import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import {
    decideHostelGatePassApproval,
    fetchParentHostelGatePasses,
    filterHostelGatePasses,
    formatOutTimeForDisplay,
    getHostelApprovalStatus,
    getHostelGatePasses,
    getHostelPrincipalApproval,
    approvalStatusColor,
} from '../../FrontOffice/HostelGatePass/hostelGatePassData'
import { frontOfficeApiOn } from '../../FrontOffice/frontOfficeStore'

/**
 * Parent approval inbox for their child's hostel leave / outing gate passes.
 * Parent OR Principal alone is enough (#45). In API mode the server returns only the parent's own children.
 */
const HostelOutingApprovals = () => {
    const { activeStudent } = useActiveStudent()
    const [records, setRecords] = useState(() => (frontOfficeApiOn() ? [] : getHostelGatePasses()))
    const [loading, setLoading] = useState(() => frontOfficeApiOn())
    const [loadError, setLoadError] = useState('')
    const [busyId, setBusyId] = useState('')

    const loadFromApi = (isActive = () => true) =>
        fetchParentHostelGatePasses()
            .then((rows) => {
                if (!isActive()) return
                setRecords(rows)
                setLoadError('')
            })
            .catch((error) => {
                if (!isActive()) return
                setRecords([])
                setLoadError(error?.message || 'Could not load hostel outing requests.')
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

    const studentKeys = useMemo(() => {
        const keys = [
            activeStudent?.id,
            activeStudent?.admissionNumber,
            activeStudent?.admissionNo,
            activeStudent?.studentId,
        ]
            .map((value) => String(value || '').trim().toLowerCase())
            .filter(Boolean)
        return new Set(keys)
    }, [activeStudent])

    const visible = useMemo(() => {
        const filtered = filterHostelGatePasses(records, {})
        if (!studentKeys.size) return filtered
        return filtered.filter((row) => {
            const rowKeys = [row.studentId, row.admissionNumber, row.admissionNo]
                .map((value) => String(value || '').trim().toLowerCase())
                .filter(Boolean)
            return rowKeys.some((key) => studentKeys.has(key))
        })
    }, [records, studentKeys])

    const decide = async (id, status) => {
        setBusyId(id)
        try {
            const result = await decideHostelGatePassApproval(id, { actor: 'parent', status })
            if (!result.success) {
                toast.error(result.message || 'Could not update hostel outing.')
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
                <p className='text-sm text-[#667085] mb-2'>
                    Approve or reject hostel leave / outing requests for your child. Principal approval is an alternative — Warden is not required.
                </p>
                {!activeStudent ? (
                    <p className='text-sm text-[#B42318]'>Select a child to see their outing requests.</p>
                ) : null}
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <h2 className='text-xl font-medium text-black mb-4'>Hostel Outing Requests</h2>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Gate Pass ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Leave Type</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Out</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Return</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Parent</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Principal</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Decision</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className='px-2 py-8 text-center text-[#667085]'>
                                        Loading hostel outing requests…
                                    </td>
                                </tr>
                            ) : loadError ? (
                                <tr>
                                    <td colSpan={9} className='px-2 py-8 text-center text-[#B42318]'>
                                        {loadError}
                                    </td>
                                </tr>
                            ) : visible.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className='px-2 py-8 text-center text-[#667085]'>
                                        No hostel outing requests for your child.
                                    </td>
                                </tr>
                            ) : (
                                visible.map((row) => {
                                    const overall = getHostelApprovalStatus(row)
                                    return (
                                        <tr key={row.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                            <td className='px-2 py-4 font-medium text-[#515DEF] rounded-s-lg whitespace-nowrap'>{row.gatePassId || row.id}</td>
                                            <td className='px-2 py-4'>{row.studentName}</td>
                                            <td className='px-2 py-4 whitespace-nowrap'>{row.leaveType}</td>
                                            <td className='px-2 py-4 whitespace-nowrap'>
                                                {row.outDate} {formatOutTimeForDisplay(row.outTime)}
                                            </td>
                                            <td className='px-2 py-4 whitespace-nowrap'>
                                                {row.returnDate} {formatOutTimeForDisplay(row.returnTime)}
                                            </td>
                                            <td className='px-2 py-4'>
                                                <span className={`font-medium ${approvalStatusColor[row.parentApproval || 'Pending'] || ''}`}>
                                                    {row.parentApproval || 'Pending'}
                                                </span>
                                            </td>
                                            <td className='px-2 py-4'>
                                                <span className={`font-medium ${approvalStatusColor[getHostelPrincipalApproval(row)] || ''}`}>
                                                    {getHostelPrincipalApproval(row)}
                                                </span>
                                            </td>
                                            <td className='px-2 py-4'>
                                                <span className={`font-medium ${approvalStatusColor[overall] || ''}`}>{overall}</span>
                                            </td>
                                            <td className='px-2 py-4 rounded-e-lg'>
                                                {overall === 'Pending' ? (
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
                                                ) : (
                                                    <span className='text-xs text-[#667085]'>Decided</span>
                                                )}
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

export default HostelOutingApprovals
