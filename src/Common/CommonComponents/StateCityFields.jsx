import React from 'react'
import { STATE_OPTIONS, getCitiesByState } from '../stateCityData'

const defaultSelectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const StateCityFields = ({
    state = '',
    city = '',
    onStateChange,
    onCityChange,
    readOnly = false,
    stateId = 'state',
    cityId = 'city',
    selectClassName = defaultSelectClass,
}) => {
    const cities = getCitiesByState(state)

    const handleStateChange = (event) => {
        const nextState = event.target.value
        onStateChange?.(nextState)
        if (city && !getCitiesByState(nextState).includes(city)) {
            onCityChange?.('')
        }
    }

    if (readOnly) {
        return (
            <>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor={stateId} className='text-base font-medium text-[#1E1E1E]'>State:</label>
                    <input
                        id={stateId}
                        type='text'
                        value={state || '—'}
                        disabled
                        className={selectClassName}
                    />
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor={cityId} className='text-base font-medium text-[#1E1E1E]'>City:</label>
                    <input
                        id={cityId}
                        type='text'
                        value={city || '—'}
                        disabled
                        className={selectClassName}
                    />
                </div>
            </>
        )
    }

    return (
        <>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor={stateId} className='text-base font-medium text-[#1E1E1E]'>State:</label>
                <select
                    id={stateId}
                    value={state}
                    onChange={handleStateChange}
                    className={selectClassName}
                >
                    <option value=''>Select State</option>
                    {STATE_OPTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor={cityId} className='text-base font-medium text-[#1E1E1E]'>City:</label>
                <select
                    id={cityId}
                    value={city}
                    onChange={(event) => onCityChange?.(event.target.value)}
                    disabled={!state}
                    className={selectClassName}
                >
                    <option value=''>{state ? 'Select City' : 'Select state first'}</option>
                    {cities.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
        </>
    )
}

export default StateCityFields
