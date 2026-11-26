import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveDutyState, deriveRouteState, deriveVehicleState } from '../../operations/transportState.js'

const now = new Date(2026, 9, 30, 12, 0, 0)

test('vehicle readiness blocks overdue service without inventing a live vehicle state', () => {
    const vehicle = {
        driverName: 'Sandy Selva',
        insuranceExpiryDate: '15-03-2027',
        nextServiceDate: '02-08-2026',
        capacity: 32,
    }
    assert.equal(deriveVehicleState(vehicle, now), 'Service overdue')
    assert.equal(deriveVehicleState({ ...vehicle, nextServiceDate: '02-12-2026' }, now), 'Operational')
})

test('route readiness inherits blocking vehicle context', () => {
    const route = { vehicleId: 'VEH-1001', driverName: 'Sandy Selva', stops: [{ id: 1 }] }
    const overdueVehicle = { driverName: 'Sandy Selva', insuranceExpiryDate: '15-03-2027', nextServiceDate: '02-08-2026' }
    const readyVehicle = { ...overdueVehicle, nextServiceDate: '02-12-2026' }
    assert.equal(deriveRouteState(route, overdueVehicle, now), 'Vehicle attention')
    assert.equal(deriveRouteState(route, readyVehicle, now), 'Route ready')
})

test('duty state distinguishes elapsed schedules from evidenced trip completion', () => {
    const duty = { driverId: 'VAN-1001', vehicleNumber: 'TN-09-AB-4521', routeName: 'North', dutyDate: '29-10-2026' }
    assert.equal(deriveDutyState(duty, now), 'Schedule elapsed')
    assert.equal(deriveDutyState({ ...duty, dutyDate: '30-10-2026' }, now), 'Due today')
    assert.equal(deriveDutyState({ ...duty, dutyDate: '31-10-2026' }, now), 'Scheduled')
})
