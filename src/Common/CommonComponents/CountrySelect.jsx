import React from 'react'
import { COUNTRY_OPTIONS } from '../countryData'

const defaultSelectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const CountrySelect = ({
    value = '',
    onChange,
    readOnly = false,
    id = 'country',
    label = 'Country:',
    selectClassName = defaultSelectClass,
    placeholder = 'Select Country',
}) => {
    if (readOnly) {
        return (
            <div className='flex flex-col gap-y-2'>
                <label htmlFor={id} className='text-base font-medium text-[#1E1E1E]'>{label}</label>
                <input
                    id={id}
                    type='text'
                    value={value || '—'}
                    disabled
                    className={selectClassName}
                />
            </div>
        )
    }

    return (
        <div className='flex flex-col gap-y-2'>
            <label htmlFor={id} className='text-base font-medium text-[#1E1E1E]'>{label}</label>
            <select
                id={id}
                value={value}
                onChange={(event) => onChange?.(event.target.value)}
                className={selectClassName}
            >
                <option value=''>{placeholder}</option>
                {COUNTRY_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                ))}
            </select>
        </div>
    )
}

export default CountrySelect
