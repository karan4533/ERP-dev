import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import BusRouteCard from './Components/BusRouteCard'
import BusTrackingMap from '../../TransportManager/RouteData/Components/BusTrackingMap'
import useProtrackLive from '../../../Common/Transport/useProtrackLive'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import { apiRequest, getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'
import { hydrateStudentBusAssignment } from './studentBusAssignment'
import { SCHOOL_CAMPUS, resolveDestinationPosition } from '../../../Common/Transport/schoolCampusLocation'
import {
    buildTripMapView,
    isDutyDateToday,
    isDutyOpenToday,
    isDutyTrackingActive,
    normalizeDutyType,
} from '../../../Common/Transport/activeDutyTracking'
import { ensureStopCoordinates } from '../../../Common/Transport/resolveRouteStops'
import { getDuties, hydrateDutiesFromApi } from '../../TransportManager/AssignDuty/assignDutyData'
import { getRoutes, hydrateRoutesFromApi } from '../../TransportManager/RouteManagement/routeManagementData'

const POLL_DUTY_MS = 12000

/**
 * Parent/student track view.
 * Live map only after the driver presses Start (In Progress).
 * Pickup stops grade ✓ when GPS crosses them or the scheduled time expires.
 */
const TrackBus = ({ showRouteDetails = false }) => {
    const { activeStudent } = useActiveStudent()
    const [assignment, setAssignment] = useState(null)
    const [route, setRoute] = useState(null)
    const [activeDuty, setActiveDuty] = useState(null)
    const [preferredImei, setPreferredImei] = useState('')
    const [preferredPlate, setPreferredPlate] = useState('')
    const [loadingAssignment, setLoadingAssignment] = useState(true)
    const [nowTick, setNowTick] = useState(() => Date.now())
    const [resolvedRoute, setResolvedRoute] = useState(null)

    const pickOpenDuty = useCallback((duties, routeRow, assignmentRow) => {
        const list = Array.isArray(duties) ? duties : []
        const routeId = String(routeRow?.id || assignmentRow?.routeId || '')
        const routeName = String(routeRow?.routeName || assignmentRow?.routeName || '').trim().toLowerCase()
        const matches = list.filter((duty) => {
            if (!isDutyDateToday(duty.dutyDate || duty.date)) return false
            if (!isDutyOpenToday(duty)) return false
            const sameId = routeId && String(duty.routeId || '') === routeId
            const sameName = routeName
                && String(duty.routeName || '').trim().toLowerCase() === routeName
            return sameId || sameName
        })
        return matches.find((duty) => isDutyTrackingActive(duty)) || matches[0] || null
    }, [])

    const loadTransport = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoadingAssignment(true)
        try {
            if (isApiAuthEnabled() && getAccessToken()) {
                try {
                    const payload = await apiRequest('/ops/my-transport')
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
                        || String(row.routeName || '').trim() === String(match?.routeName || '').trim()
                    )) || null
                    if (match) {
                        const plateKey = (value) => String(value || '').replace(/[\s-]/g, '').toUpperCase()
                        const vehicles = Array.isArray(payload?.vehicles) ? payload.vehicles : []
                        const foundVehicle = vehicles.find((row) => (
                            String(row.id || '') === String(match.vehicleId || foundRoute?.vehicleId || '')
                            || plateKey(row.vehicleNumber) === plateKey(match.vehicleNumber || match.vehicle || foundRoute?.vehicleNumber)
                        )) || null
                        const view = {
                            id: match.id,
                            routeId: match.routeId || foundRoute?.id || '',
                            routeName: match.routeName || foundRoute?.routeName || foundRoute?.name || 'Assigned route',
                            vehicleNumber: match.vehicleNumber || match.vehicle || foundRoute?.vehicleNumber || foundVehicle?.vehicleNumber || '—',
                            vehicleId: match.vehicleId || foundRoute?.vehicleId || foundVehicle?.id || '—',
                            driverName: match.driverName || foundRoute?.driverName || foundVehicle?.driverName || 'Assigned driver',
                            driverContact: match.driverContact || foundRoute?.driverContact || foundVehicle?.driverContact || '',
                            pickupLocation: match.startLocation || match.stopName || match.pickupPoint || foundRoute?.startLocation || 'Pickup',
                            startLocation: match.startLocation || match.stopName || match.pickupPoint || '',
                            pickupTime: match.pickUpTime || foundRoute?.pickUpTime || '—',
                            dropLocation: match.dropLocation || match.startLocation || match.stopName || '—',
                            dropTime: match.dropTime || foundRoute?.dropTime || '—',
                            endLocation: match.endLocation || foundRoute?.endLocation || SCHOOL_CAMPUS.name,
                            imei: match.imei || match.gpsImei
                                || foundRoute?.imei || foundRoute?.gpsImei
                                || foundVehicle?.imei || foundVehicle?.gpsImei
                                || '',
                            endLat: match.endLat ?? foundRoute?.endLat ?? '',
                            endLng: match.endLng ?? foundRoute?.endLng ?? '',
                        }
                        const duty = pickOpenDuty(payload?.activeDuties, foundRoute || view, view)
                        setAssignment(view)
                        setRoute(foundRoute)
                        setActiveDuty(duty)
                        setPreferredImei(String(view.imei || duty?.imei || duty?.gpsImei || ''))
                        setPreferredPlate(String(view.vehicleNumber || duty?.vehicleNumber || ''))
                        return
                    }
                } catch {
                    /* fall through */
                }
            }

            await Promise.all([
                hydrateStudentBusAssignment(activeStudent),
                hydrateDutiesFromApi(),
                hydrateRoutesFromApi(),
            ])
            const view = await hydrateStudentBusAssignment(activeStudent)
            const routeRow = getRoutes().find((row) => (
                row.id === view?.routeId
                || String(row.routeName || '').trim() === String(view?.routeName || '').trim()
            )) || null
            const duty = pickOpenDuty(getDuties(), routeRow || view, view)
            setAssignment(view)
            setRoute(routeRow)
            setActiveDuty(duty)
            setPreferredImei(String(view?.imei || duty?.imei || duty?.gpsImei || ''))
            setPreferredPlate(String(view?.vehicleNumber || duty?.vehicleNumber || ''))
        } finally {
            if (!silent) setLoadingAssignment(false)
        }
    }, [activeStudent, pickOpenDuty])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            if (cancelled) return
            await loadTransport()
        })()
        return () => { cancelled = true }
    }, [loadTransport])

    // Poll so Parent/Student see Start / Mark done without a full page refresh.
    useEffect(() => {
        if (!assignment) return undefined
        const id = window.setInterval(() => {
            loadTransport({ silent: true })
            setNowTick(Date.now())
        }, POLL_DUTY_MS)
        return () => window.clearInterval(id)
    }, [assignment, loadTransport])

    // Re-grade stop times every minute even without GPS movement.
    useEffect(() => {
        const id = window.setInterval(() => setNowTick(Date.now()), 60000)
        return () => window.clearInterval(id)
    }, [])

    // Resolve Maps links → pins for stops that were saved without lat/lng.
    useEffect(() => {
        let cancelled = false
        const base = route || null
        if (!base) {
            setResolvedRoute(null)
            return undefined
        }
        const stops = Array.isArray(base.stops) ? base.stops : []
        ;(async () => {
            const nextStops = await ensureStopCoordinates(stops)
            if (cancelled) return
            setResolvedRoute({ ...base, stops: nextStops })
        })()
        return () => { cancelled = true }
    }, [route])

    const waitingForStart = Boolean(
        activeDuty
        && isDutyOpenToday(activeDuty)
        && !isDutyTrackingActive(activeDuty),
    )
    const trackingEnabled = Boolean(activeDuty && isDutyTrackingActive(activeDuty))
    const dutyType = normalizeDutyType(activeDuty?.dutyType || activeDuty?.shift)

    const live = useProtrackLive({
        panel: 'parent',
        preferredImei: trackingEnabled ? preferredImei : '',
        preferredPlate: trackingEnabled ? preferredPlate : '',
        fallbackPanel: 'admin',
    })

    const trip = useMemo(() => {
        if (!trackingEnabled) return null
        const tripRoute = resolvedRoute || route || {
            stops: activeDuty?.stops,
            endLocation: assignment?.endLocation,
        }
        const school = resolveDestinationPosition({
            endLat: tripRoute?.endLat ?? assignment?.endLat ?? activeDuty?.endLat,
            endLng: tripRoute?.endLng ?? assignment?.endLng ?? activeDuty?.endLng,
            endLocation: tripRoute?.endLocation || assignment?.endLocation || SCHOOL_CAMPUS.name,
        }) || SCHOOL_CAMPUS.position
        return buildTripMapView({
            duty: activeDuty,
            route: tripRoute,
            assignment,
            schoolPosition: school,
            busPosition: live.livePosition || null,
            now: new Date(nowTick),
        })
    }, [trackingEnabled, activeDuty, route, resolvedRoute, assignment, live.livePosition, nowTick])

    const device = live.imei
        ? live.devices.find((row) => String(row.imei) === String(live.imei))
        : null
    const hasLiveGps = Boolean(trackingEnabled && live.livePosition)
    const vehicleNumber = assignment?.vehicleNumber || activeDuty?.vehicleNumber || device?.platenumber || preferredPlate || '—'
    const driverName = assignment?.driverName || activeDuty?.driverName || 'Assigned driver'
    const driverContact = assignment?.driverContact || ''
    const routeName = assignment?.routeName || activeDuty?.routeName || device?.devicename || 'School Bus'
    const doneCount = (trip?.stopMarkers || []).filter((row) => row.status === 'done').length
    const totalStops = (trip?.stopMarkers || []).length

    return (
        <section>
            {showRouteDetails && <BusRouteCard title='Bus Route Details' />}

            <div className={`bg-white rounded-2xl shadow-md p-4 ${showRouteDetails ? 'mt-8' : ''}`}>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>Track Bus Location</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            {!assignment
                                ? 'Transport enrollment is required before live tracking.'
                                : waitingForStart
                                    ? 'Duty is assigned for today — live track starts when the driver presses Start.'
                                    : trackingEnabled && hasLiveGps
                                        ? `${dutyType} trip live GPS for ${vehicleNumber} on ${routeName} (updates every 15s).`
                                        : trackingEnabled
                                            ? `${dutyType} trip is on the move — waiting for a live GPS fix.`
                                            : 'Live track appears after the driver starts today’s duty, and clears when they mark it done.'}
                        </p>
                    </div>
                    <button
                        type='button'
                        onClick={() => {
                            loadTransport({ silent: true })
                            live.refresh()
                        }}
                        disabled={!trackingEnabled && !waitingForStart}
                        className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 cursor-pointer disabled:opacity-50'
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
                {!loadingAssignment && !assignment && (
                    <p className='text-sm text-[#667085] mt-3 bg-[#F9FAFB] border border-[#E0E0E0] rounded-md px-3 py-2'>
                        No transport enrollment found for this student. Route details appear after Transport Manager assigns a route.
                    </p>
                )}
                {!loadingAssignment && assignment && !activeDuty && (
                    <p className='text-sm text-[#667085] mt-3 bg-[#F9FAFB] border border-[#E0E0E0] rounded-md px-3 py-2'>
                        No {dutyType === 'Drop' ? 'drop' : 'pickup'} duty for today on this route yet.
                    </p>
                )}
                {waitingForStart && (
                    <p className='text-sm text-[#92400E] mt-3 bg-[#FFFBEB] border border-[#FCD34D] rounded-md px-3 py-2'>
                        Duty assigned ({dutyType}
                        {activeDuty?.dutyDate ? ` · ${activeDuty.dutyDate}` : ''}
                        ) — waiting for the driver to Start. Tracking will show the bus on the move from the trip start.
                    </p>
                )}
                {trackingEnabled && trip && (
                    <p className='text-sm text-[#0C1E5B] mt-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-md px-3 py-2'>
                        <span className='font-semibold'>{trip.tripHeadline}</span>
                        {' · '}
                        {dutyType}
                        {activeDuty?.dutyStatus ? ` · ${activeDuty.dutyStatus}` : ''}
                        {totalStops > 0 ? ` · ${doneCount}/${totalStops} stops done` : ''}
                        {dutyType === 'Drop'
                            ? ' — green ✓ means that drop point is finished (bus crossed it or drop time passed).'
                            : ' — green ✓ means that pickup is finished (bus crossed it or pickup time passed).'}
                    </p>
                )}
                {live.error && trackingEnabled && (
                    <p className='text-sm text-[#B45309] mt-3 bg-[#FFF7ED] border border-[#FDBA74] rounded-md px-3 py-2'>
                        {live.error}
                    </p>
                )}
            </div>

            {trackingEnabled && trip && (
                <div className='bg-white rounded-2xl shadow-md mt-8 overflow-hidden'>
                    <BusTrackingMap
                        routeName={`${routeName} · ${dutyType}`}
                        vehicleNumber={vehicleNumber}
                        driverName={driverName}
                        driverContact={driverContact}
                        startLocation={trip.startLocation}
                        startSubtitle={trip.startSubtitle}
                        endLocation={trip.endLocation}
                        endSubtitle={trip.endSubtitle}
                        startPosition={trip.startPosition}
                        endPosition={trip.endPosition}
                        stopMarkers={trip.stopMarkers}
                        tripMode={trip.tripMode}
                        tripStatusLine={trip.tripHeadline}
                        busLabel={vehicleNumber || assignment?.vehicleId || 'BUS'}
                        stats={
                            hasLiveGps
                                ? live.stats
                                : {
                                    progress: totalStops ? `${doneCount}/${totalStops}` : '—',
                                    distanceLeft: 'On the move',
                                    eta: '—',
                                    speed: '—',
                                }
                        }
                        livePosition={live.livePosition}
                        liveStatusLabel={live.liveStatusLabel || 'LIVE GPS'}
                        trackingMode={hasLiveGps ? 'live' : 'demo'}
                    />
                </div>
            )}
        </section>
    )
}

export default TrackBus
