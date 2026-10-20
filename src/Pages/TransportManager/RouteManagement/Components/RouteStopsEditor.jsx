import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { Plus } from 'lucide-react'
import StopDetailsForm from './StopDetailsForm'

const createEmptyStop = () => ({
    key: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startLocation: '',
    endLocation: '',
    pickUpTime: '',
    dropTime: '',
})

const toEditableStops = (stops) => {
    if (Array.isArray(stops) && stops.length > 0) {
        return stops.map((stop, index) => ({
            ...createEmptyStop(),
            startLocation: stop.startLocation ?? '',
            endLocation: stop.endLocation ?? '',
            pickUpTime: stop.pickUpTime ?? '',
            dropTime: stop.dropTime ?? '',
            key: stop.key || `stop-seed-${index}`,
        }))
    }
    return [createEmptyStop()]
}

const stripStop = (stop) => ({
    startLocation: String(stop.startLocation ?? '').trim(),
    endLocation: String(stop.endLocation ?? '').trim(),
    pickUpTime: String(stop.pickUpTime ?? '').trim(),
    dropTime: String(stop.dropTime ?? '').trim(),
})

const RouteStopsEditor = forwardRef(({ initialStops }, ref) => {
    const [stops, setStops] = useState(() => toEditableStops(initialStops))

    useImperativeHandle(ref, () => ({
        getStops: () => stops.map(stripStop).filter((stop) => (
            stop.startLocation
            || stop.endLocation
            || stop.pickUpTime
            || stop.dropTime
        )),
        getStopCount: () => stops.length,
    }))

    const updateStop = (index, key, value) => {
        setStops((prev) => prev.map((stop, i) => (
            i === index ? { ...stop, [key]: value } : stop
        )))
    }

    const addStop = () => {
        setStops((prev) => [...prev, createEmptyStop()])
    }

    const removeStop = (index) => {
        setStops((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
    }

    return (
        <div>
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <div>
                    <h2 className='text-xl font-semibold text-black'>Add Stops</h2>
                    <p className='text-xs text-[#667085] mt-0.5'>
                        Location and timings only — route fees apply to every stop.
                    </p>
                </div>
                <button
                    type='button'
                    onClick={addStop}
                    className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer'
                >
                    <Plus size={16} />
                    Add Stop
                </button>
            </div>

            {stops.map((stop, index) => (
                <StopDetailsForm
                    key={stop.key}
                    stop={stop}
                    index={index}
                    canRemove={stops.length > 1}
                    onChange={(key, value) => updateStop(index, key, value)}
                    onRemove={() => removeStop(index)}
                />
            ))}
        </div>
    )
})

RouteStopsEditor.displayName = 'RouteStopsEditor'

export default RouteStopsEditor
