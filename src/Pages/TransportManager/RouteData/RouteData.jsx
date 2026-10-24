import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bus, MapPin, ChevronRight, Phone } from 'lucide-react'
import { getRoutes, hydrateRoutesFromApi } from '../RouteManagement/routeManagementData'
import { getVehicles, hydrateVehiclesFromApi } from '../VehicleManagement/vehicleManagementData'
import { canUseProtrackApi, listProtrackDevicesApi, trackProtrackImeisApi } from '../../../services/protrackApi'
import { canCallDriver, normalizeDialNumber } from '../../../Common/Transport/driverContact'
import {
    deviceMatchesVehicle,
    displayDriver,
    imeisForTrackRequest,
    linkVehicle,
    presentRouteCard,
    routeStoredImei,
} from './routeCardGps'

const MapPlaceholder = ({ badge }) => {
    const isLive = badge === 'Live GPS'
    return (
        <div className='relative h-44 bg-linear-to-br from-[#E8EBFF] via-[#F4F6FF] to-[#EDEEF5] overflow-hidden'>
            <div
                className='absolute inset-0 opacity-30'
                style={{
                    backgroundImage: `
                        linear-gradient(#515DEF22 1px, transparent 1px),
                        linear-gradient(90deg, #515DEF22 1px, transparent 1px)
                    `,
                    backgroundSize: '24px 24px',
                }}
            />
            <div className='absolute inset-0 flex items-center justify-center'>
                <div className='flex flex-col items-center gap-2 text-[#515DEF]'>
                    <div className='p-3 rounded-full bg-white/80 shadow-sm'>
                        <MapPin size={28} />
                    </div>
                    <span className='text-xs font-semibold uppercase tracking-wider'>Route Map Preview</span>
                </div>
            </div>
            <div className={`absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm ${isLive ? '' : 'border border-[#FDBA74]'}`}>
                {isLive ? (
                    <>
                        <span className='relative flex h-2 w-2'>
                            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
                            <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500' />
                        </span>
                        <span className='text-[10px] font-semibold text-emerald-700'>Live GPS</span>
                    </>
                ) : (
                    <span className='text-[10px] font-semibold text-[#B45309]'>{badge}</span>
                )}
            </div>
        </div>
    )
}

