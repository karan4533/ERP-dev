export const DUTIES_STORAGE_KEY = 'schoolerp_gatekeeper_duties_v1'

export const DEFAULT_GATEKEEPER_DUTIES = [
    {
        id: 'DUT001',
        dutyId: 'DUT001',
        gateKeeperName: 'Suresh Kumar',
        employeeId: 'GK001',
        gateLocation: 'Main Gate',
        shift: 'Morning Shift',
        dutyDate: '05-08-2025',
        startTime: '07:00 AM',
        endTime: '01:00 PM',
        assignedBy: 'Gate Manager',
        status: 'In Progress',
    },
    {
        id: 'DUT002',
        dutyId: 'DUT002',
        gateKeeperName: 'Ram Singh',
        employeeId: 'EMP-GK-001',
        gateLocation: 'North Entry Gate',
        shift: 'Afternoon Shift',
        dutyDate: '05-08-2025',
        startTime: '01:00 PM',
        endTime: '07:00 PM',
        assignedBy: 'Gate Keeper Manager',
        status: 'Pending',
    },
    {
        id: 'DUT003',
        dutyId: 'DUT003',
        gateKeeperName: 'Balwinder Singh',
        employeeId: 'EMP-GKM-001',
        gateLocation: 'Perimeter Security Hub',
        shift: 'Night Shift',
        dutyDate: '04-08-2025',
        startTime: '07:00 PM',
        endTime: '07:00 AM',
        assignedBy: 'Security Head',
        status: 'Completed',
    },
    {
        id: 'DUT004',
        dutyId: 'DUT004',
        gateKeeperName: 'Dharmendra Yadav',
        employeeId: 'GK004',
        gateLocation: 'Bus Dispersal Gate',
        shift: 'Morning Shift',
        dutyDate: '05-08-2025',
        startTime: '06:30 AM',
        endTime: '12:30 PM',
        assignedBy: 'Gate Keeper Manager',
        status: 'In Progress',
    },
]

export const loadDuties = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem(DUTIES_STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored)
                if (Array.isArray(parsed)) return parsed
            }
        }
    } catch {
        /* fallback */
    }
    return DEFAULT_GATEKEEPER_DUTIES
}
