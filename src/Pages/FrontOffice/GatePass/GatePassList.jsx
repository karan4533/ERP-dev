import React, { useMemo, useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    Plus,
    Search,
    Printer,
    CheckCircle2,
    Clock,
    Shield,
    X,
    Eye,
    Trash2,
    QrCode
} from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { useAuth } from '../../../Context/AuthContext'
import { canRoleDelete } from '../../../Common/RBAC/actionPermissions'
import {
    STATUS_OPTIONS,
    deleteStudentGatePass,
    filterStudentGatePasses,
    formatOutTimeForDisplay,
    getStudentGatePasses,
    statusBadgeColor,
} from './gatePassData'
import { CAMPUS_NAME } from '../../../Common/GatePassSecurity/gatePassSecurityData'

const GatePassList = () => {
    const { role } = useAuth()
    const canDelete = canRoleDelete(role)
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [entriesPerPage, setEntriesPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(1)
    const [records, setRecords] = useState(() => getStudentGatePasses())
    const [selectedPass, setSelectedPass] = useState(null)

    const refresh = () => setRecords(getStudentGatePasses())

    useEffect(() => {
        const handleSync = () => refresh()
        if (typeof window !== 'undefined') {
            window.addEventListener('schoolerp-gatepass-security-sync', handleSync)
            window.addEventListener('schoolerp-gate-pass-updated', handleSync)
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('schoolerp-gatepass-security-sync', handleSync)
                window.removeEventListener('schoolerp-gate-pass-updated', handleSync)
            }
        }
    }, [])

    const filteredRecords = useMemo(
        () => filterStudentGatePasses(records, { search, status }),
        [records, search, status],
    )

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / entriesPerPage))
    const visibleRecords = useMemo(() => {
        const start = (currentPage - 1) * entriesPerPage
        return filteredRecords.slice(start, start + entriesPerPage)
    }, [filteredRecords, currentPage, entriesPerPage])

    const clearFilters = () => {
        setSearch('')
        setStatus('')
        setFromDate(null)
        setToDate(null)
        setCurrentPage(1)
    }

    const handleDelete = (id) => {
        const result = deleteStudentGatePass(id)
        if (result.success) {
            refresh()
            toast.success('Gate pass cancelled.')
        } else {
            toast.error(result.message || 'Cannot cancel pass.')
        }
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <section className='space-y-6'>
            {/* Header / Filter Toolbar */}
            <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-xs'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <h2 className='text-base font-bold text-slate-900'>Student Gate Pass Management</h2>
                        <p className='text-xs text-slate-500'>
                            Front-office issuance, OR-based executive approval tracking, and gate departure verification.
                        </p>
                    </div>
                    <div className='flex items-center gap-2.5'>
                        <button
                            type='button'
                            onClick={clearFilters}
                            className='rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer'
                        >
                            Clear Filters
                        </button>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer'
                        >
                            <Download size={14} /> Export CSV
                        </button>
                        <NavLink
                            to='/front-office/add-gate-pass'
                            className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer'
                        >
                            <Plus size={14} /> + Request Student Gate Pass
                        </NavLink>
                    </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100'>
                    <div className='flex flex-col gap-1.5'>
                        <label htmlFor='search' className='text-xs font-semibold text-slate-700'>
                            Quick Search
                        </label>
                        <div className='relative'>
                            <Search size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
                            <input
                                id='search'
                                type='text'
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setCurrentPage(1)
                                }}
                                placeholder='Student ID, Name, Pass ID, Class...'
                                className='w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs focus:border-blue-500 focus:outline-none'
                            />
                        </div>
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label htmlFor='status' className='text-xs font-semibold text-slate-700'>
                            Approval &amp; Gate Status
                        </label>
                        <select
                            id='status'
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value)
                                setCurrentPage(1)
                            }}
                            className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none'
                        >
                            <option value=''>All Statuses</option>
                            {STATUS_OPTIONS.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label className='text-xs font-semibold text-slate-700'>Date From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={setFromDate}
                                isClearable
                                dateFormat='dd-MM-yyyy'
                                placeholderText='Start Date'
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none pr-8'
                            />
                            <Calendar size={14} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                        </div>
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label className='text-xs font-semibold text-slate-700'>Date To</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={toDate}
                                onChange={setToDate}
                                isClearable
                                dateFormat='dd-MM-yyyy'
                                placeholderText='End Date'
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none pr-8'
                            />
                            <Calendar size={14} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            {/* Passes Table */}
            <div className='rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden'>
                <div className='overflow-x-auto'>
                    <table className='w-full text-left text-xs'>
                        <thead>
                            <tr className='border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                <th className='py-3.5 px-4'>Gate Pass / Request ID</th>
                                <th className='py-3.5 px-4'>Student Information</th>
                                <th className='py-3.5 px-4'>Class &amp; Dept</th>
                                <th className='py-3.5 px-4'>Reason for Leaving</th>
                                <th className='py-3.5 px-4'>Timings (Dep / Return)</th>
                                <th className='py-3.5 px-4'>Accompanying Person</th>
                                <th className='py-3.5 px-4'>Approved By</th>
                                <th className='py-3.5 px-4 text-center'>Status</th>
                                <th className='py-3.5 px-4 text-right'>Action</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100 text-slate-700'>
                            {visibleRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className='py-8 text-center text-slate-400'>
                                        No student gate passes found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                visibleRecords.map((r) => {
                                    const badgeClass = statusBadgeColor[r.displayStatus] || statusBadgeColor[r.status] || 'bg-slate-100 text-slate-700'
                                    return (
                                        <tr key={r.id} className='hover:bg-slate-50/70 transition-colors'>
                                            <td className='py-3.5 px-4'>
                                                <div className='font-mono font-bold text-slate-900'>{r.gatePassId || r.id}</div>
                                                <div className='text-[10px] text-slate-400'>{r.date}</div>
                                            </td>
                                            <td className='py-3.5 px-4'>
                                                <div className='font-semibold text-slate-900'>{r.studentName}</div>
                                                <div className='font-mono text-[11px] text-blue-600'>{r.studentId}</div>
                                            </td>
                                            <td className='py-3.5 px-4'>
                                                <div className='font-medium text-slate-800'>{r.classSection}</div>
                                                <div className='text-[10px] text-slate-400'>{r.department || 'Academics'}</div>
                                            </td>
                                            <td className='py-3.5 px-4 max-w-xs'>
                                                <p className='truncate text-slate-700 font-medium' title={r.reason}>
                                                    {r.reason}
                                                </p>
                                                {r.remarks && (
                                                    <p className='truncate text-[10px] text-slate-400' title={r.remarks}>
                                                        Note: {r.remarks}
                                                    </p>
                                                )}
                                            </td>
                                            <td className='py-3.5 px-4'>
                                                <div className='text-slate-700'>
                                                    <span className='font-semibold'>Out:</span> {formatOutTimeForDisplay(r.expectedDepartureTime || r.outTime)}
                                                </div>
                                                <div className='text-slate-500 text-[11px]'>
                                                    <span className='font-semibold'>Exp Return:</span> {formatOutTimeForDisplay(r.expectedReturnTime)}
                                                </div>
                                                {r.actualDepartureTime && (
                                                    <div className='text-[10px] text-indigo-600 font-mono'>
                                                        Actual Exit: {r.actualDepartureTime}
                                                    </div>
                                                )}
                                            </td>
                                            <td className='py-3.5 px-4 text-slate-600'>
                                                <div>{r.accompanyingPerson || 'Parent / Guardian'}</div>
                                                {r.parentGuardianInfo && (
                                                    <div className='text-[10px] text-slate-400 truncate max-w-[150px]' title={r.parentGuardianInfo}>
                                                        {r.parentGuardianInfo}
                                                    </div>
                                                )}
                                            </td>
                                            <td className='py-3.5 px-4'>
                                                {r.approvedBy ? (
                                                    <div>
                                                        <div className='font-semibold text-emerald-800'>{r.approvedBy.name}</div>
                                                        <div className='text-[10px] text-emerald-600'>{r.approvedBy.roleLabel || r.approvedBy.role}</div>
                                                        <div className='text-[10px] text-slate-400 font-mono'>{r.approvedBy.timestamp}</div>
                                                    </div>
                                                ) : (
                                                    <span className='inline-flex items-center gap-1 text-[11px] text-amber-600 italic'>
                                                        <Clock size={11} /> Awaiting Exec
                                                    </span>
                                                )}
                                            </td>
                                            <td className='py-3.5 px-4 text-center'>
                                                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeClass}`}>
                                                    {r.displayStatus || r.status}
                                                </span>
                                            </td>
                                            <td className='py-3.5 px-4 text-right'>
                                                <div className='flex items-center justify-end gap-1.5'>
                                                    <button
                                                        type='button'
                                                        onClick={() => setSelectedPass(r)}
                                                        className='inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition cursor-pointer'
                                                        title='View & Print Gate Pass'
                                                    >
                                                        <Eye size={12} /> View Pass
                                                    </button>
                                                    {canDelete && r.status === 'Pending Approval' && (
                                                        <button
                                                            type='button'
                                                            onClick={() => handleDelete(r.id)}
                                                            className='rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer'
                                                            title='Cancel Request'
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Toolbar */}
                <div className='flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-4 py-3 text-xs text-slate-600'>
                    <div className='flex items-center gap-2'>
                        <span>Rows per page:</span>
                        <select
                            value={entriesPerPage}
                            onChange={(e) => {
                                setEntriesPerPage(Number(e.target.value))
                                setCurrentPage(1)
                            }}
                            className='rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs'
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                        <span className='ml-2 text-slate-400'>
                            Showing {visibleRecords.length} of {filteredRecords.length} records
                        </span>
                    </div>

                    <div className='flex items-center gap-1.5'>
                        <button
                            type='button'
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className='rounded-lg border border-slate-200 bg-white p-1.5 disabled:opacity-30 hover:bg-slate-50 transition cursor-pointer'
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className='px-2 font-medium'>
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            type='button'
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className='rounded-lg border border-slate-200 bg-white p-1.5 disabled:opacity-30 hover:bg-slate-50 transition cursor-pointer'
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Printable Official Student Gate Pass Modal */}
            {selectedPass && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150'>
                        {/* Modal Header */}
                        <div className='flex items-center justify-between bg-slate-900 px-5 py-3.5 text-white'>
                            <div className='flex items-center gap-2'>
                                <Shield size={18} className='text-blue-400' />
                                <span className='text-xs font-bold uppercase tracking-wider'>
                                    Official Campus Student Gate Pass
                                </span>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedPass(null)}
                                className='rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer'
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Printable Pass Body */}
                        <div id='printable-student-gate-pass' className='p-6 space-y-5 bg-white'>
                            {/* School Header */}
                            <div className='text-center border-b border-slate-200 pb-4'>
                                <h3 className='text-base font-extrabold tracking-tight text-slate-900'>
                                    {CAMPUS_NAME}
                                </h3>
                                <p className='text-[11px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5'>
                                    Authorized Student Security Gate Pass
                                </p>
                                <div className='inline-block mt-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 font-mono text-xs font-bold text-blue-800'>
                                    Pass ID: {selectedPass.gatePassId || selectedPass.id}
                                </div>
                            </div>

                            {/* Student Profile & QR Visual */}
                            <div className='flex items-start justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100'>
                                <div className='space-y-1 text-xs'>
                                    <div className='text-[10px] font-bold uppercase tracking-wider text-slate-400'>
                                        Student Information
                                    </div>
                                    <div className='text-sm font-bold text-slate-900'>{selectedPass.studentName}</div>
                                    <div className='text-slate-600'>Student ID: <span className='font-mono font-bold'>{selectedPass.studentId}</span></div>
                                    <div className='text-slate-600'>Class: <span className='font-semibold'>{selectedPass.classSection}</span></div>
                                    <div className='text-slate-600'>Dept: <span>{selectedPass.department || 'Academics'}</span></div>
                                </div>

                                {/* Simulated crisp barcode & QR block */}
                                <div className='flex flex-col items-center justify-center bg-white p-2.5 rounded-lg border border-slate-200 text-center shrink-0'>
                                    <svg viewBox='0 0 100 100' className='w-16 h-16'>
                                        {/* Stylized QR Matrix Pattern */}
                                        <rect width='100' height='100' fill='white' />
                                        <rect x='10' y='10' width='25' height='25' fill='#0F172A' />
                                        <rect x='15' y='15' width='15' height='15' fill='white' />
                                        <rect x='18' y='18' width='9' height='9' fill='#0F172A' />

                                        <rect x='65' y='10' width='25' height='25' fill='#0F172A' />
                                        <rect x='70' y='15' width='15' height='15' fill='white' />
                                        <rect x='73' y='18' width='9' height='9' fill='#0F172A' />

                                        <rect x='10' y='65' width='25' height='25' fill='#0F172A' />
                                        <rect x='15' y='70' width='15' height='15' fill='white' />
                                        <rect x='18' y='73' width='9' height='9' fill='#0F172A' />

                                        <rect x='45' y='15' width='10' height='10' fill='#0F172A' />
                                        <rect x='45' y='35' width='10' height='10' fill='#0F172A' />
                                        <rect x='25' y='45' width='10' height='10' fill='#0F172A' />
                                        <rect x='45' y='55' width='10' height='10' fill='#0F172A' />
                                        <rect x='65' y='45' width='10' height='10' fill='#0F172A' />
                                        <rect x='75' y='65' width='15' height='15' fill='#0F172A' />
                                        <rect x='45' y='75' width='10' height='10' fill='#0F172A' />
                                    </svg>
                                    <span className='font-mono text-[9px] font-bold text-slate-500 mt-1'>
                                        SECURITY VERIFIED
                                    </span>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className='grid grid-cols-2 gap-3 text-xs'>
                                <div className='rounded-lg border border-slate-100 p-2.5'>
                                    <span className='text-[10px] uppercase font-bold text-slate-400 block'>Reason for Exit</span>
                                    <span className='font-medium text-slate-800'>{selectedPass.reason}</span>
                                </div>
                                <div className='rounded-lg border border-slate-100 p-2.5'>
                                    <span className='text-[10px] uppercase font-bold text-slate-400 block'>Accompanying Escort</span>
                                    <span className='font-medium text-slate-800'>{selectedPass.accompanyingPerson || 'Parent / Guardian'}</span>
                                </div>
                                <div className='rounded-lg border border-slate-100 p-2.5'>
                                    <span className='text-[10px] uppercase font-bold text-slate-400 block'>Date &amp; Expected Departure</span>
                                    <span className='font-medium text-slate-800'>{selectedPass.date} at {formatOutTimeForDisplay(selectedPass.expectedDepartureTime || selectedPass.outTime)}</span>
                                </div>
                                <div className='rounded-lg border border-slate-100 p-2.5'>
                                    <span className='text-[10px] uppercase font-bold text-slate-400 block'>Expected Return</span>
                                    <span className='font-medium text-slate-800'>{formatOutTimeForDisplay(selectedPass.expectedReturnTime)}</span>
                                </div>
                            </div>

                            {/* Approval Stamp */}
                            <div className='rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-center justify-between text-xs'>
                                <div>
                                    <div className='text-[10px] uppercase font-bold tracking-wider text-emerald-800'>Sanctioning Authority</div>
                                    <div className='font-bold text-emerald-950'>
                                        {selectedPass.approvedBy ? selectedPass.approvedBy.name : 'Pending Sanction'}
                                    </div>
                                    <div className='text-[11px] text-emerald-700'>
                                        {selectedPass.approvedBy ? `${selectedPass.approvedBy.roleLabel} • Approved on ${selectedPass.approvedBy.timestamp}` : 'Awaiting Principal or Director Approval'}
                                    </div>
                                </div>
                                <CheckCircle2 size={24} className={selectedPass.approvedBy ? 'text-emerald-600' : 'text-slate-300'} />
                            </div>

                            {/* Security Gate Verification Section */}
                            <div className='rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs space-y-1.5'>
                                <div className='flex items-center justify-between font-bold text-slate-700'>
                                    <span>Gate Security Verification</span>
                                    <span className='font-mono font-normal text-[11px]'>Status: {selectedPass.displayStatus || selectedPass.status}</span>
                                </div>
                                <div className='grid grid-cols-2 gap-2 text-[11px] text-slate-600'>
                                    <div>Actual Departure: <span className='font-medium text-slate-900'>{selectedPass.actualDepartureTime || 'Pending Gate Scan'}</span></div>
                                    <div>Actual Return: <span className='font-medium text-slate-900'>{selectedPass.actualReturnTime || 'Pending Return'}</span></div>
                                    <div>Clearance Officer: <span className='font-medium text-slate-900'>{selectedPass.exitGatekeeper || 'Ram Singh (Gate #1)'}</span></div>
                                    <div>Campus: <span className='font-medium text-slate-900'>Main Campus Gate #1</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer / Actions */}
                        <div className='flex items-center justify-end gap-2 bg-slate-50 px-5 py-3 border-t border-slate-100'>
                            <button
                                type='button'
                                onClick={() => setSelectedPass(null)}
                                className='rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer'
                            >
                                Close
                            </button>
                            <button
                                type='button'
                                onClick={handlePrint}
                                className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer'
                            >
                                <Printer size={14} /> Print Gate Pass
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {exportModal && (
                <ExportModal
                    isOpen={exportModal}
                    onClose={() => setExportModal(false)}
                    data={filteredRecords}
                    filename='Student_Gate_Pass_Register'
                />
            )}
        </section>
    )
}

export default GatePassList
