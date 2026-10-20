import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
    decideTransportApproval,
    getPrincipalPendingApprovals,
    getPrincipalTransportApprovals,
    hydrateTransportApprovalRequestsFromApi,
    statusBadgeColor,
} from '../../TransportManager/RequestApprovals/requestApprovalsData'

const TransportApprovals = () => {
    const [pending, setPending] = useState(() => getPrincipalPendingApprovals())
    const [history, setHistory] = useState(() => getPrincipalTransportApprovals())
    const [busyId, setBusyId] = useState('')
    const [tab, setTab] = useState('pending')

    const refresh = () => {
        setPending(getPrincipalPendingApprovals())
        setHistory(getPrincipalTransportApprovals())
    }

    useEffect(() => {
        hydrateTransportApprovalRequestsFromApi().finally(refresh)
    }, [])

    const handleDecision = async (requestId, decision) => {
        setBusyId(requestId)
        try {
            const result = await decideTransportApproval(requestId, {
                decision,
                actor: 'principal',
            })
            if (!result?.success) {
                toast.error(result?.message || 'Could not update request.')
                return
            }
            toast.success(
                decision === 'approve'
                    ? 'Approved — expense saved for Account Head → Transport Finance.'
                    : 'Request rejected.'
            )
            refresh()
        } finally {
            setBusyId('')
        }
    }

    const rows = tab === 'pending' ? pending : history.filter((row) => String(row.status) !== 'Awaiting Principal')

    return (
        <section className='space-y-6'>
            <div className='rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] px-4 py-3 text-sm text-[#312E81]'>
                <p className='font-semibold'>Transport expense approvals</p>
                <p className='mt-1 text-[#4338CA]'>
                    Requests already approved by the Transport Manager wait here for your final decision.
                    Approving posts the expense to Account Head → Transport Finance.
                </p>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex gap-6 border-b border-[#F2F4F7] mb-4'>
                    {[
                        { id: 'pending', label: `Awaiting you (${pending.length})` },
                        { id: 'history', label: 'Decided' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type='button'
                            onClick={() => setTab(item.id)}
                            className={`pb-3 text-sm font-medium cursor-pointer ${
                                tab === item.id
                                    ? 'text-[#515DEF] border-b-2 border-[#515DEF] font-semibold'
                                    : 'text-[#808080]'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Request ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Vehicle</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Reported By</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Type</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Est. Cost</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='px-2 py-8 text-center text-[#808080]'>
                                        {tab === 'pending'
                                            ? 'No transport requests awaiting Principal approval.'
                                            : 'No decided transport requests yet.'}
                                    </td>
                                </tr>
                            ) : (
                                rows.map((request) => (
                                    <tr key={request.id || request.requestId} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{request.requestId}</td>
                                        <td className='px-2 py-4'>{request.vehicleNumber}</td>
                                        <td className='px-2 py-4'>{request.reportedBy || request.driverName || '—'}</td>
                                        <td className='px-2 py-4'>{request.requestDate || request.requestedDate || '—'}</td>
                                        <td className='px-2 py-4'>{request.issueType || request.serviceType || (String(request.requestId).startsWith('FR-') ? 'Fuel' : 'Service')}</td>
                                        <td className='px-2 py-4 font-semibold'>{request.estimatedCost || request.amount || request.requestedQuantity || '—'}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[request.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4'>
                                            {String(request.status) === 'Awaiting Principal' ? (
                                                <div className='flex gap-2 whitespace-nowrap'>
                                                    <button
                                                        type='button'
                                                        disabled={busyId === request.requestId}
                                                        onClick={() => handleDecision(request.requestId, 'approve')}
                                                        className='px-3 py-1 text-xs font-semibold rounded-md bg-[#4CAF50] text-white hover:opacity-90 disabled:opacity-50'
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        type='button'
                                                        disabled={busyId === request.requestId}
                                                        onClick={() => handleDecision(request.requestId, 'reject')}
                                                        className='px-3 py-1 text-xs font-semibold rounded-md bg-white text-[#F44336] border border-[#F44336] hover:bg-[#FFEBEE] disabled:opacity-50'
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className='text-xs text-[#808080]'>—</span>
                                            )}
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

export default TransportApprovals
