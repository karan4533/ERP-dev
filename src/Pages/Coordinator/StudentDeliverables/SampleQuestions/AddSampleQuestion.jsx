import React from 'react'
import { useNavigate } from 'react-router-dom'
import SampleQuestionForm from './Components/SampleQuestionForm'
import { addSampleQuestion, ROUTE_BASE } from './sampleQuestionsData'

const AddSampleQuestion = () => {
    const navigate = useNavigate()

    const handleSave = (values) => {
        addSampleQuestion(values)
        navigate(ROUTE_BASE)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Sample Questions Information</h2>
                <SampleQuestionForm formId='sample-question-form' onSubmit={handleSave} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate(ROUTE_BASE)}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='submit'
                    form='sample-question-form'
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddSampleQuestion
