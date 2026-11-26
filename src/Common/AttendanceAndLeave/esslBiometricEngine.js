/**
 * eSSL Biometric Device Integration Engine & Hardware Abstraction
 * Handles:
 * - Device registry for eSSL SilkBio, X990, MB20, and Identix
 * - Raw biometric transaction punch logs (immutable source)
 * - Biometric Device User ID to ERP Employee ID bidirectional mapping
 * - Punch debouncing & deduplication (2-minute window)
 * - First-In / Last-Out punch computation
 * - Device Health Monitoring and automated/manual sync triggers
 * - Unmapped punch resolution queue
 */

export const ESSL_STORAGE_KEYS = Object.freeze({
    DEVICES: 'schoolerp-essl-devices-v1',
    RAW_PUNCHES: 'schoolerp-essl-raw-punches-v1',
    USER_MAPPINGS: 'schoolerp-essl-user-mappings-v1',
    SYNC_LOGS: 'schoolerp-essl-sync-logs-v1',
})

// ==========================================
// 1. DEFAULT eSSL DEVICES REGISTRY
// ==========================================

export const DEFAULT_ESSL_DEVICES = [
    {
        deviceId: 'DEV-ESSL-01',
        name: 'Main Campus Gate - SilkBio',
        model: 'eSSL SilkBio 100-H',
        ipAddress: '192.168.1.201',
        port: 4370,
        commKey: '0',
        location: 'Main Gate Security Post',
        assignedDepartment: 'All Staff & Visitors',
        connectionType: 'TCP/IP Direct',
        status: 'Online', // 'Online' | 'Offline' | 'Syncing'
        lastSyncTime: '31-10-2026 09:35 AM',
        firmwareVersion: 'Ver 6.60 Dec 2024',
        totalPunchesRecorded: 14280,
        healthScore: 99.4,
        autoSyncIntervalMinutes: 5,
        supportedModes: ['Face', 'Fingerprint', 'RFID', 'PIN'],
    },
    {
        deviceId: 'DEV-ESSL-02',
        name: 'Staff Room East - X990',
        model: 'eSSL X990',
        ipAddress: '192.168.1.202',
        port: 4370,
        commKey: '0',
        location: 'Academic Staff Room (1st Floor)',
        assignedDepartment: 'Academics & Teaching',
        connectionType: 'TCP/IP Direct',
        status: 'Online',
        lastSyncTime: '31-10-2026 09:30 AM',
        firmwareVersion: 'Ver 6.54 Oct 2024',
        totalPunchesRecorded: 8940,
        healthScore: 98.8,
        autoSyncIntervalMinutes: 10,
        supportedModes: ['Fingerprint', 'RFID', 'PIN'],
    },
    {
        deviceId: 'DEV-ESSL-03',
        name: 'Admin Block Lobby - MB20',
        model: 'eSSL MB20',
        ipAddress: '192.168.1.203',
        port: 4370,
        commKey: '0',
        location: 'Administrative Block Ground Floor',
        assignedDepartment: 'Administration, Accounts & HR',
        connectionType: 'TCP/IP Direct',
        status: 'Online',
        lastSyncTime: '31-10-2026 09:28 AM',
        firmwareVersion: 'Ver 6.58 Nov 2024',
        totalPunchesRecorded: 6710,
        healthScore: 99.1,
        autoSyncIntervalMinutes: 5,
        supportedModes: ['Face', 'Fingerprint', 'PIN'],
    },
    {
        deviceId: 'DEV-ESSL-04',
        name: 'Transport Hub - Identix',
        model: 'eSSL Identix K20',
        ipAddress: '192.168.1.204',
        port: 4370,
        commKey: '0',
        location: 'Bus Depot & Fleet Workshop',
        assignedDepartment: 'Transport & Fleet Logistics',
        connectionType: 'TCP/IP Direct',
        status: 'Online',
        lastSyncTime: '31-10-2026 09:20 AM',
        firmwareVersion: 'Ver 6.42 Jan 2024',
        totalPunchesRecorded: 3420,
        healthScore: 97.5,
        autoSyncIntervalMinutes: 15,
        supportedModes: ['Fingerprint', 'RFID'],
    },
]

// ==========================================
// 2. BIOMETRIC USER MAPPING TABLE
// ==========================================

export const DEFAULT_USER_MAPPINGS = [
    {
        mappingId: 'MAP-001',
        deviceUserId: '1001',
        employeeId: 'EMP-DIR-001',
        employeeName: 'Dr. Kavita Sharma',
        department: 'Administration',
        primaryAuthMode: 'Face',
        rfidCardNumber: 'RFID-1001-A',
        status: 'Active',
        enrolledDate: '15-06-2024',
    },
    {
        mappingId: 'MAP-002',
        deviceUserId: '1002',
        employeeId: 'EMP-PRN-001',
        employeeName: 'Dr. Ramanathan K',
        department: 'Academics & Teaching',
        primaryAuthMode: 'Face',
        rfidCardNumber: 'RFID-1002-A',
        status: 'Active',
        enrolledDate: '15-06-2024',
    },
    {
        mappingId: 'MAP-003',
        deviceUserId: '1003',
        employeeId: 'EMP-TCH-001',
        employeeName: 'Priya Sundaram',
        department: 'Academics & Teaching',
        primaryAuthMode: 'Fingerprint',
        rfidCardNumber: 'RFID-1003-T',
        status: 'Active',
        enrolledDate: '20-07-2024',
    },
    {
        mappingId: 'MAP-004',
        deviceUserId: '1004',
        employeeId: 'EMP-TCH-002',
        employeeName: 'Meera Nair',
        department: 'Academics & Teaching',
        primaryAuthMode: 'Fingerprint',
        rfidCardNumber: 'RFID-1004-T',
        status: 'Active',
        enrolledDate: '20-07-2024',
    },
    {
        mappingId: 'MAP-005',
        deviceUserId: '1005',
        employeeId: 'EMP-TCH-003',
        employeeName: 'Rajesh Kulkarni',
        department: 'Academics & Teaching',
        primaryAuthMode: 'Face',
        rfidCardNumber: 'RFID-1005-T',
        status: 'Active',
        enrolledDate: '20-07-2024',
    },
    {
        mappingId: 'MAP-006',
        deviceUserId: '1006',
        employeeId: 'EMP-ADM-001',
        employeeName: 'Sunita Menon',
        department: 'Administration',
        primaryAuthMode: 'Fingerprint',
        rfidCardNumber: 'RFID-1006-A',
        status: 'Active',
        enrolledDate: '10-08-2024',
    },
    {
        mappingId: 'MAP-007',
        deviceUserId: '1007',
        employeeId: 'EMP-HR-001',
        employeeName: 'Deepak Chopra',
        department: 'Human Resources (HR)',
        primaryAuthMode: 'Fingerprint',
        rfidCardNumber: 'RFID-1007-H',
        status: 'Active',
        enrolledDate: '10-08-2024',
    },
    {
        mappingId: 'MAP-008',
        deviceUserId: '1008',
        employeeId: 'EMP-STR-001',
        employeeName: 'Murugan P',
        department: 'Stores & Procurement',
        primaryAuthMode: 'Fingerprint',
        rfidCardNumber: 'RFID-1008-S',
        status: 'Active',
        enrolledDate: '15-08-2024',
    },
    {
        mappingId: 'MAP-009',
        deviceUserId: '1009',
        employeeId: 'EMP-TRN-001',
        employeeName: 'Suresh Patil',
        department: 'Transport & Fleet Logistics',
        primaryAuthMode: 'RFID',
        rfidCardNumber: 'RFID-1009-T',
        status: 'Active',
        enrolledDate: '01-09-2024',
    },
    {
        mappingId: 'MAP-010',
        deviceUserId: '1010',
        employeeId: 'EMP-DRV-001',
        employeeName: 'Ramesh Yadav',
        department: 'Transport & Fleet Logistics',
        primaryAuthMode: 'Fingerprint',
        rfidCardNumber: 'RFID-1010-D',
        status: 'Active',
        enrolledDate: '01-09-2024',
    },
    {
        mappingId: 'MAP-011',
        deviceUserId: '1011',
        employeeId: 'EMP-GTK-001',
        employeeName: 'Balwan Singh',
        department: 'Campus Security & Gate',
        primaryAuthMode: 'Fingerprint',
        rfidCardNumber: 'RFID-1011-G',
        status: 'Active',
        enrolledDate: '05-09-2024',
    },
    {
        mappingId: 'MAP-012',
        deviceUserId: '1012',
        employeeId: 'EMP-ITS-001',
        employeeName: 'Karthik Raja',
        department: 'Information Technology (IT)',
        primaryAuthMode: 'Face',
        rfidCardNumber: 'RFID-1012-I',
        status: 'Active',
        enrolledDate: '10-09-2024',
    },
]

