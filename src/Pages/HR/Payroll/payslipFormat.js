import { SCHOOL_PROFILE } from '../../../constants/schoolProfile'
import { PAYROLL_MONTHS } from '../domain/payrollConfig'

const money = (value) => Math.round((Number(value) || 0) * 100) / 100
const formatAmount = (value) => money(value).toLocaleString('en-IN')
const orNa = (value) => (value === undefined || value === null || String(value).trim() === '' ? 'NA' : value)

export function daysInMonth(month, year) {
    const index = PAYROLL_MONTHS.indexOf(month)
    if (index < 0) return 0
    return new Date(Number(year), index + 1, 0).getDate()
}

export function buildPayslipModel(row, employee = {}) {
    const otherAllowance = money(row.otherAllowance)
    const earnings = [{ particular: 'Gross Salary', amount: money(row.grossSalary) }]
    if (otherAllowance) earnings.push({ particular: 'Other Allowance', amount: otherAllowance })
    const leave = money((row.lopDeduction || 0) + (row.latePermissionDeduction || 0))
    const deductions = [
        { particular: 'E.P.F', amount: money(row.pfEmployee) },
        { particular: 'E.S.I', amount: money(row.esiEmployee) },
        { particular: 'Leave', amount: leave },
        { particular: 'Advance/Loan', amount: money(row.advance) },
        { particular: 'Transport Fees', amount: money(employee.transportFee || row.transportFee) },
        { particular: 'Disciplinary', amount: money(row.disciplinaryDeduction), detail: row.disciplinaryAction && row.disciplinaryAction !== '—' ? row.disciplinaryAction : '' },
        { particular: 'Others', amount: money(row.specialDeduction) },
        { particular: 'TDS', amount: money(employee.tds || row.tds) },
    ]
    const grossEarnings = money(earnings.reduce((sum, line) => sum + line.amount, 0))
    const totalDeductions = money(deductions.reduce((sum, line) => sum + line.amount, 0))
    const netAmount = money(grossEarnings - totalDeductions)
    return {
        school: SCHOOL_PROFILE,
        monthLabel: `${row.month || ''} ${row.year || ''}`.trim(),
        employeeName: row.employeeName,
        employeeCode: orNa(employee.employeeCode || row.employeeId),
        designation: orNa(row.designation),
        monthlyDays: daysInMonth(row.month, row.year),
        daysWorked: row.paidDays,
        pan: orNa(employee.pan),
        uan: orNa(employee.epfUan),
        bankAccount: orNa(employee.bankAccount),
        esiNumber: orNa(employee.esiNumber),
        doj: orNa(row.joiningDate),
        earnings,
        deductions,
        grossEarnings,
        totalDeductions,
        netAmount,
        formatAmount,
    }
}

const cell = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')

export function payslipHtml(model) {
    const earningRows = model.earnings.map((line) => `<tr><td>${cell(line.particular)}</td><td>${model.formatAmount(line.amount)}</td><td></td><td></td></tr>`).join('')
    const deductionRows = model.deductions.map((line) => `<tr><td></td><td></td><td>${cell(line.particular)}${line.detail ? `<div style="font-size:11px">${cell(line.detail)}</div>` : ''}</td><td>${model.formatAmount(line.amount)}</td></tr>`).join('')
    return `<div style="max-width:820px;margin:auto">
        <p style="text-align:center;font-size:12px">${cell(model.school.contactLine)}</p>
        <h1 style="text-align:center;font-size:20px;margin-top:12px">${cell(model.school.name)}</h1>
        <p style="text-align:center">${cell(model.school.affiliation)}</p>
        <p style="text-align:center">${cell(model.school.addressLine)}</p>
        <h2 style="text-align:center;margin:16px 0">PAY SLIP FOR THE MONTH OF ${cell(model.monthLabel).toUpperCase()}</h2>
        <table>
            <tr><td>Employee Name: ${cell(model.employeeName)}</td><td>Employee Code: ${cell(model.employeeCode)}</td></tr>
            <tr><td>Designation: ${cell(model.designation)}</td><td>Monthly days ${cell(model.monthlyDays)}</td></tr>
            <tr><td>PAN No. ${cell(model.pan)}</td><td>No. of days worked ${cell(model.daysWorked)}</td></tr>
            <tr><td>EPF - UAN NO. ${cell(model.uan)}</td><td>Bank A/C. No. ${cell(model.bankAccount)}</td></tr>
            <tr><td>ESI Insurance No. ${cell(model.esiNumber)}</td><td>DOJ: ${cell(model.doj)}</td></tr>
        </table>
        <table style="margin-top:12px">
            <tr><th colspan="2">Earnings</th><th colspan="2">Deductions</th></tr>
            <tr><th>Particulars</th><th>Amount</th><th>Particulars</th><th>Amount</th></tr>
            ${earningRows}
            ${deductionRows}
            <tr><td>Gross Earnings</td><td>${model.formatAmount(model.grossEarnings)}</td><td>Total Deductions</td><td>${model.formatAmount(model.totalDeductions)}</td></tr>
            <tr><td colspan="3" style="text-align:right">Net Amount</td><td>${model.formatAmount(model.netAmount)}</td></tr>
        </table>
        <table style="margin-top:48px;border:none"><tr>
            <td style="border:none">Manager - HR</td>
            <td style="border:none">Manager - Finance</td>
            <td style="border:none">Employee's Signature</td>
        </tr></table>
    </div>`
}
