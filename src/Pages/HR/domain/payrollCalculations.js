import { PAYROLL_CONFIG } from './payrollConfig'

const money = (value) => Math.round((Number(value) || 0) * 100) / 100
const nonNegative = (value) => Math.max(0, money(value))

export function calculateWorkingDays(record) {
    const days = Number(record?.workingDays)
    return days > 0 ? days : PAYROLL_CONFIG.defaultWorkingDays
}

export function calculateLOP(record) {
    const lates = nonNegative(record?.lates)
    const convertedLateLeave = Math.floor(lates / PAYROLL_CONFIG.lateConversionCount)
    const casualLeave = nonNegative(record?.casualLeave)
    const excessLeave = Math.max(0, casualLeave - PAYROLL_CONFIG.casualLeaveEntitlement)
    const absent = nonNegative(record?.absent)
    const otherLeave = nonNegative(record?.otherLeave)
    const notPunched = nonNegative(record?.notPunched)
    const permission = nonNegative(record?.permission)
    const lopDays = absent + excessLeave + notPunched
    const totalLeave = casualLeave + otherLeave + convertedLateLeave + absent
    return { convertedLateLeave, excessLeave, lopDays, totalLeave, permission, lates, notPunched, otherLeave, casualLeave, absent }
}

export function calculateBasicSalary(payableGross) {
    return nonNegative(payableGross * (PAYROLL_CONFIG.basicSalaryPercentage / 100))
}

export function calculatePF(basicSalary) {
    const base = nonNegative(basicSalary)
    return {
        employee: nonNegative(base * (PAYROLL_CONFIG.employeePfPercentage / 100)),
        employer: nonNegative(base * (PAYROLL_CONFIG.employerPfPercentage / 100)),
    }
}

export function calculateESI(payableGross) {
    const base = nonNegative(payableGross)
    if (base <= 0 || base > PAYROLL_CONFIG.esiWageCeiling) {
        return { employee: 0, employer: 0, applicable: false }
    }
    return {
        employee: nonNegative(base * (PAYROLL_CONFIG.employeeEsiPercentage / 100)),
        employer: nonNegative(base * (PAYROLL_CONFIG.employerEsiPercentage / 100)),
        applicable: true,
    }
}

export function calculateAttendanceDeduction(grossSalary, workingDays, lop) {
    const perDay = workingDays > 0 ? nonNegative(grossSalary) / workingDays : 0
    const lateRemainder = Math.max(0, lop.lates - (lop.convertedLateLeave * PAYROLL_CONFIG.lateConversionCount))
    const latePermissionDays = (lateRemainder * 0.25) + (lop.permission * 0.5)
    return {
        perDay: money(perDay),
        lopDeduction: nonNegative(perDay * lop.lopDays),
        latePermissionDeduction: nonNegative(perDay * latePermissionDays),
    }
}

export function calculateSalaryAdvanceDeduction(advances, employeeId) {
    return (advances || [])
        .filter((item) => item.employeeId === employeeId && item.status === 'APPROVED' && Number(item.outstanding) > 0)
        .reduce((sum, item) => sum + nonNegative(item.currentDeduction || item.emi), 0)
}

export function calculateReferralBonus(grossSalary) {
    return nonNegative(grossSalary * (PAYROLL_CONFIG.referralBonusPercentage / 100))
}

export function calculateEmployerContribution(pf, esi, otherBenefits = 0) {
    return nonNegative(pf.employer + esi.employer + otherBenefits)
}

export function calculateNetSalary({ payableGross, otherAllowance, advance, specialDeduction, pfEmployee, esiEmployee, disciplinaryDeduction = 0 }) {
    return nonNegative(payableGross + otherAllowance - advance - specialDeduction - disciplinaryDeduction - pfEmployee - esiEmployee)
}

const PAYROLL_MONTH_INDEX = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
}

export function disciplinaryDaysFor(actionType) {
    const type = String(actionType || '').trim().toLowerCase()
    if (type === 'warning') return 0
    if (type === 'memo') return 1
    if (type === 'suspended' || type === 'suspension') return 2
    return 0
}

const actionMonthYear = (value) => {
    const parts = String(value || '').split('-').map((part) => Number(part))
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null
    if (parts[0] > 31) return { month: parts[1], year: parts[0] }
    return { month: parts[1], year: parts[2] }
}

export function disciplinaryDeductionFor(actions, employeeId, month, year, perDay) {
    const monthIndex = PAYROLL_MONTH_INDEX[month]
    const seen = new Set()
    const matched = (actions || []).filter((item) => {
        if (!item || item.employeeId !== employeeId || item.status !== 'APPROVED') return false
        if (item.id && seen.has(item.id)) return false
        const parsed = actionMonthYear(item.date)
        if (!parsed || parsed.month !== monthIndex || parsed.year !== Number(year)) return false
        if (item.id) seen.add(item.id)
        return true
    })
    const lines = matched.map((item) => {
        const days = disciplinaryDaysFor(item.actionType)
        return {
            id: item.id,
            actionType: item.actionType,
            days,
            dailyRate: money(perDay),
            amount: money(perDay * days),
        }
    })
    return {
        amount: money(lines.reduce((sum, line) => sum + line.amount, 0)),
        days: lines.reduce((sum, line) => sum + line.days, 0),
        lines,
        narration: lines.map((line) => `${line.actionType} — ${line.days} day${line.days === 1 ? '' : 's'}`).join('; ') || '—',
    }
}

