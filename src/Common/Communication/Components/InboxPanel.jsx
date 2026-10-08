import React, { useEffect, useRef, useState } from 'react'
import {
    EllipsisVertical,
    MessageSquarePlus,
    RefreshCw,
    Search,
    Trash2,
} from 'lucide-react'
import UserAvatar from './UserAvatar'
import { formatConversationTime, isRecentConversation } from '../utils'

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'recent', label: 'Recent' },
]

const InboxPanel = ({
    conversations,
    selectedId,
    search,
    onSearchChange,
    filter,
    onFilterChange,
    loading,
    onRefresh,
    onNewMessage,
    onOpenConversation,
    onDelete,
}) => {
    const [menuOpenId, setMenuOpenId] = useState(null)
    const listRef = useRef(null)

    useEffect(() => {
        setMenuOpenId(null)
    }, [selectedId])

    useEffect(() => {
        if (!menuOpenId) return undefined

        const handlePointerDown = (event) => {
            if (listRef.current && !listRef.current.contains(event.target)) {
                setMenuOpenId(null)
            }
        }

        document.addEventListener('pointerdown', handlePointerDown)
        return () => document.removeEventListener('pointerdown', handlePointerDown)
    }, [menuOpenId])

    const filtered = conversations.filter((conv) => {
        if (conv.deleted || conv.archived) return false
        const q = search.trim().toLowerCase()
        if (q) {
            const haystack = [
                conv.participant.name,
                conv.participant.employeeId,
                conv.participant.role,
                conv.participant.department,
                conv.lastMessage,
            ]
                .join(' ')
                .toLowerCase()
            if (!haystack.includes(q)) return false
        }
        if (filter === 'unread') return conv.unreadCount > 0
        if (filter === 'recent') return isRecentConversation(conv.lastMessageAt)
        return true
    })

    return (
        <aside className="flex h-full min-h-0 w-full flex-col border-r border-[#E4E7EC] bg-white lg:w-[360px] xl:w-[380px]">
            <div className="shrink-0 space-y-3 border-b border-[#E4E7EC] p-4">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-semibold text-[#0C1E5B]">Inbox</h2>
                        <p className="text-xs text-[#667085]">Secure ERP conversations</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onRefresh}
                            className="rounded-md border border-[#D0D5DD] p-2 text-[#667085] hover:bg-[#F9FAFB]"
                            title="Refresh"
                            aria-label="Refresh conversations"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            type="button"
                            onClick={onNewMessage}
                            className="inline-flex items-center gap-1.5 rounded-md bg-[#515DEF] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                        >
                            <MessageSquarePlus size={16} />
                            <span className="hidden sm:inline">New Message</span>
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                    <input
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search conversations"
                        className="w-full rounded-lg border border-[#D0D5DD] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#515DEF]"
                    />
                </div>

                <div className="flex gap-2">
                    {FILTERS.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => onFilterChange(item.key)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                filter === item.key
                                    ? 'bg-[#515DEF] text-white'
                                    : 'bg-[#F2F4F7] text-[#667085] hover:bg-[#E4E7EC]'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
                {loading ? (
                    <div className="space-y-3 p-4">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="flex animate-pulse gap-3">
                                <div className="h-10 w-10 rounded-full bg-[#E4E7EC]" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/2 rounded bg-[#E4E7EC]" />
                                    <div className="h-3 w-3/4 rounded bg-[#E4E7EC]" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#EDEDF5] text-[#515DEF]">
                            <Search size={22} />
                        </div>
                        <p className="font-medium text-[#101828]">No conversations found.</p>
                        <p className="mt-1 text-sm text-[#667085]">Start a new conversation.</p>
                        <button
                            type="button"
                            onClick={onNewMessage}
                            className="mt-4 rounded-md bg-[#515DEF] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                        >
                            New Message
                        </button>
                    </div>
                ) : (
                    <ul className="divide-y divide-[#F2F4F7]">
                        {filtered.map((conv) => {
                            const active = selectedId === conv.id
                            return (
                                <li key={conv.id} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpenId(null)
                                            onOpenConversation(conv.id)
                                        }}
                                        className={`flex w-full gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                                            active ? 'bg-[#F0F1FF]' : 'hover:bg-[#F9FAFB]'
                                        }`}
                                    >
                                        <UserAvatar
                                            name={conv.participant.name}
                                            color={conv.participant.avatarColor}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-[#101828]">
                                                        {conv.participant.name}
                                                    </p>
                                                    <p className="truncate text-xs text-[#667085]">
                                                        {conv.participant.employeeId} · {conv.participant.role}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 text-[11px] text-[#98A2B3]">
                                                    {formatConversationTime(conv.lastMessageAt)}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 truncate text-xs text-[#98A2B3]">
                                                {conv.participant.department}
                                            </p>
                                            <div className="mt-1 flex items-center justify-between gap-2">
                                                <p
                                                    className={`truncate text-sm ${
                                                        conv.unreadCount > 0
                                                            ? 'font-medium text-[#344054]'
                                                            : 'text-[#667085]'
                                                    }`}
                                                >
                                                    {conv.lastMessage}
                                                </p>
                                                {conv.unreadCount > 0 && (
                                                    <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#515DEF] px-1.5 text-[10px] font-semibold text-white">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setMenuOpenId((prev) => (prev === conv.id ? null : conv.id))
                                        }}
                                        className="absolute right-2 top-10 rounded-md p-1 text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#667085]"
                                        aria-label="Conversation actions"
                                    >
                                        <EllipsisVertical size={16} />
                                    </button>

                                    {menuOpenId === conv.id && (
                                        <div className="absolute right-3 top-16 z-20 w-48 rounded-lg border border-[#E4E7EC] bg-white py-1 shadow-lg">
                                            <button
                                                type="button"
                                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#344054] hover:bg-[#F9FAFB]"
                                                onClick={() => {
                                                    setMenuOpenId(null)
                                                    onOpenConversation(conv.id)
                                                }}
                                            >
                                                Open Conversation
                                            </button>
                                            <button
                                                type="button"
                                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    onDelete(conv.id)
                                                    setMenuOpenId(null)
                                                }}
                                            >
                                                <Trash2 size={14} /> Delete Conversation
                                            </button>
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </aside>
    )
}

export default InboxPanel
