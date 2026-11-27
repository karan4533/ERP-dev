import React, { useEffect, useMemo, useState } from 'react'
import { Check, Image, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatCurrency } from '../../financeDomain/financeHelpers'
import { PAYMENT_MODES, SOURCE_MODULES, TRANSACTION_DIRECTIONS, TRANSACTION_STATUSES } from '../../financeDomain/financeConstants'
import { getCampusMemory, hydrateCampusKey, usesCampusApiForKey } from '../../../../services/campusJsonStore'

const VEHICLES_KEY = 'schoolerp-transport-vehicles-v1'

const LogDamageModal = ({ isOpen, onClose }) => {
    const {
        transportFleet,
        transportMaintenance,
        setTransportMaintenance,
        addManualEntry,
    } = useFinance()
    const [opsRegNos, setOpsRegNos] = useState([])
    const [vehicle, setVehicle] = useState('')
    const [recordType, setRecordType] = useState('Routine Service')
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
    const [description, setDescription] = useState('')
    const [vendor, setVendor] = useState('')
    const [cost, setCost] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isOpen) return undefined
        let cancelled = false
        ;(async () => {
            if (usesCampusApiForKey(VEHICLES_KEY)) {
                await hydrateCampusKey(VEHICLES_KEY, [])
            }
            if (cancelled) return
            const rows = getCampusMemory(VEHICLES_KEY) || []
            setOpsRegNos(
                rows
                    .map((row) => row.vehicleNumber || row.regNo || '')
                    .map((value) => String(value).trim())
                    .filter(Boolean),
            )
        })()
        return () => { cancelled = true }
    }, [isOpen])

    const fleetOptions = useMemo(() => {
        const fromFinance = (transportFleet || []).map((row) => row.regNo).filter(Boolean)
        const merged = [...new Set([...fromFinance, ...opsRegNos])]
        return merged.length ? merged : ['Unassigned']
    }, [opsRegNos, transportFleet])

    if (!isOpen) return null

    const selectedVehicle = vehicle || fleetOptions[0]

    const handleSave = () => {
        const amount = Number(cost) || 0
        if (!description.trim()) {
            toast.error('Description is required.')
            return
        }
        if (amount <= 0) {
            toast.error('Enter a cost greater than zero.')
            return
        }
        setSaving(true)
        const row = {
            id: `TM-${Date.now().toString().slice(-8)}`,
            vehicle: selectedVehicle,
            type: recordType,
            date,
            description: description.trim(),
            vendor: vendor.trim() || '—',
            cost: formatCurrency(amount),
            amount,
            status: 'Logged',
        }
        setTransportMaintenance([row, ...(transportMaintenance || [])])
        addManualEntry({
            date,
            amount,
            paymentMode: PAYMENT_MODES.CASH,
            narration: `${recordType} — ${selectedVehicle}${vendor.trim() ? ` · ${vendor.trim()}` : ''}: ${description.trim()}`,
            category: 'Transport Maintenance',
            entryType: 'Expense',
            direction: TRANSACTION_DIRECTIONS.OUT,
            status: TRANSACTION_STATUSES.POSTED,
            sourceModule: SOURCE_MODULES.TRANSPORT,
            createdBy: 'Transport Finance',
        })
        setSaving(false)
        toast.success('Maintenance logged — Day Book / GL will sync via finance API.')
        setDescription('')
        setCost('')
        setVendor('')
        onClose()
    }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <h2 className='text-lg font-semibold text-[#1E1E1E]'>Log Damage / Maintenance Record</h2>
                    <button
                        type='button'
                        onClick={onClose}
                        className='text-[#667085] hover:text-[#FF5722] transition-colors cursor-pointer'
                        aria-label='Close modal'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='px-6 py-5 space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Vehicle</label>
                            <select
                                value={selectedVehicle}
                                onChange={(event) => setVehicle(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            >
                                {fleetOptions.map((reg) => (
                                    <option key={reg} value={reg}>{reg}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Record Type</label>
                            <select
                                value={recordType}
                                onChange={(event) => setRecordType(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            >
                                <option>Routine Service</option>
                                <option>Repair</option>
                                <option>Damage</option>
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Date</label>
                            <input
                                type='date'
                                value={date}
                                onChange={(event) => setDate(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            />
                        </div>
                    </div>

                    <div className='flex flex-col gap-y-2'>
                        <label className='text-sm font-medium text-[#808080]'>Description</label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder='Describe the issue / service performed...'
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF] resize-none'
                        />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Vendor / Garage</label>
                            <input
                                type='text'
                                value={vendor}
                                onChange={(event) => setVendor(event.target.value)}
                                placeholder='Garage name'
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Cost (₹)</label>
                            <input
                                type='number'
                                value={cost}
                                onChange={(event) => setCost(event.target.value)}
                                placeholder='0'
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            />
                        </div>
                    </div>

                    <div className='border-2 border-dashed border-[#515DEF]/30 rounded-2xl bg-[#515DEF]/5 px-6 py-8 text-center'>
                        <Image size={28} className='mx-auto text-[#667085]' />
                        <p className='text-sm text-[#667085] mt-2'>
                            Attachments stay local for now — cost still posts to Day Book / GL via finance API.
                        </p>
                    </div>
                </div>

                <div className='flex justify-end gap-3 px-6 py-4 border-t border-[#F2F4F7]'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        disabled={saving}
                        onClick={handleSave}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-60'
                    >
                        <Check size={16} />
                        {saving ? 'Saving…' : 'Save Record'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default LogDamageModal
