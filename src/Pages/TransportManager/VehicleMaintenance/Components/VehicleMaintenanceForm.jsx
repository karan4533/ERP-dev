import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    VEHICLE_TYPES,
    SERVICE_TYPES,
    MAINTENANCE_STATUSES,
    getMaintenanceVehicleOptions,
    getServiceCenters,
    hydrateServiceCentersFromApi,
} from '../vehicleMaintenanceData'
import { hydrateVehiclesFromApi } from '../../VehicleManagement/vehicleManagementData'
import { formatTransportDate, parseTransportDate } from '../../transportCampus'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const VehicleMaintenanceForm = forwardRef(({ record }, ref) => {
    const [vehicles, setVehicles] = useState(() => getMaintenanceVehicleOptions())
    const [serviceCenters, setServiceCenters] = useState(() => getServiceCenters())
    const [loadingVehicles, setLoadingVehicles] = useState(false)

    const [lastServiceDate, setLastServiceDate] = useState(() => parseTransportDate(record?.lastServiceDate))
    const [nextServiceDate, setNextServiceDate] = useState(() => parseTransportDate(record?.nextServiceDate))
    const [vehicleNumber, setVehicleNumber] = useState(record?.vehicleNumber ?? '')
    const [vehicleType, setVehicleType] = useState(record?.vehicleType ?? '')
    const [serviceType, setServiceType] = useState(record?.serviceType ?? '')
    const [serviceCenter, setServiceCenter] = useState(record?.serviceCenter ?? '')
    const [estimatedCost, setEstimatedCost] = useState(record?.estimatedCost ?? '')
    const [status, setStatus] = useState(record?.status ?? '')

    useEffect(() => {
        let cancelled = false
        setLoadingVehicles(true)
        Promise.all([hydrateVehiclesFromApi(), hydrateServiceCentersFromApi()])
            .finally(() => {
                if (!cancelled) {
                    setVehicles(getMaintenanceVehicleOptions())
                    setServiceCenters(getServiceCenters())
                    setLoadingVehicles(false)
                }
            })
        return () => {
            cancelled = true
        }
    }, [])

    const handleVehicleChange = (e) => {
        const selected = vehicles.find((vehicle) => vehicle.label === e.target.value)
        setVehicleNumber(e.target.value)
        if (selected?.vehicleType) {
            setVehicleType(selected.vehicleType)
        }
    }

    useImperativeHandle(ref, () => ({
        getValues: () => ({
            vehicleNumber,
            vehicleType,
            lastServiceDate: formatTransportDate(lastServiceDate),
            nextServiceDate: formatTransportDate(nextServiceDate),
            serviceType,
            serviceCenter,
            estimatedCost: String(estimatedCost).trim(),
            status,
        }),
        validate: () => {
            if (!String(vehicleNumber).trim()) return 'Vehicle is required.'
            if (!serviceType) return 'Service type is required.'
            return null
        },
    }))

    const loadingLabel = loadingVehicles ? 'Loading vehicles…' : '--Select--'

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-number' className='text-base font-medium text-[#1E1E1E]'>Vehicle Number:</label>
                <select id='vehicle-number' value={vehicleNumber} onChange={handleVehicleChange} className={selectClass}>
                    <option value=''>{loadingLabel}</option>
                    {vehicleNumber && !vehicles.some((v) => v.label === vehicleNumber) && (
                        <option value={vehicleNumber}>{vehicleNumber}</option>
                    )}
                    {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.label}>{vehicle.label}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-type' className='text-base font-medium text-[#1E1E1E]'>Vehicle Type:</label>
                <select id='vehicle-type' value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={selectClass}>
                    <option value=''>--Select--</option>
                    {VEHICLE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Last Service Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={lastServiceDate}
                        onChange={(date) => setLastServiceDate(date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Next Service Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={nextServiceDate}
                        onChange={(date) => setNextServiceDate(date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='service-type' className='text-base font-medium text-[#1E1E1E]'>Service Type:</label>
                <select id='service-type' value={serviceType} onChange={(e) => setServiceType(e.target.value)} className={selectClass}>
                    <option value=''>--Select--</option>
                    {SERVICE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <div className='flex items-center justify-between gap-2'>
                    <label htmlFor='service-center' className='text-base font-medium text-[#1E1E1E]'>Service Center:</label>
                    <NavLink
                        to='/transport-manager/service-centers'
                        className='text-xs font-medium text-[#515DEF] hover:underline'
                    >
                        Manage centers
                    </NavLink>
                </div>
                <select id='service-center' value={serviceCenter} onChange={(e) => setServiceCenter(e.target.value)} className={selectClass}>
                    <option value=''>--Select--</option>
                    {serviceCenter && !serviceCenters.includes(serviceCenter) && (
                        <option value={serviceCenter}>{serviceCenter}</option>
                    )}
                    {serviceCenters.map((center) => (
                        <option key={center} value={center}>{center}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='estimated-cost' className='text-base font-medium text-[#1E1E1E]'>Estimated Cost:</label>
                <input
                    type='text'
                    id='estimated-cost'
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    placeholder='e.g. ₹12,500'
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='status' className='text-base font-medium text-[#1E1E1E]'>Status:</label>
                <select id='status' value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
                    <option value=''>--Select--</option>
                    {MAINTENANCE_STATUSES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
        </div>
    )
})

VehicleMaintenanceForm.displayName = 'VehicleMaintenanceForm'

export default VehicleMaintenanceForm
