import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import RouteDetailsForm from './Components/RouteDetailsForm'
import RouteStopsEditor from './Components/RouteStopsEditor'
import { getRouteById, hydrateRoutesFromApi, upsertRoute } from './routeManagementData'
import { SCHOOL_CAMPUS } from '../../../Common/Transport/schoolCampusLocation'

const EditRoute = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const formRef = useRef(null)
    const stopsRef = useRef(null)
    const [route, setRoute] = useState(() => getRouteById(id))
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [destination, setDestination] = useState(() => ({
        name: getRouteById(id)?.endLocation || SCHOOL_CAMPUS.name,
        lat: Number(getRouteById(id)?.endLat) || SCHOOL_CAMPUS.lat,
        lng: Number(getRouteById(id)?.endLng) || SCHOOL_CAMPUS.lng,
    }))

    useEffect(() => {
        let cancelled = false
        hydrateRoutesFromApi().finally(() => {
            if (!cancelled) {
                const next = getRouteById(id)
                setRoute(next)
                setDestination({
                    name: next?.endLocation || SCHOOL_CAMPUS.name,
                    lat: Number(next?.endLat) || SCHOOL_CAMPUS.lat,
                    lng: Number(next?.endLng) || SCHOOL_CAMPUS.lng,
                })
                setLoading(false)
            }
        })
        return () => {
            cancelled = true
        }
    }, [id])

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
            ...route,
            ...values,
            id: route.id,
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
        toast.success(result?.api ? 'Route updated in campus API.' : 'Route updated.')
        navigate('/transport-manager/route-management')
    }

    if (loading) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Loading route…
                </div>
            </section>
        )
    }

    if (!route) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Route not found or could not be loaded.
                </div>
                <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                    <button
                        type='button'
                        onClick={() => navigate('/transport-manager/route-management')}
                        className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                    >
                        Back to list
                    </button>
                </div>
            </section>
        )
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Route Details Information</h2>
                <p className='text-sm text-[#667085] mt-1'>Editing {route.id} — {route.routeName}</p>
                <div onBlur={syncDestinationFromForm} onChange={syncDestinationFromForm}>
                    <RouteDetailsForm key={route.id} ref={formRef} route={route} />
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <RouteStopsEditor
                    key={`${route.id}-stops`}
                    ref={stopsRef}
                    initialStops={route.stops}
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

export default EditRoute
