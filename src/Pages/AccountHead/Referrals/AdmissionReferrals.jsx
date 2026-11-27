import React, { useEffect, useMemo, useState } from 'react'
import { listAdmissionReferralsApi } from '../../../services/admissionsApi'

const formatDate = (iso) => {
    const date = new Date(iso)
    return Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Referred admissions, recorded on the admission form. Record only: the school decided any referral
 * bonus (for example a fee concession for the referring parent) is applied manually.
 */
const AdmissionReferrals = () => {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')

    useEffect(() => {
        let cancelled = false
        listAdmissionReferralsApi()
            .then((data) => { if (!cancelled) setRows(data) })
            .catch((err) => { if (!cancelled) setError(err?.message || 'Could not load referrals.') })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase()
        return rows.filter((row) => {
            if (typeFilter && row.referrerType !== typeFilter) return false
            if (!query) return true
            return `${row.referrerName} ${row.studentName} ${row.admissionCode} ${row.referrerStudentAdmissionNo || ''}`
                .toLowerCase()
                .includes(query)
        })
    }, [rows, search, typeFilter])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-[#0C1E5B]'>Admission Referrals</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Admissions where someone was recorded as the referrer. Apply any referral bonus manually
                    (for example as a concession on the referring parent&apos;s child).
                </p>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='referral-search' className='text-sm font-medium text-[#808080]'>Search</label>
                        <input
                            id='referral-search'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Referrer, student, admission no.'
                            className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='referral-type' className='text-sm font-medium text-[#808080]'>Referred by</label>
                        <select
                            id='referral-type'
                            value={typeFilter}
                            onChange={(event) => setTypeFilter(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2'
                        >
                            <option value=''>All</option>
                            <option value='Parent'>Parent</option>
                            <option value='Staff'>Staff</option>
                            <option value='Other'>Other</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                {error && <p className='text-sm text-[#B42318] mb-3'>{error}</p>}
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5] uppercase text-[#0C1E5B]'>
                        <tr>
                            <th className='px-2 py-3'>Date</th>
                            <th className='px-2 py-3'>New admission</th>
                            <th className='px-2 py-3'>Class</th>
                            <th className='px-2 py-3'>Admission status</th>
                            <th className='px-2 py-3'>Referred by</th>
                            <th className='px-2 py-3'>Contact</th>
                            <th className='px-2 py-3'>Referrer&apos;s child</th>
                            <th className='px-2 py-3'>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(loading || filtered.length === 0) && (
                            <tr>
                                <td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>
                                    {loading ? 'Loading referrals…' : rows.length ? 'No referrals match these filters.' : 'No referrals recorded yet.'}
                                </td>
                            </tr>
                        )}
                        {!loading && filtered.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7] text-[#667085]'>
                                <td className='px-2 py-3 whitespace-nowrap'>{formatDate(row.createdAt)}</td>
                                <td className='px-2 py-3 text-[#1E1E1E] font-medium'>{row.studentName} ({row.admissionCode})</td>
                                <td className='px-2 py-3'>{row.className}</td>
                                <td className='px-2 py-3'>{row.admissionStatus}</td>
                                <td className='px-2 py-3'>{row.referrerName} · {row.referrerType}</td>
                                <td className='px-2 py-3'>{row.referrerContact || '—'}</td>
                                <td className='px-2 py-3'>{row.referrerStudentAdmissionNo || '—'}</td>
                                <td className='px-2 py-3'>{row.notes || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export default AdmissionReferrals
