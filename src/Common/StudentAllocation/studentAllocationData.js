import noProfile from '../../assets/images/no-profile.png'
import { getAdmissionById } from '../../Pages/Admin/FrontOffice/AdminssionList/admissionListData'
import { getClasses, getSections } from '../RBAC/academicsCatalogData'
import {
    getAllEnrolledStudents,
    updateEnrolledStudentRecord,
} from '../StudentDatabase/enrolledStudentsData'

const STORAGE_KEY = 'school-erp-student-allocation'
const LEGACY_STORAGE_KEY = 'director-student-allocation'

export const ALLOCATION_STATUSES = ['Pending Allocation', 'Pending Approval', 'Allocated', 'Rejected']
export const SECTION_OPTIONS = ['A', 'B', 'C']

export const TEACHER_NAME = 'Sandy Selva'
export const TEACHER_ROLE = 'Teacher'
export const COORDINATOR_NAME = 'Priya Nair'
export const COORDINATOR_ROLE = 'Coordinator'

export const allocationStatusColor = {
    'Pending Allocation': 'bg-[#FF980033] text-[#FF9800]',
    'Pending Approval': 'bg-[#515DEF33] text-[#515DEF]',
    Allocated: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

export const PRINCIPAL_APPROVAL_LIST_PATH = '/principal/student-allocation-approval'
export const DIRECTOR_APPROVAL_LIST_PATH = '/director/student-allocation-approval'

const readJson = (key) => {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        return JSON.parse(raw)
    } catch {
        return null
    }
}

const displayValue = (value) => {
    const text = String(value ?? '').trim()
    return text || '—'
}

export const getSectionOptions = () => {
    const catalogSections = getSections()
    return catalogSections.length > 0 ? catalogSections : SECTION_OPTIONS
}

export const getClassOptions = () => {
    const classes = getClasses()
    return classes.length > 0 ? classes : ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
}

export const completeStudentAllocation = (id, className, section) => {
    const records = getStudentAllocations()
    const target = records.find((item) => item.id === id)
    if (!target || !className || !section) return records

    const approvedRoll = target.rollNo || target.admission?.admissionRollNumber || target.studentId
    updateEnrolledStudentRecord(target.studentId, {
        section,
        rollNumber: approvedRoll,
        className,
    })

    const updated = records.map((item) => {
        if (item.id !== id) return item
        return {
            ...item,
            rollNo: approvedRoll,
            className,
            classSection: section,
            proposedSection: section,
            allocationStatus: 'Allocated',
            submittedBy: 'Principal',
            submittedByRole: 'Principal',
            submittedAt: new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).toUpperCase(),
            admission: {
                ...item.admission,
                className,
                classSection: section,
            },
        }
    })
    saveStudentAllocations(updated)
    return updated
}

const resolveAdmissionSource = (enrolled) => {
    if (enrolled.admissionId) {
        const live = getAdmissionById(enrolled.admissionId)
        if (live) return live
    }
    return enrolled.admissionSnapshot || enrolled
}

const buildStudentName = (enrolled, admission) =>
    enrolled.name
    || [admission.firstName, admission.middleName, admission.lastName]
        .map((part) => String(part || '').trim())
        .filter(Boolean)
        .join(' ')
    || 'Student'

