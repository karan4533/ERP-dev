import React, { useMemo, useState } from 'react'
import { NavLink, useSearchParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import { toast } from 'react-toastify'
import { ConfirmAction, DataTable } from '../../../Common/ui'
import { DEPARTMENTS, EMPLOYEE_CATEGORIES, EMPLOYEE_STATUSES } from '../domain/hrStatus'
import { getEmployees, nextId, saveEmployees } from '../domain/hrStore'
import { HrExport, Modal, PageIntro, PrimaryButton, SearchBox, Select, TableWrap, Badge, inputClass } from '../components/HrUi'
import { matches, useFilters, useHrTick } from '../components/hrUiState'

const emptyForm = {
    name: '', gender: 'Female', dateOfBirth: '', contact: '', email: '', address: '',
    department: 'Academic', designation: '', joiningDate: '', status: 'Active', reportingManager: '',
    role: '', qualification: '', experience: '', emergencyContact: '', employmentType: 'Full Time',
    category: 'Academics', grossSalary: '',
}

const EmployeesList = () => {
    const tick = useHrTick()
    const [params] = useSearchParams()
    const rows = useMemo(() => {
        void tick
        return getEmployees()
    }, [tick])
    const { filters, set, clear } = useFilters({ search: '', department: params.get('department') || '', status: '', category: '' })
    const [exportOpen, setExportOpen] = useState(false)
    const [form, setForm] = useState(null)
    const [statusCandidate, setStatusCandidate] = useState(null)

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
        setStatusCandidate(null)
    }

    const columns = [
        { key: 'id', label: 'Employee ID', required: true },
        { key: 'name', label: 'Name', required: true },
        { key: 'department', label: 'Department' },
        { key: 'category', label: 'Category' },
        { key: 'designation', label: 'Designation' },
        { key: 'status', label: 'Status', render: (employee) => <Badge value={employee.status} /> },
        { key: 'joiningDate', label: 'Joining Date' },
    ]

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
                <DataTable
                    caption='HR employee register'
                    rows={filtered}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No employees match these filters'
                    emptyDescription='Clear one or more filters, or add an employee if you have permission.'
                    renderActions={(employee) => (
                        <>
                            <NavLink to={`/hr/employee-management/employee-profile/${employee.id}`} className='inline-flex min-h-9 items-center rounded-md border border-[#D9D9D9] px-3 text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7]'>View</NavLink>
                            <button type='button' className='min-h-9 rounded-md border border-[#515DEF] px-3 text-xs font-semibold text-[#515DEF] hover:bg-[#F1F2FF]' onClick={() => setForm(employee)}>Edit</button>
                            <button
                                type='button'
                                className={`min-h-9 rounded-md px-3 text-xs font-semibold ${employee.status === 'Inactive' ? 'border border-[#039855] text-[#027A48] hover:bg-[#ECFDF3]' : 'border border-[#D92D20] text-[#B42318] hover:bg-[#FEF3F2]'}`}
                                onClick={() => setStatusCandidate({ employee, status: employee.status === 'Inactive' ? 'Active' : 'Inactive' })}
                            >
                                {employee.status === 'Inactive' ? 'Activate' : 'Deactivate'}
                            </button>
                        </>
                    )}
                />
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
            <ConfirmAction
                open={Boolean(statusCandidate)}
                onClose={() => setStatusCandidate(null)}
                onConfirm={() => statusCandidate && setStatus(statusCandidate.employee, statusCandidate.status)}
                title={`${statusCandidate?.status === 'Active' ? 'Activate' : 'Deactivate'} employee?`}
                description='This changes the employee status used by the HR demo workflows.'
                confirmLabel={statusCandidate?.status === 'Active' ? 'Activate employee' : 'Deactivate employee'}
                tone={statusCandidate?.status === 'Inactive' ? 'danger' : 'primary'}
            >
                <p><strong>{statusCandidate?.employee.name}</strong> will be marked {statusCandidate?.status?.toLowerCase()}. The change is saved in this browser; a production backend must also record the actor, reason, timestamp, and downstream access effects.</p>
            </ConfirmAction>
            <HrExport open={exportOpen} setOpen={setExportOpen} filename='hr-employees' rows={filtered.map(({ id, name, department, category, designation, status, joiningDate }) => ({ id, name, department, category, designation, status, joiningDate }))} />
        </section>
    )
}

export default EmployeesList
