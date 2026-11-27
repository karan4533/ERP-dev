import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ChevronLeft, ChevronRight, Download, Eye, Plus, EllipsisIcon } from 'lucide-react'
import { classKeysMatch, normalizeClassKey, normalizeSectionKey } from '../../../Common/Teacher/teacherAssignedClasses'
import { useTeacherAssignments } from '../../../Common/Teacher/useTeacherAssignments'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import { canShowDeleteOption } from '../../../Common/CommonComponents/approvalGates'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ClassTimeTableModal from './Components/ClassTimeTableModal'
import { useAuth } from '../../../context/AuthContext'
import { canUseAcademicsApi } from '../../../services/academicsApi'
import {
    CLASS_TIMETABLES_UPDATED_EVENT,
    approvalStatusColor,
    getClassSectionLabel,
    decideClassTimetableApproval,
    decideTimetableChangeRequest,
    deleteClassTimetable,
    getClassTimetables,
    getGradeOptions,
    getSectionOptions,
    getTimetableChangeRequests,
    getTimetableHydrateError,
    getTimetableHydrateStatus,
    getTimetableRoutes,
    hydrateClassTimetablesFromApi,
    loadAcademicYearOptions,
} from './classTimetableData'

const PAGE_SIZE = 10
const APPROVAL_STATUSES = ['Pending', 'Approved', 'Denied']

// A timetable belongs to one teacher and can cover several classes, one per period.
const periodsOf = (record) => (
    Array.isArray(record.timelines) && record.timelines.length
        ? record.timelines
        : [{ className: record.className, section: record.section }]
)

