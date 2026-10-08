import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AttachmentsUpload from './Components/AttachmentsUpload'
import { ASSIGNEE_OPTIONS, PRIORITY_OPTIONS, STATUS_OPTIONS } from './taskData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const AddTask = () => {
    const navigate = useNavigate()
    const [assignedDate, setAssignedDate] = useState(new Date())
    const [dueDate, setDueDate] = useState(new Date())
    const [selectedAssignee, setSelectedAssignee] = useState('')

    const handleAssigneeChange = (e) => {
        setSelectedAssignee(e.target.value)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Add Task</h2>
                <p className='text-sm text-[#667085] mt-1'>Tasks can be assigned only to department managers and the Joint Director Assistant.</p>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="task-id" className='text-base font-medium text-[#1E1E1E]'>Task ID</label>
                        <input type="text" id="task-id" placeholder="e.g. JD-T-007" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="task-title" className='text-base font-medium text-[#1E1E1E]'>Task Title</label>
                        <input type="text" id="task-title" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2 lg:col-span-3'>
                        <label htmlFor="task-description" className='text-base font-medium text-[#1E1E1E]'>Task Description</label>
                        <textarea id="task-description" rows={3} className={`${inputClass} resize-none`} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="assigned-to" className='text-base font-medium text-[#1E1E1E]'>Assigned To</label>
                        <select
                            id="assigned-to"
                            className={selectClass}
                            value={selectedAssignee}
                            onChange={handleAssigneeChange}
                        >
                            <option value="" disabled>Select assignee</option>
                            {ASSIGNEE_OPTIONS.map((label) => (
                                <option key={label} value={label}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="priority" className='text-base font-medium text-[#1E1E1E]'>Priority</label>
                        <select id="priority" className={selectClass} defaultValue="">
                            <option value="" disabled>Select priority</option>
                            {PRIORITY_OPTIONS.map((priority) => (
                                <option key={priority} value={priority}>{priority}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2 w-full'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Assigned Date</label>
                        <div className='relative'>
                            <DatePicker
                                selected={assignedDate}
                                onChange={setAssignedDate}
                                dateFormat="dd/MM/yyyy"
                                isClearable
                                className="w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none"
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2 w-full'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Due Date</label>
                        <div className='relative'>
                            <DatePicker
                                selected={dueDate}
                                onChange={setDueDate}
                                dateFormat="dd/MM/yyyy"
                                isClearable
                                className="w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none"
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2 w-full'>
                        <label htmlFor="status" className='text-base font-medium text-[#1E1E1E]'>Status</label>
                        <select id="status" className={selectClass} defaultValue="">
                            <option value="" disabled>Select status</option>
                            {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className='col-span-full flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Upload Document</label>
                        <AttachmentsUpload />
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/joint-director/task-management')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button type='button' className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddTask
