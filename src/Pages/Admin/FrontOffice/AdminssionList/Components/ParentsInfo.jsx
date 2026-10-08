import React from 'react'
import StateCityFields from '../../../../../Common/CommonComponents/StateCityFields'
import CountrySelect from '../../../../../Common/CommonComponents/CountrySelect'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const ParentsInfo = ({ form, onChange }) => {
    const update = (key, value) => onChange?.(key, value)

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='fatherName' className='text-base font-medium text-[#1E1E1E]'>Father&apos;s Name:</label>
                <input id='fatherName' type='text' value={form.fatherName} onChange={(e) => update('fatherName', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='motherName' className='text-base font-medium text-[#1E1E1E]'>Mother&apos;s Name:</label>
                <input id='motherName' type='text' value={form.motherName} onChange={(e) => update('motherName', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='fatherOccupation' className='text-base font-medium text-[#1E1E1E]'>Father&apos;s Occupation</label>
                <input id='fatherOccupation' type='text' value={form.fatherOccupation} onChange={(e) => update('fatherOccupation', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='motherOccupation' className='text-base font-medium text-[#1E1E1E]'>Mother&apos;s Occupation</label>
                <input id='motherOccupation' type='text' value={form.motherOccupation} onChange={(e) => update('motherOccupation', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='fatherIncome' className='text-base font-medium text-[#1E1E1E]'>Father&apos;s Yearly Income:</label>
                <input id='fatherIncome' type='text' value={form.fatherIncome} onChange={(e) => update('fatherIncome', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='motherIncome' className='text-base font-medium text-[#1E1E1E]'>Mother&apos;s Yearly Income:</label>
                <input id='motherIncome' type='text' value={form.motherIncome} onChange={(e) => update('motherIncome', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='siblings' className='text-base font-medium text-[#1E1E1E]'>Siblings:</label>
                <input id='siblings' type='text' value={form.siblings} onChange={(e) => update('siblings', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='parentAddress' className='text-base font-medium text-[#1E1E1E]'>Address</label>
                <input id='parentAddress' type='text' value={form.parentAddress} onChange={(e) => update('parentAddress', e.target.value)} className={inputClass} />
            </div>
            <CountrySelect id='parentCountry' value={form.parentCountry} onChange={(value) => update('parentCountry', value)} selectClassName={inputClass} />
            <StateCityFields
                state={form.parentState}
                city={form.parentCity}
                onStateChange={(value) => update('parentState', value)}
                onCityChange={(value) => update('parentCity', value)}
                stateId='parentState'
                cityId='parentCity'
            />
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='parentZipCode' className='text-base font-medium text-[#1E1E1E]'>Zip Code:</label>
                <input id='parentZipCode' type='text' value={form.parentZipCode} onChange={(e) => update('parentZipCode', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='parentMobileNumber' className='text-base font-medium text-[#1E1E1E]'>Mobile Number:</label>
                <input id='parentMobileNumber' type='text' value={form.parentMobileNumber} onChange={(e) => update('parentMobileNumber', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='parentAltMobileNumber' className='text-base font-medium text-[#1E1E1E]'>Alternative Mobile Number:</label>
                <input id='parentAltMobileNumber' type='text' value={form.parentAltMobileNumber} onChange={(e) => update('parentAltMobileNumber', e.target.value)} className={inputClass} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='parentEmail' className='text-base font-medium text-[#1E1E1E]'>Email:</label>
                <input id='parentEmail' type='text' value={form.parentEmail} onChange={(e) => update('parentEmail', e.target.value)} className={inputClass} />
            </div>
        </div>
    )
}

export default ParentsInfo
