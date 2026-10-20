import { getTransportRows, hydrateTransportRows, saveTransportRows, nextPrefixedId } from '../transportCampus'
import { getRoutes } from '../RouteManagement/routeManagementData'

/** @deprecated Prefer live class/section from academics catalog */
export const CLASS_SECTIONS = [
    'Grade 6 - A',
    'Grade 7 - B',
    'Grade 8 - A',
    'Grade 9 - C',
    'Grade 10 - A',
    'Grade 11 - B',
    'Grade 12 - A',
]

export const FEES_STRUCTURES = ['Yearly', 'Half Yearly', 'Quarterly', 'Monthly']

/** @deprecated Use getStudentTransportRouteOptions() */
export const ROUTE_OPTIONS = []

const normalizeStop = (stop, route, index) => ({
    id: `${route.id}-stop-${index}`,
    label: stop.startLocation || `Stop ${index + 1}`,
    startLocation: stop.startLocation || route.startLocation || '',
    endLocation: stop.endLocation || route.endLocation || '',
    pickUpTime: stop.pickUpTime || route.pickUpTime || '',
    dropTime: stop.dropTime || route.dropTime || '',
    yearlyFees: stop.yearlyFees || route.yearlyFees || '',
    halfYearlyFees: stop.halfYearlyFees || route.halfYearlyFees || '',
    quarterlyFees: stop.quarterlyFees || route.quarterlyFees || '',
    monthlyFees: stop.monthlyFees || route.monthlyFees || '',
})

export function getStudentTransportRouteOptions() {
    return getRoutes().map((route) => {
        const stops = Array.isArray(route.stops) && route.stops.length > 0
            ? route.stops.map((stop, index) => normalizeStop(stop, route, index))
            : [
                normalizeStop(
                    {
                        startLocation: route.startLocation,
                        endLocation: route.endLocation,
                        pickUpTime: route.pickUpTime,
                        dropTime: route.dropTime,
                        yearlyFees: route.yearlyFees,
                        halfYearlyFees: route.halfYearlyFees,
                        quarterlyFees: route.quarterlyFees,
                        monthlyFees: route.monthlyFees,
                    },
                    route,
                    0,
                ),
            ]

        return {
            id: route.id,
            label: route.routeName,
            startLocation: route.startLocation,
            endLocation: route.endLocation,
            vehicleNumber: route.vehicleNumber,
            supportStaff: route.supportStaff,
            driverName: route.driverName,
            driverContact: route.driverContact,
            pickUpTime: route.pickUpTime,
            dropTime: route.dropTime,
            yearlyFees: route.yearlyFees,
            halfYearlyFees: route.halfYearlyFees,
            quarterlyFees: route.quarterlyFees,
            monthlyFees: route.monthlyFees,
            feesStructure: 'Yearly',
            stops,
        }
    })
}

export function feeAmountForStructure(stopOrRoute, structure) {
    if (!stopOrRoute || !structure) return ''
    const map = {
        Yearly: stopOrRoute.yearlyFees,
        'Half Yearly': stopOrRoute.halfYearlyFees,
        Quarterly: stopOrRoute.quarterlyFees,
        Monthly: stopOrRoute.monthlyFees,
    }
    return map[structure] || ''
}

export function formatFeesStructureLabel(structure, amount) {
    if (!structure) return ''
    const amt = String(amount || '').trim()
    if (!amt) return structure
    return `${structure} — ${amt}`
}

