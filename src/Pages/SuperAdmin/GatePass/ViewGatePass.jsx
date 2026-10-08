import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'
import ApprovalSection from '../../FrontOffice/MaterialGatePass/Components/ApprovalSection'
import {
    calculateTotalItems,
    formatDisplayTime,
    getPassTypeTitle,
    statusBadgeColor as materialStatusBadgeColor,
} from '../../FrontOffice/MaterialGatePass/materialGatePassData'
import {
    ROUTE_BASE,
    getGatePassById,
    passCategoryBadgeColor,
    statusBadgeColor,
} from './gatePassData'

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

const StudentGatePassView = ({ record }) => (
    <>
        <div className='bg-white rounded-2xl shadow-md p-4'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                <img src={record.profile || mo_user} alt='' className='w-20 h-20 rounded-full object-cover ring-2 ring-indigo-100' />
                <div className='flex-1'>
                    <h1 className='text-2xl font-semibold text-black'>{record.studentName}</h1>
                    <p className='text-sm text-[#667085] mt-1'>
                        Pass ID: <span className='font-medium text-[#1E1E1E]'>{record.passId}</span>
                    </p>
                </div>
                <span className={`inline-flex self-start px-3 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[record.status] ?? statusBadgeColor.Pending}`}>
                    {record.status}
                </span>
            </div>
        </div>

        <Section title='Student details'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                <Field label='Student ID' value={record.studentId} />
                <Field label='Class & section' value={record.classSection} />
                <Field label='Gender' value={record.gender} />
                <Field label='Mobile number' value={record.mobileNumber} />
                <Field label='City' value={record.city} />
            </div>
        </Section>

        <Section title='Gate pass details'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                <Field label='Reason' value={record.reason} />
                <Field label='Date' value={record.date} />
                <Field label='Out time' value={record.outTime} />
                <Field label='Created by' value={record.createdBy} />
                <Field label='Created at' value={record.createdAt} />
            </div>
        </Section>
    </>
)

const HostelGatePassView = ({ record }) => (
    <>
        <div className='bg-white rounded-2xl shadow-md p-4'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                <img src={record.profile || mo_user} alt='' className='w-20 h-20 rounded-full object-cover ring-2 ring-indigo-100' />
                <div className='flex-1'>
                    <h1 className='text-2xl font-semibold text-black'>{record.studentName}</h1>
                    <p className='text-sm text-[#667085] mt-1'>
                        Pass ID: <span className='font-medium text-[#1E1E1E]'>{record.gatePassId}</span>
                    </p>
                </div>
                <span className={`inline-flex self-start px-3 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[record.status] ?? statusBadgeColor.Pending}`}>
                    {record.status}
                </span>
            </div>
        </div>

        <Section title='Student details'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                <Field label='Student ID' value={record.studentId} />
                <Field label='Class & section' value={record.classSection} />
                <Field label='Gender' value={record.gender} />
                <Field label='Mobile number' value={record.mobileNumber} />
                <Field label='City' value={record.city} />
                <Field label='Hostel' value={record.hostel} />
            </div>
        </Section>

        <Section title='Leave & gate pass details'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                <Field label='Leave type' value={record.leaveType} />
                <Field label='Reason' value={record.reason} />
                <Field label='Out date' value={record.outDate} />
                <Field label='Out time' value={record.outTime} />
                <Field label='Return date' value={record.returnDate} />
                <Field label='Return time' value={record.returnTime} />
                <Field label='Parent approval' value={record.parentApproval} />
                <Field label='Warden approval' value={record.wardenApproval} />
            </div>
        </Section>
    </>
)

const MaterialGatePassView = ({ record }) => {
    const totalItems = calculateTotalItems(record.materials)

    return (
        <>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>{getPassTypeTitle(record.passType)}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            MGP No: <span className='font-medium text-[#1E1E1E]'>{record.mgpNo}</span>
                        </p>
                    </div>
                    <span className={`inline-flex self-start px-3 py-1 rounded-lg text-xs font-semibold ${materialStatusBadgeColor[record.status] ?? materialStatusBadgeColor.Pending}`}>
                        {record.status}
                    </span>
                </div>
            </div>

            <Section title='Pass details'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
                    <div className='rounded-lg border border-[#D9D9D9] p-3'>
                        <p className='text-xs font-medium text-[#808080]'>Date</p>
                        <p className='text-sm font-semibold text-[#1E1E1E] mt-1'>{record.date}</p>
                    </div>
                    <div className='rounded-lg border border-[#D9D9D9] p-3'>
                        <p className='text-xs font-medium text-[#808080]'>Time In</p>
                        <p className='text-sm font-semibold text-[#1E1E1E] mt-1'>
                            {formatDisplayTime(record.time, record.timePeriod)}
                        </p>
                    </div>
                    <div className='rounded-lg border border-[#D9D9D9] p-3'>
                        <p className='text-xs font-medium text-[#808080]'>Driver name</p>
                        <p className='text-sm font-semibold text-[#1E1E1E] mt-1'>{record.driverName}</p>
                    </div>
                    <div className='rounded-lg border border-[#D9D9D9] p-3'>
                        <p className='text-xs font-medium text-[#808080]'>Vehicle no.</p>
                        <p className='text-sm font-semibold text-[#1E1E1E] mt-1'>{record.vehicleNo}</p>
                    </div>
                </div>

                <div className='overflow-x-auto rounded-xl border border-[#D9D9D9] mb-6'>
                    <table className='w-full min-w-[700px] text-sm'>
                        <thead className='bg-[#EDEEF5] text-xs uppercase text-[#0C1E5B]'>
                            <tr>
                                <th className='px-3 py-3 w-16 text-left'>S.No.</th>
                                <th className='px-3 py-3 text-left'>Description</th>
                                <th className='px-3 py-3 w-20 text-left'>Qty</th>
                                <th className='px-3 py-3 text-left'>Destination</th>
                                <th className='px-3 py-3 text-left'>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(record.materials ?? []).map((item, index) => (
                                <tr key={item.id} className='border-t border-[#E4E7EC]'>
                                    <td className='px-3 py-3'>{index + 1}</td>
                                    <td className='px-3 py-3'>{item.description}</td>
                                    <td className='px-3 py-3'>{item.quantity}</td>
                                    <td className='px-3 py-3'>{item.destination || '—'}</td>
                                    <td className='px-3 py-3'>{item.remarks || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 border border-[#D9D9D9] rounded-xl p-4 mb-6'>
                    <Field label='Total no. of items' value={String(totalItems)} />
                    <Field label='Created by' value={record.createdBy} />
                    <Field label='Created at' value={record.createdAt} />
                </div>

                <ApprovalSection approvals={record.approvals} readOnly />
            </Section>
        </>
    )
}

const ViewGatePass = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const gatePass = getGatePassById(id)

    if (!gatePass) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate(ROUTE_BASE)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Gate pass not found.</div>
            </section>
        )
    }

    const { passCategory, details } = gatePass

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate(ROUTE_BASE)}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            <div className='flex items-center gap-2'>
                <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold ${passCategoryBadgeColor[passCategory] ?? passCategoryBadgeColor.Student}`}>
                    {passCategory} Gate Pass
                </span>
            </div>

            {passCategory === 'Student' && <StudentGatePassView record={details} />}
            {passCategory === 'Hostel' && <HostelGatePassView record={details} />}
            {passCategory === 'Material' && <MaterialGatePassView record={details} />}
        </section>
    )
}

export default ViewGatePass
