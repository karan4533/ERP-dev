import assert from 'node:assert/strict'
import test from 'node:test'
import { canCallDriver, normalizeDialNumber } from '../../../Common/Transport/driverContact.js'
import { classifyTrackFreshness } from '../../../services/protrackFreshness.js'
import {
    displayDriver,
    imeisForTrackRequest,
    presentRouteCard,
} from './routeCardGps.js'

const NOW = 1_792_830_000

const route1 = {
    id: 'RT-1792826320243',
    routeName: 'Route 1',
    vehicleId: 'VEH-1792825477178',
    vehicleNumber: 'TN58BB3769',
    gpsImei: '355710090439063',
    imei: '355710090439063',
    driverName: 'Browser Driver',
    driverContact: '7448907020',
    startLocation: 'erode',
    endLocation: 'coimbatore',
}

const west = {
    id: 'RT-1792758528886',
    routeName: 'Browser West Route',
    vehicleNumber: '',
    gpsImei: '',
    imei: '',
    driverName: '',
    driverContact: '',
    startLocation: '',
    endLocation: '',
}

const vehicle = {
    id: 'VEH-1792825477178',
    vehicleNumber: 'TN58BB3769',
    gpsImei: '355710090439063',
    imei: '355710090439063',
    driverName: '',
    driverContact: '',
}

const device = { imei: '355710090439063', platenumber: 'TN58BB3769' }

test('Route 1 keeps saved driver, contact, and locations', () => {
    const driver = displayDriver(route1, vehicle)
    assert.equal(driver.name, 'Browser Driver')
    assert.equal(driver.contact, '7448907020')
    assert.equal(route1.startLocation, 'erode')
    assert.equal(route1.endLocation, 'coimbatore')
    assert.equal(normalizeDialNumber(driver.contact), '+917448907020')
    assert.equal(canCallDriver(driver.contact), true)
})

test('Browser West Route stays No IMEI and is not tracked', () => {
    const routes = [west, route1]
    const requested = imeisForTrackRequest(routes, [vehicle])
    assert.deepEqual(requested, ['355710090439063'])
    assert.equal(requested.includes(''), false)
    const card = presentRouteCard({
        route: west,
        vehicles: [vehicle],
        routes,
        devicesChecked: true,
        nowSec: NOW,
    })
    assert.equal(card.badge, 'No IMEI')
    assert.equal(card.gpsLabel, 'No IMEI')
    assert.equal(card.trackImei, '')
    assert.equal(card.live, false)
})

test('stale OK fix on Route 1 is not live', () => {
    const track = {
        imei: '355710090439063',
        datastatus: 2,
        gpstime: NOW - 12_240,
        latitude: 9.882777,
        longitude: 78.03727,
    }
    const card = presentRouteCard({
        route: route1,
        vehicles: [vehicle],
        routes: [west, route1],
        track,
        device,
        devicesChecked: true,
        nowSec: NOW,
    })
    assert.equal(card.live, false)
    assert.equal(card.badge, 'NOT LIVE')
    assert.equal(card.gpsLabel, 'OK — last known (approximately 3.4 h ago)')
    assert.equal(classifyTrackFreshness(track, NOW).live, false)
})

test('fresh OK fix on a matched device is live', () => {
    const card = presentRouteCard({
        route: route1,
        vehicles: [vehicle],
        routes: [west, route1],
        track: {
            imei: '355710090439063',
            datastatus: 2,
            gpstime: NOW - 600,
            latitude: 9.88,
            longitude: 78.03,
        },
        device,
        devicesChecked: true,
        nowSec: NOW,
    })
    assert.equal(card.live, true)
    assert.equal(card.badge, 'Live GPS')
})

test('Call Driver is disabled for a missing or invalid contact', () => {
    assert.equal(canCallDriver(''), false)
    assert.equal(canCallDriver('123'), false)
    assert.equal(canCallDriver('abc'), false)
    assert.equal(normalizeDialNumber(''), '')
    const driver = displayDriver(west, null)
    assert.equal(driver.name, '')
    assert.equal(canCallDriver(driver.contact), false)
})

test('duplicate IMEI and a vehicle IMEI clash are not tracked', () => {
    const copy = { ...west, id: 'RT-copy', gpsImei: route1.gpsImei, imei: route1.imei, vehicleNumber: 'TN58BB3769', vehicleId: vehicle.id }
    assert.deepEqual(imeisForTrackRequest([route1, copy], [vehicle]), [])
    const otherVehicle = { ...vehicle, id: 'VEH-other', gpsImei: '999', vehicleNumber: 'TN01OTHER' }
    const mismatched = { ...route1, gpsImei: '111', imei: '111' }
    const card = presentRouteCard({
        route: mismatched,
        vehicles: [otherVehicle, vehicle],
        routes: [mismatched],
        devicesChecked: true,
        nowSec: NOW,
    })
    assert.equal(card.trackImei, '')
    assert.equal(card.live, false)
    assert.equal(card.badge, 'NOT LIVE')
})
