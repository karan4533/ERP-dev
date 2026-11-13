import React, { useState } from 'react'
import { Filter, Calendar, ChevronDown, Layers, Users } from 'lucide-react'

/**
 * HierarchyFilterBar - Role-based multi-tier drilldown filter bar.
 * Supports:
 * - Department -> Team / Grade -> Period
 * Enables higher-level roles to inspect subordinate departments.
 */
const HierarchyFilterBar = ({
    onFilterChange,
    showDepartment = true,
    showTeam = true,
    className = '',
}) => {
    const [selectedDept, setSelectedDept] = useState('All Departments')
    const [selectedTeam, setSelectedTeam] = useState('All Teams / Wings')
    const [selectedPeriod, setSelectedPeriod] = useState('Today')

    const handleDeptChange = (e) => {
        const val = e.target.value
        setSelectedDept(val)
        onFilterChange?.({ department: val, team: selectedTeam, period: selectedPeriod })
    }

    const handleTeamChange = (e) => {
        const val = e.target.value
        setSelectedTeam(val)
        onFilterChange?.({ department: selectedDept, team: val, period: selectedPeriod })
    }

    const handlePeriodChange = (e) => {
        const val = e.target.value
        setSelectedPeriod(val)
        onFilterChange?.({ department: selectedDept, team: selectedTeam, period: val })
    }

    return (
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs ${className}`}>
            <div className='flex flex-wrap items-center gap-2 text-xs'>
                <div className='flex items-center gap-1.5 text-slate-400 font-semibold px-2'>
                    <Filter size={14} />
                    <span className='hidden sm:inline'>Filters:</span>
                </div>

                {/* Department Filter */}
                {showDepartment && (
                    <div className='relative'>
                        <select
                            value={selectedDept}
                            onChange={handleDeptChange}
                            aria-label='Filter by department'
                            className='appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-3 pr-7 text-xs font-medium text-slate-700 hover:border-slate-300 focus:bg-white focus:outline-none cursor-pointer'
                        >
                            <option>All Departments</option>
                            <option>Academics & Pedagogy</option>
                            <option>Finance & Accounts</option>
                            <option>Human Resources</option>
                            <option>Stores & Procurement</option>
                            <option>Transport & Fleets</option>
                            <option>IT & Systems</option>
                            <option>Security & Campus Access</option>
                            <option>Canteen & Nutrition</option>
                            <option>Housekeeping & Facilities</option>
                            <option>Hostel Operations</option>
                        </select>
                        <ChevronDown size={13} className='pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400' />
                    </div>
                )}

                {/* Team / Wing Filter */}
                {showTeam && (
                    <div className='relative'>
                        <select
                            value={selectedTeam}
                            onChange={handleTeamChange}
                            aria-label='Filter by team or wing'
                            className='appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-3 pr-7 text-xs font-medium text-slate-700 hover:border-slate-300 focus:bg-white focus:outline-none cursor-pointer'
                        >
                            <option>All Teams / Wings</option>
                            <option>Senior Secondary (Grades 9-12)</option>
                            <option>Middle School (Grades 6-8)</option>
                            <option>Primary School (Grades 1-5)</option>
                            <option>Kindergarten & Foundation</option>
                            <option>Administrative Staff</option>
                            <option>Support & Logistics Crew</option>
                        </select>
                        <ChevronDown size={13} className='pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400' />
                    </div>
                )}
            </div>

            {/* Right: Period / Quick Scope Selector */}
            <div className='flex items-center gap-2 text-xs'>
                <div className='relative'>
                    <select
                        value={selectedPeriod}
                        onChange={handlePeriodChange}
                        aria-label='Select reporting period'
                        className='appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-3 pr-7 text-xs font-medium text-slate-700 hover:border-slate-300 focus:bg-white focus:outline-none cursor-pointer'
                    >
                        <option>Today</option>
                        <option>This Week</option>
                        <option>This Month</option>
                        <option>Current Term</option>
                        <option>Academic Year (2026-27)</option>
                    </select>
                    <ChevronDown size={13} className='pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400' />
                </div>
            </div>
        </div>
    )
}

export default HierarchyFilterBar
