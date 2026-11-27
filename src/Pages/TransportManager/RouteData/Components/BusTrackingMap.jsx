import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo, useState } from 'react'
import {
    SCHOOL_CAMPUS,
    isSchoolPlaceName,
    parseMapLatLng,
    resolveDestinationPosition,
} from '../../../../Common/Transport/schoolCampusLocation'

/** Demo path only — never used as live pickup/destination when GPS is on. */
const DEFAULT_ROUTE_COORDS = [
    [9.91143, 78.11755],
    [9.92517, 78.10197],
    [9.93607, 78.08788],
    [9.94273, 78.08150],
    [9.94908, 78.06969],
]

const DEFAULT_STATS = {
    progress: '~55%',
    distanceLeft: '3.2 km',
    eta: '~8 min',
    speed: '32 km/h',
}

/** Esri street tiles — geography like Google Maps, no API key required. */
const STREET_TILE_URL =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
const STREET_TILE_ATTR =
    'Tiles &copy; Esri &mdash; Source: Esri, OpenStreetMap contributors'

const GENERIC_PLACE = new Set([
    '',
    '-',
    '—',
    'pickup',
    'pickup point',
    'drop',
    'drop point',
    'drop-off',
    'destination',
    'school',
    'school campus',
    'campus',
    'start',
    'end',
    'n/a',
    'na',
    'tbd',
])

const isGenericPlace = (value) => GENERIC_PLACE.has(String(value || '').trim().toLowerCase())

const geocodeCache = new Map()

async function geocodePlace(query) {
    const q = String(query || '').trim()
    if (!q || q.length < 3) return null
    if (isSchoolPlaceName(q)) return SCHOOL_CAMPUS.position
    if (isGenericPlace(q)) return null
    if (geocodeCache.has(q)) return geocodeCache.get(q)

    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    url.searchParams.set('q', `${q}, Tamil Nadu, India`)

    try {
        const response = await fetch(url.toString(), {
            headers: { Accept: 'application/json' },
        })
        if (!response.ok) {
            geocodeCache.set(q, null)
            return null
        }
        const rows = await response.json()
        const hit = Array.isArray(rows) ? rows[0] : null
        const point = hit ? parseMapLatLng(hit.lat, hit.lon) : null
        geocodeCache.set(q, point)
        return point
    } catch {
        geocodeCache.set(q, null)
        return null
    }
}

const makeStopIcon = (color, label, { done = false, active = false, student = false } = {}) =>
    L.divIcon({
        className: '',
        html: `
      <div style="
        display:flex; flex-direction:column; align-items:center; gap:4px;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
      ">
        <div style="
          background:${done ? '#16a34a' : color};
          width:${student || active ? 22 : 16}px; height:${student || active ? 22 : 16}px;
          border-radius:50%;
          border:3px solid white;
          box-shadow: 0 0 0 ${student ? 3 : 2}px ${done ? '#16a34a' : (active ? '#f59e0b' : color)};
          display:flex; align-items:center; justify-content:center;
          color:white; font-size:11px; font-weight:800; line-height:1;
        ">${done ? '✓' : (active ? '●' : '')}</div>
        <div style="
          background:${done ? '#15803d' : (active ? '#b45309' : '#0C1E5B')};
          color:white;
          font-size:11px;
          font-weight:600;
          padding:3px 8px;
          border-radius:6px;
          white-space:nowrap;
          letter-spacing:0.3px;
        ">${label}</div>
      </div>`,
        iconSize: [0, 0],
        iconAnchor: [student || active ? 11 : 8, student || active ? 11 : 8],
    })

const makeBusIcon = (busLabel) =>
    L.divIcon({
        className: '',
        html: `
    <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
      <div style="
        background:#515DEF;
        border-radius:50%;
        width:44px; height:44px;
        display:flex; align-items:center; justify-content:center;
        border:3px solid white;
        box-shadow: 0 4px 16px rgba(81,93,239,0.55), 0 0 0 6px rgba(81,93,239,0.18);
        font-size:22px;
      ">🚌</div>
      <div style="
        background:#515DEF;
        color:white;
        font-size:11px;
        font-weight:700;
        padding:3px 10px;
        border-radius:20px;
        white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        letter-spacing:0.5px;
      ">${busLabel}</div>
    </div>`,
        iconSize: [0, 0],
        iconAnchor: [22, 22],
    })

