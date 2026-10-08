import React, { useMemo } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import MaterialItemsTable from './MaterialItemsTable'
import ApprovalSection from './ApprovalSection'
import {
    calculateTotalItems,
    createDefaultApprovals,
    createEmptyMaterialRow,
    getNextMgpPreview,
    getPassTypeTitle,
    normalizeApprovals,
    PASS_TYPE_OPTIONS,
} from '../materialGatePassData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const parseDate = (value) => {
    if (!value) return new Date()
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return new Date()
    return new Date(year, month - 1, day)
}

const formatDate = (date) => {
    if (!date) return ''
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
}

const MaterialGatePassForm = ({ formData, onChange, errors = {}, isEdit = false }) => {
    const mgpPreview = useMemo(() => (isEdit ? formData.mgpNo : getNextMgpPreview()), [formData.mgpNo, isEdit])
    const totalItems = useMemo(() => calculateTotalItems(formData.materials), [formData.materials])

    const setField = (field, value) => onChange({ ...formData, [field]: value })

    return (
        <div className='space-y-6'>
            <div className='rounded-xl border border-[#515DEF33] bg-[#F8F9FF] p-4 sm:p-5'>
                <div className='text-center space-y-1 mb-4'>
                    <p className='text-lg sm:text-xl font-bold tracking-wide text-[#0C1E5B] uppercase'>
                        Queen Mira International School
                    </p>
                    <p className='text-xs sm:text-sm text-[#667085]'>
                        Melakkal Main Road, Kochadai, Madurai - 625016
                    </p>
                    <p className='text-sm sm:text-base font-semibold text-[#0C1E5B] pt-1'>
                        {getPassTypeTitle(formData.passType)}
                    </p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                    <div className='flex flex-col gap-y-2 md:col-span-1'>
                        <label htmlFor='pass-type' className='text-base font-medium text-[#1E1E1E]'>Pass Type</label>
                        <select
                            id='pass-type'
                            value={formData.passType}
                            onChange={(e) => setField('passType', e.target.value)}
                            className={`${inputClass} bg-white`}
                        >
                            {PASS_TYPE_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                        {errors.passType && <p className='text-xs text-[#FF0000]'>{errors.passType}</p>}
                    </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>M.G.P. No.</label>
                        <input type='text' readOnly value={mgpPreview} className={`${inputClass} bg-[#F9FAFB] font-semibold`} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Date</label>
                        <div className='relative'>
                            <DatePicker
                                selected={parseDate(formData.date)}
                                onChange={(date) => setField('date', formatDate(date))}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                        {errors.date && <p className='text-xs text-[#FF0000]'>{errors.date}</p>}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Time In</label>
                        <div className='grid grid-cols-[1fr_auto] gap-2'>
                            <input
                                type='time'
                                value={formData.time}
                                onChange={(e) => setField('time', e.target.value)}
                                className={inputClass}
                            />
                            <select
                                value={formData.timePeriod}
                                onChange={(e) => setField('timePeriod', e.target.value)}
                                className={`${inputClass} w-24 bg-white`}
                            >
                                <option value='AM'>AM</option>
                                <option value='PM'>PM</option>
                            </select>
                        </div>
                        {errors.time && <p className='text-xs text-[#FF0000]'>{errors.time}</p>}
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 sm:p-5 border border-[#E4E7EC]'>
                <MaterialItemsTable
                    materials={formData.materials}
                    onChange={(materials) => setField('materials', materials)}
                    errors={errors}
                />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 sm:p-5 border border-[#E4E7EC]'>
                <h3 className='text-base font-semibold text-[#0C1E5B] mb-4'>Summary</h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Total No. of Items</label>
                        <input type='text' readOnly value={totalItems} className={`${inputClass} bg-[#F9FAFB] font-semibold`} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Driver Name</label>
                        <input
                            type='text'
                            value={formData.driverName}
                            onChange={(e) => setField('driverName', e.target.value)}
                            placeholder='Enter driver name'
                            className={inputClass}
                        />
                        {errors.driverName && <p className='text-xs text-[#FF0000]'>{errors.driverName}</p>}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Vehicle No.</label>
                        <input
                            type='text'
                            value={formData.vehicleNo}
                            onChange={(e) => setField('vehicleNo', e.target.value)}
                            placeholder='TN-58-XX-0000'
                            className={inputClass}
                        />
                        {errors.vehicleNo && <p className='text-xs text-[#FF0000]'>{errors.vehicleNo}</p>}
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 sm:p-5 border border-[#E4E7EC]'>
                <ApprovalSection
                    approvals={formData.approvals}
                    onChange={(approvals) => setField('approvals', approvals)}
                />
            </div>
        </div>
    )
}

export const createInitialFormData = () => ({
    mgpNo: '',
    passType: 'Non-Returnable',
    date: formatDate(new Date()),
    time: '10:00',
    timePeriod: 'AM',
    materials: [createEmptyMaterialRow()],
    driverName: '',
    vehicleNo: '',
    approvals: createDefaultApprovals(),
    createdBy: 'Front Office',
})

export const recordToFormData = (record) => ({
    mgpNo: record.mgpNo,
    passType: record.passType ?? 'Non-Returnable',
    date: record.date,
    time: record.time,
    timePeriod: record.timePeriod,
    materials: record.materials?.length ? record.materials : [createEmptyMaterialRow()],
    driverName: record.driverName,
    vehicleNo: record.vehicleNo,
    approvals: normalizeApprovals(record.approvals ?? createDefaultApprovals()),
    createdBy: record.createdBy ?? 'Front Office',
})

export const validateMaterialGatePassForm = (formData) => {
    const errors = {}
    if (!formData.passType) errors.passType = 'Pass type is required.'
    if (!formData.date) errors.date = 'Date is required.'
    if (!formData.time) errors.time = 'Time is required.'
    if (!formData.driverName?.trim()) errors.driverName = 'Driver name is required.'
    if (!formData.vehicleNo?.trim()) errors.vehicleNo = 'Vehicle number is required.'

    formData.materials.forEach((row, index) => {
        if (!row.description?.trim()) {
            errors[`materials.${index}.description`] = 'Description is required.'
        }
        if (!row.quantity || Number(row.quantity) < 1) {
            errors[`materials.${index}.quantity`] = 'Quantity must be at least 1.'
        }
    })

    return errors
}

export default MaterialGatePassForm
