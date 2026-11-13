import { CLASSES, SECTIONS, SUBJECTS } from '../../AssignedClass/assignedClassData'

const STORAGE_KEY = 'teacher-student-deliverables-study-materials'

export const DEFAULT_ROUTE_BASE = '/teacher/student-deliverables/study-materials'
export const ACADEMICS_ROUTE_BASE = '/teacher/academics/study-materials'

const DEFAULT_STUDY_MATERIALS = []

export const getStudyMaterials = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return DEFAULT_STUDY_MATERIALS
}

export const saveStudyMaterials = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getStudyMaterialById = (id) =>
    getStudyMaterials().find((item) => item.id === id) ?? null

export const generateMaterialId = () => {
    const list = getStudyMaterials()
    const max = list.reduce((acc, item) => {
        const num = Number(item.materialId.split('-').pop())
        return Number.isFinite(num) ? Math.max(acc, num) : acc
    }, 1000)
    return `SM-${max + 1}`
}

export const addStudyMaterial = (values) => {
    const materialId = generateMaterialId()
    const record = {
        id: materialId,
        materialId,
        title: values.title,
        description: values.description,
        subject: values.subject,
        className: values.className,
        section: values.section,
        fileName: values.fileName || '—',
        fileType: values.fileType || 'pdf',
    }
    saveStudyMaterials([record, ...getStudyMaterials()])
    return record
}

export const filterStudyMaterials = (items, filters) =>
    items.filter((item) => {
        const search = filters.search.trim().toLowerCase()
        const matchesSearch =
            !search ||
            item.materialId.toLowerCase().includes(search) ||
            item.title.toLowerCase().includes(search) ||
            item.description.toLowerCase().includes(search)

        const matchesSubject = !filters.subject || item.subject === filters.subject
        const matchesClass = !filters.className || item.className === filters.className
        const matchesSection = !filters.section || item.section === filters.section

        return matchesSearch && matchesSubject && matchesClass && matchesSection
    })

export { CLASSES, SECTIONS, SUBJECTS }
