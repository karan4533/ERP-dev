import React from 'react'
import ViewEmployeeDetails from '../Components/ViewEmployeeDetails'

const MOCK_EMPLOYEE = {
    profileImage: null,
    employeeId: 'FO-1001',
    firstName: 'Priya',
    middleName: 'L.',
    lastName: 'Sharma',
    gender: 'Female',
    dateOfBirth: '15-04-1992',
    bloodGroup: 'A+',
    address: {
        address: '45, Gandhi Nagar, 2nd Street',
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Chennai',
        zipCode: '600001',
    },
    contact: {
        mobileNumber: '+91 98765 43210',
        alternativeNumber: '+91 98765 43211',
        email: 'priya.sharma@school.com',
    },
    professionalInfo: {
        qualification: 'B.Com, MBA',
        designation: 'Front Office Executive',
        department: 'Administration',
        yearsOfExperience: '6 Years',
        previousOrganization: 'Global Public School, Chennai',
        joiningDate: '2020-07-01',
    },
    employmentInfo: {
        employeeType: 'Full-time',
        salary: '₹38,000 / month',
        workShift: 'Morning (8:00 AM – 4:00 PM)',
        assignedArea: 'Reception & Visitor Management',
        reportingTo: 'Principal',
    },
}

const ViewFrontOffice = () => (
    <ViewEmployeeDetails
        listPath="/principal/employees-management/front-office"
        idLabel="Staff ID"
        roleTitle="Front Office"
        employee={MOCK_EMPLOYEE}
    />
)

export default ViewFrontOffice
