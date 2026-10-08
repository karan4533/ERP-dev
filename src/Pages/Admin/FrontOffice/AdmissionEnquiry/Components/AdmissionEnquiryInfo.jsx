import React, { useMemo } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import ProfileUpload from './ProfileUpload'
import StateCityFields from '../../../../../Common/CommonComponents/StateCityFields'
import {
    GENDER_OPTIONS,
    REFERENCE_OPTIONS,
    SOURCE_OPTIONS,
} from '../admissionEnquiryData'
import { getCreatedUsersByRole } from '../../../../../Common/RBAC/createdUsersData'
import { CLASS_LEVEL_OPTIONS } from '../../../Class/ClassDetails/classDetailsOptions'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const AdmissionEnquiryInfo = ({ form, onChange, readOnly = false }) => {
    const assignees = useMemo(() => {
        const created = getCreatedUsersByRole('prm')
            .filter((user) => user.status === 'Active')
            .map((user) => user.name)
        const defaults = ['Admin Desk', 'Front Office']
        return [...new Set([...created, ...defaults])]
    }, [])

    const update = (key, value) => {
        if (readOnly) return
        onChange?.(key, value)
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='name' className='text-base font-medium text-[#1E1E1E]'>Name:</label>
                <input
                    id='name'
                    type='text'
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    disabled={readOnly}
                    className={inputClass}
                    placeholder='Student / enquiry name'
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='mobileNumber' className='text-base font-medium text-[#1E1E1E]'>Mobile Number:</label>
                <input
                    id='mobileNumber'
                    type='text'
                    value={form.mobileNumber}
                    onChange={(e) => update('mobileNumber', e.target.value)}
                    disabled={readOnly}
                    className={inputClass}
                    placeholder='10-digit mobile number'
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='email' className='text-base font-medium text-[#1E1E1E]'>Email:</label>
                <input
                    id='email'
                    type='email'
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    disabled={readOnly}
                    className={inputClass}
                    placeholder='Optional email'
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='gender' className='text-base font-medium text-[#1E1E1E]'>Gender:</label>
                <select
                    id='gender'
                    value={form.gender}
                    onChange={(e) => update('gender', e.target.value)}
                    disabled={readOnly}
                    className={inputClass}
                >
                    <option value=''>Select gender</option>
                    {GENDER_OPTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='address' className='text-base font-medium text-[#1E1E1E]'>Address:</label>
                <input
                    id='address'
                    type='text'
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                    disabled={readOnly}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='description' className='text-base font-medium text-[#1E1E1E]'>Description:</label>
                <input
                    id='description'
                    type='text'
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    disabled={readOnly}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='note' className='text-base font-medium text-[#1E1E1E]'>Note:</label>
                <input
                    id='note'
                    type='text'
                    value={form.note}
                    onChange={(e) => update('note', e.target.value)}
                    disabled={readOnly}
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={form.enquiryDate}
                        onChange={(date) => update('enquiryDate', date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable={!readOnly}
                        disabled={readOnly}
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Next Follow Up Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={form.nextFollowUpDate}
                        onChange={(date) => update('nextFollowUpDate', date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable={!readOnly}
                        disabled={readOnly}
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='assignedTo' className='text-base font-medium text-[#1E1E1E]'>Assigned:</label>
                <select
                    id='assignedTo'
                    value={form.assignedTo}
                    onChange={(e) => update('assignedTo', e.target.value)}
                    disabled={readOnly}
                    className={inputClass}
                >
                    <option value=''>--Select--</option>
                    {assignees.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='reference' className='text-base font-medium text-[#1E1E1E]'>Reference:</label>
                <select
                    id='reference'
                    value={form.reference}
                    onChange={(e) => update('reference', e.target.value)}
                    disabled={readOnly}
                    className={inputClass}
                >
                    <option value=''>--Select--</option>
                    {REFERENCE_OPTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='source' className='text-base font-medium text-[#1E1E1E]'>Source:</label>
                <select
                    id='source'
                    value={form.source}
                    onChange={(e) => update('source', e.target.value)}
                    disabled={readOnly}
                    className={inputClass}
                >
                    <option value=''>--Select--</option>
                    {SOURCE_OPTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='className' className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                <select
                    id='className'
                    value={form.className}
                    onChange={(e) => update('className', e.target.value)}
                    disabled={readOnly}
                    className={inputClass}
                >
                    <option value=''>Select Class</option>
                    {CLASS_LEVEL_OPTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='numberOfChild' className='text-base font-medium text-[#1E1E1E]'>Number Of Child:</label>
                <input
                    id='numberOfChild'
                    type='text'
                    value={form.numberOfChild}
                    onChange={(e) => update('numberOfChild', e.target.value)}
                    disabled={readOnly}
                    className={inputClass}
                />
            </div>
            <StateCityFields
                state={form.state}
                city={form.city}
                onStateChange={(value) => update('state', value)}
                onCityChange={(value) => update('city', value)}
                readOnly={readOnly}
                stateId='state'
                cityId='city'
                selectClassName={inputClass}
            />
            <div className='cols-span-1 md:col-span-3 lg:col-span-3'>
                <div className='flex flex-col gap-y-2'>
                    <label className='text-base font-medium text-[#1E1E1E]'>Profile Image:</label>
                    {readOnly ? (
                        form.profileImage ? (
                            <img src={form.profileImage} alt={form.name} className='w-20 h-20 rounded-full object-cover' />
                        ) : (
                            <p className='text-sm text-[#667085]'>No profile image</p>
                        )
                    ) : (
                        <ProfileUpload
                            value={form.profileImage}
                            onChange={(value) => update('profileImage', value)}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdmissionEnquiryInfo
