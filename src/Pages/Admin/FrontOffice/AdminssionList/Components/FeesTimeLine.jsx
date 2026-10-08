import React from 'react'
import { FEES_GROUP_OPTIONS } from '../admissionListData'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const FeesTimeLine = ({ form, onChange }) => {
    const update = (key, value) => onChange?.(key, value)

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 lg:mt-6 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='feesGroup' className='text-base font-medium text-[#1E1E1E]'>Select Fees:</label>
                <select id='feesGroup' value={form.feesGroup} onChange={(e) => update('feesGroup', e.target.value)} className={inputClass}>
                    <option value=''>Select Fees Group</option>
                    {FEES_GROUP_OPTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}

export default FeesTimeLine
