import React, { useMemo } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import GoodsItemsTable from './GoodsItemsTable'
import SignatorySection from './SignatorySection'
import {
    PAYMENT_TYPES,
    calculateTotalItems,
    createDefaultSignatories,
    createEmptyGoodsRow,
    getNextGrPreview,
    normalizeSignatories,
} from '../goodsReceivedPassData'

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

const GoodsReceivedPassForm = ({ formData, onChange, errors = {}, isEdit = false }) => {
    const grPreview = useMemo(() => (isEdit ? formData.grNo : getNextGrPreview()), [formData.grNo, isEdit])
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
                        Goods Received Note
                    </p>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-12 gap-4'>
                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>G.R. No.</label>
                        <input type='text' readOnly value={grPreview} className={`${inputClass} bg-[#F9FAFB] font-semibold`} />
                    </div>

                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Payment Type</label>
                        <div className='flex gap-4 mt-1'>
                            {PAYMENT_TYPES.map((type) => (
                                <label key={type} className='inline-flex items-center gap-2 text-sm text-[#1E1E1E] cursor-pointer'>
                                    <input
                                        type='radio'
                                        name='paymentType'
                                        value={type}
                                        checked={formData.paymentType === type}
                                        onChange={(e) => setField('paymentType', e.target.value)}
                                        className='w-4 h-4 text-[#515DEF] border-[#D9D9D9]'
                                    />
                                    {type}
                                </label>
                            ))}
                        </div>
                        {errors.paymentType && <p className='text-xs text-[#FF0000]'>{errors.paymentType}</p>}
                    </div>

                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
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

                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
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

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-[#E4E7EC]'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Supplier Name</label>
                        <input
                            type='text'
                            value={formData.supplierName}
                            onChange={(e) => setField('supplierName', e.target.value)}
                            placeholder='Enter supplier name'
                            className={inputClass}
                        />
                        {errors.supplierName && <p className='text-xs text-[#FF0000]'>{errors.supplierName}</p>}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Bill No.</label>
                        <input
                            type='text'
                            value={formData.billNo}
                            onChange={(e) => setField('billNo', e.target.value)}
                            placeholder='Enter bill number'
                            className={inputClass}
                        />
                        {errors.billNo && <p className='text-xs text-[#FF0000]'>{errors.billNo}</p>}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Bill Date</label>
                        <div className='relative'>
                            <DatePicker
                                selected={parseDate(formData.billDate)}
                                onChange={(date) => setField('billDate', formatDate(date))}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                        {errors.billDate && <p className='text-xs text-[#FF0000]'>{errors.billDate}</p>}
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 sm:p-5 border border-[#E4E7EC]'>
                <GoodsItemsTable
                    materials={formData.materials}
                    onChange={(materials) => setField('materials', materials)}
                    errors={errors}
                />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 sm:p-5 border border-[#E4E7EC]'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='flex flex-col gap-y-2 md:col-span-1'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Total No. of Items</label>
                        <input type='text' readOnly value={totalItems} className={`${inputClass} bg-[#F9FAFB] font-semibold`} />
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 sm:p-5 border border-[#E4E7EC]'>
                <SignatorySection
                    signatories={formData.signatories}
                    onChange={(signatories) => setField('signatories', signatories)}
                />
            </div>
        </div>
    )
}

export const createInitialFormData = () => ({
    grNo: '',
    paymentType: 'CASH',
    date: formatDate(new Date()),
    time: '10:00',
    timePeriod: 'AM',
    supplierName: '',
    billNo: '',
    billDate: formatDate(new Date()),
    materials: [createEmptyGoodsRow()],
    signatories: createDefaultSignatories(),
    createdBy: 'Front Office',
})

export const recordToFormData = (record) => ({
    grNo: record.grNo,
    paymentType: record.paymentType,
    date: record.date,
    time: record.time,
    timePeriod: record.timePeriod,
    supplierName: record.supplierName,
    billNo: record.billNo,
    billDate: record.billDate,
    materials: record.materials?.length ? record.materials : [createEmptyGoodsRow()],
    signatories: normalizeSignatories(record.signatories ?? createDefaultSignatories()),
    createdBy: record.createdBy ?? 'Front Office',
})

export const validateGoodsReceivedPassForm = (formData) => {
    const errors = {}
    if (!formData.paymentType) errors.paymentType = 'Payment type is required.'
    if (!formData.date) errors.date = 'Date is required.'
    if (!formData.time) errors.time = 'Time is required.'
    if (!formData.supplierName?.trim()) errors.supplierName = 'Supplier name is required.'
    if (!formData.billNo?.trim()) errors.billNo = 'Bill number is required.'
    if (!formData.billDate) errors.billDate = 'Bill date is required.'

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

export default GoodsReceivedPassForm
