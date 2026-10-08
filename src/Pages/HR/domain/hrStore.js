import { HR_KEYS, loadHrCollection, saveHrCollection } from './hrStorage'
import { SEED, ONBOARDING_ITEMS } from './hrSeed'
import { PAYROLL_CONFIG } from './payrollConfig'
import { buildSalaryRow, calculateReferralBonus, summarizePayroll } from './payrollCalculations'
import { isLockedStatus } from './hrStatus'

const cache = {}

const asList = (value, fallback) => {
    const source = Array.isArray(value) ? value : fallback
    return (Array.isArray(source) ? source : []).filter((item) => item && typeof item === 'object')
}

const read = (key, fallback) => {
    if (cache[key] === undefined) {
        cache[key] = loadHrCollection(key, fallback)
    }
    if (Array.isArray(fallback)) {
        const clean = asList(cache[key], fallback)
        cache[key] = clean
        return clean
    }
    return cache[key] && typeof cache[key] === 'object' ? cache[key] : fallback
}

const write = (key, value) => {
    const stored = Array.isArray(value) ? asList(value, []) : value
    cache[key] = stored
    saveHrCollection(key, stored)
}

export const getEmployees = () => read(HR_KEYS.employees, SEED.employees)
export const getEmployee = (id) => getEmployees().find((item) => item?.id === id) || null
export const saveEmployees = (rows) => write(HR_KEYS.employees, rows)

export const getDocuments = () => read(HR_KEYS.documents, SEED.documents)
export const saveDocuments = (rows) => write(HR_KEYS.documents, rows)

export const getJobs = () => read(HR_KEYS.jobs, SEED.jobs)
export const saveJobs = (rows) => write(HR_KEYS.jobs, rows)

export const getCandidates = () => read(HR_KEYS.candidates, SEED.candidates)
export const saveCandidates = (rows) => write(HR_KEYS.candidates, rows)

export const getInterviews = () => read(HR_KEYS.interviews, SEED.interviews)
export const saveInterviews = (rows) => write(HR_KEYS.interviews, rows)

export const getOffers = () => read(HR_KEYS.offers, SEED.offers)
export const saveOffers = (rows) => write(HR_KEYS.offers, rows)

export const getOnboarding = () => read(HR_KEYS.onboarding, SEED.onboarding)
export const saveOnboarding = (rows) => write(HR_KEYS.onboarding, rows)

export const getObservations = () => read(HR_KEYS.observations, SEED.observations)
export const saveObservations = (rows) => write(HR_KEYS.observations, rows)

export const getShadow = () => read(HR_KEYS.shadow, SEED.shadow)
export const saveShadow = (rows) => write(HR_KEYS.shadow, rows)

export const getTraining = () => read(HR_KEYS.training, SEED.training)
export const saveTraining = (rows) => write(HR_KEYS.training, rows)

export const getLeaveBundle = () => {
    const bundle = read(HR_KEYS.leave, SEED.leave)
    if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) {
        return { policies: asList(SEED.leave.policies, []), requests: asList(SEED.leave.requests, []) }
    }
    return {
        ...bundle,
        policies: asList(bundle.policies, SEED.leave.policies),
        requests: asList(bundle.requests, SEED.leave.requests),
    }
}
export const saveLeaveBundle = (value) => write(HR_KEYS.leave, value)

export const getAttendance = () => read(HR_KEYS.attendance, SEED.attendance)
export const saveAttendance = (rows) => write(HR_KEYS.attendance, rows)

export const getPayrollBundle = () => read(HR_KEYS.payroll, SEED.payroll)
export const savePayrollBundle = (value) => write(HR_KEYS.payroll, value)

export const getPayslips = () => read(HR_KEYS.payslips, SEED.payslips)
export const savePayslips = (rows) => write(HR_KEYS.payslips, rows)

export const getAdvances = () => read(HR_KEYS.advances, SEED.advances)
export const saveAdvances = (rows) => write(HR_KEYS.advances, rows)

export const getReferrals = () => read(HR_KEYS.referrals, SEED.referrals)
export const saveReferrals = (rows) => write(HR_KEYS.referrals, rows)

export const getConcessions = () => read(HR_KEYS.concessions, SEED.concessions)
export const saveConcessions = (rows) => write(HR_KEYS.concessions, rows)

export const getDisciplinary = () => {
    const rows = read(HR_KEYS.disciplinary, SEED.disciplinary)
    const ids = new Set(rows.map((item) => item.id))
    const missing = (SEED.disciplinary || []).filter((item) => item?.id && !ids.has(item.id))
    if (!missing.length) return rows
    const next = [...rows, ...missing]
    cache[HR_KEYS.disciplinary] = next
    saveHrCollection(HR_KEYS.disciplinary, next)
    return next
}
export const saveDisciplinary = (rows) => write(HR_KEYS.disciplinary, rows)

