import React, { useCallback } from 'react'
import AdminLiveDataList from '../../Components/AdminLiveDataList'
import { getDrivers, hydrateDriversFromApi } from '../../../TransportManager/DriverManagement/driverManagementData'
import { getDriverDisplayName } from '../../../TransportManager/DriverManagement/driverManagementData'

const COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'id', label: 'Driver ID' },
    { key: 'mobileNumber', label: 'Mobile' },
    { key: 'licenseNumber', label: 'License' },
    { key: 'routeAssigned', label: 'Route' },
    { key: 'status', label: 'Status' },
]

export default function DriverList() {
    const loadRows = useCallback(async () => {
        await hydrateDriversFromApi()
        return getDrivers().map((row) => ({
            ...row,
            id: row.id || row.driverId,
            name: getDriverDisplayName(row),
            mobileNumber: row.mobileNumber || row.mobile || '—',
            licenseNumber: row.licenseNumber || row.license || '—',
            routeAssigned: row.routeAssigned || row.routeName || '—',
            status: row.status || 'Active',
        }))
    }, [])

    return (
        <AdminLiveDataList
            title='Driver List'
            description='Live transport drivers collection.'
            columns={COLUMNS}
            loadRows={loadRows}
            searchKeys={['name', 'id', 'mobileNumber', 'licenseNumber']}
        />
    )
}