const DEFAULT_STUDENT_TRANSPORTS = [
    {
        id: 'ST-1001',
        studentId: 'STD-2024-1042',
        studentName: 'Arjun Krishnan',
        classSection: 'Grade 9 - C',
        parentName: 'Krishnan Nair',
        parentContact: '9840011042',
        admissionNumber: 'ADM-2024-0891',
        routeId: 'RT-1001',
        routeName: 'Route 5 — North Campus',
        startLocation: 'Anna Nagar',
        endLocation: 'Queen Mira International School',
        vehicleNumber: 'TN-09-AB-4521',
        supportStaff: 'Mrs. Lakshmi (Attendant)',
        driverName: 'Sandy Selva',
        driverContact: '9944076993',
        pickUpTime: '06:45 AM',
        dropTime: '07:30 AM',
        feesStructure: 'Yearly — ₹45,000',
        createdDate: '15-04-2025',
    },
    {
        id: 'ST-1002',
        studentId: 'STD-2024-1108',
        studentName: 'Meera Vijay',
        classSection: 'Grade 7 - B',
        parentName: 'Vijay Menon',
        parentContact: '9840011108',
        admissionNumber: 'ADM-2024-0956',
        routeId: 'RT-1002',
        routeName: 'Route 2 — East Campus',
        startLocation: 'Velachery',
        endLocation: 'Queen Mira International School',
        vehicleNumber: 'TN-09-CD-8834',
        supportStaff: 'Mr. Karthik (Attendant)',
        driverName: 'Rajesh K. Kumar',
        driverContact: '9845012345',
        pickUpTime: '06:30 AM',
        dropTime: '07:25 AM',
        feesStructure: 'Half Yearly — ₹25,500',
        createdDate: '22-04-2025',
    },
    {
        id: 'ST-1003',
        studentId: 'STD-2024-1175',
        studentName: 'Rahul Sharma',
        classSection: 'Grade 10 - A',
        parentName: 'Suresh Sharma',
        parentContact: '9840011175',
        admissionNumber: 'ADM-2023-0442',
        routeId: 'RT-1003',
        routeName: 'Route 8 — West Campus',
        startLocation: 'Porur',
        endLocation: 'Queen Mira International School',
        vehicleNumber: 'TN-09-EF-2210',
        supportStaff: 'Mrs. Anitha (Attendant)',
        driverName: 'Priya M. Venkatesh',
        driverContact: '9789012345',
        pickUpTime: '06:50 AM',
        dropTime: '07:35 AM',
        feesStructure: 'Quarterly — ₹11,000',
        createdDate: '05-05-2025',
    },
    {
        id: 'ST-1004',
        studentId: 'STD-2024-1203',
        studentName: 'Divya Nair',
        classSection: 'Grade 8 - A',
        parentName: 'Suresh Nair',
        parentContact: '9840011203',
        admissionNumber: 'ADM-2024-1023',
        routeId: 'RT-1004',
        routeName: 'Route 3 — South Campus',
        startLocation: 'Pallavaram',
        endLocation: 'Queen Mira International School',
        vehicleNumber: 'TN-09-GH-5567',
        supportStaff: 'Mr. Suresh (Attendant)',
        driverName: 'Mohan R. Das',
        driverContact: '9654321098',
        pickUpTime: '06:20 AM',
        dropTime: '07:20 AM',
        feesStructure: 'Monthly — ₹4,800',
        createdDate: '18-05-2025',
    },
    {
        id: 'ST-1005',
        studentId: 'STD-2024-1289',
        studentName: 'Kavin Raj',
        classSection: 'Grade 6 - A',
        parentName: 'Rajendran K.',
        parentContact: '9840011289',
        admissionNumber: 'ADM-2024-1102',
        routeId: 'RT-1001',
        routeName: 'Route 5 — North Campus',
        startLocation: 'Anna Nagar',
        endLocation: 'Queen Mira International School',
        vehicleNumber: 'TN-09-AB-4521',
        supportStaff: 'Mrs. Lakshmi (Attendant)',
        driverName: 'Sandy Selva',
        driverContact: '9944076993',
        pickUpTime: '06:45 AM',
        dropTime: '07:30 AM',
        feesStructure: 'Yearly — ₹45,000',
        createdDate: '02-06-2025',
    },
]

export const getStudentTransportById = (id) =>
    getStudentTransports().find((record) => record.id === id) ?? null
export const STUDENT_TRANSPORTS_STORAGE_KEY = 'schoolerp-transport-students-v1'

export function getStudentTransports() {
    return getTransportRows(STUDENT_TRANSPORTS_STORAGE_KEY, DEFAULT_STUDENT_TRANSPORTS)
}

export function saveStudentTransports(rows) {
    return saveTransportRows(STUDENT_TRANSPORTS_STORAGE_KEY, rows)
}

export function hydrateStudentTransportsFromApi() {
    return hydrateTransportRows(STUDENT_TRANSPORTS_STORAGE_KEY)
}

export async function upsertStudentTransport(record) {
    const rows = getStudentTransports()
    const nextId = record.id || nextPrefixedId(rows, 'ST-')
    const nextRecord = { ...record, id: nextId }
    const idx = rows.findIndex((row) => row.id === nextId)
    const next = idx >= 0 ? rows.map((row, i) => (i === idx ? nextRecord : row)) : [...rows, nextRecord]
    const result = await saveStudentTransports(next)
    return { ...result, record: nextRecord }
}

export async function deleteStudentTransport(id) {
    const rows = getStudentTransports()
    const next = rows.filter((row) => row.id !== id)
    if (next.length === rows.length) {
        return { success: false, message: 'Record not found.' }
    }
    return saveStudentTransports(next)
}

export const STUDENT_TRANSPORTS = DEFAULT_STUDENT_TRANSPORTS
