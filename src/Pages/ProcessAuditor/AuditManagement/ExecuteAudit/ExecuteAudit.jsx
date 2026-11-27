import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { updateAuditStatus } from '../MyAudits/myAuditsData'
import { getObservations, upsertObservation, hydrateFromApi as hydrateObservationsFromApi } from '../../Observations/observationsData'
import { toast } from 'react-toastify'
import { getAtrRecords, hydrateFromApi as hydrateAtrFromApi, upsertCapaRecord } from '../../CorrectiveActions/ActionTakenReports/atrData'
import { appendAuditHistory } from '../AuditHistory/auditHistoryData'
import AuditWorkspaceHeader from './Components/AuditWorkspaceHeader'
import DepartmentInfoCard from './Components/DepartmentInfoCard'
import ChecklistSection from './Components/ChecklistSection'
import SectionNav from './Components/SectionNav'
import AuditProgressBar from './Components/AuditProgressBar'
import FindingsPanel from './Components/FindingsPanel'
import StickyAuditFooter from './Components/StickyAuditFooter'
import SubmitValidationModal from './Components/SubmitValidationModal'
import StructuredRecommendations from './Components/StructuredRecommendations'
import SopPopup from './Components/SopPopup'
import {
    loadExecuteAuditDraft,
    saveExecuteAuditDraft,
    persistExecuteAuditDraft,
    hydrateFromApi,
    computeScores,
    computeFindings,
    computeProgress,
    getUnansweredQuestions,
    buildSectionStats,
    emptyObservation,
    isNonCompliant,
    markTimelineStage,
    generateObservationNumber,
    formatAssignedDate,
    mapResponseToFindingRating,
} from './executeAuditData'

const AUTO_SAVE_INTERVAL_MS = 30000
const DEBOUNCE_SAVE_MS = 800

const serializeEvidence = (evidence) => {
    if (!evidence) return ''
    if (typeof evidence === 'string') return evidence
    const refs = ['photo', 'file', 'video']
        .map((key) => evidence[key])
        .filter(Boolean)
        .map((slot) => (typeof slot === 'object' ? slot.fileId || slot.name : slot))
        .filter(Boolean)
    if (evidence.url) refs.push(typeof evidence.url === 'string' ? evidence.url : evidence.url.url)
    return refs.join(', ')
}

