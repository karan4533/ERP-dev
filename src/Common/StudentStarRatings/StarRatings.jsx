import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { EllipsisIcon, ChevronLeft, ChevronRight, Plus, Download, Trophy, Star, Upload } from 'lucide-react'
import Dropdown from '../CommonComponents/Dropdown'
import ExportModal from '../CommonComponents/ExportModal'
import EditRequestModal from '../CommonComponents/EditRequestModal'
import DeleteRequestModal from '../CommonComponents/DeleteRequestModal'
import { canShowDeleteOption } from '../CommonComponents/approvalGates'
import { useAuth } from '../../context/AuthContext'
import { hydrateEnrolledStudentsFromApi } from '../StudentDatabase/enrolledStudentsData'
import { getStudentsList } from '../StudentDatabase/studentDatabaseData'
import { useTeacherAssignments } from '../Teacher/useTeacherAssignments'
import { isApiStudentsEnabled } from '../../services/apiClient'
import { fileDownloadUrl } from '../../services/filesApi'
import StarRatingDisplay from './Components/StarRatingDisplay'
import { useStarRatingsRouteBase } from './useStarRatingsRouteBase'
import { canUseClassDetailsApi, listAcademicYears } from '../../services/classDetailsApi'
import {
    ACADEMIC_YEARS,
    RATING_CATEGORY,
    SOM_RATINGS_UPDATED_EVENT,
    SOY_MONTH_COUNT,
    getClassSectionOptions,
    getConsolidatedSoyRatings,
    getDefaultAcademicYear,
    getDefaultSomMonth,
    getSomMonthOptions,
    getSomRatings,
    getStudents,
    hydrateSomRatingsFromApi,
    importIndividualSomRows,
} from './studentStarRatingsData'
import {
    downloadIndividualSomTemplateCsv,
    downloadIndividualSomTemplateExcel,
    previewIndividualSomImportFile,
} from './individualSomImportFile'

