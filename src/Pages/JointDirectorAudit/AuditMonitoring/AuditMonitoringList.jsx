import React, { useState, useMemo, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, EllipsisIcon, Download, Plus, X } from 'lucide-react'
import { toast } from 'react-toastify'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    AUDIT_MONITORING,
    DEPARTMENTS,
    MONITORING_STATUSES,
    statusBadgeColor,
    progressBarColor,
} from './auditMonitoringData'

const STORAGE_KEY = 'schoolerp_audit_monitoring_v1'

const loadInitialMonitoring = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* fallback to default */
    }
    return AUDIT_MONITORING
}

const AuditMonitoringList = () => {
    const [monitoringData, setMonitoringData] = useState(loadInitialMonitoring)
    const [search, setSearch] = useState('')
    const [selectedDept, setSelectedDept] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)

    const [newLog, setNewLog] = useState({
        title: '',
        department: DEPARTMENTS[0] || 'Operations',
        auditor: '',
        progress: 10,
        findingsRaised: 0,
        pendingActions: 0,
        status: 'In Progress',
        startedDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        auditorComments: '',
    })

    const saveMonitoring = (updated) => {
        setMonitoringData(updated)
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch {
            /* ignore storage issues */
        }
    }

    const filteredRecords = useMemo(() => {
        return monitoringData.filter((item) => {
            if (search.trim()) {
                const q = search.toLowerCase()
                const match =
                    item.id.toLowerCase().includes(q) ||
                    item.title.toLowerCase().includes(q) ||
                    item.auditor.toLowerCase().includes(q)
                if (!match) return false
            }
            if (selectedDept && item.department !== selectedDept) return false
            if (selectedStatus && item.status !== selectedStatus) return false
            return true
        })
    }, [monitoringData, search, selectedDept, selectedStatus])

    const handleCreateSubmit = (e) => {
        e.preventDefault()
        if (!newLog.title.trim()) {
            toast.error('Audit title is required.')
            return
        }
        if (!newLog.auditor.trim()) {
            toast.error('Auditor name is required.')
            return
        }

        const newId = `AUD-2026-0${monitoringData.length + 25}`
        const createdRecord = {
            id: newId,
            title: newLog.title.trim(),
            department: newLog.department,
            auditor: newLog.auditor.trim(),
            progress: Number(newLog.progress) || 0,
            findingsRaised: Number(newLog.findingsRaised) || 0,
            pendingActions: Number(newLog.pendingActions) || 0,
            status: newLog.status,
            startedDate: newLog.startedDate || new Date().toISOString().split('T')[0],
            dueDate: newLog.dueDate || '30-06-2026',
            completionPercent: Number(newLog.progress) || 0,
            findingsCount: Number(newLog.findingsRaised) || 0,
            complianceScore: 85,
            auditorComments: newLog.auditorComments.trim() || 'Monitoring log initiated by Joint Director - Audit.',
            escalations: 'None at this stage.',
        }

        const updated = [createdRecord, ...monitoringData]
        saveMonitoring(updated)
        toast.success(`Audit monitoring log ${newId} initiated successfully.`)
        setShowAddModal(false)
        setNewLog({
            title: '',
            department: DEPARTMENTS[0] || 'Operations',
            auditor: '',
            progress: 10,
            findingsRaised: 0,
            pendingActions: 0,
            status: 'In Progress',
            startedDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            auditorComments: '',
        })
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-sm text-[#667085] mb-4'>
                    Central hub for tracking audit execution — monitor progress, findings, and pending actions across active audits.
                </p>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearch('')
                            setSelectedDept('')
                            setSelectedStatus('')
                            setFromDate(null)
                            setToDate(null)
                        }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Audit ID, title, auditor...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='department' className='text-base font-medium text-[#808080]'>Department</label>
                        <select
                            id='department'
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {DEPARTMENTS.map((dept) => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status'
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {MONITORING_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Audit Monitoring List</h2>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={() => setShowAddModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Initiate Monitoring Log
                        </button>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm px-4 py-2 rounded-md transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Audit ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Audit Title</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Department</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Auditor</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Progress %</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Findings Raised</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Pending Actions</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((item) => (
                                <tr key={item.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{item.id}</td>
                                    <td className='px-2 py-4 max-w-[180px] truncate' title={item.title}>{item.title}</td>
                                    <td className='px-2 py-4'>{item.department}</td>
                                    <td className='px-2 py-4'>{item.auditor}</td>
                                    <td className='px-2 py-4 min-w-[120px]'>
                                        <div className='flex items-center gap-2'>
                                            <div className='flex-1 h-2 bg-[#EDEEF5] rounded-full overflow-hidden min-w-[60px]'>
                                                <div
                                                    className={`h-full rounded-full ${progressBarColor(item.progress)}`}
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>
                                            <span className='text-xs font-semibold text-[#1E1E1E] whitespace-nowrap'>{item.progress}%</span>
                                        </div>
                                    </td>
                                    <td className='px-2 py-4 text-center'>{item.findingsRaised}</td>
                                    <td className='px-2 py-4 text-center'>
                                        <span className={item.pendingActions > 0 ? 'font-semibold text-[#FF9800]' : 'text-[#667085]'}>
                                            {item.pendingActions}
                                        </span>
                                    </td>
                                    <td className='px-2 py-4'>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[item.status]}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink
                                                to={`/joint-director-audit/audit-monitoring/view/${item.id}`}
                                                className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                            >
                                                View
                                            </NavLink>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                            {filteredRecords.length === 0 && (
                                <tr>
                                    <td colSpan={9} className='text-center py-8 text-slate-500'>
                                        No audit monitoring logs found matching the filter criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>Showing 1 to {filteredRecords.length} of {monitoringData.length} entries</p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Initiate Monitoring Modal */}
            {showAddModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150'>
                        <div className='flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50'>
                            <div>
                                <h3 className='text-lg font-bold text-slate-900'>Initiate Audit Monitoring Log</h3>
                                <p className='text-xs text-slate-500 mt-0.5'>Record new audit execution milestone and oversight tracking</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setShowAddModal(false)}
                                className='p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition'
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className='p-5 space-y-4'>
                            <div>
                                <label className='block text-xs font-semibold text-slate-700 uppercase mb-1'>Audit Title *</label>
                                <input
                                    type='text'
                                    required
                                    value={newLog.title}
                                    onChange={(e) => setNewLog({ ...newLog, title: e.target.value })}
                                    placeholder='e.g. Science Lab Equipment Safety Audit'
                                    className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 uppercase mb-1'>Department *</label>
                                    <select
                                        value={newLog.department}
                                        onChange={(e) => setNewLog({ ...newLog, department: e.target.value })}
                                        className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                    >
                                        {DEPARTMENTS.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 uppercase mb-1'>Lead Auditor *</label>
                                    <input
                                        type='text'
                                        required
                                        value={newLog.auditor}
                                        onChange={(e) => setNewLog({ ...newLog, auditor: e.target.value })}
                                        placeholder='e.g. S. Ramanathan'
                                        className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-3 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 uppercase mb-1'>Progress %</label>
                                    <input
                                        type='number'
                                        min='0'
                                        max='100'
                                        value={newLog.progress}
                                        onChange={(e) => setNewLog({ ...newLog, progress: e.target.value })}
                                        className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 uppercase mb-1'>Findings</label>
                                    <input
                                        type='number'
                                        min='0'
                                        value={newLog.findingsRaised}
                                        onChange={(e) => setNewLog({ ...newLog, findingsRaised: e.target.value })}
                                        className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 uppercase mb-1'>Status</label>
                                    <select
                                        value={newLog.status}
                                        onChange={(e) => setNewLog({ ...newLog, status: e.target.value })}
                                        className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                    >
                                        {MONITORING_STATUSES.map((st) => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 uppercase mb-1'>Auditor Comments & Scope</label>
                                <textarea
                                    rows={2}
                                    value={newLog.auditorComments}
                                    onChange={(e) => setNewLog({ ...newLog, auditorComments: e.target.value })}
                                    placeholder='Summary of baseline inspection and milestone expectations...'
                                    className='w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-3 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowAddModal(false)}
                                    className='px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition'
                                >
                                    Initiate Log
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default AuditMonitoringList
