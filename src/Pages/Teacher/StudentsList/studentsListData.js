import { getStudentsList as getCreatedStudentsList } from '../../../Common/RBAC/createdUsersData'
import { liveArray } from '../../../Common/RBAC/liveArray'

export const GENDERS = ['Male', 'Female']

export const getStudentsList = () => getCreatedStudentsList()

/** Live proxy over created student users (starts empty). */
export const STUDENTS_LIST = liveArray(getCreatedStudentsList)

export const getStudentById = (id) =>
    getCreatedStudentsList().find((student) => student.id === id) ?? null