// ==========================================
// 3. RAW BIOMETRIC TRANSACTION LOGS
// ==========================================

export const DEFAULT_RAW_PUNCHES = [
    // Today's punches (31-10-2026)
    {
        punchId: 'PUNCH-20261031-001',
        deviceId: 'DEV-ESSL-01',
        deviceUserId: '1001',
        punchDate: '31-10-2026',
        punchTime: '08:52 AM',
        timestamp: '2026-10-31T08:52:14',
        verificationMode: 'Face',
        punchState: 'CheckIn',
        isDuplicate: false,
    },
    {
        punchId: 'PUNCH-20261031-002',
        deviceId: 'DEV-ESSL-01',
        deviceUserId: '1002',
        punchDate: '31-10-2026',
        punchTime: '08:24 AM',
        timestamp: '2026-10-31T08:24:05',
        verificationMode: 'Face',
        punchState: 'CheckIn',
        isDuplicate: false,
    },
    // Duplicate test punch within 40 seconds (should be ignored by deduplicator)
    {
        punchId: 'PUNCH-20261031-002-DUP',
        deviceId: 'DEV-ESSL-01',
        deviceUserId: '1002',
        punchDate: '31-10-2026',
        punchTime: '08:24 AM',
        timestamp: '2026-10-31T08:24:45',
        verificationMode: 'Face',
        punchState: 'CheckIn',
        isDuplicate: true,
    },
    {
        punchId: 'PUNCH-20261031-003',
        deviceId: 'DEV-ESSL-02',
        deviceUserId: '1003',
        punchDate: '31-10-2026',
        punchTime: '08:26 AM',
        timestamp: '2026-10-31T08:26:30',
        verificationMode: 'Fingerprint',
        punchState: 'CheckIn',
        isDuplicate: false,
    },
    {
        punchId: 'PUNCH-20261031-004',
        deviceId: 'DEV-ESSL-02',
        deviceUserId: '1004',
        punchDate: '31-10-2026',
        punchTime: '08:31 AM',
        timestamp: '2026-10-31T08:31:12',
        verificationMode: 'Fingerprint',
        punchState: 'CheckIn',
        isDuplicate: false,
    },
    // Late teacher punch (08:48 AM)
    {
        punchId: 'PUNCH-20261031-005',
        deviceId: 'DEV-ESSL-02',
        deviceUserId: '1005',
        punchDate: '31-10-2026',
        punchTime: '08:48 AM',
        timestamp: '2026-10-31T08:48:22',
        verificationMode: 'Face',
        punchState: 'CheckIn',
        isDuplicate: false,
    },
    // Stores Manager (09:12 AM)
    {
        punchId: 'PUNCH-20261031-008',
        deviceId: 'DEV-ESSL-03',
        deviceUserId: '1008',
        punchDate: '31-10-2026',
        punchTime: '09:12 AM',
        timestamp: '2026-10-31T09:12:05',
        verificationMode: 'Fingerprint',
        punchState: 'CheckIn',
        isDuplicate: false,
    },
    // Driver early morning punch (06:22 AM)
    {
        punchId: 'PUNCH-20261031-010',
        deviceId: 'DEV-ESSL-04',
        deviceUserId: '1010',
        punchDate: '31-10-2026',
        punchTime: '06:22 AM',
        timestamp: '2026-10-31T06:22:40',
        verificationMode: 'Fingerprint',
        punchState: 'CheckIn',
        isDuplicate: false,
    },
    // Security gate punch (05:50 AM)
    {
        punchId: 'PUNCH-20261031-011',
        deviceId: 'DEV-ESSL-01',
        deviceUserId: '1011',
        punchDate: '31-10-2026',
        punchTime: '05:50 AM',
        timestamp: '2026-10-31T05:50:18',
        verificationMode: 'Fingerprint',
        punchState: 'CheckIn',
        isDuplicate: false,
    },
    // UNMAPPED PUNCH: device user ID 9999 has no ERP employee mapping
    {
        punchId: 'PUNCH-20261031-999',
        deviceId: 'DEV-ESSL-01',
        deviceUserId: '9999',
        punchDate: '31-10-2026',
        punchTime: '08:15 AM',
        timestamp: '2026-10-31T08:15:33',
        verificationMode: 'RFID',
        punchState: 'CheckIn',
        isDuplicate: false,
        isUnmapped: true,
    },
]

