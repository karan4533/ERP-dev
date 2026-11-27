import React, { useState } from 'react'
import { ArrowLeft, Mail, MessageSquare, Users, X } from 'lucide-react'
import UserAvatar from './UserAvatar'

const Row = ({ label, value }) => (
    <div className="flex justify-between gap-4 py-2 text-sm">
        <span className="text-[#667085]">{label}</span>
        <span className="min-w-0 truncate text-right font-medium text-[#101828]">{value || '—'}</span>
    </div>
)

/**
 * Side panel for a person (name / role / ID / department / email from the inbox directory) or a group
 * (member list; click a member to see their details). "Message" opens the existing 1:1 thread or starts one.
 */
const ProfilePanel = ({ person, conversation, currentUserId, onClose, onMessage }) => {
    const [viewing, setViewing] = useState(null)

    const members = conversation?.isGroup ? conversation.participants || [] : []
    const shown = viewing || person || (!conversation?.isGroup ? conversation?.participant : null)
    const isSelf = shown && String(shown.id) === String(currentUserId)

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
            <aside
                className="flex h-full w-full max-w-sm flex-col bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
                aria-label={shown ? 'Profile' : 'Group members'}
            >
                <div className="flex items-center justify-between border-b border-[#E4E7EC] px-5 py-4">
                    <div className="flex items-center gap-2">
                        {viewing && members.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setViewing(null)}
                                className="rounded-md p-1.5 text-[#667085] hover:bg-[#F2F4F7]"
                                aria-label="Back to members"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <h3 className="text-lg font-semibold text-[#0C1E5B]">{shown ? 'Profile' : 'Group members'}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1.5 text-[#667085] hover:bg-[#F2F4F7]"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {shown ? (
                    <div className="flex-1 overflow-y-auto px-5 py-6">
                        <div className="flex flex-col items-center text-center">
                            <UserAvatar name={shown.name || '?'} color={shown.avatarColor} size="lg" />
                            <p className="mt-3 text-lg font-semibold text-[#101828]">{shown.name || 'Unknown person'}</p>
                            <p className="text-sm text-[#667085]">{shown.role || ''}</p>
                        </div>
                        <div className="mt-6 divide-y divide-[#F2F4F7] rounded-xl border border-[#E4E7EC] px-4">
                            <Row label="Employee ID" value={shown.employeeId} />
                            <Row label="Role" value={shown.role} />
                            <Row label="Department" value={shown.department} />
                            <Row label="Email" value={shown.email} />
                        </div>
                        <div className="mt-6 flex flex-col gap-2">
                            {!isSelf && typeof onMessage === 'function' && (
                                <button
                                    type="button"
                                    onClick={() => onMessage(shown)}
                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#515DEF] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                                >
                                    <MessageSquare size={16} /> Message
                                </button>
                            )}
                            {shown.email && (
                                <a
                                    href={`mailto:${shown.email}`}
                                    className="inline-flex items-center justify-center gap-2 rounded-md border border-[#D0D5DD] px-4 py-2 text-sm text-[#344054] hover:bg-[#F9FAFB]"
                                >
                                    <Mail size={16} /> Email
                                </a>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto px-2 py-3">
                        <p className="flex items-center gap-2 px-3 pb-2 text-sm text-[#667085]">
                            <Users size={14} /> {members.length} members
                        </p>
                        {members.length === 0 ? (
                            <p className="px-3 py-8 text-center text-sm text-[#667085]">No members found.</p>
                        ) : (
                            members.map((member) => (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => setViewing(member)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#F8F9FC]"
                                >
                                    <UserAvatar name={member.name || '?'} color={member.avatarColor} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-[#101828]">
                                            {member.name || 'Unknown person'}
                                            {String(member.id) === String(currentUserId) ? ' (You)' : ''}
                                        </p>
                                        <p className="truncate text-xs text-[#667085]">
                                            {[member.role, member.department].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </aside>
        </div>
    )
}

export default ProfilePanel
