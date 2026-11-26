import { NavLink } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import Dialog from '../ui/Dialog'

const MdApprovalSubmitModal = ({ open, onClose, listPath }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title='Request submitted'
            description='The activity is now in the Managing Director approval queue.'
            size='sm'
            footer={(
                <>
                    <button type='button' onClick={onClose} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold'>Add another</button>
                    <NavLink to={listPath} className='inline-flex min-h-10 items-center rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>Back to list</NavLink>
                </>
            )}
        >
            <div className='flex items-center gap-3 rounded-lg border border-[#BFE3D2] bg-[#EFFAF4] p-4 text-sm text-[#165B3D]'>
                <CircleCheck aria-hidden='true' className='shrink-0' size={24} />
                <p>No further action is required until the request is reviewed.</p>
            </div>
        </Dialog>
    )
}

export default MdApprovalSubmitModal
