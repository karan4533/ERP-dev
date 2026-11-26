import TransportRegister from '../../../Common/operations/TransportRegister'
import { deriveRouteState } from '../../../Common/operations/transportState'
import { StatusBadge } from '../../../Common/ui'
import { VEHICLES } from '../VehicleManagement/vehicleManagementData'
import { ROUTES } from './routeManagementData'
import { studentsForStop, staffForStop } from './routeStopRoster'

const records = ROUTES.map((route) => ({
    ...route,
    operationalState: deriveRouteState(route, VEHICLES.find((vehicle) => vehicle.id === route.vehicleId)),
}))

const columns = [
    { key: 'id', label: 'Route ID', required: true },
    {
        key: 'routeName',
        label: 'Route',
        required: true,
        render: (route) => (
            <div>
                <p className='font-semibold text-[var(--erp-ink)]'>{route.routeName}</p>
                <p className='mt-0.5 text-xs text-[var(--erp-muted)]'>{route.startLocation} → {route.endLocation}</p>
            </div>
        ),
    },
    { key: 'vehicleNumber', label: 'Vehicle', required: true, render: (route) => `${route.vehicleNumber} · ${route.vehicleId}` },
    { key: 'driverName', label: 'Driver', render: (route) => `${route.driverName} · ${route.driverContact}` },
    { key: 'totalStops', label: 'Stops' },
    {
        key: 'roster',
        label: 'Passenger Roster',
        render: (route) => {
            const studentCount = route.stops?.reduce((sum, stop, idx) => sum + studentsForStop(route, stop, idx).length, 0) || 0
            const staffCount = route.stops?.reduce((sum, _, idx) => sum + staffForStop(route.id, idx).length, 0) || 0
            return (
                <span className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#2441A8] text-xs font-medium'>
                    {studentCount} Students · {staffCount} Staff
                </span>
            )
        },
    },
    { key: 'distance', label: 'Distance' },
    { key: 'schedule', label: 'Morning window', render: (route) => `${route.pickUpTime}–${route.dropTime}` },
    { key: 'estimatedTime', label: 'Estimated time' },
    { key: 'operationalState', label: 'Readiness', required: true, render: (route) => <StatusBadge status={route.operationalState} /> },
]

const RouteManagement = () => (
    <TransportRegister
        records={records}
        columns={columns}
        caption='Transport route readiness register'
        title='Route readiness'
        description='A route is ready only when its vehicle, driver, stops and schedule are present and the assigned vehicle has no blocking readiness issue.'
        secondaryFilterKey='vehicleNumber'
        secondaryFilterLabel='Vehicle'
        createPath='/transport-manager/route-management/add-route'
        createLabel='Add route'
        getRowActions={(route) => [
            { label: 'View', to: `/transport-manager/route-management/view/${route.id}` },
            { label: 'Edit', to: `/transport-manager/route-management/edit/${route.id}` },
        ]}
    />
)

export default RouteManagement
