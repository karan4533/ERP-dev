import TransportRegister from '../../../Common/operations/TransportRegister'
import { deriveVehicleState } from '../../../Common/operations/transportState'
import { StatusBadge } from '../../../Common/ui'
import { VEHICLES } from './vehicleManagementData'

const records = VEHICLES.map((vehicle) => ({
    ...vehicle,
    category: vehicle.category || 'Bus',
    operationalState: deriveVehicleState(vehicle),
}))

const columns = [
    { key: 'id', label: 'Vehicle ID', required: true },
    { key: 'vehicleNumber', label: 'Registration', required: true },
    { key: 'vehicleType', label: 'Vehicle type' },
    { key: 'category', label: 'Category' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'driverName', label: 'Assigned driver', render: (vehicle) => `${vehicle.driverName || 'Unassigned'}${vehicle.driverContact ? ` · ${vehicle.driverContact}` : ''}` },
    { key: 'lastServiceDate', label: 'Last service' },
    { key: 'nextServiceDate', label: 'Next service' },
    { key: 'insuranceExpiryDate', label: 'Insurance expiry' },
    { key: 'operationalState', label: 'Readiness', required: true, render: (vehicle) => <StatusBadge status={vehicle.operationalState} /> },
]

const VehicleManagement = () => (
    <TransportRegister
        records={records}
        columns={columns}
        caption='Transport vehicle readiness register'
        title='Vehicle readiness'
        description='Review assignment, capacity, service and compliance dates before making a vehicle available to a route or duty.'
        secondaryFilterKey='category'
        secondaryFilterLabel='Category'
        createPath='/transport-manager/vehicle-management/add-vehicle'
        createLabel='Add vehicle'
        getRowActions={(vehicle) => [
            { label: 'View', to: `/transport-manager/vehicle-management/view/${vehicle.id}` },
            { label: 'Edit', to: `/transport-manager/vehicle-management/edit/${vehicle.id}` },
        ]}
    />
)

export default VehicleManagement
