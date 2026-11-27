import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
    getPromoteOptionsApi,
    listPlacedStudentsApi,
    promoteStudentApi,
} from '../../../services/placementApi'

// One request per student, sent one after another: the server assigns roll numbers and checks
// section capacity per promotion, so parallel requests could race. Large batches are capped.
const MAX_BATCH = 100

const studentLabel = (row) => {
    const section = row.section ? `-${row.section}` : ''
    const roll = row.rollNumber !== '' && row.rollNumber != null ? ` #${row.rollNumber}` : ''
    return `${row.className}${section}${roll}`
}

const isSectionFull = (error) => error?.status === 409 && /capacity/i.test(error?.message || '')

const PromoteStudents = ({ basePath = '/coordinator/student-placement' }) => {
    const [rows, setRows] = useState([])
    const [classFilter, setClassFilter] = useState('')
    const [selectedIds, setSelectedIds] = useState(() => new Set())
    const [promoteOpts, setPromoteOpts] = useState(null)
    const [targetSectionId, setTargetSectionId] = useState('')
    const [loading, setLoading] = useState(true)
    const [loadingOpts, setLoadingOpts] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [progress, setProgress] = useState(null)
    const [results, setResults] = useState([])

    const refresh = useCallback(async () => {
        setLoading(true)
        try {
            const placed = await listPlacedStudentsApi()
            setRows(placed)
        } catch (err) {
            toast.error(err.message || 'Failed to load students.')
            setRows([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    const classOptions = useMemo(
        () => [...new Set(rows.map((row) => row.className).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
        [rows],
    )
    const classRows = useMemo(
        () => (classFilter ? rows.filter((row) => row.className === classFilter) : []),
        [rows, classFilter],
    )
    const selectedRows = classRows.filter((row) => selectedIds.has(row.id))
    const firstSelectedId = selectedRows[0]?.id || ''

    // Every student in one class goes to the same next grade, so the first selection gives the target.
    useEffect(() => {
        if (!firstSelectedId) {
            setPromoteOpts(null)
            setTargetSectionId('')
            return undefined
        }
        let cancelled = false
        setLoadingOpts(true)
        getPromoteOptionsApi(firstSelectedId)
            .then((opts) => {
                if (!cancelled) setPromoteOpts(opts)
            })
            .catch((err) => {
                if (!cancelled) {
                    setPromoteOpts(null)
                    toast.error(err.message || 'Could not load next-grade options.')
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingOpts(false)
            })
        return () => {
            cancelled = true
        }
    }, [firstSelectedId])

    const sections = (promoteOpts?.sections || []).filter((s) => s.isActive !== false)
    const targetSection = sections.find((s) => s.id === targetSectionId)
    const running = progress != null
    const allSelected = classRows.length > 0 && classRows.every((row) => selectedIds.has(row.id))
    const tooMany = selectedRows.length > MAX_BATCH
    const canPromote = Boolean(
        selectedRows.length
        && !tooMany
        && promoteOpts?.classId
        && promoteOpts?.nextGrade
        && targetSectionId
        && !running,
    )

    const chooseClass = (value) => {
        setClassFilter(value)
        setSelectedIds(new Set())
        setTargetSectionId('')
        setConfirming(false)
        setResults([])
    }

    const toggleOne = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
        setConfirming(false)
    }

    const toggleAll = () => {
        setSelectedIds(allSelected ? new Set() : new Set(classRows.map((row) => row.id)))
        setConfirming(false)
    }

    const runPromotion = async () => {
        if (!canPromote) return
        setConfirming(false)
        const batch = [...selectedRows]
        const outcome = []
        setProgress({ done: 0, total: batch.length })
        for (let index = 0; index < batch.length; index += 1) {
            const row = batch[index]
            try {
                const updated = await promoteStudentApi(row.id, {
                    targetClassId: promoteOpts.classId,
                    targetSectionId,
                    academicYearId: promoteOpts.academicYearId,
                })
                outcome.push({ id: row.id, name: row.name, ok: true, detail: `${updated.className}-${updated.section}, roll ${updated.rollNumber}` })
            } catch (err) {
                outcome.push({ id: row.id, name: row.name, ok: false, detail: err.message || 'Promotion failed.' })
                if (isSectionFull(err)) {
                    batch.slice(index + 1).forEach((rest) => outcome.push({
                        id: rest.id, name: rest.name, ok: false, detail: 'Not attempted: the section is full.',
                    }))
                    break
                }
            }
            setProgress({ done: index + 1, total: batch.length })
        }
        const promoted = outcome.filter((item) => item.ok).length
        setResults(outcome)
        setProgress(null)
        setSelectedIds(new Set())
        setTargetSectionId('')
        if (promoted === outcome.length) toast.success(`Promoted ${promoted} student${promoted === 1 ? '' : 's'}.`)
        else toast.error(`Promoted ${promoted} of ${outcome.length}. See the results below.`)
        await refresh()
    }

    return (
        <section className='bg-white rounded-2xl shadow-md p-6'>
            <div className='flex flex-wrap items-start justify-between gap-4 mb-4'>
                <div>
                    <h2 className='text-xl font-semibold text-[#0C1E5B]'>Promote students</h2>
                    <p className='text-sm text-[#667085] mt-1'>
                        Students move to the next grade only (e.g. Grade 1 → Grade 2). Pick a class,
                        tick the students (or Select all), then choose the section in the next grade;
                        roll numbers are assigned automatically. After a band handoff (e.g. 4 → 5),
                        the next coordinator takes over.
                    </p>
                </div>
                <Link to={basePath} className='text-sm text-[#515DEF] hover:underline'>
                    Back to pending placement
                </Link>
            </div>

            {loading ? (
                <p className='text-sm text-[#667085]'>Loading…</p>
            ) : (
                <>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        <div>
                            <label className='text-base font-medium' htmlFor='promoteClass'>Current class</label>
                            <select
                                id='promoteClass'
                                value={classFilter}
                                onChange={(e) => chooseClass(e.target.value)}
                                disabled={running}
                                className='mt-2 text-sm border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                            >
                                <option value=''>Select class</option>
                                {classOptions.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className='text-base font-medium' htmlFor='targetClass'>Target class (next grade only)</label>
                            <input
                                id='targetClass'
                                type='text'
                                readOnly
                                value={
                                    loadingOpts
                                        ? 'Loading…'
                                        : promoteOpts?.message || promoteOpts?.className || (selectedRows.length ? '—' : 'Select students')
                                }
                                className='mt-2 text-sm border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-[#F5F5F5]'
                            />
                            {promoteOpts?.currentGrade != null && promoteOpts?.nextGrade != null && (
                                <p className='text-sm text-[#515DEF] mt-2'>
                                    Grade {promoteOpts.currentGrade} → Grade {promoteOpts.nextGrade}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className='text-base font-medium' htmlFor='targetSectionId'>Target section</label>
                            <select
                                id='targetSectionId'
                                value={targetSectionId}
                                onChange={(e) => {
                                    setTargetSectionId(e.target.value)
                                    setConfirming(false)
                                }}
                                disabled={!sections.length || running}
                                className='mt-2 text-sm border border-[#D9D9D9] rounded-md px-2 py-3 w-full disabled:bg-[#F5F5F5]'
                            >
                                <option value=''>Select section</option>
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.name}{section.capacity ? ` (capacity ${section.capacity})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {classFilter && (
                        <div className='mt-6 border border-[#EDEEF5] rounded-xl overflow-x-auto'>
                            <table className='w-full text-sm text-left'>
                                <thead className='text-xs bg-[#EDEEF5] uppercase text-[#0C1E5B]'>
                                    <tr>
                                        <th className='px-3 py-3 w-12'>
                                            <input
                                                type='checkbox'
                                                aria-label='Select all students in this class'
                                                checked={allSelected}
                                                onChange={toggleAll}
                                                disabled={!classRows.length || running}
                                            />
                                        </th>
                                        <th className='px-3 py-3'>Student</th>
                                        <th className='px-3 py-3'>Admission no.</th>
                                        <th className='px-3 py-3'>Current class</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classRows.length === 0 && (
                                        <tr><td colSpan={4} className='px-3 py-6 text-center text-[#667085]'>No placed students in this class.</td></tr>
                                    )}
                                    {classRows.map((row) => (
                                        <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                            <td className='px-3 py-2'>
                                                <input
                                                    type='checkbox'
                                                    aria-label={`Select ${row.name}`}
                                                    checked={selectedIds.has(row.id)}
                                                    onChange={() => toggleOne(row.id)}
                                                    disabled={running}
                                                />
                                            </td>
                                            <td className='px-3 py-2 text-[#1E1E1E] font-medium'>{row.name}</td>
                                            <td className='px-3 py-2 text-[#667085]'>{row.admissionNumber || '—'}</td>
                                            <td className='px-3 py-2 text-[#667085]'>{studentLabel(row)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className='mt-4 text-sm text-[#667085]'>
                        {selectedRows.length} selected
                        {tooMany && (
                            <span className='text-[#B42318]'> — select at most {MAX_BATCH} at a time.</span>
                        )}
                        {targetSection?.capacity != null && selectedRows.length > targetSection.capacity && (
                            <span className='text-[#B42318]'> — more than section {targetSection.name}&apos;s capacity ({targetSection.capacity}); the rest will stop when it is full.</span>
                        )}
                    </div>
                </>
            )}

            {running && (
                <p className='mt-4 text-sm text-[#515DEF]' role='status'>
                    Promoting {progress.done} of {progress.total}… please keep this page open.
                </p>
            )}

            {!confirming ? (
                <button
                    type='button'
                    disabled={!canPromote}
                    onClick={() => setConfirming(true)}
                    className='mt-6 px-6 py-2 rounded-md bg-[#515DEF] text-white disabled:opacity-50'
                >
                    {running ? 'Promoting…' : `Promote ${selectedRows.length || ''} student${selectedRows.length === 1 ? '' : 's'}`}
                </button>
            ) : (
                <div className='mt-6 flex flex-wrap items-center gap-3 rounded-xl bg-[#F5F6FF] p-4'>
                    <p className='text-sm text-[#0C1E5B]'>
                        Promote {selectedRows.length} student{selectedRows.length === 1 ? '' : 's'} from {classFilter} to{' '}
                        {promoteOpts?.className}-{targetSection?.name}? This cannot be undone from this screen.
                    </p>
                    <button type='button' onClick={runPromotion} className='px-4 py-2 rounded-md bg-[#515DEF] text-white text-sm'>
                        Confirm promotion
                    </button>
                    <button type='button' onClick={() => setConfirming(false)} className='px-4 py-2 rounded-md border border-[#D9D9D9] text-sm'>
                        Cancel
                    </button>
                </div>
            )}

            {results.length > 0 && (
                <div className='mt-6'>
                    <h3 className='text-base font-semibold text-[#0C1E5B]'>Last promotion results</h3>
                    <ul className='mt-2 text-sm space-y-1'>
                        {results.map((item) => (
                            <li key={item.id} className={item.ok ? 'text-[#027A48]' : 'text-[#B42318]'}>
                                {item.ok ? '✓' : '✗'} {item.name}: {item.detail}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    )
}

export default PromoteStudents
