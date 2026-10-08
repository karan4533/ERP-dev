import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { CLASS_SECTIONS, FEES_STRUCTURES, ROUTE_OPTIONS } from '../studentTransportData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const parseDate = (value) => {
    if (!value) return new Date()
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return new Date()
    return new Date(year, month - 1, day)
}

const StudentTransportForm = ({ record }) => {
    const [createdDate, setCreatedDate] = useState(() => parseDate(record?.createdDate))
    const [routeName, setRouteName] = useState(record?.routeName ?? '')
    const [startLocation, setStartLocation] = useState(record?.startLocation ?? '')
    const [endLocation, setEndLocation] = useState(record?.endLocation ?? '')
    const [vehicleNumber, setVehicleNumber] = useState(record?.vehicleNumber ?? '')
    const [supportStaff, setSupportStaff] = useState(record?.supportStaff ?? '')
    const [driverName, setDriverName] = useState(record?.driverName ?? '')
    const [driverContact, setDriverContact] = useState(record?.driverContact ?? '')
    const [pickUpTime, setPickUpTime] = useState(record?.pickUpTime ?? '')
    const [dropTime, setDropTime] = useState(record?.dropTime ?? '')

    const handleRouteChange = (e) => {
        const selected = ROUTE_OPTIONS.find((route) => route.label === e.target.value)
        setRouteName(e.target.value)
        if (selected) {
            setStartLocation(selected.startLocation)
            setEndLocation(selected.endLocation)
            setVehicleNumber(selected.vehicleNumber)
            setSupportStaff(selected.supportStaff)
            setDriverName(selected.driverName)
            setDriverContact(selected.driverContact)
            setPickUpTime(selected.pickUpTime)
            setDropTime(selected.dropTime)
        }
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='student-id' className='text-base font-medium text-[#1E1E1E]'>Student ID:</label>
                <input type='text' id='student-id' defaultValue={record?.studentId ?? ''} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='student-name' className='text-base font-medium text-[#1E1E1E]'>Student Name:</label>
                <input type='text' id='student-name' defaultValue={record?.studentName ?? ''} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='class-section' className='text-base font-medium text-[#1E1E1E]'>Class & Section:</label>
                <select id='class-section' defaultValue={record?.classSection ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {CLASS_SECTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='admission-number' className='text-base font-medium text-[#1E1E1E]'>Admission Number:</label>
                <input type='text' id='admission-number' defaultValue={record?.admissionNumber ?? ''} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='route-name' className='text-base font-medium text-[#1E1E1E]'>Route Name:</label>
                <select id='route-name' value={routeName} onChange={handleRouteChange} className={selectClass}>
                    <option value=''>--Select--</option>
                    {ROUTE_OPTIONS.map((route) => (
                        <option key={route.id} value={route.label}>{route.label}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-number' className='text-base font-medium text-[#1E1E1E]'>Vehicle Number:</label>
                <input type='text' id='vehicle-number' value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='start-location' className='text-base font-medium text-[#1E1E1E]'>Start Location:</label>
                <input type='text' id='start-location' value={startLocation} onChange={(e) => setStartLocation(e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='end-location' className='text-base font-medium text-[#1E1E1E]'>End Location:</label>
                <input type='text' id='end-location' value={endLocation} onChange={(e) => setEndLocation(e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='pick-up-time' className='text-base font-medium text-[#1E1E1E]'>Pick Up Time:</label>
                <input type='text' id='pick-up-time' value={pickUpTime} onChange={(e) => setPickUpTime(e.target.value)} placeholder='e.g. 06:45 AM' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='drop-time' className='text-base font-medium text-[#1E1E1E]'>Drop Time:</label>
                <input type='text' id='drop-time' value={dropTime} onChange={(e) => setDropTime(e.target.value)} placeholder='e.g. 07:30 AM' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='fees-structure' className='text-base font-medium text-[#1E1E1E]'>Fees Structure:</label>
                <select id='fees-structure' defaultValue={record?.feesStructure?.split(' — ')[0] ?? ''} className={selectClass}>
                    <option value=''>--Select--</option>
                    {FEES_STRUCTURES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='support-staff' className='text-base font-medium text-[#1E1E1E]'>Support Staff:</label>
                <input type='text' id='support-staff' value={supportStaff} onChange={(e) => setSupportStaff(e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='driver-name' className='text-base font-medium text-[#1E1E1E]'>Driver Name:</label>
                <input type='text' id='driver-name' value={driverName} onChange={(e) => setDriverName(e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='driver-contact' className='text-base font-medium text-[#1E1E1E]'>Driver Contact:</label>
                <input type='text' id='driver-contact' value={driverContact} onChange={(e) => setDriverContact(e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Created Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={createdDate}
                        onChange={(date) => setCreatedDate(date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
        </div>
    )
}

export default StudentTransportForm
