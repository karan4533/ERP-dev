import { useState } from 'react'
import { Check } from 'lucide-react'
import { ConfirmAction, Dialog, IntegrationNotice } from '../../../../Common/ui'

const fieldClass = 'min-h-11 w-full rounded-lg border border-[var(--erp-line-strong)] px-3 text-sm focus:border-[var(--erp-indigo)] focus:outline-none'
const INITIAL_FORM = { vehicle: 'TN58-AB-1023', type: 'Routine', date: '', description: '', vendor: '', cost: '' }

const LogDamageModal = ({ isOpen, onClose, onSave }) => {
    const [form, setForm] = useState(INITIAL_FORM)
    const [error, setError] = useState('')
    const [confirmOpen, setConfirmOpen] = useState(false)
    const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
    const closeModal = () => {
        setForm(INITIAL_FORM)
        setError('')
        setConfirmOpen(false)
        onClose()
    }
    const reviewRecord = (event) => {
        event.preventDefault()
        if (!form.date) return setError('Select the maintenance or damage date.')
        if (!form.description.trim()) return setError('Describe the work or damage.')
        if (!Number.isFinite(Number(form.cost)) || Number(form.cost) < 0) return setError('Enter a valid cost.')
        setError('')
        setConfirmOpen(true)
    }
    const confirmRecord = () => {
        onSave({
            vehicle: form.vehicle,
            type: form.type,
            date: new Date(`${form.date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            description: form.description.trim(),
            vendor: form.vendor.trim() || 'Not recorded',
            cost: `₹${Number(form.cost).toLocaleString('en-IN')}`,
        })
        closeModal()
    }

    return (
        <>
            <Dialog open={isOpen} onClose={closeModal} title='Add maintenance or damage record' description='Prepare a session-only record for workflow validation.' size='lg' footer={<><button type='button' onClick={closeModal} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold'>Cancel</button><button type='submit' form='add-local-maintenance-form' className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'><Check aria-hidden='true' size={16} /> Review record</button></>}>
                <form id='add-local-maintenance-form' onSubmit={reviewRecord} className='space-y-4'>
                    <IntegrationNotice state='demo' title='No expense is posted' description='This creates a session-only record. Evidence upload, vendor validation, approval and finance posting require connected services.' />
                    <div className='grid gap-4 sm:grid-cols-3'>
                        <label className='grid gap-1.5 text-sm font-semibold'>Vehicle<select value={form.vehicle} onChange={updateField('vehicle')} className={fieldClass}><option>TN58-AB-1023</option><option>TN58-AB-1018</option><option>TN58-AC-0976</option></select></label>
                        <label className='grid gap-1.5 text-sm font-semibold'>Record type<select value={form.type} onChange={updateField('type')} className={fieldClass}><option value='Routine'>Routine service</option><option>Repair</option><option>Damage</option></select></label>
                        <label className='grid gap-1.5 text-sm font-semibold'>Date<input required type='date' value={form.date} onChange={updateField('date')} className={fieldClass} /></label>
                    </div>
                    <label className='grid gap-1.5 text-sm font-semibold'>Description<textarea required rows='3' value={form.description} onChange={updateField('description')} className={`${fieldClass} py-3`} /></label>
                    <div className='grid gap-4 sm:grid-cols-2'><label className='grid gap-1.5 text-sm font-semibold'>Vendor / garage<input value={form.vendor} onChange={updateField('vendor')} className={fieldClass} /></label><label className='grid gap-1.5 text-sm font-semibold'>Cost (₹)<input required min='0' step='1' type='number' value={form.cost} onChange={updateField('cost')} className={fieldClass} /></label></div>
                    <button type='button' disabled title='Evidence upload requires connected document storage.' className='w-full rounded-lg border border-dashed border-[var(--erp-line-strong)] bg-[var(--erp-canvas)] px-4 py-5 text-sm font-semibold text-[var(--erp-muted)] opacity-70'>Evidence upload unavailable</button>
                    {error ? <p role='alert' className='rounded-lg border border-[#F6C9BD] bg-[#FFF5F2] px-3 py-2 text-sm text-[var(--erp-red)]'>{error}</p> : null}
                </form>
            </Dialog>
            <ConfirmAction open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmRecord} title={`Add ${form.type.toLowerCase()} record locally?`} description='This creates a session-only record and does not post an expense or enter an authoritative approval workflow.' confirmLabel='Confirm local record'><p>{form.vehicle} · ₹{Number(form.cost || 0).toLocaleString('en-IN')}</p></ConfirmAction>
        </>
    )
}

export default LogDamageModal
