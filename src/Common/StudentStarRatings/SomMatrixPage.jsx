import React, { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { SCHOOL_PROFILE } from '../../constants/schoolProfile'
import { hydrateEnrolledStudentsFromApi, getAllEnrolledStudents } from '../StudentDatabase/enrolledStudentsData'
import { useTeacherAssignments } from '../Teacher/useTeacherAssignments'
import {
    classKeysMatch,
    normalizeSectionKey,
} from '../Teacher/teacherAssignedClasses'
import { downloadHtml, openPrintDocument } from '../printDocument'
import { isApiStudentsEnabled } from '../../services/apiClient'
import { canUseClassDetailsApi, listAcademicYears } from '../../services/classDetailsApi'
import { useStarRatingsRouteBase } from './useStarRatingsRouteBase'
import { toast } from 'react-toastify'
import { fileDownloadUrl, uploadProfileImage } from '../../services/filesApi'
import {
    getDisabledSubs,
    hydrateSomFromApi,
    SOM_MONTHS,
    SOM_SYNC_EVENT,
    SOM_RATINGS,
    averageRatings,
    flattenSubs,
    getChecklist,
    getMatrixMeta,
    getRatings,
    getSomRoster,
    getStarTitles,
    importSomRows,
    ratingFor,
    resetChecklist,
    saveChecklist,
    saveMatrixMeta,
    saveStarTitles,
    setSubDisabled,
    studentScore,
    titlePlacements,
    upsertRating,
    visibleSubs,
} from './somChecklist'
import { downloadSomTemplateCsv, downloadSomTemplateExcel, previewSomImportFile } from './somImportFile'

const inputClass = 'border border-[#D9D9D9] rounded-md px-2 py-2 text-sm bg-white'

const newId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

const SomMatrixPage = () => {
    const routeBase = useStarRatingsRouteBase()
    const assignments = useTeacherAssignments()
    const [scopedRows, setScopedRows] = useState([])
    const [loadingStudents, setLoadingStudents] = useState(isApiStudentsEnabled())

    useEffect(() => {
        let cancelled = false
        const apply = () => {
            const all = getAllEnrolledStudents()
            if (!assignments.ready) return
            // Teachers are scoped to allocated classes; Principal/Coordinator/Admin see campus roster.
            const campusWide = /\/(principal|coordinator|director|admin|super-admin)\b/.test(routeBase || '')
            const scoped = assignments.assignments.length
                ? all.filter((student) => assignments.studentInScope(student))
                : (campusWide ? all : [])
            if (!cancelled) {
                setScopedRows(scoped)
                setLoadingStudents(false)
            }
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
    }, [assignments.ready, assignments.assignments.length, routeBase])

    const [yearOptions, setYearOptions] = useState(() => {
        const current = new Date().getFullYear()
        return [String(current - 1), String(current), String(current + 1)]
    })
    useEffect(() => {
        let cancelled = false
        if (!canUseClassDetailsApi()) return undefined
        listAcademicYears()
            .then((years) => {
                if (cancelled || !Array.isArray(years) || !years.length) return
                const fromApi = new Set()
                years.forEach((row) => {
                    const start = String(row.startDate || '').slice(0, 4)
                    const end = String(row.endDate || '').slice(0, 4)
                    if (/^\d{4}$/.test(start)) fromApi.add(start)
                    if (/^\d{4}$/.test(end)) fromApi.add(end)
                    const nameYears = String(row.name || '').match(/\d{4}/g) || []
                    nameYears.forEach((value) => fromApi.add(value))
                })
                if (!fromApi.size) return
                fromApi.add(String(new Date().getFullYear()))
                setYearOptions([...fromApi].sort())
            })
            .catch(() => {
                /* keep calendar-year fallback */
            })
        return () => {
            cancelled = true
        }
    }, [])

    const roster = useMemo(() => getSomRoster(scopedRows), [scopedRows])
    const teacherName = assignments.profile?.name || ''
    const grades = useMemo(() => {
        if (assignments.classes?.length) return assignments.classes
        return [...new Set(roster.map((student) => student.grade))]
    }, [assignments.classes, roster])
    const now = useMemo(() => new Date(), [])
    const [month, setMonth] = useState(() => SOM_MONTHS[now.getMonth()])
    const [year, setYear] = useState(() => String(now.getFullYear()))
    const [grade, setGrade] = useState('')
    const [section, setSection] = useState('')
    const activeGrade = grade && grades.some((item) => classKeysMatch(item, grade) || item === grade)
        ? (grades.find((item) => classKeysMatch(item, grade) || item === grade) || grade)
        : (grades[0] || '')

    const sections = useMemo(() => {
        if (activeGrade && assignments.sectionsFor) {
            const fromAssignments = assignments.sectionsFor(activeGrade)
            if (fromAssignments.length) return fromAssignments
        }
        return [
            ...new Set(
                roster
                    .filter((student) => classKeysMatch(student.grade, activeGrade))
                    .map((student) => student.section),
            ),
        ]
    }, [activeGrade, assignments, roster])

    const activeSection = sections.find((item) => normalizeSectionKey(item) === normalizeSectionKey(section))
        || sections[0]
        || ''
    const context = { month, year, grade: activeGrade, section: activeSection }
    const [checklist, setChecklist] = useState(() => getChecklist())
    const [titles, setTitles] = useState(() => getStarTitles())
    const [ratings, setRatings] = useState(() => getRatings())
    const [meta, setMeta] = useState(() => getMatrixMeta({
        month: SOM_MONTHS[now.getMonth()],
        year: String(now.getFullYear()),
        grade: '',
        section: '',
    }))
    const [preview, setPreview] = useState(null)
    const [panel, setPanel] = useState('matrix')
    const [revision, setRevision] = useState(0)
    const [syncError, setSyncError] = useState('')

    // Server copy wins over this browser; the cache is refilled once on open.
    useEffect(() => {
        let cancelled = false
        const onSync = (event) => {
            if (event.detail && event.detail.ok === false) setSyncError(event.detail.message)
        }
        window.addEventListener(SOM_SYNC_EVENT, onSync)
        hydrateSomFromApi().then((loaded) => {
            if (cancelled || !loaded) return
            setChecklist(getChecklist())
            setTitles(getStarTitles())
            setRatings(getRatings())
            setRevision((value) => value + 1)
        })
        return () => {
            cancelled = true
            window.removeEventListener(SOM_SYNC_EVENT, onSync)
        }
    }, [])

    const students = useMemo(
        () => getSomRoster(scopedRows).filter(
            (student) => classKeysMatch(student.grade, activeGrade)
                && normalizeSectionKey(student.section) === normalizeSectionKey(activeSection),
        ),
        [scopedRows, activeGrade, activeSection],
    )
    const subs = visibleSubs(checklist, context)
    const placements = titlePlacements(titles, students, subs, ratings, context)

    useEffect(() => {
        if (!activeGrade) return
        const stored = getMatrixMeta(context)
        setMeta({
            ...stored,
            classMentor: teacherName || stored.classMentor || '',
            signoff: {
                ...(stored.signoff || {}),
                Teacher: teacherName || stored.signoff?.Teacher || stored.signoff?.['Class Mentor'] || '',
            },
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when class context / teacher settles
    }, [month, year, activeGrade, activeSection, teacherName])

    const refreshMeta = (next) => setMeta(getMatrixMeta(next))
    const changeContext = (patch) => {
        const next = { ...context, ...patch }
        if (patch.grade) {
            const nextSections = assignments.sectionsFor?.(patch.grade)?.length
                ? assignments.sectionsFor(patch.grade)
                : [
                    ...new Set(
                        roster
                            .filter((student) => classKeysMatch(student.grade, patch.grade))
                            .map((student) => student.section),
                    ),
                ]
            next.section = nextSections[0] || ''
            setSection(next.section)
            setGrade(patch.grade)
        }
        if (patch.section != null) setSection(patch.section)
        if (patch.month != null) setMonth(patch.month)
        if (patch.year != null) setYear(patch.year)
        refreshMeta(next)
    }

    const setRating = (studentId, subId, rating) => setRatings(upsertRating(context, studentId, subId, rating))
    const persistMeta = (next) => {
        const withTeacher = {
            ...next,
            classMentor: teacherName || next.classMentor || '',
            signoff: {
                ...(next.signoff || {}),
                Teacher: teacherName || next.signoff?.Teacher || '',
            },
        }
        setMeta(withTeacher)
        saveMatrixMeta(context, withTeacher)
    }

    const printBody = () => {
        const head = `<h1 style="text-align:center">${SCHOOL_PROFILE.name}</h1><p style="text-align:center">Star of the Month - ${month} ${year}</p><p>Grade: ${activeGrade}${activeSection} &nbsp; Teacher: ${teacherName || 'NA'}</p>`
        const header = `<tr><th>Sub Parameter</th>${students.map((student) => `<th>${student.name}</th>`).join('')}<th>Overall 3 Point Scale Rating</th></tr>`
        let lastCategory = ''
        const body = subs.map((item) => {
            const categoryRow = item.categoryName !== lastCategory ? `<tr><td colspan="${students.length + 2}"><strong>${item.categoryName}</strong></td></tr>` : ''
            lastCategory = item.categoryName
            const values = students.map((student) => ratingFor(ratings, context, student.id, item.id))
            return `${categoryRow}<tr><td>${item.name}</td>${values.map((value) => `<td>${value || ''}</td>`).join('')}<td>${averageRatings(values) ?? 'NA'}</td></tr>`
        }).join('')
        const totals = `<tr><td>Overall</td>${students.map((student) => `<td>${studentScore(subs, ratings, context, student.id) ?? 'NA'}</td>`).join('')}<td>${averageRatings(students.map((student) => studentScore(subs, ratings, context, student.id))) ?? 'NA'}</td></tr>`
        const summary = `<table><tr><th>Star Titles</th><th>Winners</th><th>Runner up 1</th><th>Runner up 2</th></tr>${placements.map((item) => `<tr><td>${item.name}</td><td>${item.winner ? `${item.winner.name} (${item.winner.score})` : ''}</td><td>${item.runnerUp1 ? `${item.runnerUp1.name} (${item.runnerUp1.score})` : ''}</td><td>${item.runnerUp2 ? `${item.runnerUp2.name} (${item.runnerUp2.score})` : ''}</td></tr>`).join('')}</table>`
        const signoff = `<p style="margin-top:16px">Teacher (${teacherName || 'NA'}) &nbsp; Co-ordinator &nbsp; AVP-KG &nbsp; VP &nbsp; Principal</p>`
        return `${head}<table>${header}${body}${totals}</table>${summary}${signoff}`
    }

    return (
        <section className='space-y-4'>
            {syncError ? (
                <p role='alert' className='text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FECDCA] rounded-lg px-3 py-2'>
                    {syncError} Your changes are kept in this browser; reload the page to retry.
                </p>
            ) : null}
            <div className='bg-white rounded-2xl shadow-md p-4 space-y-3'>
                <h2 className='text-xl font-semibold'>{SCHOOL_PROFILE.name}</h2>
                <p className='font-medium'>Star of the Month - {month} {year}</p>
                <div className='grid md:grid-cols-5 gap-3'>
                    <label className='text-sm'>Month<select className={inputClass} value={month} onChange={(e) => { setMonth(e.target.value); changeContext({ month: e.target.value }) }}>{SOM_MONTHS.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label className='text-sm'>Year<select className={inputClass} value={year} onChange={(e) => { setYear(e.target.value); changeContext({ year: e.target.value }) }}>{yearOptions.map((item) => <option key={item} value={item}>{item}</option>)}{!yearOptions.includes(year) ? <option value={year}>{year}</option> : null}</select></label>
                    <label className='text-sm'>Grade<select className={inputClass} value={activeGrade} onChange={(e) => { setGrade(e.target.value); changeContext({ grade: e.target.value }) }}>{grades.map((item) => <option key={item} value={item}>{item}</option>)}{!grades.length && <option value=''>No assigned class</option>}</select></label>
                    <label className='text-sm'>Section<select className={inputClass} value={activeSection} onChange={(e) => { setSection(e.target.value); changeContext({ section: e.target.value }) }}>{sections.map((item) => <option key={item} value={item}>{item}</option>)}{!sections.length && <option value=''>No section</option>}</select></label>
                    <label className='text-sm'>Teacher<input className={`${inputClass} bg-[#F8F9FC]`} value={teacherName || '—'} readOnly /></label>
                </div>
                <p className='text-sm text-[#667085]'>
                    Grade: {activeGrade || 'NA'}{activeSection ? `-${activeSection}` : ''}
                    {loadingStudents
                        ? ' · Loading enrolled students…'
                        : assignments.emptyReason
                            ? ` · ${assignments.emptyReason}`
                            : students.length
                                ? ` · ${students.length} student(s) in this class/section.`
                                : roster.length
                                    ? ' · No enrolled students in this grade/section yet.'
                                    : ' · No enrolled students in your assigned classes yet.'}
                    {' '}
                    <NavLink className='text-[#515DEF]' to={`${routeBase}/star-of-month`}>Open the earlier monthly rating list</NavLink>
                </p>
                <div className='flex flex-wrap gap-2'>
                    <button type='button' className='text-sm px-3 py-2 rounded-md bg-[#515DEF] text-white cursor-pointer' onClick={() => setPanel('matrix')}>Matrix</button>
                    <button type='button' className='text-sm px-3 py-2 rounded-md border cursor-pointer' onClick={() => setPanel('checklist')}>Checklist</button>
                    <button type='button' className='text-sm px-3 py-2 rounded-md border cursor-pointer' onClick={() => setPanel('import')}>Bulk upload</button>
                    <button type='button' className='text-sm px-3 py-2 rounded-md border cursor-pointer' onClick={() => openPrintDocument({ title: `SOM ${month} ${year}`, body: printBody(), css: '@page{size:A4 landscape;margin:8mm} th,td{font-size:10px}' })}>Print</button>
                    <button type='button' className='text-sm px-3 py-2 rounded-md border cursor-pointer' onClick={() => downloadHtml(`som-${activeGrade}${activeSection}-${month}-${year}.html`, `<!doctype html><html><body>${printBody()}</body></html>`)}>Export</button>
                </div>
            </div>

            {panel === 'checklist' && (
                <ChecklistEditor
                    key={`${month}-${year}-${activeGrade}-${activeSection}-${revision}`}
                    checklist={checklist}
                    context={context}
                    disabledIds={getDisabledSubs(context)}
                    onToggle={(subId, enabled) => { setSubDisabled(context, subId, !enabled); setRevision((value) => value + 1) }}
                    onChange={(next) => { saveChecklist(next); setChecklist(next) }}
                    onReset={() => setChecklist(resetChecklist())}
                    titles={titles}
                    onTitles={(next) => { saveStarTitles(next); setTitles(next) }}
                    subs={flattenSubs(checklist)}
                />
            )}

            {panel === 'import' && (
                <ImportPanel
                    context={context}
                    students={students}
                    subs={subs}
                    preview={preview}
                    setPreview={setPreview}
                    onImported={(next) => { setRatings(next); setPreview(null); setPanel('matrix') }}
                />
            )}

            {panel === 'matrix' && (
                <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                    {!students.length ? <p className='text-sm text-[#667085]'>No students are enrolled in this grade and section.</p> : (
                        <table className='text-sm border-collapse min-w-max'>
                            <thead>
                                <tr>
                                    <th className='border px-2 py-2 text-left sticky left-0 bg-white'>Sub Parameter</th>
                                    {students.map((student) => <th key={student.id} className='border px-2 py-2'>{student.name}</th>)}
                                    <th className='border px-2 py-2'>Overall 3 Point Scale Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subs.map((item, index) => {
                                    const showCategory = index === 0 || subs[index - 1].categoryId !== item.categoryId
                                    const values = students.map((student) => ratingFor(ratings, context, student.id, item.id))
                                    return (
                                        <React.Fragment key={item.id}>
                                            {showCategory && <tr><td colSpan={students.length + 2} className='border px-2 py-2 font-semibold bg-[#F8F9FC]'>{item.categoryName}</td></tr>}
                                            <tr>
                                                <td className='border px-2 py-2 sticky left-0 bg-white'>{item.name}</td>
                                                {students.map((student) => (
                                                    <td key={student.id} className='border px-1 py-1'>
                                                        <select className='border rounded px-1 py-1' value={ratingFor(ratings, context, student.id, item.id)} onChange={(e) => setRating(student.id, item.id, e.target.value)}>
                                                            <option value='' />
                                                            {SOM_RATINGS.map((rating) => <option key={rating}>{rating}</option>)}
                                                        </select>
                                                    </td>
                                                ))}
                                                <td className='border px-2 py-2'>{averageRatings(values) ?? 'NA'}</td>
                                            </tr>
                                        </React.Fragment>
                                    )
                                })}
                                <tr>
                                    <td className='border px-2 py-2 font-semibold'>Overall</td>
                                    {students.map((student) => <td key={student.id} className='border px-2 py-2 font-semibold'>{studentScore(subs, ratings, context, student.id) ?? 'NA'}</td>)}
                                    <td className='border px-2 py-2'>{averageRatings(students.map((student) => studentScore(subs, ratings, context, student.id))) ?? 'NA'}</td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                    <table className='text-sm border-collapse mt-4 min-w-[640px]'>
                        <thead><tr>{['Star Titles', 'Winners', 'Runner up 1', 'Runner up 2'].map((label) => <th key={label} className='border px-2 py-2 text-left'>{label}</th>)}</tr></thead>
                        <tbody>
                            {placements.map((item) => (
                                <tr key={item.id}>
                                    <td className='border px-2 py-2'>{item.name}</td>
                                    <td className='border px-2 py-2'>{item.winner ? `${item.winner.name} (${item.winner.score})` : ''}</td>
                                    <td className='border px-2 py-2'>{item.runnerUp1 ? `${item.runnerUp1.name} (${item.runnerUp1.score})` : ''}</td>
                                    <td className='border px-2 py-2'>{item.runnerUp2 ? `${item.runnerUp2.name} (${item.runnerUp2.score})` : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className='grid md:grid-cols-5 gap-3 mt-4 text-sm'>
                        <label>
                            Teacher
                            <input className={`${inputClass} bg-[#F8F9FC]`} value={teacherName || '—'} readOnly />
                        </label>
                        {['Co-ordinator', 'AVP-KG', 'VP', 'Principal'].map((label) => (
                            <label key={label}>
                                {label}
                                <input
                                    className={inputClass}
                                    value={meta.signoff?.[label] || ''}
                                    onChange={(e) => persistMeta({
                                        ...meta,
                                        signoff: { ...(meta.signoff || {}), [label]: e.target.value },
                                    })}
                                />
                            </label>
                        ))}
                    </div>
                    <MatrixDocuments
                        context={context}
                        meta={meta}
                        onChange={persistMeta}
                        resourceId={`${year}|${month}|${activeGrade}|${activeSection}`}
                    />
                </div>
            )}
        </section>
    )
}

const ChecklistEditor = ({ checklist, disabledIds, onToggle, onChange, onReset, titles, onTitles, subs }) => {
    const updateCategory = (id, patch) => onChange(checklist.map((category) => (category.id === id ? { ...category, ...patch } : category)))
    return (
        <div className='bg-white rounded-2xl shadow-md p-4 space-y-4'>
            <div className='flex gap-2'>
                <button type='button' className='text-sm text-[#515DEF] cursor-pointer' onClick={() => onChange([...checklist, { id: newId('cat'), name: 'New category', enabled: true, subs: [] }])}>Add category</button>
                <button type='button' className='text-sm cursor-pointer' onClick={onReset}>Restore QMIS default</button>
            </div>
            {checklist.map((category, categoryIndex) => (
                <div key={category.id} className='border rounded-xl p-3 space-y-2'>
                    <div className='flex flex-wrap gap-2'>
                        <input className={inputClass} value={category.name} onChange={(e) => updateCategory(category.id, { name: e.target.value })} />
                        <button type='button' className='text-sm cursor-pointer' onClick={() => categoryIndex > 0 && onChange(moveItem(checklist, categoryIndex, -1))}>Up</button>
                        <button type='button' className='text-sm cursor-pointer' onClick={() => categoryIndex < checklist.length - 1 && onChange(moveItem(checklist, categoryIndex, 1))}>Down</button>
                        <button type='button' className='text-sm text-[#FF0000] cursor-pointer' onClick={() => onChange(checklist.filter((item) => item.id !== category.id))}>Remove</button>
                    </div>
                    {category.subs.map((item, subIndex) => (
                        <div key={item.id} className='flex flex-wrap gap-2 items-center'>
                            <input className={inputClass} value={item.name} onChange={(e) => updateCategory(category.id, { subs: category.subs.map((subItem) => subItem.id === item.id ? { ...subItem, name: e.target.value } : subItem) })} />
                            <label className='text-xs'><input type='checkbox' checked={item.enabled !== false} onChange={(e) => updateCategory(category.id, { subs: category.subs.map((subItem) => subItem.id === item.id ? { ...subItem, enabled: e.target.checked } : subItem) })} /> Enabled</label>
                            <label className='text-xs'><input type='checkbox' checked={!disabledIds.includes(item.id)} onChange={(e) => onToggle(item.id, e.target.checked)} /> This month/grade</label>
                            <button type='button' className='text-xs cursor-pointer' onClick={() => subIndex > 0 && updateCategory(category.id, { subs: moveItem(category.subs, subIndex, -1) })}>Up</button>
                            <button type='button' className='text-xs text-[#FF0000] cursor-pointer' onClick={() => updateCategory(category.id, { subs: category.subs.filter((subItem) => subItem.id !== item.id) })}>Remove</button>
                        </div>
                    ))}
                    <button type='button' className='text-sm text-[#515DEF] cursor-pointer' onClick={() => updateCategory(category.id, { subs: [...category.subs, { id: newId('sub'), name: 'New subparameter', enabled: true }] })}>Add subparameter</button>
                </div>
            ))}
            <div className='space-y-2'>
                <h3 className='font-medium'>Star title mapping</h3>
                {titles.map((title) => (
                    <div key={title.id} className='grid md:grid-cols-2 gap-2 border rounded-md p-2'>
                        <input className={inputClass} value={title.name} onChange={(e) => onTitles(titles.map((item) => item.id === title.id ? { ...item, name: e.target.value } : item))} />
                        {title.mode === 'overall' ? <p className='text-sm text-[#667085]'>Uses the overall SOM score.</p> : (
                            <select multiple className={inputClass} value={title.subIds} onChange={(e) => onTitles(titles.map((item) => item.id === title.id ? { ...item, subIds: [...e.target.selectedOptions].map((option) => option.value) } : item))}>
                                {subs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

const moveItem = (list, index, direction) => {
    const next = [...list]
    const [item] = next.splice(index, 1)
    next.splice(index + direction, 0, item)
    return next
}

const ImportPanel = ({ context, students, subs, preview, setPreview, onImported }) => {
    const [reading, setReading] = useState(false)
    const allPreviewRows = [...(preview?.rows || []), ...(preview?.duplicates || [])]

    const onFile = async (event) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        setReading(true)
        try {
            const next = await previewSomImportFile(file, context, students, subs, getRatings())
            setPreview(next)
        } catch (error) {
            setPreview({ rows: [], duplicates: [], errors: [error?.message || 'Could not read the file.'] })
        } finally {
            setReading(false)
        }
    }

    return (
        <div className='bg-white rounded-2xl shadow-md p-4 space-y-3'>
            <p className='text-sm text-[#667085]'>
                Download the sample template, fill ratings (1, 2, 3, or NA only), then upload CSV or Excel for a preview before saving.
            </p>
            <div className='flex flex-wrap gap-2'>
                <button
                    type='button'
                    className='text-sm border px-3 py-2 rounded-md cursor-pointer'
                    onClick={() => downloadSomTemplateCsv(`som-template-${context.grade}${context.section}`, context, students, subs)}
                >
                    Download CSV template
                </button>
                <button
                    type='button'
                    className='text-sm border px-3 py-2 rounded-md cursor-pointer'
                    onClick={() => downloadSomTemplateExcel(`som-template-${context.grade}${context.section}`, context, students, subs)}
                >
                    Download Excel template
                </button>
            </div>
            <input
                type='file'
                accept='.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
                disabled={reading}
                onChange={onFile}
            />
            {reading ? <p className='text-sm text-[#667085]'>Reading file…</p> : null}
            {preview && (
                <div className='text-sm space-y-2'>
                    <p>
                        {preview.rows.length} new row(s). {(preview.duplicates || []).length} duplicate(s) blocked.
                        {' '}{preview.errors.length} error(s).
                    </p>
                    {preview.errors.map((error) => <p key={error} className='text-[#B42318]'>{error}</p>)}
                    {(preview.duplicates || []).length > 0 && (
                        <p className='text-[#B54708]'>
                            Existing matrix cells are treated as duplicates and will not be overwritten. Clear those cells in the matrix first, or remove them from the file.
                        </p>
                    )}
                    {allPreviewRows.length > 0 && (
                        <div className='overflow-x-auto max-h-64 border rounded-md'>
                            <table className='min-w-full text-xs'>
                                <thead>
                                    <tr className='bg-[#F8F9FC]'>
                                        {['Row', 'Student', 'Subparameter', 'Rating', 'Status'].map((label) => (
                                            <th key={label} className='text-left px-2 py-1 border'>{label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {allPreviewRows.slice(0, 100).map((row) => (
                                        <tr key={`${row.rowNumber}-${row.studentId}-${row.subId}`}>
                                            <td className='border px-2 py-1'>{row.rowNumber}</td>
                                            <td className='border px-2 py-1'>{row.studentName}</td>
                                            <td className='border px-2 py-1'>{row.subparameter}</td>
                                            <td className='border px-2 py-1'>{row.rating}</td>
                                            <td className={`border px-2 py-1 ${row.status === 'Duplicate' ? 'text-[#B54708]' : 'text-[#027A48]'}`}>{row.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <button
                        type='button'
                        disabled={preview.errors.length > 0 || preview.rows.length === 0}
                        className='bg-[#515DEF] text-white px-3 py-2 rounded-md disabled:opacity-40 cursor-pointer'
                        onClick={() => onImported(importSomRows(context, preview.rows))}
                    >
                        Confirm import ({preview.rows.length})
                    </button>
                </div>
            )}
        </div>
    )
}

const MatrixDocuments = ({ context, meta, onChange, resourceId }) => {
    const documents = Array.isArray(meta?.documents) ? meta.documents : []
    const [uploading, setUploading] = useState(false)

    const onUpload = async (event) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        setUploading(true)
        try {
            const asset = await uploadProfileImage(file, 'som-matrix-doc', resourceId)
            onChange({
                ...meta,
                documents: [
                    ...documents,
                    {
                        fileId: asset.id,
                        name: asset.originalName || file.name,
                        uploadedAt: new Date().toISOString(),
                    },
                ],
            })
            toast.success('Document attached.')
        } catch (error) {
            toast.error(error?.message || 'Document upload failed.')
        } finally {
            setUploading(false)
        }
    }

    const removeDoc = (fileId) => {
        onChange({
            ...meta,
            documents: documents.filter((item) => item.fileId !== fileId),
        })
    }

    return (
        <div className='mt-4 border-t pt-4 space-y-2'>
            <h3 className='text-sm font-medium text-[#1E1E1E]'>Supporting documents</h3>
            <p className='text-xs text-[#667085]'>
                Attach evidence for {context.month} {context.year} · {context.grade}-{context.section}. Files are stored securely and only staff with Star of the Month access can download them.
            </p>
            <label className={`inline-flex items-center gap-2 rounded-md bg-[#515DEF] px-4 py-2 text-sm font-medium text-white cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                Browse
                <input
                    type='file'
                    accept='.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,image/png,image/jpeg,image/*,application/pdf'
                    disabled={uploading}
                    onChange={onUpload}
                    className='sr-only'
                />
            </label>
            {uploading ? <p className='text-xs text-[#667085]'>Uploading…</p> : null}
            {!documents.length ? (
                <p className='text-xs text-[#667085]'>No documents attached yet.</p>
            ) : (
                <ul className='space-y-1 text-sm'>
                    {documents.map((doc) => (
                        <li key={doc.fileId} className='flex flex-wrap items-center gap-3'>
                            <a
                                className='text-[#515DEF] underline'
                                href={fileDownloadUrl(`/api/v1/files/${doc.fileId}/download`)}
                                target='_blank'
                                rel='noreferrer'
                            >
                                {doc.name || doc.fileId}
                            </a>
                            <button type='button' className='text-xs text-[#B42318] cursor-pointer' onClick={() => removeDoc(doc.fileId)}>
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default SomMatrixPage
