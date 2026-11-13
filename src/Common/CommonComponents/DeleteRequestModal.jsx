import React from 'react'
import ConfirmAction from '../ui/ConfirmAction'
import { useAuth } from '../../context/AuthContext'
import { canRoleDelete } from '../RBAC/actionPermissions'

const DeleteRequestModal = ({
    deleteRequestModal,
    setDeleteRequestModal,
    onConfirm,
    title = 'Confirm Record Deletion',
    message = 'Are you sure you want to delete this record? This action cannot be undone.',
    confirmLabel = 'Delete',
}) => {
    const { role } = useAuth()
    const isAuthorized = canRoleDelete(role)

    if (!isAuthorized) {
        return null
    }

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm()
            return
        }
        setDeleteRequestModal(false)
    }

    return (
        <ConfirmAction
            open={deleteRequestModal}
            onClose={() => setDeleteRequestModal(false)}
            onConfirm={handleConfirm}
            title={title}
            confirmLabel={confirmLabel}
            tone='danger'
        >
            {message}
        </ConfirmAction>
    )
}

export default DeleteRequestModal
