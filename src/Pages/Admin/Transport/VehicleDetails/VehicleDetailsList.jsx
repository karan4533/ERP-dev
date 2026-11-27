import React, { useCallback } from 'react'
import AdminLiveDataList from '../../Components/AdminLiveDataList'
import { getVehicles, hydrateVehiclesFromApi } from '../../../TransportManager/VehicleManagement/vehicleManagementData'

const COLUMNS = [
    { key: 'vehicleNumber', label: 'Vehicle No.' },
    { key: 'vehicleType', label: 'Type' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'driverName', label: 'Driver' },
    { key: 'status', label: 'Status' },
]

export default function VehicleDetailsList() {
    const loadRows = useCallback(async () => {
        await hydrateVehiclesFromApi()
        return getVehicles().map((row) => ({
            id: row.id || row.vehicleNumber,
            vehicleNumber: row.vehicleNumber || row.registrationNumber || '—',
            vehicleType: row.vehicleType || row.type || '—',
            capacity: row.capacity ?? '—',
            driverName: row.driverName || row.driver || '—',
            status: row.status || 'Active',
        }))
    }, [])

    return (
        <AdminLiveDataList
            title='Vehicle Details'
            description='Live transport vehicles collection.'
            columns={COLUMNS}
            loadRows={loadRows}
            searchKeys={['vehicleNumber', 'vehicleType', 'driverName']}
        />
    )
}
