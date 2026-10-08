import React from 'react'
import EmployeeListPage from '../Components/EmployeeListPage'

const columns = [
    { key: 'profile', label: 'Profile', isProfile: true },
    { key: 'employeeId', label: 'Manager ID' },
    { key: 'name', label: 'Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile Number' },
    { key: 'experience', label: 'Experience' },
    { key: 'shift', label: 'Default Shift' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
]

const rows = [
    {
        employeeId: 'GKM-1001',
        name: 'Arun Prakash',
        gender: 'Male',
        email: 'arun.prakash@school.com',
        mobile: '9988776655',
        experience: '12 Years',
        shift: 'Rotational',
        city: 'Chennai',
        state: 'Tamil Nadu',
    },
    {
        employeeId: 'GKM-1002',
        name: 'Lakshmi Narayanan',
        gender: 'Female',
        email: 'lakshmi.n@school.com',
        mobile: '9876123456',
        experience: '9 Years',
        shift: 'Morning',
        city: 'Trichy',
        state: 'Tamil Nadu',
    },
]

const GateKeeperManagerList = () => (
    <EmployeeListPage
        title="Gate Keeper Manager List"
        columns={columns}
        rows={rows}
        viewPath="/principal/employees-management/view-gatekeeper-manager"
    />
)

export default GateKeeperManagerList
