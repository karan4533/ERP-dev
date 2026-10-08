import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IssueReturnInfo from './Components/IssueReturnInfo'
import IssueReturnModal from './Components/IssueReturnModal'

const AddIssueReturn = () => {
    const navigate = useNavigate()
    const [issueReturnModal, setIssueReturnModal] = useState(false)

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Record Issue / Return</h2>
                <IssueReturnInfo />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button type='button' onClick={() => navigate('/stationery-store-manager/issue-returns')} className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Discard Changes
                </button>
                <button type='button' onClick={() => setIssueReturnModal(true)} className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Save Changes
                </button>
            </div>

            <IssueReturnModal issueReturnModal={issueReturnModal} setIssueReturnModal={setIssueReturnModal} />
        </section>
    )
}

export default AddIssueReturn
