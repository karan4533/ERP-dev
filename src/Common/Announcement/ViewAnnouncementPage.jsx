import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ArrowLeft } from 'lucide-react'
import pdf_icon from '../../assets/images/pdf-icon.png'
import { getAnnouncementById } from './announcementData'
import { getAnnouncementRoutes } from './announcementConfigs'
import { ensureSeed, saveJson } from '../demoDomain/storage'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value || '-'}</span>
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

    const acknowledge = () => {
        const next = { ...responses, [id]: { ...thread, acknowledged: true, acknowledgedAt: new Date().toISOString() } }
        setResponses(next)
        saveJson(storageKey, next)
        toast.success('Announcement acknowledged.')
    }

    const sendReply = () => {
        if (!reply.trim()) return
        const nextThread = { ...thread, replies: [...thread.replies, { text: reply.trim(), at: new Date().toISOString(), by: roleKey }] }
        const next = { ...responses, [id]: nextThread }
        setResponses(next)
        saveJson(storageKey, next)
        setReply('')
        toast.success('Reply saved on this announcement.')
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate(routes.list)}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            {!announcement ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Announcement not found.</div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h1 className='text-2xl font-semibold text-black'>{announcement.title}</h1>
                        <p className='text-sm text-[#667085] mt-2'>{announcement.id} · {announcement.category}</p>
                    </div>
                    <Section title='Announcement Details'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Announcement ID' value={announcement.id} />
                            <Field label='Title' value={announcement.title} />
                            <Field label='Category' value={announcement.category} />
                            <Field label='Sent By' value={announcement.sentBy} />
                            <Field label='Date' value={announcement.announcementDate} />
                            <div className='lg:col-span-3'><Field label='Message' value={announcement.message} /></div>
                            <div className='lg:col-span-3'>
                                <div className='flex flex-col gap-y-1'>
                                    <span className='text-base font-medium text-[#808080]'>Attachment</span>
                                    {announcement.attachmentName ? (
                                        <span className='flex items-center gap-x-2 text-sm text-[#1E1E1E]'>
                                            <img src={pdf_icon} alt='attachment' className='w-6 h-6' />
                                            {announcement.attachmentName}
                                        </span>
                                    ) : (
                                        <span className='text-sm text-[#1E1E1E]'>-</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Section>
                    <Section title='Response'>
                        <p className='text-sm text-[#667085] mb-3'>{thread.acknowledged ? 'Acknowledged' : 'Not acknowledged'}</p>
                        <button type='button' onClick={acknowledge} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer'>Acknowledge</button>
                        <div className='mt-4 space-y-2'>
                            {thread.replies.map((item, index) => <p key={index} className='text-sm text-[#1E1E1E]'>{item.by}: {item.text}</p>)}
                            <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={2} className='w-full border border-[#D9D9D9] rounded-md px-2 py-2 text-sm' placeholder='Reply' />
                            <button type='button' onClick={sendReply} className='border border-[#515DEF] text-[#515DEF] text-sm px-4 py-2 rounded-md cursor-pointer'>Reply</button>
                        </div>
                    </Section>
                </>
            )}
        </section>
    )
}
