import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import AdmissionEnquiryInfo from './Components/AdmissionEnquiryInfo'
import {
    DEFAULT_ENQUIRY_FORM,
    createAdmissionEnquiry,
    getAdmissionEnquiryById,
    getEnquiryRouteBase,
    toFormState,
    updateAdmissionEnquiry,
} from './admissionEnquiryData'

const AddAdmissionEnquiry = () => {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { id } = useParams()
    const isEdit = Boolean(id)
    const listPath = getEnquiryRouteBase(pathname)
    const [form, setForm] = useState({
        ...DEFAULT_ENQUIRY_FORM,
        enquiryDate: new Date(),
        nextFollowUpDate: new Date(),
    })
    const [error, setError] = useState('')
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        if (!isEdit) return
        const record = getAdmissionEnquiryById(id)
        if (!record) {
            setNotFound(true)
            return
        }
        setNotFound(false)
        setForm(toFormState(record))
    }, [id, isEdit])

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleDiscard = () => {
        navigate(listPath)
    }

    const handleSave = () => {
        setError('')
        const result = isEdit
            ? updateAdmissionEnquiry(id, form)
            : createAdmissionEnquiry(form)

        if (!result.success) {
            setError(result.message)
            return
        }

        toast.success(isEdit ? 'Admission enquiry updated.' : 'Admission enquiry saved successfully.')
        navigate(listPath)
    }

    if (notFound) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-8 text-center'>
                <h2 className='text-xl font-semibold text-[#0C1E5B]'>Enquiry not found</h2>
                <button
                    type='button'
                    onClick={() => navigate(listPath)}
                    className='mt-4 text-[#515DEF] hover:underline cursor-pointer'
                >
                    Back to Admission Enquiry List
                </button>
            </section>
        )
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>
                    {isEdit ? 'Edit Admission Enquiry' : 'Admission Enquiry Information'}
                </h2>
                <p className='text-sm text-[#667085] mt-1'>
                    {isEdit
                        ? 'Update enquiry details and save changes.'
                        : 'New enquiries are saved as Active and appear in the Admission Enquiry list.'}
                </p>
                <AdmissionEnquiryInfo form={form} onChange={updateField} />
            </div>

            {error && <p className='text-sm text-[#F44336] mt-4'>{error}</p>}

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={handleDiscard}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSave}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddAdmissionEnquiry
