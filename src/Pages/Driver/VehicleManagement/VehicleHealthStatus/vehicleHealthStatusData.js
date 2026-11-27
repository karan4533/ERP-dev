import { ensureCampusSeed, hydrateCampusKey, saveCampusJson, usesCampusApiForKey } from '../../../../services/campusJsonStore'

const STORAGE_KEY = 'schoolerp-transport-vehicle-health-v1'

export const VEHICLE_NUMBERS = [
    'TN 33 AB 1234',
    'TN 55 AB 1909',
    'TN 12 CD 5678',
]

export const CONDITION_OPTIONS = ['Excellent', 'Good', 'Fair', 'Needs Attention']
export const FUEL_LEVEL_OPTIONS = ['100%', '90%', '80%', '70%', '60%', '50%', '40%', '30%', '20%', '10%']

export const HEALTH_STATUS_RECORDS = [
    {
        id: 'VHS-001',
        vehicleNumber: 'TN 55 AB 1909',
        lastServiceDate: '01-07-2025',
        nextServiceDate: '01-10-2025',
        odometerReading: '45,250 KM',
        fuelLevel: '70%',
        tyreCondition: 'Good',
        batteryStatus: 'Good',
        engineStatus: 'Excellent',
        remarks: 'Over all Health Condition Excellent',
    },
    {
        id: 'VHS-002',
        vehicleNumber: 'TN 33 AB 1234',
        lastServiceDate: '15-06-2025',
        nextServiceDate: '15-09-2025',
        odometerReading: '38,120 KM',
        fuelLevel: '55%',
        tyreCondition: 'Good',
        batteryStatus: 'Good',
        engineStatus: 'Good',
        remarks: 'Routine check completed. No issues reported.',
    },
    {
        id: 'VHS-003',
        vehicleNumber: 'TN 12 CD 5678',
        lastServiceDate: '02-05-2025',
        nextServiceDate: '02-08-2025',
        odometerReading: '52,890 KM',
        fuelLevel: '40%',
        tyreCondition: 'Fair',
        batteryStatus: 'Good',
        engineStatus: 'Good',
        remarks: 'Front-left tyre wear noted. Monitor before next service.',
    },
]

export function getHealthRecords() {
    const seed = usesCampusApiForKey(STORAGE_KEY) ? [] : HEALTH_STATUS_RECORDS
    return ensureCampusSeed(STORAGE_KEY, seed)
}

export function saveHealthRecords(rows) {
    return saveCampusJson(STORAGE_KEY, rows)
}

export function hydrateHealthRecords() {
    if (!usesCampusApiForKey(STORAGE_KEY)) return Promise.resolve(false)
    return hydrateCampusKey(STORAGE_KEY, [])
}

export const getHealthStatusById = (id) =>
    getHealthRecords().find((record) => record.id === id) || null

export const conditionBadgeColor = {
    Excellent: 'bg-[#4CAF501A] text-[#4CAF50]',
    Good: 'bg-[#515DEF1A] text-[#515DEF]',
    Fair: 'bg-[#FF98001A] text-[#FF9800]',
    'Needs Attention': 'bg-[#FF57221A] text-[#FF5722]',
}

const parseServiceDate = (value) => {
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

const plateKey = (value) => String(value || '').replace(/[\s-]/g, '').toUpperCase()

export const filterHealthStatusRecords = ({
    records,
    search = '',
    vehicleNumber = '',
    engineStatus = '',
    tyreCondition = '',
    fromDate = null,
    toDate = null,
}) => (Array.isArray(records) ? records : []).filter((record) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [
        record.vehicleNumber,
        record.remarks,
        record.odometerReading,
        record.fuelLevel,
    ].some((field) => String(field || '').toLowerCase().includes(query))

    const matchesVehicle = !vehicleNumber || plateKey(record.vehicleNumber) === plateKey(vehicleNumber)
    const matchesEngine = !engineStatus || record.engineStatus === engineStatus
    const matchesTyre = !tyreCondition || record.tyreCondition === tyreCondition

    const serviceDate = parseServiceDate(record.lastServiceDate)
    const matchesFrom = !fromDate || (serviceDate && serviceDate >= fromDate)
    const matchesTo = !toDate || (serviceDate && serviceDate <= toDate)

    return matchesSearch && matchesVehicle && matchesEngine && matchesTyre && matchesFrom && matchesTo
})
