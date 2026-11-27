import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { listFeePendingAdmissionsApi, waiveRegistrationFeeApi } from '../../../services/admissionsApi'

/**
 * Finance waiver queue. Admissions cannot enrol until the registration fee is zero, receipted by Finance,
 * or waived here — a Paid / Waived choice on the admission form does not count.
 */
const AdmissionFeeWaivers = () => {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [reasons, setReasons] = useState({})
    const [savingId, setSavingId] = useState('')

    const load = useCallback(() => {
        setLoading(true)
        setError('')
        return listFeePendingAdmissionsApi()
            .then((data) => setRows(Array.isArray(data) ? data : []))
            .catch((err) => setError(err?.message || 'Could not load admissions awaiting fee clearance.'))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { load() }, [load])

    const waive = async (row) => {
        const reason = String(reasons[row.id] || '').trim()
        if (reason.length < 3) {
            toast.error('Enter a reason for the waiver.')
            return
        }
        setSavingId(row.id)
        try {
            await waiveRegistrationFeeApi(row.id, reason)
            toast.success(`Registration fee waived for ${row.studentName} (${row.admissionCode}).`)
            setReasons((prev) => ({ ...prev, [row.id]: '' }))
            await load()
        } catch (err) {
            toast.error(err?.message || 'Could not record the waiver.')
        } finally {
            setSavingId('')
        }
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-[#0C1E5B]'>Registration Fee Waivers</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Admissions that cannot be enrolled yet because no settled Admission / Registration receipt matches them.
                    Record a waiver only when the school has approved one; the reason is kept in the audit log.
                </p>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                        <tr>
                            {['Admission No', 'Student', 'Class', 'Registration Fee', 'Waiver Reason', 'Action'].map((label) => (
                                <th key={label} className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={6} className='px-2 py-6 text-center text-[#667085]'>Loading…</td></tr>
                        )}
                        {!loading && error && (
                            <tr><td colSpan={6} className='px-2 py-6 text-center text-[#B42318]'>{error}</td></tr>
                        )}
                        {!loading && !error && rows.length === 0 && (
                            <tr><td colSpan={6} className='px-2 py-6 text-center text-[#667085]'>No admissions are waiting on a registration fee.</td></tr>
                        )}
                        {!loading && !error && rows.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3 font-medium text-[#1E1E1E]'>{row.admissionCode}</td>
                                <td className='px-2 py-3'>{row.studentName}</td>
                                <td className='px-2 py-3'>{row.className}</td>
                                <td className='px-2 py-3'>{row.registrationFees || '—'}</td>
                                <td className='px-2 py-3'>
                                    <input
                                        value={reasons[row.id] || ''}
                                        onChange={(event) => setReasons((prev) => ({ ...prev, [row.id]: event.target.value }))}
                                        placeholder='Reason (required)'
                                        maxLength={500}
                                        className='text-sm border border-[#D9D9D9] rounded-md px-2 py-1.5 w-full min-w-[200px]'
                                    />
                                </td>
                                <td className='px-2 py-3'>
                                    <button
                                        type='button'
                                        disabled={savingId === row.id}
                                        onClick={() => waive(row)}
                                        className='bg-[#515DEF] text-white text-sm px-3 py-1.5 rounded-md cursor-pointer disabled:opacity-50'
                                    >
                                        {savingId === row.id ? 'Saving…' : 'Waive fee'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export default AdmissionFeeWaivers
