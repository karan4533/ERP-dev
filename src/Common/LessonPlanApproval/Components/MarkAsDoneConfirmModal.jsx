import React, { useState } from 'react'
import Dialog from '../../ui/Dialog'

const MarkAsDoneConfirmModal = ({ open, plan, onCancel, onConfirm }) => {
    const [remarks, setRemarks] = useState('')

    if (!open || !plan) return null

    const handleConfirm = () => {
        onConfirm(remarks)
        setRemarks('')
    }

    const handleCancel = () => {
        setRemarks('')
        onCancel()
    }

    return (
        <Dialog
            open={open}
            onClose={handleCancel}
            title='Mark lesson plan as done?'
            description={`Confirm completion for ${plan.subject}, Class ${plan.className}, Section ${plan.section}.`}
            size='sm'
            footer={(
                <>
                    <button type='button' onClick={handleCancel} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold'>Cancel</button>
                    <button type='button' onClick={handleConfirm} className='min-h-10 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>Confirm completion</button>
                </>
            )}
        >
                    <div>
                        <label htmlFor='completion-remarks' className='block text-sm font-medium text-[#1E1E1E] mb-2'>
                            Remarks <span className='text-[#808080] font-normal'>(optional)</span>
                        </label>
                        <textarea
                            id='completion-remarks'
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={3}
                            placeholder='Add a note about how this went…'
                            className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-2 focus:outline-none focus:border-[#515DEF] resize-none'
                        />
                    </div>
        </Dialog>
    )
}

export default MarkAsDoneConfirmModal
