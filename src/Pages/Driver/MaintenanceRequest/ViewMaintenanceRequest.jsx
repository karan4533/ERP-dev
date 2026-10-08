import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import MaintenanceRequestForm from './Components/MaintenanceRequestForm'
import { getMaintenanceRequestById, requestStatusBadgeColor } from './maintenanceRequestData'

const ViewMaintenanceRequest = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getMaintenanceRequestById(id)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/driver/maintenance-request')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!record ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Maintenance request not found or could not be loaded.
                </div>
            ) : (
                <div className='bg-white rounded-2xl shadow-md p-4 md:p-6'>
                    <div className='flex flex-wrap items-center gap-3 mb-2'>
                        <h2 className='text-xl font-semibold text-black'>Maintenance Request Information</h2>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${requestStatusBadgeColor[record.requestStatus]}`}>
                            {record.requestStatus}
                        </span>
                    </div>
                    <MaintenanceRequestForm record={record} readOnly showRequestId />
                </div>
            )}
        </section>
    )
}

export default ViewMaintenanceRequest
