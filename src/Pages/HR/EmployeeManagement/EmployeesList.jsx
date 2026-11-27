import React, { useMemo, useState } from 'react'
import { NavLink, useSearchParams } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Download, EllipsisIcon } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import { toast } from 'react-toastify'
import { ROLES } from '../../../constants/roles'
import { DEPARTMENTS, EMPLOYEE_CATEGORIES, EMPLOYEE_STATUSES } from '../domain/hrStatus'
import { getEmployees, nextId, saveEmployees } from '../domain/hrStore'
import { createStaff } from '../../../services/hrApi'
import { HrExport, Modal, PageIntro, PrimaryButton, SearchBox, Select, TableWrap, Badge, inputClass, td, th, useFilters, useHrTick, matches } from '../components/HrUi'

const STAFF_ROLES = Object.values(ROLES).filter((code) => !['superadmin', 'admin', 'student', 'parent'].includes(code))

const DESIGNATION_SUGGESTIONS = [
    'Teacher — Mathematics',
    'Teacher — English',
    'Teacher — Science',
    'Senior Teacher',
    'Coordinator',
    'HR Executive',
    'Accounts Executive',
    'Office Assistant',
    'IT Support Engineer',
    'School Driver',
    'Security Guard',
]

/** HR stores dates as DD-MM-YYYY; DatePicker uses Date objects. */
const parseHrDate = (value) => {
    if (!value) return null
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value
    const text = String(value).trim()
    const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (dmy) {
        const parsed = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
        return Number.isNaN(parsed.getTime()) ? null : parsed
    }
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) {
        const parsed = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
        return Number.isNaN(parsed.getTime()) ? null : parsed
    }
    const fallback = new Date(text)
    return Number.isNaN(fallback.getTime()) ? null : fallback
}

