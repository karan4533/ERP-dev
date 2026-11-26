import React, { useState, useMemo } from 'react'
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    LineChart,
    PieChart,
    Users,
    Award,
    BookOpen,
    Filter,
    Download,
    Printer,
    RefreshCw,
    ChevronRight,
    AlertTriangle,
    CheckCircle2,
    ArrowUpDown,
    SlidersHorizontal,
    Search,
    GraduationCap,
    HelpCircle,
    Sliders,
    Sparkles,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Percent
} from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import { toast } from 'react-toastify'
import { useActiveStudent } from '../../context/ActiveStudentContext'

const SafeChart = (props) => {
    const Component = ReactECharts?.default || ReactECharts
    if (!Component) return null
    return <Component {...props} />
}

// Master Mock Comparison Data for Classes, Sections, Terms, and Subjects
const MASTER_ANALYTICS_DATA = {
    classes: ['Grade 10', 'Grade 9', 'Grade 8', 'Grade 7', 'Grade 11', 'Grade 12'],
    sections: ['Section A', 'Section B', 'Section C'],
    terms: [
        { id: 'T1_MID', name: 'Term 1 Mid-Term (PA-1)' },
        { id: 'T1_HY', name: 'Half-Yearly Exam (T1)' },
        { id: 'T2_PA2', name: 'Periodic Assessment 2' },
        { id: 'T2_PRE', name: 'Pre-Board Examination' },
        { id: 'T2_ANN', name: 'Annual Final Exam' },
    ],
    subjects: [
        { code: 'MATH', name: 'Mathematics', maxMarks: 100 },
        { code: 'SCI', name: 'Science & Tech', maxMarks: 100 },
        { code: 'ENG', name: 'English Language & Lit', maxMarks: 100 },
        { code: 'SST', name: 'Social Science', maxMarks: 100 },
        { code: 'CS', name: 'Computer Applications', maxMarks: 100 },
        { code: 'HIN', name: 'Hindi Course A', maxMarks: 100 },
    ],
    // Cohort Data
    cohortPerformance: {
        'Grade 10': {
            'Section A': {
                studentCount: 42,
                classTeacher: 'Dr. Anita Desai',
                overallAvg: 81.4,
                passRate: 97.6,
                distinctionRate: 45.2,
                topScore: 98.5,
                lowestScore: 41.0,
                subjectAverages: {
                    MATH: 82.5,
                    SCI: 84.1,
                    ENG: 85.0,
                    SST: 77.8,
                    CS: 89.2,
                    HIN: 80.0,
                },
                gradeDistribution: {
                    A1: 12,
                    A2: 15,
                    B1: 8,
                    B2: 4,
                    C1: 2,
                    C2: 1,
                    E: 0,
                },
                termTrajectory: [76.5, 78.8, 80.2, 81.4, 83.0],
            },
            'Section B': {
                studentCount: 40,
                classTeacher: 'Mr. Rajesh Verma',
                overallAvg: 74.8,
                passRate: 92.5,
                distinctionRate: 32.5,
                topScore: 95.0,
                lowestScore: 36.5,
                subjectAverages: {
                    MATH: 71.2,
                    SCI: 73.4,
                    ENG: 79.5,
                    SST: 72.0,
                    CS: 83.1,
                    HIN: 75.2,
                },
                gradeDistribution: {
                    A1: 6,
                    A2: 11,
                    B1: 12,
                    B2: 6,
                    C1: 3,
                    C2: 1,
                    E: 1,
                },
                termTrajectory: [70.2, 72.5, 73.8, 74.8, 76.1],
            },
            'Section C': {
                studentCount: 38,
                classTeacher: 'Mrs. Priya Sundaram',
                overallAvg: 69.2,
                passRate: 86.8,
                distinctionRate: 21.0,
                topScore: 91.5,
                lowestScore: 31.0,
                subjectAverages: {
                    MATH: 63.8,
                    SCI: 66.5,
                    ENG: 74.2,
                    SST: 68.4,
                    CS: 78.0,
                    HIN: 71.5,
                },
                gradeDistribution: {
                    A1: 3,
                    A2: 7,
                    B1: 11,
                    B2: 9,
                    C1: 4,
                    C2: 2,
                    E: 2,
                },
                termTrajectory: [65.0, 67.2, 68.0, 69.2, 71.0],
            },
        },
    },
    studentsBenchmark: [
        { id: 'STU-1001', name: 'Aarav Patel', rollNo: 1, section: 'Section A', score: 94.2, percentile: 99.1, rank: 1, strengths: ['Math', 'Science'], risk: 'None' },
        { id: 'STU-1002', name: 'Diya Sharma', rollNo: 2, section: 'Section A', score: 91.8, percentile: 97.5, rank: 2, strengths: ['English', 'CS'], risk: 'None' },
        { id: 'STU-1003', name: 'Rohan Iyer', rollNo: 3, section: 'Section A', score: 87.5, percentile: 92.0, rank: 5, strengths: ['Science', 'SST'], risk: 'None' },
        { id: 'STU-1004', name: 'Ananya Nair', rollNo: 4, section: 'Section B', score: 83.2, percentile: 85.0, rank: 11, strengths: ['English', 'Hindi'], risk: 'None' },
        { id: 'STU-1005', name: 'Vikram Joshi', rollNo: 5, section: 'Section B', score: 68.4, percentile: 62.1, rank: 28, strengths: ['CS'], risk: 'Moderate (Math)' },
        { id: 'STU-1006', name: 'Kavya Pillai', rollNo: 6, section: 'Section C', score: 58.2, percentile: 41.5, rank: 35, strengths: ['Hindi'], risk: 'High (Math, Science)' },
        { id: 'STU-1007', name: 'Sameer Khan', rollNo: 7, section: 'Section C', score: 44.5, percentile: 18.2, rank: 40, strengths: ['Sports'], risk: 'Critical (Needs Remedial)' },
    ],
    remedialStudents: [
        { id: 'REM-01', name: 'Sameer Khan', roll: '10-C-07', subject: 'Mathematics', score: 32, target: 50, teacher: 'Dr. Anita Desai', status: 'In Remedial Coaching' },
        { id: 'REM-02', name: 'Kavya Pillai', roll: '10-C-06', subject: 'Science & Tech', score: 38, target: 50, teacher: 'Mr. Rajesh Verma', status: 'Scheduled for Saturday Batch' },
        { id: 'REM-03', name: 'Harish Mehta', roll: '10-B-19', subject: 'Social Science', score: 36, target: 50, teacher: 'Mrs. Priya Sundaram', status: 'Parent Meeting Scheduled' },
        { id: 'REM-04', name: 'Tanya Sengupta', roll: '10-A-32', subject: 'Mathematics', score: 41, target: 60, teacher: 'Dr. Anita Desai', status: 'Diagnostic Test Assigned' },
    ]
}