const buildAllocationRecord = (enrolled, existing = null) => {
    const admission = resolveAdmissionSource(enrolled)
    const studentName = buildStudentName(enrolled, admission)
    const admissionNumber = admission.admissionNumber || enrolled.admissionNumber || ''
    const sourceClassName = admission.className || enrolled.className || ''

    const allocationStatus = existing?.allocationStatus || 'Pending Allocation'
    const proposedSection = existing?.proposedSection || ''
    const approvedSection =
        allocationStatus === 'Allocated'
            ? existing?.classSection || enrolled.section || proposedSection
            : ''

    return {
        id: enrolled.id,
        studentId: enrolled.id,
        studentName,
        rollNo:
            enrolled.rollNumber
            || admission.rollNumber
            || existing?.rollNo
            || '',
        className: sourceClassName,
        classSection: approvedSection,
        proposedSection,
        admissionNumber,
        gender: admission.gender || enrolled.gender || '',
        mobileNumber: admission.mobileNumber || enrolled.mobileNumber || '',
        profileImage: admission.profileImage || enrolled.profileImage || noProfile,
        createdDate:
            existing?.createdDate
            || new Date(enrolled.enrolledAt || Date.now()).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).toUpperCase(),
        country: admission.country || enrolled.country || '',
        state: admission.state || enrolled.state || '',
        city: admission.city || enrolled.city || '',
        allocationStatus,
        submittedBy: existing?.submittedBy || '',
        submittedByRole: existing?.submittedByRole || '',
        submittedAt: existing?.submittedAt || '',
        sourceClassName,
        admission: {
            admissionRollNumber: admission.rollNumber || enrolled.rollNumber || enrolled.id,
            admissionDate: admission.admissionDate || '',
            className: sourceClassName,
            classSection: approvedSection,
            registrationFees: admission.registrationFees || '',
            batchStartYear: admission.batchStartYear || '',
            batchEndYear: admission.batchEndYear || '',
        },
        student: {
            firstName: admission.firstName || enrolled.firstName || '',
            middleName: admission.middleName || enrolled.middleName || '',
            lastName: admission.lastName || enrolled.lastName || '',
            gender: admission.gender || enrolled.gender || '',
            religion: admission.religion || '',
            caste: admission.caste || '',
            address: admission.address || '',
            dateOfBirth: admission.dateOfBirth || enrolled.dateOfBirth || '',
            country: admission.country || enrolled.country || '',
            state: admission.state || enrolled.state || '',
            city: admission.city || enrolled.city || '',
            zipCode: admission.zipCode || '',
            mobileNumber: admission.mobileNumber || enrolled.mobileNumber || '',
            alternativeMobileNumber: admission.altMobileNumber || '',
            email: admission.email || enrolled.email || '',
            previousSchool: admission.previousSchool || '',
            bloodGroup: admission.bloodGroup || '',
            height: admission.height || '',
            weight: admission.weight || '',
            medicalHistory: admission.medicalHistory || '',
        },
        transport: {
            routeList: admission.route || '',
            busStop: admission.busStop || '',
        },
        parents: {
            fatherName: admission.fatherName || '',
            motherName: admission.motherName || '',
            fatherOccupation: admission.fatherOccupation || '',
            motherOccupation: admission.motherOccupation || '',
            fatherYearlyIncome: admission.fatherIncome || '',
            motherYearlyIncome: admission.motherIncome || '',
            siblings: admission.siblings || '',
            address: admission.parentAddress || '',
            country: admission.parentCountry || '',
            state: admission.parentState || '',
            city: admission.parentCity || '',
            zipCode: admission.parentZipCode || '',
            mobileNumber: admission.parentMobileNumber || '',
            email: admission.parentEmail || '',
        },
        feesTimeline: admission.feesGroup || '',
    }
}

export const syncStudentAllocationsFromEnrolled = () => {
    const enrolled = getAllEnrolledStudents()
    const existingRecords = readJson(STORAGE_KEY) ?? readJson(LEGACY_STORAGE_KEY) ?? []
    const existingByStudentId = new Map(
        existingRecords.map((record) => [record.studentId || record.id, record]),
    )

    const merged = enrolled.map((student) =>
        buildAllocationRecord(student, existingByStudentId.get(student.id)),
    )

    saveStudentAllocations(merged)
    return merged
}

export const ensureStudentAllocationRecord = (enrolledStudent) => {
    if (!enrolledStudent?.id) return null

    const records = readJson(STORAGE_KEY) ?? readJson(LEGACY_STORAGE_KEY) ?? []
    const exists = records.some(
        (record) => (record.studentId || record.id) === enrolledStudent.id,
    )
    if (exists) return syncStudentAllocationsFromEnrolled()

    const next = [
        buildAllocationRecord(enrolledStudent),
        ...records.filter((record) => (record.studentId || record.id) !== enrolledStudent.id),
    ]
    saveStudentAllocations(next)
    return next
}

export const getStudentAllocations = () => syncStudentAllocationsFromEnrolled()

export const saveStudentAllocations = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getStudentAllocationById = (id) =>
    getStudentAllocations().find((item) => item.id === id) ?? null

export const getAllocationDisplayRollNo = (record) =>
    displayValue(record.rollNo || record.admission?.admissionRollNumber || record.studentId)

export const getAllocationDisplayClass = (record) =>
    displayValue(record.className || record.sourceClassName || record.admission?.className)

export const getAllocationDisplaySection = (record) => {
    if (record.allocationStatus === 'Allocated') {
        return displayValue(record.classSection)
    }
    if (record.allocationStatus === 'Pending Approval') {
        return displayValue(record.proposedSection || record.classSection)
    }
    return '—'
}

