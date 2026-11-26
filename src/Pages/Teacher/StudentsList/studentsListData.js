import { getStudentsList as getCreatedStudentsList } from '../../../Common/RBAC/createdUsersData.js'

export const GENDERS = ['Male', 'Female']

export const DEFAULT_CLASS_10A_STUDENTS = [
    {
        id: 'STU-2024-1042',
        admissionNumber: 'ADM-2024-1042',
        rollNumber: '10A-01',
        name: 'Aarav Sharma',
        gender: 'Male',
        email: 'aarav.sharma@school.edu',
        mobileNumber: '+91 98765 43210',
        dateOfBirth: '14-08-2010',
        country: 'India',
        state: 'Kerala',
        city: 'Kochi',
        className: 'Class 10',
        section: 'A',
        classSection: '10-A',
        profile: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        feeStatus: 'Paid',
        pendingFeeAmount: '₹0',
        totalFees: '₹65,000',
        term1Status: 'Paid (₹32,500 on 12-Jul-2025)',
        term2Status: 'Paid (₹32,500 on 10-Jan-2026)',
        parentName: 'Rajesh Sharma',
        parentRelation: 'Father',
        motherName: 'Meera Sharma',
        parentContact: '+91 98765 43210',
        parentEmail: 'rajesh.sharma@email.com',
        parentOccupation: 'Software Engineer',
        studentHistory: {
            admissionDate: '12-06-2023',
            previousSchool: 'Delhi Public School, Kochi',
            academicStanding: 'Top 5% (Distinction)',
            attendanceRate: '96.2%',
            conduct: 'Exemplary',
            achievements: 'State Science Fair 2nd Place, House Vice-Captain'
        }
    },
    {
        id: 'STU-2024-1087',
        admissionNumber: 'ADM-2024-1087',
        rollNumber: '10A-02',
        name: 'Diya Nair',
        gender: 'Female',
        email: 'diya.nair@school.edu',
        mobileNumber: '+91 98470 12345',
        dateOfBirth: '22-11-2010',
        country: 'India',
        state: 'Kerala',
        city: 'Thrissur',
        className: 'Class 10',
        section: 'A',
        classSection: '10-A',
        profile: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        feeStatus: 'Pending',
        pendingFeeAmount: '₹18,500',
        totalFees: '₹65,000',
        term1Status: 'Paid (₹32,500 on 15-Jul-2025)',
        term2Status: 'Pending (₹18,500 Due)',
        parentName: 'Suresh Nair',
        parentRelation: 'Father',
        motherName: 'Lakshmi Nair',
        parentContact: '+91 98470 12345',
        parentEmail: 'lakshmi.nair@email.com',
        parentOccupation: 'Business Owner',
        studentHistory: {
            admissionDate: '10-06-2023',
            previousSchool: 'Bhavans Vidya Mandir, Thrissur',
            academicStanding: 'A Grade (88%)',
            attendanceRate: '92.4%',
            conduct: 'Very Good',
            achievements: 'School Choir Lead, Interschool Debate Participant'
        }
    },
    {
        id: 'STU-2024-1156',
        admissionNumber: 'ADM-2024-1156',
        rollNumber: '10A-03',
        name: 'Rohan Verma',
        gender: 'Male',
        email: 'rohan.verma@school.edu',
        mobileNumber: '+91 91234 56789',
        dateOfBirth: '05-03-2010',
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Chennai',
        className: 'Class 10',
        section: 'A',
        classSection: '10-A',
        profile: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        feeStatus: 'Paid',
        pendingFeeAmount: '₹0',
        totalFees: '₹65,000',
        term1Status: 'Paid (₹32,500 on 10-Jul-2025)',
        term2Status: 'Paid (₹32,500 on 08-Jan-2026)',
        parentName: 'Anil Verma',
        parentRelation: 'Father',
        motherName: 'Sunita Verma',
        parentContact: '+91 91234 56789',
        parentEmail: 'anil.verma@email.com',
        parentOccupation: 'Chartered Accountant',
        studentHistory: {
            admissionDate: '14-06-2023',
            previousSchool: 'DAV Public School, Chennai',
            academicStanding: 'Top 10% (Distinction)',
            attendanceRate: '95.0%',
            conduct: 'Good',
            achievements: 'Regional Math Olympiad Bronze Medalist'
        }
    },
    {
        id: 'STU-2024-1203',
        admissionNumber: 'ADM-2024-1203',
        rollNumber: '10A-04',
        name: 'Ananya Reddy',
        gender: 'Female',
        email: 'ananya.reddy@school.edu',
        mobileNumber: '+91 99887 65432',
        dateOfBirth: '19-09-2010',
        country: 'India',
        state: 'Telangana',
        city: 'Hyderabad',
        className: 'Class 10',
        section: 'A',
        classSection: '10-A',
        profile: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        feeStatus: 'Paid',
        pendingFeeAmount: '₹0',
        totalFees: '₹65,000',
        term1Status: 'Paid (₹32,500 on 14-Jul-2025)',
        term2Status: 'Paid (₹32,500 on 12-Jan-2026)',
        parentName: 'Dr. Venkatesh Reddy',
        parentRelation: 'Father',
        motherName: 'Dr. Latha Reddy',
        parentContact: '+91 99887 65432',
        parentEmail: 'venkatesh.reddy@email.com',
        parentOccupation: 'Surgeon',
        studentHistory: {
            admissionDate: '12-06-2023',
            previousSchool: 'Narayana School, Hyderabad',
            academicStanding: 'A+ Grade (95%)',
            attendanceRate: '98.0%',
            conduct: 'Exemplary',
            achievements: 'School President Candidate, Swimming Champion'
        }
    },
    {
        id: 'STU-2024-1318',
        admissionNumber: 'ADM-2024-1318',
        rollNumber: '10A-05',
        name: 'Aditya Menon',
        gender: 'Male',
        email: 'aditya.menon@school.edu',
        mobileNumber: '+91 97654 32109',
        dateOfBirth: '30-01-2010',
        country: 'India',
        state: 'Kerala',
        city: 'Kozhikode',
        className: 'Class 10',
        section: 'A',
        classSection: '10-A',
        profile: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        feeStatus: 'Pending',
        pendingFeeAmount: '₹32,500',
        totalFees: '₹65,000',
        term1Status: 'Paid (₹32,500 on 18-Jul-2025)',
        term2Status: 'Pending (₹32,500 Due)',
        parentName: 'Suresh Menon',
        parentRelation: 'Father',
        motherName: 'Deepa Menon',
        parentContact: '+91 97654 32109',
        parentEmail: 'suresh.menon@email.com',
        parentOccupation: 'Government Officer',
        studentHistory: {
            admissionDate: '15-06-2023',
            previousSchool: 'Kendriya Vidyalaya, Kozhikode',
            academicStanding: 'B+ Grade (79%)',
            attendanceRate: '89.5%',
            conduct: 'Good',
            achievements: 'Football Team Captain, Drama Club Member'
        }
    },
    {
        id: 'STU-2024-1425',
        admissionNumber: 'ADM-2024-1425',
        rollNumber: '10A-06',
        name: 'Kavya Krishnan',
        gender: 'Female',
        email: 'kavya.krishnan@school.edu',
        mobileNumber: '+91 96543 21098',
        dateOfBirth: '11-05-2010',
        country: 'India',
        state: 'Kerala',
        city: 'Thiruvananthapuram',
        className: 'Class 10',
        section: 'A',
        classSection: '10-A',
        profile: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        feeStatus: 'Paid',
        pendingFeeAmount: '₹0',
        totalFees: '₹65,000',
        term1Status: 'Paid (₹32,500 on 09-Jul-2025)',
        term2Status: 'Paid (₹32,500 on 05-Jan-2026)',
        parentName: 'Krishnan Nair',
        parentRelation: 'Father',
        motherName: 'Meera Krishnan',
        parentContact: '+91 96543 21098',
        parentEmail: 'meera.krishnan@email.com',
        parentOccupation: 'Architect',
        studentHistory: {
            admissionDate: '10-06-2023',
            previousSchool: 'St. Thomas School, Thiruvananthapuram',
            academicStanding: 'Top 5% (Distinction)',
            attendanceRate: '97.1%',
            conduct: 'Exemplary',
            achievements: 'Classical Dance State Winner, Art Club Secretary'
        }
    }
]

