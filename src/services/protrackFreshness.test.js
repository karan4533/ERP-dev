import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyTrackFreshness, gpsAgeSeconds } from './protrackFreshness.js'

const NOW = 1_792_820_000

const row = (gpstime, extra = {}) => ({
    datastatus: 2,
    latitude: 9.882777,
    longitude: 78.03727,
    gpstime,
    ...extra,
})

test('OK fix at exactly 600 seconds is live', () => {
    const result = classifyTrackFreshness(row(NOW - 600), NOW)
    assert.equal(result.live, true)
    assert.equal(result.state, 'fresh')
    assert.equal(result.label, 'Live GPS')
    assert.equal(result.ageSec, 600)
})

test('OK fix under 600 seconds is live', () => {
    const result = classifyTrackFreshness(row(NOW - 120), NOW)
    assert.equal(result.live, true)
    assert.equal(result.ageSec, 120)
})

test('OK fix at age 0 is live', () => {
    const result = classifyTrackFreshness(row(NOW), NOW)
    assert.equal(result.live, true)
    assert.equal(result.ageSec, 0)
})

test('fix older than 600 seconds is not live', () => {
    const result = classifyTrackFreshness(row(NOW - 601), NOW)
    assert.equal(result.live, false)
    assert.equal(result.state, 'stale')
    assert.match(result.label, /^OK — last known \(approximately /)
})

test('future timestamp is not live', () => {
    const result = classifyTrackFreshness(row(NOW + 30), NOW)
    assert.equal(result.live, false)
    assert.equal(result.state, 'unavailable')
    assert.equal(result.label, 'Invalid GPS time')
    assert.ok(result.ageSec < 0)
})

test('invalid timestamp is not live', () => {
    for (const gpstime of [0, -5, 'nope', null, '']) {
        const result = classifyTrackFreshness(row(gpstime), NOW)
        assert.equal(result.live, false, String(gpstime))
        assert.notEqual(result.state, 'fresh')
    }
})

test('OK status with a stale timestamp is not live', () => {
    const age = gpsAgeSeconds(1_792_817_627, 1_792_817_627 + 12_240)
    assert.equal(age, 12_240)
    const result = classifyTrackFreshness(row(1_792_817_627), 1_792_817_627 + 12_240)
    assert.equal(result.datastatus, 2)
    assert.equal(result.live, false)
    assert.equal(result.label, 'OK — last known (approximately 3.4 h ago)')
})

test('millisecond gpstime uses UTC unix seconds, not local timezone', () => {
    const result = classifyTrackFreshness(row((NOW - 30) * 1000), NOW)
    assert.equal(result.ageSec, 30)
    assert.equal(result.live, true)
})

test('offline, missing, and unavailable responses are not live', () => {
    const offline = classifyTrackFreshness(row(NOW - 10, { datastatus: 4 }), NOW)
    assert.equal(offline.state, 'offline')
    assert.equal(offline.live, false)

    const missing = classifyTrackFreshness(null, NOW)
    assert.equal(missing.state, 'unavailable')
    assert.equal(missing.live, false)

    const noCoords = classifyTrackFreshness(row(NOW - 10, { latitude: 0, longitude: 0 }), NOW)
    assert.equal(noCoords.live, false)
    assert.equal(noCoords.state, 'unavailable')

    const expired = classifyTrackFreshness(row(NOW - 10, { datastatus: 3 }), NOW)
    assert.equal(expired.live, false)
})
