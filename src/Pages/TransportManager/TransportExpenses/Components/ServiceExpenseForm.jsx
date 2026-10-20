import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    SERVICE_TYPES,
    getExpenseServiceCenters,
    getExpenseVehicleOptions,
} from '../transportExpensesData'
import { hydrateServiceCentersFromApi } from '../../VehicleMaintenance/serviceCentersData'
import { hydrateVehiclesFromApi } from '../../VehicleManagement/vehicleManagementData'
import { formatTransportDate, parseTransportDate } from '../../transportCampus'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const textareaClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full min-h-[100px] resize-y'

const ServiceExpenseForm = forwardRef(({ expense }, ref) => {
    const [vehicles, setVehicles] = useState(() => getExpenseVehicleOptions())
    const [serviceCenters, setServiceCenters] = useState(() => getExpenseServiceCenters())
    const [loadingVehicles, setLoadingVehicles] = useState(false)

    const [serviceDate, setServiceDate] = useState(() => parseTransportDate(expense?.serviceDate))
    const [vehicleNumber, setVehicleNumber] = useState(expense?.vehicleNumber ?? '')
    const [serviceType, setServiceType] = useState(expense?.serviceType ?? '')
    const [serviceCenter, setServiceCenter] = useState(expense?.serviceCenter ?? '')
    const [amount, setAmount] = useState(expense?.amount ?? '')
    const [invoiceNumber, setInvoiceNumber] = useState(expense?.invoiceNumber ?? '')
    const [remarks, setRemarks] = useState(expense?.remarks ?? '')

    useEffect(() => {
        let cancelled = false
        setLoadingVehicles(true)
        Promise.all([hydrateVehiclesFromApi(), hydrateServiceCentersFromApi()])
            .finally(() => {
                if (!cancelled) {
                    setVehicles(getExpenseVehicleOptions())
                    setServiceCenters(getExpenseServiceCenters())
                    setLoadingVehicles(false)
                }
            })
        return () => {
            cancelled = true
        }
    }, [])

    useImperativeHandle(ref, () => ({
        getValues: () => ({
            vehicleNumber,
            serviceType,
            serviceDate: formatTransportDate(serviceDate),
            serviceCenter,
            amount: String(amount).trim(),
            invoiceNumber: String(invoiceNumber).trim(),
            remarks: String(remarks).trim(),
        }),
        validate: () => {
            if (!String(vehicleNumber).trim()) return 'Vehicle is required.'
            if (!serviceType) return 'Service type is required.'
            if (!String(amount).trim()) return 'Amount is required.'
            return null
        },
    }))

    const loadingLabel = loadingVehicles ? 'Loading vehicles…' : '--Select--'

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-number' className='text-base font-medium text-[#1E1E1E]'>Vehicle Number:</label>
                <select id='vehicle-number' value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className={selectClass}>
                    <option value=''>{loadingLabel}</option>
                    {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.label}>{vehicle.label}</option>
                    ))}
                </select>
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
                <label className='text-base font-medium text-[#1E1E1E]'>Service Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={serviceDate}
                        onChange={(date) => setServiceDate(date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='service-center' className='text-base font-medium text-[#1E1E1E]'>Service Center:</label>
                <select id='service-center' value={serviceCenter} onChange={(e) => setServiceCenter(e.target.value)} className={selectClass}>
                    <option value=''>--Select--</option>
                    {serviceCenters.map((center) => (
                        <option key={center} value={center}>{center}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='amount' className='text-base font-medium text-[#1E1E1E]'>Amount:</label>
                <input type='text' id='amount' value={amount} onChange={(e) => setAmount(e.target.value)} placeholder='e.g. ₹12,500' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='invoice-number' className='text-base font-medium text-[#1E1E1E]'>Invoice Number:</label>
                <input type='text' id='invoice-number' value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder='e.g. INV-SRV-2026-0142' className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                <label htmlFor='remarks' className='text-base font-medium text-[#1E1E1E]'>Remarks:</label>
                <textarea id='remarks' value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder='Additional notes about the service expense...' className={textareaClass} />
            </div>
        </div>
    )
})

ServiceExpenseForm.displayName = 'ServiceExpenseForm'

export default ServiceExpenseForm
