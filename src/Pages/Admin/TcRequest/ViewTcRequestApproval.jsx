import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import {
    approveTcRequest,
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

const ViewTcRequestApproval = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [request, setRequest] = useState(() => getTcRequestById(id))
    const [superAdminRemarks, setSuperAdminRemarks] = useState(request?.superAdminRemarks ?? '')

    const handleApprove = () => {
        const updated = approveTcRequest(id, superAdminRemarks)
        if (updated) setRequest(updated)
    }

    const handleReject = () => {
        const updated = rejectTcRequest(id, superAdminRemarks, 'admin')
        if (updated) setRequest(updated)
    }

    return (
        <section className='space-y-6'>
            <button type='button' onClick={() => navigate('/admin/tc-request-approval')} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
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

                    <Section title='Manager-Level NOC Clearance (Mandatory Departmental Sign-offs)'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-[#EDEEF5] text-[#0C1E5B] font-semibold uppercase'>
                                        <th className='py-3 px-4 rounded-s-lg'>Department</th>
                                        <th className='py-3 px-4'>Approving Manager</th>
                                        <th className='py-3 px-4'>Clearance Status</th>
                                        <th className='py-3 px-4'>Remarks & Audit Notes</th>
                                        <th className='py-3 px-4 rounded-e-lg'>Date Cleared</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {(request.nocClearances || []).map((noc) => (
                                        <tr key={noc.departmentKey} className='hover:bg-slate-50/70 transition-colors'>
                                            <td className='py-3 px-4 font-bold text-slate-900'>{noc.department}</td>
                                            <td className='py-3 px-4 font-medium text-slate-700'>{noc.manager}</td>
                                            <td className='py-3 px-4'>
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                    noc.status === 'Cleared'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                    <CheckCircle2 size={12} />
                                                    {noc.status}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4 text-slate-600 max-w-xs'>{noc.remarks}</td>
                                            <td className='py-3 px-4 font-mono text-slate-500'>{noc.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>

                    {request.status === 'Pending Super Admin Approval' ? (
                        <Section title='Super Admin Decision'>
                            <div className='space-y-4'>
                                <div className='flex flex-col gap-y-2'>
                                    <label htmlFor='admin-remarks' className='text-base font-medium text-[#808080]'>Super Admin Remarks</label>
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
                                    On approval, the Transfer Certificate will be issued and sent to the student/parent portal.
                                </p>
                                <div className='flex sm:justify-end justify-center gap-x-4'>
                                    <button type='button' onClick={handleReject} className='bg-white text-[#FF0000] text-sm px-8 py-2 rounded-md border border-[#FF0000] hover:bg-[#FF0000] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'>
                                        Reject
                                    </button>
                                    <button type='button' onClick={handleApprove} className='bg-[#4CAF50] text-white text-sm px-8 py-2 rounded-md border border-[#4CAF50] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'>
                                        Approve & Issue TC
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
                </>
            )}
        </section>
    )
}

export default ViewTcRequestApproval
