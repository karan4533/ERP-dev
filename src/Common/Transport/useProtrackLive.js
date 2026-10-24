import { useCallback, useEffect, useState } from 'react'
import {
    canUseProtrackApi,
    classifyTrackFreshness,
    getProtrackStatusApi,
    listProtrackDevicesApi,
    trackHasCoordinates,
    trackProtrackImeisApi,
} from '../../services/protrackApi'

const POLL_MS = 15000

/**
 * Poll ProTrack365 devices + coordinates for Transport / Parent / Student maps.
 * Live marker only when classifyTrackFreshness → fresh. Stale/offline never labelled as live movement.
 * @param {{ panel?: 'admin'|'parent', preferredImei?: string, preferredPlate?: string }} opts
 */
export default function useProtrackLive(opts = {}) {
    const { panel, preferredImei = '', preferredPlate = '' } = opts
    const [status, setStatus] = useState(null)
    const [devices, setDevices] = useState([])
    const [imei, setImei] = useState(preferredImei || '')
    const [track, setTrack] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const refreshTrack = useCallback(async (targetImei) => {
        if (!canUseProtrackApi() || !targetImei) return
        try {
            const rows = await trackProtrackImeisApi([targetImei], panel)
            const row = Array.isArray(rows) ? rows[0] : null
            setTrack(row || null)
            setError('')
        } catch (err) {
            setError(err?.message || 'Live track failed.')
        }
    }, [panel])

    useEffect(() => {
        if (!canUseProtrackApi()) {
            setError('Sign in with API auth to load ProTrack365.')
            return undefined
        }
        let active = true
        setLoading(true)
        ;(async () => {
            try {
                const [st, list] = await Promise.all([
                    getProtrackStatusApi(),
                    listProtrackDevicesApi(panel),
                ])
                if (!active) return
                setStatus(st)
                const devicesList = Array.isArray(list) ? list : []
                setDevices(devicesList)
                if (!st?.configured) {
                    setError('ProTrack365 credentials are not configured on the API (.env).')
                    return
                }
                const plateNorm = String(preferredPlate || '').replace(/\s+/g, '').toUpperCase()
                const wantImei = String(preferredImei || '').trim()
                const byImei = wantImei
                    ? devicesList.find((d) => String(d.imei) === wantImei)
                    : null
                const byPlate = plateNorm
                    ? devicesList.find(
                        (d) => String(d.platenumber || '').replace(/\s+/g, '').toUpperCase() === plateNorm,
                    )
                    : null
                // Never fall back to the first device — wrong-bus risk.
                const chosen = byImei || byPlate || null
                if (!chosen) {
                    setImei('')
                    setTrack(null)
                    if (!wantImei && !plateNorm) {
                        setError(
                            'Live GPS needs a verified vehicle IMEI or plate mapped to a ProTrack device. Tracking stays off until that mapping exists.',
                        )
                    } else {
                        setError(
                            `No ProTrack device matches ${wantImei || preferredPlate}. Confirm the IMEI/plate on the vehicle record before enabling live tracking.`,
                        )
                    }
                    return
                }
                const nextImei = String(chosen.imei || '')
                setImei(nextImei)
                if (nextImei) await refreshTrack(nextImei)
            } catch (err) {
                if (active) setError(err?.message || 'Could not load ProTrack devices.')
            } finally {
                if (active) setLoading(false)
            }
        })()
        return () => {
            active = false
        }
    }, [panel, preferredImei, preferredPlate, refreshTrack])

    useEffect(() => {
        if (!imei || !canUseProtrackApi()) return undefined
        const id = setInterval(() => {
            refreshTrack(imei)
        }, POLL_MS)
        return () => clearInterval(id)
    }, [imei, refreshTrack])

    const freshness = classifyTrackFreshness(track)
    const coords = trackHasCoordinates(track)
        ? [Number(track.latitude), Number(track.longitude)]
        : null

    // Only a fresh OK fix may move the live marker / "Live GPS" chrome.
    const livePosition = freshness.live === true && freshness.state === 'fresh' ? coords : null
    const lastKnownPosition =
        freshness.state === 'stale' || freshness.state === 'offline' ? coords : null

    const stats = {
        progress: freshness.state === 'fresh' ? 'Live GPS' : freshness.label || '—',
        distanceLeft:
            freshness.state === 'fresh'
                ? 'ProTrack365'
                : freshness.state === 'stale' || freshness.state === 'offline'
                    ? 'Last known position — not live movement'
                    : '—',
        eta: track?.gpstime
            ? new Date(Number(track.gpstime) * 1000).toLocaleTimeString()
            : '—',
        speed:
            freshness.state === 'fresh' && track?.speed != null
                ? `${track.speed} km/h`
                : '—',
    }

    return {
        status,
        devices,
        imei,
        setImei: (next) => {
            setImei(next)
            refreshTrack(next)
        },
        track,
        freshness,
        livePosition,
        lastKnownPosition,
        stats,
        liveStatusLabel: freshness.label || '',
        error,
        loading,
        refresh: () => refreshTrack(imei),
    }
}
