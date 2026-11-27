import React from 'react'
import {
    MODE_OF_TRANSPORT_OPTIONS,
    ROUTE_OPTIONS,
    getBusStopsByRoute,
    isSchoolBusMode,
} from '../../../../../Common/transportData'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
const disabledClass = 'text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-[#F5F5F5] cursor-not-allowed'

const TransportInfo = ({ form, onChange }) => {
    const update = (key, value) => onChange?.(key, value)
    const schoolBusSelected = isSchoolBusMode(form.modeOfTransport)
    const busStops = getBusStopsByRoute(form.route)

    const handleModeChange = (event) => {
        const nextMode = event.target.value
        update('modeOfTransport', nextMode)
        if (!isSchoolBusMode(nextMode)) {
            update('route', '')
            update('busStop', '')
        }
    }

    const handleRouteChange = (event) => {
        const nextRoute = event.target.value
        update('route', nextRoute)
        // Typed (custom) routes keep a typed stop; only a switch between two known routes clears it.
        const switchingKnownRoutes = ROUTE_OPTIONS.includes(form.route) && ROUTE_OPTIONS.includes(nextRoute)
        if (switchingKnownRoutes && form.busStop && !getBusStopsByRoute(nextRoute).includes(form.busStop)) {
            update('busStop', '')
        }
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:mt-6 mt-2'>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='modeOfTransport' className='text-base font-medium text-[#1E1E1E]'>Mode of Transport:</label>
                <select id='modeOfTransport' value={form.modeOfTransport} onChange={handleModeChange} className={inputClass}>
                    <option value=''>Select Mode of Transport</option>
                    {MODE_OF_TRANSPORT_OPTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='routeList' className='text-base font-medium text-[#1E1E1E]'>Route List:</label>
                <input
                    id='routeList'
                    type='text'
                    list='routeListOptions'
                    maxLength={80}
                    autoComplete='off'
                    value={form.route}
                    onChange={handleRouteChange}
                    disabled={!schoolBusSelected}
                    placeholder={schoolBusSelected ? 'Choose or type a route' : 'Select School Bus first'}
                    className={schoolBusSelected ? inputClass : disabledClass}
                />
                <datalist id='routeListOptions'>
                    {ROUTE_OPTIONS.map((item) => (
                        <option key={item} value={item} />
                    ))}
                </datalist>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='busStop' className='text-base font-medium text-[#1E1E1E]'>Bus Stop:</label>
                <input
                    id='busStop'
                    type='text'
                    list='busStopOptions'
                    maxLength={80}
                    autoComplete='off'
                    value={form.busStop}
                    onChange={(event) => update('busStop', event.target.value)}
                    disabled={!schoolBusSelected || !form.route}
                    placeholder={!schoolBusSelected ? 'Select School Bus first' : form.route ? 'Choose or type a bus stop' : 'Enter route first'}
                    className={schoolBusSelected && form.route ? inputClass : disabledClass}
                />
                <datalist id='busStopOptions'>
                    {busStops.map((item) => (
                        <option key={item} value={item} />
                    ))}
                </datalist>
            </div>
        </div>
    )
}

export default TransportInfo
