import React from 'react'
import ViewEmployeeDetails from '../Components/ViewEmployeeDetails'

const MOCK_EMPLOYEE = {
    profileImage: null,
    employeeId: 'GKM-1001',
    firstName: 'Arun',
    middleName: 'R.',
    lastName: 'Prakash',
    gender: 'Male',
    dateOfBirth: '10-03-1985',
    bloodGroup: 'O+',
    address: {
        address: '78, Security Colony, Phase 2',
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Chennai',
        zipCode: '600028',
    },
    contact: {
        mobileNumber: '+91 99887 76655',
        alternativeNumber: '+91 99887 76656',
        email: 'arun.prakash@school.com',
    },
    professionalInfo: {
        qualification: 'Diploma in Security Management',
        designation: 'Gate Keeper Manager',
        department: 'Security',
        yearsOfExperience: '12 Years',
        previousOrganization: 'Secure Campus Services Pvt. Ltd.',
        joiningDate: '2015-01-10',
    },
    employmentInfo: {
        employeeType: 'Full-time',
        salary: '₹48,000 / month',
        workShift: 'Rotational (6:00 AM – 6:00 PM)',
        assignedArea: 'All campus gates & security staff supervision',
        reportingTo: 'Principal',
    },
}

const ViewGateKeeperManager = () => (
    <ViewEmployeeDetails
        listPath="/principal/employees-management/gatekeeper-manager"
        idLabel="Manager ID"
        roleTitle="Gate Keeper Manager"
        employee={MOCK_EMPLOYEE}
    />
)

export default ViewGateKeeperManager
