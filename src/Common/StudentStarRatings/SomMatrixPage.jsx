import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { SCHOOL_PROFILE } from '../../constants/schoolProfile'
import { downloadHtml, openPrintDocument } from '../printDocument'
import { useStarRatingsRouteBase } from './useStarRatingsRouteBase'
import {
    getDisabledSubs,
    SOM_MONTHS,
    SOM_RATINGS,
    averageRatings,
    checklistTemplateCsv,
    flattenSubs,
    getChecklist,
    getMatrixMeta,
    getRatings,
    getSomRoster,
    getStarTitles,
    importSomRows,
    previewSomImport,
    ratingFor,
    resetChecklist,
    rosterFor,
    saveChecklist,
    saveMatrixMeta,
    saveStarTitles,
    setSubDisabled,
    studentScore,
    titlePlacements,
    upsertRating,
    visibleSubs,
} from './somChecklist'

const inputClass = 'border border-[#D9D9D9] rounded-md px-2 py-2 text-sm bg-white'

const newId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

const SomMatrixPage = () => {
    const routeBase = useStarRatingsRouteBase()
    const roster = useMemo(() => getSomRoster(), [])
    const grades = [...new Set(roster.map((student) => student.grade))]
    const [month, setMonth] = useState('August')
    const [year, setYear] = useState('2026')
    const [grade, setGrade] = useState(grades[0] || '')
    const [section, setSection] = useState('')
    const sections = [...new Set(roster.filter((student) => student.grade === grade).map((student) => student.section))]
    const activeSection = section || sections[0] || ''
    const context = { month, year, grade, section: activeSection }
    const [checklist, setChecklist] = useState(() => getChecklist())
    const [titles, setTitles] = useState(() => getStarTitles())
    const [ratings, setRatings] = useState(() => getRatings())
    const [meta, setMeta] = useState(() => getMatrixMeta({ month: 'August', year: '2026', grade: grades[0] || '', section: roster.find((student) => student.grade === grades[0])?.section || '' }))
    const [preview, setPreview] = useState(null)
    const [panel, setPanel] = useState('matrix')
    const [revision, setRevision] = useState(0)

    const students = rosterFor(grade, activeSection)
    const subs = visibleSubs(checklist, context)
    const placements = titlePlacements(titles, students, subs, ratings, context)

    const refreshMeta = (next) => setMeta(getMatrixMeta(next))
    const changeContext = (patch) => {
        const next = { ...context, ...patch }
        if (patch.grade) {
            const nextSections = [...new Set(roster.filter((student) => student.grade === patch.grade).map((student) => student.section))]
            next.section = nextSections[0] || ''
            setSection(next.section)
        }
        refreshMeta(next)
    }

    const setRating = (studentId, subId, rating) => setRatings(upsertRating(context, studentId, subId, rating))
    const persistMeta = (next) => {
        setMeta(next)
        saveMatrixMeta(context, next)
    }

    const printBody = () => {
        const head = `<h1 style="text-align:center">${SCHOOL_PROFILE.name}</h1><p style="text-align:center">Star of the Month - ${month} ${year}</p><p>Grade: ${grade}${activeSection} &nbsp; Class Mentor: ${meta.classMentor || 'NA'}</p>`
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
        const signoff = `<p style="margin-top:16px">Class Mentor &nbsp; Co-ordinator &nbsp; AVP-KG &nbsp; VP &nbsp; Principal</p>`
        return `${head}<table>${header}${body}${totals}</table>${summary}${signoff}`
    }

    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-4 space-y-3'>
                <h2 className='text-xl font-semibold'>{SCHOOL_PROFILE.name}</h2>
                <p className='font-medium'>Star of the Month - {month} {year}</p>
                <div className='grid md:grid-cols-5 gap-3'>
                    <label className='text-sm'>Month<select className={inputClass} value={month} onChange={(e) => { setMonth(e.target.value); changeContext({ month: e.target.value }) }}>{SOM_MONTHS.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label className='text-sm'>Year<input className={inputClass} value={year} onChange={(e) => { setYear(e.target.value); changeContext({ year: e.target.value }) }} /></label>
                    <label className='text-sm'>Grade<select className={inputClass} value={grade} onChange={(e) => { setGrade(e.target.value); changeContext({ grade: e.target.value }) }}>{grades.map((item) => <option key={item}>{item}</option>)}{!grades.length && <option value=''>No class</option>}</select></label>
                    <label className='text-sm'>Section<select className={inputClass} value={activeSection} onChange={(e) => { setSection(e.target.value); changeContext({ section: e.target.value }) }}>{sections.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label className='text-sm'>Class Mentor<input className={inputClass} value={meta.classMentor || ''} onChange={(e) => persistMeta({ ...meta, classMentor: e.target.value })} /></label>
                </div>
                <p className='text-sm text-[#667085]'>Grade: {grade || 'NA'}{activeSection} · Students are loaded from the class list, not from the sample PDF. <NavLink className='text-[#515DEF]' to={`${routeBase}/star-of-month`}>Open the earlier monthly rating list</NavLink></p>
                <div className='flex flex-wrap gap-2'>
                    <button type='button' className='text-sm px-3 py-2 rounded-md bg-[#515DEF] text-white cursor-pointer' onClick={() => setPanel('matrix')}>Matrix</button>
                    <button type='button' className='text-sm px-3 py-2 rounded-md border cursor-pointer' onClick={() => setPanel('checklist')}>Checklist</button>
                    <button type='button' className='text-sm px-3 py-2 rounded-md border cursor-pointer' onClick={() => setPanel('import')}>Bulk upload</button>
                    <button type='button' className='text-sm px-3 py-2 rounded-md border cursor-pointer' onClick={() => openPrintDocument({ title: `SOM ${month} ${year}`, body: printBody(), css: '@page{size:A4 landscape;margin:8mm} th,td{font-size:10px}' })}>Print</button>
                    <button type='button' className='text-sm px-3 py-2 rounded-md border cursor-pointer' onClick={() => downloadHtml(`som-${grade}${activeSection}-${month}-${year}.html`, `<!doctype html><html><body>${printBody()}</body></html>`)}>Export</button>
                </div>
            </div>

            {panel === 'checklist' && (
                <ChecklistEditor
                    key={`${month}-${year}-${grade}-${activeSection}-${revision}`}
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
                        {['Class Mentor', 'Co-ordinator', 'AVP-KG', 'VP', 'Principal'].map((label) => (
                            <label key={label}>{label}<input className={inputClass} value={meta.signoff?.[label] || ''} onChange={(e) => persistMeta({ ...meta, signoff: { ...(meta.signoff || {}), [label]: e.target.value } })} /></label>
                        ))}
                    </div>
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

const ImportPanel = ({ context, students, subs, preview, setPreview, onImported }) => (
    <div className='bg-white rounded-2xl shadow-md p-4 space-y-3'>
        <button type='button' className='text-sm border px-3 py-2 rounded-md cursor-pointer' onClick={() => downloadCsv(`som-template-${context.grade}${context.section}.csv`, checklistTemplateCsv(context, students, subs))}>Download template</button>
        <input type='file' accept='.csv,text/csv' onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => setPreview(previewSomImport(String(reader.result || ''), context, students, subs))
            reader.readAsText(file)
        }} />
        {preview && (
            <div className='text-sm space-y-2'>
                <p>{preview.rows.length} valid row(s). {preview.errors.length} error(s).</p>
                {preview.errors.map((error) => <p key={error} className='text-[#B42318]'>{error}</p>)}
                <button type='button' disabled={preview.errors.length > 0 || preview.rows.length === 0} className='bg-[#515DEF] text-white px-3 py-2 rounded-md disabled:opacity-40 cursor-pointer' onClick={() => onImported(importSomRows(context, preview.rows))}>Import</button>
            </div>
        )}
    </div>
)

const downloadCsv = (filename, text) => {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}

export default SomMatrixPage
