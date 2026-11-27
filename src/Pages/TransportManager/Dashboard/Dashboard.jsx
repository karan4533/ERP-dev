import React, { useEffect, useState } from 'react'
import { Bus, MapPin, Users, ClipboardList, GraduationCap, Wrench } from 'lucide-react'
import { getDrivers, hydrateDriversFromApi } from '../DriverManagement/driverManagementData'
import { getVehicles, hydrateVehiclesFromApi } from '../VehicleManagement/vehicleManagementData'
import { getRoutes, hydrateRoutesFromApi } from '../RouteManagement/routeManagementData'
import { getDuties, hydrateDutiesFromApi } from '../AssignDuty/assignDutyData'
import { getStudentTransports, hydrateStudentTransportsFromApi } from '../StudentTransport/studentTransportData'
import { getMaintenanceRecords, hydrateMaintenanceRecordsFromApi } from '../VehicleMaintenance/vehicleMaintenanceData'

const STAT_CARDS = [
    { key: 'drivers', label: 'Drivers', icon: Users, color: 'text-[#515DEF]', bg: 'bg-[#515DEF]/10' },
    { key: 'vehicles', label: 'Vehicles', icon: Bus, color: 'text-[#2196F3]', bg: 'bg-[#2196F3]/10' },
    { key: 'routes', label: 'Routes', icon: MapPin, color: 'text-[#9C27B0]', bg: 'bg-[#9C27B0]/10' },
    { key: 'duties', label: 'Assigned Duties', icon: ClipboardList, color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10' },
    { key: 'students', label: 'Student Transports', icon: GraduationCap, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10' },
    { key: 'maintenance', label: 'Maintenance Records', icon: Wrench, color: 'text-[#F44336]', bg: 'bg-[#F44336]/10' },
]

const Dashboard = () => {
    const [loading, setLoading] = useState(true)
    const [counts, setCounts] = useState({
        drivers: 0,
        vehicles: 0,
        routes: 0,
        duties: 0,
        students: 0,
        maintenance: 0,
    })

    useEffect(() => {
        let cancelled = false
        Promise.all([
            hydrateDriversFromApi(),
            hydrateVehiclesFromApi(),
            hydrateRoutesFromApi(),
            hydrateDutiesFromApi(),
            hydrateStudentTransportsFromApi(),
            hydrateMaintenanceRecordsFromApi(),
        ]).finally(() => {
            if (!cancelled) {
                setCounts({
                    drivers: getDrivers().length,
                    vehicles: getVehicles().length,
                    routes: getRoutes().length,
                    duties: getDuties().length,
                    students: getStudentTransports().length,
                    maintenance: getMaintenanceRecords().length,
                })
                setLoading(false)
            }
        })
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4 mb-6'>
                <h2 className='text-xl font-semibold text-black'>Transport Dashboard</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Live counts from campus transport operations.
                </p>
            </div>

            {loading ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Loading dashboard…
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {STAT_CARDS.map((card) => {
                        const StatIcon = card.icon
                        return (
                            <div key={card.key} className='bg-white rounded-2xl shadow-md p-6 flex items-center gap-4'>
                                <div className={`p-3 rounded-xl ${card.bg}`}>
                                    <StatIcon size={28} className={card.color} />
                                </div>
                                <div>
                                    <p className='text-sm text-[#667085]'>{card.label}</p>
                                    <p className='text-3xl font-semibold text-[#0C1E5B] mt-1'>{counts[card.key]}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

export default Dashboard
