import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import {
    canApproverAccessRequest,
    getLeaveRequestById,
    statusBadgeColor,
    updateLeaveRequestStatus,
} from './leaveRequestData'
import { APPROVER_DECISION_TITLES, getLeaveRoutes, resolveRoleKey } from './leaveRequestConfigs'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value || '—'}</span>
    </div>
)

export default function ViewReceivedLeaveRequestPage({ roleKey: roleKeyProp }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const { role: authRole } = useAuth()
    const roleKey = resolveRoleKey(authRole || roleKeyProp)
    const routes = getLeaveRoutes(roleKey)
    const [request, setRequest] = useState(() => {
        const item = getLeaveRequestById(id)
        return canApproverAccessRequest(item, roleKey) ? item : null
    })
    const [approverRemarks, setApproverRemarks] = useState(request?.approverRemarks ?? '')
    const decisionTitle = APPROVER_DECISION_TITLES[roleKey] || 'Approver Decision'

    const handleApprove = () => {
        const updated = updateLeaveRequestStatus(id, 'Approved', approverRemarks, roleKey)
        if (!updated) {
            toast.error('Unable to approve this leave request.')
            return
        }
        setRequest(updated)
        toast.success('Leave request approved.')
    }

    const handleReject = () => {
        const updated = updateLeaveRequestStatus(id, 'Rejected', approverRemarks, roleKey)
        if (!updated) {
            toast.error('Unable to reject this leave request.')
            return
        }
        setRequest(updated)
        toast.success('Leave request rejected.')
    }

    return (
        <section className='space-y-6'>
            <button type='button' onClick={() => navigate(routes.receivedList)} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                <ArrowLeft size={18} />
                Back to list
            </button>

            {!request ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Leave request not found.</div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-wrap items-center gap-3'>
                            <h1 className='text-2xl font-semibold text-black'>{request.leaveRequestId}</h1>
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${statusBadgeColor[request.status]}`}>{request.status}</span>
                        </div>
                        <p className='text-sm text-[#667085] mt-2'>
                            <span className='font-medium text-[#1E1E1E]'>{request.requestedBy}</span>
                            {' · '}
                            {request.role}
                            {request.department ? ` · ${request.department}` : ''}
                        </p>
                    </div>

                    <Section title='Leave Request Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Leave Request ID' value={request.leaveRequestId} />
                            <Field label='Requested By' value={request.requestedBy} />
                            <Field label='Role' value={request.role} />
                            <Field label='Department' value={request.department} />
                            <Field label='Leave Type' value={request.leaveType} />
                            <Field label='From Date' value={request.fromDate} />
                            <Field label='To Date' value={request.toDate} />
                            <Field label='Total Days' value={String(request.totalDays)} />
                            <Field label='Applied Date' value={request.appliedDate} />
                            <Field label='Requested To' value={request.requestedTo} />
                            <div className='lg:col-span-3'><Field label='Reason' value={request.reason} /></div>
                        </div>
                    </Section>

                    {request.status === 'Pending' ? (
                        <Section title={decisionTitle}>
                            <div className='space-y-4'>
                                <div className='flex flex-col gap-y-2'>
                                    <label htmlFor='approver-remarks' className='text-base font-medium text-[#808080]'>Remarks</label>
                                    <textarea
                                        id='approver-remarks'
                                        rows={3}
                                        value={approverRemarks}
                                        onChange={(event) => setApproverRemarks(event.target.value)}
                                        className='text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-2 w-full'
                                        placeholder='Add approval or rejection remarks...'
                                    />
                                </div>
                                <div className='flex sm:justify-end justify-center gap-x-4'>
                                    <button type='button' onClick={handleReject} className='bg-white text-[#FF0000] text-sm px-8 py-2 rounded-md border border-[#FF0000] hover:bg-[#FF0000] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'>Reject</button>
                                    <button type='button' onClick={handleApprove} className='bg-[#4CAF50] text-white text-sm px-8 py-2 rounded-md border border-[#4CAF50] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'>Approve</button>
                                </div>
                            </div>
                        </Section>
                    ) : (
                        request.approverRemarks ? (
                            <Section title='Approver Remarks'>
                                <Field label='Remarks' value={request.approverRemarks} />
                            </Section>
                        ) : null
                    )}
                </>
            )}
        </section>
    )
}
