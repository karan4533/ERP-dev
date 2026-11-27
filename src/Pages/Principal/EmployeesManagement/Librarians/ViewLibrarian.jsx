import React from 'react'
import { useSearchParams } from 'react-router-dom'
import ViewEmployeeDetails from '../Components/ViewEmployeeDetails'
import { SEED } from '../../../HR/domain/hrSeed'

const ViewLibrarian = () => {
    const [params] = useSearchParams()
    const id = params.get('id') || params.get('employeeId')
    const libRows = SEED.employees.filter(
        (row) => row.role === 'librarian' || /librarian/i.test(row.designation || ''),
    )
    const row = libRows.find((item) => item.id === id) || libRows[0]
    const nameParts = String(row?.name || 'Staff').trim().split(/\s+/)
    const employee = {
        profileImage: null,
        employeeId: row?.id || '—',
        firstName: nameParts[0] || '',
        middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
        lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : '',
        gender: row?.gender || '—',
        dateOfBirth: row?.dateOfBirth || '—',
        bloodGroup: '—',
        address: {
            address: row?.address || 'Queen Mira International School, Madurai',
            country: 'India',
            state: 'Tamil Nadu',
            city: 'Madurai',
            zipCode: '',
        },
        contact: {
            mobileNumber: row?.contact || '—',
            alternativeNumber: '',
            email: row?.email || '—',
        },
        professionalInfo: {
            qualification: row?.qualification || '—',
            designation: row?.designation || 'Librarian',
            department: row?.department || 'Library',
            yearsOfExperience: row?.experience || '—',
            previousOrganization: '—',
            joiningDate: row?.joiningDate || '—',
        },
        employmentInfo: {
            employeeType: row?.employmentType || 'Full Time',
            salary: '—',
            workShift: '—',
            assignedArea: row?.designation || 'Library',
            reportingTo: row?.reportingManager || '—',
        },
    }

    return (
        <ViewEmployeeDetails
            listPath="/principal/employees-management/librarians"
            idLabel="LIB-ID"
            roleTitle="Librarian"
            employee={employee}
        />
    )
}

export default ViewLibrarian
