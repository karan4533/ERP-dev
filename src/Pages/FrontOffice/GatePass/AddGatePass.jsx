import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ArrowLeft, Send } from 'lucide-react'
import StudentGatePassForm from './Components/StudentGatePassForm'
import {
    DEFAULT_GATE_PASS_FORM,
    addStudentGatePass,
    formatGatePassDate,
    validateStudentGatePassForm,
} from './gatePassData'

const AddGatePass = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        ...DEFAULT_GATE_PASS_FORM,
        date: formatGatePassDate(new Date()),
    })
    const [errors, setErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    const handleSave = () => {
        const validationErrors = validateStudentGatePassForm(formData)
        setErrors(validationErrors)
        if (Object.keys(validationErrors).length > 0) {
            toast.error('Please complete all mandatory fields.')
            return
        }

        setSubmitting(true)
        const result = addStudentGatePass(formData)
        setSubmitting(false)

        if (!result.success) {
            toast.error(result.message || 'Failed to submit gate pass request.')
            return
        }

        toast.success(`Gate pass request submitted successfully! Routed to Principal and Director of Academics.`)
        navigate('/front-office/gate-pass-list')
    }

    return (
        <section className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                    <button
                        type='button'
                        onClick={() => navigate('/front-office/gate-pass-list')}
                        className='inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer'
                    >
                        <ArrowLeft size={14} /> Back to Gate Passes
                    </button>
                    <div>
                        <h2 className='text-base font-bold text-slate-900'>Create Student Gate Pass Request</h2>
                        <p className='text-xs text-slate-500'>
                            Issue exit clearance for enrolled students with authorized accompanying escorts.
                        </p>
                    </div>
                </div>
                <button
                    type='button'
                    onClick={handleSave}
                    disabled={submitting}
                    className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer disabled:opacity-50'
                >
                    <Send size={14} /> {submitting ? 'Submitting...' : 'Submit for Approval'}
                </button>
            </div>

            <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-xs'>
                <StudentGatePassForm
                    formData={formData}
                    onChange={setFormData}
                    errors={errors}
                />
                <div className='mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3'>
                    <button
                        type='button'
                        onClick={() => navigate('/front-office/gate-pass-list')}
                        className='rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer'
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={handleSave}
                        disabled={submitting}
                        className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer'
                    >
                        <Send size={14} /> Submit Request
                    </button>
                </div>
            </div>
        </section>
    )
}

export default AddGatePass
