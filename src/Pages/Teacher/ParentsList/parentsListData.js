import noProfile from '../../../assets/images/no-profile.png'

export const PARENTS_LIST = [
    {
        id: 'PAR-1001',
        parentProfile: noProfile,
        parentName: 'Rajesh Sharma',
        parentEmail: 'rajesh.sharma@email.com',
        mobileNumber: '+91 98765 43210',
        studentName: 'Arjun Sharma',
        admissionNumber: 'ADM-2024-1042',
    },
    {
        id: 'PAR-1002',
        parentProfile: noProfile,
        parentName: 'Lakshmi Nair',
        parentEmail: 'lakshmi.nair@email.com',
        mobileNumber: '+91 98470 12345',
        studentName: 'Priya Nair',
        admissionNumber: 'ADM-2024-1087',
    },
    {
        id: 'PAR-1003',
        parentProfile: noProfile,
        parentName: 'Anil Verma',
        parentEmail: 'anil.verma@email.com',
        mobileNumber: '+91 91234 56789',
        studentName: 'Rahul Verma',
        admissionNumber: 'ADM-2024-1156',
    },
    {
        id: 'PAR-1004',
        parentProfile: noProfile,
        parentName: 'Venkatesh Reddy',
        parentEmail: 'venkatesh.reddy@email.com',
        mobileNumber: '+91 99887 65432',
        studentName: 'Sneha Reddy',
        admissionNumber: 'ADM-2024-1203',
    },
    {
        id: 'PAR-1005',
        parentProfile: noProfile,
        parentName: 'Suresh Menon',
        parentEmail: 'suresh.menon@email.com',
        mobileNumber: '+91 97654 32109',
        studentName: 'Karthik Menon',
        admissionNumber: 'ADM-2024-1318',
    },
    {
        id: 'PAR-1006',
        parentProfile: noProfile,
        parentName: 'Meera Krishnan',
        parentEmail: 'meera.krishnan@email.com',
        mobileNumber: '+91 96543 21098',
        studentName: 'Divya Krishnan',
        admissionNumber: 'ADM-2024-1425',
    },
]

export const getParentById = (id) =>
    PARENTS_LIST.find((parent) => parent.id === id) ?? null