const uniqueByClassKey = (labels) => {
    const seen = new Map()
    labels.forEach((label) => {
        const key = normalizeClassKey(label)
        if (key && !seen.has(key)) seen.set(key, label)
    })
    return [...seen.values()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

const ClassTimetableList = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { role, name: sessionName } = useAuth() || {}
    const showDelete = canShowDeleteOption(role)
    const teacherScope = useTeacherAssignments()
    const { createPath, editPath, canApprove, canEdit, reviewer } = getTimetableRoutes(location.pathname)
    const isCoordinator = location.pathname.startsWith('/coordinator')
    const isTeacher = location.pathname.startsWith('/teacher')
    const [records, setRecords] = useState(() => getClassTimetables())
    const [changes, setChanges] = useState(() => getTimetableChangeRequests())
    const [rejectReason, setRejectReason] = useState('')
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)
    const [pendingDelete, setPendingDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [exportModal, setExportModal] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)
    const [search, setSearch] = useState('')
    const [classFilter, setClassFilter] = useState('')
    const [sectionFilter, setSectionFilter] = useState('')
    const [academicYearFilter, setAcademicYearFilter] = useState('')
    const [academicYearOptions, setAcademicYearOptions] = useState([])
    const [statusFilter, setStatusFilter] = useState('')
    const [teacherFilter, setTeacherFilter] = useState('')
    // Individual = one row per teacher timetable; Class-wise = one row per class/section covered.
    const [viewMode, setViewMode] = useState('class')
    const [page, setPage] = useState(1)
    const [hydrateStatus, setHydrateStatus] = useState(() => getTimetableHydrateStatus())
    const [hydrateError, setHydrateError] = useState(() => getTimetableHydrateError())

    const classOptions = useMemo(() => {
        const fromRecords = records.flatMap((item) => periodsOf(item).map((row) => row.className)).filter(Boolean)
        return uniqueByClassKey([...getGradeOptions(), ...fromRecords])
    }, [records])
    const sectionOptions = useMemo(() => {
        const fromRecords = records.flatMap((item) => periodsOf(item).map((row) => normalizeSectionKey(row.section)))
        return [...new Set([...getSectionOptions().map(normalizeSectionKey), ...fromRecords].filter(Boolean))].sort()
    }, [records])
    const teacherOptions = useMemo(() => (
        [...new Set(records.map((item) => String(item.ownerTeacherName || '').trim()).filter(Boolean))].sort()
    ), [records])
    const statusOptions = useMemo(() => (
        [...new Set([...APPROVAL_STATUSES, ...records.map((item) => item.approvalStatus).filter(Boolean)])]
    ), [records])

    const yearFilterOptions = useMemo(() => {
        const fromRecords = records.map((item) => item.academicYear).filter(Boolean)
        const fromMasters = academicYearOptions.map((item) => item.name)
        return [...new Set([...fromMasters, ...fromRecords])].sort((a, b) =>
            b.localeCompare(a, undefined, { numeric: true }),
        )
    }, [records, academicYearOptions])

    const refresh = () => {
        setRecords(getClassTimetables())
        setChanges(getTimetableChangeRequests())
        setHydrateStatus(getTimetableHydrateStatus())
        setHydrateError(getTimetableHydrateError())
    }

    const reloadTimetables = async () => {
        await hydrateClassTimetablesFromApi({ force: true })
        refresh()
    }

    useEffect(() => {
        void reloadTimetables()
        loadAcademicYearOptions()
            .then((rows) => setAcademicYearOptions(Array.isArray(rows) ? rows : []))
            .catch(() => setAcademicYearOptions([]))
        window.addEventListener(CLASS_TIMETABLES_UPDATED_EVENT, refresh)
        return () => window.removeEventListener(CLASS_TIMETABLES_UPDATED_EVENT, refresh)
    }, [location.key])

    const reviewChange = async (id, approved) => {
        if (!approved && !rejectReason.trim()) return
        const result = await decideTimetableChangeRequest(id, approved, 'Principal', rejectReason.trim())
        if (!result.success) {
            toast.error((result.errors && result.errors[0]) || 'Could not update change request.')
            refresh()
            return
        }
        refresh()
        setRejectReason('')
        toast.success(approved ? 'Change request approved.' : 'Change request rejected.')
    }

    const reviewTimetable = async (id, approved) => {
        if (!canApprove) return
        if (!approved && !rejectReason.trim()) {
            window.alert('Enter a rejection reason above before denying.')
            return
        }
        const result = await decideClassTimetableApproval(
            id,
            approved ? 'Approved' : 'Denied',
            reviewer,
            rejectReason.trim(),
        )
        if (!result.success) {
            toast.error((result.errors && result.errors[0]) || 'Could not update timetable approval.')
            refresh()
            return
        }
        refresh()
        if (!approved) setRejectReason('')
        toast.success(approved ? 'Class timetable approved.' : 'Class timetable denied.')
    }

    const canDeleteTimetables = showDelete && !isCoordinator && !isTeacher

    const requestDelete = (record) => {
        if (!canDeleteTimetables || !record) return
        setPendingDelete(record)
        setDeleteRequestModal(true)
    }

    const confirmDelete = async () => {
        const target = pendingDelete
        setDeleteRequestModal(false)
        if (!target || deleting) return
        setDeleting(true)
        try {
            const result = await deleteClassTimetable(target.id)
            if (!result.success) {
                toast.error((result.errors && result.errors[0]) || 'Could not delete the class timetable.')
                return
            }
            if (selectedRecord?.id === target.id) setSelectedRecord(null)
            toast.success(`Class timetable ${target.id} deleted.`)
        } finally {
            setPendingDelete(null)
            setDeleting(false)
            refresh()
        }
    }

    const scopedRecords = useMemo(() => {
        if (!isTeacher && !isCoordinator) return records
        // The API already limits teachers (allocation / class teacher / own) and coordinators (grade band).
        if (canUseAcademicsApi()) return records
        const myName = String(teacherScope.profile?.name || sessionName || '').trim().toLowerCase()
        const allowedClassSections = new Set(
            (teacherScope.classSections || []).map((item) =>
                `${normalizeClassKey(item.className || item.class)}::${normalizeSectionKey(item.section)}`,
            ),
        )
        const allowedClasses = new Set((teacherScope.classes || []).map((item) => normalizeClassKey(item)))
        return records.filter((record) => {
            const owner = String(record.ownerTeacherName || '').trim().toLowerCase()
            if (myName && owner && owner === myName) return true
            return periodsOf(record).some((row) => {
                const classKey = normalizeClassKey(row.className || record.className)
                const sectionKey = normalizeSectionKey(row.section || record.section)
                if (allowedClassSections.size && allowedClassSections.has(`${classKey}::${sectionKey}`)) return true
                if (!allowedClassSections.size && allowedClasses.has(classKey)) return true
                return false
            })
        })
    }, [records, isTeacher, isCoordinator, teacherScope.classSections, teacherScope.classes, teacherScope.profile?.name, sessionName])

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase()
        return scopedRecords.filter((record) => {
            if (academicYearFilter && record.academicYear !== academicYearFilter) return false
            if (statusFilter && record.approvalStatus !== statusFilter) return false
            if (teacherFilter && String(record.ownerTeacherName || '').trim() !== teacherFilter) return false
            if (classFilter || sectionFilter) {
                const hit = periodsOf(record).some((row) => (
                    (!classFilter || classKeysMatch(row.className, classFilter))
                    && (!sectionFilter || normalizeSectionKey(row.section) === sectionFilter)
                ))
                if (!hit) return false
            }
            if (!query) return true
            const haystack = `${record.id} ${getClassSectionLabel(record)} ${record.academicYear} ${record.term} ${record.ownerTeacherName || ''} ${record.createdByRole || ''}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [scopedRecords, search, academicYearFilter, statusFilter, teacherFilter, classFilter, sectionFilter])

    const classWiseRows = useMemo(() => {
        const rows = []
        filteredRecords.forEach((record) => {
            const periods = periodsOf(record)
            const keys = new Map()
            periods.forEach((period) => {
                const className = period.className || record.className || ''
                const section = normalizeSectionKey(period.section || record.section || '')
                const key = `${normalizeClassKey(className)}::${section}`
                if (!keys.has(key)) {
                    keys.set(key, {
                        key,
                        record,
                        className,
                        section,
                        periodCount: 0,
                    })
                }
                keys.get(key).periodCount += 1
            })
            keys.forEach((row) => rows.push(row))
        })
        return rows.sort((a, b) => {
            const classCmp = String(a.className).localeCompare(String(b.className), undefined, { numeric: true })
            if (classCmp !== 0) return classCmp
            return String(a.section).localeCompare(String(b.section))
        })
    }, [filteredRecords])

    const listLength = viewMode === 'class' ? classWiseRows.length : filteredRecords.length
    const pageCount = Math.max(1, Math.ceil(listLength / PAGE_SIZE))
    const currentPage = Math.min(page, pageCount)
    const pageRecords = filteredRecords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    const pageClassRows = classWiseRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    const withPageReset = (setter) => (value) => {
        setter(value)
        setPage(1)
    }
    const hasFilters = Boolean(search || academicYearFilter || statusFilter || teacherFilter || classFilter || sectionFilter)
    const clearFilters = () => {
        setSearch('')
        setAcademicYearFilter('')
        setStatusFilter('')
        setTeacherFilter('')
        setClassFilter('')
        setSectionFilter('')
        setPage(1)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-end mb-2'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        disabled={!hasFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        Clear Filters
                    </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            value={search}
                            placeholder='ID, class, teacher…'
                            onChange={(e) => withPageReset(setSearch)(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='academic-year-filter' className='text-base font-medium text-[#808080]'>Academic Year</label>
                        <select
                            id='academic-year-filter'
                            value={academicYearFilter}
                            onChange={(e) => withPageReset(setAcademicYearFilter)(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {yearFilterOptions.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='class-filter'
                            value={classFilter}
                            onChange={(e) => withPageReset(setClassFilter)(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {classOptions.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-filter' className='text-base font-medium text-[#808080]'>Section</label>
                        <select
                            id='section-filter'
                            value={sectionFilter}
                            onChange={(e) => withPageReset(setSectionFilter)(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {sectionOptions.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='teacher-filter' className='text-base font-medium text-[#808080]'>Teacher</label>
                        <select
                            id='teacher-filter'
                            value={teacherFilter}
                            onChange={(e) => withPageReset(setTeacherFilter)(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {teacherOptions.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status-filter' className='text-base font-medium text-[#808080]'>Approval Status</label>
                        <select
                            id='status-filter'
                            value={statusFilter}
                            onChange={(e) => withPageReset(setStatusFilter)(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {statusOptions.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {hydrateStatus === 'loading' ? (
                <p className='text-sm text-[#667085] mt-4'>Loading class timetables…</p>
            ) : null}
            {hydrateStatus === 'error' ? (
                <p className='text-sm text-[#B54708] bg-[#FFFAEB] border border-[#FEDF89] rounded-lg px-3 py-2 mt-4 flex flex-wrap items-center gap-3'>
                    <span>{hydrateError || 'Class timetables could not be loaded. Saving is blocked until this succeeds.'}</span>
                    <button type='button' onClick={() => void reloadTimetables()} className='text-[#515DEF] underline cursor-pointer'>
                        Retry
                    </button>
                </p>
            ) : null}

            {canApprove ? (
            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <h2 className='text-xl font-medium text-black'>Timetable approval</h2>
                <p className='text-sm text-[#667085] mt-1 mb-3'>
                    Use the rejection reason below when denying a pending timetable.
                </p>
                <input value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder='Rejection reason (required to Deny)' className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full max-w-md mb-3' />
                {/* Hidden for now — re-enable when timetable change requests are implemented.
                <h2 className='text-xl font-medium text-black'>Timetable change requests</h2>
                {changes.length === 0 && <p className='text-sm text-[#667085]'>No change requests yet.</p>}
                <ul className='space-y-2'>
                    {changes.map((item) => (
                        <li key={item.id} className='border border-[#EDEEF5] rounded-md p-3 text-sm flex flex-wrap justify-between gap-2'>
                            <span>{item.requestedByRole} · {item.className} {item.section} · {item.day} · {item.currentSubject} → {item.requestedSubject} · {item.status}</span>
                            {item.status === 'Pending' && (
                                <span className='flex gap-2'>
                                    <button type='button' onClick={() => reviewChange(item.id, true)} className='text-[#515DEF] cursor-pointer'>Approve</button>
                                    <button type='button' onClick={() => reviewChange(item.id, false)} className='text-[#FF5722] cursor-pointer'>Reject</button>
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
                */}
            </div>
            ) : null}

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div>
                        <h2 className='text-xl font-medium text-black'>
                            {viewMode === 'class' ? 'Class-Wise Timetable' : 'Individual Faculty Timetable'}
                        </h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            {isTeacher
                                ? 'View approved and pending class timetables for your campus. Use filters to open a class or a faculty schedule.'
                                : 'Create and manage class-wise and individual faculty timetables. Pending submissions are approved by Principal only.'}
                        </p>
                        <div className='flex flex-wrap gap-2 mt-3'>
                            <button
                                type='button'
                                onClick={() => { setViewMode('class'); setPage(1) }}
                                className={`text-sm px-3 py-1.5 rounded-md border cursor-pointer ${viewMode === 'class' ? 'bg-[#515DEF] text-white border-[#515DEF]' : 'border-[#D9D9D9] text-[#667085]'}`}
                            >
                                Class-wise
                            </button>
                            <button
                                type='button'
                                onClick={() => { setViewMode('teacher'); setPage(1) }}
                                className={`text-sm px-3 py-1.5 rounded-md border cursor-pointer ${viewMode === 'teacher' ? 'bg-[#515DEF] text-white border-[#515DEF]' : 'border-[#D9D9D9] text-[#667085]'}`}
                            >
                                Individual faculty
                            </button>
                        </div>
                    </div>
                    <div className='flex gap-x-2'>
                        {canEdit ? (
                            <NavLink
                                to={createPath}
                                className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                            >
                                <Plus size={16} />
                                Create Timetable
                            </NavLink>
                        ) : null}
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

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                {viewMode === 'class' ? (
                                    <>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Class</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Faculty</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Timetable ID</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Periods</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Academic Year</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Approval Status</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>View</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                                    </>
                                ) : (
                                    <>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Timetable ID</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Teacher</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class & Section</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Academic Year</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Timelines</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Submitted Date</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Approval Status</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>View Timetable</th>
                                        <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {listLength === 0 ? (
                                <tr>
                                    <td colSpan={9} className='px-2 py-8 text-center text-[#667085]'>
                                        {records.length && hasFilters
                                            ? 'No class timetables match these filters.'
                                            : 'No class timetables found. Use Create Timetable to add one.'}
                                    </td>
                                </tr>
                            ) : viewMode === 'class' ? (
                                pageClassRows.map((row) => {
                                    const record = row.record
                                    return (
                                        <tr key={row.key} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                            <td className='px-2 py-4 rounded-s-lg'>{row.className || '—'}</td>
                                            <td className='px-2 py-4'>{row.section || '—'}</td>
                                            <td className='px-2 py-4'>{record.ownerTeacherName || '—'}</td>
                                            <td className='px-2 py-4'>{record.id}</td>
                                            <td className='px-2 py-4'>{row.periodCount}</td>
                                            <td className='px-2 py-4'>{record.academicYear}</td>
                                            <td className='px-2 py-4'>
                                                <span className={`text-sm font-medium border rounded-md px-2 py-1 ${approvalStatusColor[record.approvalStatus]}`}>
                                                    {record.approvalStatus}
                                                </span>
                                            </td>
                                            <td className='px-2 py-4'>
                                                <button
                                                    type='button'
                                                    onClick={() => setSelectedRecord(record)}
                                                    className='bg-[#515DEF] text-white text-sm px-2 py-1.5 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                                                >
                                                    <Eye size={16} />
                                                    View
                                                </button>
                                            </td>
                                            <td className='px-2 py-4 rounded-e-lg'>
                                                <div className='flex items-center gap-2'>
                                                    {canApprove && record.approvalStatus === 'Pending' && hydrateStatus !== 'error' ? (
                                                        <>
                                                            <button
                                                                type='button'
                                                                onClick={() => reviewTimetable(record.id, true)}
                                                                className='text-sm text-[#4CAF50] font-medium cursor-pointer hover:underline'
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                type='button'
                                                                onClick={() => reviewTimetable(record.id, false)}
                                                                className='text-sm text-[#FF5722] font-medium cursor-pointer hover:underline'
                                                            >
                                                                Deny
                                                            </button>
                                                        </>
                                                    ) : null}
                                                    <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                        <button
                                                            type='button'
                                                            onClick={() => setSelectedRecord(record)}
                                                            className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                        >
                                                            View
                                                        </button>
                                                        {canEdit ? (
                                                            <button
                                                                type='button'
                                                                onClick={() => navigate(editPath(record.id))}
                                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                            >
                                                                Edit
                                                            </button>
                                                        ) : null}
                                                        {canDeleteTimetables ? (
                                                            <button
                                                                type='button'
                                                                disabled={deleting || hydrateStatus === 'loading' || hydrateStatus === 'error'}
                                                                onClick={() => requestDelete(record)}
                                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer disabled:opacity-50'
                                                            >
                                                                Delete
                                                            </button>
                                                        ) : null}
                                                    </Dropdown>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                pageRecords.map((record) => (
                                    <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 rounded-s-lg'>{record.id}</td>
                                        <td className='px-2 py-4'>{record.ownerTeacherName || '—'}</td>
                                        <td className='px-2 py-4'>{getClassSectionLabel(record)}</td>
                                        <td className='px-2 py-4'>{record.academicYear}</td>
                                        <td className='px-2 py-4'>{record.timelines?.length ?? 0}</td>
                                        <td className='px-2 py-4'>{record.submittedDate}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`text-sm font-medium border rounded-md px-2 py-1 ${approvalStatusColor[record.approvalStatus]}`}>
                                                {record.approvalStatus}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4'>
                                            <button
                                                type='button'
                                                onClick={() => setSelectedRecord(record)}
                                                className='bg-[#515DEF] text-white text-sm px-2 py-1.5 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                                            >
                                                <Eye size={16} />
                                                View Timetable
                                            </button>
                                        </td>
                                        <td className='px-2 py-4 rounded-e-lg'>
                                            <div className='flex items-center gap-2'>
                                                {canApprove && record.approvalStatus === 'Pending' && hydrateStatus !== 'error' ? (
                                                    <>
                                                        <button
                                                            type='button'
                                                            onClick={() => reviewTimetable(record.id, true)}
                                                            className='text-sm text-[#4CAF50] font-medium cursor-pointer hover:underline'
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            type='button'
                                                            onClick={() => reviewTimetable(record.id, false)}
                                                            className='text-sm text-[#FF5722] font-medium cursor-pointer hover:underline'
                                                        >
                                                            Deny
                                                        </button>
                                                    </>
                                                ) : null}
                                                <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                    <button
                                                        type='button'
                                                        onClick={() => setSelectedRecord(record)}
                                                        className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        View
                                                    </button>
                                                    {canEdit ? (
                                                        <button
                                                            type='button'
                                                            onClick={() => navigate(editPath(record.id))}
                                                            className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                        >
                                                            Edit
                                                        </button>
                                                    ) : null}
                                                    {canDeleteTimetables ? (
                                                        <button
                                                            type='button'
                                                            disabled={deleting || hydrateStatus === 'loading' || hydrateStatus === 'error'}
                                                            onClick={() => requestDelete(record)}
                                                            className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer disabled:opacity-50'
                                                        >
                                                            Delete
                                                        </button>
                                                    ) : null}
                                                </Dropdown>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    {listLength === 0
                        ? 'Showing 0 entries'
                        : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, listLength)} of ${listLength} entries`}
                </p>
                <div className='flex justify-center items-center gap-x-2'>
                    <button
                        type='button'
                        aria-label='Previous page'
                        disabled={currentPage <= 1}
                        onClick={() => setPage(currentPage - 1)}
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className='text-sm text-[#515DEF]'>{currentPage} / {pageCount}</span>
                    <button
                        type='button'
                        aria-label='Next page'
                        disabled={currentPage >= pageCount}
                        onClick={() => setPage(currentPage + 1)}
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <DeleteRequestModal
                deleteRequestModal={deleteRequestModal}
                setDeleteRequestModal={(open) => {
                    setDeleteRequestModal(open)
                    if (!open && !deleting) setPendingDelete(null)
                }}
                onConfirm={confirmDelete}
                title={pendingDelete ? `Delete class timetable ${pendingDelete.id}?` : undefined}
                message='This removes the timetable for every class it covers. The deletion is recorded in the audit log.'
                confirmLabel='Delete'
            />
            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='class-timetable-list'
                rows={Array.isArray(filteredRecords) ? filteredRecords : []}
                exportDescription={<>You are exporting {Array.isArray(filteredRecords) ? filteredRecords.length : 0} record(s).</>}
            />
            <ClassTimeTableModal
                open={Boolean(selectedRecord)}
                onClose={() => setSelectedRecord(null)}
                record={selectedRecord}
            />
        </section>
    )
}

export default ClassTimetableList
