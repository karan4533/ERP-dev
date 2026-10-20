import { useCallback, useEffect, useRef, useState } from 'react'
import {
    canUseProtrackApi,
    datastatusLabel,
    getProtrackStatusApi,
    listProtrackDevicesApi,
    trackProtrackImeisApi,
} from '../../services/protrackApi'

const POLL_MS = 15000

const isAuthFailure = (err) => {
    const message = String(err?.message || err || '').toLowerCase()
    return message.includes('login failed')
        || message.includes('permission denied')
        || message.includes('auth')
        || message.includes('unauthorized')
}

/**
 * Poll ProTrack365 devices + live coordinates for Transport / Parent / Student maps.
 * @param {{ panel?: 'admin'|'parent', preferredImei?: string, preferredPlate?: string, fallbackPanel?: 'admin'|'parent' }} opts
 */
export default function useProtrackLive(opts = {}) {
    const {
        panel,
        preferredImei = '',
        preferredPlate = '',
        fallbackPanel = '',
    } = opts
    const panelRef = useRef(panel || '')
    const [status, setStatus] = useState(null)
    const [devices, setDevices] = useState([])
    const [imei, setImei] = useState(preferredImei || '')
    const [track, setTrack] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        panelRef.current = panel || ''
    }, [panel])

    const refreshTrack = useCallback(async (targetImei, panelOverride) => {
        if (!canUseProtrackApi() || !targetImei) return
        const panelToUse = panelOverride || panelRef.current || panel
        try {
            const rows = await trackProtrackImeisApi([targetImei], panelToUse || undefined)
            const row = Array.isArray(rows) ? rows[0] : null
            setTrack(row || null)
            setError((prev) => (prev.includes('Parent GPS') ? prev : ''))
        } catch (err) {
            if (fallbackPanel && panelToUse !== fallbackPanel && isAuthFailure(err)) {
                try {
                    const rows = await trackProtrackImeisApi([targetImei], fallbackPanel)
                    const row = Array.isArray(rows) ? rows[0] : null
                    panelRef.current = fallbackPanel
                    setTrack(row || null)
                    setError('Parent GPS login failed — using school fleet tracking instead.')
                    return
                } catch (fallbackErr) {
                    setError(fallbackErr?.message || 'Live track failed.')
                    return
                }
            }
            setError(err?.message || 'Live track failed.')
        }
    }, [fallbackPanel, panel])

    useEffect(() => {
        if (!canUseProtrackApi()) {
            setError('Sign in with API auth to load ProTrack365.')
            return undefined
        }
        let active = true
        setLoading(true)
        panelRef.current = panel || ''
        ;(async () => {
            try {
                const st = await getProtrackStatusApi()
                if (!active) return
                setStatus(st)
                if (!st?.configured) {
                    setError('ProTrack365 credentials are not configured on the API (.env).')
                    return
                }

                let devicesList = []
                let panelUsed = panel || ''
                try {
                    devicesList = await listProtrackDevicesApi(panel || undefined)
                } catch (err) {
                    if (fallbackPanel && isAuthFailure(err)) {
                        devicesList = await listProtrackDevicesApi(fallbackPanel)
                        panelUsed = fallbackPanel
                        panelRef.current = fallbackPanel
                        if (active) {
                            setError('Parent GPS login failed — using school fleet tracking instead.')
                        }
                    } else {
                        throw err
                    }
                }
                if (!active) return
                panelRef.current = panelUsed
                devicesList = Array.isArray(devicesList) ? devicesList : []
                setDevices(devicesList)

                const plateNorm = String(preferredPlate || '').replace(/[\s-]/g, '').toUpperCase()
                const byImei = preferredImei
                    ? devicesList.find((d) => String(d.imei) === String(preferredImei))
                    : null
                const byPlate = plateNorm
                    ? devicesList.find(
                        (d) => String(d.platenumber || '').replace(/[\s-]/g, '').toUpperCase() === plateNorm,
                    )
                    : null
                const chosen = byImei || byPlate || devicesList[0]
                const nextImei = chosen?.imei || preferredImei || ''
                setImei(nextImei)
                if (nextImei) await refreshTrack(nextImei, panelUsed)
            } catch (err) {
                if (active) setError(err?.message || 'Could not load ProTrack devices.')
            } finally {
                if (active) setLoading(false)
            }
        })()
        return () => {
            active = false
        }
    }, [panel, preferredImei, preferredPlate, fallbackPanel, refreshTrack])

    useEffect(() => {
        if (!imei || !canUseProtrackApi()) return undefined
        const id = setInterval(() => {
            refreshTrack(imei)
        }, POLL_MS)
        return () => clearInterval(id)
    }, [imei, refreshTrack])

    const livePosition =
        track && Number.isFinite(Number(track.latitude)) && Number.isFinite(Number(track.longitude))
            ? [Number(track.latitude), Number(track.longitude)]
            : null

    const stats = {
        progress: livePosition ? 'Live GPS' : '—',
        distanceLeft: livePosition ? 'ProTrack365' : '—',
        eta: track?.gpstime
            ? new Date(Number(track.gpstime) * 1000).toLocaleTimeString()
            : '—',
        speed: track?.speed != null ? `${track.speed} km/h` : '—',
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
        livePosition,
        stats,
        liveStatusLabel: track ? datastatusLabel(track.datastatus) : '',
        error,
        loading,
        refresh: () => refreshTrack(imei),
    }
}
