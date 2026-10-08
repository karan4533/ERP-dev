import React from 'react'
import ViewEmployeeDetails from '../Components/ViewEmployeeDetails'

const MOCK_EMPLOYEE = {
    profileImage: null,
    employeeId: 'LIB-1001',
    firstName: 'Sandy',
    middleName: 'K.',
    lastName: 'Selva',
    gender: 'Male',
    dateOfBirth: '20-12-1996',
    bloodGroup: 'B+',
    address: {
        address: '12, Anna Nagar, Main Road',
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Pudukkottai',
        zipCode: '622001',
    },
    contact: {
        mobileNumber: '+91 99440 76993',
        alternativeNumber: '+91 98765 43210',
        email: 'san@gmail.com',
    },
    professionalInfo: {
        qualification: 'M.Lib.Sc, B.Ed.',
        designation: 'Senior Librarian',
        department: 'Library',
        yearsOfExperience: '8 Years',
        previousOrganization: 'District Central Library, Pudukkottai',
        joiningDate: '2018-06-01',
    },
    employmentInfo: {
        employeeType: 'Full-time',
        salary: '₹42,000 / month',
        workShift: 'Morning (8:00 AM – 3:00 PM)',
        assignedArea: 'Central Library & Digital Resource Centre',
        reportingTo: 'Principal',
    },
}

const ViewLibrarian = () => (
    <ViewEmployeeDetails
        listPath="/principal/employees-management/librarians"
        idLabel="LIB-ID"
        roleTitle="Librarian"
        employee={MOCK_EMPLOYEE}
    />
)

export default ViewLibrarian
