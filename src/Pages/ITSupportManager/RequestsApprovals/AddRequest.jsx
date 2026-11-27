import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../../context/AuthContext'
import RequestInfo from './Components/RequestInfo'
import RequestModal from './Components/RequestModal'
import { EMPTY_REQUEST_FORM, addRequest, validateRequestForm } from './requestsData'

const AddRequest = () => {
    const navigate = useNavigate()
    const { name, email } = useAuth()
    const [requestModal, setRequestModal] = useState(false)
    const [form, setForm] = useState(EMPTY_REQUEST_FORM)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const requestedBy = name || email || ''

    const handleSave = async () => {
        if (busy) return
        const problem = validateRequestForm(form)
        if (problem) {
            setError(problem)
            return
        }
        setBusy(true)
        setError('')
        try {
            const result = await addRequest(form, { requestedBy })
            if (!result.success) {
                setError(result.message)
                toast.error(result.message)
                return
            }
            setForm(EMPTY_REQUEST_FORM)
            setRequestModal(true)
        } finally {
            setBusy(false)
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Add Request</h2>
                <RequestInfo form={form} onChange={(next) => { setForm(next); setError('') }} requestedBy={requestedBy} />
            </div>

            {error ? (
                <div className='mt-4 rounded-xl border border-[#F5D7DA] bg-[#FDF3F4] px-4 py-3 text-sm text-[#980E0F]' role='alert'>{error}</div>
            ) : null}

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button type='button' onClick={() => navigate('/it-support-manager/requests-approvals')} className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Discard Changes
                </button>
                <button type='button' onClick={handleSave} disabled={busy} className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'>
                    {busy ? 'Saving…' : 'Save Changes'}
                </button>
            </div>

            <RequestModal requestModal={requestModal} setRequestModal={setRequestModal} />
        </section>
    )
}

export default AddRequest
