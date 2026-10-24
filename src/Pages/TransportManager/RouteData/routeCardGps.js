import { classifyTrackFreshness } from '../../../services/protrackFreshness.js'

export const normalizePlate = (value) => String(value || '').replace(/[\s-]/g, '').toUpperCase()

export const routeStoredImei = (route) => String(route?.gpsImei || route?.imei || '').replace(/\s+/g, '')

export const vehicleStoredImei = (vehicle) => String(vehicle?.gpsImei || vehicle?.imei || '').replace(/\s+/g, '')

export const linkVehicle = (route, vehicles = []) => {
    const id = String(route?.vehicleId || '')
    const plate = normalizePlate(route?.vehicleNumber)
    return vehicles.find((vehicle) => (
        (id && String(vehicle?.id) === id)
        || (plate && normalizePlate(vehicle?.vehicleNumber) === plate)
    )) || null
}

export const displayDriver = (route, vehicle) => ({
    name: String(route?.driverName || vehicle?.driverName || '').trim(),
    contact: String(route?.driverContact || vehicle?.driverContact || '').trim(),
})

/**
 * A route is tracked only from its own saved IMEI.
 * No IMEI, a clash with the linked vehicle, or the same IMEI on another route → do not request GPS.
 */
export const resolveRouteTracking = (route, vehicles = [], routes = []) => {
    const imei = routeStoredImei(route)
    if (!imei) return { trackImei: '', reason: 'none' }
    const vehicle = linkVehicle(route, vehicles)
    const vehicleImei = vehicle ? vehicleStoredImei(vehicle) : ''
    if (vehicleImei && vehicleImei !== imei) return { trackImei: '', reason: 'mismatch', vehicle }
    const duplicates = routes.filter((row) => routeStoredImei(row) === imei)
    if (duplicates.length > 1) return { trackImei: '', reason: 'duplicate', vehicle }
    return { trackImei: imei, reason: 'ready', vehicle }
}

export const imeisForTrackRequest = (routes = [], vehicles = []) => {
    const seen = new Set()
    routes.forEach((route) => {
        const resolved = resolveRouteTracking(route, vehicles, routes)
        if (resolved.trackImei) seen.add(resolved.trackImei)
    })
    return [...seen]
}

export const deviceMatchesVehicle = (device, route) => {
    if (!device || !route) return false
    const plate = normalizePlate(route.vehicleNumber)
    const devicePlate = normalizePlate(device.platenumber || device.plateNumber || '')
    return Boolean(plate) && plate === devicePlate && String(device.imei || '') === routeStoredImei(route)
}

const blocked = (gpsLabel) => ({
    badge: 'NOT LIVE',
    live: false,
    gpsLabel,
    trackImei: '',
})

export const presentRouteCard = ({
    route,
    vehicles = [],
    routes = [],
    track = null,
    device = null,
    devicesChecked = false,
    nowSec,
}) => {
    const decision = resolveRouteTracking(route, vehicles, routes)
    if (decision.reason === 'none') {
        return { badge: 'No IMEI', live: false, gpsLabel: 'No IMEI', trackImei: '' }
    }
    if (decision.reason === 'mismatch') {
        return blocked('IMEI does not match the saved vehicle')
    }
    if (decision.reason === 'duplicate') {
        return blocked('Duplicate IMEI — not live')
    }
    if (!devicesChecked) {
        return { badge: 'NOT LIVE', live: false, gpsLabel: 'Checking GPS…', trackImei: decision.trackImei }
    }
    if (!deviceMatchesVehicle(device, route)) {
        return blocked(device ? 'IMEI is not the device on this vehicle' : 'Unavailable')
    }
    const freshness = classifyTrackFreshness(track, nowSec)
    return {
        badge: freshness.live ? 'Live GPS' : 'NOT LIVE',
        live: freshness.live,
        gpsLabel: freshness.label,
        trackImei: decision.trackImei,
    }
}
