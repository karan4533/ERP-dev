import React, { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import RouteDetailsForm from './Components/RouteDetailsForm'
import RouteStopsEditor from './Components/RouteStopsEditor'
import { upsertRoute } from './routeManagementData'
import { SCHOOL_CAMPUS } from '../../../Common/Transport/schoolCampusLocation'

const AddRoute = () => {
    const navigate = useNavigate()
    const formRef = useRef(null)
    const stopsRef = useRef(null)
    const [saving, setSaving] = useState(false)
    const [destination, setDestination] = useState({
        name: SCHOOL_CAMPUS.name,
        lat: SCHOOL_CAMPUS.lat,
        lng: SCHOOL_CAMPUS.lng,
    })

    const handleMetricsChange = useCallback((metrics) => {
        formRef.current?.applyRouteMetrics?.({
            distance: metrics?.label || undefined,
            estimatedTime: metrics?.estimatedTimeLabel || undefined,
            totalStops: metrics?.totalStops || metrics?.pinnedStops || undefined,
        })
    }, [])

    const syncDestinationFromForm = () => {
        const coords = formRef.current?.getDestinationCoords?.()
        if (!coords) return
        setDestination({
            name: coords.name || SCHOOL_CAMPUS.name,
            lat: coords.lat !== '' && coords.lat != null ? Number(coords.lat) : SCHOOL_CAMPUS.lat,
            lng: coords.lng !== '' && coords.lng != null ? Number(coords.lng) : SCHOOL_CAMPUS.lng,
        })
    }

    const handleSave = async () => {
        const error = await formRef.current?.validate?.()
        if (error) {
            toast.error(error)
            return
        }
        const values = formRef.current.getValues()
        const destinationName = values.endLocation || SCHOOL_CAMPUS.name
        const metrics = stopsRef.current?.getRouteMetrics?.()
        setSaving(true)
        const resolvedStops = typeof stopsRef.current?.getStopsResolved === 'function'
            ? await stopsRef.current.getStopsResolved()
            : (stopsRef.current?.getStops?.() ?? [])
        const stops = resolvedStops.map((stop) => ({
            ...stop,
            endLocation: destinationName,
            yearlyFees: values.yearlyFees || '',
            halfYearlyFees: values.halfYearlyFees || '',
            quarterlyFees: values.quarterlyFees || '',
            monthlyFees: values.monthlyFees || '',
        }))
        const result = await upsertRoute({
            ...values,
            distance: metrics?.label || values.distance,
            estimatedTime: metrics?.estimatedTimeLabel || values.estimatedTime,
            stops,
            totalStops: stops.length || values.totalStops || 0,
        })
        setSaving(false)
        if (result?.success === false) {
            toast.error(result.message || 'Route was not saved — the server did not accept it.')
            return
        }
        toast.success(result?.api ? 'Route saved to campus API.' : 'Route saved.')
        navigate('/transport-manager/route-management')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Route Details Information</h2>
                <div
                    onBlur={syncDestinationFromForm}
                    onChange={syncDestinationFromForm}
                >
                    <RouteDetailsForm ref={formRef} />
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <RouteStopsEditor
                    ref={stopsRef}
                    routeDestinationName={destination.name || SCHOOL_CAMPUS.name}
                    destinationLat={destination.lat}
                    destinationLng={destination.lng}
                    onRouteMetricsChange={handleMetricsChange}
                />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/route-management')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    disabled={saving}
                    onClick={handleSave}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'
                >
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </section>
    )
}

export default AddRoute
