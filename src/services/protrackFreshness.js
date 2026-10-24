/**
 * ProTrack365 track freshness.
 * `gpstime` is a Unix timestamp (UTC seconds, or milliseconds if the value is > 1e12).
 * Age is `now - gpstime` in seconds. Local timezone is not applied to the timestamp.
 * datastatus 2 means OK and is not, by itself, a fresh fix.
 */

export const GPS_FRESH_MAX_AGE_SEC = 600

export const datastatusLabel = (code) =>
    ({
        1: 'Never online',
        2: 'OK',
        3: 'Expired',
        4: 'Offline',
        5: 'Blocked',
    })[Number(code)] || 'Unknown'

export const parseGpsUnixSeconds = (gpstime) => {
    const n = Number(gpstime)
    if (!Number.isFinite(n) || n <= 0) return null
    if (n > 1e12) return Math.floor(n / 1000)
    if (n > 1e9) return Math.floor(n)
    return null
}

/** Signed age in Unix seconds. Null when gpstime is missing or not a real timestamp. Negative means the fix is in the future. */
export const gpsAgeSeconds = (gpstime, nowSec = Math.floor(Date.now() / 1000)) => {
    const ts = parseGpsUnixSeconds(gpstime)
    const now = Number(nowSec)
    if (ts == null || !Number.isFinite(now)) return null
    return now - ts
}

export const trackHasCoordinates = (track) => {
    if (!track) return false
    const lat = Number(track.latitude)
    const lng = Number(track.longitude)
    return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
}

export const formatAgeApprox = (ageSec) => {
    if (ageSec == null || ageSec < 0) return null
    if (ageSec < 3600) return `approximately ${Math.round(ageSec / 60)} min ago`
    return `approximately ${(ageSec / 3600).toFixed(1)} h ago`
}

const unavailable = (label, ageSec, code) => ({
    state: 'unavailable',
    label,
    ageSec: ageSec ?? null,
    datastatus: code ?? null,
    live: false,
})

/**
 * fresh | stale | offline | unavailable.
 * `live` is true only for fresh: datastatus OK and age in [0, 600] seconds.
 */
export const classifyTrackFreshness = (track, nowSec = Math.floor(Date.now() / 1000)) => {
    if (!track) return unavailable('Unavailable', null, null)

    const code = Number(track.datastatus)
    const ageSec = gpsAgeSeconds(track.gpstime, nowSec)
    const hasCoords = trackHasCoordinates(track)
    const statusLabel = datastatusLabel(code)
    const knownCode = Number.isFinite(code)

    if (code === 1 || code === 3 || code === 5) {
        return unavailable(statusLabel, ageSec, code)
    }
    if (code === 4) {
        return {
            state: 'offline',
            label: hasCoords ? 'Offline — last known' : 'Offline',
            ageSec,
            datastatus: code,
            live: false,
        }
    }
    if (ageSec != null && ageSec < 0) {
        return unavailable('Invalid GPS time', ageSec, knownCode ? code : null)
    }
    if (ageSec == null) {
        return unavailable('Invalid GPS time', null, knownCode ? code : null)
    }
    if (!hasCoords) {
        return unavailable(statusLabel || 'Unavailable', ageSec, knownCode ? code : null)
    }
    if (code === 2 && ageSec >= 0 && ageSec <= GPS_FRESH_MAX_AGE_SEC) {
        return { state: 'fresh', label: 'Live GPS', ageSec, datastatus: code, live: true }
    }

    const ageHint = formatAgeApprox(ageSec) || 'last known'
    const prefix = code === 2 ? 'OK' : statusLabel
    return {
        state: 'stale',
        label: `${prefix} — last known (${ageHint})`,
        ageSec,
        datastatus: knownCode ? code : null,
        live: false,
    }
}
