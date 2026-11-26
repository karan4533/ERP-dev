import noProfile from '../../../assets/images/no-profile.png'
import { getStudentById } from './studentsListData'

const PARENT_BY_STUDENT = {
    'STU-2024-1042': {
        fatherName: 'Rajesh Sharma',
        motherName: 'Meera Sharma',
        fatherOccupation: 'Software Engineer',
        motherOccupation: 'Bank Manager',
        fatherYearlyIncome: '₹14,00,000',
        motherYearlyIncome: '₹8,00,000',
        siblings: '0',
        contact: {
            mobileNumber: '+91 98765 43210',
            alternativeNumber: '+91 98765 43211',
            email: 'rajesh.sharma@email.com',
        },
    },
    'STU-2024-1087': {
        fatherName: 'Suresh Nair',
        motherName: 'Lakshmi Nair',
        fatherOccupation: 'Business Owner',
        motherOccupation: 'Homemaker',
        fatherYearlyIncome: '₹10,00,000',
        motherYearlyIncome: '—',
        siblings: '1 (Younger brother)',
        contact: {
            mobileNumber: '+91 98470 12345',
            alternativeNumber: '+91 98470 12346',
            email: 'lakshmi.nair@email.com',
        },
    },
    'STU-2024-1156': {
        fatherName: 'Anil Verma',
        motherName: 'Sunita Verma',
        fatherOccupation: 'Chartered Accountant',
        motherOccupation: 'Teacher',
        fatherYearlyIncome: '₹12,50,000',
        motherYearlyIncome: '₹5,50,000',
        siblings: '1 (Elder sister)',
        contact: {
            mobileNumber: '+91 91234 56789',
            alternativeNumber: '+91 91234 56780',
            email: 'anil.verma@email.com',
        },
    },
    'STU-2024-1203': {
        fatherName: 'Venkatesh Reddy',
        motherName: 'Latha Reddy',
        fatherOccupation: 'Doctor',
        motherOccupation: 'Pharmacist',
        fatherYearlyIncome: '₹18,00,000',
        motherYearlyIncome: '₹7,00,000',
        siblings: '0',
        contact: {
            mobileNumber: '+91 99887 65432',
            alternativeNumber: '+91 99887 65433',
            email: 'venkatesh.reddy@email.com',
        },
    },
    'STU-2024-1318': {
        fatherName: 'Suresh Menon',
        motherName: 'Deepa Menon',
        fatherOccupation: 'Government Officer',
        motherOccupation: 'Nurse',
        fatherYearlyIncome: '₹9,00,000',
        motherYearlyIncome: '₹4,50,000',
        siblings: '2 (Younger twins)',
        contact: {
            mobileNumber: '+91 97654 32109',
            alternativeNumber: '+91 97654 32108',
            email: 'suresh.menon@email.com',
        },
    },
    'STU-2024-1425': {
        fatherName: 'Krishnan Nair',
        motherName: 'Meera Krishnan',
        fatherOccupation: 'Architect',
        motherOccupation: 'Interior Designer',
        fatherYearlyIncome: '₹11,00,000',
        motherYearlyIncome: '₹6,00,000',
        siblings: '1 (Younger brother)',
        contact: {
            mobileNumber: '+91 96543 21098',
            alternativeNumber: '+91 96543 21099',
            email: 'meera.krishnan@email.com',
        },
    },
}

const PROFILE_EXTRAS = {
    'STU-2024-1042': {
        middleName: 'Kumar',
        religion: 'Hindu',
        caste: 'General',
        bloodGroup: 'B+',
        height: '165 cm',
        weight: '52 kg',
        medicalHistory: 'No known allergies. Mild asthma (controlled).',
        previousSchool: 'Delhi Public School, Kochi',
        routeList: 'Route 3 – Kochi Central',
        busStop: 'MG Road Junction',
    },
    'STU-2024-1087': {
        middleName: '',
        religion: 'Hindu',
        caste: 'General',
        bloodGroup: 'O+',
        height: '158 cm',
        weight: '48 kg',
        medicalHistory: 'No known medical conditions.',
        previousSchool: 'Bhavans Vidya Mandir, Thrissur',
        routeList: 'Route 5 – Thrissur North',
        busStop: 'Swaraj Round',
    },
    'STU-2024-1156': {
        middleName: '',
        religion: 'Hindu',
        caste: 'OBC',
        bloodGroup: 'A+',
        height: '170 cm',
        weight: '55 kg',
        medicalHistory: 'Wears corrective lenses.',
        previousSchool: 'DAV Public School, Chennai',
        routeList: 'Route 12 – Chennai South',
        busStop: 'Adyar Signal',
    },
    'STU-2024-1203': {
        middleName: '',
        religion: 'Hindu',
        caste: 'General',
        bloodGroup: 'AB+',
        height: '162 cm',
        weight: '50 kg',
        medicalHistory: 'No known medical conditions.',
        previousSchool: 'Narayana School, Hyderabad',
        routeList: 'Route 8 – Hyderabad West',
        busStop: 'Banjara Hills',
    },
    'STU-2024-1318': {
        middleName: '',
        religion: 'Hindu',
        caste: 'General',
        bloodGroup: 'B-',
        height: '168 cm',
        weight: '54 kg',
        medicalHistory: 'Seasonal allergies.',
        previousSchool: 'Kendriya Vidyalaya, Kozhikode',
        routeList: 'Route 2 – Kozhikode Beach',
        busStop: 'Beach Road',
    },
    'STU-2024-1425': {
        middleName: '',
        religion: 'Hindu',
        caste: 'General',
        bloodGroup: 'O-',
        height: '160 cm',
        weight: '49 kg',
        medicalHistory: 'No known medical conditions.',
        previousSchool: 'St. Thomas School, Thiruvananthapuram',
        routeList: 'Route 1 – Trivandrum City',
        busStop: 'Palayam',
    },
}