export function EnterprisePerformanceAnalyticsPage() {
    const { activeStudent } = useActiveStudent()

    // Primary View Switcher: 'class' (Class-wise Analytics) vs 'individual' (Individual Student Analytics)
    const [primaryAnalyticsView, setPrimaryAnalyticsView] = useState('class')

    // Comparison Mode Tabs
    // Modes: 'section' | 'term' | 'subject' | 'student' | 'remedial'
    const [comparisonMode, setComparisonMode] = useState('section')

    // Filter states
    const [selectedClass, setSelectedClass] = useState('Grade 10')
    const [primaryCohort, setPrimaryCohort] = useState('Section A')
    const [comparisonCohort, setComparisonCohort] = useState('Section B')
    const [selectedTerm, setSelectedTerm] = useState('T1_HY')
    const [selectedSubject, setSelectedSubject] = useState('MATH')
    const [selectedStudentId, setSelectedStudentId] = useState('STU-1001')
    const [chartViewType, setChartViewType] = useState('grouped-bar') // 'grouped-bar' | 'stacked-grade' | 'radar' | 'trajectory'
    const [searchTerm, setSearchTerm] = useState('')

    // Derived cohort data
    const classData = MASTER_ANALYTICS_DATA.cohortPerformance[selectedClass] || MASTER_ANALYTICS_DATA.cohortPerformance['Grade 10']
    const primaryData = classData[primaryCohort] || classData['Section A']
    const secondaryData = classData[comparisonCohort] || classData['Section B']

    // Key Variance Metrics Calculation
    const avgDiff = useMemo(() => {
        return (primaryData.overallAvg - secondaryData.overallAvg).toFixed(1)
    }, [primaryData, secondaryData])

    const passDiff = useMemo(() => {
        return (primaryData.passRate - secondaryData.passRate).toFixed(1)
    }, [primaryData, secondaryData])

    const distinctionDiff = useMemo(() => {
        return (primaryData.distinctionRate - secondaryData.distinctionRate).toFixed(1)
    }, [primaryData, secondaryData])

    // ECharts Multi-bar Comparison Option
    const multiBarOption = useMemo(() => {
        const subjects = MASTER_ANALYTICS_DATA.subjects.map(s => s.name)
        const primScores = MASTER_ANALYTICS_DATA.subjects.map(s => primaryData.subjectAverages[s.code] || 70)
        const secScores = MASTER_ANALYTICS_DATA.subjects.map(s => secondaryData.subjectAverages[s.code] || 70)

        return {
            color: ['#4F46E5', '#10B981', '#F59E0B'],
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params) => {
                    let res = `<div class="font-bold pb-1">${params[0].name}</div>`
                    params.forEach(item => {
                        res += `<div class="flex items-center gap-2 text-xs">
                            <span style="display:inline-block;width:10px;height:10px;background-color:${item.color};border-radius:2px;"></span>
                            <span>${item.seriesName}: <b>${item.value}%</b></span>
                        </div>`
                    })
                    if (params.length >= 2) {
                        const delta = (params[0].value - params[1].value).toFixed(1)
                        const deltaColor = delta >= 0 ? '#10B981' : '#EF4444'
                        res += `<div class="mt-1 pt-1 border-t text-xs font-semibold" style="color:${deltaColor}">
                            Variance: ${delta >= 0 ? '+' : ''}${delta}%
                        </div>`
                    }
                    return res
                }
            },
            legend: {
                data: [primaryCohort, comparisonCohort, 'CBSE District Benchmark (75%)'],
                bottom: 0,
                textStyle: { fontSize: 12, color: '#4B5563' }
            },
            grid: {
                top: '12%',
                left: '3%',
                right: '4%',
                bottom: '14%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: subjects,
                axisLabel: {
                    interval: 0,
                    rotate: 15,
                    fontSize: 11,
                    color: '#4B5563'
                }
            },
            yAxis: {
                type: 'value',
                min: 40,
                max: 100,
                name: 'Average Score (%)',
                axisLabel: { formatter: '{value}%' }
            },
            series: [
                {
                    name: primaryCohort,
                    type: 'bar',
                    barGap: '15%',
                    barMaxWidth: 30,
                    data: primScores,
                    itemStyle: { borderRadius: [4, 4, 0, 0] }
                },
                {
                    name: comparisonCohort,
                    type: 'bar',
                    barMaxWidth: 30,
                    data: secScores,
                    itemStyle: { borderRadius: [4, 4, 0, 0] }
                },
                {
                    name: 'CBSE District Benchmark (75%)',
                    type: 'line',
                    data: subjects.map(() => 75),
                    lineStyle: { type: 'dashed', color: '#F59E0B', width: 2 },
                    symbol: 'none'
                }
            ]
        }
    }, [primaryData, secondaryData, primaryCohort, comparisonCohort])

    // Grade Distribution Stacked Bar Option
    const gradeDistributionOption = useMemo(() => {
        const grades = ['A1 (91-100)', 'A2 (81-90)', 'B1 (71-80)', 'B2 (61-70)', 'C1 (51-60)', 'C2 (41-50)', 'E (<40)']
        const pGrades = [primaryData.gradeDistribution.A1, primaryData.gradeDistribution.A2, primaryData.gradeDistribution.B1, primaryData.gradeDistribution.B2, primaryData.gradeDistribution.C1, primaryData.gradeDistribution.C2, primaryData.gradeDistribution.E]
        const sGrades = [secondaryData.gradeDistribution.A1, secondaryData.gradeDistribution.A2, secondaryData.gradeDistribution.B1, secondaryData.gradeDistribution.B2, secondaryData.gradeDistribution.C1, secondaryData.gradeDistribution.C2, secondaryData.gradeDistribution.E]

        return {
            color: ['#4F46E5', '#38BDF8'],
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            legend: {
                data: [primaryCohort, comparisonCohort],
                bottom: 0
            },
            grid: {
                top: '10%',
                left: '3%',
                right: '4%',
                bottom: '12%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: grades,
                axisLabel: { interval: 0, rotate: 12, fontSize: 11 }
            },
            yAxis: {
                type: 'value',
                name: 'Number of Students',
            },
            series: [
                {
                    name: primaryCohort,
                    type: 'bar',
                    data: pGrades,
                    barMaxWidth: 26,
                    itemStyle: { borderRadius: [3, 3, 0, 0] }
                },
                {
                    name: comparisonCohort,
                    type: 'bar',
                    data: sGrades,
                    barMaxWidth: 26,
                    itemStyle: { borderRadius: [3, 3, 0, 0] }
                }
            ]
        }
    }, [primaryData, secondaryData, primaryCohort, comparisonCohort])

    // Historical Trajectory Line Chart Option
    const trajectoryOption = useMemo(() => {
        const terms = MASTER_ANALYTICS_DATA.terms.map(t => t.name)
        return {
            color: ['#4F46E5', '#10B981', '#6366F1'],
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: [primaryCohort, comparisonCohort, 'Passing Cutoff (40%)'],
                bottom: 0
            },
            grid: {
                top: '10%',
                left: '3%',
                right: '4%',
                bottom: '12%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: terms,
                axisLabel: { fontSize: 11 }
            },
            yAxis: {
                type: 'value',
                min: 50,
                max: 100,
                name: 'Average Score (%)',
                axisLabel: { formatter: '{value}%' }
            },
            series: [
                {
                    name: primaryCohort,
                    type: 'line',
                    smooth: true,
                    data: primaryData.termTrajectory,
                    lineStyle: { width: 3 },
                    symbolSize: 8,
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(79, 70, 229, 0.25)' },
                                { offset: 1, color: 'rgba(79, 70, 229, 0.01)' }
                            ]
                        }
                    }
                },
                {
                    name: comparisonCohort,
                    type: 'line',
                    smooth: true,
                    data: secondaryData.termTrajectory,
                    lineStyle: { width: 3 },
                    symbolSize: 8,
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
                                { offset: 1, color: 'rgba(16, 185, 129, 0.01)' }
                            ]
                        }
                    }
                },
                {
                    name: 'Passing Cutoff (40%)',
                    type: 'line',
                    data: terms.map(() => 40),
                    lineStyle: { type: 'dotted', color: '#EF4444' },
                    symbol: 'none'
                }
            ]
        }
    }, [primaryData, secondaryData, primaryCohort, comparisonCohort])

    // Multi-dimensional Radar Chart
    const radarOption = useMemo(() => {
        return {
            color: ['#4F46E5', '#EC4899'],
            tooltip: {},
            legend: {
                data: [primaryCohort, comparisonCohort],
                bottom: 0
            },
            radar: {
                indicator: [
                    { name: 'Conceptual Clarity', max: 100 },
                    { name: 'Application & Problem Solving', max: 100 },
                    { name: 'Practical & Lab Skills', max: 100 },
                    { name: 'Submission Timeliness', max: 100 },
                    { name: 'Exam Temperament & Speed', max: 100 },
                ],
                radius: '68%'
            },
            series: [
                {
                    type: 'radar',
                    data: [
                        {
                            value: [85, 82, 88, 92, 79],
                            name: primaryCohort,
                            areaStyle: { color: 'rgba(79, 70, 229, 0.2)' }
                        },
                        {
                            value: [74, 71, 80, 84, 72],
                            name: comparisonCohort,
                            areaStyle: { color: 'rgba(236, 72, 153, 0.2)' }
                        }
                    ]
                }
            ]
        }
    }, [primaryCohort, comparisonCohort])

    // Student Benchmark Comparison
    const selectedStudent = useMemo(() => {
        return MASTER_ANALYTICS_DATA.studentsBenchmark.find(s => s.id === selectedStudentId) || MASTER_ANALYTICS_DATA.studentsBenchmark[0]
    }, [selectedStudentId])

    // Student vs Cohort Subject Comparison
    const studentSubjectOption = useMemo(() => {
        const subjects = MASTER_ANALYTICS_DATA.subjects.map(s => s.name)
        const baseScore = selectedStudent.score || 80
        const studentScores = [
            Math.min(100, Math.round(baseScore + 3)),
            Math.min(100, Math.round(baseScore - 2)),
            Math.min(100, Math.round(baseScore + 1)),
            Math.min(100, Math.round(baseScore - 4)),
            Math.min(100, Math.round(baseScore + 4)),
            Math.min(100, Math.round(baseScore - 1))
        ]
        const classAvg = MASTER_ANALYTICS_DATA.subjects.map(s => primaryData.subjectAverages[s.code] || 75)

        return {
            color: ['#4F46E5', '#94A3B8', '#F59E0B'],
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { data: [selectedStudent.name, `${primaryCohort} Class Average`, 'Benchmark (75%)'], bottom: 0 },
            grid: { top: '12%', left: '3%', right: '4%', bottom: '14%', containLabel: true },
            xAxis: { type: 'category', data: subjects, axisLabel: { interval: 0, rotate: 15, fontSize: 11 } },
            yAxis: { type: 'value', min: 0, max: 100, name: 'Score (%)' },
            series: [
                { name: selectedStudent.name, type: 'bar', barMaxWidth: 28, data: studentScores, itemStyle: { borderRadius: [4, 4, 0, 0] } },
                { name: `${primaryCohort} Class Average`, type: 'bar', barMaxWidth: 28, data: classAvg, itemStyle: { borderRadius: [4, 4, 0, 0] } },
                { name: 'Benchmark (75%)', type: 'line', data: subjects.map(() => 75), lineStyle: { type: 'dashed', color: '#F59E0B' } }
            ]
        }
    }, [selectedStudent, primaryData, primaryCohort])

    const handleExportCSV = () => {
        toast.success(`Exported ${selectedClass} Performance Comparison Report (CSV)`)
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header Title & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Academic Performance Analytics</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Multi-dimensional comparative analytics across sections, terms, subjects, and cohort benchmarks
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs"
                    >
                        <Download className="w-4 h-4 text-gray-500" />
                        Export Dataset
                    </button>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs"
                    >
                        <Printer className="w-4 h-4 text-gray-500" />
                        Print Analytics
                    </button>
                    <button
                        onClick={() => toast.info('Refreshed live evaluation records')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Sync Data
                    </button>
                </div>
            </div>

            {/* Primary View Switcher: Class-wise vs Individual Student */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
                <button
                    type="button"
                    onClick={() => setPrimaryAnalyticsView('class')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        primaryAnalyticsView === 'class'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Users size={18} />
                    Class-wise Analytics
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setPrimaryAnalyticsView('individual')
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        primaryAnalyticsView === 'individual'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <GraduationCap size={18} />
                    Individual Student Analytics
                </button>
            </div>

            {primaryAnalyticsView === 'class' && (
                <>
                    {/* Comparison Mode Selector Tabs */}
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {[
                                { id: 'section', label: 'Section vs Section Comparison', icon: Users, desc: 'Side-by-side section analytics' },
                                { id: 'term', label: 'Term vs Term Progression', icon: TrendingUp, desc: 'Historical semester trajectory' },
                                { id: 'subject', label: 'Subject Gap & Blueprint Analysis', icon: BookOpen, desc: 'Cross-subject variance' },
                                { id: 'remedial', label: 'Remedial & Intervention Matrix', icon: AlertTriangle, desc: 'At-risk intervention tracking' }
                            ].map(tab => {
                                const Icon = tab.icon
                                const isActive = comparisonMode === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setComparisonMode(tab.id)}
                                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                                        <span>{tab.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

            {/* Dynamic Interactive Filter Controls Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                        <span>Comparison Control Matrix</span>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">Academic Session: 2025-2026 | CBSE Board Curriculum</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Target Class</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/50"
                        >
                            {MASTER_ANALYTICS_DATA.classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Baseline Cohort (Group A)</label>
                        <select
                            value={primaryCohort}
                            onChange={(e) => setPrimaryCohort(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-indigo-50/30 font-medium text-indigo-900"
                        >
                            {MASTER_ANALYTICS_DATA.sections.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Comparison Target (Group B)</label>
                        <select
                            value={comparisonCohort}
                            onChange={(e) => setComparisonCohort(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-50/30 font-medium text-emerald-900"
                        >
                            {MASTER_ANALYTICS_DATA.sections.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Exam Term Context</label>
                        <select
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/50"
                        >
                            {MASTER_ANALYTICS_DATA.terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* KPI Comparative Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Overall Average Score</span>
                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                            Number(avgDiff) >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                            {Number(avgDiff) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                            {avgDiff >= 0 ? `+${avgDiff}%` : `${avgDiff}%`}
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">{primaryData.overallAvg}%</span>
                        <span className="text-sm text-gray-400">vs {secondaryData.overallAvg}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        <span className="font-semibold text-indigo-600">{primaryCohort}</span> compared to <span className="font-semibold text-gray-700">{comparisonCohort}</span>
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Class Pass Rate</span>
                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                            Number(passDiff) >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                            {Number(passDiff) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                            {passDiff >= 0 ? `+${passDiff}%` : `${passDiff}%`}
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-emerald-600">{primaryData.passRate}%</span>
                        <span className="text-sm text-gray-400">vs {secondaryData.passRate}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        CBSE Minimum Qualifying: <span className="font-semibold">33.0%</span>
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Distinction Rate (&ge;75%)</span>
                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                            Number(distinctionDiff) >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                            {Number(distinctionDiff) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                            {distinctionDiff >= 0 ? `+${distinctionDiff}%` : `${distinctionDiff}%`}
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-indigo-600">{primaryData.distinctionRate}%</span>
                        <span className="text-sm text-gray-400">vs {secondaryData.distinctionRate}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        High-achiever cohort proportion
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">At-Risk / Remedial</span>
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            Attention Needed
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-amber-600">{primaryData.gradeDistribution.E}</span>
                        <span className="text-sm text-gray-400">vs {secondaryData.gradeDistribution.E} students</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Scoring below 40% in 1 or more subjects
                    </p>
                </div>
            </div>

            {/* Visual Analytics & Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Interactive Comparison Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                {chartViewType === 'grouped-bar' && 'Subject-wise Score Comparison'}
                                {chartViewType === 'stacked-grade' && 'Grade Band Distribution (CBSE)'}
                                {chartViewType === 'trajectory' && 'Historical Multi-Term Trajectory'}
                                {chartViewType === 'radar' && '5-Dimensional Competency Spider Radar'}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Comparative view: <span className="font-semibold text-indigo-600">{primaryCohort}</span> vs <span className="font-semibold text-emerald-600">{comparisonCohort}</span>
                            </p>
                        </div>

                        {/* Chart View Switcher */}
                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-medium">
                            <button
                                onClick={() => setChartViewType('grouped-bar')}
                                className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                                    chartViewType === 'grouped-bar' ? 'bg-white text-indigo-600 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Bar Comparison
                            </button>
                            <button
                                onClick={() => setChartViewType('stacked-grade')}
                                className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                                    chartViewType === 'stacked-grade' ? 'bg-white text-indigo-600 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Grade Bands
                            </button>
                            <button
                                onClick={() => setChartViewType('trajectory')}
                                className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                                    chartViewType === 'trajectory' ? 'bg-white text-indigo-600 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Trajectory
                            </button>
                            <button
                                onClick={() => setChartViewType('radar')}
                                className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                                    chartViewType === 'radar' ? 'bg-white text-indigo-600 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Competency Radar
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        {chartViewType === 'grouped-bar' && <SafeChart option={multiBarOption} style={{ height: 350 }} />}
                        {chartViewType === 'stacked-grade' && <SafeChart option={gradeDistributionOption} style={{ height: 350 }} />}
                        {chartViewType === 'trajectory' && <SafeChart option={trajectoryOption} style={{ height: 350 }} />}
                        {chartViewType === 'radar' && <SafeChart option={radarOption} style={{ height: 350 }} />}
                    </div>
                </div>

                {/* Right Insights & Cohort Breakdown Widget */}
                <div className="space-y-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                Automated Diagnostic Insights
                            </h3>
                        </div>

                        <div className="space-y-2.5 text-xs text-gray-600">
                            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                                <span className="font-semibold text-indigo-900 block mb-1">Top Subject Variance:</span>
                                Mathematics shows the highest variance of <span className="font-bold text-indigo-700">11.3%</span> between {primaryCohort} (82.5%) and {comparisonCohort} (71.2%).
                            </div>

                            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                                <span className="font-semibold text-emerald-900 block mb-1">Strongest Performing Domain:</span>
                                Computer Applications leads with class-wide distinction across all sections (&gt;80% avg).
                            </div>

                            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                                <span className="font-semibold text-rose-900 block mb-1">Intervention Alert:</span>
                                2 students in {comparisonCohort} are below 35% in Science Theory. Recommended remedial session before final term.
                            </div>
                        </div>
                    </div>

                    {/* Section Profile Snapshot */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Cohort Teachers & Mentors</h3>
                        <div className="space-y-3 text-xs">
                            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                                <div>
                                    <span className="font-semibold text-gray-800 block">{primaryCohort}</span>
                                    <span className="text-gray-500">{primaryData.classTeacher}</span>
                                </div>
                                <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium">
                                    {primaryData.studentCount} Students
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                                <div>
                                    <span className="font-semibold text-gray-800 block">{comparisonCohort}</span>
                                    <span className="text-gray-500">{secondaryData.classTeacher}</span>
                                </div>
                                <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium">
                                    {secondaryData.studentCount} Students
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab-Dependent Sub-Components */}
            {comparisonMode === 'section' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Detailed Subject-wise Comparative Matrix</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Comprehensive breakdown comparing performance metrics between {primaryCohort} and {comparisonCohort}</p>
                        </div>
                        <div className="text-xs font-medium text-gray-500">
                            Showing 6 CBSE core and elective disciplines
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                                <tr>
                                    <th className="px-4 py-3">Subject</th>
                                    <th className="px-4 py-3">{primaryCohort} Avg</th>
                                    <th className="px-4 py-3">{comparisonCohort} Avg</th>
                                    <th className="px-4 py-3">Variance</th>
                                    <th className="px-4 py-3">Benchmark</th>
                                    <th className="px-4 py-3">Performance Band</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {MASTER_ANALYTICS_DATA.subjects.map((subj) => {
                                    const pScore = primaryData.subjectAverages[subj.code] || 70
                                    const sScore = secondaryData.subjectAverages[subj.code] || 70
                                    const diff = (pScore - sScore).toFixed(1)
                                    const isPositive = Number(diff) >= 0

                                    return (
                                        <tr key={subj.code} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="font-semibold text-gray-900">{subj.name}</div>
                                                <div className="text-xs text-gray-400">Code: {subj.code} | Max: {subj.maxMarks}</div>
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-indigo-600">
                                                {pScore}%
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-gray-700">
                                                {sScore}%
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                                                    isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                }`}>
                                                    {isPositive ? `+${diff}%` : `${diff}%`}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-gray-600">
                                                75.0% (District)
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {pScore >= 80 ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Distinction Track
                                                    </span>
                                                ) : pScore >= 70 ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                                        Above Average
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                                        Needs Improvement
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <button
                                                    onClick={() => toast.info(`Viewing question paper blueprint for ${subj.name}`)}
                                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                                                >
                                                    View Blueprint
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {primaryAnalyticsView === 'class' && comparisonMode === 'remedial' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Targeted Remedial Intervention Roster
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">Students flagged for individualized academic support based on latest assessment marks</p>
                        </div>
                        <button
                            onClick={() => toast.success('Remedial schedule notification sent to parents')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-2xs"
                        >
                            Schedule Remedial Batch
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                                <tr>
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3">Roll & Section</th>
                                    <th className="px-4 py-3">Concern Subject</th>
                                    <th className="px-4 py-3">Current Score</th>
                                    <th className="px-4 py-3">Target Score</th>
                                    <th className="px-4 py-3">Mentor Teacher</th>
                                    <th className="px-4 py-3">Intervention Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {MASTER_ANALYTICS_DATA.remedialStudents.map((rem) => (
                                    <tr key={rem.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-4 py-3.5 font-semibold text-gray-900">{rem.name}</td>
                                        <td className="px-4 py-3.5 text-xs text-gray-600">{rem.roll}</td>
                                        <td className="px-4 py-3.5 text-xs font-medium text-gray-800">{rem.subject}</td>
                                        <td className="px-4 py-3.5 font-bold text-rose-600">{rem.score}%</td>
                                        <td className="px-4 py-3.5 font-bold text-emerald-600">{rem.target}%</td>
                                        <td className="px-4 py-3.5 text-xs text-gray-600">{rem.teacher}</td>
                                        <td className="px-4 py-3.5">
                                            <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                {rem.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <button
                                                onClick={() => toast.info(`Opened coaching plan for ${rem.name}`)}
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                                            >
                                                Coaching Plan
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            </>
            )}

            {/* Individual Student Analytics View */}
            {primaryAnalyticsView === 'individual' && (
                <div className="space-y-6">
                    {/* Student Selector Control Bar */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                <GraduationCap className="w-5 h-5 text-indigo-600" />
                                <span>Individual Student Diagnostics & Scorecard</span>
                            </div>
                            <span className="text-xs text-slate-500">
                                Detailed longitudinal profile, subject variance & competency mapping
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                                    Select Student
                                </label>
                                <select
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm font-semibold border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-indigo-50/20 text-indigo-900"
                                >
                                    {MASTER_ANALYTICS_DATA.studentsBenchmark.map((stu) => (
                                        <option key={stu.id} value={stu.id}>
                                            {stu.name} (Roll: {stu.rollNo} • {stu.section})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                                    Class & Section Context
                                </label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 text-slate-700"
                                >
                                    {MASTER_ANALYTICS_DATA.classes.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                                    Assessment Term
                                </label>
                                <select
                                    value={selectedTerm}
                                    onChange={(e) => setSelectedTerm(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 text-slate-700"
                                >
                                    {MASTER_ANALYTICS_DATA.terms.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Student Benchmark Scorecard (4 KPIs) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                            <span className="text-xs font-medium text-slate-500 block">Overall Assessment Score</span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-indigo-600">{selectedStudent.score}%</span>
                                <span className="text-xs text-slate-400">Class Mean: {primaryData.overallAvg}%</span>
                            </div>
                            <span className="text-xs font-semibold text-emerald-600 block mt-1">
                                +{(selectedStudent.score - primaryData.overallAvg).toFixed(1)}% above class average
                            </span>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                            <span className="text-xs font-medium text-slate-500 block">Cohort Percentile Rank</span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-emerald-600">{selectedStudent.percentile}th</span>
                                <span className="text-xs text-slate-400">Percentile</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-700 block mt-1">
                                Rank #{selectedStudent.rank} in {selectedStudent.section}
                            </span>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                            <span className="text-xs font-medium text-slate-500 block">Identified Subject Strengths</span>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {selectedStudent.strengths?.map((str) => (
                                    <span key={str} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        {str}
                                    </span>
                                ))}
                            </div>
                            <span className="text-xs text-slate-400 block mt-2">Consistent high performance</span>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                            <span className="text-xs font-medium text-slate-500 block">Academic Support Category</span>
                            <div className="mt-2">
                                <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-lg ${
                                    selectedStudent.risk.includes('Critical') || selectedStudent.risk.includes('High')
                                        ? 'bg-rose-100 text-rose-800'
                                        : selectedStudent.risk.includes('Moderate')
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                    {selectedStudent.risk}
                                </span>
                            </div>
                            <span className="text-xs text-slate-400 block mt-2">Evaluation status up-to-date</span>
                        </div>
                    </div>

                    {/* Charts: Student vs Class Subject Breakdown & Radar */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Subject-wise Scores vs Class Average Benchmark
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Comparing {selectedStudent.name}&apos;s marks against {primaryCohort} mean and minimum passing cutoff
                                    </p>
                                </div>
                            </div>
                            <SafeChart option={studentSubjectOption} style={{ height: 350 }} />
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Competency Radar</h3>
                                <p className="text-xs text-slate-500">
                                    Cognitive skills and practical mastery
                                </p>
                            </div>
                            <SafeChart option={radarOption} style={{ height: 350 }} />
                        </div>
                    </div>

                    {/* Detailed Subject Score Breakdown Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="text-base font-bold text-slate-900">
                                Detailed Subject Performance & Diagnostic Scorecard
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Breakdown of individual marks, class baseline comparisons, and teacher remarks for {selectedStudent.name}
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-4 py-3">Subject</th>
                                        <th className="px-4 py-3">Student Score</th>
                                        <th className="px-4 py-3">Class Mean</th>
                                        <th className="px-4 py-3">Variance</th>
                                        <th className="px-4 py-3">Grade</th>
                                        <th className="px-4 py-3">Standing</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {MASTER_ANALYTICS_DATA.subjects.map((subj) => {
                                        const classMean = primaryData.subjectAverages[subj.code] || 75
                                        const baseScore = selectedStudent.score || 80
                                        const stuScore = Math.min(100, Math.round(baseScore + (subj.code === 'MATH' ? 3 : subj.code === 'CS' ? 5 : -1)))
                                        const diff = (stuScore - classMean).toFixed(1)
                                        const isPositive = Number(diff) >= 0
                                        const grade = stuScore >= 90 ? 'A+' : stuScore >= 80 ? 'A' : stuScore >= 70 ? 'B+' : stuScore >= 60 ? 'B' : 'C'

                                        return (
                                            <tr key={subj.code} className="hover:bg-slate-50/60">
                                                <td className="px-4 py-3.5">
                                                    <span className="font-bold text-slate-900 block">{subj.name}</span>
                                                    <span className="text-xs text-slate-400">Code: {subj.code} • Max: {subj.maxMarks}</span>
                                                </td>
                                                <td className="px-4 py-3.5 font-extrabold text-indigo-600 text-base">
                                                    {stuScore}%
                                                </td>
                                                <td className="px-4 py-3.5 font-medium text-slate-600">
                                                    {classMean}%
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                                                        isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                    }`}>
                                                        {isPositive ? `+${diff}%` : `${diff}%`}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                                                        {grade}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-xs">
                                                    {stuScore >= 85 ? (
                                                        <span className="font-semibold text-emerald-700">Excellent / Distinction</span>
                                                    ) : stuScore >= 70 ? (
                                                        <span className="font-semibold text-blue-700">Competent / On Track</span>
                                                    ) : (
                                                        <span className="font-semibold text-amber-700">Requires Focus</span>
                                                    )}
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
        </div>
    )
}

export default EnterprisePerformanceAnalyticsPage

