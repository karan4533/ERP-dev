import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getMaintenanceById, statusBadgeColor } from './vehicleMaintenanceData'

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

const ViewVehicleMaintenance = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getMaintenanceById(id)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/vehicle-maintenance')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!record ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Vehicle maintenance record not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-wrap items-center gap-3'>
                            <h1 className='text-2xl font-semibold text-black'>{record.serviceId}</h1>
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${statusBadgeColor[record.status]}`}>
                                {record.status}
                            </span>
                        </div>
                        <p className='text-sm text-[#667085] mt-2'>
                            <span className='font-medium text-[#1E1E1E]'>{record.vehicleNumber}</span>
                            {' · '}
                            <span>{record.serviceType}</span>
                            {' · '}
                            <span>Next service: {record.nextServiceDate}</span>
                        </p>
                    </div>

                    <Section title='Vehicle Maintenance Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Vehicle Number' value={record.vehicleNumber} />
                            <Field label='Vehicle Type' value={record.vehicleType} />
                            <Field label='Last Service Date' value={record.lastServiceDate} />
                            <Field label='Next Service Date' value={record.nextServiceDate} />
                            <Field label='Service Type' value={record.serviceType} />
                            <Field label='Service Center' value={record.serviceCenter} />
                            <Field label='Estimated Cost' value={record.estimatedCost} />
                            <Field label='Status' value={record.status} />
                        </div>
                    </Section>
                </>
            )}
        </section>
    )
}

export default ViewVehicleMaintenance
