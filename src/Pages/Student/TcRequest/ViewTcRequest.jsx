import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import pdf_icon from '../../../assets/images/pdf-icon.png'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import { getTcRequestById, statusBadgeColor } from '../../../Common/TcRequest/tcRequestData'

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
    const { routePrefix } = useActiveStudent()
    const request = getTcRequestById(id)

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate(`${routePrefix}/tc-request`)}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
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
                            {request.studentName} · {request.classSection}
                        </p>
                    </div>

                    <Section title='Request Details'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Student Name' value={request.studentName} />
                            <Field label='Class / Section' value={request.classSection} />
                            <Field label='Admission Number' value={request.admissionNumber} />
                            <Field label='Requested By' value={request.requestedBy} />
                            <Field label='Requested On' value={request.requestedOn} />
                            <Field label='Last Date of Attendance' value={request.lastDateOfAttendance} />
                            <Field label='Transfer To' value={request.transferTo} />
                            <div className='lg:col-span-3'><Field label='Reason' value={request.reason} /></div>
                            {request.prmRemarks ? <div className='lg:col-span-3'><Field label='PRM Remarks' value={request.prmRemarks} /></div> : null}
                            {request.superAdminRemarks ? <div className='lg:col-span-3'><Field label='Super Admin Remarks' value={request.superAdminRemarks} /></div> : null}
                        </div>
                    </Section>

                    {request.status === 'Approved' ? (
                        <Section title='Transfer Certificate'>
                            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                                <Field label='TC Number' value={request.tcNumber} />
                                <Field label='TC Issued Date' value={request.tcIssuedDate} />
                                <div className='lg:col-span-3'>
                                    <div className='flex flex-col gap-y-2'>
                                        <span className='text-base font-medium text-[#808080]'>TC Document</span>
                                        <div className='flex flex-wrap items-center gap-4'>
                                            <span className='flex items-center gap-x-2 text-sm text-[#1E1E1E]'>
                                                <img src={pdf_icon} alt='pdf-icon' className='w-6 h-6' />
                                                {request.tcDocumentName}
                                            </span>
                                            <button
                                                type='button'
                                                className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                                            >
                                                <Download size={16} />
                                                Download TC
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Section>
                    ) : null}

                    {request.status === 'Pending PRM Review' ? (
                        <div className='bg-[#FF980008] border border-[#FF980033] rounded-2xl p-4 text-sm text-[#667085]'>
                            Your request has been submitted to PRM. It will be forwarded to Super Admin for final approval.
                        </div>
                    ) : null}

                    {request.status === 'Pending Super Admin Approval' ? (
                        <div className='bg-[#2196F308] border border-[#2196F333] rounded-2xl p-4 text-sm text-[#667085]'>
                            PRM has verified your request. Awaiting Super Admin approval. Your TC will appear here once approved.
                        </div>
                    ) : null}

                    {request.status === 'Rejected' ? (
                        <div className='bg-[#FF000008] border border-[#FF000033] rounded-2xl p-4 text-sm text-[#667085]'>
                            This TC request was rejected. Please contact the Front Office for details.
                        </div>
                    ) : null}
                </>
            )}
        </section>
    )
}

export default ViewTcRequest
