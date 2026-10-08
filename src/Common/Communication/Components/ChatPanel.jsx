import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    ArrowLeft,
    Check,
    CheckCheck,
    Copy,
    Download,
    FileSpreadsheet,
    FileText,
    Film,
    Image as ImageIcon,
    MessageCircle,
    Music,
    Presentation,
    Reply,
} from 'lucide-react'
import UserAvatar from './UserAvatar'
import MessageComposer from './MessageComposer'
import { getAttachmentKind } from '../communicationData'
import { formatMessageTime, groupMessagesByDate } from '../utils'

const attachmentIcon = (kind) => {
    if (kind === 'image') return ImageIcon
    if (kind === 'pdf' || kind === 'word') return FileText
    if (kind === 'excel') return FileSpreadsheet
    if (kind === 'powerpoint') return Presentation
    if (kind === 'audio') return Music
    if (kind === 'video') return Film
    return FileText
}

const StatusIcon = ({ status }) => {
    if (status === 'read') return <CheckCheck size={14} className="text-[#515DEF]" />
    if (status === 'delivered') return <CheckCheck size={14} className="text-[#98A2B3]" />
    return <Check size={14} className="text-[#98A2B3]" />
}

const ChatPanel = ({
    conversation,
    currentUser,
    loading,
    error,
    onBack,
    onSendMessage,
    showBackButton,
}) => {
    const scrollRef = useRef(null)
    const [replyTo, setReplyTo] = useState(null)
    const [previewImage, setPreviewImage] = useState(null)

    const grouped = useMemo(
        () => groupMessagesByDate(conversation?.messages || []),
        [conversation?.messages]
    )

    useEffect(() => {
        if (!scrollRef.current) return
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [conversation?.id, conversation?.messages?.length])

    if (loading) {
        return (
            <div className="flex h-full min-h-0 flex-1 flex-col bg-[#F8F9FC]">
                <div className="flex animate-pulse items-center gap-3 border-b border-[#E4E7EC] bg-white px-4 py-3">
                    <div className="h-12 w-12 rounded-full bg-[#E4E7EC]" />
                    <div className="space-y-2">
                        <div className="h-3 w-40 rounded bg-[#E4E7EC]" />
                        <div className="h-3 w-28 rounded bg-[#E4E7EC]" />
                    </div>
                </div>
                <div className="flex-1 space-y-3 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-14 w-2/3 animate-pulse rounded-2xl bg-[#E4E7EC] ${
                                i % 2 === 0 ? '' : 'ml-auto'
                            }`}
                        />
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-full flex-1 flex-col items-center justify-center bg-white px-6 text-center">
                <p className="font-medium text-[#101828]">Unable to load conversation</p>
                <p className="mt-1 text-sm text-[#667085]">{error}</p>
            </div>
        )
    }

    if (!conversation) {
        return (
            <div className="flex h-full flex-1 flex-col items-center justify-center bg-[#F8F9FC] px-6 text-center">
                {showBackButton && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="mb-4 inline-flex items-center gap-2 rounded-md border border-[#D0D5DD] px-3 py-2 text-sm text-[#667085] hover:bg-white lg:hidden"
                    >
                        <ArrowLeft size={16} />
                        Back to Inbox
                    </button>
                )}
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#EDEDF5] text-[#515DEF]">
                    <MessageCircle size={28} />
                </div>
                <p className="text-lg font-semibold text-[#101828]">Select a conversation</p>
                <p className="mt-1 max-w-sm text-sm text-[#667085]">
                    Choose a chat from your inbox or start a new message to begin communicating.
                </p>
            </div>
        )
    }

    const participant = conversation.participant

    const handleCopy = async (content) => {
        try {
            await navigator.clipboard.writeText(content || '')
        } catch {
            // ignore clipboard failures in unsupported contexts
        }
    }

    const handleDownload = (attachment) => {
        if (!attachment?.url || attachment.url === '#') return
        const link = document.createElement('a')
        link.href = attachment.url
        link.download = attachment.name || 'attachment'
        link.target = '_blank'
        link.rel = 'noreferrer'
        document.body.appendChild(link)
        link.click()
        link.remove()
    }

    return (
        <section className="flex h-full min-h-0 flex-1 flex-col bg-[#F8F9FC]">
            <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#E4E7EC] bg-white px-3 py-3 sm:px-4">
                {showBackButton && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-md p-2 text-[#667085] hover:bg-[#F2F4F7] lg:hidden"
                        aria-label="Back to inbox"
                    >
                        <ArrowLeft size={18} />
                    </button>
                )}
                <UserAvatar name={participant.name} color={participant.avatarColor} size="lg" />
                <div className="min-w-0">
                    <p className="truncate font-semibold text-[#101828]">{participant.name}</p>
                    <p className="truncate text-xs text-[#667085]">
                        {participant.employeeId} · {participant.role}
                    </p>
                </div>
            </header>

            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5">
                {grouped.map((item) => {
                    if (item.type === 'separator') {
                        return (
                            <div key={item.id} className="flex items-center justify-center py-2">
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#667085] shadow-sm">
                                    {item.label}
                                </span>
                            </div>
                        )
                    }

                    const message = item.message
                    const mine = message.senderId === currentUser.id
                    const senderName = mine ? currentUser.name : participant.name
                    const senderColor = mine ? currentUser.avatarColor : participant.avatarColor
                    const kind = message.attachment
                        ? getAttachmentKind(message.attachment.type, message.attachment.name)
                        : null
                    const Icon = kind ? attachmentIcon(kind) : null

                    return (
                        <div
                            key={message.id}
                            className={`flex gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            <UserAvatar name={senderName} color={senderColor} size="sm" />
                            <div className={`max-w-[80%] sm:max-w-[70%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                                <div className="mb-1 flex items-center gap-2 px-1">
                                    <span className="text-xs font-medium text-[#667085]">{senderName}</span>
                                    <span className="text-[11px] text-[#98A2B3]">
                                        {formatMessageTime(message.createdAt)}
                                    </span>
                                </div>

                                {message.replyTo && (
                                    <div
                                        className={`mb-1 w-full rounded-lg border-l-2 border-[#515DEF] bg-white/80 px-2.5 py-1.5 text-xs text-[#667085] ${
                                            mine ? 'text-right' : ''
                                        }`}
                                    >
                                        Replying to: {message.replyTo}
                                    </div>
                                )}

                                <div
                                    className={`rounded-2xl px-3.5 py-2.5 shadow-sm ${
                                        mine
                                            ? 'rounded-tr-md bg-[#515DEF] text-white'
                                            : 'rounded-tl-md bg-white text-[#101828]'
                                    }`}
                                >
                                    {message.content && (
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                            {message.content}
                                        </p>
                                    )}

                                    {message.attachment && (
                                        <div className={`mt-2 ${message.content ? '' : ''}`}>
                                            {kind === 'image' && message.attachment.url !== '#' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewImage(message.attachment.url)}
                                                    className="block overflow-hidden rounded-xl"
                                                >
                                                    <img
                                                        src={message.attachment.url}
                                                        alt={message.attachment.name}
                                                        className="max-h-56 w-full object-cover"
                                                    />
                                                </button>
                                            ) : (
                                                <div
                                                    className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${
                                                        mine ? 'bg-white/15' : 'bg-[#F2F4F7]'
                                                    }`}
                                                >
                                                    {Icon && <Icon size={18} />}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-medium">
                                                            {message.attachment.name}
                                                        </p>
                                                        <p className={`text-[11px] ${mine ? 'text-white/80' : 'text-[#98A2B3]'}`}>
                                                            {message.attachment.size}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className={`mt-1 flex items-center gap-2 px-1 ${mine ? 'flex-row-reverse' : ''}`}>
                                    {mine && <StatusIcon status={message.status} />}
                                    <button
                                        type="button"
                                        className="text-[11px] text-[#98A2B3] hover:text-[#515DEF] cursor-pointer"
                                        onClick={() => setReplyTo(message.content || message.attachment?.name)}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            <Reply size={12} /> Reply
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        className="text-[11px] text-[#98A2B3] hover:text-[#515DEF] cursor-pointer"
                                        onClick={() => handleCopy(message.content || message.attachment?.name)}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            <Copy size={12} /> Copy
                                        </span>
                                    </button>
                                    {message.attachment && (
                                        <button
                                            type="button"
                                            className="text-[11px] text-[#98A2B3] hover:text-[#515DEF] cursor-pointer"
                                            onClick={() => handleDownload(message.attachment)}
                                        >
                                            <span className="inline-flex items-center gap-1">
                                                <Download size={12} /> Download
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {replyTo && (
                <div className="flex items-center justify-between border-t border-[#E4E7EC] bg-white px-4 py-2 text-xs text-[#667085]">
                    <span className="truncate">Replying to: {replyTo}</span>
                    <button type="button" onClick={() => setReplyTo(null)} className="text-[#515DEF]">
                        Cancel
                    </button>
                </div>
            )}

            <div className="sticky bottom-0">
                <MessageComposer
                    onSend={({ text, files }) => {
                        onSendMessage({ text, files, replyTo })
                        setReplyTo(null)
                    }}
                />
            </div>

            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="max-h-full max-w-full rounded-xl object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </section>
    )
}

export default ChatPanel
