import { CircleAlert } from 'lucide-react'
import Dialog from './Dialog'

const ConfirmAction = ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'primary',
    busy = false,
    confirmDisabled = false,
    children,
}) => (
    <Dialog
        open={open}
        onClose={onClose}
        title={title}
        description={description}
        size='sm'
        closeOnBackdrop={!busy}
        closeOnEscape={!busy}
        footer={(
            <>
                <button
                    type='button'
                    onClick={() => onClose?.('cancel')}
                    disabled={busy}
                    className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-ink)] hover:bg-[var(--erp-canvas)]'
                >
                    {cancelLabel}
                </button>
                <button
                    type='button'
                    onClick={onConfirm}
                    disabled={busy || confirmDisabled}
                    className={`min-h-10 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-60 ${tone === 'danger' ? 'bg-[var(--erp-red)]' : 'bg-[var(--erp-indigo)]'}`}
                >
                    {busy ? 'Working…' : confirmLabel}
                </button>
            </>
        )}
    >
        <div className='flex items-start gap-3'>
            <span className='inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF3E8] text-[var(--erp-amber)]'>
                <CircleAlert aria-hidden='true' size={20} />
            </span>
            <div className='min-w-0 text-sm text-[var(--erp-slate)]'>{children}</div>
        </div>
    </Dialog>
)

export default ConfirmAction
