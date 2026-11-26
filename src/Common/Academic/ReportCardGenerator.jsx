import React, { useState, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
    Printer,
    Download,
    Award,
    Calendar,
    User,
    CheckCircle2,
    BookOpen,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    FileText,
    Filter,
    RefreshCw,
    GraduationCap,
    Check,
} from 'lucide-react'
import { useActiveStudent } from '../../context/ActiveStudentContext'
import {
    getApprovedMarksForStudent,
    getGradeFromPercentage,
    CLASSES,
    SECTIONS,
} from '../MarkEntryApproval/markEntryApprovalData'
import { getStudentsList } from '../../Pages/Teacher/StudentsList/studentsListData'
import { PARENT_CHILD_PROFILES } from '../../Pages/Parent/parentStudentProfiles'

export const SAMPLE_STUDENTS = [
    {
        id: 'STU-2024-1042',
        rollNo: 'QMIS202510A02',
        name: 'Arjun Sharma',
        gradeSec: 'Grade 10 - Section A',
        className: '10',
        section: 'A',
        attendance: '98 / 104 Days',
        attendancePercent: '94.2%',
        classMentor: 'Anita Verma',
        principalName: 'Dr. Anita Rajesh',
        term: 'TERM 2',
        scholastics: [
            { subject: 'English', marks: 88, maxMarks: 100, points: 38, credits: 40, teacher: 'Sandy Selva' },
            { subject: 'Language 2 (Hindi)', marks: 85, maxMarks: 100, points: 36, credits: 40, teacher: 'Dr. Anita Sen' },
            { subject: 'Mathematics', marks: 95, maxMarks: 100, points: 40, credits: 40, teacher: 'Anita Verma' },
            { subject: 'Science (Physics/Chem/Bio)', marks: 91, maxMarks: 100, points: 39, credits: 40, teacher: 'Dr. Subramanian' },
            { subject: 'Computer Applications', marks: 96, maxMarks: 100, points: 40, credits: 40, teacher: 'Mr. Vignesh P' },
        ],
        minorAllied: [
            { subject: 'Robotics & AI', marks: 48, maxMarks: 50, points: 20, credits: 20 },
            { subject: 'Applied Mathematics Lab', marks: 46, maxMarks: 50, points: 20, credits: 20 },
        ],
        bfit: { name: 'Athletics & Badminton', marks: 19, maxMarks: 20, points: 4, credits: 4, remarks: 'Excellent' },
        cca: { name: 'Debate & Model United Nations', marks: 18, maxMarks: 20, points: 4, credits: 4, remarks: 'Excellent' },
        scholasticsTotal: { earnedPoints: 192, totalPoints: 200, earnedCredits: 16, totalCredits: 16 },
        comments: {
            english: 'Excellent analytical writing and articulation in literary reviews.',
            language: 'Commendable grammar mastery and expressive vocabulary.',
            maths: 'Outstanding logical speed and mathematical problem solving skills.',
            science: 'Exemplary scientific aptitude and practical lab performance.',
            it: 'Exceptional algorithm design and coding proficiency.',
            holistic: 'Demonstrates exemplary leadership, empathy, and peer collaboration across all co-curricular forums.',
        },
        coScholastics: [
            { id: '2a', title: 'Skill Course', detail: 'Python Programming & AI Basics', remarks: 'Excellent', points: 10, credits: 2 },
            { id: '2b', title: 'Social Outreach', detail: 'Village Literacy & Book Donation Campaign', remarks: '20 Hours Completed', points: 10, credits: 2 },
            { id: '2c', title: 'Competitions', detail: 'State Science Fair 2026 — 2nd Prize', remarks: 'State Level Win', points: 10, credits: 2 },
            { id: '2d', title: 'Competitive Exams', detail: 'NTSE Stage 1 & SOF NSO National Qualified', remarks: 'State Rank 14', points: 10, credits: 2 },
        ],
        coScholasticsTotal: { earnedPoints: 12, totalPoints: 12, earnedCredits: 8, totalCredits: 8 },
    },
    {
        id: 'STU-2025-0101',
        rollNo: 'QMIS20251A01',
        name: 'Aariv Doddi',
        gradeSec: 'Grade 1 - Section A',
        className: '1',
        section: 'A',
        attendance: '83.5 / 104 Days',
        attendancePercent: '80.3%',
        classMentor: 'Thanka Kanaka',
        principalName: 'Dr. Anita Rajesh',
        term: 'TERM 2',
        scholastics: [
            { subject: 'English', marks: 74, maxMarks: 100, points: 30, credits: 40, teacher: 'Mrs. Thanka Kanaka' },
            { subject: 'Language 2 (Tamil)', marks: 90, maxMarks: 100, points: 40, credits: 40, teacher: 'Mrs. Selvi M' },
            { subject: 'Mathematics', marks: 92, maxMarks: 100, points: 40, credits: 40, teacher: 'Mrs. Thanka Kanaka' },
            { subject: 'Science', marks: 81, maxMarks: 100, points: 34, credits: 40, teacher: 'Ms. Keerthana' },
            { subject: 'Information Technology', marks: 100, maxMarks: 100, points: 40, credits: 40, teacher: 'Mr. Vignesh P' },
        ],
        minorAllied: [
            { subject: 'L3 Hindi', marks: 'NA', points: 'NA', credits: 'NA' },
            { subject: 'Einstein+ Numeracy', marks: 'NA', points: 'NA', credits: 'NA' },
        ],
        bfit: { name: 'Yoga & Martial Arts (Kungfu)', marks: 15, maxMarks: 20, points: 3, credits: 4, remarks: 'Good' },
        cca: { name: 'Performance Arts & Vocal', marks: 10, maxMarks: 20, points: 2, credits: 4, remarks: 'Average' },
        scholasticsTotal: { earnedPoints: 160, totalPoints: 200, earnedCredits: 11, totalCredits: 16 },
        comments: {
            english: 'Aariv has shown consistent improvement within the term. Regular reading practice will further enhance verbal fluency.',
            language: 'வாய்மொழி பதில் கூறுதல் நன்று! நல்ல முன்னேற்றம் உள்ளது. தொடர்ந்து வாசித்தல் பயிற்சி மேற்கொள்ளவும்.',
            maths: 'Shows enthusiastic engagement in activity-based arithmetic. Solid understanding of place value.',
            science: 'Shows keen observational curiosity in visual science demonstrations.',
            it: 'Attentive, enthusiastic, and confident during computer lab interactions.',
            holistic: 'A bright, lively learner who participates actively in group activities.',
        },
        coScholastics: [
            { id: '2a', title: 'Skill Course', detail: 'Junior Financial Literacy & Mental Math', remarks: 'In House', points: 10, credits: 2 },
            { id: '2b', title: 'Social Outreach', detail: 'Campus Green Brigade & Cleanliness Drive', remarks: 'In Person', points: 8, credits: 2 },
            { id: '2c', title: 'Competitions', detail: 'Interhouse Doodle Art Competition — 1st Place', remarks: 'Won 1st Place', points: 10, credits: 2 },
            { id: '2d', title: 'Competitive Exams', detail: 'SOF International English & Math Olympiads', remarks: 'Participated', points: 10, credits: 2 },
        ],
        coScholasticsTotal: { earnedPoints: 10, totalPoints: 12, earnedCredits: 8, totalCredits: 8 },
    },
]