const RouteData = () => {
    const navigate = useNavigate()
    const [routes, setRoutes] = useState(() => getRoutes())
    const [vehicles, setVehicles] = useState(() => getVehicles())
    const [loading, setLoading] = useState(true)
    const [devices, setDevices] = useState([])
    const [devicesChecked, setDevicesChecked] = useState(false)
    const [tracksByImei, setTracksByImei] = useState({})
    const [gpsError, setGpsError] = useState('')

    useEffect(() => {
        let active = true
        setLoading(true)
        Promise.all([hydrateRoutesFromApi(), hydrateVehiclesFromApi()]).finally(() => {
            if (!active) return
            setRoutes(getRoutes())
            setVehicles(getVehicles())
            setLoading(false)
        })
        return () => { active = false }
    }, [])

    const candidateImeis = useMemo(
        () => imeisForTrackRequest(routes, vehicles),
        [routes, vehicles],
    )
    const candidateKey = candidateImeis.join(',')

    useEffect(() => {
        if (!candidateImeis.length || !canUseProtrackApi()) {
            setDevices([])
            setDevicesChecked(true)
            setTracksByImei({})
            return undefined
        }
        let active = true
        setDevicesChecked(false)
        listProtrackDevicesApi('admin')
            .then((list) => {
                if (!active) return
                setDevices(Array.isArray(list) ? list : [])
                setGpsError('')
            })
            .catch((err) => {
                if (!active) return
                setDevices([])
                setGpsError(err?.message || 'GPS check failed.')
            })
            .finally(() => {
                if (active) setDevicesChecked(true)
            })
        return () => { active = false }
    }, [candidateKey])

    const allowedImeis = useMemo(() => {
        if (!devicesChecked) return []
        return candidateImeis.filter((imei) => {
            const route = routes.find((row) => routeStoredImei(row) === imei)
            const device = devices.find((row) => String(row?.imei || '') === imei)
            return deviceMatchesVehicle(device, route)
        })
    }, [candidateImeis, devices, devicesChecked, routes])
    const allowedKey = allowedImeis.join(',')

    useEffect(() => {
        if (!devicesChecked || !allowedImeis.length || !canUseProtrackApi()) return undefined
        let active = true
        const load = async () => {
            try {
                const rows = await trackProtrackImeisApi(allowedImeis, 'admin')
                if (!active) return
                const next = {}
                ;(Array.isArray(rows) ? rows : []).forEach((row) => {
                    const imei = String(row?.imei || '').trim()
                    if (imei) next[imei] = row
                })
                setTracksByImei(next)
                setGpsError('')
            } catch (err) {
                if (active) setGpsError(err?.message || 'GPS check failed.')
            }
        }
        load()
        const id = setInterval(load, 15000)
        return () => {
            active = false
            clearInterval(id)
        }
    }, [allowedKey, devicesChecked])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4 mb-6'>
                <h2 className='text-xl font-medium text-black'>Route Data</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Cards use saved route and vehicle records. A green Live GPS badge appears only when the provider status is OK and the GPS fix is no older than 10 minutes.
                </p>
                {gpsError ? (
                    <p className='text-sm text-[#B45309] mt-3 bg-[#FFF7ED] border border-[#FDBA74] rounded-md px-3 py-2'>
                        {gpsError}
                    </p>
                ) : null}
            </div>

            {loading && routes.length === 0 ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Loading routes…
                </div>
            ) : routes.length === 0 ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    No saved routes yet. Add one under Route Management first.
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'>
                    {routes.map((route) => {
                        const imei = routeStoredImei(route)
                        const device = devices.find((row) => String(row?.imei || '') === imei) || null
                        const card = presentRouteCard({
                            route,
                            vehicles,
                            routes,
                            track: imei ? tracksByImei[imei] || null : null,
                            device,
                            devicesChecked,
                        })
                        const driver = displayDriver(route, linkVehicle(route, vehicles))
                        const dial = normalizeDialNumber(driver.contact)
                        const callEnabled = canCallDriver(driver.contact)
                        return (
                            <article
                                key={route.id}
                                className='bg-white rounded-2xl shadow-md overflow-hidden text-left hover:shadow-lg hover:ring-2 hover:ring-[#515DEF]/20 transition-all duration-200 group'
                            >
                                <MapPlaceholder badge={card.badge} />
                                <button
                                    type='button'
                                    onClick={() => navigate(`/transport-manager/route-data/track/${route.id}`)}
                                    className='w-full p-4 text-left cursor-pointer'
                                >
                                    <div className='flex items-start justify-between gap-3'>
                                        <div className='min-w-0 flex-1'>
                                            <h3 className='text-base font-semibold text-[#0C1E5B] truncate group-hover:text-[#515DEF] transition-colors'>
                                                {route.routeName || '—'}
                                            </h3>
                                            <p className='text-xs text-[#667085] mt-1 truncate'>
                                                {(route.startLocation || '—')} → {(route.endLocation || '—')}
                                            </p>
                                        </div>
                                        <ChevronRight size={18} className='text-[#667085] shrink-0 mt-0.5 group-hover:text-[#515DEF] transition-colors' />
                                    </div>

                                    <div className='mt-4 pt-4 border-t border-[#f2f4f7] space-y-2'>
                                        <div className='flex items-center gap-2 text-sm text-[#667085]'>
                                            <Bus size={16} className='text-[#515DEF] shrink-0' />
                                            <span className='truncate'>
                                                <span className='font-medium text-[#1E1E1E]'>Bus:</span>{' '}
                                                {route.vehicleNumber || '—'}
                                            </span>
                                        </div>
                                        <div className='flex items-center gap-2 text-sm text-[#667085]'>
                                            <span className='text-[#515DEF] shrink-0'>👤</span>
                                            <span className='truncate'>
                                                <span className='font-medium text-[#1E1E1E]'>Driver:</span>{' '}
                                                {driver.name || '—'}
                                            </span>
                                        </div>
                                        <div className='flex items-center gap-2 text-sm text-[#667085]'>
                                            <Phone size={16} className='text-[#515DEF] shrink-0' />
                                            <span className='truncate'>
                                                <span className='font-medium text-[#1E1E1E]'>Contact:</span>{' '}
                                                {driver.contact || '—'}
                                            </span>
                                        </div>
                                        <p className={`text-xs font-medium truncate ${card.live ? 'text-emerald-700' : 'text-[#B45309]'}`}>
                                            GPS: {card.gpsLabel}
                                        </p>
                                    </div>
                                </button>
                                <div className='px-4 pb-4'>
                                    {callEnabled ? (
                                        <a
                                            href={`tel:${dial}`}
                                            className='inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5'
                                        >
                                            Call Driver
                                        </a>
                                    ) : (
                                        <button
                                            type='button'
                                            disabled
                                            className='inline-flex items-center gap-2 text-xs font-semibold text-[#98A2B3] bg-[#F9FAFB] border border-[#E4E7EC] rounded-full px-3 py-1.5 cursor-not-allowed'
                                        >
                                            No driver contact
                                        </button>
                                    )}
                                </div>
                            </article>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

export default RouteData