const splitName = (fullName) => {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 1) return { firstName: parts[0], middleName: '', lastName: '' }
    if (parts.length === 2) return { firstName: parts[0], middleName: '', lastName: parts[1] }
    return {
        firstName: parts[0],
        middleName: parts.slice(1, -1).join(' '),
        lastName: parts[parts.length - 1],
    }
}

export const ATTENDANCE_RECORDS = [
    { date: '03-03-2026', day: 'Monday', checkIn: '07:35 AM', checkOut: '02:15 PM', status: 'Present', remarks: 'Present for all Class 10-A periods' },
    { date: '04-03-2026', day: 'Tuesday', checkIn: '07:40 AM', checkOut: '02:20 PM', status: 'Present', remarks: 'Attended science lab and mathematics class' },
    { date: '05-03-2026', day: 'Wednesday', checkIn: '—', checkOut: '—', status: 'Leave', remarks: 'Sick leave — fever, parent informed' },
    { date: '06-03-2026', day: 'Thursday', checkIn: '08:05 AM', checkOut: '02:15 PM', status: 'Present', remarks: 'Late arrival due to bus delay' },
    { date: '07-03-2026', day: 'Friday', checkIn: '07:38 AM', checkOut: '12:00 PM', status: 'Half Day', remarks: 'Left early for dental appointment' },
    { date: '10-03-2026', day: 'Monday', checkIn: '07:32 AM', checkOut: '02:30 PM', status: 'Present', remarks: 'Participated in inter-house sports practice' },
    { date: '11-03-2026', day: 'Tuesday', checkIn: '—', checkOut: '—', status: 'Absent', remarks: 'Absent — family function, no prior notice' },
]

export const attendanceBadgeColor = {
    Present: 'bg-[#4CAF5033] text-[#4CAF50]',
    Absent: 'bg-[#FF000033] text-[#FF0000]',
    Leave: 'bg-[#FF980033] text-[#FF9800]',
    'Half Day': 'bg-[#2196F333] text-[#2196F3]',
}

export const getStudentFullProfileById = (id) => {
    const student = getStudentById(id)
    if (!student) return null

    const nameParts = splitName(student.name)
    const extras = PROFILE_EXTRAS[id] ?? {}
    const parentInfo = PARENT_BY_STUDENT[id] ?? {}

    const streetAddress = `${student.city}, ${student.state}`

    return {
        profileImage: student.profile || noProfile,
        admissionNumber: student.admissionNumber,
        firstName: nameParts.firstName,
        middleName: extras.middleName ?? nameParts.middleName,
        lastName: nameParts.lastName,
        admissionDate: '15-06-2024',
        class: `Class ${student.className}`,
        classSection: `Section ${student.section}`,
        registrationFees: '₹5,000',
        batchYear: '2024',
        batchEndYear: '2025',
        feesTimeline: 'Quarterly',
        status: 'Active',
        studentId: student.id,
        rollNumber: student.rollNumber,
        gender: student.gender,
        religion: extras.religion ?? '—',
        caste: extras.caste ?? '—',
        dateOfBirth: student.dateOfBirth,
        bloodGroup: extras.bloodGroup ?? '—',
        height: extras.height ?? '—',
        weight: extras.weight ?? '—',
        medicalHistory: extras.medicalHistory ?? '—',
        previousSchool: extras.previousSchool ?? '—',
        address: {
            address: streetAddress,
            country: student.country,
            state: student.state,
            city: student.city,
            zipCode: '682001',
        },
        contact: {
            mobileNumber: student.mobileNumber,
            alternativeNumber: parentInfo.contact?.alternativeNumber ?? '—',
            email: student.email,
        },
        transport: {
            routeList: extras.routeList ?? '—',
            busStop: extras.busStop ?? '—',
        },
        parent: {
            fatherName: parentInfo.fatherName ?? '—',
            motherName: parentInfo.motherName ?? '—',
            fatherOccupation: parentInfo.fatherOccupation ?? '—',
            motherOccupation: parentInfo.motherOccupation ?? '—',
            fatherYearlyIncome: parentInfo.fatherYearlyIncome ?? '—',
            motherYearlyIncome: parentInfo.motherYearlyIncome ?? '—',
            siblings: parentInfo.siblings ?? '—',
            address: {
                address: streetAddress,
                country: student.country,
                state: student.state,
                city: student.city,
                zipCode: '682001',
            },
            contact: parentInfo.contact ?? {
                mobileNumber: '—',
                alternativeNumber: '—',
                email: '—',
            },
        },
    }
}
