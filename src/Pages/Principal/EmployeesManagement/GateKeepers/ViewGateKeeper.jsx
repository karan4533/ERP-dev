import React from 'react'
import ViewEmployeeDetails from '../Components/ViewEmployeeDetails'

const MOCK_EMPLOYEE = {
    profileImage: null,
    employeeId: 'GK-1001',
    firstName: 'Suresh',
    middleName: '',
    lastName: 'Kumar',
    gender: 'Male',
    dateOfBirth: '05-11-1990',
    bloodGroup: 'B+',
    address: {
        address: '23, North Street, Ambattur',
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Chennai',
        zipCode: '600053',
    },
    contact: {
        mobileNumber: '+91 91234 56789',
        alternativeNumber: '+91 91234 56780',
        email: 'suresh.kumar@school.com',
    },
    professionalInfo: {
        qualification: 'Higher Secondary',
        designation: 'Gate Keeper',
        department: 'Security',
        yearsOfExperience: '5 Years',
        previousOrganization: 'City Security Agency',
        joiningDate: '2021-08-15',
    },
    employmentInfo: {
        employeeType: 'Full-time',
        salary: '₹22,000 / month',
        workShift: 'Morning Shift (7:00 AM – 1:00 PM)',
        assignedArea: 'Main Gate',
        reportingTo: 'Gate Keeper Manager',
    },
}

const ViewGateKeeper = () => (
    <ViewEmployeeDetails
        listPath="/principal/employees-management/gatekeepers"
        idLabel="Employee ID"
        roleTitle="Gate Keeper"
        employee={MOCK_EMPLOYEE}
    />
)

export default ViewGateKeeper
