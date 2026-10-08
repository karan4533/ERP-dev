import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import AdmissionInfo from './Components/AdmissionInfo'
import StudentInfo from './Components/StudentInfo'
import TransportInfo from './Components/TransportInfo'
import ParentsInfo from './Components/ParentsInfo'
import AccountInformation from './Components/AccountInformation'
import FeesTimeLine from './Components/FeesTimeLine'
import {
    buildInitialAdmissionForm,
    createAdmission,
    getAdmissionById,
    toAdmissionFormState,
    updateAdmission,
} from './admissionListData'
import {
    getAdmissionListPath,
    mapEnquiryToAdmissionPrefill,
} from '../AdmissionEnquiry/admissionEnquiryData'

const AddAdmission = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = Boolean(id)
    const { pathname, state: locationState } = useLocation()
    const listPath = getAdmissionListPath(pathname)

    const [form, setForm] = useState(() => {
        const prefill = locationState?.enquiry
            ? mapEnquiryToAdmissionPrefill(locationState.enquiry)
            : null
        return buildInitialAdmissionForm(prefill, locationState?.fromEnquiryId || '')
    })
    const [error, setError] = useState('')
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        if (!isEdit) return
        const record = getAdmissionById(id)
        if (!record) {
            setNotFound(true)
            return
        }
        setNotFound(false)
        setForm(toAdmissionFormState(record))
    }, [id, isEdit])

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSave = () => {
        setError('')
        const result = isEdit ? updateAdmission(id, form) : createAdmission(form)
        if (!result.success) {
            setError(result.message)
            return
        }

        toast.success(isEdit ? 'Admission updated successfully.' : 'Admission saved successfully.')
        navigate(listPath)
    }

    if (notFound) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-8 text-center'>
                <h2 className='text-xl font-semibold text-[#0C1E5B]'>Admission not found</h2>
                <button
                    type='button'
                    onClick={() => navigate(listPath)}
                    className='mt-4 text-[#515DEF] hover:underline cursor-pointer'
                >
                    Back to Admission List
                </button>
            </section>
        )
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Admission Information</h2>
                <AdmissionInfo form={form} onChange={updateField} />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h2 className='text-xl font-semibold text-black'>Student Information</h2>
                <StudentInfo form={form} onChange={updateField} />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h2 className='text-xl font-semibold text-black'>Transport Information</h2>
                <TransportInfo form={form} onChange={updateField} />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h2 className='text-xl font-semibold text-black'>Parents Information</h2>
                <ParentsInfo form={form} onChange={updateField} />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h2 className='text-xl font-semibold text-black'>Account Information</h2>
                <AccountInformation
                    form={form}
                    onChange={updateField}
                    isEnrolled={form.status === 'Enrolled'}
                />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h2 className='text-xl font-semibold text-black'>Fees Timeline</h2>
                <FeesTimeLine form={form} onChange={updateField} />
            </div>

            {error && <p className='text-sm text-[#F44336] mt-4'>{error}</p>}

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate(listPath)}
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

export default AddAdmission
