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

const loadRequests = () => {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch {
        // ignore parse errors
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REQUESTS))
    return [...SEED_REQUESTS]
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
        studentId,
        studentName,
        classSection,
        admissionNumber,
        reason,
        transferTo,
        lastDateOfAttendance,
        requestedBy,
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
    }
    requests.unshift(newRequest)
    saveRequests(requests)
    return newRequest
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