export const getStudentsList = () => {
    const created = getCreatedStudentsList()
    if (!created || created.length === 0) {
        return DEFAULT_CLASS_10A_STUDENTS
    }
    // Merge created with defaults if not already present
    const map = new Map()
    DEFAULT_CLASS_10A_STUDENTS.forEach((s) => map.set(s.id, s))
    created.forEach((c) => {
        map.set(c.id, {
            ...c,
            feeStatus: c.feeStatus || 'Paid',
            pendingFeeAmount: c.pendingFeeAmount || '₹0',
            totalFees: c.totalFees || '₹65,000',
            term1Status: c.term1Status || 'Paid',
            term2Status: c.term2Status || 'Paid',
            parentName: c.fatherName || 'Parent',
            parentRelation: 'Father',
            motherName: c.motherName || '',
            parentContact: c.familyContactNumber || c.mobileNumber || '',
            parentEmail: c.email || '',
            parentOccupation: 'Employed',
            studentHistory: c.studentHistory || {
                admissionDate: '10-06-2024',
                previousSchool: c.previousSchool || 'Secondary School',
                academicStanding: 'Good',
                attendanceRate: '94.0%',
                conduct: 'Good',
                achievements: 'Active participant in school activities'
            }
        })
    })
    return Array.from(map.values())
}

export const STUDENTS_LIST = DEFAULT_CLASS_10A_STUDENTS

export const getStudentById = (id) =>
    getStudentsList().find((student) => student.id === id) ?? null