// ==========================================
// 4. STORAGE ACCESSORS
// ==========================================

export const getEsslDevices = () => {
    try {
        const stored = localStorage.getItem(ESSL_STORAGE_KEYS.DEVICES)
        if (stored) return JSON.parse(stored)
    } catch {
        // Fallback
    }
    return DEFAULT_ESSL_DEVICES
}

export const saveEsslDevices = (devices) => {
    try {
        localStorage.setItem(ESSL_STORAGE_KEYS.DEVICES, JSON.stringify(devices))
    } catch {
        // Safe fail
    }
}

export const getBiometricMappings = () => {
    try {
        const stored = localStorage.getItem(ESSL_STORAGE_KEYS.USER_MAPPINGS)
        if (stored) return JSON.parse(stored)
    } catch {
        // Fallback
    }
    return DEFAULT_USER_MAPPINGS
}

export const saveBiometricMappings = (mappings) => {
    try {
        localStorage.setItem(ESSL_STORAGE_KEYS.USER_MAPPINGS, JSON.stringify(mappings))
    } catch {
        // Safe fail
    }
}

export const getRawBiometricPunches = () => {
    try {
        const stored = localStorage.getItem(ESSL_STORAGE_KEYS.RAW_PUNCHES)
        if (stored) return JSON.parse(stored)
    } catch {
        // Fallback
    }
    return DEFAULT_RAW_PUNCHES
}

export const saveRawBiometricPunches = (punches) => {
    try {
        localStorage.setItem(ESSL_STORAGE_KEYS.RAW_PUNCHES, JSON.stringify(punches))
    } catch {
        // Safe fail
    }
}

// ==========================================
// 5. PUNCH DEDUPLICATION & PROCESSING ENGINE
// ==========================================

/**
 * Filter duplicate punches occurring within windowMinutes from the same device user ID.
 * @param {Array} punches Raw punch records
 * @param {number} windowMinutes Threshold in minutes (default 2)
 * @returns {Array} Clean deduplicated punches
 */
export const filterDuplicatePunches = (punches, windowMinutes = 2) => {
    if (!Array.isArray(punches)) return []

    // Sort by timestamp ascending
    const sorted = [...punches].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    const result = []
    const lastPunchMap = new Map()

    for (const p of sorted) {
        if (p.isDuplicate) continue // skip pre-flagged duplicates

        const key = `${p.deviceUserId}-${p.punchDate}`
        const punchTime = new Date(p.timestamp).getTime()

        if (lastPunchMap.has(key)) {
            const prevTime = lastPunchMap.get(key)
            const diffMinutes = (punchTime - prevTime) / (1000 * 60)
            if (diffMinutes < windowMinutes) {
                // Ignore duplicate punch within debounce window
                continue
            }
        }

        lastPunchMap.set(key, punchTime)
        result.push(p)
    }

    return result
}