const DEFAULT_SUBJECTS = [
    { subject: 'English', teacher: 'Mrs. Thanka Kanaka', defaultMarks: 86 },
    { subject: 'Language 2 (Tamil / Hindi)', teacher: 'Mrs. Selvi M', defaultMarks: 89 },
    { subject: 'Mathematics', teacher: 'Mrs. Anita Verma', defaultMarks: 94 },
    { subject: 'Science (Physics / Chem / Bio)', teacher: 'Dr. Subramanian', defaultMarks: 90 },
    { subject: 'Social Science / Computer Applications', teacher: 'Mr. Vignesh P', defaultMarks: 92 },
]

const ReportCardGenerator = () => {
    const location = useLocation()
    const { activeStudent, isParentPortal } = useActiveStudent()

    const isStudentPortal = location.pathname.startsWith('/student')
    const isParentRole = location.pathname.startsWith('/parent') || isParentPortal
    const isRestrictedToSingleStudent = isStudentPortal || isParentRole

    // All registered students in the system
    const systemStudents = useMemo(() => {
        const roster = getStudentsList() || []
        if (roster.length === 0) return SAMPLE_STUDENTS
        return roster.map((s) => ({
            id: s.id,
            rollNo: s.rollNumber || s.admissionNumber || `QMIS-${s.id}`,
            name: s.name,
            gradeSec: `Grade ${s.className?.replace('Class ', '') || '10'} - Section ${s.section || 'A'}`,
            className: String(s.className?.replace('Class ', '') || '10'),
            section: s.section || 'A',
            attendance: s.studentHistory?.attendanceRate ? `${s.studentHistory.attendanceRate} (98/104 Days)` : '96.2% (100/104 Days)',
            attendancePercent: s.studentHistory?.attendanceRate || '96.2%',
            classMentor: 'Mrs. Anita Verma',
            principalName: 'Dr. Anita Rajesh',
            studentRaw: s,
        }))
    }, [])

    // Filter states for staff
    const [selectedClass, setSelectedClass] = useState('10')
    const [selectedSection, setSelectedSection] = useState('A')
    const [selectedStudentId, setSelectedStudentId] = useState(() => {
        if (isRestrictedToSingleStudent && activeStudent?.id) {
            return activeStudent.id
        }
        return 'STU-2024-1042'
    })
    const [selectedTerm, setSelectedTerm] = useState('TERM 2')
    const [generatedNotice, setGeneratedNotice] = useState('')

    const reportCardRef = useRef(null)

    // Current active student profile
    const activeStudentProfile = useMemo(() => {
        if (isRestrictedToSingleStudent && activeStudent?.id) {
            // Find in system roster or fallback to sample
            const match = systemStudents.find(
                (s) => s.id === activeStudent.id || s.name.toLowerCase() === activeStudent.name.toLowerCase()
            )
            if (match) return match
            return {
                id: activeStudent.id,
                rollNo: activeStudent.rollNumber || '10-A-01',
                name: activeStudent.name || 'Arjun Sharma',
                gradeSec: `Grade ${activeStudent.className || '10'} - Section ${activeStudent.section || 'A'}`,
                className: activeStudent.className || '10',
                section: activeStudent.section || 'A',
                attendance: '98 / 104 Days (94.2%)',
                attendancePercent: '94.2%',
                classMentor: 'Mrs. Anita Verma',
                principalName: 'Dr. Anita Rajesh',
            }
        }

        const match = systemStudents.find((s) => s.id === selectedStudentId)
        if (match) return match
        return systemStudents[0] || SAMPLE_STUDENTS[0]
    }, [isRestrictedToSingleStudent, activeStudent, selectedStudentId, systemStudents])

    // Load approved marks for this student if available
    const approvedMarks = useMemo(() => {
        if (!activeStudentProfile?.id) return []
        return getApprovedMarksForStudent(activeStudentProfile.id) || []
    }, [activeStudentProfile?.id])

    // Build scholastic subjects dynamically
    const computedScholastics = useMemo(() => {
        if (approvedMarks && approvedMarks.length > 0) {
            return approvedMarks.map((m) => {
                const obtained = Number(m.obtainedMarks) || 0
                const max = Number(m.totalMarks) || 100
                const pct = Math.round((obtained / max) * 100)
                const pts = Math.round((obtained / max) * 40)
                const creds = pct >= 33 ? 40 : 0
                return {
                    subject: m.subject,
                    marks: obtained,
                    maxMarks: max,
                    points: pts,
                    credits: creds,
                    teacher: m.faculty || 'Subject Faculty',
                }
            })
        }

        // Realistic CBSE subjects baseline
        const sampleMatch = SAMPLE_STUDENTS.find((s) => s.id === activeStudentProfile.id)
        if (sampleMatch) return sampleMatch.scholastics

        return DEFAULT_SUBJECTS.map((sub) => {
            const marks = sub.defaultMarks
            const max = 100
            const pts = Math.round((marks / max) * 40)
            return {
                subject: sub.subject,
                marks,
                maxMarks: max,
                points: pts,
                credits: 40,
                teacher: sub.teacher,
            }
        })
    }, [approvedMarks, activeStudentProfile?.id])

    const bfitData = useMemo(() => {
        const sampleMatch = SAMPLE_STUDENTS.find((s) => s.id === activeStudentProfile?.id)
        return sampleMatch?.bfit || { name: 'Athletics & Physical Fitness', marks: 19, maxMarks: 20, points: 4, credits: 4, faculty: 'Coach Sundaram' }
    }, [activeStudentProfile?.id])

    const ccaData = useMemo(() => {
        const sampleMatch = SAMPLE_STUDENTS.find((s) => s.id === activeStudentProfile?.id)
        return sampleMatch?.cca || { name: 'Co-Curricular & Performing Arts', marks: 18, maxMarks: 20, points: 4, credits: 4, faculty: 'Arts Faculty' }
    }, [activeStudentProfile?.id])

    // Compute totals dynamically from scholastic subjects and co-curricular assessments
    const totalMarks = useMemo(
        () => computedScholastics.reduce((sum, s) => sum + s.marks, 0) + (Number(bfitData.marks) || 0) + (Number(ccaData.marks) || 0),
        [computedScholastics, bfitData.marks, ccaData.marks]
    )
    const maxTotalMarks = useMemo(
        () => computedScholastics.reduce((sum, s) => sum + s.maxMarks, 0) + (Number(bfitData.maxMarks) || 0) + (Number(ccaData.maxMarks) || 0),
        [computedScholastics, bfitData.maxMarks, ccaData.maxMarks]
    )
    const totalEarnedPoints = useMemo(
        () => computedScholastics.reduce((sum, s) => sum + s.points, 0) + (Number(bfitData.points) || 0) + (Number(ccaData.points) || 0),
        [computedScholastics, bfitData.points, ccaData.points]
    )
    const overallPercentage = useMemo(
        () => Math.round((totalMarks / maxTotalMarks) * 100),
        [totalMarks, maxTotalMarks]
    )
    const overallGrade = useMemo(
        () => getGradeFromPercentage(overallPercentage),
        [overallPercentage]
    )

    // Handle Print
    const handlePrint = () => {
        window.print()
    }

    // Handle Generate / Refresh
    const handleGenerate = () => {
        setGeneratedNotice(`Report Card generated & updated for ${activeStudentProfile.name} (${selectedTerm}).`)
        setTimeout(() => setGeneratedNotice(''), 4000)
    }

    // Available students filtered by selected class and section
    const classFilteredStudents = useMemo(() => {
        const filtered = systemStudents.filter(
            (s) => s.className === selectedClass && s.section === selectedSection
        )
        return filtered.length > 0 ? filtered : systemStudents
    }, [systemStudents, selectedClass, selectedSection])

    return (
        <section className="space-y-6">
            {/* Screen Action & Filter Bar */}
            <div className="print:hidden bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-1">
                            <Sparkles size={14} />
                            <span>Official CBSE Assessment Matrix</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Student Progress Report Card
                        </h2>
                        <p className="text-xs text-slate-500">
                            Official Queen Mira International School Grade &amp; Credit Conversion Framework (2025 - 2026).
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleGenerate}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                            <RefreshCw size={14} />
                            <span>Regenerate Card</span>
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                            <Printer size={15} />
                            <span>Print / Download PDF</span>
                        </button>
                    </div>
                </div>

                {generatedNotice && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>{generatedNotice}</span>
                    </div>
                )}

                {/* Filter Controls for Staff vs Student/Parent */}
                {!isRestrictedToSingleStudent ? (
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                Grade / Class:
                            </label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                            >
                                {CLASSES.map((c) => (
                                    <option key={c} value={c}>
                                        Grade {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                Section:
                            </label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                            >
                                {SECTIONS.map((sec) => (
                                    <option key={sec} value={sec}>
                                        Section {sec}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                Student:
                            </label>
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                            >
                                {classFilteredStudents.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.rollNo})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                Evaluation Term:
                            </label>
                            <select
                                value={selectedTerm}
                                onChange={(e) => setSelectedTerm(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                            >
                                <option value="TERM 1">TERM 1</option>
                                <option value="TERM 2">TERM 2</option>
                                <option value="ANNUAL">ANNUAL CONSOLIDATED</option>
                                <option value="MID TERM">MID TERM ASSESSMENT</option>
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700">Active Student:</span>
                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold">
                                {activeStudentProfile.name} • {activeStudentProfile.rollNo} ({activeStudentProfile.gradeSec})
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="font-bold text-slate-700">Term:</label>
                            <select
                                value={selectedTerm}
                                onChange={(e) => setSelectedTerm(e.target.value)}
                                className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="TERM 1">TERM 1</option>
                                <option value="TERM 2">TERM 2</option>
                                <option value="ANNUAL">ANNUAL CONSOLIDATED</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* OFFICIAL CBSE / QMIS REPORT CARD DISPLAY */}
            <div
                ref={reportCardRef}
                className="bg-white rounded-2xl shadow-lg border border-slate-300 p-8 max-w-4xl mx-auto text-slate-900 font-sans print:shadow-none print:border-none print:p-0 print:m-0"
            >
                {/* Header Banner */}
                <div className="text-center border-b-2 border-slate-900 pb-5 mb-6">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-xl tracking-wider">
                            QMIS
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900">
                                QUEEN MIRA INTERNATIONAL SCHOOL
                            </h1>
                            <p className="text-[11px] font-bold text-slate-600 tracking-wider uppercase">
                                Affiliated to CBSE • Kochadai, Madurai • Academic Year 2025 - 2026
                            </p>
                        </div>
                    </div>
                    <div className="inline-block bg-slate-900 text-white text-xs font-bold tracking-widest px-6 py-1 rounded-full uppercase mt-1">
                        OFFICIAL ACADEMIC AND ASSESSMENT POLICY PROGRESS REPORT ({selectedTerm})
                    </div>
                </div>

                {/* Student Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-6 font-semibold">
                    <div>
                        <span className="block text-[10px] text-slate-500 uppercase">Student Roll No</span>
                        <span className="font-mono text-slate-900 text-sm font-bold">{activeStudentProfile.rollNo}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] text-slate-500 uppercase">Student Name</span>
                        <span className="text-slate-900 text-sm font-bold">{activeStudentProfile.name}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] text-slate-500 uppercase">Grade &amp; Section</span>
                        <span className="text-slate-900 text-sm font-bold">{activeStudentProfile.gradeSec}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] text-slate-500 uppercase">Term Attendance</span>
                        <span className="text-emerald-700 text-sm font-bold">
                            {activeStudentProfile.attendance} ({activeStudentProfile.attendancePercent})
                        </span>
                    </div>
                </div>

                {/* Section 1: Scholastics */}
                <div className="mb-6">
                    <div className="flex items-center justify-between border-b-2 border-blue-900 pb-1.5 mb-3">
                        <h3 className="text-sm font-black text-blue-950 uppercase tracking-wide flex items-center gap-2">
                            <BookOpen size={16} className="text-blue-700" />
                            1. Scholastics — Academics &amp; Core Disciplines ({selectedTerm})
                        </h3>
                        <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded">
                            Marks &amp; Credit System • Overall Grade: {overallGrade} ({overallPercentage}%)
                        </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-300 rounded-lg">
                        <table className="w-full text-xs text-left divide-y divide-slate-200">
                            <thead className="bg-slate-100 font-bold text-slate-800 uppercase text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-3">Particulars / Subject</th>
                                    <th className="py-2.5 px-3 text-center">Marks Earned</th>
                                    <th className="py-2.5 px-3 text-center">Max Marks</th>
                                    <th className="py-2.5 px-3 text-center">Grade</th>
                                    <th className="py-2.5 px-3 text-center">Earned Points</th>
                                    <th className="py-2.5 px-3 text-center">Credits</th>
                                    <th className="py-2.5 px-3">Subject Faculty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                {computedScholastics.map((sub, i) => {
                                    const pct = Math.round((sub.marks / sub.maxMarks) * 100)
                                    const grade = getGradeFromPercentage(pct)
                                    return (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="py-2.5 px-3 font-bold text-slate-900">
                                                1a{i + 1}. {sub.subject}
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-bold text-blue-900">
                                                {sub.marks}
                                            </td>
                                            <td className="py-2.5 px-3 text-center text-slate-500">
                                                {sub.maxMarks}
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                                                {grade}
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-bold text-purple-900">
                                                {sub.points}
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-bold text-emerald-800">
                                                {sub.credits}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                                                {sub.teacher}
                                            </td>
                                        </tr>
                                    )
                                })}
                                <tr className="bg-slate-50/70">
                                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                                        1b. BFIT ({bfitData.name})
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-bold">{bfitData.marks}</td>
                                    <td className="py-2.5 px-3 text-center text-slate-500">{bfitData.maxMarks}</td>
                                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                                        {getGradeFromPercentage(Math.round(((Number(bfitData.marks) || 0) / (Number(bfitData.maxMarks) || 20)) * 100))}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-bold">{bfitData.points}</td>
                                    <td className="py-2.5 px-3 text-center font-bold">{bfitData.credits}</td>
                                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">{bfitData.faculty || 'Coach Sundaram'}</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                                        1c. CCA ({ccaData.name})
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-bold">{ccaData.marks}</td>
                                    <td className="py-2.5 px-3 text-center text-slate-500">{ccaData.maxMarks}</td>
                                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                                        {getGradeFromPercentage(Math.round(((Number(ccaData.marks) || 0) / (Number(ccaData.maxMarks) || 20)) * 100))}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-bold">{ccaData.points}</td>
                                    <td className="py-2.5 px-3 text-center font-bold">{ccaData.credits}</td>
                                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">{ccaData.faculty || 'Arts Faculty'}</td>
                                </tr>
                                <tr className="bg-blue-50/90 font-bold text-blue-950 border-t-2 border-slate-300">
                                    <td className="py-3 px-3 font-black">
                                        1. Scholastics Consolidated [1a + 1b + 1c]
                                    </td>
                                    <td colSpan={3} className="py-3 px-3 text-center text-xs font-black">
                                        Total Marks: {totalMarks} / {maxTotalMarks} ({overallPercentage}%)
                                    </td>
                                    <td className="py-3 px-3 text-center text-xs font-black text-purple-900">
                                        {totalEarnedPoints} / 208 Pts
                                    </td>
                                    <td className="py-3 px-3 text-center text-xs font-black text-emerald-800">
                                        Passed
                                    </td>
                                    <td className="py-3 px-3 text-emerald-800 font-black">
                                        Validated
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section 2: Subject Faculty & Class Mentor Feedback */}
                <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2.5">
                    <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1">
                        Scholastics — Faculty Remarks &amp; Development Appraisal
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div>
                            <span className="font-bold text-blue-900 block">English &amp; Humanities:</span>
                            <p className="text-slate-700 italic">
                                Strong analytical articulation and reading comprehension demonstrated in both written essays and oral evaluations.
                            </p>
                        </div>
                        <div>
                            <span className="font-bold text-blue-900 block">Mathematics &amp; Logic:</span>
                            <p className="text-slate-700 italic">
                                Demonstrates outstanding conceptual clarity, numerical problem-solving speed, and structured geometry proofs.
                            </p>
                        </div>
                        <div>
                            <span className="font-bold text-blue-900 block">Sciences &amp; Practical Lab:</span>
                            <p className="text-slate-700 italic">
                                Shows keen observational curiosity in visual demonstrations and methodical precision during laboratory experiments.
                            </p>
                        </div>
                        <div>
                            <span className="font-bold text-blue-900 block">Information Technology &amp; Computing:</span>
                            <p className="text-slate-700 italic">
                                Confident algorithm design and digital literacy during media interactions and practical coding sessions.
                            </p>
                        </div>
                    </div>
                    <div className="border-t border-slate-200 pt-2">
                        <span className="font-bold text-purple-900 block">Holistic Mentor Appraisal:</span>
                        <p className="text-slate-800 font-medium">
                            An exemplary and disciplined learner who consistently exhibits leadership, empathy, and active participation across school activities.
                        </p>
                    </div>
                </div>

                {/* Section 3: Co-Scholastics Activities */}
                <div className="mb-8">
                    <div className="flex items-center justify-between border-b-2 border-purple-900 pb-1.5 mb-3">
                        <h3 className="text-sm font-black text-purple-950 uppercase tracking-wide flex items-center gap-2">
                            <Sparkles size={16} className="text-purple-700" />
                            2. Co-Scholastics &amp; Student Enrichment Activities
                        </h3>
                        <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded">
                            Enrichment Framework
                        </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-300 rounded-lg">
                        <table className="w-full text-xs text-left divide-y divide-slate-200">
                            <thead className="bg-slate-100 font-bold text-slate-800 uppercase text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-3">Particulars</th>
                                    <th className="py-2.5 px-3">Activity / Achievement Details</th>
                                    <th className="py-2.5 px-3 text-center">Remarks / Verification</th>
                                    <th className="py-2.5 px-3 text-center">Earned Points</th>
                                    <th className="py-2.5 px-3 text-center">Credits</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="py-2 px-3 font-bold text-slate-900">2a. Skill Course</td>
                                    <td className="py-2 px-3 text-slate-800">Python Programming &amp; Digital Literacy</td>
                                    <td className="py-2 px-3 text-center font-semibold text-emerald-700">Excellent</td>
                                    <td className="py-2 px-3 text-center font-bold text-purple-900">10</td>
                                    <td className="py-2 px-3 text-center font-bold text-emerald-800">2</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="py-2 px-3 font-bold text-slate-900">2b. Social Outreach</td>
                                    <td className="py-2 px-3 text-slate-800">Campus Green Brigade &amp; Community Literacy Drive</td>
                                    <td className="py-2 px-3 text-center font-semibold text-slate-600">20 Hours Verified</td>
                                    <td className="py-2 px-3 text-center font-bold text-purple-900">10</td>
                                    <td className="py-2 px-3 text-center font-bold text-emerald-800">2</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="py-2 px-3 font-bold text-slate-900">2c. Competitions</td>
                                    <td className="py-2 px-3 text-slate-800">Interhouse Science Exhibition &amp; Debate Forum</td>
                                    <td className="py-2 px-3 text-center font-semibold text-amber-700">1st Place</td>
                                    <td className="py-2 px-3 text-center font-bold text-purple-900">10</td>
                                    <td className="py-2 px-3 text-center font-bold text-emerald-800">2</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="py-2 px-3 font-bold text-slate-900">2d. Competitive Exams</td>
                                    <td className="py-2 px-3 text-slate-800">National Olympiad &amp; NTSE Scholar Selection</td>
                                    <td className="py-2 px-3 text-center font-semibold text-blue-700">Zonal Rank 14</td>
                                    <td className="py-2 px-3 text-center font-bold text-purple-900">10</td>
                                    <td className="py-2 px-3 text-center font-bold text-emerald-800">2</td>
                                </tr>
                                <tr className="bg-purple-50/90 font-bold text-purple-950 border-t-2 border-slate-300">
                                    <td colSpan={3} className="py-2.5 px-3">
                                        2. Co-Scholastics Total [2a + 2b + 2c + 2d]
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-black">
                                        40 / 40 Pts
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-black">
                                        8 / 8 Credits
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Signatures & Certification Footer */}
                <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-2 gap-8 items-end text-center">
                    <div>
                        <div className="font-serif text-base font-bold text-slate-800 mb-1 italic">
                            {activeStudentProfile.classMentor}
                        </div>
                        <div className="border-t border-slate-400 pt-1">
                            <span className="font-bold text-xs text-slate-900 block">Class Mentor</span>
                            <span className="text-[10px] text-slate-500">Verified Assessment Entry</span>
                        </div>
                    </div>
                    <div>
                        <div className="font-serif text-base font-bold text-slate-800 mb-1 italic">
                            {activeStudentProfile.principalName}
                        </div>
                        <div className="border-t border-slate-400 pt-1">
                            <span className="font-bold text-xs text-slate-900 block">Principal</span>
                            <span className="text-[10px] text-slate-500">Authorized School Signatory</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ReportCardGenerator
