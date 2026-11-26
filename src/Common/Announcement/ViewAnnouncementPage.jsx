import { useState } from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import FeedbackState from '../ui/FeedbackState'
import FormField from '../ui/FormField'
import IntegrationNotice from '../ui/IntegrationNotice'
import PageHeader from '../ui/PageHeader'
import StatusBadge from '../ui/StatusBadge'
import Surface from '../ui/Surface'
import WorkflowContextBar from '../ui/WorkflowContextBar'
import WorkflowTimeline from '../ui/WorkflowTimeline'
import { parseWorkflowDate } from '../ui/workflow'
import { ensureSeed, saveJson } from '../demoDomain/storage'
import { getAnnouncementById } from './announcementData'
import { getAnnouncementRoutes } from './announcementConfigs'

const Field = ({ label, value }) => (
    <div>
        <dt className='text-xs font-medium text-[var(--erp-muted)]'>{label}</dt>
        <dd className='mt-1 whitespace-pre-wrap break-words text-sm font-medium text-[var(--erp-ink)]'>{value || '—'}</dd>
    </div>
)

export default function ViewAnnouncementPage({ roleKey }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const routes = getAnnouncementRoutes(roleKey)
    const announcement = getAnnouncementById(id, roleKey)
    const storageKey = 'schoolerp-announcement-responses-v1'
    const [responses, setResponses] = useState(() => ensureSeed(storageKey, {}))
    const [reply, setReply] = useState('')
    const thread = responses[id] || { acknowledged: false, replies: [] }
    const acknowledgementRequired = announcement?.requireAcknowledgement !== false

    const acknowledge = () => {
        const next = { ...responses, [id]: { ...thread, acknowledged: true, acknowledgedAt: new Date().toISOString() } }
        setResponses(next)
        saveJson(storageKey, next)
        toast.success('Announcement acknowledged in this browser.')
    }

    const sendReply = () => {
        if (!reply.trim()) return
        const nextThread = { ...thread, replies: [...thread.replies, { text: reply.trim(), at: new Date().toISOString(), by: roleKey }] }
        const next = { ...responses, [id]: nextThread }
        setResponses(next)
        saveJson(storageKey, next)
        setReply('')
        toast.success('Reply saved in this browser.')
    }

    if (!announcement) {
        return (
            <section className='space-y-5'>
                <button type='button' onClick={() => navigate(routes.list)} className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm font-semibold text-[var(--erp-ink)]'>
                    <ArrowLeft aria-hidden='true' size={17} /> Back to announcements
                </button>
                <FeedbackState kind='permission' title='Announcement unavailable' description='This announcement does not exist or is not addressed to your role.' />
            </section>
        )
    }

    const publishedAt = parseWorkflowDate(announcement.createdAt || announcement.announcementDate)?.toISOString() || null
    const timelineEvents = [
        {
            id: 'published',
            label: 'Announcement published',
            actor: announcement.sentBy,
            timestamp: publishedAt,
            description: announcement.category,
            tone: 'info',
            current: acknowledgementRequired && !thread.acknowledged && thread.replies.length === 0,
        },
        ...(acknowledgementRequired && thread.acknowledged ? [{
            id: 'acknowledged',
            label: 'Acknowledged',
            actor: roleKey,
            timestamp: thread.acknowledgedAt || null,
            description: '',
            tone: 'success',
            current: thread.replies.length === 0,
        }] : []),
        ...thread.replies.map((item, index) => ({
            id: `reply-${index}`,
            label: 'Reply saved',
            actor: item.by,
            timestamp: item.at,
            description: item.text,
            tone: 'info',
            current: index === thread.replies.length - 1,
        })),
    ]

    return (
        <section className='space-y-5'>
            <PageHeader
                title={announcement.title}
                description={`${announcement.id} · ${announcement.category}`}
                status='published'
                context={`Published by ${announcement.sentBy}`}
                meta={!acknowledgementRequired ? <StatusBadge status='neutral' label='Acknowledgement not required' /> : thread.acknowledged ? <StatusBadge status='complete' label='Acknowledged locally' /> : <StatusBadge status='pending' label='Acknowledgement pending' />}
                actions={(
                    <button type='button' onClick={() => navigate(routes.list)} className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm font-semibold text-[var(--erp-ink)]'>
                        <ArrowLeft aria-hidden='true' size={17} /> Back to announcements
                    </button>
                )}
            />

            <IntegrationNotice
                state='demo'
                title='Acknowledgements and replies are local'
                description='This screen does not deliver acknowledgements or replies to the sender. Production messaging and receipt tracking require the backend communication service.'
            />

            <WorkflowContextBar
                owner={announcement.sentBy}
                due={announcement.announcementDate}
                nextAction={!acknowledgementRequired ? 'Read or add a local reply' : thread.acknowledged ? 'Review or add a local reply' : 'Read and acknowledge'}
            />

            <div className='grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]'>
                <div className='space-y-5'>
                    <Surface title='Announcement details' contentClassName='p-4 sm:p-5'>
                        <dl className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                            <Field label='Category' value={announcement.category} />
                            <Field label='Published by' value={announcement.sentBy} />
                            <Field label='Published date' value={announcement.announcementDate} />
                            <Field label='Priority' value={announcement.priority || 'Normal'} />
                            <Field label='Audience' value={announcement.audienceLabel || 'Legacy audience'} />
                            <Field label='Acknowledgement' value={acknowledgementRequired ? 'Requested' : 'Not required'} />
                            <div className='sm:col-span-2 lg:col-span-3'><Field label='Message' value={announcement.message} /></div>
                            <div className='sm:col-span-2 lg:col-span-3'>
                                <dt className='text-xs font-medium text-[var(--erp-muted)]'>Attachment</dt>
                                <dd className='mt-1'>
                                    {announcement.attachmentName ? (
                                        <span className='inline-flex items-center gap-2 text-sm font-medium text-[var(--erp-ink)]'><FileText aria-hidden='true' size={18} /> {announcement.attachmentName}</span>
                                    ) : <span className='text-sm text-[var(--erp-muted)]'>No attachment</span>}
                                </dd>
                            </div>
                        </dl>
                    </Surface>

                    <Surface title='Your response' description='Responses below stay in this browser until the communication API is connected.' contentClassName='p-4 sm:p-5'>
                        <div className='flex flex-col gap-4'>
                            {acknowledgementRequired && <div className='flex flex-wrap items-center justify-between gap-3'><StatusBadge status={thread.acknowledged ? 'complete' : 'pending'} label={thread.acknowledged ? 'Acknowledged' : 'Not acknowledged'} /><button type='button' onClick={acknowledge} disabled={thread.acknowledged} className='min-h-10 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white disabled:opacity-50'>{thread.acknowledged ? 'Acknowledged' : 'Acknowledge announcement'}</button></div>}
                            <FormField id='announcement-reply' label='Reply' hint='Saved locally; it is not delivered to the sender.'>
                                <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={3} className='w-full rounded-lg border border-[var(--erp-line-strong)] px-3 py-2 text-sm text-[var(--erp-ink)]' placeholder='Add a concise response…' />
                            </FormField>
                            <div className='flex justify-end'>
                                <button type='button' onClick={sendReply} disabled={!reply.trim()} className='min-h-10 rounded-lg border border-[var(--erp-indigo)] px-4 text-sm font-semibold text-[var(--erp-indigo)] disabled:opacity-50'>Save local reply</button>
                            </div>
                        </div>
                    </Surface>
                </div>

                <WorkflowTimeline events={timelineEvents} description='Publication and local response activity recorded for this browser.' />
            </div>
        </section>
    )
}

