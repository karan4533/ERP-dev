import React from 'react'
import { CHECKLIST_RESPONSE_OPTIONS } from '../executeAuditData'

const ResponseControl = ({ parameter, value, onChange }) => {
    const update = (response) => onChange({ ...value, response })

    return (
        <div className='flex flex-wrap gap-4' role='radiogroup' aria-label={`Response for ${parameter.label}`}>
            {CHECKLIST_RESPONSE_OPTIONS.map((option) => (
                <label key={option} className='inline-flex items-center gap-2 cursor-pointer group'>
                    <input
                        type='radio'
                        name={`${parameter.id}-response`}
                        value={option}
                        checked={value.response === option}
                        onChange={() => update(option)}
                        className='size-4 accent-[#515DEF]'
                    />
                    <span
                        className={`text-sm ${
                            value.response === option
                                ? option === 'Yes'
                                    ? 'text-[#4CAF50] font-semibold'
                                    : option === 'No'
                                      ? 'text-[#FF0000] font-semibold'
                                      : 'text-[#FF9800] font-semibold'
                                : 'text-[#667085] group-hover:text-[#1E1E1E]'
                        }`}
                    >
                        {option}
                    </span>
                </label>
            ))}
        </div>
    )
}

export default ResponseControl
