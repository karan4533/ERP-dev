import React from 'react'
import EmployeeListPage from '../Components/EmployeeListPage'
import { SEED } from '../../../HR/domain/hrSeed'

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

const rows = SEED.employees
    .filter((row) => row.role === 'librarian' || /librarian/i.test(row.designation || ''))
    .map((row) => ({
        name: row.name,
        employeeId: row.id,
        email: row.email,
        gender: row.gender || '—',
        mobile: row.contact,
        qualification: row.qualification || '—',
        experience: row.experience || '—',
        city: 'Madurai',
        state: 'Tamil Nadu',
    }))

const LibrariansList = () => (
    <EmployeeListPage
        title="Librarian List"
        columns={columns}
        rows={rows}
        viewPath="/principal/employees-management/view-librarian"
    />
)

export default LibrariansList
