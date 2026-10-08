import { DRIVERS, getDriverDisplayName } from '../DriverManagement/driverManagementData'
import { ROUTES } from '../RouteManagement/routeManagementData'

export const SHIFTS = ['Morning', 'Afternoon', 'Evening']

export const DRIVER_OPTIONS = DRIVERS.map((driver) => {
    const route = ROUTES.find((item) => item.vehicleNumber === driver.vehicleNumber)
    return {
        id: driver.id,
        label: getDriverDisplayName(driver),
        vehicleNumber: driver.vehicleNumber,
        routeName: route?.routeName ?? driver.routeAssigned,
    }
})

export const ROUTE_OPTIONS = ROUTES.map((route) => ({
    id: route.id,
    label: route.routeName,
    vehicleNumber: route.vehicleNumber,
}))

export const DUTIES = [
    {
        id: 'DUTY-1001',
        dutyId: 'DUTY-1001',
        driverName: 'Sandy Selva',
        driverId: 'VAN-1001',
        vehicleNumber: 'TN-09-AB-4521',
        routeName: 'Route 5 — North Campus',
        dutyDate: '10-06-2026',
        shift: 'Morning',
        startTime: '06:30 AM',
        endTime: '02:00 PM',
    },
    {
        id: 'DUTY-1002',
        dutyId: 'DUTY-1002',
        driverName: 'Rajesh K. Kumar',
        driverId: 'VAN-1002',
        vehicleNumber: 'TN-09-CD-8834',
        routeName: 'Route 2 — East Campus',
        dutyDate: '10-06-2026',
        shift: 'Morning',
        startTime: '06:00 AM',
        endTime: '01:30 PM',
    },
    {
        id: 'DUTY-1003',
        dutyId: 'DUTY-1003',
        driverName: 'Priya M. Venkatesh',
        driverId: 'VAN-1003',
        vehicleNumber: 'TN-09-EF-2210',
        routeName: 'Route 8 — West Campus',
        dutyDate: '11-06-2026',
        shift: 'Morning',
        startTime: '06:45 AM',
        endTime: '02:30 PM',
    },
    {
        id: 'DUTY-1004',
        dutyId: 'DUTY-1004',
        driverName: 'Mohan R. Das',
        driverId: 'VAN-1004',
        vehicleNumber: 'TN-09-GH-5567',
        routeName: 'Route 3 — South Campus',
        dutyDate: '11-06-2026',
        shift: 'Morning',
        startTime: '05:45 AM',
        endTime: '01:00 PM',
    },
    {
        id: 'DUTY-1005',
        dutyId: 'DUTY-1005',
        driverName: 'Sandy Selva',
        driverId: 'VAN-1001',
        vehicleNumber: 'TN-09-AB-4521',
        routeName: 'Route 5 — North Campus',
        dutyDate: '12-06-2026',
        shift: 'Afternoon',
        startTime: '02:30 PM',
        endTime: '06:00 PM',
    },
]

export const getDutyById = (id) => DUTIES.find((duty) => duty.id === id) ?? null