const StarRatings = ({ view = 'som' }) => {
    const { role } = useAuth() || {}
    const showDelete = canShowDeleteOption(role)
    const location = useLocation()
    const routeBase = useStarRatingsRouteBase()
    const assignments = useTeacherAssignments()
    const isSom = view === 'som'
    const months = useMemo(() => getSomMonthOptions(), [])
    const [scopedRows, setScopedRows] = useState([])
    const classSectionOptions = useMemo(() => {
        if (assignments.classSections?.length) return assignments.classSections
        return getClassSectionOptions(scopedRows)
    }, [assignments.classSections, scopedRows])
    const [search, setSearch] = useState('')
    const [classSection, setClassSection] = useState('')
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const fromNav = location.state?.month
        if (fromNav && getSomMonthOptions().includes(fromNav)) return fromNav
        return getDefaultSomMonth()
    })
    const [academicYear, setAcademicYear] = useState(() => getDefaultAcademicYear())
    const [academicYearOptions, setAcademicYearOptions] = useState(() => [...ACADEMIC_YEARS])
    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)
    const [bulkOpen, setBulkOpen] = useState(false)
    const [bulkPreview, setBulkPreview] = useState(null)
    const [bulkReading, setBulkReading] = useState(false)
    const [bulkSaving, setBulkSaving] = useState(false)
    const [revision, setRevision] = useState(0)
    const ratedByRole = /\/coordinator\b/.test(routeBase || '') ? 'Coordinator' : 'Teacher'

    useEffect(() => {
        let cancelled = false
        const apply = () => {
            const all = getStudentsList()
            if (!assignments.ready) return
            // Teachers: allocated classes only. Principal/Coordinator/Admin: campus roster.
            const campusWide = /\/(principal|coordinator|director|admin|super-admin)\b/.test(routeBase || '')
            const scoped = assignments.assignments.length
                ? all.filter((student) => assignments.studentInScope(student))
                : (campusWide ? all : [])
            if (!cancelled) setScopedRows(scoped)
        }
        if (!isApiStudentsEnabled()) {
            queueMicrotask(() => {
                if (!cancelled) apply()
            })
            return () => {
                cancelled = true
            }
        }
        hydrateEnrolledStudentsFromApi().finally(() => {
            if (!cancelled) apply()
        })
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when assignment hydrate settles
    }, [assignments.ready, assignments.assignments.length, assignments.classSections?.join('|'), routeBase])

    useEffect(() => {
        let cancelled = false
        hydrateSomRatingsFromApi({ force: true }).finally(() => {
            if (!cancelled) setRevision((value) => value + 1)
        })
        const onUpdated = () => setRevision((value) => value + 1)
        window.addEventListener(SOM_RATINGS_UPDATED_EVENT, onUpdated)
        return () => {
            cancelled = true
            window.removeEventListener(SOM_RATINGS_UPDATED_EVENT, onUpdated)
        }
    }, [location.key])

    useEffect(() => {
        const fromNav = location.state?.month
        if (fromNav && months.includes(fromNav)) {
            setSelectedMonth(fromNav)
        }
    }, [location.state, months])

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
                if (current?.name) setAcademicYear(String(current.name))
            })
            .catch(() => {
                /* keep computed academic-year fallback */
            })
        return () => {
            cancelled = true
        }
    }, [])

    const scopedStudentIds = useMemo(() => new Set(scopedRows.map((row) => String(row.id))), [scopedRows])

    const isInTeacherScope = (item) => {
        if (!assignments.assignments.length) return true
        if (scopedStudentIds.has(String(item.studentId))) return true
        if (!assignments.classSections?.length) return true
        return assignments.classSections.some((option) => assignments.matchesClassSection(item, option))
    }

    const somRatings = useMemo(() => {
        return getSomRatings().filter((item) => {
            if (!isInTeacherScope(item)) return false
            const matchesMonth = !selectedMonth || item.month === selectedMonth
            const matchesClass = !classSection || assignments.matchesClassSection(item, classSection)
            const query = search.trim().toLowerCase()
            const matchesSearch = !query
                || String(item.studentName || '').toLowerCase().includes(query)
                || String(item.studentId || '').toLowerCase().includes(query)
                || String(item.rollNumber || '').toLowerCase().includes(query)
                || String(item.ratingId || '').toLowerCase().includes(query)
            return matchesMonth && matchesClass && matchesSearch
        })
        // revision forces re-read after add/save navigation
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMonth, classSection, search, scopedStudentIds, assignments, revision])

    const soyRatings = useMemo(
        () => getConsolidatedSoyRatings(academicYear)
            .filter((item) => isInTeacherScope(item))
            .filter((item) => !classSection || assignments.matchesClassSection(item, classSection)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [academicYear, scopedStudentIds, assignments, classSection, revision],
    )

    const filteredSoyRatings = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return soyRatings
        return soyRatings.filter((item) =>
            item.studentName.toLowerCase().includes(query)
            || item.studentId.toLowerCase().includes(query)
            || item.rollNumber.toLowerCase().includes(query),
        )
    }, [soyRatings, search])

    const starOfMonth = useMemo(() => {
        if (!selectedMonth) return null
        if (!somRatings.length) return null
        return somRatings.reduce((best, current) => (current.rating > best.rating ? current : best))
    }, [selectedMonth, somRatings])

    const starOfYear = useMemo(
        () => soyRatings[0] ?? null,
        [soyRatings],
    )
    const soyRows = useMemo(
        () => soyRatings.map((entry, index) => ({ ...entry, rank: index + 1 })),
        [soyRatings],
    )

    const clearFilters = () => {
        setSearch('')
        setClassSection('')
        if (isSom) {
            setSelectedMonth('')
        } else {
            setAcademicYear(academicYearOptions[0] || getDefaultAcademicYear())
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    {!isSom && (
                        <p className='text-sm text-[#667085]'>
                            Annual rating consolidated from {SOY_MONTH_COUNT} months of SOM data.
                        </p>
                    )}
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:mt-6 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Name, roll no., student ID...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-section' className='text-base font-medium text-[#808080]'>Class & Section</label>
                        <select
                            id='class-section'
                            value={classSection}
                            onChange={(e) => setClassSection(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'
                        >
                            <option value=''>All assigned classes</option>
                            {classSectionOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        {assignments.emptyReason ? (
                            <p className='text-xs text-[#E65100]'>{assignments.emptyReason}</p>
                        ) : null}
                    </div>
                    {isSom ? (
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='month' className='text-base font-medium text-[#808080]'>Month</label>
                            <select
                                id='month'
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'
                            >
                                <option value=''>All months</option>
                                {months.map((month) => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='academic-year' className='text-base font-medium text-[#808080]'>Academic Year</label>
                            <select
                                id='academic-year'
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                                className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'
                            >
                                {academicYearOptions.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                                {!academicYearOptions.includes(academicYear) && academicYear ? (
                                    <option value={academicYear}>{academicYear}</option>
                                ) : null}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {isSom && starOfMonth && (
                <div
                    className='mt-6 rounded-2xl shadow-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
                    style={{ background: 'linear-gradient(135deg, #515DEF14 0%, #FFC10714 100%)' }}
                >
                    <div className='flex items-center gap-4'>
                        <div className='size-12 rounded-full bg-[#FFC10733] flex items-center justify-center'>
                            <Trophy className='text-[#B8860B]' size={24} />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-[#B8860B]'>Star of the Month — {starOfMonth.month}</p>
                            <h3 className='text-xl font-bold text-[#0C1E5B]'>{starOfMonth.studentName}</h3>
                            <p className='text-sm text-[#667085]'>
                                Class {starOfMonth.classSection} · Roll No. {starOfMonth.rollNumber} · {starOfMonth.studentId}
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#FFC10766]'>
                        <Star size={18} className='fill-[#FFC107] text-[#FFC107]' />
                        <StarRatingDisplay rating={starOfMonth.rating} />
                    </div>
                </div>
            )}

            {!isSom && starOfYear && (
                <div
                    className='mt-6 rounded-2xl shadow-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
                    style={{ background: 'linear-gradient(135deg, #515DEF14 0%, #FFC10714 100%)' }}
                >
                    <div className='flex items-center gap-4'>
                        <div className='size-12 rounded-full bg-[#FFC10733] flex items-center justify-center'>
                            <Trophy className='text-[#B8860B]' size={24} />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-[#B8860B]'>Star of the Year — {academicYear}</p>
                            <h3 className='text-xl font-bold text-[#0C1E5B]'>{starOfYear.studentName}</h3>
                            <p className='text-sm text-[#667085]'>
                                Class {starOfYear.classSection} · Roll No. {starOfYear.rollNumber} · {starOfYear.studentId}
                            </p>
                        </div>
                    </div>
                    <div className='text-right'>
                        <p className='text-xs text-[#808080] mb-1'>
                            Avg across {starOfYear.monthsRated}/{SOY_MONTH_COUNT} months
                        </p>
                        <div className='flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#FFC10766]'>
                            <Star size={18} className='fill-[#FFC107] text-[#FFC107]' />
                            <span className='text-lg font-bold text-[#0C1E5B]'>{starOfYear.averageRating}</span>
                            <StarRatingDisplay rating={starOfYear.annualRating} />
                        </div>
                    </div>
                </div>
            )}

            {!isSom && (
                <div className='bg-white rounded-2xl shadow-md p-4 mt-6 overflow-x-auto'>
                    <h2 className='text-lg font-semibold'>SOY consolidation</h2>
                    <p className='text-sm text-[#667085] mt-1 mb-3'>Derived from monthly SOM ratings for {academicYear}. Consolidated score is the average of months that have a rating. Official QMIS SOY format is still pending.</p>
                    {soyRows.length === 0 && <p className='text-sm text-[#667085]'>No monthly ratings yet. Add Star of the Month ratings to produce a consolidation.</p>}
                    {soyRows.length > 0 && (
                        <table className='w-full text-sm'>
                            <thead className='text-xs bg-[#EDEEF5]'>
                                <tr>{['Rank', 'Name', 'Class', 'Month-wise scores', 'Months', 'Consolidated', 'Result'].map((label) => <th key={label} className='px-2 py-3 text-left'>{label}</th>)}</tr>
                            </thead>
                            <tbody>
                                {soyRows.map((row) => (
                                    <tr key={row.studentId} className='border-b border-[#f2f4f7]'>
                                        <td className='px-2 py-3'>{row.rank}</td>
                                        <td className='px-2 py-3'>{row.studentName}</td>
                                        <td className='px-2 py-3'>{row.classSection}</td>
                                        <td className='px-2 py-3'>{row.monthlyRatings.map((item) => `${item.month}: ${item.rating}`).join(', ')}</td>
                                        <td className='px-2 py-3'>{row.monthsRated}</td>
                                        <td className='px-2 py-3'>{row.averageRating}</td>
                                        <td className='px-2 py-3'>{row.rank === 1 ? 'Star of the Year' : 'Considered'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>
                        {isSom ? 'Star of the Month' : 'Star of the Year'}
                    </h2>
                    <div className='flex flex-wrap gap-2'>
                        {isSom && (
                            <>
                                <NavLink
                                    to={`${routeBase}/add-ratings`}
                                    className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                                >
                                    <Plus size={16} />
                                    Add Ratings
                                </NavLink>
                                <button
                                    type='button'
                                    onClick={() => setBulkOpen((value) => !value)}
                                    className='bg-white text-[#515DEF] border border-[#515DEF] text-sm px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                                >
                                    <Upload size={16} />
                                    Bulk upload
                                </button>
                            </>
                        )}
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                {isSom && bulkOpen && (
                    <div className='mb-4 border border-[#E4E7EC] rounded-xl p-4 space-y-3 text-sm'>
                        <p className='text-[#667085]'>
                            Download a CSV/Excel template for your assigned students, fill ratings (exactly 1, 2 or 3), then preview before saving. Duplicate student+month rows are blocked.
                        </p>
                        <div className='flex flex-wrap gap-2'>
                            <button
                                type='button'
                                className='border px-3 py-2 rounded-md cursor-pointer'
                                onClick={() => downloadIndividualSomTemplateCsv('som-individual-template', getStudents(scopedRows), selectedMonth)}
                            >
                                Download CSV template
                            </button>
                            <button
                                type='button'
                                className='border px-3 py-2 rounded-md cursor-pointer'
                                onClick={() => downloadIndividualSomTemplateExcel('som-individual-template', getStudents(scopedRows), selectedMonth)}
                            >
                                Download Excel template
                            </button>
                            <input
                                type='file'
                                accept='.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                disabled={bulkReading}
                                onChange={async (event) => {
                                    const file = event.target.files?.[0]
                                    event.target.value = ''
                                    if (!file) return
                                    setBulkReading(true)
                                    try {
                                        setBulkPreview(await previewIndividualSomImportFile(file, getStudents(scopedRows), getSomRatings()))
                                    } catch (error) {
                                        setBulkPreview({ rows: [], duplicates: [], errors: [error?.message || 'Could not read the file.'] })
                                    } finally {
                                        setBulkReading(false)
                                    }
                                }}
                            />
                        </div>
                        {bulkReading ? <p className='text-[#667085]'>Reading file…</p> : null}
                        {bulkPreview && (
                            <div className='space-y-2'>
                                <p>
                                    {bulkPreview.rows.length} new row(s). {(bulkPreview.duplicates || []).length} duplicate(s) blocked.
                                    {' '}{bulkPreview.errors.length} error(s).
                                </p>
                                {bulkPreview.errors.map((error) => <p key={error} className='text-[#B42318]'>{error}</p>)}
                                <button
                                    type='button'
                                    disabled={bulkSaving || bulkPreview.errors.length > 0 || bulkPreview.rows.length === 0}
                                    className='bg-[#515DEF] text-white px-3 py-2 rounded-md disabled:opacity-40 cursor-pointer'
                                    onClick={async () => {
                                        setBulkSaving(true)
                                        try {
                                            const saved = await importIndividualSomRows(bulkPreview.rows, { ratedByRole })
                                            toast.success(`Imported ${saved.length} Star of the Month rating(s).`)
                                            setBulkPreview(null)
                                            setBulkOpen(false)
                                            setRevision((value) => value + 1)
                                        } catch (error) {
                                            toast.error(error?.message || 'Bulk import failed.')
                                        } finally {
                                            setBulkSaving(false)
                                        }
                                    }}
                                >
                                    {bulkSaving ? 'Saving…' : `Confirm import (${bulkPreview.rows.length})`}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {isSom ? (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left rtl:text-right'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr className='rounded-lg'>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Rating ID</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Month</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Roll No.</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>{RATING_CATEGORY}</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Description</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Document</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Rated By</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {somRatings.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className='px-2 py-8 text-center text-[#667085]'>
                                            No star ratings found for the selected filters.
                                        </td>
                                    </tr>
                                ) : (
                                    somRatings.map((entry) => (
                                        <tr
                                            key={entry.ratingId}
                                            className={`border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg ${
                                                starOfMonth?.ratingId === entry.ratingId ? 'bg-[#FFC10708]' : ''
                                            }`}
                                        >
                                            <td className='px-2 py-4 rounded-s-lg'>{entry.ratingId}</td>
                                            <td className='px-2 py-4'>{entry.month}</td>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{entry.studentName}</td>
                                            <td className='px-2 py-4'>{entry.rollNumber}</td>
                                            <td className='px-2 py-4'>{entry.classSection}</td>
                                            <td className='px-2 py-4'>
                                                <StarRatingDisplay rating={entry.rating} />
                                            </td>
                                            <td className='px-2 py-4 max-w-xs truncate' title={entry.description}>
                                                {entry.description}
                                            </td>
                                            <td className='px-2 py-4'>
                                                {entry.attachmentFileId ? (
                                                    <a
                                                        className='text-[#515DEF] underline'
                                                        href={fileDownloadUrl(`/api/v1/files/${entry.attachmentFileId}/download`)}
                                                        target='_blank'
                                                        rel='noreferrer'
                                                    >
                                                        {entry.attachmentName || 'Download'}
                                                    </a>
                                                ) : '—'}
                                            </td>
                                            <td className='px-2 py-4'>{entry.ratedByRole}</td>
                                            <td className='px-2 py-4 text-center rounded-e-lg'>
                                                <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                    <button type='button' className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>
                                                        View
                                                    </button>
                                                    <button
                                                        type='button'
                                                        onClick={() => setEditRequestModal(true)}
                                                        className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        Edit
                                                    </button>
                                                    {showDelete ? (
                                                        <button
                                                            type='button'
                                                            onClick={() => setDeleteRequestModal(true)}
                                                            className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                        >
                                                            Delete
                                                        </button>
                                                    ) : null}
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left rtl:text-right'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr className='rounded-lg'>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Student Name</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Roll No.</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Months Rated</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Average Rating</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Annual Rating</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Academic Year</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSoyRatings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className='px-2 py-8 text-center text-[#667085]'>
                                            No consolidated ratings found for the selected academic year.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSoyRatings.map((entry) => (
                                        <tr
                                            key={entry.studentId}
                                            className={`border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg ${
                                                starOfYear?.studentId === entry.studentId ? 'bg-[#FFC10708]' : ''
                                            }`}
                                        >
                                            <td className='px-2 py-4 rounded-s-lg font-medium text-[#1E1E1E]'>{entry.studentName}</td>
                                            <td className='px-2 py-4'>{entry.rollNumber}</td>
                                            <td className='px-2 py-4'>{entry.classSection}</td>
                                            <td className='px-2 py-4'>{entry.monthsRated} / {SOY_MONTH_COUNT}</td>
                                            <td className='px-2 py-4 font-semibold text-[#0C1E5B]'>{entry.averageRating}</td>
                                            <td className='px-2 py-4'>
                                                <StarRatingDisplay rating={entry.annualRating} />
                                            </td>
                                            <td className='px-2 py-4 rounded-e-lg'>{entry.academicYear}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing {isSom ? somRatings.length : filteredSoyRatings.length} entries
                </p>
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

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='star-ratings'
                rows={Array.isArray(isSom ? somRatings : filteredSoyRatings) ? (isSom ? somRatings : filteredSoyRatings) : []}
                exportDescription={<>You are exporting {Array.isArray(isSom ? somRatings : filteredSoyRatings) ? (isSom ? somRatings : filteredSoyRatings).length : 0} record(s).</>}
            />
            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />
        </section>
    )
}

export default StarRatings
