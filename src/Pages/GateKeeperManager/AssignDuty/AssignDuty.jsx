import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { upsertGateDutyAssignment } from './gateDutyData'

const formatDutyDate = (date) => {
    if (!date) return ''
    const d = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(d.getTime())) return ''
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${day}-${month}-${d.getFullYear()}`
}

const AssignDuty = () => {
    const navigate = useNavigate()
    const [dutyDate, setDutyDate] = useState(new Date())
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        dutyId: '',
        gateKeeperName: '',
        employeeId: '',
        assigneeEmail: '',
        gateLocation: 'Main Gate',
        shift: 'Morning',
        startTime: '07:00',
        endTime: '13:00',
        assignedBy: 'Gate Keeper Manager',
    })

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

    const handleSave = async () => {
        if (!form.gateKeeperName.trim()) {
            toast.error('Gate Keeper name is required.')
            return
        }
        if (!form.assigneeEmail.trim()) {
            toast.error('Gate Keeper login email is required so My Duty can isolate assignments.')
            return
        }
        setSaving(true)
        try {
            const email = form.assigneeEmail.trim().toLowerCase()
            const result = await upsertGateDutyAssignment({
                ...form,
                assigneeEmail: email,
                // Keep employeeId usable as email match for older My Duty filters.
                employeeId: form.employeeId.trim() || email,
                dutyDate: formatDutyDate(dutyDate),
            })
            if (result?.success === false) {
                toast.error(result.message || 'Could not save duty to API.')
                return
            }
            toast.success('Duty assigned — visible on Gate Keeper → My Duty.')
            navigate('/gatekeeper-manager/assign-duty-list')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Assign Duty Information</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Saved to campus ops (`gate-duty-assignments`). Gate Keeper My Duty reads the same list.
                </p>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Duty ID:</label>
                        <input
                            type='text'
                            value={form.dutyId}
                            onChange={(e) => setField('dutyId', e.target.value)}
                            placeholder='Auto if blank'
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Gate Keeper Name:</label>
                        <input
                            type='text'
                            value={form.gateKeeperName}
                            onChange={(e) => setField('gateKeeperName', e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Employee ID:</label>
                        <input
                            type='text'
                            value={form.employeeId}
                            onChange={(e) => setField('employeeId', e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Gate Keeper Email (login):</label>
                        <input
                            type='email'
                            value={form.assigneeEmail}
                            onChange={(e) => setField('assigneeEmail', e.target.value)}
                            placeholder='gatekeeper@…'
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Gate Location:</label>
                        <input
                            type='text'
                            value={form.gateLocation}
                            onChange={(e) => setField('gateLocation', e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Shift:</label>
                        <select
                            value={form.shift}
                            onChange={(e) => setField('shift', e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        >
                            <option value='Morning'>Morning</option>
                            <option value='Afternoon'>Afternoon</option>
                            <option value='Evening'>Evening</option>
                            <option value='Night'>Night</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Duty Date:</label>
                        <div className='relative'>
                            <DatePicker
                                selected={dutyDate}
                                onChange={(date) => setDutyDate(date)}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Start Time:</label>
                        <input
                            type='time'
                            value={form.startTime}
                            onChange={(e) => setField('startTime', e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>End Time:</label>
                        <input
                            type='time'
                            value={form.endTime}
                            onChange={(e) => setField('endTime', e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Assigned By:</label>
                        <input
                            type='text'
                            value={form.assignedBy}
                            onChange={(e) => setField('assignedBy', e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/gatekeeper-manager/assign-duty-list')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    disabled={saving}
                    onClick={handleSave}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-50'
                >
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </section>
    )
}

export default AssignDuty
