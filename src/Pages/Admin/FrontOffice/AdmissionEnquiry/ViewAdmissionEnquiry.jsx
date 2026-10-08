import React, { useMemo } from 'react'
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import AdmissionEnquiryInfo from './Components/AdmissionEnquiryInfo'
import {
    getAdmissionEnquiryById,
    getEnquiryRouteBase,
    isAdminFrontOfficePath,
    toFormState,
    updateAdmissionEnquiryStatus,
} from './admissionEnquiryData'

const ViewAdmissionEnquiry = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const routeBase = getEnquiryRouteBase(pathname)
    const isAdminView = isAdminFrontOfficePath(pathname)
    const record = useMemo(() => getAdmissionEnquiryById(id), [id])
    const form = useMemo(() => (record ? toFormState(record) : null), [record])

    if (!record || !form) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-8 text-center'>
                <h2 className='text-xl font-semibold text-[#0C1E5B]'>Enquiry not found</h2>
                <NavLink to={routeBase} className='inline-block mt-4 text-[#515DEF] hover:underline'>
                    Back to Admission Enquiry List
                </NavLink>
            </section>
        )
    }

    const handleMarkSuccess = () => {
        updateAdmissionEnquiryStatus(record.id, 'Success')
        toast.success('Enquiry marked as Success.')
        navigate(routeBase)
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate(routeBase)}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap items-start justify-between gap-3 mb-2'>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Admission Enquiry Details</h2>
                        <p className='text-sm text-[#667085] mt-1'>ID: {record.id} · Status: {record.status}</p>
                    </div>
                    {record.status !== 'Success' && !isAdminView && (
                        <button
                            type='button'
                            onClick={handleMarkSuccess}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 cursor-pointer'
                        >
                            Mark as Success
                        </button>
                    )}
                </div>
                <AdmissionEnquiryInfo form={form} readOnly />
            </div>
        </section>
    )
}

export default ViewAdmissionEnquiry
