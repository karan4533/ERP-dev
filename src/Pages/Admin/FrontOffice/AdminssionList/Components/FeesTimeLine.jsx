import React, { useMemo } from 'react'
import { FEES_GROUP_OPTIONS, formatFeesGroups, parseFeesGroups } from '../admissionListData'

const FeesTimeLine = ({ form, onChange }) => {
    const selected = useMemo(
        () => parseFeesGroups(form?.feesGroup).filter((item) => !item.startsWith('RegFeeStatus:')),
        [form?.feesGroup],
    )

    const toggle = (option) => {
        const next = selected.includes(option)
            ? selected.filter((item) => item !== option)
            : [...selected, option]
        onChange?.('feesGroup', formatFeesGroups(next))
    }

    return (
        <div className='grid grid-cols-1 gap-6 lg:mt-6 mt-2'>
            <div className='flex flex-col gap-y-3'>
                <label className='text-base font-medium text-[#1E1E1E]'>Select Fees:</label>
                <p className='text-xs text-[#667085]'>Choose one or more fee groups for this student.</p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {FEES_GROUP_OPTIONS.map((option) => {
                        const checked = selected.includes(option)
                        return (
                            <label
                                key={option}
                                htmlFor={`fees-group-${option}`}
                                className={`flex items-center gap-3 rounded-md border px-3 py-3 cursor-pointer transition-colors ${
                                    checked
                                        ? 'border-[#515DEF] bg-[#EEF0FF]'
                                        : 'border-[#D9D9D9] bg-white hover:border-[#515DEF]/60'
                                }`}
                            >
                                <input
                                    id={`fees-group-${option}`}
                                    type='checkbox'
                                    checked={checked}
                                    onChange={() => toggle(option)}
                                    className='h-4 w-4 accent-[#515DEF] cursor-pointer'
                                />
                                <span className='text-sm text-[#1E1E1E]'>{option}</span>
                            </label>
                        )
                    })}
                </div>
                {selected.length > 0 && (
                    <p className='text-sm text-[#515DEF]'>
                        Selected: {selected.join(', ')}
                    </p>
                )}
            </div>
        </div>
    )
}

export default FeesTimeLine
