import React, { useState, useMemo, useEffect } from 'react'
import {
    Award,
    Trophy,
    Star,
    Calendar,
    Users,
    Building2,
    CheckCircle2,
    Clock,
    Plus,
    Filter,
    Search,
    ChevronRight,
    Calculator,
    ShieldCheck,
    Lock,
    Sparkles,
    Download,
    FileSpreadsheet,
    FileText,
    ArrowUpRight,
    X,
    ThumbsUp,
    Printer,
    Check,
    AlertCircle,
    UserCheck,
    Edit3
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'
import BulkClassSectionSelector from './Components/BulkClassSectionSelector'
import DepartmentEmployeeSelector from './Components/DepartmentEmployeeSelector'
import { openPrintDocument } from '../printDocument'
import { awardsService } from '../../services/modules/awardsService'
import {
    ACADEMIC_YEARS,
    CURRENT_ACADEMIC_YEAR,
    RECOGNITION_MONTHS,
    CURRENT_MONTH,
    getAcademicSomRecords,
    saveAcademicSomRecord,
    getNonAcademicSomRecords,
    saveNonAcademicSomRecord,
    calculateAcademicStarOfYear,
    calculateNonAcademicStarOfYear,
    CLASS_ASSIGNMENTS,
    NON_ACADEMIC_DEPARTMENTS
} from './recognitionData'

const EnterpriseRecognitionPage = ({ view = 'som', defaultDomain }) => {
    const { role: userRole, email: userEmail, name: authName } = useAuth()
    const roleLabel = getProfileLabel(userRole)

    const isNonAcademicRole = [
        'hr', 'stationery-store-manager', 'transport-manager', 'canteen-manager',
        'it-support-manager', 'housekeeping-manager', 'gate-keeper', 'gatekeeper-manager',
        'account-head', 'driver', 'van-driver'
    ].includes(userRole)

    const initialDomain = defaultDomain || (isNonAcademicRole ? 'non_academic' : 'academic')

    // Primary View state
    const [domain, setDomain] = useState(initialDomain) // 'academic' | 'non_academic'
    const [recognitionType, setRecognitionType] = useState(view === 'soy' ? 'soy' : 'som') // 'som' | 'soy'

    useEffect(() => {
        if (view) {
            setRecognitionType(view === 'soy' ? 'soy' : 'som')
        }
    }, [view])

    useEffect(() => {
        if (defaultDomain) {
            setDomain(defaultDomain)
        }
    }, [defaultDomain])

    // Filters
    const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH)
    const [selectedAcademicYear, setSelectedAcademicYear] = useState(CURRENT_ACADEMIC_YEAR)
    const [searchQuery, setSearchQuery] = useState('')
    const [somStatusFilter, setSomStatusFilter] = useState('ALL') // 'ALL' | 'Submitted for Review' | 'Reviewed' | 'Announced Winner'

    // Service state
    const [serviceSomList, setServiceSomList] = useState([])
    const [serviceSoyList, setServiceSoyList] = useState([])
    const [serviceRefreshKey, setServiceRefreshKey] = useState(0)

    // Nomination Modals
    const [isNominateModalOpen, setIsNominateModalOpen] = useState(false)
    const [nominationClassKeys, setNominationClassKeys] = useState(['Grade 10-A'])
    const [nominationDeptIds, setNominationDeptIds] = useState(['dept-stores'])
    const [selectedCandidate, setSelectedCandidate] = useState(null)
    const [citationText, setCitationText] = useState('')
    const [customScore, setCustomScore] = useState(98)
    const [actionMessage, setActionMessage] = useState('')

    // SOM Review Modal State
    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [selectedSomForReview, setSelectedSomForReview] = useState(null)
    const [reviewRemarks, setReviewRemarks] = useState('Recommended for Star of the Month recognition.')

    // SOY Committee Scoring Modal
    const [soyScoreModalOpen, setSoyScoreModalOpen] = useState(false)
    const [selectedSoyForScore, setSelectedSoyForScore] = useState(null)
    const [committeeScore, setCommitteeScore] = useState(95)
    const [committeeRemarks, setCommitteeRemarks] = useState('Exemplary leadership, academic excellence and hostel conduct.')

    // SOY MD Sign-Off Modal
    const [mdSignOffModalOpen, setMdSignOffModalOpen] = useState(false)
    const [selectedSoyForMd, setSelectedSoyForMd] = useState(null)
    const [mdRemarks, setMdRemarks] = useState('Approved for annual institutional citation and Star of the Year rolling trophy.')
    const [officialCitation, setOfficialCitation] = useState('In recognition of outstanding academic brilliance, peer leadership, and sterling character.')

    // Load persisted service data
    useEffect(() => {
        const loadAwards = async () => {
            try {
                const [somRes, soyRes] = await Promise.all([
                    awardsService.getSomNominations(),
                    awardsService.getSoyNominations()
                ])
                if (somRes?.success && Array.isArray(somRes.data)) {
                    setServiceSomList(somRes.data)
                }
                if (soyRes?.success && Array.isArray(soyRes.data)) {
                    setServiceSoyList(soyRes.data)
                }
            } catch (err) {
                console.warn('Could not load awards service data:', err)
            }
        }
        loadAwards()
    }, [serviceRefreshKey])

    // Data queries for local records
    const academicSomRecords = useMemo(() => getAcademicSomRecords(), [actionMessage])
    const nonAcademicSomRecords = useMemo(() => getNonAcademicSomRecords(), [actionMessage])

    const academicSoyRankings = useMemo(
        () => calculateAcademicStarOfYear(selectedAcademicYear),
        [selectedAcademicYear, actionMessage]
    )

    const nonAcademicSoyRankings = useMemo(
        () => calculateNonAcademicStarOfYear(selectedAcademicYear),
        [selectedAcademicYear, actionMessage]
    )

    // Filtered monthly records
    const filteredAcademicSom = useMemo(() => {
        return academicSomRecords.filter((r) => {
            const matchesMonth = !selectedMonth || r.month === selectedMonth
            const matchesYear = !selectedAcademicYear || r.academicYear === selectedAcademicYear
            const matchesStatus = somStatusFilter === 'ALL' || r.status === somStatusFilter
            const q = searchQuery.trim().toLowerCase()
            const matchesSearch = !q ||
                r.studentName?.toLowerCase().includes(q) ||
                r.classSection?.toLowerCase().includes(q) ||
                r.studentId?.toLowerCase().includes(q)
            return matchesMonth && matchesYear && matchesStatus && matchesSearch
        })
    }, [academicSomRecords, selectedMonth, selectedAcademicYear, somStatusFilter, searchQuery])

    const filteredNonAcademicSom = useMemo(() => {
        return nonAcademicSomRecords.filter((r) => {
            const matchesMonth = !selectedMonth || r.month === selectedMonth
            const matchesYear = !selectedAcademicYear || r.academicYear === selectedAcademicYear
            const matchesStatus = somStatusFilter === 'ALL' || r.status === somStatusFilter
            const q = searchQuery.trim().toLowerCase()
            const matchesSearch = !q ||
                r.employeeName?.toLowerCase().includes(q) ||
                r.department?.toLowerCase().includes(q) ||
                r.employeeId?.toLowerCase().includes(q)
            return matchesMonth && matchesYear && matchesStatus && matchesSearch
        })
    }, [nonAcademicSomRecords, selectedMonth, selectedAcademicYear, somStatusFilter, searchQuery])

    // Handlers
    const handleOpenNominate = () => {
        setSelectedCandidate(null)
        setCitationText('')
        setCustomScore(98)
        setIsNominateModalOpen(true)
    }

    const handleSubmitNomination = async (e) => {
        e.preventDefault()
        if (!selectedCandidate) {
            alert('Please select a candidate first.')
            return
        }

        const nominatedByLabel = `${authName || roleLabel} (${roleLabel})`

        // 1. Submit through domain service awardsService.nominateSom
        try {
            await awardsService.nominateSom({
                month: selectedMonth,
                category: domain === 'academic' ? 'ACADEMIC' : 'NON_ACADEMIC',
                nomineeId: selectedCandidate.id,
                nomineeName: selectedCandidate.name,
                nominatedById: authName || 'EMP-TCH-001',
                nominatedByName: nominatedByLabel,
                grade: selectedCandidate.classKey || 'Grade 10',
                section: (selectedCandidate.classKey || 'Grade 10-A').split('-')[1] || 'A',
                department: selectedCandidate.deptName || 'Stores & Procurement',
                citationText: citationText.trim() || 'Recognized for sterling scholastic and peer leadership.',
                checklistScores: {
                    punctuality: 5,
                    classroomHygiene: 5,
                    peerMentoring: 5,
                    homeworkCompletion: 5,
                    valuesAndEthics: 5,
                }
            })
        } catch (serviceErr) {
            console.warn('awardsService.nominateSom notice:', serviceErr)
        }

        // 2. Also record in local storage
        if (domain === 'academic') {
            const newRecord = {
                id: `ASOM-${Date.now()}`,
                month: selectedMonth,
                academicYear: selectedAcademicYear,
                classSection: selectedCandidate.classKey || 'Grade 10-A',
                className: (selectedCandidate.classKey || 'Grade 10-A').split('-')[0],
                section: (selectedCandidate.classKey || 'Grade 10-A').split('-')[1] || 'A',
                studentId: selectedCandidate.id,
                studentName: selectedCandidate.name,
                gpa: selectedCandidate.gpa || 3.92,
                score: Number(customScore) || 98,
                ratingStars: 3,
                citation: citationText.trim() || selectedCandidate.citation || 'Recognized for consistent academic and co-curricular excellence.',
                status: 'Submitted for Review',
                nominatedBy: nominatedByLabel,
                finalizedAt: new Date().toISOString().split('T')[0],
            }
            saveAcademicSomRecord(newRecord)
            setActionMessage(`Academic Star of the Month nomination submitted for ${newRecord.studentName} (${newRecord.classSection}).`)
            toast.success(`Nomination for ${newRecord.studentName} submitted for Coordinator review!`)
        } else {
            const newRecord = {
                id: `NASOM-${Date.now()}`,
                month: selectedMonth,
                academicYear: selectedAcademicYear,
                department: selectedCandidate.deptName || 'Stores & Procurement',
                employeeId: selectedCandidate.id,
                employeeName: selectedCandidate.name,
                designation: selectedCandidate.designation,
                kpiScore: Number(customScore) || 98,
                ratingStars: 3,
                citation: citationText.trim() || selectedCandidate.citation || 'Recognized for exceptional non-academic dedication and operational diligence.',
                status: 'Submitted for Review',
                nominatedBy: nominatedByLabel,
                finalizedAt: new Date().toISOString().split('T')[0],
            }
            saveNonAcademicSomRecord(newRecord)
            setActionMessage(`Non-Academic Star of the Month nomination submitted for ${newRecord.employeeName} (${newRecord.department}).`)
            toast.success(`Nomination for ${newRecord.employeeName} submitted for review!`)
        }

        setIsNominateModalOpen(false)
        setServiceRefreshKey((k) => k + 1)
        setTimeout(() => setActionMessage(''), 4000)
    }

    // Review & Endorse SOM
    const handleConfirmSomReview = async () => {
        if (!selectedSomForReview) return
        try {
            await awardsService.reviewSom(selectedSomForReview.id, {
                status: 'Reviewed',
                reviewRemarks,
                reviewerName: authName || 'Coordinator',
            })
            // Update local record status
            selectedSomForReview.status = 'Reviewed'
            selectedSomForReview.reviewRemarks = reviewRemarks
            if (domain === 'academic') {
                saveAcademicSomRecord(selectedSomForReview)
            } else {
                saveNonAcademicSomRecord(selectedSomForReview)
            }
            toast.success(`✓ Star of the Month nomination reviewed & endorsed! Ready for Principal announcement.`)
            setReviewModalOpen(false)
            setSelectedSomForReview(null)
            setServiceRefreshKey((k) => k + 1)
        } catch (err) {
            toast.error(err.message || 'Error reviewing nomination.')
        }
    }

    // Announce SOM Winner
    const handleAnnounceSomWinner = async (record) => {
        try {
            await awardsService.announceSomWinner(record.id)
            record.status = 'Announced Winner'
            record.announcedDate = new Date().toISOString().split('T')[0]
            if (domain === 'academic') {
                saveAcademicSomRecord(record)
            } else {
                saveNonAcademicSomRecord(record)
            }
            toast.success(`🏆 Winner announced! ${record.studentName || record.employeeName} is officially Star of the Month (${record.month}).`)
            setServiceRefreshKey((k) => k + 1)
        } catch (err) {
            toast.error(err.message || 'Error announcing winner.')
        }
    }

    // Nominate Candidate for Star of the Year
    const handleNominateForSoy = async (candidate) => {
        try {
            const payload = {
                academicYear: selectedAcademicYear,
                nomineeId: candidate.studentId || candidate.employeeId || 'STU-001',
                nomineeName: candidate.studentName || candidate.employeeName,
                grade: candidate.classSection || candidate.department || 'Grade 10-A',
                cumulativeGpa: candidate.avgScore ? (candidate.avgScore / 10).toFixed(1) : 9.6,
                attendancePercentage: candidate.attendance || 96.5,
                infractions: 0
            }

            const res = await awardsService.nominateSoy(payload)
            if (res.success) {
                toast.success(`✓ ${payload.nomineeName} nominated for Star of the Year Committee Review!`)
                setServiceRefreshKey((k) => k + 1)
            } else {
                toast.warning(res.error || 'Nominee did not meet criteria.')
            }
        } catch (err) {
            toast.error(err.message || 'Error creating SOY nomination.')
        }
    }

    // Submit Committee Evaluation Score for SOY
    const handleConfirmSoyScore = async () => {
        if (!selectedSoyForScore) return
        try {
            const res = await awardsService.evaluateSoyCommittee(selectedSoyForScore.id, {
                score: Number(committeeScore),
                remarks: committeeRemarks,
                recommendedBy: `${authName || 'Executive Panel'} (Committee)`,
            })
            if (res.success) {
                toast.success(`✓ Committee evaluation of ${committeeScore}/100 recorded for ${selectedSoyForScore.nomineeName}! Forwarded for MD Sign-Off.`)
                setSoyScoreModalOpen(false)
                setSelectedSoyForScore(null)
                setServiceRefreshKey((k) => k + 1)
            }
        } catch (err) {
            toast.error(err.message || 'Error submitting committee evaluation.')
        }
    }

    // Submit MD Final Sign-Off for SOY
    const handleConfirmMdSignOff = async (approved) => {
        if (!selectedSoyForMd) return
        try {
            const res = await awardsService.approveSoyByMd(selectedSoyForMd.id, {
                approved,
                mdRemarks,
                citationText: officialCitation,
            })
            if (res.success) {
                if (approved) {
                    toast.success(`🏆 Managing Director Final Sanction Approved! ${selectedSoyForMd.nomineeName} is awarded Star of the Year (${selectedAcademicYear})!`)
                } else {
                    toast.info(`Nomination declined by MD.`)
                }
                setMdSignOffModalOpen(false)
                setSelectedSoyForMd(null)
                setServiceRefreshKey((k) => k + 1)
            }
        } catch (err) {
            toast.error(err.message || 'Error processing MD sign-off.')
        }
    }

    // Print Citation Certificate
    const handlePrintCitation = (soyWinner) => {
        const body = `
            <div style="padding:40px;text-align:center;font-family:serif;border:10px double #B45309;background:#FFFDF7;">
                <h2 style="font-size:24px;text-transform:uppercase;letter-spacing:2px;color:#92400E;margin-bottom:4px;">Queens Matriculation & Higher Secondary School</h2>
                <h4 style="font-size:14px;color:#78350F;text-transform:uppercase;margin-top:0;">Board of Trustees & Academic Council</h4>
                <div style="font-size:48px;margin:20px 0;">🏆</div>
                <h1 style="font-size:32px;color:#B45309;margin-bottom:8px;font-family:sans-serif;font-weight:900;">STAR OF THE YEAR AWARD</h1>
                <p style="font-size:16px;color:#451A03;margin:0;">Academic Session: ${escapeHtml(soyWinner.academicYear || selectedAcademicYear)}</p>
                <p style="margin:30px auto;max-width:600px;font-size:18px;line-height:1.6;color:#1F2937;">
                    This premier institutional honor is conferred upon
                    <br><strong style="font-size:28px;color:#1E3A8A;display:block;margin:12px 0;">${escapeHtml(soyWinner.nomineeName || 'Aarav Sharma')}</strong>
                    ${escapeHtml(soyWinner.grade || 'Grade 10-A')}
                    <br><br>
                    <em>"${escapeHtml(soyWinner.citation || 'In recognition of outstanding academic brilliance, peer leadership, and sterling character.')}"</em>
                </p>
                <div style="margin-top:50px;display:flex;justify-content:space-around;font-family:sans-serif;font-size:12px;color:#4B5563;">
                    <div>_______________________<br>Principal / Dean</div>
                    <div>_______________________<br>Joint Director</div>
                    <div>_______________________<br>Managing Director</div>
                </div>
            </div>
        `
        openPrintDocument({ title: `Star of the Year Citation - ${soyWinner.nomineeName}`, body })
    }

    const isSupervisor = ['director', 'principal', 'coordinator', 'superadmin', 'admin'].includes(userRole)
    const isDirectorOrAdmin = ['director', 'superadmin', 'admin'].includes(userRole)

    return (
        <section className="space-y-6 pb-10 font-sans max-w-7xl mx-auto p-4 sm:p-6">
            {/* Top Workspace Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Institutional Recognition & Performance Awards
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                            Star Ratings
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        Separate, auditable workflows for Star of the Month (SOM) and Star of the Year (SOY) backed by awardsService.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={handleOpenNominate}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <Plus size={14} />
                        <span>Nominate Star of the Month</span>
                    </button>
                </div>
            </div>

            {/* Notification message banner */}
            {actionMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{actionMessage}</span>
                </div>
            )}

            {/* Main Category and Recognition Type Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-white rounded-2xl border border-slate-200 shadow-xs">
                {/* Recognition Tier (SOM vs SOY) */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setRecognitionType('som')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            recognitionType === 'som'
                                ? 'bg-white text-blue-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Star size={14} className={recognitionType === 'som' ? 'text-amber-500 fill-amber-500' : ''} />
                        <span>Star of the Month (Monthly)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRecognitionType('soy')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            recognitionType === 'soy'
                                ? 'bg-white text-amber-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Trophy size={14} className={recognitionType === 'soy' ? 'text-amber-600 fill-amber-600' : ''} />
                        <span>Star of the Year (Annual & MD Sign-off)</span>
                    </button>
                </div>

                {/* Domain Toggle (Academic vs Non-Academic) */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setDomain('academic')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            domain === 'academic'
                                ? 'bg-white text-slate-900 shadow-xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Users size={14} />
                        <span>Academic (Students)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setDomain('non_academic')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            domain === 'non_academic'
                                ? 'bg-white text-slate-900 shadow-xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Building2 size={14} />
                        <span>Non-Academic (Staff)</span>
                    </button>
                </div>
            </div>

            {/* ============================================================== */}
            {/* VIEW 1: STAR OF THE MONTH (SOM) WORKFLOW                      */}
            {/* ============================================================== */}
            {recognitionType === 'som' && (
                <div className="space-y-6">
                    {/* Filter Bar */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    Recognition Month
                                </label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800"
                                >
                                    {RECOGNITION_MONTHS.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    Workflow Stage
                                </label>
                                <select
                                    value={somStatusFilter}
                                    onChange={(e) => setSomStatusFilter(e.target.value)}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800"
                                >
                                    <option value="ALL">All Stages</option>
                                    <option value="Submitted for Review">Submitted for Review</option>
                                    <option value="Reviewed">Reviewed & Endorsed</option>
                                    <option value="Announced Winner">Announced Winners</option>
                                    <option value="Published">Published</option>
                                </select>
                            </div>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search candidate..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    {/* Table of Monthly Nominations & Awards */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Award size={18} className="text-blue-600" />
                                {domain === 'academic' ? 'Student Star of the Month Roster' : 'Employee Star of the Month Roster'}
                            </h3>
                            <span className="text-xs text-slate-500">
                                Month: {selectedMonth} • {domain === 'academic' ? filteredAcademicSom.length : filteredNonAcademicSom.length} Nominations
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4">Candidate Name & ID</th>
                                        <th className="py-3 px-4">{domain === 'academic' ? 'Class & Section' : 'Department'}</th>
                                        <th className="py-3 px-4 text-center">Score</th>
                                        <th className="py-3 px-4">Citation & Remarks</th>
                                        <th className="py-3 px-4">Nominated By</th>
                                        <th className="py-3 px-4 text-center">Stage / Status</th>
                                        <th className="py-3 px-4 text-right">Workflow Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {(domain === 'academic' ? filteredAcademicSom : filteredNonAcademicSom).map((rec) => {
                                        const isAnnounced = rec.status === 'Announced Winner' || rec.status === 'Published'
                                        const isReviewed = rec.status === 'Reviewed'
                                        const isSubmitted = rec.status === 'Submitted for Review' || !rec.status

                                        return (
                                            <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-slate-900 block">{rec.studentName || rec.employeeName}</span>
                                                    <span className="text-[11px] text-slate-400 font-mono">{rec.studentId || rec.employeeId}</span>
                                                </td>
                                                <td className="py-3.5 px-4 font-semibold text-slate-800">
                                                    {rec.classSection || rec.department}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className="font-bold text-blue-700">{rec.score || rec.kpiScore || 98}%</span>
                                                </td>
                                                <td className="py-3.5 px-4 max-w-xs text-xs text-slate-600 truncate" title={rec.citation}>
                                                    {rec.citation}
                                                </td>
                                                <td className="py-3.5 px-4 text-xs text-slate-500">
                                                    {rec.nominatedBy || 'Class Teacher'}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                        isAnnounced ? 'bg-amber-100 text-amber-800' :
                                                        isReviewed ? 'bg-indigo-100 text-indigo-800' :
                                                        'bg-blue-50 text-blue-800'
                                                    }`}>
                                                        {rec.status || 'Submitted for Review'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {isSubmitted && isSupervisor && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedSomForReview(rec)
                                                                    setReviewModalOpen(true)
                                                                }}
                                                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                                                            >
                                                                Review & Endorse
                                                            </button>
                                                        )}
                                                        {!isAnnounced && isSupervisor && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAnnounceSomWinner(rec)}
                                                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                                            >
                                                                <Trophy size={12} />
                                                                Announce Winner
                                                            </button>
                                                        )}
                                                        {isAnnounced && (
                                                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                                                <Check size={14} /> Winner Announced
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 2: STAR OF THE YEAR (SOY) WORKFLOW                       */}
            {/* ============================================================== */}
            {recognitionType === 'soy' && (
                <div className="space-y-6">
                    {/* Annual Criteria and Executive Governance Banner */}
                    <div className="p-5 rounded-2xl bg-linear-to-r from-amber-500/10 via-amber-400/15 to-transparent border border-amber-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                                    <Trophy size={22} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Star of the Year: Annual Institutional Trophy & MD Sign-off
                                    </h3>
                                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                        Mandatory Criteria: <b>≥ 2 Monthly SOM Wins</b> • Cumulative GPA <b>≥ 8.5</b> • Annual Attendance <b>≥ 95%</b> • <b>Zero Disciplinary Infractions</b>. Requires Committee Evaluation & Managing Director Final Sign-off.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Candidate Leaderboard & Eligibility Scan */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Trophy size={18} className="text-amber-500" />
                                <h3 className="text-sm font-bold text-slate-900">
                                    Annual Candidate Leaderboard & Eligibility Evaluation
                                </h3>
                            </div>
                            <span className="text-xs text-slate-400">
                                Academic Session: {selectedAcademicYear}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4 w-14">Rank</th>
                                        <th className="py-3 px-4">Candidate & Profile</th>
                                        <th className="py-3 px-4">{domain === 'academic' ? 'Class & Section' : 'Department'}</th>
                                        <th className="py-3 px-4 text-center">Monthly Recognitions</th>
                                        <th className="py-3 px-4 text-center">Avg Monthly Score</th>
                                        <th className="py-3 px-4 text-center">Attendance</th>
                                        <th className="py-3 px-4 text-center">Cumulative Score</th>
                                        <th className="py-3 px-4 text-center">Eligibility Status</th>
                                        <th className="py-3 px-4 text-right">Committee Nomination</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {(domain === 'academic' ? academicSoyRankings : nonAcademicSoyRankings).map((cand) => {
                                        const alreadyNominated = serviceSoyList.some(s => s.nomineeId === (cand.studentId || cand.employeeId))

                                        return (
                                            <tr
                                                key={cand.studentId || cand.employeeId}
                                                className={`hover:bg-slate-50/60 transition-colors ${cand.rank === 1 ? 'bg-amber-50/30' : ''}`}
                                            >
                                                <td className="py-3.5 px-4 font-bold">
                                                    {cand.rank === 1 ? (
                                                        <span className="size-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                                                            🏆 1
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-500 ml-2">#{cand.rank}</span>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-slate-900">{cand.studentName || cand.employeeName}</div>
                                                    <div className="text-[11px] text-slate-400 font-mono">{cand.studentId || cand.employeeId}</div>
                                                </td>

                                                <td className="py-3.5 px-4 font-semibold text-slate-800">
                                                    {cand.classSection || cand.department}
                                                </td>

                                                <td className="py-3.5 px-4 text-center">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-bold text-xs">
                                                        <Star size={12} className="fill-blue-600 text-blue-600" />
                                                        <span>{cand.somCount}x Wins</span>
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                                                    {cand.avgScore || cand.avgKpi}%
                                                </td>

                                                <td className="py-3.5 px-4 text-center text-emerald-700 font-semibold">
                                                    {cand.attendance}%
                                                </td>

                                                <td className="py-3.5 px-4 text-center font-extrabold text-slate-900">
                                                    {cand.cumulativeScore} / 100
                                                </td>

                                                <td className="py-3.5 px-4 text-center">
                                                    {cand.isEligible ? (
                                                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                                                            ✓ Meets Criteria (≥2 Wins)
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium text-[10px]">
                                                            Pending ({cand.somCount}/2 Wins)
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-4 text-right">
                                                    {cand.isEligible && !alreadyNominated && isSupervisor && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleNominateForSoy(cand)}
                                                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                                                        >
                                                            Nominate for Annual Trophy
                                                        </button>
                                                    )}
                                                    {alreadyNominated && (
                                                        <span className="text-xs font-semibold text-indigo-700">
                                                            In Governance Queue →
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 2: Committee Evaluation & MD Sign-off Governance Pipeline */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <ShieldCheck size={18} className="text-indigo-600" />
                                Star of the Year Governance Pipeline (Committee Scoring & MD Sign-Off)
                            </h3>
                            <span className="text-xs text-slate-400">
                                {serviceSoyList.length} Nominations in Registry
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4">Nominee Name & ID</th>
                                        <th className="py-3 px-4">Academic Year</th>
                                        <th className="py-3 px-4 text-center">SOM Wins</th>
                                        <th className="py-3 px-4 text-center">Committee Score</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-4">MD Remarks / Citation</th>
                                        <th className="py-3 px-4 text-right">Sign-off Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {serviceSoyList.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                                No candidates currently in the SOY governance pipeline.
                                            </td>
                                        </tr>
                                    ) : (
                                        serviceSoyList.map((soy) => {
                                            const isSelected = soy.status === 'Approved & Selected'
                                            const isPendingMd = soy.status === 'Pending MD Final Sign-Off'
                                            const isCommitteeReview = soy.status === 'Nominated for Committee Review'

                                            return (
                                                <tr key={soy.id} className="hover:bg-slate-50/60">
                                                    <td className="py-3.5 px-4">
                                                        <span className="font-bold text-slate-900 block">{soy.nomineeName}</span>
                                                        <span className="text-[11px] text-slate-400 font-mono">{soy.nomineeId}</span>
                                                    </td>
                                                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                                                        {soy.academicYear}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center font-bold text-indigo-700">
                                                        {soy.eligibilityVerification?.somWinsCount || 2}x Wins
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                                                        {soy.committeeEvaluation?.score ? `${soy.committeeEvaluation.score} / 100` : 'Pending'}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                            isSelected ? 'bg-amber-100 text-amber-800' :
                                                            isPendingMd ? 'bg-purple-100 text-purple-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {soy.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 max-w-xs text-xs text-slate-600 truncate" title={soy.citation || soy.managingDirectorApproval?.mdRemarks}>
                                                        {soy.citation || soy.managingDirectorApproval?.mdRemarks || 'Awaiting sign-off'}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {isCommitteeReview && isSupervisor && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedSoyForScore(soy)
                                                                        setSoyScoreModalOpen(true)
                                                                    }}
                                                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-1"
                                                                >
                                                                    <Edit3 size={13} />
                                                                    Evaluate Score
                                                                </button>
                                                            )}
                                                            {isPendingMd && isDirectorOrAdmin && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedSoyForMd(soy)
                                                                        setMdSignOffModalOpen(true)
                                                                    }}
                                                                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                                                >
                                                                    <ShieldCheck size={13} />
                                                                    MD Final Sign-Off
                                                                </button>
                                                            )}
                                                            {isSelected && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handlePrintCitation(soy)}
                                                                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                                                >
                                                                    <Printer size={13} />
                                                                    Print Citation
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Review & Endorse SOM */}
            {reviewModalOpen && selectedSomForReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Award size={18} className="text-indigo-600" />
                                Review & Endorse Nomination
                            </h3>
                            <button type="button" onClick={() => setReviewModalOpen(false)} className="text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1">
                            <span className="font-bold text-slate-900 block text-sm">{selectedSomForReview.studentName || selectedSomForReview.employeeName}</span>
                            <span>Nominated for: {selectedSomForReview.month} • Score: {selectedSomForReview.score || selectedSomForReview.kpiScore}%</span>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Coordinator Review Remarks *</label>
                            <textarea
                                rows={3}
                                value={reviewRemarks}
                                onChange={(e) => setReviewRemarks(e.target.value)}
                                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button type="button" onClick={() => setReviewModalOpen(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600">
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmSomReview}
                                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                            >
                                Confirm Endorsement
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: SOY Committee Evaluation Score */}
            {soyScoreModalOpen && selectedSoyForScore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Edit3 size={18} className="text-indigo-600" />
                                Committee Evaluation Scoring
                            </h3>
                            <button type="button" onClick={() => setSoyScoreModalOpen(false)} className="text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="text-xs text-slate-600">
                            <span className="font-bold text-slate-900 block text-sm">{selectedSoyForScore.nomineeName}</span>
                            <span>Annual Trophy Candidate • Session: {selectedSoyForScore.academicYear}</span>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Committee Evaluation Score (0 - 100) *</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={committeeScore}
                                onChange={(e) => setCommitteeScore(e.target.value)}
                                className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Panel Recommendation Remarks *</label>
                            <textarea
                                rows={3}
                                value={committeeRemarks}
                                onChange={(e) => setCommitteeRemarks(e.target.value)}
                                className="w-full p-3 text-xs border border-slate-200 rounded-xl"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button type="button" onClick={() => setSoyScoreModalOpen(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600">
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmSoyScore}
                                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                            >
                                Submit Committee Score
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: MD Final Sign-Off for SOY */}
            {mdSignOffModalOpen && selectedSoyForMd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-purple-900 flex items-center gap-2">
                                <Trophy size={20} className="text-amber-500" />
                                Managing Director Executive Final Sign-Off
                            </h3>
                            <button type="button" onClick={() => setMdSignOffModalOpen(false)} className="text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-xl text-xs space-y-1">
                            <span className="font-bold text-purple-950 block text-sm">{selectedSoyForMd.nomineeName}</span>
                            <span>Committee Score: <b>{selectedSoyForMd.committeeEvaluation?.score}/100</b></span>
                            <p className="text-purple-800 italic mt-1">"{selectedSoyForMd.committeeEvaluation?.remarks}"</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">MD Executive Remarks</label>
                            <input
                                type="text"
                                value={mdRemarks}
                                onChange={(e) => setMdRemarks(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Official Institutional Trophy Citation Text *</label>
                            <textarea
                                rows={3}
                                value={officialCitation}
                                onChange={(e) => setOfficialCitation(e.target.value)}
                                className="w-full p-3 text-xs border border-slate-200 rounded-xl font-serif"
                            />
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => handleConfirmMdSignOff(false)}
                                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                            >
                                Decline Sanction
                            </button>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setMdSignOffModalOpen(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600">
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleConfirmMdSignOff(true)}
                                    className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                                >
                                    <Trophy size={14} />
                                    Sanction Trophy & Approve
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Nominate SOM */}
            {isNominateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                    <Award size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Nominate Star of the Month ({domain === 'academic' ? 'Academic Student' : 'Non-Academic Staff'})
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Recognition Month: <strong className="text-slate-700">{selectedMonth}</strong> • Academic Year: <strong className="text-slate-700">{selectedAcademicYear}</strong>
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsNominateModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
                            {domain === 'academic' ? (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                                        Step 1: Select Classes & Expand to Choose Nominee
                                    </h4>
                                    <BulkClassSectionSelector
                                        userRole={userRole}
                                        userEmail={userEmail}
                                        selectedClassKeys={nominationClassKeys}
                                        onSelectionChange={setNominationClassKeys}
                                        onNominateStudent={(student, classKey) => {
                                            setSelectedCandidate({ ...student, classKey })
                                            setCitationText(student.citation || '')
                                        }}
                                        nominatedStudentId={selectedCandidate?.id}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                                        Step 1: Select Department & Employee
                                    </h4>
                                    <DepartmentEmployeeSelector
                                        userRole={userRole}
                                        selectedDeptIds={nominationDeptIds}
                                        onSelectionChange={setNominationDeptIds}
                                        onNominateEmployee={(emp, deptName) => {
                                            setSelectedCandidate({ ...emp, deptName })
                                            setCitationText(emp.citation || '')
                                        }}
                                        nominatedEmployeeId={selectedCandidate?.id}
                                    />
                                </div>
                            )}

                            {selectedCandidate && (
                                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 animate-in fade-in space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                                            <Sparkles size={14} className="text-blue-600" />
                                            <span>Step 2: Confirm Award Citation & Performance Rating</span>
                                        </h4>
                                        <span className="text-xs font-semibold text-blue-700">
                                            Candidate: {selectedCandidate.name} ({selectedCandidate.id})
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Performance Evaluation Score (0 - 100)
                                            </label>
                                            <input
                                                type="number"
                                                min="80"
                                                max="100"
                                                value={customScore}
                                                onChange={(e) => setCustomScore(e.target.value)}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Award Month
                                            </label>
                                            <input
                                                type="text"
                                                value={selectedMonth}
                                                disabled
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Official Award Citation / Performance Rationale <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={citationText}
                                            onChange={(e) => setCitationText(e.target.value)}
                                            placeholder="Describe the candidate's achievements, conduct, and contributions warranting Star of the Month recognition..."
                                            className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                {selectedCandidate
                                    ? `Ready to submit nomination for ${selectedCandidate.name}`
                                    : 'Please choose a nominee from the list above'}
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsNominateModalOpen(false)}
                                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={!selectedCandidate}
                                    onClick={handleSubmitNomination}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                                >
                                    Submit Nomination for Review
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default EnterpriseRecognitionPage
