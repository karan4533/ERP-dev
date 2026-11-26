import Dialog from '../ui/Dialog'

const Stat = ({ label, value, tone = 'text-[var(--erp-ink)]' }) => (
    <div className='rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-3 text-center'>
        <span className='block text-xs text-[var(--erp-muted)]'>{label}</span>
        <span className={`text-lg font-semibold ${tone}`}>{value}</span>
    </div>
)

const SubmitMarksDialog = ({ open, onClose, onConfirm, stats, examLabel }) => (
    <Dialog
        open={open}
        onClose={onClose}
        title='Submit marks for validation?'
        description={`${stats?.marksEntered ?? 0} of ${stats?.totalStudents ?? 0} student records are ready for ${examLabel || 'this exam'}.`}
        size='md'
        footer={(
            <>
                <button type='button' onClick={onClose} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold'>Review marks</button>
                <button type='button' onClick={onConfirm} className='min-h-10 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>Submit marks</button>
            </>
        )}
    >
        <p className='mb-4 text-sm text-[var(--erp-slate)]'>
            Submission sends the current entries to the validation queue. Review pending and absent records before continuing.
        </p>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            <Stat label='Total' value={stats?.totalStudents ?? 0} />
            <Stat label='Entered' value={stats?.marksEntered ?? 0} tone='text-[#17724A]' />
            <Stat label='Absent' value={stats?.absent ?? 0} tone='text-[var(--erp-amber)]' />
            <Stat label='Pending' value={stats?.pending ?? 0} tone='text-[var(--erp-red)]' />
        </div>
    </Dialog>
)

export default SubmitMarksDialog
