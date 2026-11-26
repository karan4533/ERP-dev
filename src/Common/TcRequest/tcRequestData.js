const STORAGE_KEY = 'schoolerp-tc-requests'

export const TC_STATUSES = [
    'Pending PRM Review',
    'Pending Super Admin Approval',
    'Approved',
    'Rejected',
]

export const statusBadgeColor = {
    'Pending PRM Review': 'bg-[#FF980033] text-[#FF9800]',
    'Pending Super Admin Approval': 'bg-[#2196F333] text-[#2196F3]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

const SEED_REQUESTS = [
    {
        id: 'TC-REQ-001',
        requestId: 'TC-REQ-001',
        studentId: 'STU-2024-1042',
        studentName: 'Arjun Sharma',
        classSection: '10-A',
        admissionNumber: 'ADM-2024-1042',
        reason: 'Family relocation to Mumbai.',
        transferTo: 'Delhi Public School, Mumbai',
        lastDateOfAttendance: '15-06-2026',
        requestedBy: 'Parent',
        requestedOn: '10-06-2026',
        status: 'Approved',
        prmRemarks: 'All dues cleared. Documents verified.',
        superAdminRemarks: 'Approved. Transfer Certificate issued.',
        forwardedOn: '12-06-2026',
        approvedOn: '14-06-2026',
        rejectedOn: '',
        tcNumber: 'TC/2026/1042',
        tcIssuedDate: '14-06-2026',
        tcDocumentName: 'Transfer-Certificate-STU-2024-1042.pdf',
    },
    {
        id: 'TC-REQ-002',
        requestId: 'TC-REQ-002',
        studentId: 'STU-PAR-001',
        studentName: 'Abhinav Raj',
        classSection: '10-A',
        admissionNumber: 'ADM-PAR-001',
        reason: 'Admission to another CBSE school in Bangalore.',
        transferTo: 'National Public School, Bangalore',
        lastDateOfAttendance: '20-06-2026',
        requestedBy: 'Parent',
        requestedOn: '18-06-2026',
        status: 'Pending Super Admin Approval',
        prmRemarks: 'Fee clearance verified. Forwarded for Super Admin approval.',
        superAdminRemarks: '',
        forwardedOn: '20-06-2026',
        approvedOn: '',
        rejectedOn: '',
        tcNumber: '',
        tcIssuedDate: '',
        tcDocumentName: '',
    },
]

export const DEFAULT_NOC_CLEARANCES = [
    {
        departmentKey: 'finance',
        department: 'Finance & Accounts',
        manager: 'Ramesh K. (Account Head)',
        status: 'Cleared',
        remarks: 'All term fees, exam fees, and annual dues cleared. 0 balance outstanding.',
        date: '11-06-2026',
    },
    {
        departmentKey: 'library',
        department: 'Library Information Center',
        manager: 'Saraswati N. (Librarian)',
        status: 'Cleared',
        remarks: 'All borrowed books returned in good condition. 0 library dues.',
        date: '11-06-2026',
    },
    {
        departmentKey: 'transport',
        department: 'Transport Logistics',
        manager: 'Balwant Singh (Transport Manager)',
        status: 'Cleared',
        remarks: 'Bus pass returned. Route 12 fleet fees settled.',
        date: '12-06-2026',
    },
    {
        departmentKey: 'stores',
        department: 'Stores & Inventory',
        manager: 'Prakash Rao (Stationery Store Manager)',
        status: 'Cleared',
        remarks: 'Science lab kit and sports uniforms accounted for.',
        date: '12-06-2026',
    },
    {
        departmentKey: 'academics',
        department: 'Academics & Examination',
        manager: 'Sunita Sharma (Academic Coordinator)',
        status: 'Cleared',
        remarks: 'Cumulative grade sheet signed. Attendance eligibility certified.',
        date: '12-06-2026',
    },
]

const loadRequests = () => {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map((item) => ({
                    ...item,
                    nocClearances: item.nocClearances || DEFAULT_NOC_CLEARANCES,
                }))
            }
        }
    } catch {
        // ignore parse errors
    }
    const seeded = SEED_REQUESTS.map((item) => ({
        ...item,
        nocClearances: DEFAULT_NOC_CLEARANCES,
    }))
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
    return seeded
}

const saveRequests = (requests) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

export const getAllTcRequests = () => loadRequests()

