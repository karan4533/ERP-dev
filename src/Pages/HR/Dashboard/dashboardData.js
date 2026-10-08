import { formatInr, summarizePayroll } from '../domain/payrollCalculations'
import { PAYROLL_MONTHS } from '../domain/payrollConfig'
import {
    employeeName, getAdvances, getAttendance, getCandidates, getDisciplinary, getEmployees, getExits,
    getInterviews, getJobs, getLeaveBundle, getNotifications, getOffers, getOnboarding, getPerformance,
    getTraining, salaryRows,
} from '../domain/hrStore'

export const ACADEMIC_YEARS = ['2026–2027', '2025–2026']
export const DASHBOARD_DEPARTMENTS = ['All Departments', 'Academics', 'Administration', 'Transport', 'Housekeeping', 'Security', 'Hostel', 'ECA', 'Other']
export const DASHBOARD_MONTHS = PAYROLL_MONTHS

const MONTH_INDEX = { April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12, January: 1, February: 2, March: 3 }
const GROUP_DEPARTMENTS = {
    Academics: ['Academic'],
    Administration: ['Administration', 'Finance', 'HR', 'IT Support'],
    Transport: ['Transport'],
    Housekeeping: ['Housekeeping'],
    Security: ['Security'],
    Hostel: ['Hostel'],
    ECA: ['ECA'],
}

const list = (rows) => (Array.isArray(rows) ? rows : []).filter((item) => item && typeof item === 'object')

