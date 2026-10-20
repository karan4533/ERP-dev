import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import RouteDetailsForm from './Components/RouteDetailsForm'
import RouteStopsEditor from './Components/RouteStopsEditor'
import { getRouteById, hydrateRoutesFromApi, upsertRoute } from './routeManagementData'

const EditRoute = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const formRef = useRef(null)
    const stopsRef = useRef(null)
    const [route, setRoute] = useState(() => getRouteById(id))
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        let cancelled = false
        hydrateRoutesFromApi().finally(() => {
            if (!cancelled) {
                setRoute(getRouteById(id))
                setLoading(false)
            }
        })
        return () => {
            cancelled = true
        }
    }, [id])

    const handleSave = async () => {
        const error = formRef.current?.validate?.()
        if (error) {
            toast.error(error)
            return
        }
        const values = formRef.current.getValues()
        // One route tariff applies to every stop — fees are not edited per stop.
        const stops = (stopsRef.current?.getStops?.() ?? []).map((stop) => ({
            ...stop,
            yearlyFees: values.yearlyFees || '',
            halfYearlyFees: values.halfYearlyFees || '',
            quarterlyFees: values.quarterlyFees || '',
            monthlyFees: values.monthlyFees || '',
        }))
        setSaving(true)
        const result = await upsertRoute({
            ...route,
            ...values,
            id: route.id,
            stops,
            totalStops: stops.length || values.totalStops || 0,
        })
        setSaving(false)
        if (result?.success === false) {
            toast.error(result.message || 'Route saved locally — API push failed.')
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
                <RouteDetailsForm key={route.id} ref={formRef} route={route} />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <RouteStopsEditor
                    key={`${route.id}-stops`}
                    ref={stopsRef}
                    initialStops={route.stops}
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
