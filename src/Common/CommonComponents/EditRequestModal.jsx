import React from 'react'
import ConfirmAction from '../ui/ConfirmAction'

const EditRequestModal = ({ editRequestModal, setEditRequestModal, onConfirm }) => {
    const close = () => setEditRequestModal(false)
    const confirm = () => {
        onConfirm?.()
        close()
    }

    return (
        <ConfirmAction
            open={editRequestModal}
            onClose={close}
            onConfirm={confirm}
            title='Send edit request?'
            confirmLabel='Send request'
        >
            The proposed changes will be sent to the Super Admin approval queue. The current record remains unchanged until approval.
        </ConfirmAction>
    )
}

export default EditRequestModal
