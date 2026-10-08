import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'
import {
    finalStatusBadgeColor,
    formatOutTimeForDisplay,
    getHostelGatePassById,
} from './hostelGatePassData'

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E]'>{value || '—'}</span>
    </div>
)

const ViewHostelGatePass = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = useMemo(() => getHostelGatePassById(id), [id])

    if (!record) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate('/front-office/hostel-gate-pass-list')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Gate pass not found.
                </div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate('/front-office/hostel-gate-pass-list')}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap items-start gap-4 mb-6'>
                    <img src={record.profile || mo_user} alt='' className='w-16 h-16 rounded-full object-cover' />
                    <div>
                        <h2 className='text-xl font-semibold text-black'>{record.studentName}</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Gate Pass: {record.gatePassId} · Student ID: {record.studentId}
                        </p>
                        <span className={`inline-block mt-2 text-xs font-semibold px-2 py-1 rounded ${finalStatusBadgeColor[record.status] || ''}`}>
                            {record.status}
                        </span>
                    </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Class & Section' value={record.classSection} />
                    <Field label='Gender' value={record.gender} />
                    <Field label='Mobile Number' value={record.mobileNumber} />
                    <Field label='City' value={record.city} />
                    <Field label='Hostel' value={record.hostel} />
                    <Field label='Leave Type' value={record.leaveType} />
                    <Field label='Out Date' value={record.outDate} />
                    <Field label='Out Time' value={formatOutTimeForDisplay(record.outTime)} />
                    <Field label='Return Date' value={record.returnDate} />
                    <Field label='Return Time' value={formatOutTimeForDisplay(record.returnTime)} />
                    <Field label='Parent Approval' value={record.parentApproval} />
                    <Field label='Warden Approval' value={record.wardenApproval} />
                    <div className='lg:col-span-3'>
                        <Field label='Reason' value={record.reason} />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ViewHostelGatePass
