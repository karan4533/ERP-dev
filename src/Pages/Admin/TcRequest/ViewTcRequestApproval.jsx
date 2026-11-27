import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import TcNocHistory from '../../../Common/TcRequest/TcNocHistory'
import TcNocOverridePanel from '../../../Common/TcRequest/TcNocOverridePanel'
import TcRequestHistory from '../../../Common/TcRequest/TcRequestHistory'
import { useAuth } from '../../../context/AuthContext'
import {
    approveTcRequest,
    decideTcRequestViaApi,
    getTcRequestById,
    hydrateTcRequestFromApi,
    rejectTcRequest,
    statusBadgeColor,
} from '../../../Common/TcRequest/tcRequestData'
import { canUseTcApi } from '../../../services/tcApi'

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

const ViewTcRequestApproval = ({ listPath = '/admin/tc-request-approval' }) => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { role } = useAuth()
    const [request, setRequest] = useState(() => getTcRequestById(id))
    const [superAdminRemarks, setSuperAdminRemarks] = useState(request?.superAdminRemarks ?? '')
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        if (!canUseTcApi()) return undefined
        let active = true
        hydrateTcRequestFromApi(id)
            .then((row) => {
                if (!active) return
                setRequest(row)
                setSuperAdminRemarks(row.superAdminRemarks || '')
            })
            .catch(() => {
                if (active) setRequest(null)
            })
        return () => {
            active = false
        }
    }, [id])

    const handleApprove = async () => {
        if (canUseTcApi()) {
            if (busy) return
            setBusy(true)
            try {
                const updated = await decideTcRequestViaApi(id, 'approve', superAdminRemarks)
                setRequest(updated)
                toast.success('Transfer certificate approved and issued.')
            } catch (error) {
                toast.error(error?.message || 'The request could not be approved.')
            } finally {
                setBusy(false)
            }
            return
        }
        const updated = approveTcRequest(id, superAdminRemarks)
        if (updated) {
            setRequest(updated)
            toast.success('Transfer certificate approved and issued.')
        } else {
            toast.error('The request could not be approved.')
        }
    }

    const handleReject = async () => {
        if (canUseTcApi()) {
            if (busy) return
            setBusy(true)
            try {
                const updated = await decideTcRequestViaApi(id, 'reject', superAdminRemarks)
                setRequest(updated)
                toast.success('Transfer certificate request rejected.')
            } catch (error) {
                toast.error(error?.message || 'The request could not be rejected.')
            } finally {
                setBusy(false)
            }
            return
        }
        const updated = rejectTcRequest(id, superAdminRemarks, 'admin')
        if (updated) {
            setRequest(updated)
            toast.success('Transfer certificate request rejected.')
        } else {
            toast.error('The request could not be rejected.')
        }
    }

    return (
        <section className='space-y-6'>
            <button type='button' onClick={() => navigate(listPath)} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                <ArrowLeft size={18} />
                Back to list
            </button>

            {!request ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>TC request not found.</div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-wrap items-center gap-3'>
                            <h1 className='text-2xl font-semibold text-black'>{request.requestId}</h1>
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${statusBadgeColor[request.status]}`}>
                                {request.status}
                            </span>
                        </div>
                        <p className='text-sm text-[#667085] mt-2'>
                            Super Admin review · {request.studentName} · {request.classSection}
                        </p>
                    </div>

                    <Section title='Request Summary'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Student Name' value={request.studentName} />
                            <Field label='Admission Number' value={request.admissionNumber} />
                            <Field label='Requested By' value={request.requestedBy} />
                            <Field label='Transfer To' value={request.transferTo} />
                            <Field label='Last Date of Attendance' value={request.lastDateOfAttendance} />
                            <Field label='PRM Forwarded On' value={request.forwardedOn} />
                            <div className='lg:col-span-3'><Field label='Reason' value={request.reason} /></div>
                            <div className='lg:col-span-3'><Field label='PRM Remarks' value={request.prmRemarks} /></div>
                        </div>
                    </Section>

                    <TcNocHistory nocs={request.nocs} title='Manager NOC approval history' />

                    <TcNocOverridePanel request={request} role={role} onUpdated={setRequest} />

                    {request.status === 'Pending Manager NOCs' ? (
                        <Section title='Awaiting manager NOCs'>
                            <p className='text-sm text-[#667085]'>
                                {request.pendingNocCount || 0} mandatory manager clearance(s) still pending. Final approval unlocks after every NOC is cleared and PRM forwards the request.
                            </p>
                        </Section>
                    ) : null}

                    {request.status === 'Pending Super Admin Approval' ? (
                        <Section title='MD / Super Admin final decision'>
                            <div className='space-y-4'>
                                <div className='flex flex-col gap-y-2'>
                                    <label htmlFor='admin-remarks' className='text-base font-medium text-[#808080]'>Final remarks</label>
                                    <textarea
                                        id='admin-remarks'
                                        rows={3}
                                        value={superAdminRemarks}
                                        onChange={(e) => setSuperAdminRemarks(e.target.value)}
                                        placeholder='Approval or rejection remarks'
                                        className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                                    />
                                </div>
                                <p className='text-sm text-[#667085]'>
                                    TC number is generated only after this final approval. Review the manager NOC history above before deciding.
                                </p>
                                <div className='flex sm:justify-end justify-center gap-x-4'>
                                    <button type='button' disabled={busy} onClick={handleReject} className='bg-white text-[#FF0000] text-sm px-8 py-2 rounded-md border border-[#FF0000] hover:bg-[#FF0000] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'>
                                        Reject
                                    </button>
                                    <button type='button' disabled={busy} onClick={handleApprove} className='bg-[#4CAF50] text-white text-sm px-8 py-2 rounded-md border border-[#4CAF50] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'>
                                        {busy ? 'Saving…' : 'Approve & Issue TC'}
                                    </button>
                                </div>
                            </div>
                        </Section>
                    ) : null}

                    {request.status === 'Approved' ? (
                        <Section title='Issued Transfer Certificate'>
                            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                                <Field label='TC Number' value={request.tcNumber} />
                                <Field label='TC Issued Date' value={request.tcIssuedDate} />
                                <Field label='TC Document' value={request.tcDocumentName} />
                                <Field label='Super Admin Remarks' value={request.superAdminRemarks} />
                            </div>
                            <p className='text-sm text-[#4CAF50] font-medium mt-4'>
                                TC has been sent to the student/parent portal and is available for download.
                            </p>
                        </Section>
                    ) : null}

                    {request.status === 'Rejected' && request.superAdminRemarks ? (
                        <Section title='Super Admin Remarks'>
                            <Field label='Remarks' value={request.superAdminRemarks} />
                        </Section>
                    ) : null}

                    <TcRequestHistory history={request.history} />
                </>
            )}
        </section>
    )
}

export default ViewTcRequestApproval
