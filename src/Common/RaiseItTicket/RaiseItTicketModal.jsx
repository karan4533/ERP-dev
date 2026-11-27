import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'
import { IT_TICKETS_KEY, raiseTicket } from '../demoDomain/itTickets'
import { usesCampusApiForKey } from '../../services/campusJsonStore'
import { uploadFileWithProgress } from '../../services/filesApi'
import FileUploadField from '../CommonComponents/FileUploadField'

const TICKET_ATTACHMENT_RESOURCE = 'it-ticket-attachment'

const ROLE_LABEL = {
    [ROLES.SUPER_ADMIN]: 'Super Admin',
    [ROLES.ADMIN]: 'Admin',
    [ROLES.TEACHER]: 'Teacher',
    [ROLES.COORDINATOR]: 'Coordinator',
    [ROLES.PRINCIPAL]: 'Principal',
    [ROLES.DIRECTOR]: 'Director',
    [ROLES.STUDENT]: 'Student',
    [ROLES.PARENT]: 'Parent',
    [ROLES.HR]: 'HR',
    [ROLES.ACCOUNT_HEAD]: 'Finance Head',
    [ROLES.TRANSPORT_MANAGER]: 'Transport Manager',
    [ROLES.HOUSEKEEPING_MANAGER]: 'Housekeeping Manager',
    [ROLES.MAINTENANCE_MANAGER]: 'Maintenance Manager',
    [ROLES.IT_SUPPORT_MANAGER]: 'IT Support Manager',
    [ROLES.GATEKEEPER]: 'Gate Keeper',
    [ROLES.GATEKEEPER_MANAGER]: 'Gate Keeper Manager',
    [ROLES.STATIONERY_STORE_MANAGER]: 'Stationery Store Manager',
    [ROLES.CANTEEN_MANAGER]: 'Canteen Manager',
}

const CATEGORIES = [
    'Hardware',
    'Software',
    'Network',
    'Printer',
    'Housekeeping',
    'Facilities / Maintenance',
    'Stationery / Stores',
    'Transport',
    'Canteen',
    'Other',
]

const DEPARTMENTS = [
    'IT Support',
    'Housekeeping',
    'Facilities',
    'Stationery Store',
    'Transport',
    'Canteen',
    'Academics',
    'Front Office',
    'HR',
    'Finance',
    'General',
]

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
const inputClass = 'text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full'

const EMPTY_FORM = {
    category: 'Hardware',
    subject: '',
    description: '',
    priority: 'Medium',
    department: 'IT Support',
    assetId: '',
    attachmentName: '',
}

