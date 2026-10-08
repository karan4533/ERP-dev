import React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import ProfileUpload from './ProfileUpload'
import StateCityFields from '../../../../../Common/CommonComponents/StateCityFields'
import CountrySelect from '../../../../../Common/CommonComponents/CountrySelect'
import { GENDER_OPTIONS } from '../../AdmissionEnquiry/admissionEnquiryData'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const StudentInfo = ({ form, onChange }) => {
    const update = (key, value) => onChange?.(key, value)

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='firstName' className='text-base font-medium text-[#1E1E1E]'>First Name:</label>
                <input id='firstName' type='text' value={form.firstName} onChange={(e) => update('firstName', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='middleName' className='text-base font-medium text-[#1E1E1E]'>Middle Name:</label>
                <input id='middleName' type='text' value={form.middleName} onChange={(e) => update('middleName', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='lastName' className='text-base font-medium text-[#1E1E1E]'>Last Name:</label>
                <input id='lastName' type='text' value={form.lastName} onChange={(e) => update('lastName', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='gender' className='text-base font-medium text-[#1E1E1E]'>Gender:</label>
                <select id='gender' value={form.gender} onChange={(e) => update('gender', e.target.value)} className={inputClass}>
                    <option value=''>Select Gender</option>
                    {GENDER_OPTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='religion' className='text-base font-medium text-[#1E1E1E]'>Religion:</label>
                <input id='religion' type='text' value={form.religion} onChange={(e) => update('religion', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='caste' className='text-base font-medium text-[#1E1E1E]'>Caste:</label>
                <input id='caste' type='text' value={form.caste} onChange={(e) => update('caste', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='address' className='text-base font-medium text-[#1E1E1E]'>Address:</label>
                <input id='address' type='text' value={form.address} onChange={(e) => update('address', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='dateOfBirth' className='text-base font-medium text-[#1E1E1E]'>Date Of Birth:</label>
                <div className='relative'>
                    <DatePicker
                        selected={form.dateOfBirth}
                        onChange={(date) => update('dateOfBirth', date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
            <CountrySelect id='studentCountry' value={form.country} onChange={(value) => update('country', value)} selectClassName={inputClass} />
            <StateCityFields
                state={form.state}
                city={form.city}
                onStateChange={(value) => update('state', value)}
                onCityChange={(value) => update('city', value)}
                stateId='studentState'
                cityId='studentCity'
            />
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='zipCode' className='text-base font-medium text-[#1E1E1E]'>Zip Code:</label>
                <input id='zipCode' type='text' value={form.zipCode} onChange={(e) => update('zipCode', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='mobileNumber' className='text-base font-medium text-[#1E1E1E]'>Mobile Number:</label>
                <input id='mobileNumber' type='text' value={form.mobileNumber} onChange={(e) => update('mobileNumber', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='altMobileNumber' className='text-base font-medium text-[#1E1E1E]'>Alternative Mobile Number:</label>
                <input id='altMobileNumber' type='text' value={form.altMobileNumber} onChange={(e) => update('altMobileNumber', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='email' className='text-base font-medium text-[#1E1E1E]'>Email:</label>
                <input id='email' type='text' value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='previousSchool' className='text-base font-medium text-[#1E1E1E]'>Previous School:</label>
                <input id='previousSchool' type='text' value={form.previousSchool} onChange={(e) => update('previousSchool', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='bloodGroup' className='text-base font-medium text-[#1E1E1E]'>Blood Group:</label>
                <select id='bloodGroup' value={form.bloodGroup} onChange={(e) => update('bloodGroup', e.target.value)} className={inputClass}>
                    <option value=''>Select Blood Group</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='height' className='text-base font-medium text-[#1E1E1E]'>Height:</label>
                <input id='height' type='text' value={form.height} onChange={(e) => update('height', e.target.value)} className={inputClass} />
            </div>
            <div className='cols-span-1 md:col-span-3 lg:col-span-3 flex flex-col md:flex-row gap-6'>
                <div className='flex flex-col gap-y-2 w-full'>
                    <label htmlFor='weight' className='text-base font-medium text-[#1E1E1E]'>Weight:</label>
                    <input id='weight' type='text' value={form.weight} onChange={(e) => update('weight', e.target.value)} className={inputClass} />
                </div>
                <div className='flex flex-col gap-y-2 w-full'>
                    <label htmlFor='medicalHistory' className='text-base font-medium text-[#1E1E1E]'>Medical History:</label>
                    <input id='medicalHistory' type='text' value={form.medicalHistory} onChange={(e) => update('medicalHistory', e.target.value)} className={inputClass} />
                </div>
            </div>
            <div className='cols-span-1 md:col-span-3 lg:col-span-3'>
                <div className='flex flex-col gap-y-2'>
                    <label className='text-base font-medium text-[#1E1E1E]'>Profile Image:</label>
                    <ProfileUpload value={form.profileImage} onChange={(value) => update('profileImage', value)} />
                </div>
            </div>
        </div>
    )
}

export default StudentInfo
