import React, { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import BusRouteCard from './Components/BusRouteCard'
import BusTrackingMap from '../../TransportManager/RouteData/Components/BusTrackingMap'
import useProtrackLive from '../../../Common/Transport/useProtrackLive'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import { hydrateStudentBusAssignment } from './studentBusAssignment'

const TrackBus = ({ showRouteDetails = false }) => {
    const { activeStudent } = useActiveStudent()
    const [assignment, setAssignment] = useState(null)
    const [loadingAssignment, setLoadingAssignment] = useState(true)

    useEffect(() => {
        let cancelled = false
        setLoadingAssignment(true)
        hydrateStudentBusAssignment(activeStudent)
            .then((view) => {
                if (!cancelled) setAssignment(view)
            })
            .finally(() => {
                if (!cancelled) setLoadingAssignment(false)
            })
        return () => { cancelled = true }
    }, [activeStudent])

    const live = useProtrackLive({
        panel: 'parent',
        preferredImei: assignment?.imei || '',
        preferredPlate: assignment?.vehicleNumber || '',
        fallbackPanel: 'admin',
    })

    const device = live.devices.find((row) => row.imei === live.imei) || live.devices[0]
    const vehicleNumber = assignment?.vehicleNumber
        || device?.platenumber
        || '—'
    const driverName = assignment?.driverName || 'Assigned driver'
    const driverContact = assignment?.driverContact || ''
    const routeName = assignment?.routeName || device?.devicename || 'School Bus'

    return (
        <section>
            {showRouteDetails && <BusRouteCard title='Bus Route Details' />}

            <div className={`bg-white rounded-2xl shadow-md p-4 ${showRouteDetails ? 'mt-8' : ''}`}>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>Track Bus Location</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            {assignment
                                ? `Live GPS for ${assignment.vehicleNumber} on ${assignment.routeName} (polls every 15s).`
                                : 'Live GPS from ProTrack365 (polls every 15s).'}
                        </p>
                    </div>
                    <button
                        type='button'
                        onClick={() => live.refresh()}
                        className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 cursor-pointer'
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
                {!loadingAssignment && !assignment && (
                    <p className='text-sm text-[#667085] mt-3 bg-[#F9FAFB] border border-[#E0E0E0] rounded-md px-3 py-2'>
                        No transport enrollment found for this student. Route details and vehicle-matched GPS appear after Transport Manager assigns a route.
                    </p>
                )}
                {live.error && (
                    <p className='text-sm text-[#B45309] mt-3 bg-[#FFF7ED] border border-[#FDBA74] rounded-md px-3 py-2'>
                        {live.error}
                    </p>
                )}
                {live.devices.length > 1 && !assignment?.vehicleNumber && (
                    <label className='block mt-3 text-sm text-[#667085] max-w-md'>
                        Bus / device
                        <select
                            className='mt-1 w-full border border-[#D9D9D9] rounded-md px-2 py-2 text-[#1E1E1E]'
                            value={live.imei}
                            onChange={(event) => live.setImei(event.target.value)}
                        >
                            {live.devices.map((row) => (
                                <option key={row.imei} value={row.imei}>
                                    {row.platenumber || row.devicename || row.imei}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            <div className='bg-white rounded-2xl shadow-md mt-8 overflow-hidden'>
                <BusTrackingMap
                    routeName={routeName}
                    vehicleNumber={vehicleNumber}
                    driverName={driverName}
                    driverContact={driverContact}
                    startLocation={assignment?.pickupLocation || 'Pickup'}
                    endLocation={assignment?.endLocation || 'School'}
                    busLabel={assignment?.vehicleId || vehicleNumber || device?.imei?.slice(-4) || 'BUS'}
                    stats={live.stats}
                    livePosition={live.livePosition}
                    liveStatusLabel={live.liveStatusLabel}
                />
            </div>
        </section>
    )
}

export default TrackBus
