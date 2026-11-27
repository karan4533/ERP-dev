import { getClasses, getSections } from '../../../Common/RBAC/academicsCatalogData'
import { getAccessToken, isApiAuthEnabled } from '../../../services/apiClient'
import { liveArray } from '../../../Common/RBAC/liveArray'

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

export const ATTENDANCE_HISTORY = [
    {
        id: 'AH-1001',
        studentId: 'STU-2024-1042',
        studentName: 'Arjun Sharma',
        workingDays: 22,
        present: 20,
        absent: 1,
        late: 1,
        percentage: '91%',
    },
    {
        id: 'AH-1002',
        studentId: 'STU-2024-1087',
        studentName: 'Priya Nair',
        workingDays: 22,
        present: 22,
        absent: 0,
        late: 0,
        percentage: '100%',
    },
    {
        id: 'AH-1003',
        studentId: 'STU-2024-1156',
        studentName: 'Rahul Verma',
        workingDays: 22,
        present: 18,
        absent: 3,
        late: 1,
        percentage: '82%',
    },
    {
        id: 'AH-1004',
        studentId: 'STU-2024-1203',
        studentName: 'Sneha Reddy',
        workingDays: 22,
        present: 19,
        absent: 1,
        late: 2,
        percentage: '86%',
    },
    {
        id: 'AH-1005',
        studentId: 'STU-2024-1318',
        studentName: 'Karthik Menon',
        workingDays: 22,
        present: 21,
        absent: 0,
        late: 1,
        percentage: '95%',
    },
    {
        id: 'AH-1006',
        studentId: 'STU-2024-1425',
        studentName: 'Divya Krishnan',
        workingDays: 22,
        present: 17,
        absent: 4,
        late: 1,
        percentage: '77%',
    },
]
