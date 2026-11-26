import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveIncidentSla, getIncidentSlaHours, getNextIncidentStatus } from '../../operations/incidentState.js'

test('incident SLA targets follow priority hierarchy', () => {
    assert.equal(getIncidentSlaHours('Critical'), 1)
    assert.equal(getIncidentSlaHours('High'), 2)
    assert.equal(getIncidentSlaHours('Medium'), 8)
    assert.equal(getIncidentSlaHours('Low'), 24)
})

test('incident SLA distinguishes active breaches from resolved records', () => {
    const now = new Date('2026-10-30T12:00:00.000Z')
    assert.equal(deriveIncidentSla({ status: 'Open', dueAt: '2026-10-30T11:00:00.000Z' }, now), 'Breached')
    assert.equal(deriveIncidentSla({ status: 'Open', dueAt: '2026-10-30T18:00:00.000Z' }, now), 'On track')
    assert.equal(deriveIncidentSla({ status: 'Resolved', dueAt: '2026-10-30T11:00:00.000Z' }, now), 'Resolved')
})

test('incident workflow advances through acknowledged investigation before resolution', () => {
    assert.equal(getNextIncidentStatus('Open'), 'Acknowledged')
    assert.equal(getNextIncidentStatus('Acknowledged'), 'Investigating')
    assert.equal(getNextIncidentStatus('Investigating'), 'Resolved')
    assert.equal(getNextIncidentStatus('Resolved'), 'Resolved')
})
