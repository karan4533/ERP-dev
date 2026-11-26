import React, { useState, useMemo } from 'react'
import {
    Building2,
    Users,
    Search,
    ChevronDown,
    ChevronUp,
    Award,
    Check,
    Lock,
    Shield,
    Sparkles,
    Briefcase
} from 'lucide-react'
import { getAuthorizedDepartmentsForUser } from '../recognitionData'

const DepartmentEmployeeSelector = ({
    userRole,
    selectedDeptIds = [],
    onSelectionChange,
    onNominateEmployee,
    nominatedEmployeeId = null,
}) => {
    const authorizedDepartments = useMemo(
        () => getAuthorizedDepartmentsForUser(userRole),
        [userRole]
    )

    const isDepartmentHeadLocked = authorizedDepartments.length === 1
    const [expandedDeptId, setExpandedDeptId] = useState(authorizedDepartments[0]?.id || 'dept-stores')
    const [searchQuery, setSearchQuery] = useState('')

    const handleToggleDept = (id) => {
        if (selectedDeptIds.includes(id)) {
            onSelectionChange(selectedDeptIds.filter((d) => d !== id))
        } else {
            onSelectionChange([...selectedDeptIds, id])
        }
    }

    const handleSelectAll = () => {
        onSelectionChange(authorizedDepartments.map((d) => d.id))
    }

    const handleDeselectAll = () => {
        onSelectionChange([])
    }

    const filteredDepartments = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return authorizedDepartments
        return authorizedDepartments.filter((dept) => {
            const matchesName = dept.name.toLowerCase().includes(q)
            const matchesManager = dept.manager.toLowerCase().includes(q)
            const matchesEmp = dept.employees.some(
                (e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q)
            )
            return matchesName || matchesManager || matchesEmp
        })
    }, [authorizedDepartments, searchQuery])

    return (
        <div className="space-y-4">
            {/* Header: Search and Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search department, staff name, or designation..."
                        className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>

                {!isDepartmentHeadLocked ? (
                    <div className="flex items-center gap-2 text-xs">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                            Select All ({authorizedDepartments.length})
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
                        <span>Department Scope: {authorizedDepartments[0]?.name}</span>
                    </div>
                )}
            </div>

            {/* Department Accordion List */}
            <div className="space-y-3">
                {filteredDepartments.map((dept) => {
                    const isSelected = selectedDeptIds.includes(dept.id)
                    const isExpanded = expandedDeptId === dept.id

                    return (
                        <div
                            key={dept.id}
                            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                                isSelected
                                    ? 'border-blue-400 bg-white shadow-xs ring-2 ring-blue-500/10'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                        >
                            {/* Department Header */}
                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                        {dept.code}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                                                {dept.name}
                                            </h3>
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600">
                                                Non-Academic
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Reporting Lead: <strong className="text-slate-700">{dept.manager}</strong> ({dept.managerId})
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700">
                                        <Users size={13} className="text-blue-600" />
                                        <span className="font-semibold">{dept.employees.length}</span>
                                        <span className="text-slate-400">Department Staff</span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setExpandedDeptId(isExpanded ? null : dept.id)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <span>{isExpanded ? 'Hide Staff' : 'View Staff'}</span>
                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* Department Employees Grid */}
                            {isExpanded && (
                                <div className="p-4 border-t border-slate-100 bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {dept.employees.map((emp) => {
                                            const isNominated = nominatedEmployeeId === emp.id

                                            return (
                                                <div
                                                    key={emp.id}
                                                    className={`p-3.5 rounded-xl border transition-all ${
                                                        isNominated
                                                            ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                                                            : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className="size-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                                                            style={{ backgroundColor: emp.photoColor }}
                                                        >
                                                            {emp.name.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-xs font-bold text-slate-900 truncate">
                                                                {emp.name}
                                                            </h4>
                                                            <p className="text-[11px] text-blue-700 font-medium truncate">
                                                                {emp.designation}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                                {emp.id}
                                                            </p>

                                                            <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-slate-600 bg-white p-1.5 rounded-lg border border-slate-100">
                                                                <div>
                                                                    <span className="text-slate-400 block">Attendance</span>
                                                                    <strong className="text-emerald-700">{emp.attendance}%</strong>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-400 block">SOM Wins</span>
                                                                    <strong className="text-amber-700 font-bold">{emp.somWins}x</strong>
                                                                </div>
                                                            </div>

                                                            <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                                                {emp.citation}
                                                            </p>

                                                            {onNominateEmployee && (
                                                                <div className="mt-3 pt-2 border-t border-slate-100">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onNominateEmployee(emp, dept.name)}
                                                                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                                                            isNominated
                                                                                ? 'bg-emerald-600 text-white'
                                                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                        }`}
                                                                    >
                                                                        {isNominated ? (
                                                                            <>
                                                                                <Check size={13} />
                                                                                <span>Selected Winner</span>
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
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default DepartmentEmployeeSelector

