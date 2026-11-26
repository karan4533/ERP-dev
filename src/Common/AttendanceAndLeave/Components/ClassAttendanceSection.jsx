import React, { useState, useMemo } from 'react'
import {
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Search,
    Calendar,
    Save,
    CheckCheck,
    Filter,
    Shield,
    FileCheck,
    CheckSquare,
    Square,
} from 'lucide-react'
import {
    getStudentAttendanceRecords,
    saveStudentAttendanceRecords,
    getAllStudentAttendanceRecords,
} from '../attendanceLeaveData'

export const ATTENDANCE_STATUS_OPTIONS = [
    { value: 'Present', label: 'Present', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'Absent', label: 'Absent', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { value: 'Late', label: 'Late', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'Half Day', label: 'Half Day', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { value: 'OD', label: 'OD (On Duty)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { value: 'Permission', label: 'Permission', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { value: 'Leave', label: 'Leave', color: 'bg-blue-50 text-blue-700 border-blue-200' },
]

export default function ClassAttendanceSection({ roleKey = 'teacher', currentUserName = 'Teacher' }) {
    const isClassTeacher = roleKey === 'teacher'
    const defaultClass = '10'
    const defaultSection = 'A'

    const [selectedClass, setSelectedClass] = useState(defaultClass)
    const [selectedSection, setSelectedSection] = useState(defaultSection)
    const [selectedDate, setSelectedDate] = useState('2026-10-31')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [notification, setNotification] = useState(null)

    // Selection state for bulk status change
    const [selectedIds, setSelectedIds] = useState([])
    const [bulkStatusToApply, setBulkStatusToApply] = useState('Present')

    // Load records for active selection
    const [records, setRecords] = useState(() => getStudentAttendanceRecords(defaultClass, defaultSection))

    const handleClassChange = (newClass) => {
        setSelectedClass(newClass)
        setSelectedIds([])
        const updated = getStudentAttendanceRecords(newClass, selectedSection)
        setRecords(updated)
    }

    const handleSectionChange = (newSec) => {
        setSelectedSection(newSec)
        setSelectedIds([])
        const updated = getStudentAttendanceRecords(selectedClass, newSec)
        setRecords(updated)
    }

    const handleStatusChange = (studentId, newStatus) => {
        setRecords((prev) =>
            prev.map((s) =>
                s.id === studentId || s.studentId === studentId
                    ? {
                          ...s,
                          status: newStatus,
                          markedTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      }
                    : s
            )
        )
    }

    const handleRemarksChange = (studentId, remarks) => {
        setRecords((prev) =>
            prev.map((s) => (s.id === studentId || s.studentId === studentId ? { ...s, remarks } : s))
        )
    }

    // Toggle individual student checkbox
    const handleToggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        )
    }

    // Toggle Select All
    const handleToggleSelectAll = () => {
        if (selectedIds.length === filteredRecords.length && filteredRecords.length > 0) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredRecords.map((s) => s.id || s.studentId))
        }
    }

    // Bulk apply status to selected students
    const handleApplyBulkStatus = () => {
        if (selectedIds.length === 0) {
            alert('Please select at least one student to update status.')
            return
        }

        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setRecords((prev) =>
            prev.map((s) => {
                const id = s.id || s.studentId
                if (selectedIds.includes(id)) {
                    return {
                        ...s,
                        status: bulkStatusToApply,
                        remarks: `Status updated to ${bulkStatusToApply} by ${currentUserName}`,
                        markedTimestamp: nowStr,
                    }
                }
                return s
            })
        )

        showNotification(
            `Updated ${selectedIds.length} student(s) to "${bulkStatusToApply}" successfully.`
        )
        setSelectedIds([])
    }

    const handleSaveRoster = () => {
        const allRecords = getAllStudentAttendanceRecords()
        const merged = allRecords.map((existing) => {
            const match = records.find((r) => r.id === existing.id || r.studentId === existing.studentId)
            return match || existing
        })
        saveStudentAttendanceRecords(merged)
        showNotification('Class attendance records saved and synchronized successfully.')
    }

    const showNotification = (msg) => {
        setNotification(msg)
        setTimeout(() => setNotification(null), 4000)
    }

    // Filtered Records based on Search and Status Filter
    const filteredRecords = useMemo(() => {
        let result = records

        if (statusFilter !== 'ALL') {
            result = result.filter((r) => {
                if (statusFilter === 'OD') return r.status === 'OD' || r.status.toLowerCase().includes('duty')
                if (statusFilter === 'Leave') return r.status === 'Leave' || r.status === 'Excused'
                return r.status.toLowerCase() === statusFilter.toLowerCase()
            })
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter(
                (r) =>
                    r.studentName.toLowerCase().includes(q) ||
                    r.rollNo.toLowerCase().includes(q) ||
                    r.studentId.toLowerCase().includes(q)
            )
        }

        return result
    }, [records, statusFilter, searchQuery])

    // KPI Metrics
    const totalStudents = records.length
    const presentCount = records.filter((r) => r.status === 'Present').length
    const absentCount = records.filter((r) => r.status === 'Absent').length
    const lateCount = records.filter((r) => r.status === 'Late').length
    const odCount = records.filter((r) => r.status === 'OD' || r.status.toLowerCase().includes('duty')).length
    const permissionCount = records.filter((r) => r.status === 'Permission').length
    const leaveCount = records.filter((r) => r.status === 'Leave' || r.status === 'Excused').length

    const getStatusBadge = (status) => {
        const found = ATTENDANCE_STATUS_OPTIONS.find(
            (o) => o.value.toLowerCase() === (status || '').toLowerCase()
        )
        if (found) return found.color
        if (status === 'Excused') return 'bg-blue-50 text-blue-700 border-blue-200'
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }

    const isAllSelected = filteredRecords.length > 0 && selectedIds.length === filteredRecords.length

    return (
        <div className="space-y-6">
            {/* Header & Save Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Student Class Attendance</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {isClassTeacher
                            ? 'Class Teacher View: Class 10 - Section A'
                            : 'Leadership & Academic Administration View'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSaveRoster}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Save Roster
                    </button>
                </div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium flex items-center justify-between animate-in fade-in">
                    <span>{notification}</span>
                    <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
                        &times;
                    </button>
                </div>
            )}

            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Enrolled</span>
                    <div className="mt-1 text-xl font-bold text-slate-900">{totalStudents}</div>
                    <span className="text-[11px] text-slate-400">Class {selectedClass}-{selectedSection}</span>
                </div>

                <div className="bg-white border border-emerald-100 bg-emerald-50/30 rounded-xl p-3 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Present</span>
                    <div className="mt-1 text-xl font-bold text-emerald-800">{presentCount}</div>
                    <span className="text-[11px] text-emerald-600 font-medium">
                        {totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0}% Turnout
                    </span>
                </div>

                <div className="bg-white border border-rose-100 bg-rose-50/30 rounded-xl p-3 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Absent</span>
                    <div className="mt-1 text-xl font-bold text-rose-800">{absentCount}</div>
                    <span className="text-[11px] text-rose-500">Unexcused</span>
                </div>

                <div className="bg-white border border-amber-100 bg-amber-50/30 rounded-xl p-3 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Late / Half Day</span>
                    <div className="mt-1 text-xl font-bold text-amber-800">{lateCount}</div>
                    <span className="text-[11px] text-amber-600">Late Entry</span>
                </div>

                <div className="bg-white border border-purple-100 bg-purple-50/30 rounded-xl p-3 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">On Duty (OD)</span>
                    <div className="mt-1 text-xl font-bold text-purple-800">{odCount}</div>
                    <span className="text-[11px] text-purple-600">Authorized OD</span>
                </div>

                <div className="bg-white border border-blue-100 bg-blue-50/30 rounded-xl p-3 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Permission / Leave</span>
                    <div className="mt-1 text-xl font-bold text-blue-800">{permissionCount + leaveCount}</div>
                    <span className="text-[11px] text-blue-600">Excused</span>
                </div>
            </div>

            {/* Filter Bar & Bulk Actions Toolbar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
                {/* Top Row: Roster Filters */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Class:</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => handleClassChange(e.target.value)}
                                disabled={isClassTeacher}
                                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                            >
                                <option value="9">Class 9</option>
                                <option value="10">Class 10</option>
                                <option value="11">Class 11</option>
                                <option value="12">Class 12</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Section:</label>
                            <select
                                value={selectedSection}
                                onChange={(e) => handleSectionChange(e.target.value)}
                                disabled={isClassTeacher}
                                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                            >
                                <option value="A">Section A</option>
                                <option value="B">Section B</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Date:</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status:</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="Late">Late</option>
                                <option value="Half Day">Half Day</option>
                                <option value="OD">On Duty (OD)</option>
                                <option value="Permission">Permission</option>
                                <option value="Leave">Leave / Excused</option>
                            </select>
                        </div>
                    </div>

                    {/* Search Field */}
                    <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by student name or roll..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Bottom Row: Bulk Selection & Change Status Toolbar */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/70 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleToggleSelectAll}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600"
                        >
                            {isAllSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                            )}
                            Select All ({filteredRecords.length})
                        </button>

                        {selectedIds.length > 0 && (
                            <span className="font-semibold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full text-xs">
                                {selectedIds.length} student(s) selected
                            </span>
                        )}
                    </div>

                    {/* Bulk Status Change Dropdown & Apply Button */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-600">Change Status To:</label>
                        <select
                            value={bulkStatusToApply}
                            onChange={(e) => setBulkStatusToApply(e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                        >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                            <option value="Half Day">Half Day</option>
                            <option value="OD">OD (On Duty)</option>
                            <option value="Permission">Permission</option>
                            <option value="Leave">Leave / Excused</option>
                        </select>
                        <button
                            type="button"
                            onClick={handleApplyBulkStatus}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                        >
                            Apply to Selected
                        </button>
                    </div>
                </div>
            </div>

            {/* Students Attendance Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                            <tr>
                                <th className="px-4 py-3 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleToggleSelectAll}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-4 py-3">Roll No</th>
                                <th className="px-4 py-3">Student Name</th>
                                <th className="px-4 py-3">Student ID</th>
                                <th className="px-4 py-3">Gender</th>
                                <th className="px-4 py-3 text-center">Attendance Status</th>
                                <th className="px-4 py-3">Remarks / Reason</th>
                                <th className="px-4 py-3 text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                        No students found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((s) => {
                                    const id = s.id || s.studentId
                                    const isSelected = selectedIds.includes(id)
                                    return (
                                        <tr
                                            key={id}
                                            className={`hover:bg-slate-50/70 transition-colors ${
                                                isSelected ? 'bg-blue-50/30' : ''
                                            }`}
                                        >
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelect(id)}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-800">{s.rollNo}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                                                        {s.studentName.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-slate-900">{s.studentName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.studentId}</td>
                                            <td className="px-4 py-3 text-slate-600 text-xs">{s.gender}</td>
                                            <td className="px-4 py-3 text-center">
                                                {/* Status Dropdown with OD, Permission, Leave */}
                                                <select
                                                    value={s.status}
                                                    onChange={(e) => handleStatusChange(s.id, e.target.value)}
                                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusBadge(
                                                        s.status
                                                    )}`}
                                                >
                                                    <option value="Present">Present</option>
                                                    <option value="Absent">Absent</option>
                                                    <option value="Late">Late</option>
                                                    <option value="Half Day">Half Day</option>
                                                    <option value="OD">OD (On Duty)</option>
                                                    <option value="Permission">Permission</option>
                                                    <option value="Leave">Leave</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    placeholder="Add notes..."
                                                    value={s.remarks || ''}
                                                    onChange={(e) => handleRemarksChange(s.id, e.target.value)}
                                                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-500 bg-transparent"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-slate-400">
                                                {s.markedTimestamp || '08:30 AM'}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
