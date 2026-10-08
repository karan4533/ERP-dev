import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from 'lucide-react'
import ProfileUpload from './ProfileUpload';
import StateCityFields from '../../../../Common/CommonComponents/StateCityFields';
import CountrySelect from '../../../../Common/CommonComponents/CountrySelect';

const StudentInfo = () => {

    const [dateOfBirth, setDateOfBirth] = useState(new Date());
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>First Name:</label>
                <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Middle Name:</label>
                <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Last Name:</label>
                <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Gender:</label>
                <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                    <option value="">Male</option>
                    <option value="">Female</option>
                    <option value="">Others</option>
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Religion:</label>
                <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Caste:</label>
                <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Address:</label>
                <input type="text" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Date Of Birth:</label>
                <div className='relative'>
                    <DatePicker
                        selected={dateOfBirth}
                        onChange={(date) => setDateOfBirth(date)}
                        dateFormat="dd/MM/yyyy"
                        isClearable
                        className="w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none"
                    />

                    <Calendar
                        size={16}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                    />
                </div>
            </div>
            <CountrySelect
                id='studentCountry'
                value={country}
                onChange={setCountry}
            />
            <StateCityFields
                state={state}
                city={city}
                onStateChange={setState}
                onCityChange={setCity}
                stateId='studentState'
                cityId='studentCity'
            />
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Zip Code:</label>
                <input type='text' name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Mobile Number:</label>
                <input type='text' name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Alternative Mobile Number:</label>
                <input type='text' name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Email:</label>
                <input type='text' name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Previous School:</label>
                <input type='text' name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Blood Group:</label>
                <select name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                    <option value="">Select Blood Group</option>
                    <option value="">A+</option>
                    <option value="">A-</option>
                    <option value="">B+</option>
                    <option value="">B-</option>
                    <option value="">AB+</option>
                    <option value="">AB-</option>
                    <option value="">O+</option>
                    <option value="">O-</option>
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Height:</label>
                <input type='text' name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
            </div>
            <div className='cols-span-1 md:col-span-3 lg:col-span-3 flex flex-col md:flex-row gap-6'>
                <div className='flex flex-col gap-y-2 w-full'>
                    <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Weight:</label>
                    <input type='text' name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                </div>
                <div className='flex flex-col gap-y-2 w-full'>
                    <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Medical History:</label>
                    <input type='text' name="" id="" className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full' />
                </div>
            </div>
            <div className='cols-span-1 md:col-span-3 lg:col-span-3'>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor="" className='text-base font-medium text-[#1E1E1E]'>Profile Image:</label>
                    <ProfileUpload />
                </div>
            </div>
        </div>
    )
}

export default StudentInfo