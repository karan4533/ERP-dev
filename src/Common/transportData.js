/** Shared dummy transport options for forms across the app */

export const MODE_OF_TRANSPORT_OPTIONS = [
    'School Bus',
    'Private Cabs',
    'Bicycle',
    'E-Vehicles',
    'Walk',
]

export const ROUTE_BUS_STOP_MAP = {
    'Route 1 - North Zone': ['Main Gate', 'City Center', 'North Market', 'Green Park'],
    'Route 2 - South Zone': ['South Gate', 'Railway Station', 'Industrial Area', 'Lake View'],
    'Route 3 - East Zone': ['East Gate', 'Hospital Road', 'College Circle', 'Temple Street'],
    'Route 4 - West Zone': ['West Gate', 'Mall Road', 'Stadium', 'Bus Terminal'],
}

export const ROUTE_OPTIONS = Object.keys(ROUTE_BUS_STOP_MAP)

export const getBusStopsByRoute = (route) => ROUTE_BUS_STOP_MAP[route] ?? []

export const isSchoolBusMode = (mode) => mode === 'School Bus'
