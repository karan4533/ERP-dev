import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { looksLikeGoogleMapsUrl, resolveGoogleMapsUrl } from '../../../../services/geoApi'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const StopDetailsForm = ({
    stop,
    index = 0,
    onChange,
    onRemove,
    canRemove = false,
    routeDestinationName = 'Queen Mira International School',
}) => {
    const [mapsStatus, setMapsStatus] = useState('')
    const [resolving, setResolving] = useState(false)

    const resolvePickupMaps = async () => {
        const url = String(stop?.pickupMapsUrl || '').trim()
        if (!url) {
            setMapsStatus('')
            return
        }
        if (!looksLikeGoogleMapsUrl(url)) {
            setMapsStatus('Paste a Google Maps link (Share → Copy link).')
            return
        }
        setResolving(true)
        try {
            const resolved = await resolveGoogleMapsUrl(url)
            const lat = Number(resolved?.lat)
            const lng = Number(resolved?.lng)
            const name = String(resolved?.name || '').trim()
            onChange?.('pickupLat', lat)
            onChange?.('pickupLng', lng)
            onChange?.('pickupMapsUrl', String(resolved?.sourceUrl || url))
            if (name && !String(stop?.startLocation || '').trim()) {
                onChange?.('startLocation', name)
            }
            // Destination for every stop is the route school pin — not edited here.
            onChange?.('endLocation', routeDestinationName)
            setMapsStatus(`Pickup pin set: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        } catch (err) {
            setMapsStatus(err?.message || 'Could not read that Google Maps link.')
        } finally {
            setResolving(false)
        }
    }

    const hasPin = stop?.pickupLat !== '' && stop?.pickupLat != null
        && stop?.pickupLng !== '' && stop?.pickupLng != null
        && !(Number(stop.pickupLat) === 0 && Number(stop.pickupLng) === 0)

    return (
        <div className={`${index > 0 ? 'mt-8 pt-8 border-t border-[#EEF0F6]' : 'lg:mt-8 mt-2'}`}>
            <div className='flex items-center justify-between gap-3 mb-4'>
                <h3 className='text-base font-medium text-[#0C1E5B]'>Stop {index + 1}</h3>
                {canRemove && (
                    <button
                        type='button'
                        onClick={onRemove}
                        className='inline-flex items-center gap-1.5 text-sm text-[#F04438] border border-[#FDA29B] px-3 py-1.5 rounded-md hover:bg-[#FEF3F2] transition-colors cursor-pointer'
                    >
                        <Trash2 size={14} />
                        Remove
                    </button>
                )}
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6'>
                <div className='flex flex-col gap-y-2'>
                    <label className='text-base font-medium text-[#1E1E1E]'>Pickup point name:</label>
                    <input
                        type='text'
                        value={stop?.startLocation ?? ''}
                        onChange={(event) => onChange?.('startLocation', event.target.value)}
                        className={inputClass}
                        placeholder='e.g. Velachery Main Road'
                    />
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label className='text-base font-medium text-[#1E1E1E]'>Destination (route):</label>
                    <input
                        type='text'
                        value={routeDestinationName}
                        readOnly
                        className={`${inputClass} bg-[#F9FAFB]`}
                    />
                    <p className='text-xs text-[#667085]'>Same school destination set on the route above.</p>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label className='text-base font-medium text-[#1E1E1E]'>Pick Up Time:</label>
                    <input
                        type='text'
                        value={stop?.pickUpTime ?? ''}
                        placeholder='e.g. 06:45 AM'
                        onChange={(event) => onChange?.('pickUpTime', event.target.value)}
                        className={inputClass}
                    />
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label className='text-base font-medium text-[#1E1E1E]'>Drop Time:</label>
                    <input
                        type='text'
                        value={stop?.dropTime ?? ''}
                        placeholder='e.g. 07:00 AM'
                        onChange={(event) => onChange?.('dropTime', event.target.value)}
                        className={inputClass}
                    />
                </div>
                <div className='flex flex-col gap-y-2 sm:col-span-2 lg:col-span-3'>
                    <label className='text-base font-medium text-[#1E1E1E]'>Pickup Google Maps link:</label>
                    <input
                        type='url'
                        value={stop?.pickupMapsUrl ?? ''}
                        onChange={(event) => {
                            onChange?.('pickupMapsUrl', event.target.value)
                            setMapsStatus('')
                        }}
                        onBlur={resolvePickupMaps}
                        className={inputClass}
                        placeholder='Paste Google Maps link for this pickup only'
                        autoComplete='off'
                    />
                    <p className={`text-xs ${mapsStatus.includes('set:') ? 'text-emerald-600' : 'text-[#667085]'}`}>
                        {resolving
                            ? 'Reading pickup pin from Google Maps…'
                            : (mapsStatus
                                || (hasPin
                                    ? `Saved pickup pin: ${Number(stop.pickupLat).toFixed(5)}, ${Number(stop.pickupLng).toFixed(5)}`
                                    : 'Only pickup needs a Maps link here — destination uses the route school link.'))}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default StopDetailsForm
