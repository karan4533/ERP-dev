import React, { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { DIRECTORY_CONTACTS } from '../communicationData'
import UserAvatar from './UserAvatar'

const NewMessageModal = ({ open, onClose, currentUserId, existingParticipantIds = [], onSelect }) => {
    const [query, setQuery] = useState('')

    const contacts = useMemo(() => {
        const q = query.trim().toLowerCase()
        return DIRECTORY_CONTACTS.filter((contact) => {
            if (contact.id === currentUserId) return false
            if (!q) return true
            return (
                contact.name.toLowerCase().includes(q) ||
                contact.employeeId.toLowerCase().includes(q) ||
                contact.role.toLowerCase().includes(q) ||
                contact.department.toLowerCase().includes(q)
            )
        })
    }, [currentUserId, query])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-[#E4E7EC] px-5 py-4">
                    <div>
                        <h3 className="text-lg font-semibold text-[#0C1E5B]">New Message</h3>
                        <p className="text-sm text-[#667085]">Select an authorized ERP user</p>
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

                <div className="px-5 py-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name, ID, role..."
                            className="w-full rounded-lg border border-[#D0D5DD] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#515DEF]"
                        />
                    </div>
                </div>

                <div className="max-h-80 overflow-y-auto px-2 pb-4">
                    {contacts.length === 0 ? (
                        <p className="px-3 py-8 text-center text-sm text-[#667085]">No users found.</p>
                    ) : (
                        contacts.map((contact) => {
                            const alreadyExists = existingParticipantIds.includes(contact.id)
                            return (
                                <button
                                    key={contact.id}
                                    type="button"
                                    onClick={() => onSelect(contact)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#F8F9FC]"
                                >
                                    <UserAvatar name={contact.name} color={contact.avatarColor} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate font-medium text-[#101828]">{contact.name}</p>
                                            {alreadyExists && (
                                                <span className="rounded-full bg-[#EDEDF5] px-2 py-0.5 text-[10px] font-medium text-[#515DEF]">
                                                    Existing
                                                </span>
                                            )}
                                        </div>
                                        <p className="truncate text-xs text-[#667085]">
                                            {contact.employeeId} · {contact.role} · {contact.department}
                                        </p>
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}

export default NewMessageModal
