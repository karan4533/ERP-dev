import React, { useState } from 'react'
import { Check, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { useFinance } from '../../financeDomain/FinanceContext'

const AddVehicleModal = ({ isOpen, onClose }) => {
    const { transportFleet, setTransportFleet } = useFinance()
    const [regNo, setRegNo] = useState('')
    const [type, setType] = useState('Bus')
    const [route, setRoute] = useState('Route 1')
    const [driver, setDriver] = useState('Murugan K.')

    if (!isOpen) return null

    const handleSave = () => {
        if (!regNo.trim()) {
            toast.error('Registration number is required.')
            return
        }
        const initials = driver
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() || '')
            .join('')
        const vehicle = {
            id: `V-${Date.now().toString().slice(-5)}`,
            regNo: regNo.trim().toUpperCase(),
            type,
            route,
            driver,
            driverInitials: initials || 'DR',
            lastService: '—',
            nextServiceDue: '—',
            odometer: '0 km',
            status: 'Active',
        }
        setTransportFleet([vehicle, ...(transportFleet || [])])
        toast.success('Vehicle added to fleet register.')
        setRegNo('')
        onClose()
    }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <h2 className='text-lg font-semibold text-[#1E1E1E]'>Add Vehicle</h2>
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
                            <label className='text-sm font-medium text-[#808080]'>Registration No.</label>
                            <input
                                type='text'
                                value={regNo}
                                onChange={(event) => setRegNo(event.target.value)}
                                placeholder='TN58-AB-1023'
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Vehicle Type</label>
                            <select
                                value={type}
                                onChange={(event) => setType(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            >
                                <option>Bus</option>
                                <option>Van</option>
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Seating Capacity</label>
                            <input type='number' placeholder='40' className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]' />
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Assigned Route</label>
                            <select
                                value={route}
                                onChange={(event) => setRoute(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            >
                                <option>Route 1</option>
                                <option>Route 2</option>
                                <option>Unassigned</option>
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Assigned Driver</label>
                            <select
                                value={driver}
                                onChange={(event) => setDriver(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            >
                                <option>Murugan K.</option>
                                <option>Selvam R.</option>
                                <option>Unassigned</option>
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Purchase Date</label>
                            <input type='date' className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]' />
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Insurance Valid Till</label>
                            <input type='date' className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]' />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Fitness Certificate Valid Till</label>
                            <input type='date' className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]' />
                        </div>
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
                        onClick={handleSave}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                    >
                        <Check size={16} />
                        Save Vehicle
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddVehicleModal
