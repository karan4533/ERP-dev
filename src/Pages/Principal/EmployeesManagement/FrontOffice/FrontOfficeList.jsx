import React from 'react'
import EmployeeListPage from '../Components/EmployeeListPage'

const columns = [
    { key: 'profile', label: 'Profile', isProfile: true },
    { key: 'employeeId', label: 'Staff ID' },
    { key: 'name', label: 'Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile Number' },
    { key: 'dateOfBirth', label: 'Date Of Birth' },
    { key: 'qualification', label: 'Qualification' },
    { key: 'experience', label: 'Experience' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
]

const rows = [
    {
        employeeId: 'FO-1001',
        name: 'Priya Sharma',
        gender: 'Female',
        email: 'priya.sharma@school.com',
        mobile: '9876543210',
        dateOfBirth: '15-04-1992',
        qualification: 'B.Com, MBA',
        experience: '6 Years',
        city: 'Chennai',
        state: 'Tamil Nadu',
    },
    {
        employeeId: 'FO-1002',
        name: 'Rajesh Kumar',
        gender: 'Male',
        email: 'rajesh.kumar@school.com',
        mobile: '9123456780',
        dateOfBirth: '22-08-1988',
        qualification: 'B.A, Diploma in Office Management',
        experience: '10 Years',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
    },
]

const FrontOfficeList = () => (
    <EmployeeListPage
        title="Front Office List"
        columns={columns}
        rows={rows}
        viewPath="/principal/employees-management/view-front-office"
    />
)

export default FrontOfficeList
