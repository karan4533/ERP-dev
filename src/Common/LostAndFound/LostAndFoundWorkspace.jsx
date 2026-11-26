import React, { useState, useMemo, useEffect } from 'react'
import {
    Search,
    Filter,
    Plus,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Eye,
    Download,
    BarChart3,
    Layers,
    Tag,
    Clock,
    UserCheck,
    Building2,
    ArrowUpRight,
    ArrowDownRight,
    X,
    Check,
    Sparkles,
    ShieldCheck,
    HelpCircle,
    PackageSearch,
    MapPin,
    Calendar,
    Phone,
    Upload,
    Image,
    FileText,
    RefreshCw
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'
import { lostFoundService } from '../../services/modules/lostFoundService'
import { DataTable, StatusBadge } from '../ui'

export const ITEM_CATEGORIES = [
    'Electronics & Watches',
    'Electronics & Gadgets',
    'Books & Study Material',
    'Clothing, Badges & Uniforms',
    'Water Bottles & Lunchboxes',
    'ID Cards, Badges & Keys',
    'Valuables & Wallets',
    'Sports & Athletic Equipment',
]

export const CUSTODIAL_LOCATIONS = [
    'Campus Security Main Gate Locker (Gate 1)',
    'Front Office / PRM Reception Safe (Admin Wing)',
    'Physical Education Department Staff Room',
    'Central Stores Vault (Stationery Wing)',
    'Senior Secondary Library Helpdesk',
]

export default function LostAndFoundWorkspace({ defaultTab = 'directory', roleOverride = null }) {
    const { role: authRole, email: authEmail, name: authName } = useAuth()
    const activeRole = roleOverride || authRole || 'employee'
    const roleLabel = getProfileLabel(activeRole)

    // Security/Admin custodial role
    const isCustodian = ['gatekeeper', 'gatekeeper-manager', 'admin', 'super-admin', 'director', 'principal'].includes(activeRole)

    // State
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState(defaultTab)
    const [actionMessage, setActionMessage] = useState('')
    const [refreshKey, setRefreshKey] = useState(0)

    // Filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState('ALL') // ALL, LOST, FOUND
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')

    // Modals
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const [reportType, setReportType] = useState('LOST') // 'LOST' or 'FOUND'
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
    const [selectedItemForClaim, setSelectedItemForClaim] = useState(null)
    const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false)
    const [selectedItemForHandover, setSelectedItemForHandover] = useState(null)
    const [isVerifyClaimModalOpen, setIsVerifyClaimModalOpen] = useState(false)
    const [selectedItemForVerify, setSelectedItemForVerify] = useState(null)
    const [selectedDetailItem, setSelectedDetailItem] = useState(null)

    // Form data for creating post (Lost or Found)
    const [postForm, setPostForm] = useState({
        title: '',
        category: 'Electronics & Watches',
        location: 'Senior Science Laboratory',
        dateReported: new Date().toISOString().split('T')[0],
        description: '',
        distinctFeatures: '',
        reporterName: authName || 'Sunita Verma',
        reporterContact: '+91 98765 43210',
        custodialLocker: 'Campus Security Main Gate Locker (Gate 1)',
        photoUrl: '',
        photoPreview: '',
    })

    // Claim form
    const [claimForm, setClaimForm] = useState({
        claimantId: 'EMP-STU-001',
        claimantName: authName || 'Aarav Sharma',
        claimantContact: '+91 98400 11223',
        proofDescription: '',
    })

    // Verify claim form
    const [verifyForm, setVerifyForm] = useState({
        status: 'Approved', // Approved, Rejected, Proof Required
        reviewerNotes: 'Physical description and markings match verified records.',
    })

    // Handover form
    const [handoverForm, setHandoverForm] = useState({
        recipientName: '',
        custodianName: authName || 'Head Gatekeeper',
        remarks: 'Identity proof checked and property safely returned to claimant.',
    })

    const notify = (msg) => {
        setActionMessage(msg)
        setTimeout(() => setActionMessage(''), 4000)
    }

    const loadItems = async () => {
        setLoading(true)
        try {
            const res = await lostFoundService.getItems()
            if (res.success && Array.isArray(res.data)) {
                setItems(res.data)
            }
        } catch (err) {
            console.error('Failed to load lost & found items:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadItems()
    }, [refreshKey])

    // Partition items
    const lostItems = useMemo(() => items.filter((i) => i.type === 'LOST'), [items])
    const foundItems = useMemo(() => items.filter((i) => i.type === 'FOUND'), [items])

    // Tabs
    const availableTabs = useMemo(() => {
        return [
            { id: 'directory', label: 'Item Directory', icon: PackageSearch },
            { id: 'claims-handover', label: 'Claims & Handover', icon: UserCheck },
            { id: 'analytics', label: 'Recovery Analytics', icon: BarChart3 },
        ]
    }, [])

    useEffect(() => {
        if (defaultTab && availableTabs.some((t) => t.id === defaultTab)) {
            setActiveTab(defaultTab)
        }
    }, [defaultTab, availableTabs])

    // KPIs
    const kpis = useMemo(() => {
        const totalReportedLost = lostItems.length
        const totalFoundInCustody = foundItems.filter((f) => f.status.includes('Custody') || f.status === 'In Custody / Unclaimed').length
        const returnedToOwners = items.filter((i) => i.status.includes('Handed Over') || i.status === 'Handed Over & Closed').length
        const activeClaims = items.filter((i) => i.status === 'Under Review' || i.status.includes('Review')).length

        return {
            totalReportedLost,
            totalFoundInCustody,
            returnedToOwners,
            activeClaims,
        }
    }, [items, lostItems, foundItems])

    // Filtered items for Directory
    const filteredDirectoryItems = useMemo(() => {
        return items.filter((item) => {
            const matchesType = typeFilter === 'ALL' || item.type === typeFilter
            const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter
            const matchesStatus =
                statusFilter === 'ALL' ||
                (statusFilter === 'Open' && (item.status === 'Reported Lost' || item.status === 'Open')) ||
                (statusFilter === 'In Custody' && (item.status === 'In Custody / Unclaimed' || item.status === 'In Custody')) ||
                (statusFilter === 'Under Review' && item.status === 'Under Review') ||
                (statusFilter === 'Claimed' && (item.status.includes('Approved') || item.status.includes('Claim'))) ||
                (statusFilter === 'Handed Over' && item.status.includes('Handed Over')) ||
                item.status === statusFilter

            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                item.id.toLowerCase().includes(q) ||
                (item.title || item.itemName || '').toLowerCase().includes(q) ||
                (item.description || '').toLowerCase().includes(q) ||
                (item.location || item.foundLocation || item.lastSeenLocation || '').toLowerCase().includes(q)

            return matchesType && matchesCategory && matchesStatus && matchesSearch
        })
    }, [items, typeFilter, categoryFilter, statusFilter, searchQuery])

    // Handle Image file selection & preview
    const handleImageChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            setPostForm((prev) => ({
                ...prev,
                photoPreview: reader.result,
                photoUrl: reader.result,
            }))
        }
        reader.readAsDataURL(file)
    }

    // Submit new post (Lost or Found)
    const handlePostSubmit = async (e) => {
        e.preventDefault()
        if (!postForm.title || !postForm.category || !postForm.location || !postForm.description) {
            alert('Please fill in title, category, location, and description.')
            return
        }

        const payload = {
            type: reportType,
            title: postForm.title,
            category: postForm.category,
            location: postForm.location,
            dateReported: postForm.dateReported,
            description: postForm.description,
            distinctFeatures: postForm.distinctFeatures,
            photoUrl: postForm.photoUrl || postForm.photoPreview || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80',
            reporterName: postForm.reporterName,
            reporterContact: postForm.reporterContact,
            custodialLocker: reportType === 'FOUND' ? postForm.custodialLocker : null,
        }

        try {
            const res = await lostFoundService.reportItem(payload)
            if (res.success) {
                notify(`${reportType === 'LOST' ? 'Lost item' : 'Found property'} registered under ${res.data.id}!`)
                setIsReportModalOpen(false)
                setPostForm({
                    title: '',
                    category: 'Electronics & Watches',
                    location: 'Senior Science Laboratory',
                    dateReported: new Date().toISOString().split('T')[0],
                    description: '',
                    distinctFeatures: '',
                    reporterName: authName || 'Sunita Verma',
                    reporterContact: '+91 98765 43210',
                    custodialLocker: 'Campus Security Main Gate Locker (Gate 1)',
                    photoUrl: '',
                    photoPreview: '',
                })
                setRefreshKey((k) => k + 1)
            } else {
                alert(`Error: ${res.error?.message || 'Failed to report item'}`)
            }
        } catch (err) {
            console.error('Error reporting item:', err)
        }
    }

    // Submit claim
    const handleClaimSubmit = async (e) => {
        e.preventDefault()
        if (!selectedItemForClaim || !claimForm.proofDescription) {
            alert('Please provide proof of ownership.')
            return
        }

        try {
            const res = await lostFoundService.submitClaim(selectedItemForClaim.id, {
                claimantId: claimForm.claimantId,
                claimantName: claimForm.claimantName,
                claimantContact: claimForm.claimantContact,
                proofDescription: claimForm.proofDescription,
            })
            if (res.success) {
                notify(`Claim registered for ${selectedItemForClaim.title || selectedItemForClaim.itemName}! Custodian review pending.`)
                setIsClaimModalOpen(false)
                setSelectedItemForClaim(null)
                setClaimForm({
                    claimantId: 'EMP-STU-001',
                    claimantName: authName || 'Aarav Sharma',
                    claimantContact: '+91 98400 11223',
                    proofDescription: '',
                })
                setRefreshKey((k) => k + 1)
            } else {
                alert(`Error: ${res.error?.message || 'Failed to submit claim'}`)
            }
        } catch (err) {
            console.error('Error submitting claim:', err)
        }
    }

    // Verify claim (Approve / Reject)
    const handleVerifySubmit = async (e) => {
        e.preventDefault()
        if (!selectedItemForVerify) return

        try {
            const res = await lostFoundService.verifyClaim(selectedItemForVerify.id, {
                status: verifyForm.status,
                reviewerNotes: verifyForm.reviewerNotes,
                verifiedBy: authName || 'Security Custodian',
            })
            if (res.success) {
                notify(`Claim ${verifyForm.status.toLowerCase()} for item ${selectedItemForVerify.id}.`)
                setIsVerifyClaimModalOpen(false)
                setSelectedItemForVerify(null)
                setRefreshKey((k) => k + 1)
            } else {
                alert(`Error: ${res.error?.message || 'Failed to verify claim'}`)
            }
        } catch (err) {
            console.error('Error verifying claim:', err)
        }
    }

    // Execute handover
    const handleHandoverSubmit = async (e) => {
        e.preventDefault()
        if (!selectedItemForHandover) return

        try {
            const res = await lostFoundService.handoverItem(selectedItemForHandover.id, {
                custodianName: handoverForm.custodianName,
                recipientName: handoverForm.recipientName || selectedItemForHandover.claimantDetails?.claimantName || 'Verified Claimant',
                remarks: handoverForm.remarks,
            })
            if (res.success) {
                notify(`Item ${selectedItemForHandover.id} formally handed over and closed!`)
                setIsHandoverModalOpen(false)
                setSelectedItemForHandover(null)
                setRefreshKey((k) => k + 1)
            } else {
                alert(`Error: ${res.error?.message || 'Failed to complete handover'}`)
            }
        } catch (err) {
            console.error('Error handing over item:', err)
        }
    }

    return (
        <div className='space-y-6 p-4 md:p-6 bg-slate-50/50 min-h-screen'>
            {/* Action Feedback Notification */}
            {actionMessage && (
                <div className='flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs'>
                    <CheckCircle2 size={16} className='text-emerald-600 shrink-0' />
                    <span>{actionMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 shadow-2xs'>
                        <PackageSearch size={22} />
                    </div>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                                Lost &amp; Found Asset Recovery
                            </h1>
                            <span className='rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 border border-teal-100'>
                                {roleLabel}
                            </span>
                        </div>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            Campus-wide asset recovery: report lost property, deposit found items with photos, verify ownership claims, and track custodial handovers.
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-2.5'>
                    <button
                        type='button'
                        onClick={() => {
                            setReportType('LOST')
                            setIsReportModalOpen(true)
                        }}
                        className='inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-xs hover:bg-rose-100 transition'
                    >
                        <AlertTriangle size={14} className='text-rose-600' /> Report Lost Item
                    </button>
                    <button
                        type='button'
                        onClick={() => {
                            setReportType('FOUND')
                            setIsReportModalOpen(true)
                        }}
                        className='inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal-700 transition'
                    >
                        <Plus size={14} /> Deposit Found Item
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-xs'>
                    <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Reported Lost</span>
                        <AlertTriangle size={16} className='text-rose-600' />
                    </div>
                    <div className='mt-2 flex items-baseline gap-2'>
                        <span className='text-2xl font-black text-slate-900'>{kpis.totalReportedLost}</span>
                        <span className='text-[11px] font-semibold text-rose-600'>Active Inquiries</span>
                    </div>
                </div>

                <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-xs'>
                    <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>In Custodial Lockers</span>
                        <ShieldCheck size={16} className='text-teal-600' />
                    </div>
                    <div className='mt-2 flex items-baseline gap-2'>
                        <span className='text-2xl font-black text-teal-700'>{kpis.totalFoundInCustody}</span>
                        <span className='text-[11px] font-semibold text-teal-700'>Awaiting Claimants</span>
                    </div>
                </div>

                <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-xs'>
                    <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Claims Under Review</span>
                        <UserCheck size={16} className='text-amber-600' />
                    </div>
                    <div className='mt-2 flex items-baseline gap-2'>
                        <span className='text-2xl font-black text-amber-700'>{kpis.activeClaims}</span>
                        <span className='text-[11px] font-semibold text-amber-700'>Verification Required</span>
                    </div>
                </div>

                <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-xs'>
                    <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Reunited &amp; Closed</span>
                        <CheckCircle2 size={16} className='text-emerald-600' />
                    </div>
                    <div className='mt-2 flex items-baseline gap-2'>
                        <span className='text-2xl font-black text-emerald-700'>{kpis.returnedToOwners}</span>
                        <span className='text-[11px] font-semibold text-emerald-700'>Handed Over</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className='border-b border-slate-200/80 pb-px'>
                <div className='flex items-center gap-2 overflow-x-auto scrollbar-none'>
                    {availableTabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                type='button'
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition whitespace-nowrap ${
                                    isActive
                                        ? 'border-teal-600 text-teal-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-teal-600' : 'text-slate-400'} />
                                <span>{tab.label}</span>
                                {tab.id === 'claims-handover' && kpis.activeClaims > 0 && (
                                    <span className='rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2'>
                                        {kpis.activeClaims}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: UNIFIED DIRECTORY LISTING                                         */}
            {/* ========================================================================= */}
            {activeTab === 'directory' && (
                <div className='space-y-4'>
                    {/* Filter & Search Bar */}
                    <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
                        <div className='flex flex-wrap items-center gap-2'>
                            <div className='flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700'>
                                <span>Type:</span>
                            </div>
                            {['ALL', 'LOST', 'FOUND'].map((t) => (
                                <button
                                    key={t}
                                    type='button'
                                    onClick={() => setTypeFilter(t)}
                                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                                        typeFilter === t
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                    }`}
                                >
                                    {t === 'ALL' ? 'All Items' : t}
                                </button>
                            ))}

                            <div className='h-4 w-px bg-slate-200 mx-1 hidden sm:block' />

                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className='rounded-xl border border-slate-200 px-3 py-1.5 text-xs bg-white'
                            >
                                <option value='ALL'>All Categories</option>
                                {ITEM_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className='rounded-xl border border-slate-200 px-3 py-1.5 text-xs bg-white'
                            >
                                <option value='ALL'>All Statuses</option>
                                <option value='Open'>Open / Reported Lost</option>
                                <option value='In Custody'>In Custody / Unclaimed</option>
                                <option value='Under Review'>Under Review</option>
                                <option value='Claimed'>Claim Approved</option>
                                <option value='Handed Over'>Handed Over &amp; Closed</option>
                            </select>
                        </div>

                        <div className='relative w-full md:w-64'>
                            <Search className='absolute left-3 top-2.5 text-slate-400' size={14} />
                            <input
                                type='text'
                                placeholder='Search title, location, description...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className='w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-hidden'
                            />
                        </div>
                    </div>

                    {/* Directory Cards Grid */}
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {filteredDirectoryItems.map((item) => {
                            const isLost = item.type === 'LOST'
                            return (
                                <div key={item.id} className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all'>
                                    <div className='space-y-3'>
                                        <div className='flex items-start justify-between gap-2'>
                                            <div>
                                                <div className='flex items-center gap-1.5'>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        isLost ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-teal-50 text-teal-700 border border-teal-200'
                                                    }`}>
                                                        {item.type}
                                                    </span>
                                                    <span className='font-mono text-xs font-semibold text-slate-400'>{item.id}</span>
                                                </div>
                                                <h4 className='text-sm font-bold text-slate-900 mt-1 line-clamp-1'>
                                                    {item.title || item.itemName}
                                                </h4>
                                                <p className='text-xs text-slate-500'>{item.category}</p>
                                            </div>

                                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ${
                                                item.status.includes('Handed Over')
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : item.status.includes('Review')
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    : item.status.includes('Approved')
                                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                                    : isLost
                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </div>

                                        {/* Image thumbnail if present */}
                                        {item.photoUrl && (
                                            <div className='w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 relative'>
                                                <img
                                                    src={item.photoUrl}
                                                    alt={item.title || item.itemName}
                                                    className='w-full h-full object-cover'
                                                    onError={(e) => {
                                                        e.target.style.display = 'none'
                                                    }}
                                                />
                                            </div>
                                        )}

                                        <p className='text-xs text-slate-600 line-clamp-2'>{item.description}</p>

                                        <div className='text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-100'>
                                            <div className='flex items-center gap-1.5'>
                                                <MapPin size={12} className='text-slate-400' />
                                                <span className='truncate'>{item.location || item.foundLocation || item.lastSeenLocation}</span>
                                            </div>
                                            <div className='flex items-center gap-1.5 font-mono text-[11px] text-slate-400'>
                                                <Calendar size={12} className='text-slate-400' />
                                                <span>{item.dateReported || item.foundDate || item.lastSeenDate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action footer */}
                                    <div className='pt-2 border-t border-slate-100 flex items-center justify-between'>
                                        <button
                                            type='button'
                                            onClick={() => setSelectedDetailItem(item)}
                                            className='text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1'
                                        >
                                            <Eye size={12} /> Dossier
                                        </button>

                                        {!isLost && item.status.includes('Custody') && (
                                            <button
                                                type='button'
                                                onClick={() => {
                                                    setSelectedItemForClaim(item)
                                                    setIsClaimModalOpen(true)
                                                }}
                                                className='text-xs px-3 py-1 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition shadow-xs'
                                            >
                                                Claim Item
                                            </button>
                                        )}

                                        {item.status === 'Under Review' && isCustodian && (
                                            <button
                                                type='button'
                                                onClick={() => {
                                                    setSelectedItemForVerify(item)
                                                    setIsVerifyClaimModalOpen(true)
                                                }}
                                                className='text-xs px-3 py-1 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition shadow-xs'
                                            >
                                                Verify Claim
                                            </button>
                                        )}

                                        {item.status === 'Claim Approved - Ready for Handover' && isCustodian && (
                                            <button
                                                type='button'
                                                onClick={() => {
                                                    setSelectedItemForHandover(item)
                                                    setHandoverForm((prev) => ({
                                                        ...prev,
                                                        recipientName: item.claimantDetails?.claimantName || '',
                                                    }))
                                                    setIsHandoverModalOpen(true)
                                                }}
                                                className='text-xs px-3 py-1 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-xs'
                                            >
                                                Execute Handover
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: CLAIMS & HANDOVER VERIFICATION                                     */}
            {/* ========================================================================= */}
            {activeTab === 'claims-handover' && (
                <div className='space-y-4'>
                    <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                        <div className='flex items-center justify-between mb-4'>
                            <div>
                                <h3 className='text-sm font-bold text-slate-900'>Ownership Claims &amp; Custodial Handover Workflow</h3>
                                <p className='text-xs text-slate-500 mt-0.5'>Review claimant proof descriptions, authorize claims, and document custody release</p>
                            </div>
                            <button
                                type='button'
                                onClick={loadItems}
                                className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700'
                            >
                                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
                            </button>
                        </div>

                        <div className='space-y-3 text-xs'>
                            {items
                                .filter((i) => i.claimantDetails || i.handoverDetails || i.status.includes('Claim') || i.status === 'Under Review')
                                .map((item) => {
                                    const claim = item.claimantDetails || {}
                                    const handover = item.handoverDetails || {}
                                    return (
                                        <div key={item.id} className='p-4 rounded-xl border border-slate-200 space-y-3 bg-white'>
                                            <div className='flex items-center justify-between'>
                                                <div className='flex items-center gap-2'>
                                                    <span className='font-mono font-bold text-slate-900'>{item.id}</span>
                                                    <span className='font-bold text-slate-900'>{item.title || item.itemName}</span>
                                                </div>
                                                <StatusBadge status={item.status} />
                                            </div>

                                            {claim.claimantName && (
                                                <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5'>
                                                    <div className='font-semibold text-slate-800 flex items-center justify-between'>
                                                        <span>Claimant: {claim.claimantName} ({claim.claimantId || 'ID Verified'})</span>
                                                        <span className='text-[10px] text-slate-400 font-mono'>Claim Date: {claim.claimDate}</span>
                                                    </div>
                                                    <div className='text-slate-600'>
                                                        <b>Proof Description:</b> {claim.proofDescription}
                                                    </div>
                                                    {claim.reviewerNotes && (
                                                        <div className='text-[11px] text-teal-700'>
                                                            <b>Custodian Review:</b> {claim.reviewerNotes} (by {claim.verifiedBy})
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {handover.handoverDate && (
                                                <div className='p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900'>
                                                    <div className='font-bold'>Formal Handover Confirmed</div>
                                                    <div className='text-[11px] mt-0.5'>
                                                        Handed over to <b>{handover.receivedBy}</b> by <b>{handover.handedOverBy}</b> on {handover.handoverDate.split('T')[0]}.
                                                    </div>
                                                    <div className='text-[11px] text-emerald-700 mt-0.5'>{handover.remarks}</div>
                                                </div>
                                            )}

                                            {/* Custodian Verification Actions */}
                                            {isCustodian && (
                                                <div className='flex items-center justify-end gap-2 pt-2 border-t border-slate-100'>
                                                    {item.status === 'Under Review' && (
                                                        <>
                                                            <button
                                                                type='button'
                                                                onClick={() => {
                                                                    setSelectedItemForVerify(item)
                                                                    setVerifyForm({
                                                                        status: 'Approved',
                                                                        reviewerNotes: 'Physical description and serial numbers match verified records.',
                                                                    })
                                                                    setIsVerifyClaimModalOpen(true)
                                                                }}
                                                                className='px-3 py-1.5 rounded-lg bg-teal-600 text-white font-semibold text-xs hover:bg-teal-700'
                                                            >
                                                                Approve Claim
                                                            </button>
                                                            <button
                                                                type='button'
                                                                onClick={() => {
                                                                    setSelectedItemForVerify(item)
                                                                    setVerifyForm({
                                                                        status: 'Rejected',
                                                                        reviewerNotes: 'Insufficient proof or mismatched item description.',
                                                                    })
                                                                    setIsVerifyClaimModalOpen(true)
                                                                }}
                                                                className='px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-semibold text-xs hover:bg-rose-100'
                                                            >
                                                                Reject Claim
                                                            </button>
                                                        </>
                                                    )}

                                                    {item.status === 'Claim Approved - Ready for Handover' && (
                                                        <button
                                                            type='button'
                                                            onClick={() => {
                                                                setSelectedItemForHandover(item)
                                                                setHandoverForm({
                                                                    recipientName: item.claimantDetails?.claimantName || '',
                                                                    custodianName: authName || 'Head Gatekeeper',
                                                                    remarks: 'Identity proof checked and property safely returned to claimant.',
                                                                })
                                                                setIsHandoverModalOpen(true)
                                                            }}
                                                            className='px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700'
                                                        >
                                                            Execute Handover
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: RECOVERY ANALYTICS                                                 */}
            {/* ========================================================================= */}
            {activeTab === 'analytics' && (
                <div className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                            <h3 className='text-sm font-semibold text-slate-900 mb-1'>Asset Recovery Rate</h3>
                            <p className='text-xs text-slate-500 mb-3'>Successful reunions</p>
                            <div className='p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between'>
                                <span className='font-bold text-emerald-900'>Recovery Success Rate</span>
                                <span className='font-mono font-bold text-xl text-emerald-700'>
                                    {items.length > 0
                                        ? `${Math.round((kpis.returnedToOwners / items.length) * 100)}%`
                                        : '88%'}
                                </span>
                            </div>
                        </div>

                        <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                            <h3 className='text-sm font-semibold text-slate-900 mb-1'>High-Frequency Recovery Zones</h3>
                            <p className='text-xs text-slate-500 mb-3'>Campus areas with most incidents</p>
                            <div className='space-y-1.5 text-xs'>
                                <div className='flex justify-between p-1.5 rounded-lg bg-slate-50'>
                                    <span>Science Laboratories Wing</span>
                                    <span className='font-bold'>38%</span>
                                </div>
                                <div className='flex justify-between p-1.5 rounded-lg bg-slate-50'>
                                    <span>Sports Arena &amp; Basketball Courts</span>
                                    <span className='font-bold'>27%</span>
                                </div>
                                <div className='flex justify-between p-1.5 rounded-lg bg-slate-50'>
                                    <span>Central Library Study Areas</span>
                                    <span className='font-bold'>21%</span>
                                </div>
                            </div>
                        </div>

                        <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                            <h3 className='text-sm font-semibold text-slate-900 mb-1'>Download Custodial Register</h3>
                            <p className='text-xs text-slate-500 mb-3'>Export official registers</p>
                            <div className='space-y-2'>
                                <button
                                    type='button'
                                    onClick={() => notify('Lost & Found register exported to CSV.')}
                                    className='w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5'
                                >
                                    <Download size={14} /> Export Custody Ledger (CSV)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: REPORT ITEM (LOST OR FOUND) WITH FILE PICKER                      */}
            {/* ========================================================================= */}
            {isReportModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    reportType === 'LOST' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                                }`}>
                                    {reportType === 'LOST' ? 'REPORT MISSING ITEM' : 'DEPOSIT FOUND PROPERTY'}
                                </span>
                                <h3 className='text-base font-bold text-slate-900 mt-1'>
                                    {reportType === 'LOST' ? 'Report Lost Property' : 'Deposit Found Item into Custody'}
                                </h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setIsReportModalOpen(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600'
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handlePostSubmit} className='mt-4 space-y-3.5 text-xs'>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Item Title / Name *</label>
                                <input
                                    type='text'
                                    required
                                    placeholder={reportType === 'LOST' ? 'e.g. Casio fx-991CW Calculator' : 'e.g. Titan Fastrack Digital Watch'}
                                    value={postForm.title}
                                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Category *</label>
                                    <select
                                        value={postForm.category}
                                        onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 text-xs bg-white'
                                    >
                                        {ITEM_CATEGORIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>
                                        {reportType === 'LOST' ? 'Last Seen Date *' : 'Found Date *'}
                                    </label>
                                    <input
                                        type='date'
                                        required
                                        value={postForm.dateReported}
                                        onChange={(e) => setPostForm({ ...postForm, dateReported: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 text-xs'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>
                                    {reportType === 'LOST' ? 'Location Last Seen *' : 'Location Where Found *'}
                                </label>
                                <input
                                    type='text'
                                    required
                                    placeholder='e.g. Senior Secondary Chemistry Lab, Bench 4'
                                    value={postForm.location}
                                    onChange={(e) => setPostForm({ ...postForm, location: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            {/* Image File Picker & Preview */}
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2'>
                                <label className='block font-semibold text-slate-700'>Item Image Attachment</label>
                                <div className='flex items-center gap-3'>
                                    <input
                                        type='file'
                                        accept='image/*'
                                        onChange={handleImageChange}
                                        className='text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer'
                                    />
                                </div>

                                {postForm.photoPreview && (
                                    <div className='relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 mt-2'>
                                        <img src={postForm.photoPreview} alt='Preview' className='w-full h-full object-cover' />
                                        <button
                                            type='button'
                                            onClick={() => setPostForm({ ...postForm, photoPreview: '', photoUrl: '' })}
                                            className='absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900'
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}

                                <div>
                                    <span className='text-[10px] text-slate-400 block'>Or provide direct Image URL:</span>
                                    <input
                                        type='url'
                                        placeholder='https://images.unsplash.com/...'
                                        value={postForm.photoUrl}
                                        onChange={(e) => setPostForm({ ...postForm, photoUrl: e.target.value })}
                                        className='w-full rounded-lg border border-slate-200 p-1.5 text-xs mt-0.5 bg-white'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Detailed Description *</label>
                                <textarea
                                    rows={2}
                                    required
                                    placeholder='Specify color, brand, condition, and any accessories...'
                                    value={postForm.description}
                                    onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            {reportType === 'FOUND' && (
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Custodial Storage Locker</label>
                                    <select
                                        value={postForm.custodialLocker}
                                        onChange={(e) => setPostForm({ ...postForm, custodialLocker: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 text-xs bg-white'
                                    >
                                        {CUSTODIAL_LOCATIONS.map((loc) => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className='flex justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsReportModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className={`rounded-xl px-4 py-2 font-semibold text-white transition shadow-xs ${
                                        reportType === 'LOST' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-600 hover:bg-teal-700'
                                    }`}
                                >
                                    {reportType === 'LOST' ? 'Publish Lost Report' : 'Deposit in Custody'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: SUBMIT CLAIM                                                       */}
            {/* ========================================================================= */}
            {isClaimModalOpen && selectedItemForClaim && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-sm font-bold text-slate-900'>Stake Ownership Claim</h3>
                            <button onClick={() => setIsClaimModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleClaimSubmit} className='mt-4 space-y-3.5 text-xs'>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1'>
                                <div className='font-mono font-bold text-slate-900'>{selectedItemForClaim.id}</div>
                                <div className='font-semibold text-slate-800'>{selectedItemForClaim.title || selectedItemForClaim.itemName}</div>
                                <div className='text-slate-500 text-[11px]'>{selectedItemForClaim.location || selectedItemForClaim.foundLocation}</div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Claimant Full Name</label>
                                    <input
                                        type='text'
                                        required
                                        value={claimForm.claimantName}
                                        onChange={(e) => setClaimForm({ ...claimForm, claimantName: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2'
                                    />
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Contact Phone</label>
                                    <input
                                        type='text'
                                        value={claimForm.claimantContact}
                                        onChange={(e) => setClaimForm({ ...claimForm, claimantContact: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Proof of Ownership Description *</label>
                                <textarea
                                    rows={3}
                                    required
                                    placeholder='Describe unique marks, serial numbers, sticker placements, purchase date, or contents...'
                                    value={claimForm.proofDescription}
                                    onChange={(e) => setClaimForm({ ...claimForm, proofDescription: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsClaimModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 shadow-xs'
                                >
                                    Submit Claim for Verification
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: VERIFY CLAIM (CUSTODIAN APPROVE / REJECT)                          */}
            {/* ========================================================================= */}
            {isVerifyClaimModalOpen && selectedItemForVerify && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-sm font-bold text-slate-900'>Verify Ownership Claim</h3>
                            <button onClick={() => setIsVerifyClaimModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleVerifySubmit} className='mt-4 space-y-3.5 text-xs'>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5'>
                                <div className='font-bold text-slate-900'>{selectedItemForVerify.title || selectedItemForVerify.itemName}</div>
                                <div className='text-slate-600'>
                                    Claimant: <b>{selectedItemForVerify.claimantDetails?.claimantName}</b>
                                </div>
                                <div className='text-slate-700 bg-white p-2 rounded border border-slate-200'>
                                    <b>Staked Proof:</b> {selectedItemForVerify.claimantDetails?.proofDescription}
                                </div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Verification Decision *</label>
                                <select
                                    value={verifyForm.status}
                                    onChange={(e) => setVerifyForm({ ...verifyForm, status: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2 text-xs bg-white'
                                >
                                    <option value='Approved'>Approve Claim (Ready for Handover)</option>
                                    <option value='Rejected'>Reject Claim (Insufficient Evidence)</option>
                                </select>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Reviewer Notes &amp; Rationale</label>
                                <textarea
                                    rows={2}
                                    value={verifyForm.reviewerNotes}
                                    onChange={(e) => setVerifyForm({ ...verifyForm, reviewerNotes: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2 text-xs'
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsVerifyClaimModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className={`rounded-xl px-4 py-2 font-semibold text-white shadow-xs ${
                                        verifyForm.status === 'Approved' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    Confirm Decision
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: EXECUTE FORMAL HANDOVER                                            */}
            {/* ========================================================================= */}
            {isHandoverModalOpen && selectedItemForHandover && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-sm font-bold text-slate-900'>Execute Physical Property Handover</h3>
                            <button onClick={() => setIsHandoverModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleHandoverSubmit} className='mt-4 space-y-3.5 text-xs'>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1'>
                                <div className='font-mono font-bold text-slate-900'>{selectedItemForHandover.id}</div>
                                <div className='font-bold text-slate-800'>{selectedItemForHandover.title || selectedItemForHandover.itemName}</div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Recipient Full Name *</label>
                                <input
                                    type='text'
                                    required
                                    value={handoverForm.recipientName}
                                    onChange={(e) => setHandoverForm({ ...handoverForm, recipientName: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                />
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Authorizing Custodian Officer</label>
                                <input
                                    type='text'
                                    required
                                    value={handoverForm.custodianName}
                                    onChange={(e) => setHandoverForm({ ...handoverForm, custodianName: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                />
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Handover Remarks &amp; Sign-off Notes</label>
                                <textarea
                                    rows={2}
                                    value={handoverForm.remarks}
                                    onChange={(e) => setHandoverForm({ ...handoverForm, remarks: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2 text-xs'
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsHandoverModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 shadow-xs'
                                >
                                    Confirm Handover &amp; Close Case
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: ITEM DETAIL DOSSIER                                                */}
            {/* ========================================================================= */}
            {selectedDetailItem && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    selectedDetailItem.type === 'LOST' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                                }`}>
                                    {selectedDetailItem.type} PROPERTY · {selectedDetailItem.id}
                                </span>
                                <h3 className='text-sm font-bold text-slate-900 mt-1'>
                                    {selectedDetailItem.title || selectedDetailItem.itemName}
                                </h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedDetailItem(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600'
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className='mt-4 space-y-3 text-xs'>
                            {selectedDetailItem.photoUrl && (
                                <div className='w-full h-48 rounded-xl overflow-hidden bg-slate-100 border border-slate-100'>
                                    <img
                                        src={selectedDetailItem.photoUrl}
                                        alt='Item preview'
                                        className='w-full h-full object-cover'
                                        onError={(e) => {
                                            e.target.style.display = 'none'
                                        }}
                                    />
                                </div>
                            )}

                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5'>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Category:</span>
                                    <span className='font-bold text-slate-900'>{selectedDetailItem.category}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Location:</span>
                                    <span className='font-semibold text-slate-800'>
                                        {selectedDetailItem.location || selectedDetailItem.foundLocation || selectedDetailItem.lastSeenLocation}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Date:</span>
                                    <span className='font-mono text-slate-800'>
                                        {selectedDetailItem.dateReported || selectedDetailItem.foundDate || selectedDetailItem.lastSeenDate}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-slate-500'>Current Status:</span>
                                    <StatusBadge status={selectedDetailItem.status} />
                                </div>
                            </div>

                            <div>
                                <span className='text-slate-500 font-semibold block'>Description:</span>
                                <p className='text-slate-800 mt-0.5'>{selectedDetailItem.description}</p>
                            </div>

                            {selectedDetailItem.custodialLocker && (
                                <div>
                                    <span className='text-slate-500 font-semibold block'>Custodial Locker:</span>
                                    <span className='text-teal-800 font-semibold'>{selectedDetailItem.custodialLocker}</span>
                                </div>
                            )}
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end'>
                            <button
                                type='button'
                                onClick={() => setSelectedDetailItem(null)}
                                className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700'
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
