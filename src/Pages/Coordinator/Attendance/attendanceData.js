import { getClasses, getSections } from '../../../Common/RBAC/academicsCatalogData'
import { getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'
import { liveArray } from '../../../Common/RBAC/liveArray'

export const ATTENDANCE_STATUSES = ['Present', 'Absent']

export const statusBadgeColor = {
    Present: 'bg-[#4CAF5033] text-[#4CAF50]',
    Absent: 'bg-[#FF000033] text-[#FF0000]',
}

export const inOutStatusBadgeColor = {
    'On Time': 'bg-[#4CAF5033] text-[#4CAF50]',
    Late: 'bg-[#FF980033] text-[#FF9800]',
}

const DEMO_CLASSES = ['9', '10']
const DEMO_SECTIONS = ['A', 'B']
const apiCatalogMode = () => isApiAuthEnabled() && Boolean(getAccessToken())

export const getClassOptions = () => {
    const fromCatalog = getClasses()
    if (fromCatalog.length) return fromCatalog
    return apiCatalogMode() ? [] : DEMO_CLASSES
}

export const getSectionOptions = () => {
    const fromCatalog = getSections()
    if (fromCatalog.length) return fromCatalog
    return apiCatalogMode() ? [] : DEMO_SECTIONS
}

export const CLASSES = liveArray(getClassOptions)
export const SECTIONS = liveArray(getSectionOptions)

export const ATTENDANCE_LIST = [
    {
        id: 'ATT-1001',
        studentId: 'STU-2024-1042',
        studentName: 'Arjun Sharma',
        className: '10',
        section: 'A',
        time: '08:00 AM',
        attendanceStatus: 'Present',
        inOutStatus: 'On Time',
    },
    {
        id: 'ATT-1002',
        studentId: 'STU-2024-1087',
        studentName: 'Priya Nair',
        className: '10',
        section: 'A',
        time: '08:00 AM',
        attendanceStatus: 'Present',
        inOutStatus: 'On Time',
    },
    {
        id: 'ATT-1003',
        studentId: 'STU-2024-1156',
        studentName: 'Rahul Verma',
        className: '10',
        section: 'A',
        time: '08:00 AM',
        attendanceStatus: 'Absent',
        inOutStatus: '—',
    },
    {
        id: 'ATT-1004',
        studentId: 'STU-2024-1203',
        studentName: 'Sneha Reddy',
        className: '10',
        section: 'A',
        time: '08:00 AM',
        attendanceStatus: 'Present',
        inOutStatus: 'Late',
    },
    {
        id: 'ATT-1005',
        studentId: 'STU-2024-1318',
        studentName: 'Karthik Menon',
        className: '10',
        section: 'A',
        time: '08:00 AM',
        attendanceStatus: 'Present',
        inOutStatus: 'On Time',
    },
    {
        id: 'ATT-1006',
        studentId: 'STU-2024-1425',
        studentName: 'Divya Krishnan',
        className: '10',
        section: 'A',
        time: '08:00 AM',
        attendanceStatus: 'Absent',
        inOutStatus: '—',
    },
]
