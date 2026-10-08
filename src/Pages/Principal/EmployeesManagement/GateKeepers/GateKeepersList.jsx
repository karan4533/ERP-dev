import React from 'react'
import EmployeeListPage from '../Components/EmployeeListPage'

const columns = [
    { key: 'profile', label: 'Profile', isProfile: true },
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'name', label: 'Gate Keeper Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile Number' },
    { key: 'gateLocation', label: 'Gate Location' },
    { key: 'shift', label: 'Shift' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
]

const rows = [
    {
        employeeId: 'GK-1001',
        name: 'Suresh Kumar',
        gender: 'Male',
        email: 'suresh.kumar@school.com',
        mobile: '9123456789',
        gateLocation: 'Main Gate',
        shift: 'Morning Shift',
        city: 'Chennai',
        state: 'Tamil Nadu',
    },
    {
        employeeId: 'GK-1002',
        name: 'Ramesh Babu',
        gender: 'Male',
        email: 'ramesh.babu@school.com',
        mobile: '9234567890',
        gateLocation: 'Back Gate',
        shift: 'Evening Shift',
        city: 'Chennai',
        state: 'Tamil Nadu',
    },
]

const GateKeepersList = () => (
    <EmployeeListPage
        title="Gate Keepers List"
        columns={columns}
        rows={rows}
        viewPath="/principal/employees-management/view-gatekeeper"
    />
)

export default GateKeepersList