export default function RaiseItTicketModal({ open, onClose }) {
    const { role, name, email } = useAuth()
    const [form, setForm] = useState(EMPTY_FORM)
    const [busy, setBusy] = useState(false)
    const apiMode = usesCampusApiForKey(IT_TICKETS_KEY)
    // API mode: files are uploaded to the ticket after the server has created it.
    const [pendingFiles, setPendingFiles] = useState([])
    const uploadedRef = useRef(new Set())
    // Set when the ticket was raised but some attachments did not upload (the user may retry them).
    const [raised, setRaised] = useState(null)
    const [attachError, setAttachError] = useState('')

    useEffect(() => {
        if (!open) return undefined
        // Once a ticket is raised with failed attachments, the user must choose Retry or Close explicitly
        // (Close clears the form so a reopened modal never shows the old ticket).
        const onKey = (event) => {
            if (event.key === 'Escape' && !raised) onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose, raised])

    if (!open) return null

    const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

    const resetForm = () => {
        setForm(EMPTY_FORM)
        setPendingFiles([])
        uploadedRef.current = new Set()
        setRaised(null)
        setAttachError('')
    }

    /** Uploads the files not stored yet; returns one message per failed file. */
    const uploadPending = async (ticket) => {
        const failures = []
        for (const [index, file] of pendingFiles.entries()) {
            if (uploadedRef.current.has(index)) continue
            try {
                await uploadFileWithProgress(file, { resourceType: TICKET_ATTACHMENT_RESOURCE, resourceId: ticket.ticketId })
                uploadedRef.current.add(index)
            } catch (error) {
                failures.push(`${file.name}: ${error?.message || 'Upload failed.'}`)
            }
        }
        return failures
    }

    const finishAttachments = async (ticket) => {
        const failures = await uploadPending(ticket)
        if (failures.length) {
            setRaised(ticket)
            setAttachError(failures.join(' '))
            return false
        }
        return true
    }

    const retryAttachments = async () => {
        if (busy || !raised) return
        setBusy(true)
        const done = await finishAttachments(raised)
        setBusy(false)
        if (done) {
            toast.success(`Attachments added to ${raised.ticketId}.`)
            resetForm()
            onClose()
        }
    }

    const closeAfterPartial = () => {
        resetForm()
        onClose()
    }

    const submit = async (event) => {
        event.preventDefault()
        if (busy) return
        if (raised) return
        if (!form.subject.trim() || !form.description.trim()) {
            toast.error('Subject and description are required.')
            return
        }
        setBusy(true)
        try {
            if (apiMode) {
                const ticket = await raiseTicket({
                    department: form.department || 'General',
                    issueType: form.category,
                    subject: form.subject.trim(),
                    description: form.description.trim(),
                    priority: form.priority,
                    assetId: form.assetId,
                })
                const done = await finishAttachments(ticket)
                if (!done) {
                    toast.warning(`Ticket ${ticket.ticketId} raised, but some attachments did not upload.`)
                    return
                }
                toast.success(`Ticket ${ticket.ticketId} raised.`)
                resetForm()
                onClose()
                return
            }
            const ticket = await raiseTicket({
                requesterName: name || email || 'Demo User',
                requesterRole: ROLE_LABEL[role] || role || 'User',
                requesterEmail: email || '',
                department: form.department || 'General',
                issueType: form.category,
                subject: form.subject.trim(),
                description: form.description.trim(),
                priority: form.priority,
                assetId: form.assetId,
                attachmentName: form.attachmentName,
            })
            toast.success(`Ticket ${ticket.ticketId} raised.`)
            resetForm()
            onClose()
        } catch (error) {
            toast.error(error?.message || 'The ticket could not be raised. Please try again.')
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <button type='button' className='absolute inset-0 bg-black/40' onClick={raised ? undefined : onClose} aria-label='Close' />
            <form onSubmit={submit} className='relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-lg p-5'>
                <h3 className='text-lg font-semibold text-black'>Raise Ticket</h3>
                <p className='text-xs text-[#667085] mt-1'>
                    {usesCampusApiForKey(IT_TICKETS_KEY)
                        ? 'Raise a ticket for any department (IT, Housekeeping, Stores, Transport, and more). Track it under My Tickets.'
                        : 'Pick the target department and category. The ticket is routed to that department inbox.'}
                </p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4'>
                    <label className='text-sm flex flex-col gap-1'>Department
                        <select value={form.department} onChange={set('department')} className={inputClass}>
                            {DEPARTMENTS.map((item) => <option key={item}>{item}</option>)}
                        </select>
                    </label>
                    <label className='text-sm flex flex-col gap-1'>Category
                        <select value={form.category} onChange={set('category')} className={inputClass}>
                            {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
                        </select>
                    </label>
                    <label className='text-sm flex flex-col gap-1 sm:col-span-2'>Priority
                        <select value={form.priority} onChange={set('priority')} className={inputClass}>
                            {PRIORITIES.map((item) => <option key={item}>{item}</option>)}
                        </select>
                    </label>
                    <label className='text-sm flex flex-col gap-1 sm:col-span-2'>Subject
                        <input value={form.subject} onChange={set('subject')} className={inputClass} />
                    </label>
                    <label className='text-sm flex flex-col gap-1 sm:col-span-2'>Description
                        <textarea rows={3} value={form.description} onChange={set('description')} className={inputClass} />
                    </label>
                    <label className='text-sm flex flex-col gap-1'>Asset (optional)
                        <input value={form.assetId} onChange={set('assetId')} placeholder='AST-2026-0142' className={inputClass} />
                    </label>
                    {apiMode ? (
                        <div className='sm:col-span-2 text-sm'>
                            <FileUploadField
                                label='Attachments (optional)'
                                deferred
                                pendingFiles={pendingFiles}
                                onPendingChange={setPendingFiles}
                                maxFiles={5}
                                disabled={busy || Boolean(raised)}
                            />
                        </div>
                    ) : (
                    <label className='text-sm flex flex-col gap-1'>Attachment
                        <input
                            type='file'
                            accept='image/png,image/jpeg,image/*,.png,.jpg,.jpeg,.pdf,application/pdf'
                            className={inputClass}
                            onChange={(event) => {
                                const file = event.target.files?.[0]
                                setForm((prev) => ({ ...prev, attachmentName: file?.name || '' }))
                            }}
                        />
                        {form.attachmentName ? (
                            <span className='text-xs text-[#667085]'>Selected: {form.attachmentName}</span>
                        ) : null}
                    </label>
                    )}
                </div>
                {raised ? (
                    <div role='alert' className='mt-4 text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-md px-3 py-2'>
                        Ticket {raised.ticketId} was raised, but these attachments were not saved: {attachError}
                    </div>
                ) : null}
                <div className='flex justify-end gap-3 mt-5'>
                    {raised ? (
                        <>
                            <button type='button' onClick={closeAfterPartial} disabled={busy} className='border border-[#515DEF] text-[#515DEF] px-4 py-2 rounded-md text-sm cursor-pointer disabled:opacity-60'>Close without attachments</button>
                            <button type='button' onClick={retryAttachments} disabled={busy} className='bg-[#515DEF] text-white px-4 py-2 rounded-md text-sm cursor-pointer disabled:opacity-60'>
                                {busy ? 'Uploading…' : 'Retry upload'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button type='button' onClick={onClose} className='border border-[#515DEF] text-[#515DEF] px-4 py-2 rounded-md text-sm cursor-pointer'>Cancel</button>
                            <button type='submit' disabled={busy} className='bg-[#515DEF] text-white px-4 py-2 rounded-md text-sm cursor-pointer disabled:opacity-60'>
                                {busy ? 'Raising…' : 'Raise Ticket'}
                            </button>
                        </>
                    )}
                </div>
            </form>
        </div>
    )
}
