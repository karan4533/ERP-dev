import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canEditWithoutApproval } from './approvalGates'

/**
 * Edit click helper: privileged roles run `onEdit` / navigate `editTo` immediately;
 * others open the Send-Request modal.
 */
export const useEditRequestFlow = () => {
    const { role } = useAuth()
    const navigate = useNavigate()
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [pending, setPending] = useState(null)
    const canDirectEdit = canEditWithoutApproval(role)

    const requestEdit = useCallback((options = {}) => {
        const { editTo, onEdit } = options
        if (canEditWithoutApproval(role)) {
            if (typeof onEdit === 'function') {
                onEdit()
                return
            }
            if (editTo) {
                navigate(editTo)
                return
            }
            // No editor wired — still do not open "Send Request to Super Admin".
            return
        }
        setPending({ editTo, onEdit })
        setEditRequestModal(true)
    }, [role, navigate])

    const confirmEditRequest = useCallback(() => {
        const next = pending
        setPending(null)
        setEditRequestModal(false)
        if (!next) return
        if (typeof next.onEdit === 'function') next.onEdit()
        else if (next.editTo) navigate(next.editTo)
    }, [pending, navigate])

    return {
        editRequestModal,
        setEditRequestModal,
        requestEdit,
        confirmEditRequest,
        canDirectEdit,
        pendingEditTo: pending?.editTo,
        onConfirmEditRequest: confirmEditRequest,
    }
}

export default useEditRequestFlow
