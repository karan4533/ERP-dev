import React from 'react'
import EmployeeListPage from '../Components/EmployeeListPage'
import { SEED } from '../../../HR/domain/hrSeed'

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

const rows = SEED.employees
    .filter((row) => row.role === 'prm' || /parent relationship|public relations|assistant pro/i.test(row.designation || ''))
    .map((row) => ({
        employeeId: row.id,
        name: row.name,
        gender: row.gender || '—',
        email: row.email,
        mobile: row.contact,
        dateOfBirth: row.dateOfBirth || '—',
        qualification: row.qualification || '—',
        experience: row.experience || '—',
        city: 'Madurai',
        state: 'Tamil Nadu',
        designation: row.designation,
    }))

const FrontOfficeList = () => (
    <EmployeeListPage
        title="Front Office List"
        columns={columns}
        rows={rows}
        viewPath="/principal/employees-management/view-front-office"
    />
)

export default FrontOfficeList
