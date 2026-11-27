import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, CircleAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { canEditWithoutApproval } from './approvalGates'

/**
 * Edit confirmation / approval request.
 * Privileged roles (Super Admin, Admin, Principal, …) never see "Send Request to Super Admin".
 * Pass `editTo` or `onConfirm` so Edit can navigate / run immediately for those roles.
 */
const EditRequestModal = ({
    editRequestModal,
    setEditRequestModal,
    onConfirm,
    editTo,
    title,
    message,
    confirmLabel,
    autoRunForPrivileged = true,
}) => {
    const { role } = useAuth()
    const navigate = useNavigate()
    const direct = canEditWithoutApproval(role)

    const runAction = () => {
        setEditRequestModal(false)
        if (typeof onConfirm === 'function') {
            onConfirm()
            return
        }
        if (editTo) {
            navigate(editTo)
        }
    }

    useEffect(() => {
        if (!editRequestModal || !direct || !autoRunForPrivileged) return undefined
        // Privileged roles never see "Send Request to Super Admin".
        // With an action → run it; without → just dismiss (callers should pass editTo/onConfirm).
        if (typeof onConfirm === 'function' || editTo) runAction()
        else setEditRequestModal(false)
        return undefined
        // Intentionally only when the modal opens for a privileged role.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editRequestModal, direct, autoRunForPrivileged, editTo])

    if (!editRequestModal) return null

    // Privileged path handled in the effect — never flash the approval dialog.
    if (direct && autoRunForPrivileged) {
        return null
    }

    const resolvedTitle = title
        ?? (direct ? 'Edit this record?' : 'Send Edit Request?')
    const resolvedMessage = message
        ?? (direct
            ? 'You can edit this record directly. Continue?'
            : 'Do you want to send this edit request to the Super Admin for approval?')
    const resolvedConfirm = confirmLabel
        ?? (direct ? 'Continue' : 'Send Request')

    return (
        <div className='fixed inset-0 z-500 flex items-center justify-center'>
            <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setEditRequestModal(false)}
            />

            <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-lg p-5 py-4">
                <div className='flex justify-end items-center'>
                    <button type='button' onClick={() => setEditRequestModal(false)} className='hover:text-red-500 cursor-pointer'>
                        <X />
                    </button>
                </div>
                <div className='pt-4 text-center'>
                    <div className='flex justify-center items-center mb-4'>
                        <CircleAlert size={70} strokeWidth={1.5} className='text-[#515DEF]' />
                    </div>
                    <h3 className='text-xl font-medium text-[#77767A]'>{resolvedTitle}</h3>
                    <p className='text-base text-[#77767A] font-medium mt-2'>{resolvedMessage}</p>

                    <div className='flex gap-x-4 mt-10'>
                        <button
                            type='button'
                            onClick={() => setEditRequestModal(false)}
                            className='bg-white text-[#77767A] text-sm text-center px-4 py-2.5 rounded-md border border-[#77767A] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer w-full'
                        >
                            Cancel
                        </button>
                        <button
                            type='button'
                            onClick={runAction}
                            className='bg-[#515DEF] text-white text-sm text-center px-4 py-2.5 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer w-full'
                        >
                            {resolvedConfirm}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditRequestModal
