import { useMemo, useState } from 'react'
import { ClipboardCheck, Save, Send } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Dialog,
    FileDropzone,
    FormField,
    IntegrationNotice,
    PageHeader,
    Surface,
    UnavailableWorkflowPage,
} from '../ui'
import { addAnnouncement, canCreateAnnouncements, CATEGORY_OPTIONS } from './announcementData'
import { getAnnouncementRoutes } from './announcementConfigs'
import {
    ANNOUNCEMENT_AUDIENCE_GROUPS,
    createEmptyAnnouncementDraft,
    getAnnouncementReadiness,
    resolveAnnouncementAudience,
    validateAnnouncementDraft,
} from './announcementComposerState.js'

const controlClass = 'min-h-11 w-full rounded-lg border border-[var(--erp-line)] bg-white px-3 py-2.5 text-sm text-[var(--erp-ink)] outline-none transition focus:border-[var(--erp-primary)] focus:ring-2 focus:ring-[color:var(--erp-primary-soft)]'

const today = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const loadDraft = (storageKey, emptyDraft) => {
    try {
        const stored = window.localStorage.getItem(storageKey)
        if (!stored) return { draft: emptyDraft, message: '' }
        return { draft: { ...emptyDraft, ...JSON.parse(stored) }, message: 'A browser announcement draft was restored.' }
    } catch {
        return { draft: emptyDraft, message: 'The previous announcement draft could not be restored.' }
    }
}

const ReviewField = ({ label, value }) => (
    <div className='rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3'>
        <dt className='text-xs font-medium text-[var(--erp-muted)]'>{label}</dt>
        <dd className='mt-1 break-words text-sm font-semibold text-[var(--erp-ink)]'>{value === false ? 'No' : value || 'Not provided'}</dd>
    </div>
)

export default function AddAnnouncementForm({ roleKey }) {
    const navigate = useNavigate()
    const routes = getAnnouncementRoutes(roleKey)
    const sentBy = routes.sentByDefault || ''
    const storageKey = `schoolerp:announcement-draft:${roleKey}`
    const emptyDraft = useMemo(() => createEmptyAnnouncementDraft({ sentBy, announcementDate: today() }), [sentBy])
    const [initialState] = useState(() => loadDraft(storageKey, emptyDraft))
    const [draft, setDraft] = useState(initialState.draft)
    const [errors, setErrors] = useState({})
    const [message, setMessage] = useState(initialState.message)
    const [reviewOpen, setReviewOpen] = useState(false)

    if (!canCreateAnnouncements(roleKey)) {
        return <UnavailableWorkflowPage title='Announcement publishing is restricted' description='Your role can read announcements but cannot publish to the school audience.' alternateHref={routes.list} alternateLabel='Open announcements' />
    }

    const readiness = getAnnouncementReadiness(draft)
    const audienceGroup = ANNOUNCEMENT_AUDIENCE_GROUPS.find((group) => group.id === draft.audienceGroup)

    const updateField = (field, value) => {
        setDraft((current) => ({ ...current, [field]: value }))
        setErrors((current) => {
            if (!current[field]) return current
            const next = { ...current }
            delete next[field]
            return next
        })
        setMessage('')
    }

    const saveDraft = () => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(draft))
            setMessage('Draft saved in this browser. Nothing has been published or delivered.')
        } catch {
            setMessage('This browser could not save the draft. Copy important information before leaving.')
        }
    }

    const reviewAnnouncement = (event) => {
        event.preventDefault()
        const nextErrors = validateAnnouncementDraft(draft)
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length) {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
            })
            return
        }
        setReviewOpen(true)
    }

    const publishLocalDemo = () => {
        addAnnouncement({
            ...draft,
            audience: resolveAnnouncementAudience(draft.audienceGroup),
            audienceLabel: audienceGroup?.label || '',
        }, roleKey)
        try {
            window.localStorage.removeItem(storageKey)
        } catch {
            /* Browser draft cleanup is best effort. */
        }
        navigate(routes.list)
    }

    return (
        <section className='space-y-5'>
            <PageHeader title='Compose announcement' description='Define the intended audience, publication context and acknowledgement policy before review.' status={readiness} actions={<Link to={routes.list} className='inline-flex min-h-10 items-center rounded-lg border border-[var(--erp-line)] bg-white px-3 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'>Back to announcements</Link>} />
            <IntegrationNotice state='demo' title='Browser publication only' description='Saving the reviewed notice adds it to this browser’s demonstration register. Files, recipient delivery, push/email/SMS notifications, read receipts and audit evidence require the communication backend.' />
            {message && <p role='status' className='rounded-lg border border-[var(--erp-line)] bg-white px-4 py-3 text-sm text-[var(--erp-slate)]'>{message}</p>}

            <form className='space-y-5' onSubmit={reviewAnnouncement} noValidate>
                <Surface className='space-y-5 p-4 sm:p-6'>
                    <div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>Notice content</h2><p className='mt-1 text-sm text-[var(--erp-muted)]'>Write a concise title and enough context for recipients to act.</p></div>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                        <FormField label='Announcement title' error={errors.title} required className='md:col-span-2'><input className={controlClass} value={draft.title} onChange={(event) => updateField('title', event.target.value)} placeholder='e.g. Water interruption in Block B' /></FormField>
                        <FormField label='Category' error={errors.category} required><select className={controlClass} value={draft.category} onChange={(event) => updateField('category', event.target.value)}><option value=''>Select category</option>{CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}</select></FormField>
                        <FormField label='Message' error={errors.message} hint='Include timing, location, impact and the action recipients should take.' required className='md:col-span-2 xl:col-span-3'><textarea rows='5' className={`${controlClass} min-h-32 resize-y`} value={draft.message} onChange={(event) => updateField('message', event.target.value)} placeholder='Explain what is changing and what recipients should do.' /></FormField>
                    </div>
                </Surface>

                <Surface className='space-y-5 p-4 sm:p-6'>
                    <div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>Publication controls</h2><p className='mt-1 text-sm text-[var(--erp-muted)]'>Make the audience explicit; no hidden global broadcast is assumed.</p></div>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                        <FormField label='Publication date' error={errors.announcementDate} required><input type='date' className={controlClass} value={draft.announcementDate} onChange={(event) => updateField('announcementDate', event.target.value)} /></FormField>
                        <FormField label='Priority'><select className={controlClass} value={draft.priority} onChange={(event) => updateField('priority', event.target.value)}><option value='Normal'>Normal</option><option value='Important'>Important</option><option value='Urgent'>Urgent</option></select></FormField>
                        <ReviewField label='Publisher identity' value={sentBy} />
                    </div>
                    <fieldset aria-describedby={errors.audienceGroup ? 'announcement-audience-error' : undefined} className='space-y-3'>
                        <legend className='text-sm font-medium text-[var(--erp-ink)]'>Intended audience <span className='text-[var(--erp-red)]' aria-hidden='true'>*</span></legend>
                        <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
                            {ANNOUNCEMENT_AUDIENCE_GROUPS.map((group) => <label key={group.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${draft.audienceGroup === group.id ? 'border-[var(--erp-primary)] bg-[var(--erp-primary-soft)]' : 'border-[var(--erp-line)] bg-white'}`}><input type='radio' name='announcement-audience' value={group.id} checked={draft.audienceGroup === group.id} onChange={() => updateField('audienceGroup', group.id)} className='mt-1 accent-[var(--erp-primary)]' /><span><span className='block text-sm font-semibold text-[var(--erp-ink)]'>{group.label}</span><span className='mt-1 block text-sm text-[var(--erp-slate)]'>{group.description}</span></span></label>)}
                        </div>
                        {errors.audienceGroup && <p id='announcement-audience-error' role='alert' className='text-xs font-medium text-[var(--erp-red)]'>{errors.audienceGroup}</p>}
                    </fieldset>
                    <label className='flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-4'><input type='checkbox' checked={draft.requireAcknowledgement} onChange={(event) => updateField('requireAcknowledgement', event.target.checked)} className='mt-1 accent-[var(--erp-primary)]' /><span><span className='block text-sm font-semibold text-[var(--erp-ink)]'>Request acknowledgement</span><span className='mt-1 block text-sm text-[var(--erp-slate)]'>The frontend will show an acknowledgement control. Authoritative receipts still require the backend.</span></span></label>
                </Surface>

                <Surface className='space-y-4 p-4 sm:p-6'>
                    <div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>Attachment metadata</h2><p className='mt-1 text-sm text-[var(--erp-muted)]'>Only the filename is retained for this demonstration; the file is not uploaded.</p></div>
                    <FileDropzone value={draft.attachmentName} onChange={(value) => updateField('attachmentName', value)} valueMode='name' label='Attach notice evidence' acceptDocuments />
                </Surface>

                <div className='sticky bottom-3 z-10 flex flex-col-reverse gap-2 rounded-xl border border-[var(--erp-line)] bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end'>
                    <Link to={routes.list} className='inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--erp-line)] px-4 text-sm font-semibold text-[var(--erp-slate)] hover:bg-[var(--erp-canvas)]'>Cancel</Link>
                    <button type='button' onClick={saveDraft} className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--erp-primary)] px-4 text-sm font-semibold text-[var(--erp-primary)] hover:bg-[var(--erp-primary-soft)]'><Save aria-hidden='true' size={17} /> Save browser draft</button>
                    <button type='submit' className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white hover:opacity-90'><ClipboardCheck aria-hidden='true' size={17} /> Review announcement</button>
                </div>
            </form>

            <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} title='Review announcement' description='Confirm content, audience and acknowledgement policy before adding this notice to the browser demo register.' size='lg' footer={<><button type='button' onClick={() => setReviewOpen(false)} className='min-h-10 rounded-lg border border-[var(--erp-line)] px-4 text-sm font-semibold text-[var(--erp-slate)]'>Return to form</button><button type='button' onClick={publishLocalDemo} className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white'><Send aria-hidden='true' size={16} /> Add to browser demo</button></>}>
                <IntegrationNotice state='demo' title='No recipient delivery' description='This action updates only the browser demonstration register. It does not send the notice or create authoritative delivery receipts.' />
                <dl className='mt-4 grid gap-3 sm:grid-cols-2'><ReviewField label='Title' value={draft.title} /><ReviewField label='Category' value={draft.category} /><ReviewField label='Audience' value={`${audienceGroup?.label} · ${resolveAnnouncementAudience(draft.audienceGroup).length} role portals`} /><ReviewField label='Priority' value={draft.priority} /><ReviewField label='Publication date' value={draft.announcementDate} /><ReviewField label='Acknowledgement requested' value={draft.requireAcknowledgement ? 'Yes' : 'No'} /><ReviewField label='Message' value={draft.message} /><ReviewField label='Attachment' value={draft.attachmentName || 'No attachment'} /></dl>
            </Dialog>
        </section>
    )
}
