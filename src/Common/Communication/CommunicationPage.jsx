import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getCommunicationRoleConfig } from './communicationRoleConfig'
import {
    formatFileSize,
    getAttachmentKind,
    getConversationsForRole,
    saveConversationsForRole,
} from './communicationData'
import InboxPanel from './Components/InboxPanel'
import ChatPanel from './Components/ChatPanel'
import NewMessageModal from './Components/NewMessageModal'

const CommunicationPage = ({ roleKey }) => {
    const roleConfig = getCommunicationRoleConfig(roleKey)
    const navigate = useNavigate()
    const { conversationId } = useParams()
    const currentUser = roleConfig.currentUser

    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const [chatLoading, setChatLoading] = useState(false)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')
    const [showNewMessage, setShowNewMessage] = useState(false)

    const selectedId = conversationId || null

    const persist = useCallback(
        (next) => {
            setConversations(next)
            saveConversationsForRole(roleKey, next)
        },
        [roleKey]
    )

    const loadConversations = useCallback(
        (withSkeleton = true) => {
            if (withSkeleton) setLoading(true)
            setError('')
            try {
                const data = getConversationsForRole(roleKey, currentUser.id)
                setConversations(data)
            } catch {
                setError('Failed to load conversations. Please try again.')
                toast.error('Failed to load conversations')
            } finally {
                setLoading(false)
            }
        },
        [roleKey, currentUser.id]
    )

    useEffect(() => {
        loadConversations(true)
    }, [loadConversations])

    useEffect(() => {
        if (!selectedId) return
        setChatLoading(true)
        const timer = setTimeout(() => setChatLoading(false), 250)
        return () => clearTimeout(timer)
    }, [selectedId])

    const selectedConversation = useMemo(
        () => conversations.find((conv) => conv.id === selectedId && !conv.deleted) || null,
        [conversations, selectedId]
    )

    const openConversation = (id) => {
        persist(
            conversations.map((conv) =>
                conv.id === id
                    ? {
                          ...conv,
                          unreadCount: 0,
                          messages: conv.messages.map((msg) =>
                              msg.senderId !== currentUser.id ? { ...msg, status: 'read' } : msg
                          ),
                      }
                    : conv
            )
        )
        navigate(`${roleConfig.routeBase}/inbox/${id}`)
    }

    const goToInbox = () => navigate(`${roleConfig.routeBase}/inbox`)

    const deleteConversation = (id) => {
        persist(conversations.map((conv) => (conv.id === id ? { ...conv, deleted: true } : conv)))
        if (selectedId === id) goToInbox()
        toast.success('Conversation deleted')
    }

    const createOrOpenConversation = (contact) => {
        const existing = conversations.find(
            (conv) => !conv.deleted && conv.participant.id === contact.id
        )
        setShowNewMessage(false)
        if (existing) {
            openConversation(existing.id)
            return
        }

        const newConversation = {
            id: `conv-${Date.now()}`,
            participant: contact,
            lastMessage: 'Conversation started',
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0,
            archived: false,
            deleted: false,
            messages: [
                {
                    id: `m-${Date.now()}`,
                    senderId: currentUser.id,
                    type: 'text',
                    content: 'Hi, I would like to connect with you.',
                    createdAt: new Date().toISOString(),
                    status: 'sent',
                },
            ],
        }

        const next = [newConversation, ...conversations]
        persist(next)
        navigate(`${roleConfig.routeBase}/inbox/${newConversation.id}`)
        toast.success(`Started conversation with ${contact.name}`)
    }

    const sendMessage = async ({ text, files = [], replyTo }) => {
        if (!selectedConversation) return

        const now = new Date().toISOString()
        const baseMessages = []

        if (text?.trim()) {
            baseMessages.push({
                id: `m-${Date.now()}-text`,
                senderId: currentUser.id,
                type: 'text',
                content: text.trim(),
                createdAt: now,
                status: 'sent',
                replyTo: replyTo || null,
            })
        }

        for (const [index, file] of files.entries()) {
            const kind = getAttachmentKind(file.type, file.name)
            const objectUrl = URL.createObjectURL(file)
            baseMessages.push({
                id: `m-${Date.now()}-${index}`,
                senderId: currentUser.id,
                type: kind === 'image' ? 'image' : 'file',
                content: kind === 'image' ? file.name : `Shared ${file.name}`,
                createdAt: now,
                status: 'sent',
                replyTo: replyTo || null,
                attachment: {
                    name: file.name,
                    type: file.type || 'application/octet-stream',
                    size: formatFileSize(file.size),
                    url: objectUrl,
                },
            })
        }

        if (!baseMessages.length) return

        const last = baseMessages[baseMessages.length - 1]
        const preview =
            last.type === 'image'
                ? `📷 ${last.attachment?.name || 'Image'}`
                : last.type === 'file'
                  ? last.attachment?.name || 'Attachment'
                  : last.content

        const next = conversations.map((conv) =>
            conv.id === selectedConversation.id
                ? {
                      ...conv,
                      messages: [...conv.messages, ...baseMessages],
                      lastMessage: preview,
                      lastMessageAt: now,
                      unreadCount: 0,
                      archived: false,
                  }
                : conv
        )
        persist(next)

        // Simulate delivery → read lifecycle for outbound messages
        setTimeout(() => {
            setConversations((prev) => {
                const updated = prev.map((conv) =>
                    conv.id === selectedConversation.id
                        ? {
                              ...conv,
                              messages: conv.messages.map((msg) =>
                                  baseMessages.some((m) => m.id === msg.id)
                                      ? { ...msg, status: 'delivered' }
                                      : msg
                              ),
                          }
                        : conv
                )
                saveConversationsForRole(roleKey, updated)
                return updated
            })
        }, 700)

        setTimeout(() => {
            setConversations((prev) => {
                const updated = prev.map((conv) =>
                    conv.id === selectedConversation.id
                        ? {
                              ...conv,
                              messages: conv.messages.map((msg) =>
                                  baseMessages.some((m) => m.id === msg.id)
                                      ? { ...msg, status: 'read' }
                                      : msg
                              ),
                          }
                        : conv
                )
                saveConversationsForRole(roleKey, updated)
                return updated
            })
        }, 1600)
    }

    const showChatOnMobile = Boolean(selectedId)

    if (!roleConfig) {
        return (
            <div className="rounded-2xl bg-white p-6 shadow-md text-[#667085]">
                Communication is not configured for this role.
            </div>
        )
    }

    return (
        <div className="overflow-hidden rounded-2xl bg-white shadow-md">
            <div className="flex h-[calc(100vh-9.5rem)] min-h-140">
                <div className={`${showChatOnMobile ? 'hidden' : 'flex'} w-full lg:flex lg:w-auto`}>
                    <InboxPanel
                        conversations={conversations}
                        selectedId={selectedId}
                        search={search}
                        onSearchChange={setSearch}
                        filter={filter}
                        onFilterChange={setFilter}
                        loading={loading}
                        onRefresh={() => loadConversations(true)}
                        onNewMessage={() => setShowNewMessage(true)}
                        onOpenConversation={openConversation}
                        onDelete={deleteConversation}
                    />
                </div>

                <div className={`${showChatOnMobile ? 'flex' : 'hidden'} min-w-0 flex-1 lg:flex`}>
                    <ChatPanel
                        conversation={selectedConversation}
                        currentUser={currentUser}
                        loading={chatLoading}
                        error={
                            selectedId && !loading && !selectedConversation
                                ? 'This conversation is unavailable or was deleted.'
                                : error
                        }
                        onBack={goToInbox}
                        onSendMessage={sendMessage}
                        showBackButton
                    />
                </div>
            </div>

            <NewMessageModal
                open={showNewMessage}
                onClose={() => setShowNewMessage(false)}
                currentUserId={currentUser.id}
                existingParticipantIds={conversations
                    .filter((c) => !c.deleted)
                    .map((c) => c.participant.id)}
                onSelect={createOrOpenConversation}
            />
        </div>
    )
}

export default CommunicationPage
