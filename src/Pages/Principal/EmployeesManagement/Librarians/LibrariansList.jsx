import React from 'react'
import EmployeeListPage from '../Components/EmployeeListPage'

const columns = [
    { key: 'profile', label: 'Profile', isProfile: true },
    { key: 'name', label: 'Librarian Name' },
    { key: 'employeeId', label: 'LIB-ID' },
    { key: 'email', label: 'Email-ID' },
    { key: 'gender', label: 'Gender' },
    { key: 'mobile', label: 'Mobile Number' },
    { key: 'qualification', label: 'Qualification' },
    { key: 'experience', label: 'Experience' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
]

const rows = [
    {
        name: 'Sandy Selva',
        employeeId: 'LIB-1001',
        email: 'san@gmail.com',
        gender: 'Male',
        mobile: '9944076993',
        qualification: 'M.Lib.Sc, B.Ed.',
        experience: '8 Years',
        city: 'Pudukkottai',
        state: 'Tamil Nadu',
    },
    {
        name: 'Meena Devi',
        employeeId: 'LIB-1002',
        email: 'meena.devi@school.com',
        gender: 'Female',
        mobile: '9876543211',
        qualification: 'B.Lib.Sc',
        experience: '4 Years',
        city: 'Madurai',
        state: 'Tamil Nadu',
    },
]

const LibrariansList = () => (
    <EmployeeListPage
        title="Librarian List"
        columns={columns}
        rows={rows}
        viewPath="/principal/employees-management/view-librarian"
    />
)

export default LibrariansList
