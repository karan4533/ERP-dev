import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { canSubmitterAccessRequest, getLeaveRequestById, statusBadgeColor } from './leaveRequestData'
import { getLeaveRoutes, resolveRoleKey } from './leaveRequestConfigs'

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

export default function ViewMyLeaveRequestPage({ roleKey: roleKeyProp }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const { role: authRole } = useAuth()
    const roleKey = resolveRoleKey(authRole || roleKeyProp)
    const routes = getLeaveRoutes(roleKey)
    const request = getLeaveRequestById(id)
    const isOwnRequest = canSubmitterAccessRequest(request, roleKey)

    return (
        <section className='space-y-6'>
            <button type='button' onClick={() => navigate(routes.myList)} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                <ArrowLeft size={18} />
                Back to list
            </button>

            {!request || !isOwnRequest ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Leave request not found.</div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-wrap items-center gap-3'>
                            <h1 className='text-2xl font-semibold text-black'>{request.leaveRequestId}</h1>
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${statusBadgeColor[request.status]}`}>{request.status}</span>
                        </div>
                        <p className='text-sm text-[#667085] mt-2'>Submitted to {request.requestedTo}</p>
                    </div>

                    <Section title='Leave Request Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Leave Request ID' value={request.leaveRequestId} />
                            <Field label='Leave Type' value={request.leaveType} />
                            <Field label='From Date' value={request.fromDate} />
                            <Field label='To Date' value={request.toDate} />
                            <Field label='Total Days' value={String(request.totalDays)} />
                            <Field label='Applied Date' value={request.appliedDate} />
                            <Field label='Requested To' value={request.requestedTo} />
                            <Field label='Status' value={request.status} />
                            <div className='lg:col-span-3'><Field label='Reason' value={request.reason} /></div>
                        </div>
                    </Section>

                    {request.approverRemarks ? (
                        <Section title='Approver Remarks'>
                            <Field label='Remarks' value={request.approverRemarks} />
                        </Section>
                    ) : null}
                </>
            )}
        </section>
    )
}
