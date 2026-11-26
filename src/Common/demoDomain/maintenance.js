import { ensureSeed, nextSerial, saveJson } from './storage'

export const MAINTENANCE_DUTY_KEY = 'schoolerp-maintenance-duty-v1'
export const MAINTENANCE_SCHEDULE_KEY = 'schoolerp-maintenance-schedules-v1'
export const EQUIPMENT_INSPECTION_KEY = 'schoolerp-maintenance-inspections-v1'

export const MAINTENANCE_DUTY_SEED = [
    {
        id: 'DUTY-MNT-2026-0001',
        staff: 'K. Murugan',
        trade: 'Campus Electrician',
        area: 'Main HT Substation & Generator Yard',
        dutyType: 'Electrical Inspection',
        assignedBy: 'Gopalakrishnan R (Maintenance Manager)',
        date: '2026-10-22',
        startTime: '08:00',
        endTime: '12:00',
        priority: 'High',
        instructions: 'Check DG battery voltage, fuel level (maintain min 300L), log transformer oil temperature.',
        remarks: 'All parameters normal. DG tested on idle run.',
        status: 'Completed',
    },
    {
        id: 'DUTY-MNT-2026-0002',
        staff: 'S. Ramanathan',
        trade: 'Plumber & Pump Operator',
        area: 'Hydro-pneumatic Pump Room & Overhead Tanks',
        dutyType: 'Plumbing & Pump Check',
        assignedBy: 'Gopalakrishnan R (Maintenance Manager)',
        date: '2026-10-22',
        startTime: '07:30',
        endTime: '11:30',
        priority: 'High',
        instructions: 'Inspect line pressure (4.2 bar required), check float valves on OHT Block A & B, test booster pump sequencing.',
        remarks: 'Booster pump 2 pressure sensor cleaned.',
        status: 'Completed',
    },
    {
        id: 'DUTY-MNT-2026-0003',
        staff: 'P. Veluchamy',
        trade: 'HVAC Technician',
        area: 'Server Room & Primary Computer Labs',
        dutyType: 'AC Servicing',
        assignedBy: 'Gopalakrishnan R (Maintenance Manager)',
        date: '2026-10-22',
        startTime: '13:00',
        endTime: '17:00',
        priority: 'Medium',
        instructions: 'Check temperature stability (21°C target), clean pre-filters, log suction & discharge pressures on Precision AC-1.',
        remarks: 'Filter washed and reinstalled.',
        status: 'Assigned',
    },
    {
        id: 'DUTY-MNT-2026-0004',
        staff: 'M. Selvam',
        trade: 'Civil & Carpenter',
        area: 'Senior Secondary Block — 3rd Floor',
        dutyType: 'Civil Repair',
        assignedBy: 'Gopalakrishnan R (Maintenance Manager)',
        date: '2026-10-22',
        startTime: '09:00',
        endTime: '13:00',
        priority: 'Normal',
        instructions: 'Inspect door closers, window latches, and repair acoustic panel fixture in Exam Hall.',
        remarks: 'Hardware replaced on Hall 3 entrance.',
        status: 'Assigned',
    },
]

export const MAINTENANCE_SCHEDULE_SEED = [
    {
        id: 'MNT-SCH-0001',
        name: 'Diesel Generator Daily Log & Fuel Level Verification',
        category: 'DG GenSet & Power Backup',
        frequency: 'DAILY',
        area: 'Substation Yard',
        staff: 'K. Murugan',
        status: 'Active',
    },
    {
        id: 'MNT-SCH-0002',
        name: 'Hydro-pneumatic Water Pump & Pressure Booster Inspection',
        category: 'Plumbing & Water Supply',
        frequency: 'DAILY',
        area: 'Utility Pump Room',
        staff: 'S. Ramanathan',
        status: 'Active',
    },
    {
        id: 'MNT-SCH-0003',
        name: 'Rooftop Solar PV Panels Dusting & Inverter Output Audit',
        category: 'Renewable Energy',
        frequency: 'WEEKLY',
        area: 'Academic Block A Terrace',
        staff: 'K. Murugan',
        status: 'Active',
        weekday: 1,
    },
    {
        id: 'MNT-SCH-0004',
        name: 'Passenger Elevators & Lift Emergency Intercom Check',
        category: 'Lifts & Conveyance',
        frequency: 'WEEKLY',
        area: 'Blocks A, B & Admin Block',
        staff: 'Johnson Lifts AMC Engineer',
        status: 'Active',
        weekday: 3,
    },
    {
        id: 'MNT-SCH-0005',
        name: 'Fire Hydrant Ring Main Pressure & Diesel Pump Auto-Start Drill',
        category: 'Fire Safety & Life Support',
        frequency: 'MONTHLY',
        area: 'Campus Perimeter & Hose Reels',
        staff: 'Gopalakrishnan R / Fire AMC',
        status: 'Active',
        dayOfMonth: 1,
    },
    {
        id: 'MNT-SCH-0006',
        name: '11kV Substation Transformer Oil Breakdown Voltage (BDV) Test',
        category: 'Electrical HT',
        frequency: 'QUARTERLY',
        area: 'HT Transformer Yard',
        staff: 'TANGEDCO Certified Testing Lab',
        status: 'Active',
        dayOfMonth: 15,
    },
    {
        id: 'MNT-SCH-0007',
        name: 'Campus Water Distribution Tanks Cleaning & Disinfection',
        category: 'Water Storage & Potability',
        frequency: 'QUARTERLY',
        area: 'Underground Sump & Overhead Tanks',
        staff: 'S. Ramanathan',
        status: 'Active',
        dayOfMonth: 20,
    },
]

