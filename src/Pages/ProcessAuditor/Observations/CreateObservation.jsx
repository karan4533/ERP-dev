import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ObservationForm from './Components/ObservationForm'
import { emptyObservationForm, createObservation } from './observationsData'
import EntryClosureGate from '../../../Common/demoDomain/EntryClosureGate'
import { entryBlocked } from '../../../Common/demoDomain/governance'

const CreateObservation = () => {
    const navigate = useNavigate()
    const [form, setForm] = useState(() => emptyObservationForm())

    const handleSubmit = (e) => {
        e.preventDefault()
        if (entryBlocked('Audit', 'Process Auditor')) return
        const record = createObservation(form)
        navigate(`/process-auditor/observations/view/${record.id}`)
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate('/process-auditor/observations/open')}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to Open Observations
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-xl font-semibold text-black mb-1'>Create Observation</h1>
                <p className='text-sm text-[#667085] mb-6'>
                    Raise a new observation when an audit process fails or non-compliance is identified.
                </p>
                <EntryClosureGate moduleName='Audit' actor='Process Auditor' />
                <form onSubmit={handleSubmit}>
                    <ObservationForm form={form} onChange={setForm} />
                    <div className='flex justify-end gap-3 mt-6 pt-6 border-t border-[#EDEEF5]'>
                        <button
                            type='button'
                            onClick={() => navigate('/process-auditor/observations/open')}
                            className='bg-white text-[#667085] text-sm px-6 py-2.5 rounded-md border border-[#D9D9D9] hover:bg-[#EDEEF5] cursor-pointer'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            className='bg-[#515DEF] text-white text-sm px-6 py-2.5 rounded-md hover:opacity-90 cursor-pointer'
                        >
                            Create Observation
                        </button>
                    </div>
                </form>
            </div>
        </section>
    )
}

export default CreateObservation
