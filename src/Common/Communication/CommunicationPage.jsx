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
import {
    canUseCommunicationApi,
    createGroupConversationApi,
    getConversationApi,
    listConversationsApi,
    listDirectoryApi,
    patchConversationApi,
    sendMessageApi,
    startConversationApi,
} from '../../services/communicationApi'
import { apiMe } from '../../services/authApi'
import InboxPanel from './Components/InboxPanel'
import ChatPanel from './Components/ChatPanel'
import NewMessageModal from './Components/NewMessageModal'
import ProfilePanel from './Components/ProfilePanel'

const CommunicationPage = ({ roleKey }) => {
    const roleConfig = getCommunicationRoleConfig(roleKey)
    const navigate = useNavigate()
    const { conversationId } = useParams()
    const [self, setSelf] = useState(roleConfig.currentUser)
    const currentUser = self

    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const [chatLoading, setChatLoading] = useState(false)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')
    const [showNewMessage, setShowNewMessage] = useState(false)
    const [directory, setDirectory] = useState([])
    const [profile, setProfile] = useState({ open: false, person: null })

    const selectedId = conversationId || null

    const persist = useCallback(
        (next) => {
            setConversations(next)
            if (!canUseCommunicationApi()) saveConversationsForRole(roleKey, next)
        },
        [roleKey]
    )

    const loadConversations = useCallback(
        (withSkeleton = true) => {
            if (withSkeleton) setLoading(true)
            setError('')
            if (canUseCommunicationApi()) {
                Promise.all([apiMe(), listConversationsApi(), listDirectoryApi()])
                    .then(([me, rows, people]) => {
                        setSelf({
                            id: String(me.id),
                            employeeId: me.employee_id || me.employeeId || '',
                            name: me.full_name || me.email,
                            role: me.role_name || me.role,
                            department: '',
                            avatarColor: roleConfig.currentUser.avatarColor,
                        })
                        const selfIds = new Set(
                            [me.id, me.employee_id, me.employeeId]
                                .filter(Boolean)
                                .map((value) => String(value)),
                        )
                        setConversations(rows)
                        setDirectory(
                            (people || []).filter((person) => !selfIds.has(String(person.id || ''))
                                && !selfIds.has(String(person.employeeId || ''))),
                        )
                    })
                    .catch(() => {
                        setError('Failed to load conversations. Please try again.')
                        toast.error('Failed to load conversations')
                    })
                    .finally(() => setLoading(false))
                return
            }
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
        [roleKey, currentUser.id, roleConfig.currentUser.avatarColor]
    )

    useEffect(() => {
        loadConversations(true)
    }, [loadConversations])

    // Keep the inbox fresh so the other person sees new messages without a full page reload.
    useEffect(() => {
        if (!canUseCommunicationApi()) return undefined
        const timer = setInterval(() => loadConversations(false), 20000)
        return () => clearInterval(timer)
    }, [loadConversations])

    useEffect(() => {
        if (!selectedId) return
        if (canUseCommunicationApi()) {
            getConversationApi(selectedId)
                .then((row) => {
                    setConversations((current) =>
                        current.some((conv) => conv.id === row.id)
                            ? current.map((conv) => (conv.id === row.id ? row : conv))
                            : [row, ...current],
                    )
                })
                .catch(() => {})
                .finally(() => setChatLoading(false))
            return undefined
        }
        const timer = setTimeout(() => setChatLoading(false), 250)
        return () => clearTimeout(timer)
    }, [selectedId])

    const selectedConversation = useMemo(
        () => conversations.find((conv) => conv.id === selectedId && !conv.deleted) || null,
        [conversations, selectedId]
    )

    const openConversation = (id) => {
        if (canUseCommunicationApi()) {
            getConversationApi(id)
                .then((row) => {
                    setConversations((current) =>
                        current.some((conv) => conv.id === row.id)
                            ? current.map((conv) => (conv.id === row.id ? row : conv))
                            : [row, ...current],
                    )
                    navigate(`${roleConfig.routeBase}/inbox/${id}`)
                })
                .catch(() => toast.error('This conversation could not be opened.'))
            return
        }
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
        if (canUseCommunicationApi()) {
            patchConversationApi(id, { deleted: true })
                .then((row) => {
                    setConversations((current) => current.map((conv) => (conv.id === row.id ? row : conv)))
                    if (selectedId === id) goToInbox()
                    toast.success('Conversation deleted')
                })
                .catch(() => toast.error('The conversation could not be deleted.'))
            return
        }
        persist(conversations.map((conv) => (conv.id === id ? { ...conv, deleted: true } : conv)))
        if (selectedId === id) goToInbox()
        toast.success('Conversation deleted')
    }

    const createOrOpenConversation = async (contact) => {
        if (canUseCommunicationApi()) {
            setShowNewMessage(false)
            try {
                const row = await startConversationApi(contact.id)
                setConversations((current) =>
                    current.some((conv) => conv.id === row.id)
                        ? current.map((conv) => (conv.id === row.id ? row : conv))
                        : [row, ...current],
                )
                navigate(`${roleConfig.routeBase}/inbox/${row.id}`)
                toast.success(`Opened conversation with ${contact.name}`)
                return row
            } catch (err) {
                toast.error(err?.message || 'The conversation could not be started.')
                return null
            }
        }
        const existing = conversations.find(
            (conv) => !conv.deleted && !conv.isGroup && String(conv.participant?.id) === String(contact.id)
        )
        setShowNewMessage(false)
        if (existing) {
            openConversation(existing.id)
            return existing
        }

        const newConversation = {
            id: `conv-${Date.now()}-${contact.id}`,
            participant: contact,
            lastMessage: 'Conversation started',
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0,
            archived: false,
            deleted: false,
            messages: [
                {
                    id: `m-${Date.now()}-${contact.id}`,
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
        return newConversation
    }

    const createOrOpenMany = async (contacts, title = '') => {
        if (!Array.isArray(contacts) || !contacts.length) return
        if (contacts.length === 1) {
            await createOrOpenConversation(contacts[0])
            return
        }
        setShowNewMessage(false)
        if (canUseCommunicationApi()) {
            try {
                const row = await createGroupConversationApi(
                    contacts.map((contact) => contact.id),
                    title,
                )
                setConversations((current) => [row, ...current.filter((conv) => conv.id !== row.id)])
                navigate(`${roleConfig.routeBase}/inbox/${row.id}`)
                toast.success(`Group created with ${contacts.length} people`)
            } catch (err) {
                toast.error(err?.message || 'The group could not be created.')
            }
            return
        }
        const now = new Date().toISOString()
        const group = {
            id: `conv-${Date.now()}-group`,
            isGroup: true,
            title: title || contacts.map((contact) => contact.name).join(', '),
            participant: null,
            participants: [currentUser, ...contacts],
            lastMessage: 'Group created',
            lastMessageAt: now,
            unreadCount: 0,
            archived: false,
            deleted: false,
            messages: [],
        }
        persist([group, ...conversations])
        navigate(`${roleConfig.routeBase}/inbox/${group.id}`)
        toast.success(`Group created with ${contacts.length} people`)
    }

    const openProfile = (person) => setProfile({ open: true, person: person || null })

    const closeProfile = () => setProfile({ open: false, person: null })

    const messageFromProfile = (person) => {
        closeProfile()
        createOrOpenConversation(person)
    }

    const sendMessage = async ({ text, files = [], replyTo }) => {
        if (!selectedConversation) return
        if (canUseCommunicationApi()) {
            try {
                let latest = selectedConversation
                if (text?.trim()) {
                    latest = await sendMessageApi(selectedConversation.id, { body: text.trim(), file: files[0] })
                    files = files.slice(1)
                }
                for (const file of files) {
                    latest = await sendMessageApi(selectedConversation.id, { file })
                }
                setConversations((current) => current.map((conv) => (conv.id === latest.id ? latest : conv)))
            } catch (error) {
                toast.error(error?.message || 'The message could not be sent.')
            }
            return
        }

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
                        error={error}
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
                        onOpenProfile={openProfile}
                        showBackButton
                    />
                </div>
            </div>

            {profile.open && (
                <ProfilePanel
                    key={`${selectedConversation?.id || 'none'}-${profile.person?.id || 'members'}`}
                    person={profile.person}
                    conversation={selectedConversation}
                    currentUserId={currentUser.id}
                    onClose={closeProfile}
                    onMessage={messageFromProfile}
                />
            )}

            <NewMessageModal
                open={showNewMessage}
                onClose={() => setShowNewMessage(false)}
                currentUserId={currentUser.id}
                existingParticipantIds={conversations
                    .filter((c) => !c.deleted && !c.isGroup)
                    .map((c) => c.participant?.id)
                    .filter(Boolean)}
                onSelect={createOrOpenConversation}
                onSelectMany={createOrOpenMany}
                contacts={canUseCommunicationApi() ? directory : undefined}
            />
        </div>
    )
}

export default CommunicationPage
