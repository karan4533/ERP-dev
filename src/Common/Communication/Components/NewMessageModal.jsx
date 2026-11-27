import React, { useMemo, useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { getDirectoryContacts } from '../communicationData'
import UserAvatar from './UserAvatar'

const NewMessageModal = ({ open, onClose, currentUserId, existingParticipantIds = [], onSelect, onSelectMany, contacts: supplied }) => {
    const [query, setQuery] = useState('')
    const [selected, setSelected] = useState([])
    const [groupTitle, setGroupTitle] = useState('')

    const contacts = useMemo(() => {
        const q = query.trim().toLowerCase()
        return (supplied || getDirectoryContacts()).filter((contact) => {
            if (String(contact.id) === String(currentUserId)) return false
            if (!q) return true
            return (
                String(contact.name || '').toLowerCase().includes(q) ||
                String(contact.employeeId || contact.id || '').toLowerCase().includes(q) ||
                String(contact.role || '').toLowerCase().includes(q) ||
                String(contact.department || '').toLowerCase().includes(q)
            )
        })
    }, [currentUserId, query, supplied])

    if (!open) return null

    const selectedIds = new Set(selected.map((item) => String(item.id)))
    const multiEnabled = typeof onSelectMany === 'function'

    const toggleContact = (contact) => {
        if (!multiEnabled) {
            onSelect?.(contact)
            return
        }
        setSelected((current) =>
            current.some((item) => String(item.id) === String(contact.id))
                ? current.filter((item) => String(item.id) !== String(contact.id))
                : [...current, contact],
        )
    }

    const startSelected = () => {
        if (!selected.length) return
        if (selected.length === 1 && typeof onSelect === 'function') {
            onSelect(selected[0])
        } else {
            onSelectMany?.(selected, groupTitle.trim())
        }
        setSelected([])
        setQuery('')
        setGroupTitle('')
    }

    const close = () => {
        setSelected([])
        setQuery('')
        setGroupTitle('')
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-[#E4E7EC] px-5 py-4">
                    <div>
                        <h3 className="text-lg font-semibold text-[#0C1E5B]">New Message</h3>
                        <p className="text-sm text-[#667085]">
                            {multiEnabled ? 'Select one or more authorized ERP users' : 'Select an authorized ERP user'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={close}
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
                    {multiEnabled && selected.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {selected.map((contact) => (
                                <span key={contact.id} className="inline-flex items-center gap-1 rounded-full bg-[#EDEDF5] px-2.5 py-1 text-xs text-[#515DEF]">
                                    {contact.name}
                                    <button type="button" onClick={() => toggleContact(contact)} aria-label={`Remove ${contact.name}`}>
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                    {multiEnabled && selected.length > 1 && (
                        <div className="mt-3">
                            <label htmlFor="comm-group-title" className="mb-1 block text-xs font-medium text-[#344054]">
                                Group name (optional)
                            </label>
                            <input
                                id="comm-group-title"
                                value={groupTitle}
                                maxLength={120}
                                onChange={(e) => setGroupTitle(e.target.value)}
                                placeholder="e.g. Exam committee"
                                className="w-full rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm outline-none focus:border-[#515DEF]"
                            />
                            <p className="mt-1 text-xs text-[#667085]">
                                Everyone selected joins one group conversation.
                            </p>
                        </div>
                    )}
                </div>

                <div className="max-h-80 overflow-y-auto px-2 pb-4">
                    {contacts.length === 0 ? (
                        <p className="px-3 py-8 text-center text-sm text-[#667085]">No users found.</p>
                    ) : (
                        contacts.map((contact) => {
                            const alreadyExists = existingParticipantIds.map(String).includes(String(contact.id))
                            const isSelected = selectedIds.has(String(contact.id))
                            return (
                                <button
                                    key={contact.id}
                                    type="button"
                                    onClick={() => toggleContact(contact)}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#F8F9FC] ${isSelected ? 'bg-[#F5F6FF]' : ''}`}
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
                                    {multiEnabled && (
                                        <span className={`flex size-5 items-center justify-center rounded border ${isSelected ? 'border-[#515DEF] bg-[#515DEF] text-white' : 'border-[#D0D5DD] text-transparent'}`}>
                                            <Check size={12} />
                                        </span>
                                    )}
                                </button>
                            )
                        })
                    )}
                </div>

                {multiEnabled && (
                    <div className="flex justify-end gap-2 border-t border-[#E4E7EC] px-5 py-4">
                        <button type="button" onClick={close} className="rounded-md border border-[#D0D5DD] px-4 py-2 text-sm text-[#667085] cursor-pointer">
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!selected.length}
                            onClick={startSelected}
                            className="rounded-md bg-[#515DEF] px-4 py-2 text-sm text-white cursor-pointer disabled:opacity-50"
                        >
                            {selected.length > 1 ? `Start group (${selected.length})` : 'Start chat'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default NewMessageModal
