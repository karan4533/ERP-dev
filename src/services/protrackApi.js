import { apiRequest, getAccessToken, isApiAuthEnabled } from './apiClient'

export {
    GPS_FRESH_MAX_AGE_SEC,
    datastatusLabel,
    parseGpsUnixSeconds,
    gpsAgeSeconds,
    trackHasCoordinates,
    formatAgeApprox,
    classifyTrackFreshness,
} from './protrackFreshness'

export const isApiProtrackEnabled = () => {
    const explicit = import.meta.env.VITE_USE_API_PROTRACK
    if (explicit !== undefined && explicit !== '') return String(explicit) === 'true'
    return isApiAuthEnabled()
}

export const canUseProtrackApi = () => isApiProtrackEnabled() && Boolean(getAccessToken())

export const getProtrackStatusApi = () => apiRequest('/protrack/status')

export const listProtrackDevicesApi = (panel) => {
    const qs = panel ? `?panel=${encodeURIComponent(panel)}` : ''
    return apiRequest(`/protrack/devices${qs}`)
}

export const trackProtrackImeisApi = (imeis, panel) => {
    const list = Array.isArray(imeis) ? imeis.join(',') : String(imeis || '')
    const params = new URLSearchParams({ imeis: list })
    if (panel) params.set('panel', panel)
    return apiRequest(`/protrack/track?${params.toString()}`)
}
