import React from 'react'
import { useNavigate } from 'react-router-dom'
import EnterMarksForm from './Components/EnterMarksForm'
import { addMarksEntry } from './enterMarksData'

const AddEnterMarks = () => {
    const navigate = useNavigate()

    const handleSave = (values) => {
        addMarksEntry(values)
        navigate('/teacher/marks-results/enter-marks')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Enter Marks Information</h2>
                <EnterMarksForm onSubmit={handleSave} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/teacher/marks-results/enter-marks')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='submit'
                    form='enter-marks-form'
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddEnterMarks
