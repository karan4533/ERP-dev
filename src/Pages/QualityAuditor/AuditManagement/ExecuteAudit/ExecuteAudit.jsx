import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { updateAuditStatus } from '../MyAudits/myAuditsData'
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
import AuditExecutionContract from '../../../../Common/AuditGovernance/AuditExecutionContract'
import { getAuditSubmissionGaps } from '../../../../Common/AuditGovernance/auditGovernanceState.js'
import {
    loadExecuteAuditDraft,
    saveExecuteAuditDraft,
    computeScores,
    computeFindings,
    computeProgress,
    buildSectionStats,
    emptyObservation,
    isNonCompliant,
    parseRating,
    markTimelineStage,
    generateObservationNumber,
    formatAssignedDate,
} from './executeAuditData'

const AUTO_SAVE_INTERVAL_MS = 30000

const ExecuteAudit = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const auditId = searchParams.get('auditId')
    const [draft, setDraft] = useState(() => loadExecuteAuditDraft(auditId))
    const [sopCode, setSopCode] = useState(null)
    const [submitModal, setSubmitModal] = useState(false)
    const [activeSectionId, setActiveSectionId] = useState(() => loadExecuteAuditDraft(auditId).sections?.[0]?.id ?? null)
    const checklistRef = useRef(null)
    const draftRef = useRef(draft)

    const activeSection = useMemo(
        () => draft.sections.find((s) => s.id === activeSectionId) ?? draft.sections[0] ?? null,
        [draft.sections, activeSectionId],
    )

    useEffect(() => {
        draftRef.current = draft
    }, [draft])

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

    const submissionGaps = useMemo(
        () => getAuditSubmissionGaps(draft),
        [draft],
    )

    const persist = useCallback((nextDraft) => {
        const saved = saveExecuteAuditDraft(nextDraft)
        setDraft(saved)
        return saved
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            const current = draftRef.current
            if (current.header.status === 'Submitted' || current.header.status === 'Closed') return
            persist({
                ...current,
                header: {
                    ...current.header,
                    status: current.header.status === 'Assigned' ? 'In Progress' : current.header.status,
                },
            })
        }, AUTO_SAVE_INTERVAL_MS)

        return () => clearInterval(interval)
    }, [persist])

    const handleParameterChange = (parameterId, value, parameter, sectionTitle) => {
        setDraft((prev) => {
            let observations = prev.observations
            if (parameter && isNonCompliant(null, value.response)) {
                if (!observations.some((obs) => obs.parameterId === parameterId)) {
                    const rating = parseRating(value.response)
                    observations = [
                        ...observations,
                        {
                            ...emptyObservation(parameter, sectionTitle, prev.header.auditNumber),
                            priority: rating === 1 ? 'Critical' : 'High',
                        },
                    ]
                }
            }

            return {
                ...prev,
                header: {
                    ...prev.header,
                    status: ['Assigned', 'Draft'].includes(prev.header.status) ? 'In Progress' : prev.header.status,
                },
                responses: { ...prev.responses, [parameterId]: value },
                observations,
            }
        })
    }

    const handleObservationChange = (parameterId, observation) => {
        setDraft((prev) => ({
            ...prev,
            observations: prev.observations.map((obs) =>
                obs.parameterId === parameterId ? observation : obs,
            ),
        }))
    }

    const handleSaveObservation = (parameterId) => {
        persist({
            ...draftRef.current,
            observations: draftRef.current.observations.map((obs) => {
                if (obs.parameterId !== parameterId) return obs
                return {
                    ...obs,
                    saved: true,
                    status: 'Pending Assignment',
                    observationNumber: obs.observationNumber || generateObservationNumber(),
                    auditReference: obs.auditReference || draftRef.current.header.auditNumber,
                }
            }),
        })
    }

    const handleSubmitObservation = (parameterId) => {
        const target = draftRef.current.observations.find((obs) => obs.parameterId === parameterId)
        if (!target?.title?.trim() || !target?.description?.trim() || !target?.assignTo || !target?.dueDate) return

        persist({
            ...draftRef.current,
            observations: draftRef.current.observations.map((obs) => {
                if (obs.parameterId !== parameterId) return obs
                return {
                    ...obs,
                    saved: true,
                    submitted: true,
                    status: 'Assigned',
                    assignedDate: formatAssignedDate(),
                    observationNumber: obs.observationNumber || generateObservationNumber(),
                    auditReference: obs.auditReference || draftRef.current.header.auditNumber,
                }
            }),
        })
    }

    const handleSaveDraft = () => {
        const next = {
            ...draft,
            header: { ...draft.header, status: 'Draft' },
            timeline: markTimelineStage(draft.timeline, 'Saved Draft'),
        }
        persist(next)
    }

    const finalizeSubmit = () => {
        const next = {
            ...draft,
            header: { ...draft.header, status: 'Submitted' },
            timeline: markTimelineStage(draft.timeline, 'Submitted'),
        }
        persist(next)
        if (draft.header.auditId) {
            updateAuditStatus(draft.header.auditId, 'Submitted')
        }
        navigate('/quality-auditor/audit-management/my-audits')
    }

    const handleSubmit = () => {
        if (submissionGaps.length > 0) {
            setSubmitModal(true)
            return
        }
        finalizeSubmit()
    }

    const handleReviewBlockers = () => {
        setSubmitModal(false)
        const first = submissionGaps.find((item) => item.sectionId)
        if (!first) return

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
            <AuditWorkspaceHeader
                header={draft.header}
                timeline={draft.timeline}
                lastSavedAt={draft.lastSavedAt}
            />

            <AuditExecutionContract header={draft.header} sections={draft.sections} responses={draft.responses} observations={draft.observations} auditMode='quality' />

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
                onRemarksChange={(value) => setDraft((prev) => ({ ...prev, generalRemarks: value }))}
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
                gaps={submissionGaps}
                onReview={handleReviewBlockers}
                onClose={() => setSubmitModal(false)}
            />

            <SopPopup sopCode={sopCode} onClose={() => setSopCode(null)} />
        </section>
    )
}

export default ExecuteAudit
