import React, { useState, useEffect, useMemo } from 'react'
import {
    Bed,
    Building,
    Users,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    Filter,
    Plus,
    UserCheck,
    LogOut,
    DollarSign,
    RefreshCw,
    ShieldAlert,
    Home,
    Layers,
    X,
    Calendar,
    Receipt
} from 'lucide-react'
import { toast } from 'react-toastify'
import { hostelService } from '../../services/modules/hostelService'
import { feeService } from '../../services/modules/feeService'
import { useAuth } from '../../context/AuthContext'
import { getStudentsList } from '../../Pages/Teacher/StudentsList/studentsListData'

const FINANCE_STORAGE_KEY = 'school_erp_finance_state_v1'

const HostelManagementWorkspace = ({ roleOverride }) => {
    const { auth } = useAuth()
    const authName = auth?.user?.name || 'Administrative Hostel Warden'

    // Operational state
    const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'matrix' | 'residents' | 'audit'
    const [blocks, setBlocks] = useState([])
    const [rooms, setRooms] = useState([])
    const [enrolments, setEnrolments] = useState([])
    const [feeInvoices, setFeeInvoices] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshKey, setRefreshKey] = useState(0)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedBlockFilter, setSelectedBlockFilter] = useState('all')

    // Modals
    const [enrolModalOpen, setEnrolModalOpen] = useState(false)
    const [vacateModalOpen, setVacateModalOpen] = useState(false)
    const [selectedEnrolmentForVacate, setSelectedEnrolmentForVacate] = useState(null)

    // Enrolment Form State
    const [formData, setFormData] = useState({
        studentId: '',
        studentName: '',
        gender: 'Male',
        grade: 'Grade 10',
        section: 'A',
        hostelBlockId: 'HOSTEL-BLK-A',
        roomNumber: 'A-201',
        bedNumber: 'B3',
        academicYear: '2025-2026',
        annualHostelFee: 48000,
        checkInDate: new Date().toISOString().split('T')[0],
        emergencyContact: '+91 98401 23456',
        remarks: 'Enrolled under regular hostel boarding scheme.'
    })

    // Vacate Form State
    const [vacateData, setVacateData] = useState({
        vacateDate: new Date().toISOString().split('T')[0],
        vacateReason: 'Academic Year Completion / Term Relocation',
        inspectionStatus: 'Satisfactory - No damage detected',
        clearanceIssued: true,
        refundCautionDeposit: true
    })

    // Available student candidates from school student roster
    const schoolStudents = useMemo(() => {
        try {
            const list = getStudentsList()
            return list || []
        } catch (e) {
            return []
        }
    }, [])

    // Fetch live hostel data from service
    useEffect(() => {
        const loadHostelData = async () => {
            setLoading(true)
            try {
                const [bRes, rRes, eRes, fRes] = await Promise.all([
                    hostelService.getBlocks(),
                    hostelService.getRooms(),
                    hostelService.getEnrolments(),
                    feeService.getInvoices({ feeHead: 'FH-HSTL' })
                ])

                if (bRes?.success && bRes.data) setBlocks(bRes.data)
                if (rRes?.success && rRes.data) setRooms(rRes.data)
                if (eRes?.success && eRes.data) setEnrolments(eRes.data)
                if (fRes?.success && fRes.data) setFeeInvoices(fRes.data)
            } catch (err) {
                console.error('Failed to load hostel data:', err)
                toast.error('Unable to fetch live hostel data.')
            } finally {
                setLoading(false)
            }
        }
        loadHostelData()
    }, [refreshKey])

    // Occupancy KPI Calculations
    const occupancyStats = useMemo(() => {
        const totalBeds = blocks.reduce((acc, b) => acc + (b.totalBeds || 0), 0) || 120
        const activeResidents = enrolments.filter((e) => e.status === 'Active')
        const occupiedBeds = activeResidents.length
        const availableBeds = Math.max(0, totalBeds - occupiedBeds)
        const rate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

        return {
            totalBlocks: blocks.length || 2,
            totalRooms: rooms.length || 40,
            totalBeds,
            occupiedBeds,
            availableBeds,
            rate
        }
    }, [blocks, rooms, enrolments])

    // Synchronize pending hostel fee to FinanceContext localStorage
    const syncHostelFeeToFinanceContext = (enrolmentPayload) => {
        try {
            const raw = localStorage.getItem(FINANCE_STORAGE_KEY)
            let parsed = null
            if (raw) {
                try {
                    parsed = JSON.parse(raw)
                } catch (e) {
                    parsed = null
                }
            }

            const newInstallment = {
                id: `INST-HSTL-${enrolmentPayload.studentId}-${Date.now()}`,
                studentId: enrolmentPayload.studentId,
                academicYear: enrolmentPayload.academicYear || '2025-2026',
                feeStructureId: 'FS-HOSTEL-ANNUAL',
                feeCategoryId: 'CAT-HOSTEL',
                feeHead: 'Hostel & Boarding Fee',
                installmentLabel: 'Annual Hostel Accommodation & Boarding Fee',
                month: 'Annual Academic Session',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                feeAmount: Number(enrolmentPayload.annualHostelFee) || 48000,
                concessionAmount: 0,
                paidAmount: 0,
                status: 'PENDING',
                fineWaived: false,
            }

            if (parsed && parsed.data && Array.isArray(parsed.data.installments)) {
                parsed.data.installments.unshift(newInstallment)
                parsed.savedAt = new Date().toISOString()
                localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(parsed))
            } else {
                const freshState = {
                    version: 1,
                    savedAt: new Date().toISOString(),
                    data: {
                        installments: [newInstallment]
                    }
                }
                localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(freshState))
            }
        } catch (err) {
            console.warn('Failed to sync hostel fee to finance context state:', err)
        }
    }

    // Handle Enrolment Submission
    const handleEnrolSubmit = async (e) => {
        e.preventDefault()
        if (!formData.studentId || !formData.roomNumber || !formData.bedNumber) {
            toast.warning('Please complete all required fields.')
            return
        }

        try {
            const blockObj = blocks.find((b) => b.id === formData.hostelBlockId)
            const payload = {
                ...formData,
                hostelBlockName: blockObj?.name || 'Block A - Boys Senior Wing',
                enrolledBy: authName,
            }

            const res = await hostelService.assignHostelBed(formData.studentId, payload)
            if (res.success) {
                // Cross-module sync with FinanceContext state
                syncHostelFeeToFinanceContext(payload)

                toast.success(`✓ Bed ${formData.bedNumber} in Room ${formData.roomNumber} assigned to ${formData.studentName || formData.studentId}! Fee invoice FH-HSTL generated.`)
                setEnrolModalOpen(false)
                setRefreshKey((k) => k + 1)
            } else {
                toast.error(res.error || 'Failed to allocate bed.')
            }
        } catch (err) {
            toast.error(err.message || 'Error executing hostel enrolment.')
        }
    }

    // Handle Vacate Submission
    const handleVacateSubmit = async (e) => {
        e.preventDefault()
        if (!selectedEnrolmentForVacate) return

        try {
            const res = await hostelService.vacateBed(selectedEnrolmentForVacate.id, {
                vacateDate: vacateData.vacateDate,
                remarks: `${vacateData.vacateReason} | Inspection: ${vacateData.inspectionStatus} | Clearance: Issued by ${authName}`,
            })

            if (res.success) {
                toast.success(`✓ Bed ${selectedEnrolmentForVacate.bedNumber} vacated successfully. Bed returned to available pool.`)
                setVacateModalOpen(false)
                setSelectedEnrolmentForVacate(null)
                setRefreshKey((k) => k + 1)
            } else {
                toast.error(res.error || 'Failed to vacate bed.')
            }
        } catch (err) {
            toast.error(err.message || 'Error vacating bed.')
        }
    }

    // Filtered Residents
    const filteredResidents = useMemo(() => {
        return enrolments.filter((enr) => {
            const matchesQuery =
                !searchQuery ||
                enr.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                enr.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                enr.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesBlock =
                selectedBlockFilter === 'all' ||
                enr.hostelBlockId === selectedBlockFilter

            return matchesQuery && matchesBlock
        })
    }, [enrolments, searchQuery, selectedBlockFilter])

    return (
        <div className='p-6 max-w-7xl mx-auto space-y-6'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold text-slate-900 flex items-center gap-2.5'>
                        <Bed className='text-[#515DEF]' size={28} />
                        Hostel Accommodation & Bed Management
                    </h1>
                    <p className='text-sm text-slate-500 mt-1'>
                        Centralised institutional room allocation, live bed matrix visualizer, resident registers, and automated Central Fee integration.
                    </p>
                </div>
                <div className='flex items-center gap-3'>
                    <button
                        type='button'
                        onClick={() => setRefreshKey((k) => k + 1)}
                        className='inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm cursor-pointer'
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        type='button'
                        onClick={() => setEnrolModalOpen(true)}
                        className='inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#515DEF] rounded-lg hover:bg-indigo-700 shadow-sm cursor-pointer'
                    >
                        <Plus size={18} />
                        Enrol New Resident
                    </button>
                </div>
            </div>

            {/* Occupancy KPI Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
                <div className='bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-indigo-50 text-[#515DEF] flex items-center justify-center font-bold'>
                        <Building size={24} />
                    </div>
                    <div>
                        <span className='text-xs font-semibold text-slate-500 uppercase block'>Total Blocks</span>
                        <span className='text-2xl font-bold text-slate-900'>{occupancyStats.totalBlocks} Blocks</span>
                        <span className='text-xs text-slate-400 block mt-0.5'>Boys & Girls Wings</span>
                    </div>
                </div>

                <div className='bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold'>
                        <Bed size={24} />
                    </div>
                    <div>
                        <span className='text-xs font-semibold text-slate-500 uppercase block'>Total Capacity</span>
                        <span className='text-2xl font-bold text-slate-900'>{occupancyStats.totalBeds} Beds</span>
                        <span className='text-xs text-slate-400 block mt-0.5'>{occupancyStats.totalRooms} Registered Rooms</span>
                    </div>
                </div>

                <div className='bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold'>
                        <Users size={24} />
                    </div>
                    <div>
                        <span className='text-xs font-semibold text-slate-500 uppercase block'>Occupied Beds</span>
                        <span className='text-2xl font-bold text-purple-700'>{occupancyStats.occupiedBeds} Boarders</span>
                        <span className='text-xs text-slate-400 block mt-0.5'>Active Enrolments</span>
                    </div>
                </div>

                <div className='bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold'>
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <span className='text-xs font-semibold text-slate-500 uppercase block'>Available Beds</span>
                        <span className='text-2xl font-bold text-emerald-600'>{occupancyStats.availableBeds} Vacant</span>
                        <span className='text-xs text-slate-400 block mt-0.5'>Ready for Allocation</span>
                    </div>
                </div>

                <div className='bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold'>
                        <Layers size={24} />
                    </div>
                    <div>
                        <span className='text-xs font-semibold text-slate-500 uppercase block'>Occupancy Rate</span>
                        <span className='text-2xl font-bold text-amber-600'>{occupancyStats.rate}%</span>
                        <span className='text-xs text-slate-400 block mt-0.5'>Current Utilization</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className='bg-white rounded-2xl shadow-sm border border-slate-100 p-2'>
                <div className='flex gap-2 overflow-x-auto border-b border-slate-100 pb-2'>
                    <button
                        type='button'
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${activeTab === 'overview' ? 'bg-[#515DEF] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Building size={16} />
                        Blocks Overview
                    </button>
                    <button
                        type='button'
                        onClick={() => setActiveTab('matrix')}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${activeTab === 'matrix' ? 'bg-[#515DEF] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Bed size={16} />
                        Room & Bed Matrix
                    </button>
                    <button
                        type='button'
                        onClick={() => setActiveTab('residents')}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${activeTab === 'residents' ? 'bg-[#515DEF] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Users size={16} />
                        Active Residents Register ({enrolments.filter(e => e.status === 'Active').length})
                    </button>
                    <button
                        type='button'
                        onClick={() => setActiveTab('audit')}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${activeTab === 'audit' ? 'bg-[#515DEF] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Receipt size={16} />
                        Central Fee Invoices (FH-HSTL)
                    </button>
                </div>

                {/* Tab 1: Blocks Overview */}
                {activeTab === 'overview' && (
                    <div className='p-4 space-y-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            {blocks.map((blk) => {
                                const blkEnrolments = enrolments.filter((e) => e.hostelBlockId === blk.id && e.status === 'Active')
                                const occupied = blkEnrolments.length
                                const capacity = blk.totalBeds || 60
                                const pct = Math.round((occupied / capacity) * 100)

                                return (
                                    <div key={blk.id} className='p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all'>
                                        <div className='flex items-center justify-between mb-4'>
                                            <div>
                                                <h3 className='text-lg font-bold text-slate-900'>{blk.name}</h3>
                                                <p className='text-xs text-slate-500'>Warden: {blk.wardenName} ({blk.wardenContact})</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${blk.gender === 'Boys' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                                                {blk.gender} Hostel
                                            </span>
                                        </div>

                                        <div className='space-y-2 mb-4'>
                                            <div className='flex justify-between text-xs font-semibold text-slate-600'>
                                                <span>Occupancy: {occupied} / {capacity} Beds</span>
                                                <span>{pct}% Full</span>
                                            </div>
                                            <div className='w-full h-2.5 bg-slate-200 rounded-full overflow-hidden'>
                                                <div className='h-full bg-[#515DEF] rounded-full' style={{ width: `${Math.min(100, pct)}%` }}></div>
                                            </div>
                                        </div>

                                        <div className='grid grid-cols-3 gap-3 text-center'>
                                            <div className='p-2.5 bg-white rounded-xl border border-slate-200'>
                                                <span className='text-xs text-slate-400 block uppercase'>Rooms</span>
                                                <span className='text-base font-bold text-slate-800'>{blk.totalRooms || 20}</span>
                                            </div>
                                            <div className='p-2.5 bg-white rounded-xl border border-slate-200'>
                                                <span className='text-xs text-slate-400 block uppercase'>Occupied</span>
                                                <span className='text-base font-bold text-purple-700'>{occupied}</span>
                                            </div>
                                            <div className='p-2.5 bg-white rounded-xl border border-slate-200'>
                                                <span className='text-xs text-slate-400 block uppercase'>Available</span>
                                                <span className='text-base font-bold text-emerald-600'>{Math.max(0, capacity - occupied)}</span>
                                            </div>
                                        </div>

                                        <div className='mt-4 pt-4 border-t border-slate-200 flex justify-end'>
                                            <button
                                                type='button'
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, hostelBlockId: blk.id }))
                                                    setEnrolModalOpen(true)
                                                }}
                                                className='text-xs font-bold text-[#515DEF] hover:underline flex items-center gap-1 cursor-pointer'
                                            >
                                                + Allocate Bed in {blk.gender === 'Boys' ? 'Boys' : 'Girls'} Wing
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Tab 2: Room & Bed Matrix Visualizer */}
                {activeTab === 'matrix' && (
                    <div className='p-4 space-y-6'>
                        <div className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200'>
                            <div className='flex items-center gap-4 text-xs font-semibold'>
                                <span className='flex items-center gap-1.5'>
                                    <span className='w-3 h-3 rounded-full bg-emerald-500'></span>
                                    Available Bed
                                </span>
                                <span className='flex items-center gap-1.5'>
                                    <span className='w-3 h-3 rounded-full bg-[#515DEF]'></span>
                                    Occupied Bed
                                </span>
                            </div>
                            <span className='text-xs text-slate-500'>Click any available bed to open instant student enrolment modal.</span>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                            {rooms.map((room) => (
                                <div key={room.id} className='p-4 rounded-2xl border border-slate-200 bg-white shadow-sm'>
                                    <div className='flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5'>
                                        <div>
                                            <h4 className='text-base font-bold text-slate-900'>Room {room.roomNumber}</h4>
                                            <span className='text-xs text-slate-500'>{room.floor} • Capacity: {room.capacity}</span>
                                        </div>
                                        <span className='text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700'>
                                            {room.blockId === 'HOSTEL-BLK-A' ? 'Boys Wing' : 'Girls Wing'}
                                        </span>
                                    </div>

                                    <div className='grid grid-cols-3 gap-2.5'>
                                        {room.beds.map((bed) => {
                                            const isOccupied = bed.occupied
                                            return (
                                                <button
                                                    key={bed.bedNumber}
                                                    type='button'
                                                    onClick={() => {
                                                        if (!isOccupied) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                hostelBlockId: room.blockId,
                                                                roomNumber: room.roomNumber,
                                                                bedNumber: bed.bedNumber
                                                            }))
                                                            setEnrolModalOpen(true)
                                                        }
                                                    }}
                                                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${isOccupied ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900' : 'bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:bg-emerald-100'}`}
                                                >
                                                    <Bed size={20} className='mx-auto mb-1' />
                                                    <span className='text-xs font-bold block'>Bed {bed.bedNumber}</span>
                                                    <span className='text-[10px] block mt-0.5 truncate' title={bed.studentName || 'Available'}>
                                                        {isOccupied ? bed.studentName || 'Resident' : 'Vacant'}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab 3: Active Residents Register */}
                {activeTab === 'residents' && (
                    <div className='p-4 space-y-4'>
                        {/* Search and Filters */}
                        <div className='flex flex-wrap items-center justify-between gap-4'>
                            <div className='relative w-full sm:w-80'>
                                <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
                                <input
                                    type='text'
                                    placeholder='Search by student name, ID or room...'
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className='w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                />
                            </div>

                            <div className='flex items-center gap-3'>
                                <select
                                    value={selectedBlockFilter}
                                    onChange={(e) => setSelectedBlockFilter(e.target.value)}
                                    className='px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700'
                                >
                                    <option value='all'>All Hostel Blocks</option>
                                    <option value='HOSTEL-BLK-A'>Block A - Boys Senior Wing</option>
                                    <option value='HOSTEL-BLK-B'>Block B - Girls Wing</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className='overflow-x-auto border border-slate-200 rounded-xl'>
                            <table className='w-full text-left text-sm'>
                                <thead className='bg-slate-50 text-slate-700 font-semibold text-xs border-b border-slate-200'>
                                    <tr>
                                        <th className='px-4 py-3'>Student Name & ID</th>
                                        <th className='px-4 py-3'>Grade & Section</th>
                                        <th className='px-4 py-3'>Hostel Block</th>
                                        <th className='px-4 py-3'>Room & Bed</th>
                                        <th className='px-4 py-3'>Check-In Date</th>
                                        <th className='px-4 py-3'>Annual Fee</th>
                                        <th className='px-4 py-3'>Status</th>
                                        <th className='px-4 py-3 text-right'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {filteredResidents.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className='px-4 py-8 text-center text-slate-400'>
                                                No hostel residents matching the criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredResidents.map((enr) => (
                                            <tr key={enr.id} className='hover:bg-slate-50/50'>
                                                <td className='px-4 py-3'>
                                                    <span className='font-bold text-slate-900 block'>{enr.studentName || 'Student'}</span>
                                                    <span className='text-xs text-slate-400 font-mono'>{enr.studentId}</span>
                                                </td>
                                                <td className='px-4 py-3 text-slate-600'>
                                                    {enr.grade} - {enr.section}
                                                </td>
                                                <td className='px-4 py-3 text-slate-700'>
                                                    {enr.hostelBlockName || 'Block A'}
                                                </td>
                                                <td className='px-4 py-3 font-semibold text-slate-800'>
                                                    Room {enr.roomNumber} • Bed {enr.bedNumber}
                                                </td>
                                                <td className='px-4 py-3 text-slate-600 text-xs'>
                                                    {enr.checkInDate || '19/12/2025'}
                                                </td>
                                                <td className='px-4 py-3 font-bold text-slate-900'>
                                                    ₹{Number(enr.annualHostelFee || 48000).toLocaleString('en-IN')}
                                                </td>
                                                <td className='px-4 py-3'>
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${enr.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {enr.status}
                                                    </span>
                                                </td>
                                                <td className='px-4 py-3 text-right'>
                                                    {enr.status === 'Active' && (
                                                        <button
                                                            type='button'
                                                            onClick={() => {
                                                                setSelectedEnrolmentForVacate(enr)
                                                                setVacateModalOpen(true)
                                                            }}
                                                            className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer'
                                                        >
                                                            <LogOut size={13} />
                                                            Vacate Bed
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 4: Fee Invoices Audit */}
                {activeTab === 'audit' && (
                    <div className='p-4 space-y-4'>
                        <div className='p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 flex items-center justify-between'>
                            <div>
                                <span className='text-xs font-bold text-indigo-900 uppercase block'>Cross-Module Finance Integration Status</span>
                                <p className='text-xs text-indigo-800 mt-0.5'>
                                    Hostel bed allocations automatically generate pending fee invoices with head <code className='font-mono font-bold'>FH-HSTL</code> in Central Fee Service and sync installments into FinanceContext state.
                                </p>
                            </div>
                            <span className='px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white'>
                                100% In-Sync
                            </span>
                        </div>

                        <div className='overflow-x-auto border border-slate-200 rounded-xl'>
                            <table className='w-full text-left text-sm'>
                                <thead className='bg-slate-50 text-slate-700 font-semibold text-xs border-b border-slate-200'>
                                    <tr>
                                        <th className='px-4 py-3'>Invoice Number</th>
                                        <th className='px-4 py-3'>Student ID</th>
                                        <th className='px-4 py-3'>Fee Head</th>
                                        <th className='px-4 py-3'>Total Amount</th>
                                        <th className='px-4 py-3'>Balance Due</th>
                                        <th className='px-4 py-3'>Due Date</th>
                                        <th className='px-4 py-3'>Invoice Status</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {feeInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className='px-4 py-8 text-center text-slate-400'>
                                                No hostel fee invoices found in central ledger.
                                            </td>
                                        </tr>
                                    ) : (
                                        feeInvoices.map((inv) => (
                                            <tr key={inv.id} className='hover:bg-slate-50/50'>
                                                <td className='px-4 py-3 font-mono font-bold text-indigo-700'>{inv.invoiceNumber}</td>
                                                <td className='px-4 py-3 font-mono text-xs'>{inv.studentId}</td>
                                                <td className='px-4 py-3 text-slate-800'>{inv.feeHeadName || 'Hostel & Boarding Fee'}</td>
                                                <td className='px-4 py-3 font-bold text-slate-900'>₹{Number(inv.totalAmount).toLocaleString('en-IN')}</td>
                                                <td className='px-4 py-3 font-bold text-amber-700'>₹{Number(inv.balanceAmount).toLocaleString('en-IN')}</td>
                                                <td className='px-4 py-3 text-slate-600 text-xs'>{inv.dueDate}</td>
                                                <td className='px-4 py-3'>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Enrolment Modal */}
            {enrolModalOpen && (
                <div className='fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto'>
                    <div className='bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-lg font-bold text-slate-900 flex items-center gap-2'>
                                <Bed size={20} className='text-[#515DEF]' />
                                Allocate Hostel Bed & Generate Fee
                            </h3>
                            <button
                                type='button'
                                onClick={() => setEnrolModalOpen(false)}
                                className='p-1 rounded-lg text-slate-400 hover:bg-slate-100'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEnrolSubmit} className='space-y-4'>
                            <div>
                                <label className='block text-xs font-bold text-slate-700 uppercase mb-1'>Select Enrolled Student *</label>
                                <select
                                    required
                                    value={formData.studentId}
                                    onChange={(e) => {
                                        const stu = schoolStudents.find(s => s.id === e.target.value)
                                        setFormData(prev => ({
                                            ...prev,
                                            studentId: e.target.value,
                                            studentName: stu ? stu.name : e.target.value,
                                            grade: stu ? `Grade ${stu.className}` : 'Grade 10',
                                            section: stu ? stu.section : 'A',
                                            gender: stu?.gender || 'Male'
                                        }))
                                    }}
                                    className='w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500'
                                >
                                    <option value=''>-- Select Student --</option>
                                    {schoolStudents.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.id}) • Class {s.className}-{s.section}
                                        </option>
                                    ))}
                                    <option value='STU-001'>Aarav Sharma (STU-001) • Grade 10-A</option>
                                    <option value='STU-002'>Kavya Patel (STU-002) • Grade 10-A</option>
                                    <option value='STU-003'>Rohan Verma (STU-003) • Grade 9-B</option>
                                </select>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-xs font-bold text-slate-700 uppercase mb-1'>Hostel Block *</label>
                                    <select
                                        value={formData.hostelBlockId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, hostelBlockId: e.target.value }))}
                                        className='w-full px-3 py-2 border border-slate-200 rounded-xl text-sm'
                                    >
                                        <option value='HOSTEL-BLK-A'>Block A - Boys Senior Wing</option>
                                        <option value='HOSTEL-BLK-B'>Block B - Girls Wing</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-xs font-bold text-slate-700 uppercase mb-1'>Room Number *</label>
                                    <select
                                        value={formData.roomNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                                        className='w-full px-3 py-2 border border-slate-200 rounded-xl text-sm'
                                    >
                                        <option value='A-201'>Room A-201 (Floor 2)</option>
                                        <option value='A-202'>Room A-202 (Floor 2)</option>
                                        <option value='A-203'>Room A-203 (Floor 2)</option>
                                        <option value='B-101'>Room B-101 (Floor 1)</option>
                                    </select>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-xs font-bold text-slate-700 uppercase mb-1'>Bed Number *</label>
                                    <select
                                        value={formData.bedNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bedNumber: e.target.value }))}
                                        className='w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-indigo-700'
                                    >
                                        <option value='B1'>Bed B1</option>
                                        <option value='B2'>Bed B2</option>
                                        <option value='B3'>Bed B3</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-xs font-bold text-slate-700 uppercase mb-1'>Check-in Date *</label>
                                    <input
                                        type='date'
                                        value={formData.checkInDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, checkInDate: e.target.value }))}
                                        className='w-full px-3 py-2 border border-slate-200 rounded-xl text-sm'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-xs font-bold text-slate-700 uppercase mb-1'>Annual Hostel Fee (₹) *</label>
                                    <input
                                        type='number'
                                        value={formData.annualHostelFee}
                                        onChange={(e) => setFormData(prev => ({ ...prev, annualHostelFee: Number(e.target.value) }))}
                                        className='w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-bold text-slate-700 uppercase mb-1'>Academic Year *</label>
                                    <input
                                        type='text'
                                        value={formData.academicYear}
                                        onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                                        className='w-full px-3 py-2 border border-slate-200 rounded-xl text-sm'
                                    />
                                </div>
                            </div>

                            <div className='p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-2'>
                                <ShieldAlert size={18} className='text-indigo-600 shrink-0 mt-0.5' />
                                <div>
                                    <span className='font-bold uppercase block'>Automated Fee Invoicing Policy</span>
                                    <span>
                                        Submitting this bed allocation will immediately generate a pending <code className='font-bold font-mono'>FH-HSTL</code> fee invoice of ₹{Number(formData.annualHostelFee).toLocaleString('en-IN')} in the Central Fee Management ledger.
                                    </span>
                                </div>
                            </div>

                            <div className='flex justify-end gap-3 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setEnrolModalOpen(false)}
                                    className='px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-5 py-2 text-sm font-bold text-white bg-[#515DEF] hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer'
                                >
                                    Confirm Bed Allocation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Vacate Bed Modal */}
            {vacateModalOpen && selectedEnrolmentForVacate && (
                <div className='fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto'>
                    <div className='bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-lg font-bold text-rose-700 flex items-center gap-2'>
                                <LogOut size={20} />
                                Vacate Hostel Bed
                            </h3>
                            <button
                                type='button'
                                onClick={() => setVacateModalOpen(false)}
                                className='p-1 rounded-lg text-slate-400 hover:bg-slate-100'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleVacateSubmit} className='space-y-4'>
                            <div className='p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1'>
                                <span className='font-bold text-slate-900 block text-sm'>{selectedEnrolmentForVacate.studentName}</span>
                                <span className='text-slate-500 block'>
                                    ID: {selectedEnrolmentForVacate.studentId} • Room {selectedEnrolmentForVacate.roomNumber} • Bed {selectedEnrolmentForVacate.bedNumber}
                                </span>
                            </div>

                            <div>
                                <label className='block text-xs font-bold text-slate-700 uppercase mb-1'>Vacate Date *</label>
                                <input
                                    type='date'
                                    required
                                    value={vacateData.vacateDate}
                                    onChange={(e) => setVacateData(prev => ({ ...prev, vacateDate: e.target.value }))}
                                    className='w-full px-3 py-2 border border-slate-200 rounded-xl text-sm'
                                />
                            </div>

                            <div>
                                <label className='block text-xs font-bold text-slate-700 uppercase mb-1'>Clearance Reason *</label>
                                <select
                                    value={vacateData.vacateReason}
                                    onChange={(e) => setVacateData(prev => ({ ...prev, vacateReason: e.target.value }))}
                                    className='w-full px-3 py-2 border border-slate-200 rounded-xl text-sm'
                                >
                                    <option value='Academic Year Completion / Term Relocation'>Academic Year Completion / Term Relocation</option>
                                    <option value='Day Scholar Conversion'>Day Scholar Conversion</option>
                                    <option value='Transfer Certificate / School Withdrawal'>Transfer Certificate / School Withdrawal</option>
                                    <option value='Disciplinary / Medical Clearance'>Disciplinary / Medical Clearance</option>
                                </select>
                            </div>

                            <div>
                                <label className='block text-xs font-bold text-slate-700 uppercase mb-1'>Room & Fixture Inspection</label>
                                <select
                                    value={vacateData.inspectionStatus}
                                    onChange={(e) => setVacateData(prev => ({ ...prev, inspectionStatus: e.target.value }))}
                                    className='w-full px-3 py-2 border border-slate-200 rounded-xl text-sm'
                                >
                                    <option value='Satisfactory - No damage detected'>Satisfactory - No damage detected</option>
                                    <option value='Minor Wear - Approved for clearance'>Minor Wear - Approved for clearance</option>
                                    <option value='Damage Incurred - Caution deposit deduction required'>Damage Incurred - Caution deposit deduction required</option>
                                </select>
                            </div>

                            <div className='flex items-center gap-2'>
                                <input
                                    type='checkbox'
                                    id='cautionRefund'
                                    checked={vacateData.refundCautionDeposit}
                                    onChange={(e) => setVacateData(prev => ({ ...prev, refundCautionDeposit: e.target.checked }))}
                                    className='rounded text-indigo-600'
                                />
                                <label htmlFor='cautionRefund' className='text-xs font-semibold text-slate-700'>
                                    Issue Caution Deposit Refund Recommendation to Finance
                                </label>
                            </div>

                            <div className='flex justify-end gap-3 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setVacateModalOpen(false)}
                                    className='px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer'
                                >
                                    Confirm Vacate Bed
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default HostelManagementWorkspace