function FitBounds({ coords, fallbackCenter, fallbackZoom = 15 }) {
    const map = useMap()
    useEffect(() => {
        const points = (coords || []).filter(
            (row) => Array.isArray(row) && row.length === 2 && Number.isFinite(row[0]) && Number.isFinite(row[1]),
        )
        if (points.length >= 2) {
            map.fitBounds(points, { padding: [48, 48], maxZoom: 16 })
            return
        }
        if (points.length === 1) {
            map.setView(points[0], fallbackZoom)
            return
        }
        if (fallbackCenter) {
            map.setView(fallbackCenter, fallbackZoom)
        }
    }, [coords, fallbackCenter, fallbackZoom, map])
    return null
}

function FollowLiveBus({ position, enabled }) {
    const map = useMap()
    useEffect(() => {
        if (!enabled || !position) return
        map.panTo(position, { animate: true, duration: 0.6 })
    }, [enabled, position, map])
    return null
}

export default function BusTrackingMap({
    routeName = 'Bus Route — Morning Pick-up',
    vehicleNumber = 'TN 59 AB 1234',
    driverName = 'Rajan M.',
    driverContact = '+919999999999',
    startLocation = 'Palanganatham',
    startSubtitle = 'Pickup Point',
    endLocation = 'Queen Mira School',
    endSubtitle = 'School Campus',
    busLabel = 'BUS-001',
    stats = DEFAULT_STATS,
    routeCoords = DEFAULT_ROUTE_COORDS,
    busIndex = 2,
    /** Explicit coords from route/assignment — preferred over geocoding */
    startPosition = null,
    endPosition = null,
    /** Extra stop pins (other pickups / drop points on the same route) */
    stopMarkers = [],
    /** pickup = home→school; drop = school→home */
    tripMode = 'pickup',
    /** Live ProTrack GPS [lat, lng] — when set, bus marker follows the device */
    livePosition = null,
    liveStatusLabel = '',
    /**
     * live — verified ProTrack fix (bus marker on GPS)
     * waiting — duty started; map + stops only, no demo bus
     * demo — simulated geometry (TM preview only)
     */
    trackingMode = 'demo',
    /** Optional status line under the title (e.g. on the move from…) */
    tripStatusLine = '',
    /** Show graded pickup/drop checklist under the map */
    showStopProgress = true,
}) {
    const isLive = trackingMode === 'live' && Array.isArray(livePosition) && livePosition.length === 2
    const isWaitingGps = trackingMode === 'waiting' || (trackingMode === 'live' && !isLive)
    const useRealTrip = isLive || isWaitingGps
    const isDropTrip = String(tripMode || '').toLowerCase() === 'drop'
    const [geoStart, setGeoStart] = useState(null)
    const [geoEnd, setGeoEnd] = useState(() => (
        parseMapLatLng(endPosition?.[0], endPosition?.[1])
        || resolveDestinationPosition({ endPosition, endLocation })
        || (!isDropTrip ? SCHOOL_CAMPUS.position : null)
    ))

    useEffect(() => {
        let active = true
        const explicitStart = parseMapLatLng(startPosition?.[0], startPosition?.[1])
            || (isDropTrip && isSchoolPlaceName(startLocation) ? SCHOOL_CAMPUS.position : null)
        const explicitEnd = parseMapLatLng(endPosition?.[0], endPosition?.[1])
            || (!isDropTrip
                ? resolveDestinationPosition({ endPosition, endLocation })
                : null)

        if (explicitStart) setGeoStart(explicitStart)
        else setGeoStart(null)

        if (explicitEnd) {
            setGeoEnd(explicitEnd)
        } else if (!isDropTrip) {
            setGeoEnd(SCHOOL_CAMPUS.position)
        } else {
            setGeoEnd(null)
        }

        ;(async () => {
            if (!explicitStart && startLocation) {
                const point = await geocodePlace(startLocation)
                if (active && point) setGeoStart(point)
            }
            if (!explicitEnd && endLocation && !isGenericPlace(endLocation)) {
                const point = isSchoolPlaceName(endLocation) && !isDropTrip
                    ? SCHOOL_CAMPUS.position
                    : await geocodePlace(endLocation)
                if (active && point) setGeoEnd(point)
            }
        })()

        return () => {
            active = false
        }
    }, [startLocation, endLocation, startPosition, endPosition, isDropTrip])

    const demoStart = routeCoords[0]
    const demoEnd = routeCoords[routeCoords.length - 1]
    const simulatedBus = routeCoords[busIndex] ?? demoEnd

    // Live / waiting: never fall back to dummy Madurai demo points for pickup/destination.
    const startPoint = useRealTrip ? geoStart : (geoStart || demoStart)
    const endPoint = useRealTrip ? geoEnd : (geoEnd || demoEnd)
    const busPosition = isLive ? livePosition : (useRealTrip ? null : simulatedBus)

    const completedCoords = routeCoords.slice(0, busIndex + 1)
    const remainingCoords = routeCoords.slice(busIndex)
    const progressWidth = isLive
        ? '100%'
        : useRealTrip
            ? '0%'
            : `${Math.min(100, Math.round((busIndex / Math.max(routeCoords.length - 1, 1)) * 100))}%`

    const startIcon = useMemo(
        () => makeStopIcon('#22c55e', isDropTrip ? '🏫 School start' : '📍 Pickup Point'),
        [isDropTrip],
    )
    const endIcon = useMemo(
        () => makeStopIcon('#f59e0b', isDropTrip ? '🏠 Drop-off' : '🏫 Destination'),
        [isDropTrip],
    )
    const busIcon = useMemo(() => makeBusIcon(busLabel), [busLabel])
    const stopIconFor = (stop) => {
        const done = stop?.status === 'done'
        const active = stop?.status === 'active'
        const student = Boolean(stop?.isStudentStop)
        const kind = isDropTrip ? 'Drop' : 'Pickup'
        const label = done
            ? `✓ ${kind} done`
            : active
                ? `▶ Next ${kind}`
                : (student ? `Your ${kind}` : (stop?.label || kind))
        const color = done ? '#16a34a' : active ? '#f59e0b' : student ? '#515DEF' : '#6366f1'
        return makeStopIcon(color, label, { done, active, student })
    }

    const fitCoords = useMemo(() => {
        const extras = (Array.isArray(stopMarkers) ? stopMarkers : [])
            .map((row) => row?.position)
            .filter(Boolean)
        if (useRealTrip) {
            return [startPoint, endPoint, busPosition, ...extras].filter(Boolean)
        }
        return routeCoords
    }, [useRealTrip, startPoint, endPoint, busPosition, routeCoords, stopMarkers])

    const phoneHref = driverContact.startsWith('+') ? `tel:${driverContact}` : `tel:+91${driverContact}`
    const liveLine = [startPoint, busPosition, endPoint].filter(Boolean)

    return (
        <div className='flex flex-col'>
            <div className='flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-b border-[#f2f4f7]'>
                <div className='flex items-center gap-3'>
                    <div className='bg-[#515DEF] p-2 rounded-xl'>
                        <span className='text-white text-xl'>🚌</span>
                    </div>
                    <div>
                        <p className='text-[#0C1E5B] font-semibold text-base leading-tight'>{routeName}</p>
                        <p className='text-[#667085] text-xs'>
                            Vehicle: {vehicleNumber} &nbsp;·&nbsp; Driver: {driverName}
                        </p>
                        {tripStatusLine ? (
                            <p className='text-[#515DEF] text-xs font-semibold mt-1'>{tripStatusLine}</p>
                        ) : null}
                    </div>
                </div>

                <div className='flex items-center gap-3'>
                    <a
                        href={phoneHref}
                        className='flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200 rounded-full px-3 py-1.5'
                    >
                        <svg xmlns='http://www.w3.org/2000/svg' className='w-3.5 h-3.5 text-emerald-600' viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z' />
                        </svg>
                        <span className='text-emerald-700 text-xs font-semibold'>Call Driver</span>
                    </a>

                    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
                        isLive
                            ? 'bg-[#EDEEF5]'
                            : isWaitingGps
                                ? 'bg-[#EEF2FF] border border-[#C7D2FE]'
                                : 'bg-[#FFF7ED] border border-[#FDBA74]'
                    }`}>
                        {isLive ? (
                            <span className='relative flex h-2.5 w-2.5'>
                                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
                                <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500' />
                            </span>
                        ) : null}
                        <span className='text-[#0C1E5B] text-xs font-semibold tracking-wide'>
                            {isLive
                                ? (liveStatusLabel || 'LIVE GPS')
                                : isWaitingGps
                                    ? 'WAITING FOR BUS GPS'
                                    : 'DEMO ROUTE — NOT LIVE GPS'}
                        </span>
                    </div>
                </div>
            </div>

            <div className='relative z-0 h-[60vh] min-h-[420px]'>
                <MapContainer
                    center={busPosition || startPoint || endPoint || SCHOOL_CAMPUS.position}
                    zoom={useRealTrip ? 14 : 13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom
                >
                    <TileLayer url={STREET_TILE_URL} attribution={STREET_TILE_ATTR} />

                    <FitBounds
                        coords={fitCoords}
                        fallbackCenter={busPosition || startPoint || endPoint || SCHOOL_CAMPUS.position}
                        fallbackZoom={useRealTrip ? 14 : 13}
                    />
                    <FollowLiveBus position={busPosition} enabled={isLive} />

                    {!useRealTrip && (
                        <>
                            <Polyline
                                positions={completedCoords}
                                pathOptions={{ color: '#515DEF', weight: 5, opacity: 0.95 }}
                            />
                            <Polyline
                                positions={remainingCoords}
                                pathOptions={{ color: '#94a3b8', weight: 4, opacity: 0.7, dashArray: '10 8' }}
                            />
                        </>
                    )}
                    {isLive && liveLine.length >= 2 && (
                        <Polyline
                            positions={liveLine}
                            pathOptions={{ color: '#515DEF', weight: 4, opacity: 0.55, dashArray: '6 8' }}
                        />
                    )}
                    {isWaitingGps && startPoint && endPoint && (
                        <Polyline
                            positions={[startPoint, endPoint]}
                            pathOptions={{ color: '#94a3b8', weight: 3, opacity: 0.45, dashArray: '6 8' }}
                        />
                    )}

                    {startPoint && (isDropTrip || !(Array.isArray(stopMarkers) && stopMarkers.length > 0)) && (
                        <Marker position={startPoint} icon={startIcon}>
                            <Popup>
                                <div className='text-sm font-semibold'>
                                    {isDropTrip ? '🏫 School (trip start)' : '📍 Pickup Point'}
                                </div>
                                <div className='text-xs text-gray-500 mt-1'>{startLocation}</div>
                                <div className='text-xs text-gray-400 mt-1'>
                                    {startPoint[0].toFixed(5)}, {startPoint[1].toFixed(5)}
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {endPoint && (
                        <Marker position={endPoint} icon={endIcon}>
                            <Popup>
                                <div className='text-sm font-semibold'>
                                    {isDropTrip ? `🏠 ${endLocation}` : `🏫 ${endLocation}`}
                                </div>
                                <div className='text-xs text-gray-500 mt-1'>{endSubtitle}</div>
                                <div className='text-xs text-gray-400 mt-1'>
                                    {endPoint[0].toFixed(5)}, {endPoint[1].toFixed(5)}
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {(Array.isArray(stopMarkers) ? stopMarkers : []).map((stop, index) => {
                        if (!stop?.position) return null
                        const sameAsEnd = endPoint
                            && Math.abs(stop.position[0] - endPoint[0]) < 1e-5
                            && Math.abs(stop.position[1] - endPoint[1]) < 1e-5
                        // Keep school destination marker separate; still show all pickup/drop stops.
                        if (sameAsEnd && !isDropTrip) return null
                        return (
                            <Marker
                                key={`stop-${index}-${stop.name}-${stop.status}`}
                                position={stop.position}
                                icon={stopIconFor(stop)}
                                zIndexOffset={stop.status === 'done' ? 200 : stop.isStudentStop ? 300 : 100}
                            >
                                <Popup>
                                    <div className='text-sm font-semibold'>
                                        {stop.status === 'done' ? '✓ ' : ''}
                                        {stop.label || 'Stop'}
                                        {stop.isStudentStop ? ' (yours)' : ''}
                                    </div>
                                    <div className='text-xs text-gray-500 mt-1'>{stop.name}</div>
                                    {stop.scheduleTime ? (
                                        <div className='text-xs text-gray-500 mt-1'>
                                            Scheduled: {stop.scheduleTime}
                                        </div>
                                    ) : null}
                                    <div className='text-xs mt-1 font-medium' style={{ color: stop.status === 'done' ? '#15803d' : '#b45309' }}>
                                        {stop.status === 'done'
                                            ? (stop.reason === 'time'
                                                ? 'Marked done — scheduled time passed'
                                                : stop.reason === 'arrived'
                                                    ? 'Marked done — bus reached this stop'
                                                    : 'Marked done — bus has crossed this stop')
                                            : stop.status === 'active'
                                                ? 'Next stop on this trip'
                                                : 'Upcoming'}
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    })}

                    {/* Bus marker only for real live GPS — never a demo bus on parent/student trips. */}
                    {isLive && busPosition && (
                        <Marker position={busPosition} icon={busIcon}>
                            <Popup>
                                <div className='text-sm font-semibold'>
                                    🚌 {busLabel} (Live GPS)
                                </div>
                                <div className='text-xs text-gray-500 mt-1'>
                                    {liveStatusLabel || `En route to ${endLocation}`}
                                </div>
                                <div className='text-xs text-emerald-600 font-medium mt-1'>
                                    {`${stats.speed} · ${livePosition[0].toFixed(5)}, ${livePosition[1].toFixed(5)}`}
                                </div>
                            </Popup>
                        </Marker>
                    )}
                    {!useRealTrip && busPosition && (
                        <Marker position={busPosition} icon={busIcon}>
                            <Popup>
                                <div className='text-sm font-semibold'>
                                    🚌 {busLabel} (Demo route position)
                                </div>
                                <div className='text-xs text-gray-500 mt-1'>
                                    Demo geometry only — not a live GPS fix
                                </div>
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
                {isWaitingGps && (
                    <div className='absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] pointer-events-none'>
                        <div className='bg-white/95 border border-[#C7D2FE] shadow-md rounded-full px-4 py-2 text-xs font-semibold text-[#515DEF]'>
                            Driver started — fetching bus GPS…
                        </div>
                    </div>
                )}
            </div>

            {showStopProgress && Array.isArray(stopMarkers) && stopMarkers.length > 0 && (
                <div className='px-4 py-3 border-t border-[#f2f4f7] bg-[#FAFBFF]'>
                    <p className='text-[11px] uppercase tracking-widest text-[#667085] mb-2'>
                        {isDropTrip ? 'Drop points' : 'Pickup points'}
                    </p>
                    <ol className='space-y-2 max-h-40 overflow-y-auto pr-1'>
                        {stopMarkers.map((stop) => {
                            const done = stop.status === 'done'
                            const active = stop.status === 'active'
                            return (
                                <li
                                    key={`progress-${stop.index}-${stop.name}`}
                                    className={`flex items-start gap-2 text-sm rounded-lg px-2 py-1.5 ${
                                        done ? 'bg-[#ECFDF5]' : active ? 'bg-[#FFFBEB]' : 'bg-white'
                                    } ${stop.isStudentStop ? 'ring-1 ring-[#515DEF55]' : ''}`}
                                >
                                    <span
                                        className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                            done
                                                ? 'bg-[#16a34a] text-white'
                                                : active
                                                    ? 'bg-[#f59e0b] text-white'
                                                    : 'bg-[#E2E8F0] text-[#64748B]'
                                        }`}
                                    >
                                        {done ? '✓' : stop.index + 1}
                                    </span>
                                    <div className='min-w-0 flex-1'>
                                        <p className={`font-medium truncate ${done ? 'text-[#15803d] line-through decoration-[#86efac]' : 'text-[#0C1E5B]'}`}>
                                            {stop.name}
                                            {stop.isStudentStop ? ' · Your stop' : ''}
                                        </p>
                                        <p className='text-[11px] text-[#667085]'>
                                            {stop.scheduleTime ? `Time ${stop.scheduleTime}` : 'No scheduled time'}
                                            {!stop.position ? ' · Locating pin…' : ''}
                                            {done
                                                ? (stop.reason === 'time'
                                                    ? ' · Time expired'
                                                    : stop.reason === 'arrived'
                                                        ? ' · Bus arrived'
                                                        : stop.reason === 'passed'
                                                            ? ' · Passed'
                                                            : ' · Done')
                                                : active
                                                    ? ' · Next'
                                                    : ''}
                                        </p>
                                    </div>
                                </li>
                            )
                        })}
                    </ol>
                </div>
            )}

            <div className='px-4 py-4 border-t border-[#f2f4f7]'>
                <div className='flex items-center gap-4 mb-4'>
                    <div className='flex-1 min-w-0'>
                        <p className='text-[#667085] text-[10px] uppercase tracking-widest mb-0.5'>From</p>
                        <p className='text-[#0C1E5B] font-semibold text-sm truncate'>{startLocation}</p>
                        <p className='text-[#667085] text-[11px]'>
                            {startPoint ? startSubtitle : (isLive ? 'No map pin yet — set a real pickup place name' : startSubtitle)}
                        </p>
                    </div>

                    <div className='flex flex-col items-center gap-1.5 shrink-0'>
                        <div className='w-28 sm:w-40 relative'>
                            <div className='h-1.5 bg-[#EDEEF5] rounded-full w-full' />
                            <div className='h-1.5 bg-[#515DEF] rounded-full absolute top-0 left-0' style={{ width: progressWidth }} />
                            <div
                                className='absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-[#515DEF] border-2 border-white rounded-full w-4 h-4 shadow-md shadow-[#515DEF]/50'
                                style={{ left: progressWidth }}
                            />
                        </div>
                        <p className='text-[#515DEF] text-[10px] font-semibold'>
                            {isWaitingGps ? 'Awaiting GPS' : `${stats.distanceLeft} left`}
                        </p>
                    </div>

                    <div className='flex-1 min-w-0 text-right'>
                        <p className='text-[#667085] text-[10px] uppercase tracking-widest mb-0.5'>To</p>
                        <p className='text-[#0C1E5B] font-semibold text-sm truncate'>{endLocation}</p>
                        <p className='text-[#667085] text-[11px]'>
                            {endPoint ? endSubtitle : (isLive ? 'No map pin yet — set a real destination name' : endSubtitle)}
                        </p>
                    </div>
                </div>

                <div className='grid grid-cols-3 gap-3 pt-3 border-t border-[#f2f4f7]'>
                    <div className='text-center'>
                        <p className='text-[#515DEF] font-bold text-base'>{stats.progress}</p>
                        <p className='text-[#667085] text-[11px]'>Route Done</p>
                    </div>
                    <div className='text-center border-x border-[#f2f4f7]'>
                        <p className='text-emerald-500 font-bold text-base'>{stats.eta}</p>
                        <p className='text-[#667085] text-[11px]'>ETA</p>
                    </div>
                    <div className='text-center'>
                        <p className='text-amber-500 font-bold text-base'>{stats.speed}</p>
                        <p className='text-[#667085] text-[11px]'>Speed</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
