import {
    buildUserDisplayName,
    CREATABLE_ROLE_LABELS,
    getAllCreatedUsers,
    getCreatedUserById,
} from '../RBAC/createdUsersData'
import { liveArray } from '../RBAC/liveArray'
import { ROLES } from '../../constants/roles'

export const DEPARTMENTS = [
    'Teacher',
    'Coordinator',
    'Front Office',
    'Librarian',
    'Gate Keeper Manager',
    'Gate Keeper',
    'Principal',
    'PRM',
    'HR',
    'Driver',
    'Admin Staff',
]

const displayValue = (value) => {
    const text = String(value ?? '').trim()
    return text || '—'
}

const ROLE_DEPARTMENT_MAP = {
    [ROLES.PRINCIPAL]: 'Principal',
    [ROLES.PRM]: 'PRM',
    [ROLES.TEACHER]: 'Teacher',
    [ROLES.COORDINATOR]: 'Coordinator',
    [ROLES.LIBRARIAN]: 'Librarian',
    [ROLES.GATEKEEPER_MANAGER]: 'Gate Keeper Manager',
    [ROLES.GATEKEEPER]: 'Gate Keeper',
}

export const mapCreatedUserToEmployeeRow = (user) => {
    const department = ROLE_DEPARTMENT_MAP[user.role] || user.roleLabel || displayValue(user.role)
    const roleLabel = user.roleLabel || CREATABLE_ROLE_LABELS[user.role] || displayValue(user.role)

    return {
        id: user.id,
        employeeId: user.id,
        name: buildUserDisplayName(user),
        department,
        role: roleLabel,
        gender: displayValue(user.gender),
        email: user.email,
        mobileNumber: displayValue(user.mobileNumber),
        dateOfBirth: displayValue(user.dateOfBirth),
        qualification: displayValue(user.qualification),
        experience: displayValue(user.yearsOfExperience),
        country: displayValue(user.country),
        state: displayValue(user.state),
        city: displayValue(user.city),
        profileImage: user.profileImage || null,
        source: 'created-user',
    }
}

const formatJoiningDate = (isoDate) => {
    if (!isoDate) return '—'
    const value = new Date(isoDate)
    if (Number.isNaN(value.getTime())) return '—'
    return value.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

const buildEmployeeDetailFromUser = (user, listItem) => ({
    ...listItem,
    profileImage: user.profileImage || null,
    userId: user.id,
    firstName: user.firstName || '',
    middleName: user.middleName || '',
    lastName: user.lastName || '',
    bloodGroup: displayValue(user.bloodGroup),
    height: displayValue(user.height),
    weight: displayValue(user.weight),
    medicalHistory: displayValue(user.medicalHistory),
    address: {
        address: displayValue(user.street),
        country: displayValue(user.country),
        state: displayValue(user.state),
        city: displayValue(user.city),
        zipCode: displayValue(user.pincode),
    },
    contact: {
        mobileNumber: displayValue(user.mobileNumber),
        alternativeNumber: displayValue(user.alternativeMobileNumber),
        email: user.email,
    },
    professionalInfo: {
        qualification: displayValue(user.qualification),
        subject: '—',
        yearsOfExperience: displayValue(user.yearsOfExperience),
        previousSchool: displayValue(user.previousSchool),
        joiningDate: displayValue(user.joiningDate) !== '—'
            ? user.joiningDate
            : formatJoiningDate(user.createdAt),
    },
    employmentInfo: {
        employeeType: user.status || 'Active',
        salary: '—',
        workShift: '—',
        assignedClass: '—',
        assignedSubjects: '—',
    },
    account: {
        username: displayValue(user.username || user.email.split('@')[0]),
        password: displayValue(user.password),
    },
    documents: {
        idProof: displayValue(user.idProofFile),
        qualificationCertificate: displayValue(user.qualificationCertificateFile),
        experienceCertificate: displayValue(user.experienceCertificateFile),
    },
})

export const getEmployeesList = () =>
    getAllCreatedUsers()
        .filter((user) => user.role !== ROLES.STUDENT)
        .map(mapCreatedUserToEmployeeRow)

export const EMPLOYEES_LIST = liveArray(getEmployeesList)

export const getEmployeeById = (id) => {
    const createdUser = getCreatedUserById(id)
    if (!createdUser || createdUser.role === ROLES.STUDENT) return null

    const listItem = mapCreatedUserToEmployeeRow(createdUser)
    return buildEmployeeDetailFromUser(createdUser, listItem)
}