const parseDate = (value) => {
    const parts = String(value || '').split('-')
    if (parts.length !== 3) return null
    const [day, month, year] = parts.map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

const inAcademicYear = (date, yearLabel) => {
    if (!date) return false
    const startYear = Number(String(yearLabel).slice(0, 4))
    if (!startYear) return true
    const start = new Date(startYear, 3, 1)
    const end = new Date(startYear + 1, 2, 31)
    return date >= start && date <= end
}

const monthOf = (date) => date ? date.getMonth() + 1 : 0

const matchesDepartment = (employee, department) => {
    if (!employee || !department || department === 'All Departments') return true
    const known = Object.values(GROUP_DEPARTMENTS).flat()
    if (department === 'Other') return !known.includes(employee.department) && employee.category !== 'ECA'
    if (department === 'ECA') return employee.category === 'ECA' || employee.department === 'ECA'
    return (GROUP_DEPARTMENTS[department] || []).includes(employee.department)
}

const groupName = (employee) => {
    if (!employee) return 'Others'
    if (employee.category === 'ECA' || employee.department === 'ECA') return 'ECA'
    const found = Object.entries(GROUP_DEPARTMENTS).find(([, names]) => names.includes(employee.department))
    return found ? found[0] : 'Others'
}

const priorityFor = (count) => (count >= 5 ? 'High Priority' : count >= 2 ? 'Attention' : 'Normal')

const payrollFor = (employees, month, year) => {
    const ids = new Set(employees.map((item) => item.id))
    return summarizePayroll(salaryRows(month, year).filter((row) => row && ids.has(row.employeeId)))
}

export const buildHrDashboard = ({ academicYear = '2026–2027', department = 'All Departments', month = 'September', revision = 0 } = {}) => {
    void revision
    const monthNumber = MONTH_INDEX[month] || 9
    const employees = list(getEmployees()).filter((item) => matchesDepartment(item, department))
    const ids = new Set(employees.map((item) => item.id))
    const inScope = (row) => row && (!row.employeeId || ids.has(row.employeeId))
    const dated = (value) => {
        const date = parseDate(value)
        return date && inAcademicYear(date, academicYear) && monthOf(date) === monthNumber
    }

    const active = employees.filter((item) => item.status === 'Active' || item.status === 'Probation' || item.status === 'On Leave')
    const inactive = employees.filter((item) => item.status === 'Inactive' || item.status === 'Relieved')
    const joiners = employees.filter((item) => dated(item.joiningDate))
    const attendance = list(getAttendance()).filter((item) => inScope(item) && dated(item.date))
    const latestDate = attendance.map((item) => item.date).sort((a, b) => (parseDate(a) || 0) - (parseDate(b) || 0)).at(-1) || ''
    const today = latestDate ? attendance.filter((item) => item.date === latestDate) : []
    const countStatus = (status) => today.filter((item) => item.status === status).length
    const attendanceCounts = {
        Present: countStatus('Present'),
        Leave: countStatus('Leave'),
        Absent: countStatus('Absent'),
        'On Duty': countStatus('On Duty'),
        Late: countStatus('Late'),
    }
    const attendanceTotal = Object.values(attendanceCounts).reduce((sum, value) => sum + value, 0)
    const attendanceRate = attendanceTotal ? Math.round(((attendanceCounts.Present + attendanceCounts.Late) / attendanceTotal) * 1000) / 10 : 0

    const leaveRequests = list(getLeaveBundle().requests).filter(inScope)
    const pendingLeave = leaveRequests.filter((item) => item.status === 'Pending')
    const onLeaveNow = employees.filter((item) => item.status === 'On Leave')
    const leaveGroups = ['Academics', 'Administration', 'Support'].map((label) => ({
        label,
        count: onLeaveNow.filter((item) => (label === 'Support' ? !['Academics', 'Administration'].includes(groupName(item)) : groupName(item) === label)).length,
    }))

    const allJobs = list(getJobs())
    const jobs = allJobs.filter((item) => item.status === 'Open' && (department === 'All Departments' || matchesDepartment({ department: item.department }, department)))
    const candidates = list(getCandidates()).filter((item) => {
        if (department === 'All Departments') return true
        const job = allJobs.find((opening) => opening.id === item.jobId)
        return matchesDepartment({ department: job?.department }, department)
    })
    const stageCount = (status) => candidates.filter((item) => item.status === status).length
    const offers = list(getOffers()).filter((item) => item.kind === 'Offer' && (department === 'All Departments' || matchesDepartment({ department: item.department }, department)))
    const funnel = [
        { stage: 'Applications', count: candidates.length, to: '/hr/recruitment/candidates' },
        { stage: 'Screening', count: stageCount('Screening'), to: '/hr/recruitment/candidates?status=Screening' },
        { stage: 'Interview', count: stageCount('Interview'), to: '/hr/recruitment/candidates?status=Interview' },
        { stage: 'Selected', count: stageCount('Selected'), to: '/hr/recruitment/candidates?status=Selected' },
        { stage: 'Offer', count: offers.filter((item) => item.status !== 'Draft').length, to: '/hr/onboarding/offers' },
        { stage: 'Joined', count: candidates.filter((item) => item.employeeId).length, to: '/hr/onboarding/joiners' },
    ]

    const onboarding = list(getOnboarding()).filter((item) => inScope(item) && item.overallStatus !== 'Completed')
    const reviews = list(getPerformance()).filter(inScope)
    const pendingReviews = reviews.filter((item) => item.status === 'Pending')
    const advances = list(getAdvances()).filter((item) => inScope(item) && !['APPROVED', 'REJECTED', 'CLOSED'].includes(item.status))
    const disciplinary = list(getDisciplinary()).filter((item) => inScope(item) && item.status !== 'APPROVED')
    const exits = list(getExits()).filter(inScope)
    const pendingExits = exits.filter((item) => item.status !== 'Completed' && item.status !== 'Cancelled')
    const actions = [
        { label: 'Leave requests awaiting approval', count: pendingLeave.length, to: '/hr/leave-management' },
        { label: 'Employees pending onboarding', count: onboarding.length, to: '/hr/onboarding-checklist' },
        { label: 'Performance reviews due', count: pendingReviews.length, to: '/hr/performance-review' },
        { label: 'Salary advance requests', count: advances.length, to: '/hr/payroll/salary-advance' },
        { label: 'Disciplinary reviews', count: disciplinary.length, to: '/hr/disciplinary' },
        { label: 'Exit clearances pending', count: pendingExits.length, to: '/hr/exit' },
    ].map((item) => ({ ...item, priority: priorityFor(item.count) }))

    const workforce = ['Academics', 'Administration', 'Transport', 'Housekeeping', 'Security', 'Hostel', 'ECA', 'Others'].map((name) => {
        const people = employees.filter((item) => groupName(item) === name)
        return { name, count: people.length, percent: employees.length ? Math.round((people.length / employees.length) * 100) : 0 }
    }).filter((item) => department === 'All Departments' || item.name === department || (department === 'Other' && item.name === 'Others'))

    const departmentRows = workforce.filter((item) => item.count || jobs.some((job) => groupName({ department: job.department }) === item.name)).map((item) => {
        const people = employees.filter((employee) => groupName(employee) === item.name)
        const peopleIds = new Set(people.map((employee) => employee.id))
        const present = today.filter((row) => peopleIds.has(row.employeeId) && (row.status === 'Present' || row.status === 'Late')).length
        const leave = people.filter((employee) => employee.status === 'On Leave').length
        const openings = list(getJobs()).filter((job) => job.status === 'Open' && groupName({ department: job.department }) === item.name).reduce((sum, job) => sum + (Number(job.openings) || 1), 0)
        return { department: item.name, employees: people.length, present, leave, openings, status: leave > 0 || openings > 1 ? 'Attention' : 'Stable', to: `/hr/employee-management/employees?department=${encodeURIComponent(GROUP_DEPARTMENTS[item.name]?.[0] || '')}` }
    })

    const interviews = list(getInterviews()).filter((item) => {
        if (item.status !== 'Scheduled' || !dated(item.date)) return false
        if (department === 'All Departments') return true
        const candidate = list(getCandidates()).find((person) => person.id === item.candidateId)
        const job = allJobs.find((opening) => opening.id === candidate?.jobId)
        return matchesDepartment({ department: job?.department }, department)
    })
    const training = list(getTraining()).filter((item) => department === 'All Departments' || matchesDepartment({ department: item.department }, department))
    const monthTraining = training.filter((item) => dated(item.startDate))
    const events = [
        ...interviews.map((item) => ({ date: item.date, time: item.time, title: `${item.level} Interview`, detail: item.position, to: '/hr/recruitment/interviews' })),
        ...monthTraining.filter((item) => item.status === 'Scheduled').map((item) => ({ date: item.startDate, time: item.time, title: item.title, detail: item.department, to: '/hr/training' })),
        ...list(getOffers()).filter((item) => dated(item.joiningDate) && item.status !== 'Draft' && (department === 'All Departments' || matchesDepartment({ department: item.department }, department))).map((item) => ({ date: item.joiningDate, time: '', title: 'New joiner', detail: item.position, to: '/hr/onboarding/joiners' })),
        ...pendingReviews.map((item) => ({ date: '30-09-2026', time: '', title: 'Performance review', detail: employeeName(item.employeeId), to: '/hr/performance-review' })),
        ...pendingExits.map((item) => ({ date: item.lastWorkingDate, time: '', title: 'Exit date', detail: employeeName(item.employeeId), to: '/hr/exit' })),
        { date: `30-${String(monthNumber).padStart(2, '0')}-2026`, time: '', title: 'Payroll processing', detail: month, to: '/hr/payroll/salary-statement' },
    ].filter((item) => {
        const date = parseDate(item.date)
        return inAcademicYear(date, academicYear) && monthOf(date) === monthNumber
    }).sort((a, b) => (parseDate(a.date) || 0) - (parseDate(b.date) || 0)).filter((item, index, rows) => rows.findIndex((other) => other.date === item.date && other.title === item.title && other.detail === item.detail) === index).slice(0, 6)

    const selectedPayroll = payrollFor(employees, month, 2026)
    const trend = PAYROLL_MONTHS.filter((name) => inAcademicYear(new Date(2026, (MONTH_INDEX[name] || 1) - 1, 15), academicYear)).map((name) => {
        const summary = payrollFor(employees, name, 2026)
        return { month: name.slice(0, 3), gross: summary.totals.grossSalary, net: summary.totals.netSalary }
    })

    const ratingOrder = ['Above Average', 'Average', 'Below Average']
    const ratings = ratingOrder.map((rating) => ({ rating, count: reviews.filter((item) => item.rating === rating).length }))
    const average = (key) => reviews.length ? Math.round(reviews.reduce((sum, item) => sum + (Number(item[key]) || 0), 0) / reviews.length) : 0
    const completedTraining = training.filter((item) => item.status === 'Completed')
    const trained = new Set(completedTraining.flatMap((item) => item.participantIds || [])).size
    const feedbackScores = training.flatMap((item) => list(item.feedback).map((row) => Number(row.overall) || 0))
    const movement = [
        ...joiners.map((item) => ({ name: item.name, detail: `Joined — ${item.designation}`, to: `/hr/employee-management/employee-profile/${item.id}` })),
        ...pendingExits.map((item) => ({ name: employeeName(item.employeeId), detail: 'Exit pending', to: '/hr/exit' })),
    ].slice(0, 4)

    const activity = [
        ...list(getNotifications()).slice(0, 4).map((item) => ({ title: item.title, detail: item.message, when: item.notificationDate, module: item.type, to: '/hr/notifications' })),
        ...list(getOffers()).filter((item) => item.status === 'Issued' || item.status === 'Accepted').slice(0, 2).map((item) => ({ title: 'Offer issued', detail: item.position, when: item.offerDate, module: 'Recruitment', to: '/hr/onboarding/offers' })),
        ...leaveRequests.filter((item) => item.status === 'Approved').slice(0, 2).map((item) => ({ title: 'Leave approved', detail: employeeName(item.employeeId), when: item.fromDate, module: 'Leave', to: '/hr/leave-management' })),
        ...list(getAdvances()).filter((item) => item.status === 'APPROVED').slice(0, 1).map((item) => ({ title: 'Salary advance approved', detail: employeeName(item.employeeId), when: item.requestedDate, module: 'Payroll', to: '/hr/payroll/salary-advance' })),
        ...completedTraining.slice(0, 1).map((item) => ({ title: 'Training completed', detail: item.title, when: item.startDate, module: 'Training', to: '/hr/training-records' })),
        ...reviews.filter((item) => item.status === 'Completed').slice(0, 1).map((item) => ({ title: 'Performance review submitted', detail: item.employeeId, when: item.period, module: 'Performance', to: '/hr/performance-review' })),
        ...list(getDisciplinary()).filter((item) => item.acknowledgement === 'Acknowledged').slice(0, 1).map((item) => ({ title: 'Disciplinary memo acknowledged', detail: employeeName(item.employeeId), when: item.date, module: 'Disciplinary', to: '/hr/disciplinary' })),
        ...exits.filter((item) => item.status === 'Completed').slice(0, 1).map((item) => ({ title: 'Exit clearance completed', detail: employeeName(item.employeeId), when: item.lastWorkingDate, module: 'Exit', to: '/hr/exit' })),
    ].slice(0, 8)

    const pendingTotal = actions.reduce((sum, item) => sum + item.count, 0)
    return {
        latestDate,
        kpis: [
            { label: 'Total Employees', value: employees.length, hint: `+${joiners.length} this month`, lines: [`Active: ${active.length}`, `Inactive: ${inactive.length}`], to: '/hr/employee-management/employees' },
            { label: 'Employees Present Today', value: attendanceCounts.Present + attendanceCounts.Late, hint: latestDate ? `Punch date ${latestDate}` : 'No punches this month', lines: [`Late: ${attendanceCounts.Late}`, `Absent: ${attendanceCounts.Absent}`], to: '/hr/attendance' },
            { label: 'Employees on Leave', value: onLeaveNow.length, hint: `${pendingLeave.length} awaiting approval`, lines: leaveGroups.map((item) => `${item.label}: ${item.count}`), to: '/hr/leave-management' },
            { label: 'Open Positions', value: jobs.reduce((sum, item) => sum + (Number(item.openings) || 1), 0), hint: `${jobs.length} openings`, lines: jobs.slice(0, 2).map((item) => item.position), to: '/hr/recruitment/job-openings' },
            { label: 'Candidates in Recruitment', value: candidates.length, hint: `${stageCount('Interview')} in interview`, lines: [`Screening: ${stageCount('Screening')}`, `Selected: ${stageCount('Selected')}`], to: '/hr/recruitment/candidates' },
            { label: 'Pending HR Actions', value: pendingTotal, hint: 'Across people operations', lines: actions.slice(0, 3).map((item) => `${item.label.split(' ').slice(0, 2).join(' ')} ${item.count}`), to: '/hr/leave-management' },
            { label: 'New Joiners This Month', value: joiners.length, hint: `${pendingExits.length} exiting`, lines: [`Net change: ${joiners.length - pendingExits.length >= 0 ? '+' : ''}${joiners.length - pendingExits.length}`], to: '/hr/onboarding/joiners' },
            { label: 'Payroll Cost This Month', value: formatInr(selectedPayroll.totals.grossSalary), hint: month, lines: [`Net ${formatInr(selectedPayroll.totals.netSalary)}`], to: '/hr/payroll/salary-statement' },
        ],
        workforce,
        attendance: { ...attendanceCounts, rate: attendanceRate, total: attendanceTotal },
        funnel,
        actions,
        departmentRows,
        events,
        payroll: {
            gross: formatInr(selectedPayroll.totals.grossSalary),
            net: formatInr(selectedPayroll.totals.netSalary),
            employer: formatInr(selectedPayroll.totals.employerContribution),
            deductions: formatInr(selectedPayroll.totals.deductions),
            status: selectedPayroll.totals.count ? 'Calculated from salary statements' : 'No payroll rows for this filter',
            trend,
        },
        performance: {
            ratings,
            completed: reviews.filter((item) => item.status === 'Completed').length,
            pending: pendingReviews.length,
            bsc: average('bsc'),
            audit: average('audit'),
        },
        movement: { joiners: joiners.length, exiting: pendingExits.length, net: joiners.length - pendingExits.length, people: movement },
        training: {
            scheduled: monthTraining.filter((item) => item.status === 'Scheduled').length,
            completed: monthTraining.filter((item) => item.status === 'Completed').length,
            trained,
            feedback: feedbackScores.length ? Math.round((feedbackScores.reduce((sum, value) => sum + value, 0) / feedbackScores.length) * 10) / 10 : 0,
            completion: training.length ? Math.round((completedTraining.length / training.length) * 100) : 0,
        },
        activity,
    }
}
