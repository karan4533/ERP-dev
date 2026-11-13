import React, { useRef } from 'react'
import { UploadCloud, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react'
import { toast } from 'react-toastify'
import RecipientSelect from './RecipientSelect'

const EscalationForm = ({ form, onChange, roleConfig, readOnly = false }) => {
    const fileInputRef = useRef(null)

    const handleChange = (field) => (event) => {
        onChange?.({ ...form, [field]: event.target.value })
    }

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
        if (!validTypes.includes(file.type) && !file.name.match(/\.(png|jpg|jpeg|pdf)$/i)) {
            toast.error('Only PNG, JPG, or PDF files are supported.')
            return
        }

        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        onChange?.({
            ...form,
            attachment: file.name,
            attachmentSize: `${Math.ceil(file.size / 1024)} KB`,
            attachmentType: file.type,
            attachmentPreview: previewUrl,
        })
        toast.success(`Attached ${file.name}`)
    }

    const handlePaste = (e) => {
        if (readOnly) return
        const items = e.clipboardData?.items
        if (!items) return

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile()
                if (blob) {
                    const pasteName = `screenshot-${new Date().getTime()}.png`
                    const previewUrl = URL.createObjectURL(blob)
                    onChange?.({
                        ...form,
                        attachment: pasteName,
                        attachmentSize: `${Math.ceil(blob.size / 1024)} KB`,
                        attachmentType: blob.type || 'image/png',
                        attachmentPreview: previewUrl,
                    })
                    toast.success('Screenshot pasted from clipboard!')
                    e.preventDefault()
                    break
                }
            }
        }
    }

    const handleRemoveAttachment = () => {
        if (form.attachmentPreview) {
            URL.revokeObjectURL(form.attachmentPreview)
        }
        onChange?.({
            ...form,
            attachment: '',
            attachmentSize: '',
            attachmentType: '',
            attachmentPreview: null,
        })
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const inputClass =
        'text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full disabled:bg-[#f9fafb] disabled:cursor-not-allowed'
    const labelClass = 'text-base font-medium text-[#808080]'

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6'>
            {!readOnly && roleConfig?.hierarchyLabel && (
                <div className='sm:col-span-2 rounded-lg border border-[#515DEF33] bg-[#F8F9FF] px-4 py-3 text-sm text-[#667085]'>
                    Escalations are routed automatically: {roleConfig.hierarchyLabel}
                </div>
            )}
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='escalation-recipient-role' className={labelClass}>Recipient Role</label>
                <input
                    id='escalation-recipient-role'
                    type='text'
                    value={roleConfig?.escalatesTo ?? form.escalatedTo ?? '—'}
                    disabled
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='escalation-date' className={labelClass}>Escalation Date</label>
                <input
                    id='escalation-date'
                    type='date'
                    value={form.escalationDate}
                    onChange={handleChange('escalationDate')}
                    disabled={readOnly}
                    className={inputClass}
                />
            </div>
            {!readOnly && roleConfig?.escalatesToRoleKey ? (
                <RecipientSelect
                    targetRoleKey={roleConfig.escalatesToRoleKey}
                    roleLabel={roleConfig.escalatesTo}
                    value={form.recipientUserId || ''}
                    onChange={(recipientUserId) => onChange?.({ ...form, recipientUserId })}
                />
            ) : (
                <div className='flex flex-col gap-y-2 sm:col-span-2'>
                    <label htmlFor='escalation-assigned-recipient' className={labelClass}>Assigned Recipient</label>
                    <input
                        id='escalation-assigned-recipient'
                        type='text'
                        value={form.escalatedToUserName || form.escalatedTo || '—'}
                        disabled
                        className={inputClass}
                    />
                </div>
            )}
            <div className='flex flex-col gap-y-2 sm:col-span-2'>
                <label htmlFor='escalation-description' className={labelClass}>Description</label>
                <input
                    id='escalation-description'
                    type='text'
                    value={form.description}
                    onChange={handleChange('description')}
                    disabled={readOnly}
                    placeholder='Brief summary of the escalation'
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2 sm:col-span-2'>
                <label htmlFor='escalation-full-details' className={labelClass}>Full Details</label>
                <textarea
                    id='escalation-full-details'
                    value={form.fullDescription}
                    onChange={handleChange('fullDescription')}
                    disabled={readOnly}
                    rows={4}
                    placeholder='Provide complete details of the issue'
                    className={inputClass}
                />
            </div>
            <div className='flex flex-col gap-y-2 sm:col-span-2'>
                <label htmlFor='escalation-remarks' className={labelClass}>Remarks</label>
                <textarea
                    id='escalation-remarks'
                    value={form.remarks}
                    onChange={handleChange('remarks')}
                    disabled={readOnly}
                    rows={3}
                    placeholder='Optional remarks or reference notes'
                    className={inputClass}
                />
            </div>

            {/* Evidence & Screenshot Attachment Field */}
            <div className='flex flex-col gap-y-2 sm:col-span-2' onPaste={handlePaste}>
                <div className='flex items-center justify-between'>
                    <label className={labelClass}>Evidence / Attachment (Screenshot, PNG, JPG, PDF)</label>
                    {!readOnly && (
                        <span className='text-[11px] text-slate-400 font-normal'>
                            Tip: Press <kbd className='px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]'>Ctrl+V</kbd> to paste a screenshot
                        </span>
                    )}
                </div>

                {readOnly ? (
                    form.attachment || form.screenshot ? (
                        <div className='flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg'>
                            {form.attachmentType?.startsWith('image/') || form.attachment?.match(/\.(png|jpg|jpeg)$/i) ? (
                                <ImageIcon className='w-5 h-5 text-indigo-600' />
                            ) : (
                                <FileText className='w-5 h-5 text-blue-600' />
                            )}
                            <div className='flex-1 min-w-0'>
                                <p className='text-sm font-semibold text-slate-800 truncate'>{form.attachment || form.screenshot}</p>
                                {form.attachmentSize && <p className='text-xs text-slate-400'>{form.attachmentSize}</p>}
                            </div>
                        </div>
                    ) : (
                        <p className='text-xs text-slate-400 italic'>No attachment provided.</p>
                    )
                ) : form.attachment ? (
                    <div className='flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl'>
                        <div className='flex items-center gap-3 min-w-0'>
                            {form.attachmentPreview ? (
                                <img src={form.attachmentPreview} alt='Preview' className='w-12 h-12 object-cover rounded-lg border border-indigo-200' />
                            ) : (
                                <div className='w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600'>
                                    <Paperclip size={18} />
                                </div>
                            )}
                            <div className='min-w-0'>
                                <p className='text-xs font-semibold text-slate-800 truncate'>{form.attachment}</p>
                                <p className='text-[10px] text-slate-400'>{form.attachmentSize || 'Uploaded file'}</p>
                            </div>
                        </div>
                        <button
                            type='button'
                            onClick={handleRemoveAttachment}
                            className='p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition'
                            title='Remove file'
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className='border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition flex flex-col items-center justify-center gap-1.5'
                    >
                        <input
                            ref={fileInputRef}
                            type='file'
                            accept='.png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf'
                            onChange={handleFileSelect}
                            className='hidden'
                        />
                        <UploadCloud className='w-6 h-6 text-indigo-500 mb-0.5' />
                        <span className='text-xs font-medium text-slate-700'>Click to upload file (.png, .jpg, .pdf)</span>
                        <span className='text-[11px] text-slate-400'>or paste a copied screenshot directly (Ctrl+V)</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default EscalationForm