export const EQUIPMENT_INSPECTION_SEED = [
    {
        id: 'INSP-2026-001',
        assetCode: 'DG-250KVA-01',
        assetName: 'Cummins 250 kVA Silent DG Set',
        category: 'Power Backup',
        location: 'Substation Yard',
        inspectionDate: '2026-10-18',
        nextDueDate: '2026-11-18',
        inspector: 'K. Murugan',
        findings: 'Battery terminal greased, coolant level adequate (88%), oil pressure 4.5 bar, fuel tank 340 L.',
        condition: 'Excellent',
        safetyStatus: 'Certified Safe',
        remarks: 'AMC engineer visit completed on 2026-10-12.',
    },
    {
        id: 'INSP-2026-002',
        assetCode: 'TRF-500KVA-01',
        assetName: 'Voltamp 500 kVA 11kV/415V Step-Down Transformer',
        category: 'HT Substation',
        location: 'Transformer Enclosure',
        inspectionDate: '2026-10-15',
        nextDueDate: '2027-01-15',
        inspector: 'Gopalakrishnan R',
        findings: 'Silica gel breather color blue (active), oil level within normal range, no oil seepage detected.',
        condition: 'Good',
        safetyStatus: 'Certified Safe',
        remarks: 'Quarterly earth pit resistance testing scheduled for Nov 2026.',
    },
    {
        id: 'INSP-2026-003',
        assetCode: 'LIFT-BLK-A',
        assetName: 'Schindler 8-Passenger Automatic Elevator',
        category: 'Vertical Transportation',
        location: 'Academic Block A',
        inspectionDate: '2026-10-19',
        nextDueDate: '2026-11-19',
        inspector: 'Johnson Lifts AMC Specialist',
        findings: 'Emergency alarm, door sensor safety curtain, and ARD (Auto Rescue Device) tested under simulated power failure.',
        condition: 'Good',
        safetyStatus: 'Certified Safe',
        remarks: 'Valid annual fitness certificate posted inside elevator car.',
    },
    {
        id: 'INSP-2026-004',
        assetCode: 'FIRE-PUMP-01',
        assetName: 'Kirloskar Main Diesel Fire Hydrant Booster Pump',
        category: 'Fire Safety',
        location: 'Utility Pump Room',
        inspectionDate: '2026-10-14',
        nextDueDate: '2026-11-14',
        inspector: 'S. Ramanathan',
        findings: 'Auto-cut-in tested at 6 bar pressure drop. Battery charger functioning properly.',
        condition: 'Good',
        safetyStatus: 'Certified Safe',
        remarks: 'Smoke detector integrated drill coordinated with Campus Security.',
    },
    {
        id: 'INSP-2026-005',
        assetCode: 'HVAC-PREC-01',
        assetName: 'Blue Star Precision Air Conditioner (PAC) 5.5 TR',
        category: 'Data Center HVAC',
        location: 'Central Server Room',
        inspectionDate: '2026-10-20',
        nextDueDate: '2026-11-20',
        inspector: 'P. Veluchamy',
        findings: 'Temperature held at 20.8°C, RH at 52%. Condensate drain line flushed.',
        condition: 'Excellent',
        safetyStatus: 'Certified Safe',
        remarks: 'Backup unit PAC-02 verified on standby mode.',
    },
]

export function getMaintenanceDuties() {
    return ensureSeed(MAINTENANCE_DUTY_KEY, MAINTENANCE_DUTY_SEED)
}

export function saveMaintenanceDuty(record) {
    const list = getMaintenanceDuties()
    const id = record.id || nextSerial('DUTY-MNT-2026-', list)
    const row = { ...record, id }
    const index = list.findIndex((x) => x.id === id)
    if (index >= 0) {
        list[index] = row
    } else {
        list.push(row)
    }
    saveJson(MAINTENANCE_DUTY_KEY, list)
    return row
}

export function getMaintenanceSchedules() {
    return ensureSeed(MAINTENANCE_SCHEDULE_KEY, MAINTENANCE_SCHEDULE_SEED)
}

export function getEquipmentInspections() {
    return ensureSeed(EQUIPMENT_INSPECTION_KEY, EQUIPMENT_INSPECTION_SEED)
}

