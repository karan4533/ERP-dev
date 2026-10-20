import React, { useEffect, useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { useFinance } from '../../financeDomain/FinanceContext'
import { getCampusMemory, hydrateCampusKey, usesCampusApiForKey } from '../../../../services/campusJsonStore'
import {
    getDriverDisplayName,
} from '../../../TransportManager/DriverManagement/driverManagementData'
import { VEHICLE_CATEGORIES } from '../../../TransportManager/VehicleManagement/vehicleManagementData'

const ROUTES_KEY = 'schoolerp-transport-routes-v1'
const DRIVERS_KEY = 'schoolerp-transport-drivers-v1'
const VEHICLES_KEY = 'schoolerp-transport-vehicles-v1'

const UNASSIGNED = 'Unassigned'

const loadCampusRows = (key) => {
    const mem = getCampusMemory(key)
    return Array.isArray(mem) ? mem : []
}

const AddVehicleModal = ({ isOpen, onClose }) => {
    const { transportFleet, setTransportFleet, flushFinanceToApi } = useFinance()
    const [regNo, setRegNo] = useState('')
    const [type, setType] = useState('Bus')
    const [route, setRoute] = useState(UNASSIGNED)
    const [driver, setDriver] = useState(UNASSIGNED)
    const [capacity, setCapacity] = useState('')
    const [purchaseDate, setPurchaseDate] = useState('')
    const [insuranceTill, setInsuranceTill] = useState('')
    const [fitnessTill, setFitnessTill] = useState('')
    const [saving, setSaving] = useState(false)
    const [loadingOptions, setLoadingOptions] = useState(false)
    const [routes, setRoutes] = useState([])
    const [drivers, setDrivers] = useState([])
    const [opsVehicles, setOpsVehicles] = useState([])
    const [loadError, setLoadError] = useState('')

    useEffect(() => {
        if (!isOpen) return undefined
        let cancelled = false
        setLoadingOptions(true)
        setLoadError('')

        ;(async () => {
            const apiOn = usesCampusApiForKey(ROUTES_KEY)
            if (apiOn) {
                // Empty seed: do not push demo rows into campus DB from Account Head.
                const results = await Promise.allSettled([
                    hydrateCampusKey(ROUTES_KEY, []),
                    hydrateCampusKey(DRIVERS_KEY, []),
                    hydrateCampusKey(VEHICLES_KEY, []),
                ])
                const failed = results.some((row) => row.status === 'rejected' || row.value === false)
                if (!cancelled && failed) {
                    setLoadError('Could not load some transport masters from the API. Showing whatever is available.')
                }
            }
            if (cancelled) return
            setRoutes(loadCampusRows(ROUTES_KEY))
            setDrivers(loadCampusRows(DRIVERS_KEY))
            setOpsVehicles(loadCampusRows(VEHICLES_KEY))
            setLoadingOptions(false)
        })()

        return () => {
            cancelled = true
        }
    }, [isOpen])

    const routeOptions = useMemo(() => {
        const labels = routes
            .map((row) => row.routeName || row.name || row.label || '')
            .map((label) => String(label).trim())
            .filter(Boolean)
        return [...new Set(labels)]
    }, [routes])

    const driverOptions = useMemo(() => {
        const active = drivers.filter((row) => {
            const status = String(row.status || 'Active').toLowerCase()
            return status === 'active' || status === ''
        })
        const labels = active
            .map((row) => getDriverDisplayName(row) || row.name || row.driverName || '')
            .map((label) => String(label).trim())
            .filter(Boolean)
        return [...new Set(labels)]
    }, [drivers])

    const typeOptions = useMemo(() => {
        const fromOps = opsVehicles
            .map((row) => row.category || row.type || '')
            .map((label) => String(label).trim())
            .filter(Boolean)
        const merged = [...VEHICLE_CATEGORIES, 'Van', ...fromOps]
        return [...new Set(merged)]
    }, [opsVehicles])

    useEffect(() => {
        if (!isOpen) return
        if (typeOptions.length && !typeOptions.includes(type)) {
            setType(typeOptions[0])
        }
        if (route !== UNASSIGNED && routeOptions.length && !routeOptions.includes(route)) {
            setRoute(UNASSIGNED)
        }
        if (driver !== UNASSIGNED && driverOptions.length && !driverOptions.includes(driver)) {
            setDriver(UNASSIGNED)
        }
    }, [isOpen, typeOptions, routeOptions, driverOptions, type, route, driver])

    if (!isOpen) return null

    const handleSave = async () => {
        if (!regNo.trim()) {
            toast.error('Registration number is required.')
            return
        }
        const initials = driver === UNASSIGNED
            ? 'DR'
            : driver
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
            capacity: capacity ? Number(capacity) : null,
            purchaseDate: purchaseDate || null,
            insuranceTill: insuranceTill || null,
            fitnessTill: fitnessTill || null,
            lastService: '—',
            nextServiceDue: '—',
            odometer: '0 km',
            status: 'Active',
        }
        const next = [vehicle, ...(transportFleet || [])]
        setSaving(true)
        setTransportFleet(next)
        const persist = await flushFinanceToApi({ transportFleet: next })
        setSaving(false)
        if (persist?.success === false) {
            toast.error(persist.message || 'Vehicle saved locally — API push failed.')
        } else {
            toast.success(persist?.api ? 'Vehicle saved to finance API.' : 'Vehicle added to fleet register.')
        }
        setRegNo('')
        setCapacity('')
        setPurchaseDate('')
        setInsuranceTill('')
        setFitnessTill('')
        setRoute(UNASSIGNED)
        setDriver(UNASSIGNED)
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
                    {loadingOptions && (
                        <p className='text-sm text-[#667085]'>Loading routes & drivers from campus transport data…</p>
                    )}
                    {loadError && (
                        <p className='text-sm text-[#B54708] bg-[#FFFAEB] border border-[#FEDF89] rounded-lg px-3 py-2'>
                            {loadError}
                        </p>
                    )}
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
                                {typeOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Seating Capacity</label>
                            <input
                                type='number'
                                value={capacity}
                                onChange={(event) => setCapacity(event.target.value)}
                                placeholder='40'
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            />
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
                                <option value={UNASSIGNED}>{UNASSIGNED}</option>
                                {routeOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            {!loadingOptions && routeOptions.length === 0 && (
                                <p className='text-xs text-[#667085]'>No routes in DB yet — add them under Transport Manager → Route Management.</p>
                            )}
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Assigned Driver</label>
                            <select
                                value={driver}
                                onChange={(event) => setDriver(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            >
                                <option value={UNASSIGNED}>{UNASSIGNED}</option>
                                {driverOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            {!loadingOptions && driverOptions.length === 0 && (
                                <p className='text-xs text-[#667085]'>No active drivers in DB yet — add them under Transport Manager → Drivers.</p>
                            )}
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Purchase Date</label>
                            <input
                                type='date'
                                value={purchaseDate}
                                onChange={(event) => setPurchaseDate(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            />
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Insurance Valid Till</label>
                            <input
                                type='date'
                                value={insuranceTill}
                                onChange={(event) => setInsuranceTill(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Fitness Certificate Valid Till</label>
                            <input
                                type='date'
                                value={fitnessTill}
                                onChange={(event) => setFitnessTill(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            />
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
                        disabled={saving}
                        onClick={handleSave}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-60'
                    >
                        <Check size={16} />
                        {saving ? 'Saving…' : 'Save Vehicle'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddVehicleModal
