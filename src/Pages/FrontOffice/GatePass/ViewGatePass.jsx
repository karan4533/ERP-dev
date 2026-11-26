import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, Shield, CheckCircle2, Clock } from 'lucide-react'
import { getStudentGatePassById, formatOutTimeForDisplay, statusBadgeColor } from './gatePassData'
import { CAMPUS_NAME } from '../../../Common/GatePassSecurity/gatePassSecurityData'

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-1'>
        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>{label}</span>
        <span className='text-sm font-medium text-slate-800'>{value || '—'}</span>
    </div>
)

const ViewGatePass = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = useMemo(() => getStudentGatePassById(id), [id])

    if (!record) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate('/front-office/gate-pass-list')}
                    className='inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer'
                >
                    <ArrowLeft size={14} /> Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-xs border border-slate-200 p-8 text-center text-slate-500 text-sm'>
                    Gate pass not found.
                </div>
            </section>
        )
    }

    const badgeClass = statusBadgeColor[record.displayStatus] || statusBadgeColor[record.status] || 'bg-slate-100 text-slate-700'

    return (
        <section className='space-y-6 max-w-4xl mx-auto'>
            <div className='flex items-center justify-between'>
                <button
                    type='button'
                    onClick={() => navigate('/front-office/gate-pass-list')}
                    className='inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer'
                >
                    <ArrowLeft size={14} /> Back to list
                </button>
                <button
                    type='button'
                    onClick={() => window.print()}
                    className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer'
                >
                    <Printer size={14} /> Print Pass
                </button>
            </div>

            <div className='rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden'>
                {/* Header Banner */}
                <div className='bg-slate-900 p-6 text-white flex items-center justify-between'>
                    <div>
                        <div className='flex items-center gap-2'>
                            <Shield size={20} className='text-blue-400' />
                            <h2 className='text-base font-bold uppercase tracking-wider'>{CAMPUS_NAME}</h2>
                        </div>
                        <p className='text-xs text-slate-400 mt-1'>
                            Student Security Gate Pass • Pass ID: <span className='font-mono font-bold text-white'>{record.gatePassId || record.id}</span>
                        </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass}`}>
                        {record.displayStatus || record.status}
                    </span>
                </div>

                <div className='p-6 space-y-6'>
                    {/* Student Info Grid */}
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100'>
                        <Field label='Student Full Name' value={record.studentName} />
                        <Field label='Student ID' value={record.studentId} />
                        <Field label='Class & Section' value={record.classSection} />
                        <Field label='Academic Department' value={record.department || 'Academics - Secondary'} />
                        <Field label='Date of Movement' value={record.date} />
                        <Field label='Parent / Guardian Contact' value={record.parentGuardianInfo || record.mobileNumber} />
                    </div>

                    {/* Movement Logistics */}
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100'>
                        <Field label='Expected Departure Time' value={formatOutTimeForDisplay(record.expectedDepartureTime || record.outTime)} />
                        <Field label='Expected Return Time' value={formatOutTimeForDisplay(record.expectedReturnTime)} />
                        <Field label='Accompanying Escort' value={record.accompanyingPerson || 'Parent / Guardian'} />
                        <div className='md:col-span-3'>
                            <Field label='Reason for Leaving' value={record.reason} />
                        </div>
                        {record.remarks && (
                            <div className='md:col-span-3'>
                                <Field label='Special Security Instructions' value={record.remarks} />
                            </div>
                        )}
                    </div>

                    {/* Executive Approval & Security Log */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-1.5'>
                            <div className='text-xs font-bold uppercase text-emerald-800 flex items-center gap-1.5'>
                                <CheckCircle2 size={14} className='text-emerald-600' /> Sanctioning Authority
                            </div>
                            {record.approvedBy ? (
                                <>
                                    <div className='font-bold text-emerald-950 text-sm'>{record.approvedBy.name}</div>
                                    <div className='text-xs text-emerald-700'>{record.approvedBy.roleLabel} • {record.approvedBy.timestamp}</div>
                                    <div className='text-xs text-emerald-800 italic mt-1'>"{record.approvedBy.remarks}"</div>
                                </>
                            ) : (
                                <div className='text-xs text-amber-700 italic flex items-center gap-1'>
                                    <Clock size={12} /> Pending Sanction from Principal or Director of Academics
                                </div>
                            )}
                        </div>

                        <div className='rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5'>
                            <div className='text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5'>
                                <Shield size={14} className='text-slate-500' /> Gate Security Terminal Clearance
                            </div>
                            <div className='text-xs text-slate-600'>
                                <div>Actual Exit: <span className='font-medium text-slate-900'>{record.actualDepartureTime || 'Pending Gate Scan'}</span></div>
                                <div>Actual Return: <span className='font-medium text-slate-900'>{record.actualReturnTime || 'Pending Return'}</span></div>
                                <div>Gate Officer: <span className='font-medium text-slate-900'>{record.exitGatekeeper || 'Ram Singh (Gate #1)'}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ViewGatePass