export const getTcRequestsByStudentId = (studentId) =>
    loadRequests().filter((request) => request.studentId === studentId)

export const getTcRequestById = (id) =>
    loadRequests().find((request) => request.id === id) ?? null

export const getPendingPrmCount = () =>
    loadRequests().filter((request) => request.status === 'Pending PRM Review').length

export const getPendingSuperAdminCount = () =>
    loadRequests().filter((request) => request.status === 'Pending Super Admin Approval').length

const formatToday = () => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    return `${day}-${month}-${year}`
}

const generateRequestId = (requests) => {
    const nextNumber = requests.length + 1
    return `TC-REQ-${String(nextNumber).padStart(3, '0')}`
}

export const createTcRequest = ({
    studentId,
    studentName,
    classSection,
    admissionNumber,
    reason,
    transferTo,
    lastDateOfAttendance,
    requestedBy,
}) => {
    const requests = loadRequests()
    const requestId = generateRequestId(requests)
    const newRequest = {
        id: requestId,
        requestId,
        studentId: studentId || `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        studentName,
        classSection,
        admissionNumber: admissionNumber || `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        reason,
        transferTo,
        lastDateOfAttendance,
        requestedBy: requestedBy || 'Parent',
        requestedOn: formatToday(),
        status: 'Pending PRM Review',
        prmRemarks: '',
        superAdminRemarks: '',
        forwardedOn: '',
        approvedOn: '',
        rejectedOn: '',
        tcNumber: '',
        tcIssuedDate: '',
        tcDocumentName: '',
        nocClearances: DEFAULT_NOC_CLEARANCES.map((c) => ({
            ...c,
            status: 'Pending',
            remarks: 'Awaiting department verification',
            date: formatToday(),
        })),
    }
    requests.unshift(newRequest)
    saveRequests(requests)
    return newRequest
}

export const updateNocClearance = (id, departmentKey, newStatus, remarks = '') => {
    const requests = loadRequests()
    const index = requests.findIndex((request) => request.id === id)
    if (index === -1) return null

    const req = requests[index]
    const clearances = (req.nocClearances || DEFAULT_NOC_CLEARANCES).map((c) => {
        if (c.departmentKey === departmentKey) {
            return {
                ...c,
                status: newStatus,
                remarks: remarks || (newStatus === 'Cleared' ? 'Verified and clearance approved.' : 'Dues or pending documents to be settled.'),
                date: formatToday(),
            }
        }
        return c
    })

    const allCleared = clearances.every((c) => c.status === 'Cleared')
    requests[index] = {
        ...req,
        nocClearances: clearances,
        allClearancesApproved: allCleared,
    }
    saveRequests(requests)
    return requests[index]
}

export const forwardTcRequestToSuperAdmin = (id, prmRemarks = '') => {
    const requests = loadRequests()
    const index = requests.findIndex((request) => request.id === id)
    if (index === -1) return null

    requests[index] = {
        ...requests[index],
        status: 'Pending Super Admin Approval',
        prmRemarks: prmRemarks || requests[index].prmRemarks,
        forwardedOn: formatToday(),
    }
    saveRequests(requests)
    return requests[index]
}

export const approveTcRequest = (id, superAdminRemarks = '') => {
    const requests = loadRequests()
    const index = requests.findIndex((request) => request.id === id)
    if (index === -1) return null

    const request = requests[index]
    const issuedDate = formatToday()
    const tcNumber = `TC/2026/${request.studentId.replace(/\D/g, '').slice(-4) || '0001'}`

    requests[index] = {
        ...request,
        status: 'Approved',
        superAdminRemarks: superAdminRemarks || request.superAdminRemarks,
        approvedOn: issuedDate,
        tcNumber,
        tcIssuedDate: issuedDate,
        tcDocumentName: `Transfer-Certificate-${request.studentId}.pdf`,
    }
    saveRequests(requests)
    return requests[index]
}

export const rejectTcRequest = (id, remarks = '', stage = 'prm') => {
    const requests = loadRequests()
    const index = requests.findIndex((request) => request.id === id)
    if (index === -1) return null

    const updates = {
        status: 'Rejected',
        rejectedOn: formatToday(),
    }

    if (stage === 'admin') {
        updates.superAdminRemarks = remarks
    } else {
        updates.prmRemarks = remarks
    }

    requests[index] = { ...requests[index], ...updates }
    saveRequests(requests)
    return requests[index]
}
