import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import AdmissionInfo from './Components/AdmissionInfo'
import StudentInfo from './Components/StudentInfo'
import TransportInfo from './Components/TransportInfo'
import ParentsInfo from './Components/ParentsInfo'
import AccountInformation from './Components/AccountInformation'
import ReferralInfo from './Components/ReferralInfo'
import FeesTimeLine from './Components/FeesTimeLine'
import {
    buildInitialAdmissionForm,
    createAdmission,
    getAdmissionById,
    getAdmissionEditPath,
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
        if (locationState?.admission) {
            return toAdmissionFormState(locationState.admission)
        }
        const prefill = locationState?.enquiry
            ? mapEnquiryToAdmissionPrefill(locationState.enquiry)
            : null
        return buildInitialAdmissionForm(prefill, locationState?.fromEnquiryId || '')
    })
    const [error, setError] = useState('')
    const [missingFields, setMissingFields] = useState([])
    const [notFound, setNotFound] = useState(false)
    const apiAdmissionId = locationState?.admissionId || locationState?.admission?.id || null

    // If convert landed on /add-admission with only location.state, bounce to durable edit URL.
    useEffect(() => {
        if (isEdit || !apiAdmissionId) return undefined
        navigate(getAdmissionEditPath(pathname, apiAdmissionId), { replace: true, state: locationState })
        return undefined
    }, [apiAdmissionId, isEdit, locationState, navigate, pathname])

    useEffect(() => {
        const loadId = isEdit ? id : apiAdmissionId
        if (!loadId || (!isEdit && locationState?.admission)) return
        let cancelled = false
        ;(async () => {
            const record = await getAdmissionById(loadId)
            if (cancelled) return
            if (!record) {
                if (isEdit) setNotFound(true)
                return
            }
            setNotFound(false)
            setForm(toAdmissionFormState(record))
        })()
        return () => {
            cancelled = true
        }
    }, [id, isEdit, apiAdmissionId, locationState?.admission])

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
        if (String(value ?? '').trim()) {
            setMissingFields((prev) => prev.filter((item) => item.field !== key))
        }
    }

    const handleSave = async () => {
        setError('')
        setMissingFields([])
        const targetId = isEdit ? id : apiAdmissionId
        const result = targetId
            ? await updateAdmission(targetId, form)
            : await createAdmission(form)
        if (!result.success) {
            setError(result.message)
            toast.error(result.message)
            if (result.missing?.length) {
                setMissingFields(result.missing)
                document.getElementById(result.missing[0].id)?.focus()
            }
            return
        }

        toast.success(targetId ? 'Admission updated successfully.' : 'Admission saved successfully.')
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

    const missingKeys = new Set(missingFields.map((item) => item.field))

    return (
        <section>
            {error && (
                <div role='alert' className='bg-[#FEECEC] text-[#B42318] text-sm rounded-xl px-4 py-3 mb-4'>
                    {error}
                </div>
            )}
            <p className='text-sm text-[#667085] mb-2'>Fields marked <span className='text-[#F44336]'>*</span> are required.</p>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Admission Information</h2>
                <AdmissionInfo form={form} onChange={updateField} missing={missingKeys} />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h2 className='text-xl font-semibold text-black'>Student Information</h2>
                <StudentInfo form={form} onChange={updateField} missing={missingKeys} />
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
                <h2 className='text-xl font-semibold text-black'>Referral</h2>
                <ReferralInfo form={form} onChange={updateField} />
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
