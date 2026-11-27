import noProfile from '../../../assets/images/no-profile.png'
import { getStudentById } from '../../../Common/StudentDatabase/studentDatabaseData'

/** Build full profile view from enrolled student + admission snapshot (API SoT). */
export const getStudentFullProfileById = (id) => {
    const student = getStudentById(id)
    if (!student) return null

    return {
        profileImage: student.profileImage || student.profile || noProfile,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        admissionDate: student.admissionDate,
        class: student.class,
        classSection: student.classSection,
        registrationFees: student.registrationFees,
        batchYear: student.batchYear,
        batchEndYear: student.batchEndYear,
        feesTimeline: student.feesTimeline,
        status: student.status,
        studentId: student.studentId || student.id,
        rollNumber: student.rollNumber,
        gender: student.gender,
        religion: student.religion,
        caste: student.caste,
        dateOfBirth: student.dateOfBirth,
        bloodGroup: student.bloodGroup,
        height: student.height,
        weight: student.weight,
        medicalHistory: student.medicalHistory,
        previousSchool: student.previousSchool,
        address: student.address,
        contact: student.contact,
        transport: student.transport,
        parent: student.parent,
    }
}
