import React, { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    DEFAULT_DRIVER,
    LEAVE_TYPES,
    calculateTotalDays,
} from '../leaveRequestData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 w-full focus:outline-none focus:border-[#515DEF]'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 w-full bg-white focus:outline-none focus:border-[#515DEF]'

const parseDate = (value) => {
    if (!value) return null
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

const LeaveRequestForm = ({ record, readOnly = false, showRequestId = false }) => {
    const defaults = record ?? DEFAULT_DRIVER
    const [fromDate, setFromDate] = useState(() => parseDate(record?.fromDate) ?? new Date())
    const [toDate, setToDate] = useState(() => parseDate(record?.toDate) ?? new Date())
    const [appliedDate, setAppliedDate] = useState(() => parseDate(record?.appliedDate) ?? new Date())

    const totalDays = useMemo(
        () => (readOnly ? record?.totalDays : calculateTotalDays(fromDate, toDate)),
        [readOnly, record?.totalDays, fromDate, toDate],
    )

    const renderField = (label, content) => (
        <div className='flex flex-col gap-y-2'>
            <label className='text-base font-medium text-[#1E1E1E]'>{label}</label>
            {content}
        </div>
    )

    if (readOnly) {
        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                {showRequestId && renderField('Leave Request ID:', <div className={inputClass}>{record?.leaveRequestId || '—'}</div>)}
                {renderField('Driver Name:', <div className={inputClass}>{record?.driverName || '—'}</div>)}
                {renderField('Driver ID:', <div className={inputClass}>{record?.driverId || '—'}</div>)}
                {renderField('Leave Type:', <div className={inputClass}>{record?.leaveType || '—'}</div>)}
                {renderField('From Date:', <div className={inputClass}>{record?.fromDate || '—'}</div>)}
                {renderField('To Date:', <div className={inputClass}>{record?.toDate || '—'}</div>)}
                {renderField('Total Days:', <div className={inputClass}>{record?.totalDays ?? '—'}</div>)}
                {renderField('Applied Date:', <div className={inputClass}>{record?.appliedDate || '—'}</div>)}
                {renderField('Reason:', <div className={inputClass}>{record?.reason || '—'}</div>)}
            </div>
        )
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            {renderField(
                'Driver Name:',
                <input type='text' defaultValue={defaults.driverName ?? ''} className={inputClass} />,
            )}
            {renderField(
                'Driver ID:',
                <input type='text' defaultValue={defaults.driverId ?? ''} className={inputClass} />,
            )}
            {renderField(
                'Leave Type:',
                <select defaultValue={record?.leaveType ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {LEAVE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>,
            )}
            {renderField(
                'From Date:',
                <div className='relative'>
                    <DatePicker
                        selected={fromDate}
                        onChange={(date) => setFromDate(date)}
                        dateFormat='dd-MM-yyyy'
                        isClearable
                        placeholderText='Select date'
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none focus:border-[#515DEF]'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>,
            )}
            {renderField(
                'To Date:',
                <div className='relative'>
                    <DatePicker
                        selected={toDate}
                        onChange={(date) => setToDate(date)}
                        dateFormat='dd-MM-yyyy'
                        isClearable
                        placeholderText='Select date'
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none focus:border-[#515DEF]'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>,
            )}
            {renderField(
                'Total Days:',
                <input
                    type='text'
                    readOnly
                    value={totalDays || ''}
                    placeholder='Auto-calculated'
                    className={`${inputClass} bg-[#F9FAFB]`}
                />,
            )}
            {renderField(
                'Applied Date:',
                <div className='relative'>
                    <DatePicker
                        selected={appliedDate}
                        onChange={(date) => setAppliedDate(date)}
                        dateFormat='dd-MM-yyyy'
                        isClearable
                        placeholderText='Select date'
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none focus:border-[#515DEF]'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>,
            )}
            {renderField(
                'Reason:',
                <input
                    type='text'
                    defaultValue={record?.reason ?? ''}
                    placeholder='e.g. Family Function'
                    className={inputClass}
                />,
            )}
        </div>
    )
}

export default LeaveRequestForm
