import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon, Plus } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { REQUESTS, approvalStatusBadgeColor, stageBadgeColor } from './requestsData'

const parseDmy = (value) => {
    const [day, month, year] = String(value || '').split('-').map(Number)
    return year ? new Date(year, month - 1, day) : null
}

const RequestsApprovalsList = () => {
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [search, setSearch] = useState('')
    const [requestType, setRequestType] = useState('')
    const [approvalStatus, setApprovalStatus] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const visible = REQUESTS.filter((request) => {
        const date = parseDmy(request.submittedDate)
        const query = search.trim().toLowerCase()
        return (!query || `${request.requestId} ${request.title} ${request.vendor}`.toLowerCase().includes(query))
            && (!requestType || request.requestType === requestType)
            && (!approvalStatus || request.approvalStatus === approvalStatus)
            && (!fromDate || (date && date >= fromDate))
            && (!toDate || (date && date <= toDate))
    })

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button type='button' onClick={() => { setSearch(''); setRequestType(''); setApprovalStatus(''); setFromDate(null); setToDate(null) }} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs'>
                        <option value="">From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Search</label>
                        <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Request ID, title, vendor..." className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Request Type</label>
                        <select value={requestType} onChange={(event) => setRequestType(event.target.value)} className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value="">All</option>
                            <option>Hardware</option>
                            <option>Software</option>
                            <option>License</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Approval Status</label>
                        <select value={approvalStatus} onChange={(event) => setApprovalStatus(event.target.value)} className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value="">All</option>
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker selected={fromDate} onChange={setFromDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative w-full'>
                            <DatePicker selected={toDate} onChange={setToDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Requests & Approvals</h2>
                    <div className='flex gap-x-2'>
                        <NavLink to="/it-support-manager/requests-approvals/add-request" className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Plus size={16} />
                            Add Request
                        </NavLink>
                        <button onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">S.No</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Request ID</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Request Type</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Title</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Vendor</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Amount</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Submitted Date</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Approval Status</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Current Stage</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((request, index) => (
                                <tr key={request.requestId} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className="px-2 py-4 rounded-s-lg">{index + 1}</td>
                                    <td className="px-2 py-4 font-medium text-[#1E1E1E]">{request.requestId}</td>
                                    <td className="px-2 py-4">{request.requestType}</td>
                                    <td className="px-2 py-4 max-w-[160px] truncate" title={request.title}>{request.title}</td>
                                    <td className="px-2 py-4 max-w-[140px] truncate" title={request.vendor}>{request.vendor}</td>
                                    <td className="px-2 py-4 whitespace-nowrap">{request.amount}</td>
                                    <td className="px-2 py-4 whitespace-nowrap">{request.submittedDate}</td>
                                    <td className="px-2 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${approvalStatusBadgeColor[request.approvalStatus]}`}>
                                            {request.approvalStatus}
                                        </span>
                                    </td>
                                    <td className="px-2 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${stageBadgeColor[request.currentStage]}`}>
                                            {request.currentStage}
                                        </span>
                                    </td>
                                    <td className="px-2 py-4 text-center rounded-e-lg">
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink to={`/it-support-manager/requests-approvals/view-request/${request.requestId}`} className="w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer block">View</NavLink>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>Showing 1 to {REQUESTS.length} of {REQUESTS.length} entries</p>
                <div className="flex justify-center gap-x-2">
                    <button className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer"><ChevronLeft size={16} /></button>
                    <button className="size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] border border-[#E2E8F0] rounded-full cursor-pointer">1</button>
                    <button className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer"><ChevronRight size={16} /></button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default RequestsApprovalsList
