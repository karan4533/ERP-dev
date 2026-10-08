import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RequestInfo from './Components/RequestInfo'
import RequestModal from './Components/RequestModal'

const AddRequest = () => {
    const navigate = useNavigate()
    const [requestModal, setRequestModal] = useState(false)

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Add Request</h2>
                <RequestInfo />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button type='button' onClick={() => navigate('/housekeeping-manager/requests-approvals')} className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Discard Changes
                </button>
                <button type='button' onClick={() => setRequestModal(true)} className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Save Changes
                </button>
            </div>

            <RequestModal requestModal={requestModal} setRequestModal={setRequestModal} />
        </section>
    )
}

export default AddRequest
