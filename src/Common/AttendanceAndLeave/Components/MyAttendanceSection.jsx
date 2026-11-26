import React, { useState, useMemo } from 'react'
import {
    Calendar as CalendarIcon,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    Fingerprint,
    Cpu,
    HelpCircle,
    Send,
    ShieldCheck,
    FileText,
} from 'lucide-react'
import {
    getAttendanceRecords,
    submitAttendanceRegularization,
    ENTERPRISE_EMPLOYEES,
    DEFAULT_DEPARTMENT_SHIFTS,
} from '../attendanceLeaveData'
import { computeFirstInLastOut, getRawBiometricPunches } from '../esslBiometricEngine'

export default function MyAttendanceSection({
    currentUserRole = 'teacher',
    currentUserEmail = '',
    currentUserName = 'Priya Sundaram',
}) {
    // Find matching employee or fallback to primary teacher
    const currentEmployee = useMemo(() => {
        return (
            ENTERPRISE_EMPLOYEES.find(
                (e) =>
                    (currentUserEmail && e.email.toLowerCase() === currentUserEmail.toLowerCase()) ||
                    e.roleKey === currentUserRole
            ) || ENTERPRISE_EMPLOYEES[2] // Priya Sundaram fallback
        )
    }, [currentUserEmail, currentUserRole])

    // Load attendance records for this employee
    const allRecords = getAttendanceRecords()
    const myRecords = useMemo(() => {
        return allRecords.filter((r) => r.employeeId === currentEmployee.id)
    }, [allRecords, currentEmployee.id])

    // Today's record
    const todayRecord = myRecords.find((r) => r.date === '31-10-2026') || {
        date: '31-10-2026',
        checkInTime: '08:26 AM',
        checkOutTime: '03:45 PM',
        workingHours: '7h 19m',
        lateDurationMinutes: 0,
        lateFormatted: '0m',
        shiftName: 'Academic Morning Shift',
        status: 'Present',
        source: 'BIOMETRIC_DEVICE',
        deviceId: 'DEV-ESSL-02',
    }

    // Shift info
    const shiftInfo =
        DEFAULT_DEPARTMENT_SHIFTS.find((s) => s.department === currentEmployee.shiftDepartment) ||
        DEFAULT_DEPARTMENT_SHIFTS[0]

    // Real-time punch timeline from raw biometric logs
    const rawBiometric = computeFirstInLastOut(currentEmployee.id, '31-10-2026')

    // Modal state for Attendance Regularization
    const [isRegularizeModalOpen, setIsRegularizeModalOpen] = useState(false)
    const [regDate, setRegDate] = useState('31-10-2026')
    const [regType, setRegType] = useState('MISSING_PUNCH')
    const [regInTime, setRegInTime] = useState('08:30 AM')
    const [regOutTime, setRegOutTime] = useState('03:45 PM')
    const [regReason, setRegReason] = useState('')
    const [submitSuccess, setSubmitSuccess] = useState(false)

    const handleRegularizeSubmit = (e) => {
        e.preventDefault()
        submitAttendanceRegularization({
            employeeId: currentEmployee.id,
            employeeName: currentEmployee.name,
            department: currentEmployee.department,
            designation: currentEmployee.designation,
            attendanceDate: regDate,
            requestType: regType,
            requestedInTime: regInTime,
            requestedOutTime: regOutTime,
            shiftName: shiftInfo.shiftName,
            reason: regReason,
        })
        setSubmitSuccess(true)
        setTimeout(() => {
            setSubmitSuccess(false)
            setIsRegularizeModalOpen(false)
            setRegReason('')
        }, 1500)
    }

    // Monthly KPI calculations
    const presentDays = myRecords.filter((r) => r.status === 'Present').length
    const lateDays = myRecords.filter((r) => r.status === 'Late Arrival' || r.lateDurationMinutes > 0).length
    const absentDays = myRecords.filter((r) => r.status === 'Absent').length
    const totalRecordedDays = myRecords.length || 1

    return (
        <div className="space-y-6">
            {/* Header & Regularize Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">My Attendance Dashboard</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Logged in as <span className="font-semibold text-slate-700">{currentEmployee.name}</span> ({currentEmployee.designation} • {currentEmployee.department})
                    </p>
                </div>
                <div>
                    <button
                        onClick={() => setIsRegularizeModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        Request Regularization
                    </button>
                </div>
            </div>

            {/* Today's Punch Card & Live Biometric Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Punch Card (2 cols) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Today's Attendance Punch</h3>
                                <p className="text-xs text-slate-500">{todayRecord.date} • {shiftInfo.shiftName}</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            {todayRecord.status}
                        </span>
                    </div>

                    {/* Check In / Check Out Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">First In (Check-In)</span>
                            <div className="text-2xl font-bold text-slate-900 mt-1">{todayRecord.checkInTime || '--:--'}</div>
                            <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                On Time ({shiftInfo.startTime} shift)
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Out (Check-Out)</span>
                            <div className="text-2xl font-bold text-slate-900 mt-1">{todayRecord.checkOutTime || '--:--'}</div>
                            <div className="text-xs text-slate-500 mt-1 font-medium">
                                Scheduled Out: {shiftInfo.endTime}
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Duration</span>
                            <div className="text-2xl font-bold text-blue-600 mt-1">{todayRecord.workingHours || '0h 0m'}</div>
                            <div className="text-xs text-slate-500 mt-1">Standard: 7.25 hrs</div>
                        </div>
                    </div>

                    {/* Biometric Device & Verification Pill */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                        <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-blue-600" />
                            <span>Synchronized via <strong className="text-slate-800">eSSL SilkBio 100-H ({todayRecord.deviceId})</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Verification Mode: <strong className="text-slate-800">Biometric Scan</strong></span>
                        </div>
                    </div>
                </div>

                {/* Right: Department Shift & Policy Details (1 col) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-blue-600" />
                        My Shift & Policy Rules
                    </h3>
                    <div className="space-y-3 text-xs text-slate-600">
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Department:</span>
                            <span className="font-semibold text-slate-800">{currentEmployee.department}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Working Days:</span>
                            <span className="font-semibold text-slate-800">{shiftInfo.workingDays}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Shift Timings:</span>
                            <span className="font-semibold text-blue-600">{shiftInfo.startTime} – {shiftInfo.endTime}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Late Grace Period:</span>
                            <span className="font-semibold text-slate-800">{shiftInfo.gracePeriodMinutes} mins allowed</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                            <span className="text-slate-500">Half-Day Threshold:</span>
                            <span className="font-semibold text-slate-800">{shiftInfo.halfDayHours} hours minimum</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly KPI Overview Row (Reference Design) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Days Present</span>
                    <div className="text-2xl font-bold text-slate-900 mt-2">{presentDays} Days</div>
                    <span className="text-xs text-emerald-600 font-medium">96% Regularity</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Late Arrivals</span>
                    <div className="text-2xl font-bold text-slate-900 mt-2">{lateDays}</div>
                    <span className="text-xs text-slate-500 font-medium">Within monthly allowance</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Absences</span>
                    <div className="text-2xl font-bold text-slate-900 mt-2">{absentDays}</div>
                    <span className="text-xs text-slate-500 font-medium">0 Unexcused</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Total Hours</span>
                    <div className="text-2xl font-bold text-slate-900 mt-2">154.5 hrs</div>
                    <span className="text-xs text-blue-600 font-medium">October 2026</span>
                </div>
            </div>

            {/* Attendance Punch History Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Attendance Records & Biometric Audit</h3>
                    <span className="text-xs text-slate-500">Displaying logged records for {currentEmployee.name}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Shift Name</th>
                                <th className="px-4 py-3">Check-In</th>
                                <th className="px-4 py-3">Check-Out</th>
                                <th className="px-4 py-3">Duration</th>
                                <th className="px-4 py-3">Late / Early</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Punch Source</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {myRecords.map((r, idx) => (
                                <tr key={r.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-800">{r.date}</td>
                                    <td className="px-4 py-3 text-xs text-slate-600">{r.shiftName}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-900 font-medium">{r.checkInTime || '--:--'}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-900 font-medium">{r.checkOutTime || '--:--'}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{r.workingHours}</td>
                                    <td className="px-4 py-3 text-xs">
                                        {r.lateDurationMinutes > 0 ? (
                                            <span className="text-amber-600 font-medium">+{r.lateFormatted} late</span>
                                        ) : (
                                            <span className="text-slate-400">On Time</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                r.status === 'Present'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : r.status === 'Late Arrival'
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    : r.status === 'Absent'
                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                            }`}
                                        >
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {r.source === 'MANUAL_OVERRIDE' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
                                                Manual Override
                                            </span>
                                        ) : r.source === 'REGULARIZED' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200">
                                                Regularized
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-xs font-medium border border-teal-200">
                                                <Fingerprint className="w-3 h-3" />
                                                eSSL Device
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Attendance Regularization Modal */}
            {isRegularizeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800">Request Attendance Regularization</h3>
                            <button
                                onClick={() => setIsRegularizeModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        {submitSuccess ? (
                            <div className="py-8 text-center space-y-3">
                                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h4 className="text-base font-bold text-slate-800">Regularization Request Submitted</h4>
                                <p className="text-xs text-slate-500">Your reporting manager and HR will review and approve your punch correction.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleRegularizeSubmit} className="space-y-4 mt-4 text-sm">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Attendance Date</label>
                                    <input
                                        type="text"
                                        value={regDate}
                                        onChange={(e) => setRegDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Correction Reason Category</label>
                                    <select
                                        value={regType}
                                        onChange={(e) => setRegType(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                    >
                                        <option value="MISSING_PUNCH">Biometric Machine Failure / Scanner Error</option>
                                        <option value="ON_DUTY">Official Outdoor Duty (OD)</option>
                                        <option value="MACHINE_ERROR">Device Offline / Power Interruption</option>
                                        <option value="INCORRECT_SHIFT">Forgot ID Card / Misplaced RFID</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Actual In-Time</label>
                                        <input
                                            type="text"
                                            value={regInTime}
                                            onChange={(e) => setRegInTime(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Actual Out-Time</label>
                                        <input
                                            type="text"
                                            value={regOutTime}
                                            onChange={(e) => setRegOutTime(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Detailed Explanation & Remarks</label>
                                    <textarea
                                        rows={3}
                                        value={regReason}
                                        onChange={(e) => setRegReason(e.target.value)}
                                        placeholder="Explain why the biometric punch was missed or delayed..."
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                        required
                                    />
                                </div>

                                <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsRegularizeModalOpen(false)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                        Submit Request
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

