import React, { useState } from 'react'
import { Download } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import PendingTab from './Components/PendingTab'
import ApprovedTab from './Components/ApprovedTab'
import RejectedTab from './Components/RejectedTab'
import ApprovalRulesTab from './Components/ApprovalRulesTab'
import { APPROVAL_DEPARTMENTS, APPROVALS_TABS } from './approvalsData'

const Approvals = () => {
    const [activeTab, setActiveTab] = useState('pending')
    const [department, setDepartment] = useState(APPROVAL_DEPARTMENTS[0])
    const [exportModal, setExportModal] = useState(false)

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Approvals</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Claims & expense approvals
                            {' · '}
                            All Departments
                        </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-3'>
                        <select
                            value={department}
                            onChange={(event) => setDepartment(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[150px]'
                        >
                            {APPROVAL_DEPARTMENTS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                <div className='flex gap-6 overflow-x-auto no-scrollbar mt-6 border-b border-[#F2F4F7]'>
                    {APPROVALS_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type='button'
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap px-1 pb-3 text-sm md:text-base font-medium cursor-pointer transition-all duration-200 ${
                                activeTab === tab.id
                                    ? 'text-[#515DEF] border-b-2 border-[#515DEF] font-semibold'
                                    : 'text-[#808080]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'pending' && <PendingTab />}
            {activeTab === 'approved' && <ApprovedTab />}
            {activeTab === 'rejected' && <RejectedTab />}
            {activeTab === 'approval-rules' && <ApprovalRulesTab />}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default Approvals
