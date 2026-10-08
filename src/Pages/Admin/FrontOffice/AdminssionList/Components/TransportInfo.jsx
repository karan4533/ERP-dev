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
        if (form.busStop && !getBusStopsByRoute(nextRoute).includes(form.busStop)) {
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
                <select id='routeList' value={form.route} onChange={handleRouteChange} disabled={!schoolBusSelected} className={schoolBusSelected ? inputClass : disabledClass}>
                    <option value=''>{schoolBusSelected ? 'Select Route List' : 'Select School Bus first'}</option>
                    {ROUTE_OPTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='busStop' className='text-base font-medium text-[#1E1E1E]'>Bus Stop:</label>
                <select
                    id='busStop'
                    value={form.busStop}
                    onChange={(event) => update('busStop', event.target.value)}
                    disabled={!schoolBusSelected || !form.route}
                    className={schoolBusSelected && form.route ? inputClass : disabledClass}
                >
                    <option value=''>
                        {!schoolBusSelected ? 'Select School Bus first' : form.route ? 'Select Bus Stop' : 'Select route first'}
                    </option>
                    {busStops.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}

export default TransportInfo
