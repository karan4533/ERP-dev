import React from 'react'
import { DRIVER_OPTIONS, VEHICLE_OPTIONS } from '../routeManagementData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const RouteDetailsForm = ({ route }) => (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='route-name' className='text-base font-medium text-[#1E1E1E]'>Route Name:</label>
            <input type='text' id='route-name' defaultValue={route?.routeName ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='vehicle-number' className='text-base font-medium text-[#1E1E1E]'>Vehicle Number:</label>
            <select id='vehicle-number' defaultValue={route?.vehicleNumber ?? ''} className={selectClass}>
                <option value=''>--Select--</option>
                {VEHICLE_OPTIONS.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.vehicleNumber}>{vehicle.vehicleNumber}</option>
                ))}
            </select>
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='select-driver' className='text-base font-medium text-[#1E1E1E]'>Select Driver:</label>
            <select id='select-driver' defaultValue={route?.driverName ?? ''} className={selectClass}>
                <option value=''>--Select--</option>
                {DRIVER_OPTIONS.map((driver) => (
                    <option key={driver.id} value={driver.label}>{driver.label}</option>
                ))}
            </select>
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='driver-contact' className='text-base font-medium text-[#1E1E1E]'>Driver Contact:</label>
            <input type='text' id='driver-contact' defaultValue={route?.driverContact ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='vehicle-id' className='text-base font-medium text-[#1E1E1E]'>Vehicle ID:</label>
            <select id='vehicle-id' defaultValue={route?.vehicleId ?? ''} className={selectClass}>
                <option value=''>--Select--</option>
                {VEHICLE_OPTIONS.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.id}</option>
                ))}
            </select>
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='start-location' className='text-base font-medium text-[#1E1E1E]'>Start Location:</label>
            <input type='text' id='start-location' defaultValue={route?.startLocation ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='end-location' className='text-base font-medium text-[#1E1E1E]'>End Location:</label>
            <input type='text' id='end-location' defaultValue={route?.endLocation ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='pick-up-time' className='text-base font-medium text-[#1E1E1E]'>Pick Up Time:</label>
            <input type='text' id='pick-up-time' defaultValue={route?.pickUpTime ?? ''} placeholder='e.g. 06:45 AM' className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='drop-time' className='text-base font-medium text-[#1E1E1E]'>Drop Time:</label>
            <input type='text' id='drop-time' defaultValue={route?.dropTime ?? ''} placeholder='e.g. 07:30 AM' className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='yearly-fees' className='text-base font-medium text-[#1E1E1E]'>Yearly Fees:</label>
            <input type='text' id='yearly-fees' defaultValue={route?.yearlyFees ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='half-yearly-fees' className='text-base font-medium text-[#1E1E1E]'>Half Yearly Fees:</label>
            <input type='text' id='half-yearly-fees' defaultValue={route?.halfYearlyFees ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='quarterly-fees' className='text-base font-medium text-[#1E1E1E]'>Quarterly Fees:</label>
            <input type='text' id='quarterly-fees' defaultValue={route?.quarterlyFees ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='monthly-fees' className='text-base font-medium text-[#1E1E1E]'>Monthly Fees:</label>
            <input type='text' id='monthly-fees' defaultValue={route?.monthlyFees ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='support-staff' className='text-base font-medium text-[#1E1E1E]'>Support Staff:</label>
            <input type='text' id='support-staff' defaultValue={route?.supportStaff ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='total-stops' className='text-base font-medium text-[#1E1E1E]'>Total Stops:</label>
            <input type='number' id='total-stops' defaultValue={route?.totalStops ?? ''} className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='distance' className='text-base font-medium text-[#1E1E1E]'>Distance:</label>
            <input type='text' id='distance' defaultValue={route?.distance ?? ''} placeholder='e.g. 18.5 km' className={inputClass} />
        </div>
        <div className='flex flex-col gap-y-2'>
            <label htmlFor='estimated-time' className='text-base font-medium text-[#1E1E1E]'>Estimated Time:</label>
            <input type='text' id='estimated-time' defaultValue={route?.estimatedTime ?? ''} placeholder='e.g. 45 mins' className={inputClass} />
        </div>
    </div>
)

export default RouteDetailsForm
