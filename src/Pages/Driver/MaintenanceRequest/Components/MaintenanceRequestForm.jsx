import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { useAuth } from '../../../../context/AuthContext'
import { formatTransportDate } from '../../../TransportManager/transportCampus'
import { hydrateDriverProfileSources } from '../../driverProfileData'
import {
    ISSUE_CATEGORIES,
    PRIORITIES,
    getDefaultDriver,
} from '../maintenanceRequestData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 w-full focus:outline-none focus:border-[#515DEF]'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 w-full bg-white focus:outline-none focus:border-[#515DEF]'

const parseDate = (value) => {
    if (!value) return new Date()
    const [day, month, year] = String(value).split('-').map(Number)
    if (!day || !month || !year) return new Date()
    return new Date(year, month - 1, day)
}

const MaintenanceRequestForm = forwardRef(({ record, readOnly = false, showRequestId = false }, ref) => {
    const { email } = useAuth()
    const [vehicleNumber, setVehicleNumber] = useState(record?.vehicleNumber || '')
    const [driverName, setDriverName] = useState(record?.driverName || '')
    const [issueCategory, setIssueCategory] = useState(record?.issueCategory || '')
    const [issueDescription, setIssueDescription] = useState(record?.issueDescription || '')
    const [priority, setPriority] = useState(record?.priority || 'High')
    const [odometerReading, setOdometerReading] = useState(record?.odometerReading || '')
    const [requestDate, setRequestDate] = useState(() => parseDate(record?.reportedDate))

    useEffect(() => {
        if (record) return undefined
        let cancelled = false
        hydrateDriverProfileSources().finally(() => {
            if (cancelled) return
            const next = getDefaultDriver(email)
            setVehicleNumber(next.vehicleNumber || '')
            setDriverName(next.driverName || '')
        })
        return () => { cancelled = true }
    }, [email, record])

    useImperativeHandle(ref, () => ({
        getValues: () => ({
            vehicleNumber: String(vehicleNumber).trim(),
            driverName: String(driverName).trim(),
            issueCategory: String(issueCategory).trim(),
            issueDescription: String(issueDescription).trim(),
            priority: String(priority).trim() || 'Medium',
            odometerReading: String(odometerReading).trim(),
            reportedDate: formatTransportDate(requestDate) || formatTransportDate(new Date()),
        }),
        validate: () => {
            if (!String(vehicleNumber).trim()) return 'Vehicle number is required.'
            if (!String(issueCategory).trim()) return 'Issue category is required.'
            if (!String(issueDescription).trim()) return 'Issue description is required.'
            return null
        },
    }))

    const renderField = (label, content) => (
        <div className='flex flex-col gap-y-2'>
            <label className='text-base font-medium text-[#1E1E1E]'>{label}</label>
            {content}
        </div>
    )

    if (readOnly) {
        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                {showRequestId && renderField('Request ID:', <div className={inputClass}>{record?.requestId || '—'}</div>)}
                {renderField('Vehicle Number:', <div className={inputClass}>{record?.vehicleNumber || '—'}</div>)}
                {renderField('Driver Name:', <div className={inputClass}>{record?.driverName || '—'}</div>)}
                {renderField('Issue Category:', <div className={inputClass}>{record?.issueCategory || '—'}</div>)}
                {renderField('Issue Description:', <div className={inputClass}>{record?.issueDescription || '—'}</div>)}
                {renderField('Priority:', <div className={inputClass}>{record?.priority || '—'}</div>)}
                {renderField('Odometer Reading:', <div className={inputClass}>{record?.odometerReading || '—'}</div>)}
                {renderField('Request Date:', <div className={inputClass}>{record?.reportedDate || '—'}</div>)}
            </div>
        )
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            {renderField('Vehicle Number:', (
                <input type='text' value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className={inputClass} />
            ))}
            {renderField('Driver Name:', (
                <input type='text' value={driverName} onChange={(e) => setDriverName(e.target.value)} className={inputClass} />
            ))}
            {renderField('Issue Category:', (
                <select value={issueCategory} onChange={(e) => setIssueCategory(e.target.value)} className={selectClass}>
                    <option value=''>--Select--</option>
                    {ISSUE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
            ))}
            {renderField('Issue Description:', (
                <input
                    type='text'
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder='Describe the issue...'
                    className={inputClass}
                />
            ))}
            {renderField('Priority:', (
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}>
                    {PRIORITIES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            ))}
            {renderField('Odometer Reading:', (
                <input
                    type='text'
                    value={odometerReading}
                    onChange={(e) => setOdometerReading(e.target.value)}
                    placeholder='e.g. 45,250 KM'
                    className={inputClass}
                />
            ))}
            {renderField('Request Date:', (
                <div className='relative'>
                    <DatePicker
                        selected={requestDate}
                        onChange={(date) => setRequestDate(date)}
                        dateFormat='dd-MM-yyyy'
                        isClearable
                        placeholderText='Select date'
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none focus:border-[#515DEF]'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            ))}
        </div>
    )
})

MaintenanceRequestForm.displayName = 'MaintenanceRequestForm'

export default MaintenanceRequestForm
