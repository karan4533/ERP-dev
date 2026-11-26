import React, { useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { Camera, Image as ImageIcon, Paperclip, Upload, Users, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'
import Dialog from '../ui/Dialog'
import { createTicket } from '../demoDomain/itTickets'
import { ENTERPRISE_EMPLOYEES } from '../AttendanceAndLeave/attendanceLeaveData'

const ROLE_LABEL = {
    [ROLES.SUPER_ADMIN]: 'Super Admin',
    [ROLES.ADMIN]: 'Admin',
    [ROLES.TEACHER]: 'Teacher',
    [ROLES.COORDINATOR]: 'Coordinator',
    [ROLES.PRINCIPAL]: 'Principal',
    [ROLES.DIRECTOR]: 'Director',
    [ROLES.PRM]: 'Front Office',
    [ROLES.LIBRARIAN]: 'Librarian',
    [ROLES.STUDENT]: 'Student',
    [ROLES.PARENT]: 'Parent',
    [ROLES.HR]: 'HR',
    [ROLES.ACCOUNT_HEAD]: 'Finance Head',
    [ROLES.TRANSPORT_MANAGER]: 'Transport Manager',
    [ROLES.HOUSEKEEPING_MANAGER]: 'Housekeeping Manager',
    [ROLES.IT_SUPPORT_MANAGER]: 'IT Support Manager',
    [ROLES.GATEKEEPER]: 'Gate Keeper',
    [ROLES.GATEKEEPER_MANAGER]: 'Gate Keeper Manager',
}

const CATEGORIES = ['Hardware', 'Software', 'Network', 'Printer', 'Other']
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
const inputClass = 'text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full focus:border-[var(--erp-indigo)] focus:outline-none'

export default function RaiseItTicketModal({ open, onClose }) {
    const { role, name, email } = useAuth()
    const fileInputRef = useRef(null)
    const [selectedMembers, setSelectedMembers] = useState([])
    const [attachment, setAttachment] = useState(null) // { name, size, type, previewUrl }
    const [form, setForm] = useState({
        category: 'Hardware',
        subject: '',
        description: '',
        priority: 'Medium',
        department: '',
        assetId: '',
        attachmentName: '',
    })

    const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

    // Handle file selection (supporting .png, .jpg, .jpeg, .pdf)
    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            toast.error('Only PNG, JPG, JPEG images and PDF documents are supported.')
            return
        }

        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        setAttachment({
            name: file.name,
            size: `${Math.ceil(file.size / 1024)} KB`,
            type: file.type,
            previewUrl,
        })
        setForm((prev) => ({ ...prev, attachmentName: file.name }))
    }

    // Handle clipboard paste for screenshots (Ctrl+V directly into modal)
    const handlePaste = (e) => {
        const items = e.clipboardData?.items
        if (!items) return
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile()
                if (blob) {
                    const pasteName = `screenshot-${new Date().getTime()}.png`
                    const previewUrl = URL.createObjectURL(blob)
                    setAttachment({
                        name: pasteName,
                        size: `${Math.ceil(blob.size / 1024)} KB`,
                        type: blob.type || 'image/png',
                        previewUrl,
                    })
                    setForm((prev) => ({ ...prev, attachmentName: pasteName }))
                    toast.success('Screenshot pasted from clipboard!')
                    e.preventDefault()
                    break
                }
            }
        }
    }

    const removeAttachment = () => {
        if (attachment?.previewUrl) {
            URL.revokeObjectURL(attachment.previewUrl)
        }
        setAttachment(null)
        setForm((prev) => ({ ...prev, attachmentName: '' }))
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleToggleMember = (emp) => {
        setSelectedMembers((prev) => {
            const exists = prev.some((m) => m.id === emp.id)
            if (exists) {
                return prev.filter((m) => m.id !== emp.id)
            }
            return [...prev, { id: emp.id, name: emp.name, role: emp.designation || emp.roleKey }]
        })
    }

    const submit = (event) => {
        event.preventDefault()
        if (!form.subject.trim() || !form.description.trim()) {
            toast.error('Subject and description are required.')
            return
        }
        const ticket = createTicket({
            requesterName: name || email || 'Demo User',
            requesterRole: ROLE_LABEL[role] || role || 'User',
            department: form.department || 'General',
            issueType: form.category,
            subject: form.subject.trim(),
            description: form.description.trim(),
            priority: form.priority,
            assetId: form.assetId,
            attachmentName: attachment?.name || form.attachmentName || '',
            involvedMembers: selectedMembers,
        })
        toast.success(`Ticket ${ticket.ticketId} sent to IT Support.`)
        setForm({ category: 'Hardware', subject: '', description: '', priority: 'Medium', department: '', assetId: '', attachmentName: '' })
        setAttachment(null)
        setSelectedMembers([])
        onClose()
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title='Raise IT ticket'
            description='The ticket appears immediately for the IT Support Manager in this browser.'
            size='md'
            footer={(
                <>
                    <button type='button' onClick={onClose} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer'>Cancel</button>
                    <button type='submit' form='raise-it-ticket-form' className='min-h-10 rounded-lg bg-[var(--erp-indigo)] px-5 text-sm font-semibold text-white hover:opacity-90 transition cursor-pointer'>Submit ticket</button>
                </>
            )}
        >
            <form id='raise-it-ticket-form' onSubmit={submit} onPaste={handlePaste} className='space-y-3.5 mt-2'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <label className='text-xs font-semibold text-slate-700 flex flex-col gap-1'>Category
                        <select value={form.category} onChange={set('category')} className={inputClass}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
                    </label>
                    <label className='text-xs font-semibold text-slate-700 flex flex-col gap-1'>Priority
                        <select value={form.priority} onChange={set('priority')} className={inputClass}>{PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select>
                    </label>
                    <label className='text-xs font-semibold text-slate-700 flex flex-col gap-1 sm:col-span-2'>Subject
                        <input required value={form.subject} onChange={set('subject')} placeholder='Summary of the problem' className={inputClass} />
                    </label>
                    <label className='text-xs font-semibold text-slate-700 flex flex-col gap-1 sm:col-span-2'>Description
                        <textarea required rows={3} value={form.description} onChange={set('description')} placeholder='Details, steps to reproduce, or error messages' className={inputClass} />
                    </label>
                    <label className='text-xs font-semibold text-slate-700 flex flex-col gap-1'>Department
                        <input value={form.department} onChange={set('department')} placeholder='e.g. Science Lab, High School' className={inputClass} />
                    </label>
                    <label className='text-xs font-semibold text-slate-700 flex flex-col gap-1'>Asset (optional)
                        <input value={form.assetId} onChange={set('assetId')} placeholder='AST-2026-0142' className={inputClass} />
                    </label>

                    {/* Multi-Member Selection */}
                    <div className='sm:col-span-2 space-y-1.5'>
                        <label className='text-xs font-semibold text-slate-700 flex items-center justify-between'>
                            <span className='flex items-center gap-1.5'>
                                <Users size={14} className='text-[var(--erp-indigo)]' />
                                <span>Tag / Involve Team Members ({selectedMembers.length})</span>
                            </span>
                            <span className='text-[10px] text-slate-400 font-normal'>Multi-select supported</span>
                        </label>
                        <div className='flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl min-h-10'>
                            {selectedMembers.map((m) => (
                                <span key={m.id} className='inline-flex items-center gap-1 text-[11px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-medium'>
                                    {m.name} ({m.role})
                                    <button type='button' onClick={() => handleToggleMember(m)} className='hover:text-rose-600 cursor-pointer'>
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            <select
                                onChange={(e) => {
                                    const emp = ENTERPRISE_EMPLOYEES.find((emp) => emp.id === e.target.value)
                                    if (emp) handleToggleMember(emp)
                                    e.target.value = ''
                                }}
                                className='text-xs bg-transparent border-0 text-slate-600 focus:outline-none cursor-pointer'
                            >
                                <option value=''>+ Add member to ticket...</option>
                                {ENTERPRISE_EMPLOYEES.map((emp) => (
                                    <option key={emp.id} value={emp.id} disabled={selectedMembers.some((m) => m.id === emp.id)}>
                                        {emp.name} — {emp.designation} ({emp.department})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Screenshot & File Upload Control */}
                    <div className='sm:col-span-2 space-y-1.5'>
                        <label className='text-xs font-semibold text-slate-700 flex items-center justify-between'>
                            <span className='flex items-center gap-1.5'>
                                <Paperclip size={14} className='text-[var(--erp-indigo)]' />
                                <span>Screenshot or Document Attachment (.png, .jpg, .pdf)</span>
                            </span>
                            <span className='text-[10px] text-slate-400 font-normal'>Ctrl+V paste screenshot anywhere</span>
                        </label>

                        {!attachment ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className='border-2 border-dashed border-slate-200 hover:border-[var(--erp-indigo)] rounded-xl p-4 text-center cursor-pointer transition bg-slate-50/50 hover:bg-slate-50 flex flex-col items-center justify-center gap-1.5'
                            >
                                <div className='flex items-center gap-2 text-slate-500'>
                                    <Upload size={18} className='text-[var(--erp-indigo)]' />
                                    <span className='text-xs font-medium text-slate-700'>Click to upload or drag screenshot (.png, .jpg, .pdf)</span>
                                </div>
                                <p className='text-[10px] text-slate-400'>
                                    Or paste screenshot directly from your clipboard (Ctrl+V)
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type='file'
                                    accept='.png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf'
                                    className='hidden'
                                    onChange={handleFileChange}
                                />
                            </div>
                        ) : (
                            <div className='flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl'>
                                <div className='flex items-center gap-2.5 overflow-hidden'>
                                    {attachment.previewUrl ? (
                                        <img src={attachment.previewUrl} alt='preview' className='w-9 h-9 object-cover rounded-lg border border-slate-200' />
                                    ) : (
                                        <div className='w-9 h-9 bg-indigo-50 text-[var(--erp-indigo)] rounded-lg flex items-center justify-center font-bold text-xs'>
                                            PDF
                                        </div>
                                    )}
                                    <div className='truncate text-xs'>
                                        <span className='font-semibold text-slate-800 block truncate'>{attachment.name}</span>
                                        <span className='text-[10px] text-slate-400'>{attachment.size}</span>
                                    </div>
                                </div>
                                <button
                                    type='button'
                                    onClick={removeAttachment}
                                    className='text-slate-400 hover:text-rose-600 p-1 rounded-lg transition'
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </Dialog>
    )
}
