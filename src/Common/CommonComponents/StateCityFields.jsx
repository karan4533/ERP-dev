import React, { useState, useMemo, useEffect } from 'react'
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
    const cities = useMemo(() => getCitiesByState(state), [state])
    const [isCustomCity, setIsCustomCity] = useState(false)

    // Sync isCustomCity if city exists and is not in cities list
    useEffect(() => {
        if (city && cities.length > 0 && !cities.includes(city)) {
            setIsCustomCity(true)
        }
    }, [city, cities])

    const handleStateChange = (event) => {
        const nextState = event.target.value
        onStateChange?.(nextState)
        setIsCustomCity(false)
        const newCities = getCitiesByState(nextState)
        if (city && !newCities.includes(city)) {
            onCityChange?.('')
        }
    }

    const handleCitySelect = (event) => {
        const val = event.target.value
        if (val === '__CUSTOM__') {
            setIsCustomCity(true)
            onCityChange?.('')
        } else {
            setIsCustomCity(false)
            onCityChange?.(val)
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
                <div className='flex items-center justify-between'>
                    <label htmlFor={cityId} className='text-base font-medium text-[#1E1E1E]'>City:</label>
                    {state && (
                        <button
                            type='button'
                            onClick={() => {
                                setIsCustomCity(!isCustomCity)
                                if (isCustomCity) onCityChange?.('')
                            }}
                            className='text-xs text-[#515DEF] hover:underline cursor-pointer'
                        >
                            {isCustomCity ? 'Choose from list' : 'Enter other city'}
                        </button>
                    )}
                </div>
                {isCustomCity ? (
                    <input
                        id={cityId}
                        type='text'
                        placeholder='Type city name'
                        value={city}
                        onChange={(e) => onCityChange?.(e.target.value)}
                        className={selectClassName}
                    />
                ) : (
                    <select
                        id={cityId}
                        value={city}
                        onChange={handleCitySelect}
                        disabled={!state}
                        className={selectClassName}
                    >
                        <option value=''>{state ? `Select City (${cities.length} available)` : 'Select state first'}</option>
                        {cities.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                        <option value='__CUSTOM__'>+ Other (Type manually)...</option>
                    </select>
                )}
            </div>
        </>
    )
}

export default StateCityFields