const formatHrDate = (value) => {
    const date = value instanceof Date ? value : parseHrDate(value)
    if (!date) return ''
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${day}-${month}-${date.getFullYear()}`
}

const emptyForm = {
    name: '', gender: 'Female', dateOfBirth: '', contact: '', email: '', address: '',
    department: 'Academic', designation: '', joiningDate: '', status: 'Active', reportingManager: '',
    role: '', qualification: '', experience: '', emergencyContact: '', employmentType: 'Full Time',
    category: 'Academics', grossSalary: '',
}

const DateField = ({ label, value, onChange, required = false }) => (
    <label className='text-sm text-[#808080] flex flex-col gap-y-1'>
        <span>{label}{required ? ' *' : ''}</span>
        <div className='relative'>
            <DatePicker
                selected={parseHrDate(value)}
                onChange={(date) => onChange(date ? formatHrDate(date) : '')}
                dateFormat='dd-MM-yyyy'
                placeholderText='DD-MM-YYYY'
                showMonthDropdown
                showYearDropdown
                dropdownMode='select'
                isClearable
                className={`${inputClass} pr-10`}
                wrapperClassName='w-full'
            />
            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
        </div>
    </label>
)

const EmployeesList = () => {
    const tick = useHrTick()
    const [params] = useSearchParams()
    const rows = useMemo(() => getEmployees(), [tick])
    const { filters, set, clear } = useFilters({ search: '', department: params.get('department') || '', status: '', category: '' })
    const [exportOpen, setExportOpen] = useState(false)
    const [form, setForm] = useState(null)
    const [saving, setSaving] = useState(false)

    const filtered = rows.filter((row) => (
        (!filters.search || matches(`${row.id} ${row.name} ${row.designation}`, filters.search))
        && (!filters.department || row.department === filters.department)
        && (!filters.status || row.status === filters.status)
        && (!filters.category || row.category === filters.category)
    ))

    const save = async (event) => {
        event.preventDefault()
        if (saving) return
        if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email are required.')
        if (!form.role) return toast.error('Pick a role from the fixed list.')
        if (!String(form.designation || '').trim()) return toast.error('Enter a designation (for example: Teacher — Mathematics).')
        if (!form.joiningDate || !parseHrDate(form.joiningDate)) {
            return toast.error('Pick a joining date from the calendar.')
        }
        const current = getEmployees()
        const payload = {
            ...form,
            designation: String(form.designation).trim(),
            joiningDate: formatHrDate(form.joiningDate),
            dateOfBirth: form.dateOfBirth ? formatHrDate(form.dateOfBirth) : '',
            grossSalary: Number(form.grossSalary) || 0,
            otherAllowance: 0,
            specialDeduction: 0,
            otherEmployerBenefits: 0,
        }
        if (form.id) {
            saveEmployees(current.map((row) => (row.id === form.id ? { ...row, department: form.department, role: form.role, reportingManager: form.reportingManager } : row)))
            toast.success('Transfer saved. The previous department and role stay in history.')
            setForm(null)
            return
        }
        const id = nextId('EMP-QMIS', current)
        if (current.some((row) => row.id === id)) return toast.error('Employee ID must be unique.')
        const draft = { ...payload, id }
        setSaving(true)
        try {
            const created = await createStaff(draft)
            const { temporaryPassword, ...row } = created
            saveEmployees([row, ...current.filter((item) => item.id !== row.id)])
            toast.success(temporaryPassword
                ? `Staff login created. Temporary password: ${temporaryPassword}. It must be changed on first login.`
                : 'Staff record saved to the server.')
            setForm(null)
        } catch (error) {
            toast.error(error?.message || 'Could not save the employee to the server. Fix the form and try again.')
        } finally {
            setSaving(false)
        }
    }

    const setStatus = (employee, status) => {
        saveEmployees(getEmployees().map((row) => (row.id === employee.id ? { ...row, status } : row)))
        toast.success(`${employee.name} marked ${status}.`)
    }

    return (
        <section>
            <PageIntro text='HR creates each staff profile once. After saving, only a department or role transfer is allowed. Salary changes go through increment, and leaving goes through exit.'>
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
                                        <button type='button' className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded' onClick={() => setForm(employee)}>Transfer</button>
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
                <Modal title={form.id ? 'Transfer department or role' : 'Add Employee'} onClose={() => !saving && setForm(null)} wide>
                    <form onSubmit={save} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {form.id ? null : (
                            <>
                                <label className='text-sm text-[#808080]'>Full name *
                                    <input className={`${inputClass} mt-1`} value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                                </label>
                                <label className='text-sm text-[#808080]'>Gender
                                    <select className={`${inputClass} mt-1`} value={form.gender || ''} onChange={(event) => setForm({ ...form, gender: event.target.value })}>
                                        <option value='Female'>Female</option>
                                        <option value='Male'>Male</option>
                                        <option value='Other'>Other</option>
                                    </select>
                                </label>
                                <DateField
                                    label='Date of birth'
                                    value={form.dateOfBirth}
                                    onChange={(value) => setForm({ ...form, dateOfBirth: value })}
                                />
                                <label className='text-sm text-[#808080]'>Contact
                                    <input className={`${inputClass} mt-1`} value={form.contact || ''} onChange={(event) => setForm({ ...form, contact: event.target.value })} placeholder='Mobile number' />
                                </label>
                                <label className='text-sm text-[#808080]'>Email *
                                    <input type='email' className={`${inputClass} mt-1`} value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
                                </label>
                                <label className='text-sm text-[#808080]'>Address
                                    <input className={`${inputClass} mt-1`} value={form.address || ''} onChange={(event) => setForm({ ...form, address: event.target.value })} />
                                </label>
                                <label className='text-sm text-[#808080] md:col-span-2'>Designation *
                                    <input
                                        list='hr-designation-suggestions'
                                        className={`${inputClass} mt-1`}
                                        value={form.designation || ''}
                                        onChange={(event) => setForm({ ...form, designation: event.target.value })}
                                        placeholder='e.g. Teacher — Computer Science'
                                        required
                                    />
                                    <datalist id='hr-designation-suggestions'>
                                        {DESIGNATION_SUGGESTIONS.map((item) => (
                                            <option key={item} value={item} />
                                        ))}
                                    </datalist>
                                    <span className='text-xs text-[#667085] mt-1 block'>Type a job title, or pick a suggestion. This is saved to the employee record.</span>
                                </label>
                                <DateField
                                    label='Joining date'
                                    value={form.joiningDate}
                                    onChange={(value) => setForm({ ...form, joiningDate: value })}
                                    required
                                />
                                <label className='text-sm text-[#808080]'>Gross salary
                                    <input type='number' min='0' className={`${inputClass} mt-1`} value={form.grossSalary || ''} onChange={(event) => setForm({ ...form, grossSalary: event.target.value })} />
                                </label>
                                <label className='text-sm text-[#808080]'>Qualification
                                    <input className={`${inputClass} mt-1`} value={form.qualification || ''} onChange={(event) => setForm({ ...form, qualification: event.target.value })} />
                                </label>
                                <label className='text-sm text-[#808080]'>Experience
                                    <input className={`${inputClass} mt-1`} value={form.experience || ''} onChange={(event) => setForm({ ...form, experience: event.target.value })} placeholder='e.g. 5 years' />
                                </label>
                                <label className='text-sm text-[#808080] md:col-span-2'>Emergency contact
                                    <input className={`${inputClass} mt-1`} value={form.emergencyContact || ''} onChange={(event) => setForm({ ...form, emergencyContact: event.target.value })} />
                                </label>
                            </>
                        )}
                        <Select label='Role' value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} options={STAFF_ROLES} allLabel='Select role' />
                        <Select label='Department' value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} options={DEPARTMENTS} allLabel='Select' />
                        <label className='text-sm text-[#808080]'>Reporting head
                            <input className={`${inputClass} mt-1`} value={form.reportingManager || ''} onChange={(event) => setForm({ ...form, reportingManager: event.target.value })} />
                        </label>
                        {form.id ? null : <Select label='Category' value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} options={EMPLOYEE_CATEGORIES} allLabel='Select' />}
                        {form.id ? null : <Select label='Status' value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} options={EMPLOYEE_STATUSES} allLabel='Select' />}
                        {form.id ? null : <label className='text-sm text-[#808080]'>Employment Type
                            <select className={`${inputClass} mt-1`} value={form.employmentType} onChange={(event) => setForm({ ...form, employmentType: event.target.value })}>
                                <option>Full Time</option><option>Part Time</option>
                            </select>
                        </label>}
                        <div className='md:col-span-2 flex justify-end gap-2'>
                            <button type='button' disabled={saving} onClick={() => setForm(null)} className='bg-white text-[#515DEF] text-sm px-4 py-2 rounded-md border border-[#515DEF] cursor-pointer disabled:opacity-60'>Cancel</button>
                            <PrimaryButton type='submit'>{saving ? 'Saving…' : 'Save'}</PrimaryButton>
                        </div>
                    </form>
                </Modal>
            )}
            <HrExport open={exportOpen} setOpen={setExportOpen} filename='hr-employees' rows={filtered.map(({ id, name, department, category, designation, status, joiningDate }) => ({ id, name, department, category, designation, status, joiningDate }))} />
        </section>
    )
}

export default EmployeesList
