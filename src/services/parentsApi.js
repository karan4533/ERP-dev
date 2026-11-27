import { apiRequest } from './apiClient'

/** @returns {Promise<Array<{id:string,name:string,className:string,section:string,classSection:string,rollNumber:string,admissionNumber:string}>>} */
export async function listMyChildrenApi() {
    const rows = await apiRequest('/parents/me/children')
    return (Array.isArray(rows) ? rows : []).map((row) => ({
        id: String(row.id),
        name: row.name || '',
        className: row.className || '',
        section: row.section || '—',
        classSection: row.classSection || row.className || '',
        rollNumber: row.rollNumber || '',
        admissionNumber: row.admissionNumber || '',
        // Portal pages hide timetable / attendance until placementStatus is 'placed'.
        placementStatus: row.placementStatus || '',
        classTeacherEmail: row.classTeacherEmail || '',
        sectionId: row.sectionId || null,
    }))
}
