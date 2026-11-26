import React, { useState, useMemo } from 'react'
import {
    CheckSquare,
    Square,
    ChevronDown,
    ChevronUp,
    Users,
    Search,
    Award,
    Shield,
    Check,
    Lock,
    Sparkles,
    User
} from 'lucide-react'
import { CLASS_ASSIGNMENTS, getAuthorizedClassesForUser } from '../recognitionData'

const BulkClassSectionSelector = ({
    userRole,
    userEmail,
    selectedClassKeys = [],
    onSelectionChange,
    onNominateStudent,
    nominatedStudentId = null,
}) => {
    const authorizedKeys = useMemo(
        () => getAuthorizedClassesForUser(userRole, userEmail),
        [userRole, userEmail]
    )

    const isClassTeacherLocked = userRole === 'teacher'
    const [expandedClassKey, setExpandedClassKey] = useState(authorizedKeys[0] || 'Grade 10-A')
    const [searchQuery, setSearchQuery] = useState('')

    const handleToggleClass = (key) => {
        if (selectedClassKeys.includes(key)) {
            onSelectionChange(selectedClassKeys.filter((k) => k !== key))
        } else {
            onSelectionChange([...selectedClassKeys, key])
        }
    }

    const handleSelectAll = () => {
        onSelectionChange([...authorizedKeys])
    }

    const handleDeselectAll = () => {
        onSelectionChange([])
    }

    const filteredClasses = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return authorizedKeys
        return authorizedKeys.filter((key) => {
            const info = CLASS_ASSIGNMENTS[key]
            const matchesKey = key.toLowerCase().includes(q)
            const matchesTeacher = info?.classTeacherName?.toLowerCase().includes(q)
            const matchesStudent = info?.students?.some(
                (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
            )
            return matchesKey || matchesTeacher || matchesStudent
        })
    }, [authorizedKeys, searchQuery])

    return (
        <div className="space-y-4">
            {/* Header controls: Search & Bulk selection buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search class, section, mentor or student name..."
                        className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>

                {!isClassTeacherLocked ? (
                    <div className="flex items-center gap-2 text-xs">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                            Select All ({authorizedKeys.length})
                        </button>
                        <button
                            type="button"
                            onClick={handleDeselectAll}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            Deselect All
                        </button>
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium">
                        <Lock size={13} className="text-amber-600" />
                        <span>Class Teacher Access: Locked to Assigned Class 10-A</span>
                    </div>
                )}
            </div>

            {/* Selected Summary Pill Badge Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Selected Classes ({selectedClassKeys.length}):</span>
                {selectedClassKeys.length === 0 ? (
                    <span className="text-slate-400 italic">None selected. Check classes below to view students.</span>
                ) : (
                    selectedClassKeys.map((key) => (
                        <span
                            key={key}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-medium"
                        >
                            <span>{key}</span>
                            <span className="size-1.5 rounded-full bg-blue-600" />
                            <span>{CLASS_ASSIGNMENTS[key]?.studentCount || 0} students</span>
                        </span>
                    ))
                )}
            </div>

            {/* Class Cards Grid with Accordion expansion */}
            <div className="space-y-3">
                {filteredClasses.map((classKey) => {
                    const classInfo = CLASS_ASSIGNMENTS[classKey]
                    const isSelected = selectedClassKeys.includes(classKey)
                    const isExpanded = expandedClassKey === classKey
                    const studentCount = classInfo?.studentCount || 0
                    const students = classInfo?.students || []

                    return (
                        <div
                            key={classKey}
                            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                                isSelected
                                    ? 'border-blue-400/90 bg-white shadow-xs ring-2 ring-blue-500/10'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                        >
                            {/* Class Card Header */}
                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleClass(classKey)}
                                        className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                                        aria-label={`Select ${classKey}`}
                                    >
                                        {isSelected ? (
                                            <CheckSquare size={20} className="text-blue-600 fill-blue-50" />
                                        ) : (
                                            <Square size={20} className="text-slate-400" />
                                        )}
                                    </button>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                                                {classKey}
                                            </h3>
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600">
                                                {classInfo?.wing || 'Academic'}
                                            </span>
                                            {isSelected && (
                                                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-[10px] font-bold text-blue-700">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Mentor: <strong className="text-slate-700">{classInfo?.classTeacherName}</strong> • {classInfo?.room}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700">
                                        <Users size={13} className="text-blue-600" />
                                        <span className="font-semibold">{studentCount}</span>
                                        <span className="text-slate-400">Enrolled Students</span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setExpandedClassKey(isExpanded ? null : classKey)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <span>{isExpanded ? 'Hide Students' : 'View Students'}</span>
                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Students Roster Table / Card Grid */}
                            {isExpanded && (
                                <div className="p-4 border-t border-slate-100 bg-white">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                            <Sparkles size={14} className="text-blue-600" />
                                            <span>Roster for {classKey} ({students.length} profile records)</span>
                                        </div>
                                        <span className="text-[11px] text-slate-400">
                                            Select a student below to review performance or nominate for Star of the Month.
                                        </span>
                                    </div>

                                    {students.length === 0 ? (
                                        <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                                            No student records available for this section.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {students.map((student) => {
                                                const isNominated = nominatedStudentId === student.id

                                                return (
                                                    <div
                                                        key={student.id}
                                                        className={`p-3.5 rounded-xl border transition-all ${
                                                            isNominated
                                                                ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                                                                : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div
                                                                className="size-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                                                                style={{ backgroundColor: student.avatarColor }}
                                                            >
                                                                {student.name.charAt(0)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-1">
                                                                    <h4 className="text-xs font-bold text-slate-900 truncate">
                                                                        {student.name}
                                                                    </h4>
                                                                    <span className="text-[10px] font-mono text-slate-400">
                                                                        #{student.rollNumber}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] text-slate-500 font-mono">
                                                                    {student.id}
                                                                </p>

                                                                <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-slate-600 bg-white p-1.5 rounded-lg border border-slate-100">
                                                                    <div>
                                                                        <span className="text-slate-400 block">GPA</span>
                                                                        <strong className="text-blue-700">{student.gpa}</strong>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-slate-400 block">Attd</span>
                                                                        <strong className="text-emerald-700">{student.attendance}%</strong>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-slate-400 block">SOM Wins</span>
                                                                        <strong className="text-amber-700 font-bold">
                                                                            {student.somWins}x
                                                                        </strong>
                                                                    </div>
                                                                </div>

                                                                <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                                                    {student.citation}
                                                                </p>

                                                                {onNominateStudent && (
                                                                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => onNominateStudent(student, classKey)}
                                                                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                                                                isNominated
                                                                                    ? 'bg-emerald-600 text-white'
                                                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                            }`}
                                                                        >
                                                                            {isNominated ? (
                                                                                <>
                                                                                    <Check size={13} />
                                                                                    <span>Selected as Winner</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Award size={13} />
                                                                                    <span>Nominate for SOM</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default BulkClassSectionSelector

