import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useFinance } from '../../financeDomain/FinanceContext'
import { DEFAULT_ACADEMIC_YEAR } from '../../financeDomain/financeConstants'
import {
    buildAcademicYearOptions,
    loadAdminAcademicYears,
} from '../feeCampusOptions'
import {
    createActivity,
    enrollStudent,
    getActivityFeeState,
    hydrateActivityFeesFromApi,
    removeEnrollment,
} from '../activityFees'

const inputClass = 'border border-[#D9D9D9] rounded-md px-3 py-2.5 text-sm w-full focus:outline-none focus:border-[#515DEF]'

const ActivityFeesTab = () => {
    const { students, feeStructures } = useFinance()
    const [state, setState] = useState(() => getActivityFeeState())
    const [adminYears, setAdminYears] = useState([])
    const [saving, setSaving] = useState(false)
    const [name, setName] = useState('')
    const [academicYear, setAcademicYear] = useState(DEFAULT_ACADEMIC_YEAR)
    const [amount, setAmount] = useState('')
    const [remarks, setRemarks] = useState('')
    const [enrollActivityId, setEnrollActivityId] = useState('')
    const [enrollStudentId, setEnrollStudentId] = useState('')

    const refresh = () => setState(getActivityFeeState())

    useEffect(() => {
        hydrateActivityFeesFromApi().finally(() => refresh())
        loadAdminAcademicYears()
            .then((years) => setAdminYears(years))
            .catch(() => setAdminYears([]))
    }, [])

    const { years: yearOptions, currentYear } = useMemo(
        () => buildAcademicYearOptions({ students, feeStructures, adminYears }),
        [students, feeStructures, adminYears],
    )

    useEffect(() => {
        if (currentYear) setAcademicYear(currentYear)
    }, [currentYear])

    const handleCreate = async (event) => {
        event.preventDefault()
        setSaving(true)
        try {
            const result = await createActivity({
                name,
                academicYear,
                amount,
                remarks,
            })
            if (!result.success) {
                toast.error(result.message || 'Could not create activity.')
                return
            }
            toast.success(`Created “${result.activity.name}” · ₹${result.activity.amount} · ${result.activity.academicYear}`)
            setName('')
            setAmount('')
            setRemarks('')
            refresh()
        } finally {
            setSaving(false)
        }
    }

    const handleEnroll = async (event) => {
        event.preventDefault()
        const student = students.find((item) => item.id === enrollStudentId)
        setSaving(true)
        try {
            const result = await enrollStudent({
                activityId: enrollActivityId,
                studentId: enrollStudentId,
                studentName: student?.name || '',
            })
            if (!result.success) {
                toast.error(result.message || 'Could not enroll student.')
                return
            }
            toast.success(`Enrolled ${result.enrollment.studentName || 'student'} · ${result.enrollment.activityName} (shown in Activities module)`)
            setEnrollStudentId('')
            refresh()
        } finally {
            setSaving(false)
        }
    }

    const handleRemove = async (enrollmentId) => {
        await removeEnrollment(enrollmentId)
        refresh()
        toast.info('Enrollment removed.')
    }

    return (
        <div className='space-y-6'>
            <form onSubmit={handleCreate} className='bg-white rounded-2xl shadow-md p-4 space-y-4'>
                <div>
                    <h2 className='text-lg font-medium text-[#1E1E1E]'>Create activity</h2>
                    <p className='text-sm text-[#667085] mt-1'>
                        Define the activity name, map an academic year, and set the fee amount. Selecting this activity under Fee Structure auto-fills that amount.
                    </p>
                </div>
                <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-3'>
                    <div className='flex flex-col gap-y-1.5 lg:col-span-2'>
                        <label className='text-sm font-medium text-[#808080]'>Activity name <span className='text-[#FF5722]'>*</span></label>
                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                            placeholder='e.g. Rifle, ASA, Chess Club'
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-sm font-medium text-[#808080]'>Academic year <span className='text-[#FF5722]'>*</span></label>
                        <select
                            value={academicYear}
                            onChange={(event) => setAcademicYear(event.target.value)}
                            required
                            className={inputClass}
                        >
                            {yearOptions.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-sm font-medium text-[#808080]'>Amount (₹) <span className='text-[#FF5722]'>*</span></label>
                        <input
                            type='number'
                            min='0'
                            step='1'
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                            required
                            placeholder='Cost of this activity'
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-1.5 md:col-span-2 lg:col-span-3'>
                        <label className='text-sm font-medium text-[#808080]'>Remarks</label>
                        <input
                            value={remarks}
                            onChange={(event) => setRemarks(event.target.value)}
                            placeholder='Optional'
                            className={inputClass}
                        />
                    </div>
                    <div className='flex items-end'>
                        <button
                            type='submit'
                            disabled={saving}
                            className='w-full bg-[#515DEF] text-white rounded-md text-sm px-4 py-2.5 cursor-pointer hover:opacity-90 disabled:opacity-50'
                        >
                            {saving ? 'Saving…' : 'Create activity'}
                        </button>
                    </div>
                </div>
            </form>

            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <h2 className='text-lg font-medium text-[#1E1E1E] mb-3'>Activity catalogue</h2>
                <table className='w-full text-sm text-left'>
                    <thead className='bg-[#EDEEF5]'>
                        <tr>
                            {['Activity', 'Academic year', 'Amount', 'Status'].map((label) => (
                                <th key={label} className='px-3 py-2.5 font-medium text-[#0C1E5B]'>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {state.activities.length === 0 && (
                            <tr>
                                <td colSpan={4} className='px-3 py-6 text-[#667085]'>
                                    No activities yet. Create one above — it becomes selectable in Fee Structure with its amount.
                                </td>
                            </tr>
                        )}
                        {state.activities.map((item) => (
                            <tr key={item.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-3 py-3 font-medium text-[#1E1E1E]'>{item.name}</td>
                                <td className='px-3 py-3 text-[#667085]'>{item.academicYear}</td>
                                <td className='px-3 py-3 text-[#1E1E1E]'>₹{Number(item.amount || 0).toLocaleString('en-IN')}</td>
                                <td className='px-3 py-3 text-[#667085]'>{item.status || 'Active'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <form onSubmit={handleEnroll} className='bg-white rounded-2xl shadow-md p-4 space-y-4'>
                <div>
                    <h2 className='text-lg font-medium text-[#1E1E1E]'>Enroll student</h2>
                    <p className='text-sm text-[#667085] mt-1'>
                        After enrollment, only the activity name appears in the Activities module for that student.
                    </p>
                </div>
                <div className='grid md:grid-cols-3 gap-3'>
                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-sm font-medium text-[#808080]'>Activity</label>
                        <select
                            value={enrollActivityId}
                            onChange={(event) => setEnrollActivityId(event.target.value)}
                            required
                            className={inputClass}
                        >
                            <option value=''>Select activity</option>
                            {state.activities.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name} · {item.academicYear} · ₹{item.amount}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-sm font-medium text-[#808080]'>Student</label>
                        <select
                            value={enrollStudentId}
                            onChange={(event) => setEnrollStudentId(event.target.value)}
                            required
                            className={inputClass}
                        >
                            <option value=''>Select student</option>
                            {students.map((student) => (
                                <option key={student.id} value={student.id}>{student.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex items-end'>
                        <button
                            type='submit'
                            disabled={saving || !state.activities.length}
                            className='w-full bg-[#515DEF] text-white rounded-md text-sm px-4 py-2.5 cursor-pointer hover:opacity-90 disabled:opacity-50'
                        >
                            Enroll
                        </button>
                    </div>
                </div>
            </form>

            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <h2 className='text-lg font-medium text-[#1E1E1E] mb-3'>Enrollments</h2>
                <table className='w-full text-sm text-left'>
                    <thead className='bg-[#EDEEF5]'>
                        <tr>
                            {['Activity name', 'Student', 'Academic year', ''].map((label) => (
                                <th key={label || 'actions'} className='px-3 py-2.5 font-medium text-[#0C1E5B]'>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {state.enrollments.length === 0 && (
                            <tr>
                                <td colSpan={4} className='px-3 py-6 text-[#667085]'>No student enrollments yet.</td>
                            </tr>
                        )}
                        {state.enrollments.map((item) => (
                            <tr key={item.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-3 py-3 font-medium text-[#1E1E1E]'>{item.activityName}</td>
                                <td className='px-3 py-3 text-[#667085]'>{item.studentName || item.studentId}</td>
                                <td className='px-3 py-3 text-[#667085]'>{item.academicYear}</td>
                                <td className='px-3 py-3 text-right'>
                                    <button
                                        type='button'
                                        onClick={() => handleRemove(item.id)}
                                        className='text-[#FF5722] text-sm cursor-pointer'
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ActivityFeesTab