export function calculateCTC({ grossSalary, otherAllowance, employerContribution, otherBenefits = 0 }) {
    const monthlyGross = nonNegative(grossSalary) + nonNegative(otherAllowance)
    const monthlyCtc = monthlyGross + nonNegative(employerContribution) + nonNegative(otherBenefits)
    return {
        monthlyGross: money(monthlyGross),
        annualGross: money(monthlyGross * 12),
        monthlyCtc: money(monthlyCtc),
        annualCtc: money(monthlyCtc * 12),
    }
}

export function buildSalaryRow({ employee, attendance, advances, disciplinaryActions = [], month, year }) {
    const grossSalary = nonNegative(employee.grossSalary)
    const otherAllowance = nonNegative(attendance?.otherAllowance ?? employee.otherAllowance)
    const specialDeduction = nonNegative(attendance?.specialDeduction ?? employee.specialDeduction)
    const workingDays = calculateWorkingDays(attendance)
    const lop = calculateLOP(attendance || {})
    const attendanceDeduction = calculateAttendanceDeduction(grossSalary, workingDays, lop)
    const payableGross = nonNegative(grossSalary - attendanceDeduction.lopDeduction - attendanceDeduction.latePermissionDeduction)
    const basicSalary = calculateBasicSalary(payableGross)
    const pf = calculatePF(basicSalary)
    const esi = calculateESI(payableGross)
    const advance = calculateSalaryAdvanceDeduction(advances, employee.id)
    const advanceRecord = (advances || []).find((item) => item.employeeId === employee.id && item.status === 'APPROVED')
    const disciplinary = disciplinaryDeductionFor(disciplinaryActions, employee.id, month, year, attendanceDeduction.perDay)
    const netSalary = calculateNetSalary({
        payableGross,
        otherAllowance,
        advance,
        specialDeduction,
        disciplinaryDeduction: disciplinary.amount,
        pfEmployee: pf.employee,
        esiEmployee: esi.employee,
    })
    const employerContribution = calculateEmployerContribution(pf, esi, employee.otherEmployerBenefits)
    const ctc = calculateCTC({
        grossSalary,
        otherAllowance,
        employerContribution,
        otherBenefits: 0,
    })
    const paidDays = nonNegative(workingDays - lop.lopDays)

    return {
        employeeId: employee.id,
        employeeName: employee.name,
        department: employee.department,
        designation: employee.designation,
        joiningDate: employee.joiningDate,
        category: employee.category,
        status: employee.status,
        workingDays,
        paidDays,
        ...lop,
        grossSalary,
        payableGross,
        otherAllowance,
        salaryActual: payableGross,
        salaryPerDay: attendanceDeduction.perDay,
        basicSalary,
        lopDeduction: attendanceDeduction.lopDeduction,
        latePermissionDeduction: attendanceDeduction.latePermissionDeduction,
        notPunchedLop: nonNegative(attendanceDeduction.perDay * lop.notPunched),
        advance,
        existingAdvance: nonNegative(advanceRecord?.outstanding),
        currentDeduction: advance,
        remainingAdvance: nonNegative((advanceRecord?.outstanding || 0) - advance),
        specialDeduction,
        extraDeduction: specialDeduction,
        permissionCount: lop.permission,
        disciplinaryAction: disciplinary.narration,
        disciplinaryDays: disciplinary.days,
        disciplinaryLines: disciplinary.lines,
        disciplinaryDeduction: disciplinary.amount,
        pfEmployee: pf.employee,
        esiEmployee: esi.employee,
        pfEmployer: pf.employer,
        esiEmployer: esi.employer,
        employerContribution,
        netSalary,
        totalCost: nonNegative(netSalary + pf.employee + esi.employee + specialDeduction + advance + employerContribution),
        ...ctc,
        paymentStatus: attendance?.paymentStatus || 'Unpaid',
        bankRef: attendance?.bankRef || '',
        paymentDate: attendance?.paymentDate || '',
        paymentMode: attendance?.paymentMode || 'Bank Transfer',
    }
}

export function summarizePayroll(rows) {
    const categories = [...new Set(rows.map((row) => row.category))]
    const lines = categories.map((category) => {
        const items = rows.filter((row) => row.category === category)
        return items.reduce((acc, row) => ({
            category,
            count: acc.count + 1,
            grossSalary: money(acc.grossSalary + row.grossSalary),
            deductions: money(acc.deductions + row.lopDeduction + row.latePermissionDeduction + row.advance + row.specialDeduction + row.disciplinaryDeduction + row.pfEmployee + row.esiEmployee),
            netSalary: money(acc.netSalary + row.netSalary),
            pfEmployer: money(acc.pfEmployer + row.pfEmployer),
            esiEmployer: money(acc.esiEmployer + row.esiEmployer),
            employerContribution: money(acc.employerContribution + row.employerContribution),
            totalCost: money(acc.totalCost + row.totalCost),
        }), { category, count: 0, grossSalary: 0, deductions: 0, netSalary: 0, pfEmployer: 0, esiEmployer: 0, employerContribution: 0, totalCost: 0 })
    })
    const totals = lines.reduce((acc, line) => ({
        category: 'Total',
        count: acc.count + line.count,
        grossSalary: money(acc.grossSalary + line.grossSalary),
        deductions: money(acc.deductions + line.deductions),
        netSalary: money(acc.netSalary + line.netSalary),
        pfEmployer: money(acc.pfEmployer + line.pfEmployer),
        esiEmployer: money(acc.esiEmployer + line.esiEmployer),
        employerContribution: money(acc.employerContribution + line.employerContribution),
        totalCost: money(acc.totalCost + line.totalCost),
    }), { category: 'Total', count: 0, grossSalary: 0, deductions: 0, netSalary: 0, pfEmployer: 0, esiEmployer: 0, employerContribution: 0, totalCost: 0 })
    return { lines, totals }
}

export const formatInr = (value) => `₹${money(value).toLocaleString('en-IN')}`
