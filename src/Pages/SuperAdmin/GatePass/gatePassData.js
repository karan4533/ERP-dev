import noProfile from '../../../assets/images/no-profile.png'
import { getHostelGatePasses } from '../../FrontOffice/HostelGatePass/hostelGatePassData'
import { getMaterialGatePasses } from '../../FrontOffice/MaterialGatePass/materialGatePassData'

export const ROUTE_BASE = '/super-admin/gate-pass'

export const PASS_CATEGORIES = ['Student', 'Hostel', 'Material']

export const statusBadgeColor = {
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
    'Partially Approved': 'bg-[#2196F333] text-[#2196F3]',
    'Checked Out': 'bg-[#2196F333] text-[#2196F3]',
    Returned: 'bg-[#4CAF5033] text-[#4CAF50]',
    Cancelled: 'bg-[#FF000033] text-[#FF0000]',
}

export const passCategoryBadgeColor = {
    Student: 'bg-[#515DEF33] text-[#515DEF]',
    Hostel: 'bg-[#9C27B033] text-[#9C27B0]',
    Material: 'bg-[#FF980033] text-[#FF9800]',
}

const STUDENT_GATE_PASSES = [
    {
        id: 'student-SGP-001',
        passCategory: 'Student',
        passId: 'SGP-001',
        profile: noProfile,
        studentId: 'STD-NO1845',
        studentName: 'Sandy Selva',
        classSection: '10 A',
        gender: 'Male',
        mobileNumber: '9944076993',
        city: 'Pudukkottai',
        reason: 'Going to Hospital',
        date: '20-05-2026',
        outTime: '10:00 AM',
        status: 'Approved',
        createdBy: 'Front Office',
        createdAt: '20-05-2026 09:00 AM',
    },
    {
        id: 'student-SGP-002',
        passCategory: 'Student',
        passId: 'SGP-002',
        profile: noProfile,
        studentId: 'STD-NO1846',
        studentName: 'John Milton',
        classSection: '12 B',
        gender: 'Male',
        mobileNumber: '9944076993',
        city: 'Madurai',
        reason: 'Going to Home Town',
        date: '24-05-2026',
        outTime: '12:00 PM',
        status: 'Pending',
        createdBy: 'Front Office',
        createdAt: '24-05-2026 08:30 AM',
    },
]

const toListItem = (record) => ({
    id: record.id,
    passCategory: record.passCategory,
    passId: record.passId ?? record.gatePassId ?? record.mgpNo,
    subjectName: record.studentName ?? record.driverName ?? '—',
    subjectDetail: record.classSection ?? record.vehicleNo ?? record.hostel ?? '—',
    date: record.date ?? record.outDate,
    status: record.status,
    createdBy: record.createdBy ?? 'Front Office',
    createdAt: record.createdAt ?? record.date ?? record.outDate,
    details: record,
})

export const getAllGatePasses = () => {
    const studentItems = STUDENT_GATE_PASSES.map(toListItem)
    const hostelItems = getHostelGatePasses().map((record) =>
        toListItem({
            ...record,
            id: `hostel-${record.id}`,
            passCategory: 'Hostel',
            passId: record.gatePassId,
        }),
    )
    const materialItems = getMaterialGatePasses().map((record) =>
        toListItem({
            ...record,
            id: `material-${record.id}`,
            passCategory: 'Material',
            passId: record.mgpNo,
        }),
    )

    return [...studentItems, ...hostelItems, ...materialItems].sort((a, b) => {
        const dateA = a.createdAt ?? a.date ?? ''
        const dateB = b.createdAt ?? b.date ?? ''
        return dateB.localeCompare(dateA)
    })
}

export const getGatePassById = (id) =>
    getAllGatePasses().find((record) => record.id === id) ?? null

export const filterGatePasses = (
    records,
    { search = '', status = '', passCategory = '' } = {},
) => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
        if (passCategory && record.passCategory !== passCategory) return false
        if (status && record.status !== status) return false
        if (!query) return true

        const haystack = [
            record.passCategory,
            record.passId,
            record.subjectName,
            record.subjectDetail,
            record.status,
            record.createdBy,
        ]
            .join(' ')
            .toLowerCase()

        return haystack.includes(query)
    })
}

export const getGatePassStatusOptions = (records) =>
    [...new Set(records.map((record) => record.status).filter(Boolean))].sort()