export const getAllocationProfileImage = (record) => record?.profileImage || noProfile

export const submitStudentAllocation = (id, classSection, submitterName, submitterRole) => {
    const records = getStudentAllocations()
    const updated = records.map((item) => {
        if (item.id !== id) return item
        return {
            ...item,
            proposedSection: classSection,
            classSection: '',
            allocationStatus: 'Pending Approval',
            submittedBy: submitterName,
            submittedByRole: submitterRole,
            submittedAt: new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).toUpperCase(),
            admission: {
                ...item.admission,
                classSection: '',
            },
        }
    })
    saveStudentAllocations(updated)
    return updated
}

export const approveStudentAllocation = (id) => {
    const records = getStudentAllocations()
    const target = records.find((item) => item.id === id)
    if (!target) return records

    const approvedSection = target.proposedSection || target.classSection
    const approvedClass = target.sourceClassName || target.admission?.className || ''
    const approvedRoll =
        target.rollNo || target.admission?.admissionRollNumber || target.studentId

    updateEnrolledStudentRecord(target.studentId, {
        section: approvedSection,
        rollNumber: approvedRoll,
        className: approvedClass,
    })

    const updated = records.map((item) => {
        if (item.id !== id) return item
        return {
            ...item,
            rollNo: approvedRoll,
            className: approvedClass,
            classSection: approvedSection,
            proposedSection: approvedSection,
            allocationStatus: 'Allocated',
            admission: {
                ...item.admission,
                className: approvedClass,
                classSection: approvedSection,
            },
        }
    })
    saveStudentAllocations(updated)
    return updated
}

export const rejectStudentAllocation = (id) => {
    const records = getStudentAllocations()
    const updated = records.map((item) => {
        if (item.id !== id) return item
        return {
            ...item,
            allocationStatus: 'Rejected',
            proposedSection: '',
            classSection: '',
            submittedBy: '',
            submittedByRole: '',
            submittedAt: '',
            admission: {
                ...item.admission,
                classSection: '',
            },
        }
    })
    saveStudentAllocations(updated)
    return updated
}

export const deleteStudentAllocation = (id) => {
    const updated = getStudentAllocations().filter((item) => item.id !== id)
    saveStudentAllocations(updated)
    return updated
}

export const emptyAllocationFilters = {
    search: '',
    status: '',
    fromDate: null,
    toDate: null,
}

export const filterStudentAllocations = (records, filters) => {
    const search = filters.search.trim().toLowerCase()

    return records.filter((record) => {
        if (filters.status && record.allocationStatus !== filters.status) return false

        if (search) {
            const haystack = `${record.studentName} ${record.rollNo} ${record.admissionNumber} ${record.className} ${record.sourceClassName} ${record.city} ${record.state} ${record.submittedBy}`.toLowerCase()
            if (!haystack.includes(search)) return false
        }

        return true
    })
}

export const getSubmitterIdentity = (routePrefix) => {
    if (routePrefix === '/coordinator') {
        return { name: COORDINATOR_NAME, role: COORDINATOR_ROLE }
    }
    return { name: TEACHER_NAME, role: TEACHER_ROLE }
}

export const getPendingApprovalCount = (records) =>
    records.filter((record) => record.allocationStatus === 'Pending Approval').length

export const getStudentAllocationContext = (pathname) => {
    if (pathname.startsWith('/coordinator')) {
        return {
            routePrefix: '/coordinator',
            listPath: '/coordinator/student-allocation',
            isApprover: false,
        }
    }

    if (
        pathname.startsWith(PRINCIPAL_APPROVAL_LIST_PATH) ||
        pathname.startsWith('/principal/student-allocation')
    ) {
        return {
            routePrefix: '/principal',
            listPath: PRINCIPAL_APPROVAL_LIST_PATH,
            isApprover: false,
            isAllocator: true,
        }
    }

    if (
        pathname.startsWith(DIRECTOR_APPROVAL_LIST_PATH) ||
        pathname.startsWith('/director/student-allocation')
    ) {
        return {
            routePrefix: '/director',
            listPath: '/director/dashboard',
            isApprover: false,
            isAllocator: false,
        }
    }

    return {
        routePrefix: '/teacher',
        listPath: '/teacher/student-allocation',
        isApprover: false,
    }
}
