import React, { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import BusRouteCard from './Components/BusRouteCard'
import BusTrackingMap from '../../TransportManager/RouteData/Components/BusTrackingMap'
import useProtrackLive from '../../../Common/Transport/useProtrackLive'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import { apiRequest, getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'

/**
 * Parent/student track view. Live GPS only when the assigned vehicle plate or IMEI
 * matches a ProTrack device. Demo route geometry is never labelled as live GPS.
 */
const TrackBus = ({ showRouteDetails = false }) => {
    const { activeStudent } = useActiveStudent()
    const [preferredImei, setPreferredImei] = useState('')
    const [preferredPlate, setPreferredPlate] = useState('')

    useEffect(() => {
        if (!isApiAuthEnabled() || !getAccessToken()) {
            setPreferredImei('')
            setPreferredPlate('')
            return undefined
        }
        let cancelled = false
        apiRequest('/ops/my-transport')
            .then((payload) => {
                if (cancelled) return
                const keys = new Set([
                    String(activeStudent?.id || ''),
                    String(activeStudent?.admissionNumber || activeStudent?.admissionNo || ''),
                ].filter(Boolean))
                const rows = payload?.assignments || []
                const match = rows.find((row) => keys.has(String(row.studentId || row.student_id || ''))) || null
                const routeId = String(match?.routeId || match?.route || '')
                const foundRoute = (payload?.routes || []).find((row) => (
                    String(row.id || '') === routeId
                    || String(row.routeName || row.name || '') === routeId
                )) || null
                setPreferredImei(String(match?.imei || match?.gpsImei || foundRoute?.imei || foundRoute?.gpsImei || ''))
                setPreferredPlate(String(
                    match?.vehicleNumber || match?.vehicle || foundRoute?.vehicleNumber || '',
                ))
            })
            .catch(() => {
                if (!cancelled) {
                    setPreferredImei('')
                    setPreferredPlate('')
                }
            })
        return () => { cancelled = true }
    }, [activeStudent?.id, activeStudent?.admissionNumber, activeStudent?.admissionNo])

    const live = useProtrackLive({
        panel: 'parent',
        preferredImei,
        preferredPlate,
    })
    const device = live.imei
        ? live.devices.find((row) => String(row.imei) === String(live.imei))
        : null
    const hasLiveGps = Boolean(live.livePosition)
    const hasLastKnown = Boolean(live.lastKnownPosition)
    const freshnessState = live.freshness?.state || 'unavailable'
    const trackingMode = hasLiveGps ? 'live' : hasLastKnown ? 'last-known' : 'demo'
    const mapPosition = live.livePosition || live.lastKnownPosition || null

    return (
        <section>
            {showRouteDetails && <BusRouteCard title="Bus Route Details" />}

            <div className={`bg-white rounded-2xl shadow-md p-4 ${showRouteDetails ? 'mt-8' : ''}`}>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>Track Bus Location</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            {hasLiveGps
                                ? 'Live GPS from ProTrack365 (polls every 15s).'
                                : hasLastKnown
                                    ? `${live.liveStatusLabel || 'Last known position'} — map shows last known pin, not live movement.`
                                    : 'Live GPS is off until a verified vehicle–IMEI mapping and a current fix are available. Demo route geometry is not a live position.'}
                        </p>
                    </div>
                    <button
                        type='button'
                        onClick={() => live.refresh()}
                        disabled={!live.imei}
                        className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 cursor-pointer disabled:opacity-50'
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
                {live.error && (
                    <p className='text-sm text-[#B45309] mt-3 bg-[#FFF7ED] border border-[#FDBA74] rounded-md px-3 py-2'>
                        {live.error}
                    </p>
                )}
                {live.imei && device && (
                    <p className='text-sm text-[#667085] mt-3'>
                        Mapped device: {device.platenumber || device.devicename || device.imei}
                        {device.imei ? ` · IMEI ${device.imei}` : ''}
                    </p>
                )}
            </div>

            <div className='bg-white rounded-2xl shadow-md mt-8 overflow-hidden'>
                <BusTrackingMap
                    routeName={device?.devicename || preferredPlate || 'Assigned bus'}
                    vehicleNumber={device?.platenumber || preferredPlate || ''}
                    driverName=''
                    driverContact=''
                    startLocation=''
                    endLocation=''
                    busLabel={device?.platenumber || preferredPlate || 'BUS'}
                    stats={
                        hasLiveGps
                            ? live.stats
                            : {
                                progress: live.freshness?.label || '—',
                                distanceLeft: hasLastKnown
                                    ? 'Last known position — not live movement'
                                    : 'Demo route only — not live GPS',
                                eta: '—',
                                speed: '—',
                            }
                    }
                    livePosition={mapPosition}
                    liveStatusLabel={live.liveStatusLabel}
                    trackingMode={trackingMode}
                />
            </div>
        </section>
    )
}

export default TrackBus
