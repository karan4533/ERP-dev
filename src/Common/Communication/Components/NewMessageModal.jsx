import React, { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { DIRECTORY_CONTACTS } from '../communicationData'
import UserAvatar from './UserAvatar'
import Dialog from '../../ui/Dialog'

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

    return (
        <Dialog open={open} onClose={onClose} title='New message' description='Select an authorized ERP user.' size='md' contentClassName='!px-2 !pb-2 !pt-4'>
                <div className="px-3 pb-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                        <input
                            data-autofocus
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
        </Dialog>
    )
}

export default NewMessageModal
