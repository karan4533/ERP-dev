import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StarRatingInput from './Components/StarRatingInput'
import {
    ACADEMIC_YEAR_MONTHS,
    EMPLOYEE_TYPE_OPTIONS,
    RATING_CATEGORY,
    getEmployeesByType,
} from './starRatingsData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const AddRatings = () => {
    const navigate = useNavigate()
    const [employeeType, setEmployeeType] = useState('teacher')
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
    const [month, setMonth] = useState(ACADEMIC_YEAR_MONTHS[0])
    const [rating, setRating] = useState(0)
    const [description, setDescription] = useState('')

    const employeeOptions = getEmployeesByType(employeeType)
    const selectedEmployee = employeeOptions.find((emp) => emp.id === selectedEmployeeId)

    const handleEmployeeTypeChange = (type) => {
        setEmployeeType(type)
        setSelectedEmployeeId('')
    }

    const handleSave = () => {
        navigate('/director/star-ratings/star-of-month')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Add Star of the Month Rating</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Rate Teachers and Co-ordinators monthly using a 1–3 star scale ({RATING_CATEGORY}).
                </p>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='employee-type' className='text-base font-medium text-[#1E1E1E]'>Employee Type:</label>
                        <select
                            id='employee-type'
                            value={employeeType}
                            onChange={(e) => handleEmployeeTypeChange(e.target.value)}
                            className={selectClass}
                        >
                            {EMPLOYEE_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='rating-id' className='text-base font-medium text-[#1E1E1E]'>Rating ID:</label>
                        <input type='text' id='rating-id' placeholder='Auto-generated' className={inputClass} readOnly />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='month' className='text-base font-medium text-[#1E1E1E]'>Month:</label>
                        <select
                            id='month'
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className={selectClass}
                        >
                            {ACADEMIC_YEAR_MONTHS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='employee-select' className='text-base font-medium text-[#1E1E1E]'>Employee Name:</label>
                        <select
                            id='employee-select'
                            value={selectedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            className={selectClass}
                        >
                            <option value=''>Select Employee</option>
                            {employeeOptions.map((emp) => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='employee-id' className='text-base font-medium text-[#1E1E1E]'>Employee ID:</label>
                        <input
                            type='text'
                            id='employee-id'
                            value={selectedEmployee?.id ?? ''}
                            className={inputClass}
                            readOnly
                        />
                    </div>
                    <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-1'>
                        <label className='text-base font-medium text-[#1E1E1E]'>{RATING_CATEGORY} (1–3 Stars):</label>
                        <div className='border border-[#D9D9D9] rounded-md px-2 py-3 w-full'>
                            <StarRatingInput value={rating} onChange={setRating} />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-2'>
                        <label htmlFor='description' className='text-base font-medium text-[#1E1E1E]'>Description:</label>
                        <input
                            type='text'
                            id='description'
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder='Brief remarks for this monthly rating'
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/director/star-ratings/star-of-month')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSave}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddRatings
