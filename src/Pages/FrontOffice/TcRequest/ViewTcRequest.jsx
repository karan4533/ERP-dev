import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
    forwardTcRequestToSuperAdmin,
    getTcRequestById,
    rejectTcRequest,
    statusBadgeColor,
} from '../../../Common/TcRequest/tcRequestData'

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

const ViewTcRequest = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [request, setRequest] = useState(() => getTcRequestById(id))
    const [prmRemarks, setPrmRemarks] = useState(request?.prmRemarks ?? '')

    const handleForward = () => {
        const updated = forwardTcRequestToSuperAdmin(id, prmRemarks)
        if (updated) setRequest(updated)
    }

    const handleReject = () => {
        const updated = rejectTcRequest(id, prmRemarks, 'prm')
        if (updated) setRequest(updated)
    }

    return (
        <section className='space-y-6'>
            <button type='button' onClick={() => navigate('/front-office/tc-request')} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
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
                            {request.studentName} · {request.classSection} · Requested by {request.requestedBy}
                        </p>
                    </div>

                    <Section title='TC Request Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Student Name' value={request.studentName} />
                            <Field label='Admission Number' value={request.admissionNumber} />
                            <Field label='Class / Section' value={request.classSection} />
                            <Field label='Requested On' value={request.requestedOn} />
                            <Field label='Last Date of Attendance' value={request.lastDateOfAttendance} />
                            <Field label='Transfer To' value={request.transferTo} />
                            <div className='lg:col-span-3'><Field label='Reason' value={request.reason} /></div>
                        </div>
                    </Section>

                    {request.status === 'Pending PRM Review' ? (
                        <Section title='PRM Action'>
                            <div className='space-y-4'>
                                <div className='flex flex-col gap-y-2'>
                                    <label htmlFor='prm-remarks' className='text-base font-medium text-[#808080]'>PRM Remarks</label>
                                    <textarea
                                        id='prm-remarks'
                                        rows={3}
                                        value={prmRemarks}
                                        onChange={(e) => setPrmRemarks(e.target.value)}
                                        placeholder='Verification notes before forwarding to Super Admin'
                                        className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                                    />
                                </div>
                                <div className='flex sm:justify-end justify-center gap-x-4'>
                                    <button type='button' onClick={handleReject} className='bg-white text-[#FF0000] text-sm px-8 py-2 rounded-md border border-[#FF0000] hover:bg-[#FF0000] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'>
                                        Reject
                                    </button>
                                    <button type='button' onClick={handleForward} className='bg-[#515DEF] text-white text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'>
                                        Forward to Super Admin
                                    </button>
                                </div>
                            </div>
                        </Section>
                    ) : null}

                    {request.status !== 'Pending PRM Review' && request.prmRemarks ? (
                        <Section title='PRM Remarks'>
                            <Field label='Remarks' value={request.prmRemarks} />
                            {request.forwardedOn ? <Field label='Forwarded On' value={request.forwardedOn} /> : null}
                        </Section>
                    ) : null}
                </>
            )}
        </section>
    )
}

export default ViewTcRequest
