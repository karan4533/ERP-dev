import React, { useState, useMemo } from 'react'
import { LifeBuoy, X, Users, Check, Building2, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../../context/AuthContext'
import { createTicket } from '../../demoDomain/itTickets'
import {
    DEPARTMENT_CONFIGS,
    raiseDepartmentTicket,
} from '../../DepartmentTicketing/departmentTicketingData'
import { ENTERPRISE_EMPLOYEES } from '../../AttendanceAndLeave/attendanceLeaveData'

const inputClass =
    'w-full rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 py-2 text-xs text-[var(--erp-ink)] focus:outline-none focus:ring-2 focus:ring-blue-500'

const RaiseTicketModal = () => {
    const { user, role } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [targetDepartment, setTargetDepartment] = useState(DEPARTMENT_CONFIGS[0].name)
    const [priority, setPriority] = useState('Medium')
    const [subject, setSubject] = useState('')
    const [location, setLocation] = useState('')
    const [description, setDescription] = useState('')
    const [selectedMemberIds, setSelectedMemberIds] = useState([])

    // Active department configuration
    const activeDeptConfig = useMemo(() => {
        return DEPARTMENT_CONFIGS.find((d) => d.name === targetDepartment) || DEPARTMENT_CONFIGS[0]
    }, [targetDepartment])

    const [issueCategory, setIssueCategory] = useState(DEPARTMENT_CONFIGS[0].categories[0] || 'General')

    // Handle department change
    const handleDepartmentChange = (deptName) => {
        setTargetDepartment(deptName)
        const cfg = DEPARTMENT_CONFIGS.find((d) => d.name === deptName)
        if (cfg && cfg.categories.length > 0) {
            setIssueCategory(cfg.categories[0])
        }
    }

    // Toggle multi-member selection
    const toggleMemberSelection = (empId) => {
        setSelectedMemberIds((prev) =>
            prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
        )
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!subject.trim()) {
            toast.error('Please enter a ticket title / subject.')
            return
        }

        setIsSubmitting(true)
        try {
            const requesterName = user?.name || user?.email?.split('@')[0] || 'School Staff'
            const requesterId = user?.employeeId || user?.id || 'EMP-STF-001'
            const requesterRole = role || 'Staff'

            const selectedMemberObjects = ENTERPRISE_EMPLOYEES.filter((emp) =>
                selectedMemberIds.includes(emp.id)
            ).map((emp) => ({
                id: emp.id,
                name: emp.name,
                designation: emp.designation,
                department: emp.department,
            }))

            const newTicket = raiseDepartmentTicket({
                ticketTitle: subject.trim(),
                targetDepartment,
                issueCategory,
                priority,
                requestedById: requesterId,
                requestedByName: requesterName,
                requestingDepartment: requesterRole,
                location: location.trim() || 'Campus Main Block',
                description: description.trim(),
                attachments: [],
                teamMembers: selectedMemberObjects,
            })

            // Keep IT backward compatibility if target is IT
            if (targetDepartment.includes('IT')) {
                try {
                    createTicket({
                        requesterName,
                        requesterRole,
                        department: location || requesterRole,
                        issueType: 'Hardware',
                        priority,
                        subject: subject.trim(),
                        description: description.trim(),
                        location: location.trim(),
                    })
                } catch {
                    /* ignore */
                }
            }

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('schoolerp-tickets-sync'))
            }

            toast.success(`Support Ticket ${newTicket.id} routed to ${targetDepartment}!`)
            setIsOpen(false)
            setSubject('')
            setLocation('')
            setDescription('')
            setSelectedMemberIds([])
        } catch (err) {
            toast.error('Failed to raise ticket: ' + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <button
                type='button'
                onClick={() => setIsOpen(true)}
                className='inline-flex items-center gap-1.5 rounded-lg border border-[#515DEF] bg-[#515DEF]/10 px-2.5 py-1.5 text-xs font-semibold text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer sm:px-3 sm:py-2'
                title='Raise a Department Support Ticket'
            >
                <LifeBuoy size={16} />
                <span className='hidden md:inline'>Raise Ticket</span>
            </button>

            {isOpen && (
                <div
                    className='fixed inset-0 z-250 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'
                    role='dialog'
                    aria-modal='true'
                >
                    <div className='w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden'>
                        <div className='flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50'>
                            <div className='flex items-center gap-3'>
                                <span className='rounded-xl bg-blue-100 p-2 text-blue-600'>
                                    <LifeBuoy size={20} />
                                </span>
                                <div>
                                    <h2 className='text-base font-bold text-slate-900'>
                                        Raise Department Support Ticket
                                    </h2>
                                    <p className='text-xs text-slate-500'>
                                        Route service requests across IT, Facilities, Transport, Stores, HR &amp; Finance
                                    </p>
                                </div>
                            </div>
                            <button
                                type='button'
                                onClick={() => setIsOpen(false)}
                                className='rounded-lg p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className='p-6 overflow-y-auto space-y-4 text-xs'>
                            {/* Target Department & Priority */}
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>
                                        Target Department *
                                    </label>
                                    <select
                                        value={targetDepartment}
                                        onChange={(e) => handleDepartmentChange(e.target.value)}
                                        className={inputClass}
                                    >
                                        {DEPARTMENT_CONFIGS.map((dept) => (
                                            <option key={dept.code} value={dept.name}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>
                                        Priority / SLA Urgency *
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value='Low'>Low (Routine • 48-72h SLA)</option>
                                        <option value='Medium'>Medium (Standard • 24h SLA)</option>
                                        <option value='High'>High (Urgent • 8-12h SLA)</option>
                                        <option value='Critical'>Critical (Emergency • 2-4h SLA)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Issue Category & Location */}
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>
                                        Category ({activeDeptConfig.code}) *
                                    </label>
                                    <select
                                        value={issueCategory}
                                        onChange={(e) => setIssueCategory(e.target.value)}
                                        className={inputClass}
                                    >
                                        {activeDeptConfig.categories.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>
                                        Location / Room / Area *
                                    </label>
                                    <input
                                        type='text'
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder='e.g., Room 204, Secondary Wing'
                                        required
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Ticket Subject */}
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>
                                    Ticket Subject / Short Summary *
                                </label>
                                <input
                                    type='text'
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder='e.g., Interactive Smartboard HDMI failure during Grade 10 Physics'
                                    required
                                    className={inputClass}
                                />
                            </div>

                            {/* Detailed Description */}
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>
                                    Issue Description &amp; Details
                                </label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder='Describe symptoms, errors observed, or specific requirements...'
                                    className={inputClass}
                                />
                            </div>

                            {/* Multi-Member Selection (Requirement: Add option to select members, including multi-selecting multiple members) */}
                            <div>
                                <div className='flex items-center justify-between mb-1.5'>
                                    <label className='font-semibold text-slate-700 flex items-center gap-1.5'>
                                        <Users size={14} className='text-blue-600' />
                                        Include Concerned Staff / Collaborators (Multi-Select)
                                    </label>
                                    <span className='text-[11px] text-slate-500'>
                                        {selectedMemberIds.length} member{selectedMemberIds.length === 1 ? '' : 's'} selected
                                    </span>
                                </div>
                                <div className='max-h-36 overflow-y-auto rounded-xl border border-slate-200 p-2 bg-slate-50 space-y-1'>
                                    {ENTERPRISE_EMPLOYEES.slice(0, 15).map((emp) => {
                                        const isSelected = selectedMemberIds.includes(emp.id)
                                        return (
                                            <div
                                                key={emp.id}
                                                onClick={() => toggleMemberSelection(emp.id)}
                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                                                    isSelected
                                                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                                        : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                                                }`}
                                            >
                                                <div>
                                                    <span className='font-bold'>{emp.name}</span>
                                                    <span className='text-[10px] text-slate-500 ml-1.5 font-mono'>
                                                        ({emp.id}) • {emp.designation} [{emp.department}]
                                                    </span>
                                                </div>
                                                <div
                                                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                                                        isSelected
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'border-slate-300 bg-white'
                                                    }`}
                                                >
                                                    {isSelected && <Check size={12} />}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className='flex items-center justify-end gap-2 border-t border-slate-200 pt-4'>
                                <button
                                    type='button'
                                    onClick={() => setIsOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    disabled={isSubmitting}
                                    className='rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer'
                                >
                                    {isSubmitting ? 'Routing Ticket…' : 'Submit & Route Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

export default RaiseTicketModal
