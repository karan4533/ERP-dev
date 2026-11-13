import { useState } from 'react'
import { Check } from 'lucide-react'
import { ConfirmAction, Dialog, IntegrationNotice } from '../../../../Common/ui'

const fieldClass = 'min-h-11 w-full rounded-lg border border-[var(--erp-line-strong)] px-3 text-sm focus:border-[var(--erp-indigo)] focus:outline-none'
const INITIAL_FORM = { regNo: '', type: 'Bus', capacity: '', route: 'Unassigned', driver: 'Unassigned', purchaseDate: '', insuranceValidTill: '', fitnessValidTill: '' }

const AddVehicleModal = ({ isOpen, onClose, onSave }) => {
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
    const reviewVehicle = (event) => {
        event.preventDefault()
        if (!form.regNo.trim()) return setError('Enter the vehicle registration number.')
        if (!Number.isFinite(Number(form.capacity)) || Number(form.capacity) < 1) return setError('Enter a valid seating capacity.')
        setError('')
        setConfirmOpen(true)
    }
    const confirmVehicle = () => {
        const driver = form.driver === 'Unassigned' ? '—' : form.driver
        onSave({
            regNo: form.regNo.trim().toUpperCase(),
            type: form.type,
            route: form.route,
            driver,
            driverInitials: driver === '—' ? null : driver.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
            capacity: Number(form.capacity),
            purchaseDate: form.purchaseDate || 'Not recorded',
            insuranceValidTill: form.insuranceValidTill || 'Not recorded',
            fitnessValidTill: form.fitnessValidTill || 'Not recorded',
        })
        closeModal()
    }

    return (
        <>
            <Dialog open={isOpen} onClose={closeModal} title='Add local vehicle' description='Prepare a session-only fleet record for UI validation.' size='lg' footer={<><button type='button' onClick={closeModal} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold'>Cancel</button><button type='submit' form='add-local-vehicle-form' className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'><Check aria-hidden='true' size={16} /> Review vehicle</button></>}>
                <form id='add-local-vehicle-form' onSubmit={reviewVehicle} className='space-y-4'>
                    <IntegrationNotice state='demo' title='No asset is provisioned' description='This form adds a browser-session record only. Production save must validate uniqueness, documents, permissions, audit evidence and downstream route allocation.' />
                    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        <label className='grid gap-1.5 text-sm font-semibold'>Registration number<input required value={form.regNo} onChange={updateField('regNo')} placeholder='TN58-AB-1023' className={fieldClass} /></label>
                        <label className='grid gap-1.5 text-sm font-semibold'>Vehicle type<select value={form.type} onChange={updateField('type')} className={fieldClass}><option>Bus</option><option>Van</option></select></label>
                        <label className='grid gap-1.5 text-sm font-semibold'>Seating capacity<input required min='1' type='number' value={form.capacity} onChange={updateField('capacity')} className={fieldClass} /></label>
                        <label className='grid gap-1.5 text-sm font-semibold'>Assigned route<select value={form.route} onChange={updateField('route')} className={fieldClass}><option>Unassigned</option><option>Route 1</option><option>Route 2</option></select></label>
                        <label className='grid gap-1.5 text-sm font-semibold'>Assigned driver<select value={form.driver} onChange={updateField('driver')} className={fieldClass}><option>Unassigned</option><option>Murugan K.</option><option>Selvam R.</option></select></label>
                        <label className='grid gap-1.5 text-sm font-semibold'>Purchase date<input type='date' value={form.purchaseDate} onChange={updateField('purchaseDate')} className={fieldClass} /></label>
                        <label className='grid gap-1.5 text-sm font-semibold'>Insurance valid till<input type='date' value={form.insuranceValidTill} onChange={updateField('insuranceValidTill')} className={fieldClass} /></label>
                        <label className='grid gap-1.5 text-sm font-semibold'>Fitness valid till<input type='date' value={form.fitnessValidTill} onChange={updateField('fitnessValidTill')} className={fieldClass} /></label>
                    </div>
                    {error ? <p role='alert' className='rounded-lg border border-[#F6C9BD] bg-[#FFF5F2] px-3 py-2 text-sm text-[var(--erp-red)]'>{error}</p> : null}
                </form>
            </Dialog>
            <ConfirmAction open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmVehicle} title={`Add ${form.regNo.trim().toUpperCase() || 'this vehicle'} locally?`} description='This creates a session-only record and does not update any authoritative fleet or finance service.' confirmLabel='Confirm local vehicle'><p>{form.type} · {form.capacity || '0'} seats · {form.route}</p></ConfirmAction>
        </>
    )
}

export default AddVehicleModal
