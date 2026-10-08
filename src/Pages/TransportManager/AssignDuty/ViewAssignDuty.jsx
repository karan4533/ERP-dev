import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getDutyById } from './assignDutyData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>
            {value || '—'}
        </span>
    </div>
)

const ViewAssignDuty = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const duty = getDutyById(id)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/assign-duty')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!duty ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Duty assignment not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h1 className='text-2xl font-semibold text-black'>{duty.dutyId}</h1>
                        <p className='text-sm text-[#667085] mt-2'>
                            <span className='font-medium text-[#1E1E1E]'>{duty.driverName}</span>
                            {' · '}
                            <span>{duty.routeName}</span>
                            {' · '}
                            <span>{duty.dutyDate}</span>
                        </p>
                    </div>

                    <Section title='Assign Duty Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Driver Name' value={duty.driverName} />
                            <Field label='Driver ID' value={duty.driverId} />
                            <Field label='Vehicle Number' value={duty.vehicleNumber} />
                            <Field label='Route Name' value={duty.routeName} />
                            <Field label='Duty Date' value={duty.dutyDate} />
                            <Field label='Shift' value={duty.shift} />
                            <Field label='Start Time' value={duty.startTime} />
                            <Field label='End Time' value={duty.endTime} />
                        </div>
                    </Section>
                </>
            )}
        </section>
    )
}

export default ViewAssignDuty