/**
 * First-In / Last-Out Calculation for an employee on a given date.
 * Returns { firstIn, lastOut, punchCount, punches }
 */
export const computeFirstInLastOut = (employeeId, date, rawPunches, mappings) => {
    const userMap = (mappings || getBiometricMappings()).find((m) => m.employeeId === employeeId)
    if (!userMap) return { firstIn: null, lastOut: null, punchCount: 0, punches: [] }

    const userPunches = (rawPunches || getRawBiometricPunches()).filter(
        (p) => String(p.deviceUserId) === String(userMap.deviceUserId) && p.punchDate === date && !p.isDuplicate
    )

    if (userPunches.length === 0) {
        return { firstIn: null, lastOut: null, punchCount: 0, punches: [] }
    }

    // Sort punches chronologically
    const sorted = [...userPunches].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    const firstIn = sorted[0]
    const lastOut = sorted.length > 1 ? sorted[sorted.length - 1] : null

    return {
        firstIn: firstIn ? firstIn.punchTime : null,
        lastOut: lastOut ? lastOut.punchTime : null,
        punchCount: sorted.length,
        punches: sorted,
        primaryMode: firstIn ? firstIn.verificationMode : userMap.primaryAuthMode,
        deviceId: firstIn ? firstIn.deviceId : 'DEV-ESSL-01',
    }
}

/**
 * Triggers a simulated live sync from all online eSSL devices.
 * Returns sync metrics and updates lastSyncTime on devices.
 */
export const syncEsslDevices = () => {
    const devices = getEsslDevices()
    const now = new Date()
    const timeFormatted = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const updatedDevices = devices.map((d) => {
        if (d.status === 'Online') {
            return {
                ...d,
                lastSyncTime: timeFormatted,
                totalPunchesRecorded: d.totalPunchesRecorded + Math.floor(Math.random() * 5) + 1,
            }
        }
        return d
    })

    saveEsslDevices(updatedDevices)

    const rawPunches = getRawBiometricPunches()
    const mappings = getBiometricMappings()
    const deduplicated = filterDuplicatePunches(rawPunches)
    const unmapped = rawPunches.filter((p) => p.isUnmapped || !mappings.some((m) => String(m.deviceUserId) === String(p.deviceUserId)))

    return {
        success: true,
        syncedAt: timeFormatted,
        activeDevicesCount: devices.filter((d) => d.status === 'Online').length,
        totalDevicesCount: devices.length,
        totalPunchesProcessed: deduplicated.length,
        duplicatesFiltered: rawPunches.length - deduplicated.length,
        unmappedPunchesCount: unmapped.length,
    }
}

/**
 * Resolves an unmapped device user ID to an ERP employee.
 */
export const resolveUnmappedDeviceUser = (deviceUserId, employeeId, employeeName, department) => {
    const mappings = getBiometricMappings()
    const existingIndex = mappings.findIndex((m) => String(m.deviceUserId) === String(deviceUserId))

    const newMapping = {
        mappingId: `MAP-${Date.now()}`,
        deviceUserId: String(deviceUserId),
        employeeId,
        employeeName,
        department: department || 'Academics & Teaching',
        primaryAuthMode: 'RFID',
        rfidCardNumber: `RFID-${deviceUserId}`,
        status: 'Active',
        enrolledDate: new Date().toLocaleDateString('en-GB'),
    }

    if (existingIndex >= 0) {
        mappings[existingIndex] = { ...mappings[existingIndex], ...newMapping }
    } else {
        mappings.push(newMapping)
    }
    saveBiometricMappings(mappings)

    // Also update raw punches that had isUnmapped = true for this user
    const rawPunches = getRawBiometricPunches().map((p) => {
        if (String(p.deviceUserId) === String(deviceUserId)) {
            return { ...p, isUnmapped: false }
        }
        return p
    })
    saveRawBiometricPunches(rawPunches)

    return newMapping
}