export const getExits = () => read(HR_KEYS.exit, SEED.exits)
export const saveExits = (rows) => write(HR_KEYS.exit, rows)

export const getPerformance = () => read(HR_KEYS.performance, SEED.performance)
export const savePerformance = (rows) => write(HR_KEYS.performance, rows)

export const getNotifications = () => read(HR_KEYS.notifications, SEED.notifications)
export const saveNotifications = (rows) => write(HR_KEYS.notifications, rows)

export const getComms = () => read(HR_KEYS.comms, SEED.comms)
export const saveComms = (rows) => write(HR_KEYS.comms, rows)

export const nextId = (prefix, rows) => {
    const numbers = asList(rows, []).map((row) => Number(String(row.id).split('-').pop())).filter((n) => !Number.isNaN(n))
    const next = (numbers.length ? Math.max(...numbers) : 0) + 1
    return `${prefix}-${String(next).padStart(3, '0')}`
}

export const employeeName = (id) => getEmployee(id)?.name || id || '—'

export const pushNotification = (notice) => {
    const rows = getNotifications()
    saveNotifications([{ id: nextId('HR-NTF', rows), isRead: false, postedBy: 'HR', notificationDate: '24-09-2026', relatedDate: '', ...notice }, ...rows])
}

export const queueCommunication = ({ channel, subject, audience }) => {
    const rows = getComms()
    const record = { id: nextId('COM', rows), channel, subject, audience, status: 'DEMO_SENT', at: '24-09-2026 12:30' }
    saveComms([record, ...rows])
    return record
}

export const completionOf = (record) => {
    const items = record?.checklist || []
    if (!items.length) return 0
    const done = items.filter((item) => item.status === 'Completed').length
    return Math.round((done / items.length) * 100)
}

export const blankChecklist = () => ONBOARDING_ITEMS.map((label) => ({ label, status: 'Not Started' }))

const monthRow = (employeeId, month, year) => {
    const bundle = getPayrollBundle()
    return (bundle.months || []).find((item) => item?.employeeId === employeeId && item.month === month && Number(item.year) === Number(year))
        || { employeeId, month, year: Number(year), workingDays: 26, lates: 0, permission: 0, casualLeave: 0, otherLeave: 0, absent: 0, notPunched: 0, paymentStatus: 'Unpaid', bankRef: '', paymentDate: '', paymentMode: 'Bank Transfer' }
}

export const salaryRows = (month, year, filters = {}) => {
    return getEmployees()
        .filter((employee) => !filters.category || employee.category === filters.category)
        .filter((employee) => !filters.department || employee.department === filters.department)
        .filter((employee) => !filters.status || employee.status === filters.status)
        .filter((employee) => !filters.search || `${employee.name} ${employee.id}`.toLowerCase().includes(filters.search.toLowerCase()))
        .map((employee) => buildSalaryRow({
            employee,
            attendance: monthRow(employee.id, month, year),
            advances: getAdvances(),
            disciplinaryActions: getDisciplinary(),
            month,
            year,
        }))
}

export const payrollSummary = (month, year) => summarizePayroll(salaryRows(month, year))

export const upsertPayslip = (row, month, year) => {
    const slips = getPayslips().filter((item) => !(item.employeeId === row.employeeId && item.month === month && Number(item.year) === Number(year)))
    const slip = { ...row, month, year: Number(year), id: `PSL-${row.employeeId}-${month}-${year}` }
    savePayslips([slip, ...slips])
    return slip
}

export const ensurePayslips = (month, year) => {
    salaryRows(month, year).forEach((row) => upsertPayslip(row, month, year))
    return getPayslips().filter((item) => item.month === month && Number(item.year) === Number(year))
}

export const applyRevision = (revision) => {
    if (revision.status !== 'Applied') return
    const employees = getEmployees().map((employee) => (
        employee.id === revision.employeeId
            ? { ...employee, designation: revision.newDesignation, grossSalary: Number(revision.revisedGross) }
            : employee
    ))
    saveEmployees(employees)
}

export const referralAmountFor = (grossSalary) => calculateReferralBonus(grossSalary)

export const canMutate = (record) => !isLockedStatus(record?.status)

export const advanceNext = (status) => {
    const flow = ['DRAFT', 'SUBMITTED', 'HR_REVIEW', 'FINANCE_REVIEW', 'JD_REVIEW', 'DIRECTOR_REVIEW', 'MD_REVIEW', 'APPROVED']
    const index = flow.indexOf(status)
    return index >= 0 && index < flow.length - 1 ? flow[index + 1] : status
}

export { PAYROLL_CONFIG }
