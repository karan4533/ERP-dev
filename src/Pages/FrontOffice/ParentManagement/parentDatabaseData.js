import mo_user from '../../../assets/images/no-profile.png'

export const PARENTS_LIST = [
    {
        id: 'PAR-1001',
        parentId: 'PAR-1001',
        profileImage: mo_user,
        parentName: 'Rajesh Sharma',
        gender: 'Male',
        email: 'rajesh.sharma@email.com',
        mobileNumber: '+91 98765 43210',
        studentName: 'Arjun Sharma',
        admissionNumber: 'ADM-2024-1042',
        relation: 'Father',
    },
    {
        id: 'PAR-1002',
        parentId: 'PAR-1002',
        profileImage: mo_user,
        parentName: 'Lakshmi Nair',
        gender: 'Female',
        email: 'lakshmi.nair@email.com',
        mobileNumber: '+91 98470 12345',
        studentName: 'Priya Nair',
        admissionNumber: 'ADM-2024-1087',
        relation: 'Mother',
    },
    {
        id: 'PAR-1003',
        parentId: 'PAR-1003',
        profileImage: mo_user,
        parentName: 'Anil Verma',
        gender: 'Male',
        email: 'anil.verma@email.com',
        mobileNumber: '+91 91234 56789',
        studentName: 'Rahul Verma',
        admissionNumber: 'ADM-2024-1156',
        relation: 'Father',
    },
    {
        id: 'PAR-1004',
        parentId: 'PAR-1004',
        profileImage: mo_user,
        parentName: 'Venkatesh Reddy',
        gender: 'Male',
        email: 'venkatesh.reddy@email.com',
        mobileNumber: '+91 99887 65432',
        studentName: 'Sneha Reddy',
        admissionNumber: 'ADM-2024-1203',
        relation: 'Father',
    },
]

export const getParentById = (id) =>
    PARENTS_LIST.find((parent) => parent.id === id) ?? null
