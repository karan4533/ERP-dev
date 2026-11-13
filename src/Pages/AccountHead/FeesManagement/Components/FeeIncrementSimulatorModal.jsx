import React, { useMemo, useState } from 'react'
import { Calculator, Download, TrendingUp, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { formatCurrency } from '../../financeDomain/financeHelpers'

const GRADES_DATA = [
    { grade: 'Pre-KG - UKG', currentAnnual: 48000, students: 280 },
    { grade: 'Grade 1 - 5', currentAnnual: 62000, students: 640 },
    { grade: 'Grade 6 - 8', currentAnnual: 75000, students: 510 },
    { grade: 'Grade 9 - 10', currentAnnual: 88000, students: 460 },
    { grade: 'Grade 11 - 12 (Science)', currentAnnual: 105000, students: 290 },
    { grade: 'Grade 11 - 12 (Commerce)', currentAnnual: 98000, students: 270 },
]

const FeeIncrementSimulatorModal = ({ isOpen, onClose }) => {
    const [percentage, setPercentage] = useState(8)
    const [academicYear, setAcademicYear] = useState('2027-2028 (Proposed)')
    const [applyTuition, setApplyTuition] = useState(true)
    const [applyTerm, setApplyTerm] = useState(true)
    const [applyTransport, setApplyTransport] = useState(false)

    const simulationRows = useMemo(() => {
        const factor = 1 + (Number(percentage) || 0) / 100
        return GRADES_DATA.map((row) => {
            const proposedAnnual = Math.round(row.currentAnnual * factor)
            const deltaPerStudent = proposedAnnual - row.currentAnnual
            const currentTotal = row.currentAnnual * row.students
            const proposedTotal = proposedAnnual * row.students
            const surplusDelta = proposedTotal - currentTotal
            return {
                ...row,
                proposedAnnual,
                deltaPerStudent,
                currentTotal,
                proposedTotal,
                surplusDelta,
            }
        })
    }, [percentage])

    const totals = useMemo(() => {
        const totalStudents = simulationRows.reduce((sum, r) => sum + r.students, 0)
        const currentTotalRevenue = simulationRows.reduce((sum, r) => sum + r.currentTotal, 0)
        const proposedTotalRevenue = simulationRows.reduce((sum, r) => sum + r.proposedTotal, 0)
        const totalSurplus = proposedTotalRevenue - currentTotalRevenue
        return { totalStudents, currentTotalRevenue, proposedTotalRevenue, totalSurplus }
    }, [simulationRows])

    if (!isOpen) return null

    return (
        <div
            className='fixed inset-0 z-250 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'
            role='dialog'
            aria-modal='true'
            aria-labelledby='simulator-title'
        >
            <div className='w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] flex flex-col'>
                <div className='flex items-center justify-between border-b border-[var(--erp-line)] pb-4'>
                    <div className='flex items-center gap-2.5'>
                        <span className='rounded-lg bg-[var(--erp-indigo)]/10 p-2 text-[var(--erp-indigo)]'>
                            <Calculator size={22} />
                        </span>
                        <div>
                            <h2 id='simulator-title' className='text-xl font-bold text-[var(--erp-ink)]'>
                                Annual Fee % Increment Simulator
                            </h2>
                            <p className='text-xs text-[var(--erp-muted)]'>
                                Simulate class-wise fee increase percentages, student enrollment impact, and institutional revenue deltas.
                            </p>
                        </div>
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='rounded-lg p-1.5 text-[var(--erp-muted)] hover:bg-[var(--erp-canvas)]'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='overflow-y-auto space-y-5 py-4'>
                    {/* Controls Bar */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-[var(--erp-canvas)] p-3.5 rounded-xl border border-[var(--erp-line)]'>
                        <div>
                            <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Target Academic Year</label>
                            <input
                                type='text'
                                readOnly
                                value={academicYear}
                                className='w-full text-xs font-semibold rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 py-2 text-[var(--erp-ink)]'
                            />
                        </div>
                        <div>
                            <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Proposed Increment (%)</label>
                            <div className='flex items-center gap-2'>
                                <input
                                    type='number'
                                    step='0.5'
                                    min='0'
                                    max='50'
                                    value={percentage}
                                    onChange={(e) => setPercentage(Number(e.target.value))}
                                    className='w-full text-sm font-bold text-[var(--erp-indigo)] rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 py-1.5'
                                />
                                <span className='text-sm font-bold text-[var(--erp-slate)]'>%</span>
                            </div>
                        </div>
                        <div className='sm:col-span-2 flex flex-col justify-center'>
                            <span className='block text-xs font-semibold text-[var(--erp-slate)] mb-1.5'>Applicable Heads</span>
                            <div className='flex flex-wrap gap-3 text-xs font-medium text-[var(--erp-slate)]'>
                                <label className='flex items-center gap-1.5 cursor-pointer'>
                                    <input type='checkbox' checked={applyTuition} onChange={(e) => setApplyTuition(e.target.checked)} />
                                    Tuition
                                </label>
                                <label className='flex items-center gap-1.5 cursor-pointer'>
                                    <input type='checkbox' checked={applyTerm} onChange={(e) => setApplyTerm(e.target.checked)} />
                                    Term &amp; Lab
                                </label>
                                <label className='flex items-center gap-1.5 cursor-pointer'>
                                    <input type='checkbox' checked={applyTransport} onChange={(e) => setApplyTransport(e.target.checked)} />
                                    Transport
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* KPI Impact Cards */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                        <div className='rounded-xl border border-[var(--erp-line)] bg-white p-3 shadow-xs'>
                            <p className='text-xs font-medium text-[var(--erp-muted)]'>Student Headcount</p>
                            <p className='text-xl font-bold text-[var(--erp-ink)] mt-1'>{totals.totalStudents.toLocaleString()} students</p>
                        </div>
                        <div className='rounded-xl border border-[var(--erp-line)] bg-white p-3 shadow-xs'>
                            <p className='text-xs font-medium text-[var(--erp-muted)]'>Current Revenue Base</p>
                            <p className='text-xl font-bold text-[var(--erp-ink)] mt-1'>{formatCurrency(totals.currentTotalRevenue)}</p>
                        </div>
                        <div className='rounded-xl border border-[var(--erp-line)] bg-white p-3 shadow-xs'>
                            <p className='text-xs font-medium text-[var(--erp-muted)]'>Projected Revenue</p>
                            <p className='text-xl font-bold text-[var(--erp-indigo)] mt-1'>{formatCurrency(totals.proposedTotalRevenue)}</p>
                        </div>
                        <div className='rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-xs'>
                            <p className='text-xs font-bold text-emerald-800 flex items-center gap-1'>
                                <TrendingUp size={14} /> Annual Surplus Delta
                            </p>
                            <p className='text-xl font-bold text-emerald-700 mt-1'>+{formatCurrency(totals.totalSurplus)}</p>
                        </div>
                    </div>

                    {/* Detailed Simulation Table */}
                    <div className='rounded-xl border border-[var(--erp-line)] overflow-hidden shadow-xs'>
                        <table className='w-full text-xs text-left'>
                            <thead className='bg-[var(--erp-canvas)] text-[var(--erp-slate)] uppercase tracking-wider font-semibold border-b border-[var(--erp-line)]'>
                                <tr>
                                    <th className='px-3 py-3'>Grade Group</th>
                                    <th className='px-3 py-3'>Enrollment</th>
                                    <th className='px-3 py-3'>Current Fee / Student</th>
                                    <th className='px-3 py-3 text-[var(--erp-indigo)]'>Proposed (+{percentage}%)</th>
                                    <th className='px-3 py-3'>Per Student Delta</th>
                                    <th className='px-3 py-3 text-right'>Institutional Surplus</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-[var(--erp-line)]'>
                                {simulationRows.map((row) => (
                                    <tr key={row.grade} className='hover:bg-slate-50/50'>
                                        <td className='px-3 py-2.5 font-semibold text-[var(--erp-ink)]'>{row.grade}</td>
                                        <td className='px-3 py-2.5 text-[var(--erp-slate)]'>{row.students}</td>
                                        <td className='px-3 py-2.5'>{formatCurrency(row.currentAnnual)}</td>
                                        <td className='px-3 py-2.5 font-bold text-[var(--erp-indigo)]'>{formatCurrency(row.proposedAnnual)}</td>
                                        <td className='px-3 py-2.5 text-emerald-600 font-semibold'>+{formatCurrency(row.deltaPerStudent)}</td>
                                        <td className='px-3 py-2.5 text-right font-bold text-emerald-700'>+{formatCurrency(row.surplusDelta)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className='flex items-center justify-between border-t border-[var(--erp-line)] pt-4 mt-auto'>
                    <button
                        type='button'
                        onClick={() => toast.success('Simulation spreadsheet exported.')}
                        className='inline-flex items-center gap-1.5 rounded-lg border border-[var(--erp-line-strong)] px-3 py-2 text-xs font-semibold text-[var(--erp-slate)] hover:bg-[var(--erp-canvas)]'
                    >
                        <Download size={15} /> Export Simulation CSV
                    </button>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='rounded-lg border border-[var(--erp-line-strong)] px-4 py-2 text-xs font-semibold text-[var(--erp-slate)] hover:bg-[var(--erp-canvas)]'
                        >
                            Close
                        </button>
                        <button
                            type='button'
                            onClick={() => {
                                toast.success(`Proposed ${percentage}% fee structure staged for Academic Council & MD Review.`)
                                onClose()
                            }}
                            className='rounded-lg bg-[var(--erp-indigo)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--erp-indigo-dark)]'
                        >
                            Submit Proposal for Council Approval
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FeeIncrementSimulatorModal

