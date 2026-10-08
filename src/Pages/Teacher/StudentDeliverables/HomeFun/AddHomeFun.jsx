import React from 'react'
import { useNavigate } from 'react-router-dom'
import HomeFunForm from './Components/HomeFunForm'
import { addHomeFunItem } from './homeFunData'

const AddHomeFun = () => {
    const navigate = useNavigate()

    const handleSave = (values) => {
        addHomeFunItem(values)
        navigate('/teacher/student-deliverables/home-fun')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Assignment / Homework Information</h2>
                <HomeFunForm formId='home-fun-form' onSubmit={handleSave} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/teacher/student-deliverables/home-fun')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='submit'
                    form='home-fun-form'
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddHomeFun
