import React, { useMemo, useState } from 'react'
import { NavLink, useSearchParams } from 'react-router-dom'
import { Download, EllipsisIcon } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import { toast } from 'react-toastify'
import { DEPARTMENTS, EMPLOYEE_CATEGORIES, EMPLOYEE_STATUSES } from '../domain/hrStatus'
import { getEmployees, nextId, saveEmployees } from '../domain/hrStore'
import { HrExport, Modal, PageIntro, PrimaryButton, SearchBox, Select, TableWrap, Badge, inputClass, td, th, useFilters, useHrTick, matches } from '../components/HrUi'

const emptyForm = {
    name: '', gender: 'Female', dateOfBirth: '', contact: '', email: '', address: '',
    department: 'Academic', designation: '', joiningDate: '', status: 'Active', reportingManager: '',
    role: '', qualification: '', experience: '', emergencyContact: '', employmentType: 'Full Time',
    category: 'Academics', grossSalary: '',
}

const EmployeesList = () => {
    const tick = useHrTick()
    const [params] = useSearchParams()
    const rows = useMemo(() => getEmployees(), [tick])
    const { filters, set, clear } = useFilters({ search: '', department: params.get('department') || '', status: '', category: '' })
    const [exportOpen, setExportOpen] = useState(false)
    const [form, setForm] = useState(null)

    const filtered = rows.filter((row) => (
        (!filters.search || matches(`${row.id} ${row.name} ${row.designation}`, filters.search))
        && (!filters.department || row.department === filters.department)
        && (!filters.status || row.status === filters.status)
        && (!filters.category || row.category === filters.category)
    ))

    const save = (event) => {
        event.preventDefault()
        if (!form.name.trim()) return toast.error('Employee name is required.')
        if (!form.designation.trim() || !form.joiningDate) return toast.error('Designation and joining date are required.')
        const current = getEmployees()
        if (form.id) {
            saveEmployees(current.map((row) => (row.id === form.id ? { ...row, ...form, grossSalary: Number(form.grossSalary) || 0 } : row)))
            toast.success('Employee updated.')
        } else {
            const id = nextId('EMP-2026', current)
            if (current.some((row) => row.id === id)) return toast.error('Employee ID must be unique.')
            saveEmployees([{ ...form, id, grossSalary: Number(form.grossSalary) || 0, otherAllowance: 0, specialDeduction: 0, otherEmployerBenefits: 0 }, ...current])
            toast.success('Employee created.')
        }
        setForm(null)
    }

    const setStatus = (employee, status) => {
        saveEmployees(getEmployees().map((row) => (row.id === employee.id ? { ...row, status } : row)))
        toast.success(`${employee.name} marked ${status}.`)
    }

    return (
        <section>
            <PageIntro text='Create, view, and update one employee record used across recruitment, payroll, and exit.'>
                <div className='flex justify-end mb-4'><PrimaryButton onClick={clear}>Clear Filters</PrimaryButton></div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <SearchBox value={filters.search} onChange={set('search')} placeholder='Employee ID, name...' />
                    <Select label='Department' value={filters.department} onChange={set('department')} options={DEPARTMENTS} />
                    <Select label='Category' value={filters.category} onChange={set('category')} options={EMPLOYEE_CATEGORIES} />
                    <Select label='Status' value={filters.status} onChange={set('status')} options={EMPLOYEE_STATUSES} />
                </div>
            </PageIntro>
            <TableWrap title='Employees List' action={(
                <>
                    <PrimaryButton onClick={() => setForm({ ...emptyForm })}>Add Employee</PrimaryButton>
                    <button type='button' onClick={() => setExportOpen(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md flex items-center gap-2 cursor-pointer'><Download size={16} /> Export</button>
                </>
            )}>
                <table className='w-full text-sm text-left'>
                    <thead className='bg-[#EDEEF5]'><tr>
                        {['Employee ID', 'Name', 'Department', 'Category', 'Designation', 'Status', 'Joining Date', 'Actions'].map((label) => <th key={label} className={th}>{label}</th>)}
                    </tr></thead>
                    <tbody>
                        {filtered.map((employee) => (
                            <tr key={employee.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                <td className={`${td} font-medium text-[#1E1E1E]`}>{employee.id}</td>
                                <td className={td}>{employee.name}</td>
                                <td className={td}>{employee.department}</td>
                                <td className={td}>{employee.category}</td>
                                <td className={td}>{employee.designation}</td>
                                <td className={td}><Badge value={employee.status} /></td>
                                <td className={td}>{employee.joiningDate}</td>
                                <td className={td}>
                                    <Dropdown buttonContent={<EllipsisIcon size={16} />}>
                                        <NavLink to={`/hr/employee-management/employee-profile/${employee.id}`} className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded'>View Profile</NavLink>
                                        <button type='button' className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded' onClick={() => setForm(employee)}>Edit</button>
                                        <button type='button' className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded' onClick={() => setStatus(employee, employee.status === 'Inactive' ? 'Active' : 'Inactive')}>{employee.status === 'Inactive' ? 'Activate' : 'Deactivate'}</button>
                                    </Dropdown>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className='text-sm text-[#515DEF] mt-4'>Showing {filtered.length} of {rows.length} employees</p>
            </TableWrap>
            {form && (
                <Modal title={form.id ? 'Edit Employee' : 'Add Employee'} onClose={() => setForm(null)} wide>
                    <form onSubmit={save} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {['name', 'gender', 'dateOfBirth', 'contact', 'email', 'address', 'designation', 'joiningDate', 'reportingManager', 'role', 'qualification', 'experience', 'emergencyContact', 'grossSalary'].map((key) => (
                            <label key={key} className='text-sm text-[#808080] capitalize'>{key}
                                <input className={`${inputClass} mt-1`} value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
                            </label>
                        ))}
                        <Select label='Department' value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} options={DEPARTMENTS} allLabel='Select' />
                        <Select label='Category' value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} options={EMPLOYEE_CATEGORIES} allLabel='Select' />
                        <Select label='Status' value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} options={EMPLOYEE_STATUSES} allLabel='Select' />
                        <label className='text-sm text-[#808080]'>Employment Type
                            <select className={`${inputClass} mt-1`} value={form.employmentType} onChange={(event) => setForm({ ...form, employmentType: event.target.value })}>
                                <option>Full Time</option><option>Part Time</option>
                            </select>
                        </label>
                        <div className='md:col-span-2 flex justify-end'><PrimaryButton type='submit'>Save</PrimaryButton></div>
                    </form>
                </Modal>
            )}
            <HrExport open={exportOpen} setOpen={setExportOpen} filename='hr-employees' rows={filtered.map(({ id, name, department, category, designation, status, joiningDate }) => ({ id, name, department, category, designation, status, joiningDate }))} />
        </section>
    )
}

export default EmployeesList
