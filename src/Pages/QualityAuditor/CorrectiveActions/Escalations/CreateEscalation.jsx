import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import EscalationForm from './Components/EscalationForm'
import { emptyEscalationForm, createEscalation } from './escalationsData'

const CreateEscalation = () => {
    const navigate = useNavigate()
    const [form, setForm] = useState(() => emptyEscalationForm())

    const handleSubmit = (e) => {
        e.preventDefault()
        const record = createEscalation(form)
        navigate(`/quality-auditor/corrective-actions/escalations/view/${record.id}`)
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate('/quality-auditor/corrective-actions/escalations')}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to Escalations
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-xl font-semibold text-black mb-1'>Escalate Observation</h1>
                <p className='text-sm text-[#667085] mb-6'>
                    Escalate an unresolved observation to the appropriate authority for corrective action.
                </p>
                <form onSubmit={handleSubmit}>
                    <EscalationForm form={form} onChange={setForm} />
                    <div className='flex justify-end gap-3 mt-6 pt-6 border-t border-[#EDEEF5]'>
                        <button
                            type='button'
                            onClick={() => navigate('/quality-auditor/corrective-actions/escalations')}
                            className='bg-white text-[#667085] text-sm px-6 py-2.5 rounded-md border border-[#D9D9D9] hover:bg-[#EDEEF5] cursor-pointer'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            className='bg-[#515DEF] text-white text-sm px-6 py-2.5 rounded-md hover:opacity-90 cursor-pointer'
                        >
                            Submit Escalation
                        </button>
                    </div>
                </form>
            </div>
        </section>
    )
}

export default CreateEscalation