const ExecuteAudit = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const auditId = searchParams.get('auditId')
    const [draft, setDraft] = useState(() => loadExecuteAuditDraft(auditId))
    const [hydrated, setHydrated] = useState(false)
    const [saveError, setSaveError] = useState('')
    const [sopCode, setSopCode] = useState(null)
    const [submitModal, setSubmitModal] = useState(false)
    const [activeSectionId, setActiveSectionId] = useState(() => loadExecuteAuditDraft(auditId).sections?.[0]?.id ?? null)
    const checklistRef = useRef(null)
    const draftRef = useRef(draft)
    const debounceRef = useRef(null)

    const activeSection = useMemo(
        () => draft.sections.find((s) => s.id === activeSectionId) ?? draft.sections[0] ?? null,
        [draft.sections, activeSectionId],
    )

    useEffect(() => {
        draftRef.current = draft
    }, [draft])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            await Promise.all([hydrateFromApi(), hydrateAtrFromApi(), hydrateObservationsFromApi()])
            if (cancelled) return
            const loaded = loadExecuteAuditDraft(auditId)
            setDraft(loaded)
            setActiveSectionId(loaded.sections?.[0]?.id ?? null)
            setHydrated(true)
        })()
        return () => {
            cancelled = true
        }
    }, [auditId])

    const scores = useMemo(
        () => computeScores(draft.sections, draft.responses),
        [draft.sections, draft.responses],
    )

    const progress = useMemo(
        () => computeProgress(draft.sections, draft.responses),
        [draft.sections, draft.responses],
    )

    const findings = useMemo(
        () => computeFindings(draft.sections, draft.responses, draft.observations),
        [draft.sections, draft.responses, draft.observations],
    )

    const sectionStats = useMemo(
        () => buildSectionStats(draft.sections, draft.responses, draft.observations),
        [draft.sections, draft.responses, draft.observations],
    )

    const persist = useCallback(async (nextDraft, { awaitApi = false } = {}) => {
        const saved = saveExecuteAuditDraft(nextDraft)
        setDraft(saved)
        draftRef.current = saved
        if (awaitApi) {
            const result = await persistExecuteAuditDraft(saved)
            if (result.success === false) {
                setSaveError(result.message || 'Audit draft save failed')
            } else {
                setSaveError('')
                // Edits typed while the save was in flight are newer than the saved copy; keep them.
                if (draftRef.current === saved) {
                    setDraft(result.draft)
                    draftRef.current = result.draft
                }
            }
            return result.draft || saved
        }
        setSaveError('')
        return saved
    }, [])

    const schedulePersist = useCallback((nextDraft) => {
        setDraft(nextDraft)
        draftRef.current = nextDraft
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            void persist(draftRef.current)
        }, DEBOUNCE_SAVE_MS)
    }, [persist])

    useEffect(() => {
        const interval = setInterval(() => {
            const current = draftRef.current
            if (current.header.status === 'Submitted' || current.header.status === 'Closed') return
            void persist({
                ...current,
                header: {
                    ...current.header,
                    status: current.header.status === 'Assigned' ? 'In Progress' : current.header.status,
                },
            })
        }, AUTO_SAVE_INTERVAL_MS)

        return () => {
            clearInterval(interval)
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [persist])

    const handleHeaderChange = (header) => {
        schedulePersist({
            ...draftRef.current,
            header: {
                ...header,
                status: ['Assigned', 'Draft'].includes(header.status) ? 'In Progress' : header.status,
            },
        })
    }

    const handleParameterChange = (parameterId, value, parameter, sectionTitle) => {
        setDraft((prev) => {
            let observations = prev.observations
            const findingRating = value.findingRating || mapResponseToFindingRating(value.response)
            const nextValue = { ...value, findingRating: findingRating || value.findingRating || '' }

            if (parameter && isNonCompliant(parameter.responseType, nextValue.response)) {
                if (!observations.some((obs) => obs.parameterId === parameterId)) {
                    observations = [
                        ...observations,
                        {
                            ...emptyObservation(parameter, sectionTitle, prev.header.auditNumber),
                            findingRating: findingRating || 'Minor Non-Conformity',
                        },
                    ]
                }
            }

            const next = {
                ...prev,
                header: {
                    ...prev.header,
                    status: ['Assigned', 'Draft'].includes(prev.header.status) ? 'In Progress' : prev.header.status,
                },
                responses: { ...prev.responses, [parameterId]: nextValue },
                observations,
            }
            draftRef.current = next
            if (debounceRef.current) clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(() => {
                void persist(draftRef.current)
            }, DEBOUNCE_SAVE_MS)
            return next
        })
    }

    const handleObservationChange = (parameterId, observation) => {
        setDraft((prev) => {
            const next = {
                ...prev,
                observations: prev.observations.map((obs) =>
                    obs.parameterId === parameterId ? observation : obs,
                ),
            }
            draftRef.current = next
            return next
        })
    }

    const nextObservationNumber = () =>
        generateObservationNumber([
            ...getObservations().flatMap((item) => [item.observationId, item.id]),
            ...getAtrRecords().map((item) => item.observationId),
            ...draftRef.current.observations.map((item) => item.observationNumber),
        ])

    const syncObservationCollection = (obs, { submitted = false } = {}) => {
        const header = draftRef.current.header
        const location = [header.building, header.area].filter(Boolean).join(' — ') || header.campus
        const record = upsertObservation({
            id: obs.collectionId || obs.observationNumber,
            observationId: obs.observationNumber || obs.collectionId,
            auditReference: obs.auditReference || header.auditNumber,
            department: header.department,
            location,
            category: obs.sectionTitle || 'Process Compliance',
            title: obs.title,
            description: obs.description,
            priority: obs.priority,
            severity: obs.riskLevel || obs.priority,
            findingRating: obs.findingRating,
            riskLevel: obs.riskLevel,
            responsibleDepartment: header.department,
            responsiblePerson: obs.assignTo,
            assignTo: obs.assignTo,
            reportTo: obs.reportTo,
            evidence: serializeEvidence(obs.evidence),
            evidenceRefs: obs.evidence,
            dueDate: obs.dueDate,
            status: submitted ? 'Assigned' : 'Open',
            auditStream: 'PROCESS',
        })
        if (record.saveBlocked) {
            toast.error(`Observation ${record.observationId || ''} was not added to the register: ${record.message} Refresh and save again.`)
        }

        let capa = null
        if (submitted && obs.assignTo && obs.dueDate) {
            capa = upsertCapaRecord({
                observationId: record.observationId,
                auditNumber: header.auditNumber,
                department: header.department,
                assignedTo: obs.assignTo,
                reportTo: obs.reportTo,
                dueDate: obs.dueDate,
                findingRating: obs.findingRating,
                riskLevel: obs.riskLevel,
                title: obs.title,
                evidence: obs.evidence,
            })
            if (capa?.saveBlocked) {
                toast.error(`CAPA for ${record.observationId} was not saved: ${capa.message} Refresh and submit again.`)
                capa = null
            }
        }

        return { record, capa }
    }

    const handleSaveObservation = async (parameterId) => {
        const current = draftRef.current
        const updatedObservations = current.observations.map((obs) => {
            if (obs.parameterId !== parameterId) return obs
            const withMeta = {
                ...obs,
                saved: true,
                status: 'Pending Assignment',
                observationNumber: obs.observationNumber || nextObservationNumber(),
                auditReference: obs.auditReference || current.header.auditNumber,
            }
            const { record } = syncObservationCollection(withMeta, { submitted: false })
            return {
                ...withMeta,
                collectionId: record.observationId,
                observationNumber: record.observationId,
            }
        })
        await persist({ ...current, observations: updatedObservations }, { awaitApi: true })
    }

    const handleSubmitObservation = async (parameterId) => {
        const target = draftRef.current.observations.find((obs) => obs.parameterId === parameterId)
        if (!target?.title?.trim() || !target?.assignTo || !target?.dueDate) return

        const current = draftRef.current
        const updatedObservations = current.observations.map((obs) => {
            if (obs.parameterId !== parameterId) return obs
            const withMeta = {
                ...obs,
                saved: true,
                submitted: true,
                status: 'Assigned',
                assignedDate: formatAssignedDate(),
                observationNumber: obs.observationNumber || nextObservationNumber(),
                auditReference: obs.auditReference || current.header.auditNumber,
            }
            const { record, capa } = syncObservationCollection(withMeta, { submitted: true })
            return {
                ...withMeta,
                collectionId: record.observationId,
                observationNumber: record.observationId,
                capaId: capa?.atrNumber || '',
            }
        })
        await persist({ ...current, observations: updatedObservations }, { awaitApi: true })
    }

    const handleSaveDraft = async () => {
        const next = {
            ...draft,
            header: { ...draft.header, status: 'Draft' },
            timeline: markTimelineStage(draft.timeline, 'Saved Draft'),
        }
        await persist(next, { awaitApi: true })
    }

    const finalizeSubmit = async () => {
        const current = draftRef.current
        // Persist any unsaved observations before locking the draft
        current.observations.forEach((obs) => {
            if (!obs.title?.trim()) return
            if (!obs.observationNumber) {
                obs.observationNumber = nextObservationNumber()
            }
            const { record, capa } = syncObservationCollection(
                {
                    ...obs,
                    saved: true,
                    submitted: Boolean(obs.assignTo && obs.dueDate),
                    status: obs.assignTo && obs.dueDate ? 'Assigned' : 'Open',
                },
                { submitted: Boolean(obs.assignTo && obs.dueDate) },
            )
            obs.collectionId = record.observationId
            obs.observationNumber = record.observationId
            if (capa) obs.capaId = capa.atrNumber
        })

        const next = {
            ...current,
            header: { ...current.header, status: 'Submitted' },
            timeline: markTimelineStage(
                markTimelineStage(current.timeline, 'Submitted'),
                'Verified',
            ),
            observations: [...current.observations],
        }

        const saved = await persist(next, { awaitApi: true })
        appendAuditHistory({
            auditNumber: saved.header.auditNumber,
            auditName: saved.header.auditName,
            department: saved.header.department,
            campus: saved.header.campus,
            building: saved.header.building,
            area: saved.header.area,
            status: 'Completed',
            auditDate: saved.header.auditDate,
            compliancePercent: scores.overallCompliance,
            observations: saved.observations.length,
            result: scores.overallCompliance >= 80 ? 'Pass' : scores.overallCompliance >= 60 ? 'Partial' : 'Fail',
            findings,
            evidenceSummary: saved.observations.map((obs) => serializeEvidence(obs.evidence)).filter(Boolean),
            generalRemarks: saved.generalRemarks,
        })

        if (saved.header.auditId) {
            updateAuditStatus(saved.header.auditId, 'Completed')
        }
        navigate('/process-auditor/audit-management/my-audits')
    }

    const handleSubmit = () => {
        const unanswered = getUnansweredQuestions(draft.sections, draft.responses)
        if (unanswered.length > 0) {
            setSubmitModal(true)
            return
        }
        void finalizeSubmit()
    }

    const handleReviewUnanswered = () => {
        setSubmitModal(false)
        const unanswered = getUnansweredQuestions(draft.sections, draft.responses)
        if (unanswered.length === 0) return

        const first = unanswered[0]
        setActiveSectionId(first.sectionId)
        setTimeout(() => {
            checklistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    const navigateToSection = (sectionId) => {
        setActiveSectionId(sectionId)
        checklistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <section className='space-y-5 pb-32'>
            {!hydrated ? (
                <p className='text-sm text-[#667085]'>Loading audit draft…</p>
            ) : null}
            {saveError ? (
                <p className='text-sm text-[#FF0000] bg-[#FF000010] border border-[#FF000033] rounded-lg px-3 py-2'>
                    {saveError}
                </p>
            ) : null}

            <AuditWorkspaceHeader
                header={draft.header}
                timeline={draft.timeline}
                lastSavedAt={draft.lastSavedAt}
                onHeaderChange={handleHeaderChange}
            />

            <AuditProgressBar progress={progress} scores={scores} />

            <DepartmentInfoCard header={draft.header} />

            <div className='flex flex-col gap-4'>
                <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-semibold text-black'>Checklist</h3>
                    <span className='text-xs text-[#667085]'>Responses only · Structure is read-only</span>
                </div>

                <SectionNav
                    sections={draft.sections}
                    activeSectionId={activeSectionId}
                    sectionStats={sectionStats}
                    onNavigate={navigateToSection}
                />

                <div ref={checklistRef} className='scroll-mt-24'>
                    {activeSection && (
                        <ChecklistSection
                            key={activeSection.id}
                            tabMode
                            section={activeSection}
                            expanded
                            responses={draft.responses}
                            observations={draft.observations}
                            auditReference={draft.header.auditNumber}
                            onParameterChange={(id, next, param, title) => handleParameterChange(id, next, param, title)}
                            onObservationChange={handleObservationChange}
                            onSaveObservation={handleSaveObservation}
                            onSubmitObservation={handleSubmitObservation}
                            onOpenSop={setSopCode}
                        />
                    )}
                </div>
            </div>

            <FindingsPanel findings={findings} />

            <StructuredRecommendations
                generalRemarks={draft.generalRemarks}
                onRemarksChange={(value) =>
                    schedulePersist({ ...draftRef.current, generalRemarks: value })
                }
            />

            <StickyAuditFooter
                scores={scores}
                progress={progress}
                findings={findings}
                lastSavedAt={draft.lastSavedAt}
                onSaveDraft={handleSaveDraft}
                onSubmit={handleSubmit}
            />

            <SubmitValidationModal
                open={submitModal}
                unansweredCount={progress.unanswered}
                onContinue={() => {
                    setSubmitModal(false)
                    void finalizeSubmit()
                }}
                onReview={handleReviewUnanswered}
                onClose={() => setSubmitModal(false)}
            />

            <SopPopup sopCode={sopCode} onClose={() => setSopCode(null)} />
        </section>
    )
}

export default ExecuteAudit
