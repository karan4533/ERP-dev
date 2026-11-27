import React, { useEffect, useMemo, useState } from 'react'
import { Star, Trophy } from 'lucide-react'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import StarRatingDisplay from '../../../Common/StudentStarRatings/Components/StarRatingDisplay'
import {
    getDefaultAcademicYear,
    getDefaultSomMonth,
    getSomMonthOptions,
    getSomRatingsForStudent,
    getSoyRatingForStudent,
    hydrateSomRatingsFromApi,
    normalizeAcademicYearLabel,
    SOM_RATINGS_UPDATED_EVENT,
    SOY_MONTH_COUNT,
} from '../../../Common/StudentStarRatings/studentStarRatingsData'
import { canUseClassDetailsApi, listAcademicYears } from '../../../services/classDetailsApi'
import PlacementAwaitingNotice, { isStudentPlaced } from '../Class/Components/PlacementAwaitingNotice'

const selectClass =
    'text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white max-w-xs'

const ViewRatings = () => {
    const { activeStudent } = useActiveStudent()
    const placed = isStudentPlaced(activeStudent)
    const monthOptions = useMemo(() => getSomMonthOptions(), [])
    const [selectedMonth, setSelectedMonth] = useState(() => getDefaultSomMonth())
    const [academicYear, setAcademicYear] = useState(() => getDefaultAcademicYear())
    const [academicYearOptions, setAcademicYearOptions] = useState(() => [getDefaultAcademicYear()])
    const [revision, setRevision] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [view, setView] = useState('som')

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError('')
        hydrateSomRatingsFromApi({ force: true })
            .then(() => {
                if (!cancelled) setRevision((value) => value + 1)
            })
            .catch((err) => {
                if (!cancelled) setError(err?.message || 'Could not load star ratings.')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        const onUpdated = () => setRevision((value) => value + 1)
        window.addEventListener(SOM_RATINGS_UPDATED_EVENT, onUpdated)
        return () => {
            cancelled = true
            window.removeEventListener(SOM_RATINGS_UPDATED_EVENT, onUpdated)
        }
    }, [activeStudent?.id])

    useEffect(() => {
        let cancelled = false
        if (!canUseClassDetailsApi()) return undefined
        listAcademicYears()
            .then((years) => {
                if (cancelled || !Array.isArray(years) || !years.length) return
                const names = years.map((row) => String(row.name || '').trim()).filter(Boolean)
                if (!names.length) return
                setAcademicYearOptions(names)
                const current = years.find((row) => row.isCurrent)
                if (current?.name) setAcademicYear(normalizeAcademicYearLabel(current.name) || String(current.name))
            })
            .catch(() => {
                /* keep computed fallback */
            })
        return () => {
            cancelled = true
        }
    }, [])

    const studentRatings = useMemo(() => {
        void revision
        if (!activeStudent?.id) return []
        return getSomRatingsForStudent(activeStudent)
            .slice()
            .sort((a, b) => {
                const months = getSomMonthOptions()
                return months.indexOf(b.month) - months.indexOf(a.month)
            })
    }, [activeStudent, revision])

    const monthRating = useMemo(
        () => studentRatings.find((item) => item.month === selectedMonth) || null,
        [studentRatings, selectedMonth],
    )

    const soyRating = useMemo(() => {
        void revision
        if (!activeStudent?.id) return null
        return getSoyRatingForStudent(activeStudent, academicYear)
    }, [activeStudent, academicYear, revision])

    const classLabel = activeStudent?.className
        ? `${activeStudent.className}${activeStudent.section ? `-${activeStudent.section}` : ''}`
        : ''

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-6'>
                <div className='flex flex-wrap items-start justify-between gap-3 mb-4'>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Star Ratings</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            {activeStudent?.name || 'Student'}
                            {classLabel ? ` · ${classLabel}` : ''}
                            {activeStudent?.rollNumber ? ` · Roll ${activeStudent.rollNumber}` : ''}
                        </p>
                    </div>
                    {placed ? (
                        <div className='flex gap-2'>
                            <button
                                type='button'
                                onClick={() => setView('som')}
                                className={`text-sm px-4 py-2 rounded-md border cursor-pointer ${
                                    view === 'som'
                                        ? 'bg-[#515DEF] text-white border-[#515DEF]'
                                        : 'bg-white text-[#515DEF] border-[#515DEF]'
                                }`}
                            >
                                Star of the Month
                            </button>
                            <button
                                type='button'
                                onClick={() => setView('soy')}
                                className={`text-sm px-4 py-2 rounded-md border cursor-pointer ${
                                    view === 'soy'
                                        ? 'bg-[#515DEF] text-white border-[#515DEF]'
                                        : 'bg-white text-[#515DEF] border-[#515DEF]'
                                }`}
                            >
                                Star of the Year
                            </button>
                        </div>
                    ) : null}
                </div>

                {!placed ? (
                    <PlacementAwaitingNotice
                        studentName={activeStudent?.name}
                        featureLabel='star ratings'
                    />
                ) : loading ? (
                    <p className='text-sm text-[#667085] py-8 text-center'>Loading your star ratings…</p>
                ) : error ? (
                    <p className='text-sm text-[#B42318] py-8 text-center'>{error}</p>
                ) : view === 'som' ? (
                    <div className='space-y-4'>
                        <div className='flex flex-col gap-y-2 max-w-xs'>
                            <label htmlFor='som-month' className='text-sm font-medium text-[#808080]'>Month</label>
                            <select
                                id='som-month'
                                value={selectedMonth}
                                onChange={(event) => setSelectedMonth(event.target.value)}
                                className={selectClass}
                            >
                                {monthOptions.map((month) => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
                        </div>

                        {monthRating ? (
                            <div
                                className='rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
                                style={{ background: 'linear-gradient(135deg, #515DEF14 0%, #FFC10714 100%)' }}
                            >
                                <div className='flex items-center gap-4'>
                                    <div className='size-12 rounded-full bg-[#FFC10733] flex items-center justify-center'>
                                        <Trophy className='text-[#B8860B]' size={24} />
                                    </div>
                                    <div>
                                        <p className='text-sm font-medium text-[#B8860B]'>
                                            Star of the Month — {monthRating.month}
                                        </p>
                                        <h3 className='text-xl font-bold text-[#0C1E5B]'>{monthRating.studentName}</h3>
                                        <p className='text-sm text-[#667085]'>
                                            {monthRating.classSection}
                                            {monthRating.ratedByRole ? ` · Rated by ${monthRating.ratedByRole}` : ''}
                                        </p>
                                        {monthRating.description ? (
                                            <p className='text-sm text-[#0C1E5B] mt-2'>{monthRating.description}</p>
                                        ) : null}
                                    </div>
                                </div>
                                <div className='flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#FFC10766]'>
                                    <Star size={18} className='fill-[#FFC107] text-[#FFC107]' />
                                    <StarRatingDisplay rating={monthRating.rating} />
                                </div>
                            </div>
                        ) : (
                            <div className='py-8 text-center text-sm text-[#667085] space-y-1'>
                                <p>No Star of the Month rating for {selectedMonth} yet.</p>
                                <p className='text-xs'>Ask your teacher if a rating should appear for this month.</p>
                            </div>
                        )}

                        {studentRatings.length > 0 ? (
                            <div className='overflow-x-auto pt-2'>
                                <h3 className='text-base font-semibold text-[#0C1E5B] mb-3'>Your monthly ratings</h3>
                                <table className='w-full text-sm text-left'>
                                    <thead className='text-xs bg-[#EDEEF5]'>
                                        <tr>
                                            <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Month</th>
                                            <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Rating</th>
                                            <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Description</th>
                                            <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Rated by</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentRatings.map((row) => (
                                            <tr key={row.ratingId} className='border-b border-[#F0F0F0]'>
                                                <td className='px-3 py-3'>{row.month}</td>
                                                <td className='px-3 py-3'>
                                                    <StarRatingDisplay rating={row.rating} />
                                                </td>
                                                <td className='px-3 py-3'>{row.description || '—'}</td>
                                                <td className='px-3 py-3'>{row.ratedByRole || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div className='space-y-4'>
                        <div className='flex flex-col gap-y-2 max-w-xs'>
                            <label htmlFor='soy-year' className='text-sm font-medium text-[#808080]'>Academic Year</label>
                            <select
                                id='soy-year'
                                value={academicYear}
                                onChange={(event) => setAcademicYear(event.target.value)}
                                className={selectClass}
                            >
                                {academicYearOptions.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                                {!academicYearOptions.includes(academicYear) && academicYear ? (
                                    <option value={academicYear}>{academicYear}</option>
                                ) : null}
                            </select>
                            <p className='text-xs text-[#667085]'>
                                Annual rating consolidated from up to {SOY_MONTH_COUNT} months of Star of the Month data.
                            </p>
                        </div>

                        {soyRating ? (
                            <div
                                className='rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
                                style={{ background: 'linear-gradient(135deg, #515DEF14 0%, #4CAF5014 100%)' }}
                            >
                                <div className='flex items-center gap-4'>
                                    <div className='size-12 rounded-full bg-[#4CAF5033] flex items-center justify-center'>
                                        <Trophy className='text-[#2E7D32]' size={24} />
                                    </div>
                                    <div>
                                        <p className='text-sm font-medium text-[#2E7D32]'>
                                            Star of the Year — {academicYear}
                                        </p>
                                        <h3 className='text-xl font-bold text-[#0C1E5B]'>{soyRating.studentName}</h3>
                                        <p className='text-sm text-[#667085]'>
                                            {soyRating.monthsRated} month(s) rated · Average {soyRating.averageRating}
                                        </p>
                                    </div>
                                </div>
                                <div className='flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#4CAF5066]'>
                                    <Star size={18} className='fill-[#FFC107] text-[#FFC107]' />
                                    <StarRatingDisplay rating={soyRating.annualRating} />
                                </div>
                            </div>
                        ) : (
                            <div className='py-8 text-center text-sm text-[#667085] space-y-1'>
                                <p>No Star of the Year summary for {academicYear} yet.</p>
                                <p className='text-xs'>It appears after teachers add monthly ratings for this academic year.</p>
                            </div>
                        )}

                        {soyRating?.monthlyRatings?.length ? (
                            <div className='overflow-x-auto'>
                                <table className='w-full text-sm text-left'>
                                    <thead className='text-xs bg-[#EDEEF5]'>
                                        <tr>
                                            <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Month</th>
                                            <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {soyRating.monthlyRatings.map((row) => (
                                            <tr key={row.month} className='border-b border-[#F0F0F0]'>
                                                <td className='px-3 py-3'>{row.month}</td>
                                                <td className='px-3 py-3'>
                                                    <StarRatingDisplay rating={row.rating} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </section>
    )
}

export default ViewRatings
