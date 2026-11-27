import React, { useMemo, useState } from 'react'
import { DEPARTMENTS } from '../domain/hrStatus'
import { employeeName, getAdvances, getAttendance, getCandidates, getDisciplinary, getEmployees, getExits, getInterviews, getLeaveBundle, getPerformance, getReferrals, getTraining, salaryRows } from '../domain/hrStore'
import { formatInr } from '../domain/payrollCalculations'
import { HrExport, PageIntro, PrimaryButton, td, th, useHrTick } from '../components/HrUi'

const REPORTS = ['Headcount', 'New Joiners', 'Relieved', 'Recruitment', 'Interviews', 'Attendance', 'Leave', 'Training', 'Performance', 'Payroll', 'Salary Advance', 'Referral', 'Disciplinary', 'Exit']

const Reports = () => {
    const tick = useHrTick()
    const [type, setType] = useState('Headcount')
    const [department, setDepartment] = useState('')
    const [exportOpen, setExportOpen] = useState(false)
    const rows = useMemo(() => {
        const employees = getEmployees().filter((item) => !department || item.department === department)
        const map = {
            Headcount: employees.map((item) => ({ Employee: item.name, Department: item.department, Category: item.category, Status: item.status })),
            'New Joiners': employees.filter((item) => item.joiningDate.includes('2026')).map((item) => ({ Employee: item.name, Joining: item.joiningDate, Department: item.department })),
            Relieved: employees.filter((item) => item.category === 'Relieved' || item.status === 'Inactive').map((item) => ({ Employee: item.name, Status: item.status })),
            Recruitment: getCandidates().map((item) => ({ Candidate: item.name, Position: item.position, Status: item.status })),
            Interviews: getInterviews().map((item) => ({ Interview: item.id, Level: item.level, Status: item.status })),
            Attendance: getAttendance().map((item) => ({ Employee: employeeName(item.employeeId), Date: item.date, Status: item.status })),
            Leave: getLeaveBundle().requests.map((item) => ({ Employee: employeeName(item.employeeId), Type: item.leaveType, Status: item.status })),
            Training: getTraining().map((item) => ({ Title: item.title, Status: item.status, Participants: item.participantIds.length })),
            Performance: getPerformance().map((item) => ({ Employee: employeeName(item.employeeId), Rating: item.rating, BSC: item.bsc })),
            Payroll: salaryRows('June', 2026).filter((item) => !department || item.department === department).map((item) => ({ Employee: item.employeeName, Net: formatInr(item.netSalary), Category: item.category })),
            'Salary Advance': getAdvances().map((item) => ({ Request: item.id, Employee: employeeName(item.employeeId), Status: item.status })),
            Referral: getReferrals().map((item) => ({ Referral: item.id, Employee: employeeName(item.referrerId), Amount: item.amount, Status: item.status })),
            Disciplinary: getDisciplinary().map((item) => ({ Notice: item.id, Employee: employeeName(item.employeeId), Type: item.actionType, Status: item.status })),
            Exit: getExits().map((item) => ({ Employee: employeeName(item.employeeId), Status: item.status, LastWorking: item.lastWorkingDate })),
        }
        return map[type] || []
    }, [tick, type, department])
    const headers = rows[0] ? Object.keys(rows[0]) : []

    return (
        <section>
            <PageIntro text='Each report reads the same HR records. Filters apply where the report has a department column or employee list.'>
                <div className='flex flex-wrap gap-2 mb-4'>{REPORTS.map((item) => <button key={item} type='button' onClick={() => setType(item)} className={`text-sm px-3 py-1.5 rounded-md cursor-pointer ${type === item ? 'bg-[#515DEF] text-white' : 'border border-[#515DEF] text-[#515DEF]'}`}>{item}</button>)}</div>
                <select className='border rounded-md px-2 py-2 text-sm' value={department} onChange={(e) => setDepartment(e.target.value)}><option value=''>All departments</option>{DEPARTMENTS.map((item) => <option key={item}>{item}</option>)}</select>
            </PageIntro>
            <div className='bg-white rounded-2xl shadow-md p-4 mt-6 overflow-x-auto'>
                <div className='flex justify-between mb-3'><h2 className='text-xl'>{type}</h2><PrimaryButton onClick={() => setExportOpen(true)}>Export</PrimaryButton></div>
                <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{headers.map((header) => <th key={header} className={th}>{header}</th>)}</tr></thead>
                    <tbody>{rows.map((row, index) => <tr key={index} className='border-b'>{headers.map((header) => <td key={header} className={td}>{row[header]}</td>)}</tr>)}</tbody>
                </table>
            </div>
            <HrExport open={exportOpen} setOpen={setExportOpen} filename={`hr-${type}`} rows={rows} />
        </section>
    )
}

export default Reports
