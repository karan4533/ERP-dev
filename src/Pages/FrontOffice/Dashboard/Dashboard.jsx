import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactEChartsComponent from 'echarts-for-react'

// Robust component unwrapper for modern ESM / React 19 bundlers
const EChartsWrapper = typeof ReactEChartsComponent === 'function'
    ? ReactEChartsComponent
    : (ReactEChartsComponent?.default || ReactEChartsComponent)

// Error-resilient chart container
const SafeChart = ({ option, style, className }) => {
    try {
        const Component = EChartsWrapper
        if (Component && typeof Component === 'function') {
            return <Component option={option} style={style} className={className} opts={{ renderer: 'svg' }} />
        }
    } catch {
        /* fallback below */
    }
    return (
        <div style={style} className={`flex items-center justify-center bg-slate-50 text-[11px] text-slate-400 rounded-lg ${className || ''}`}>
            Chart visual loaded
        </div>
    )
}

import {
    GraduationCap,
    Calendar,
    Filter,
    RotateCcw,
    Info,
    Plus,
    Users,
    UserCheck,
    ShieldCheck,
    FileText,
    Clock,
    CheckCircle2,
    UserPlus,
    ArrowUp,
    ArrowDown
} from 'lucide-react'

// Sparkline SVG component
const Sparkline = ({ points, color = '#3B5CEB', height = 36, width = 90 }) => {
    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max - min || 1
    const step = width / (points.length - 1)

    const coords = points.map((p, i) => {
        const x = i * step
        const y = height - ((p - min) / range) * (height - 8) - 4
        return `${x.toFixed(1)},${y.toFixed(1)}`
    })

    const d = coords.reduce((acc, curr, idx, arr) => {
        if (idx === 0) return `M ${curr}`
        const [prevX, prevY] = arr[idx - 1].split(',').map(Number)
        const [currX, currY] = curr.split(',').map(Number)
        const midX = (prevX + currX) / 2
        return `${acc} C ${midX},${prevY} ${midX},${currY} ${currX},${currY}`
    }, '')

    return (
        <svg width={width} height={height} className="overflow-visible shrink-0">
            <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

const Dashboard = () => {
    const navigate = useNavigate()

    // Filter states
    const [academicYear, setAcademicYear] = useState('2026 - 2027')
    const [dateRange, setDateRange] = useState('01 Oct 2026 - 31 Oct 2026')

    // Chart toggles
    const [trendTimeframe, setTrendTimeframe] = useState('Weekly')
    const [visitorTimeframe, setVisitorTimeframe] = useState('Daily')

    // Filter reset
    const handleReset = () => {
        setAcademicYear('2026 - 2027')
        setDateRange('01 Oct 2026 - 31 Oct 2026')
    }

    // 1. Enquiry Trend Chart Config
    const enquiryTrendOption = useMemo(() => {
        const isWeekly = trendTimeframe === 'Weekly'
        const xData = isWeekly ? ['6 Oct', '13 Oct', '20 Oct', '27 Oct'] : ['Week 1', 'Week 2', 'Week 3', 'Week 4']
        const yData = isWeekly ? [38, 52, 67, 86] : [42, 58, 71, 94]

        return {
            tooltip: {
                trigger: 'axis',
                backgroundColor: '#1E293B',
                textStyle: { color: '#FFFFFF', fontSize: 11 },
                borderWidth: 0,
                formatter: '{b}: <span style="font-weight:700">{c} Enquiries</span>'
            },
            grid: {
                top: 22,
                bottom: 24,
                left: 28,
                right: 12,
                containLabel: false
            },
            xAxis: {
                type: 'category',
                data: xData,
                axisLine: { lineStyle: { color: '#E2E8F0' } },
                axisLabel: { color: '#64748B', fontSize: 10 },
                axisTick: { show: false }
            },
            yAxis: {
                type: 'value',
                min: 0,
                max: 100,
                interval: 20,
                splitLine: { lineStyle: { color: '#F1F5F9', type: 'solid' } },
                axisLabel: { color: '#94A3B8', fontSize: 9 }
            },
            series: [
                {
                    data: yData,
                    type: 'line',
                    smooth: false,
                    symbol: 'circle',
                    symbolSize: 5,
                    itemStyle: { color: '#3B5CEB', borderColor: '#FFFFFF', borderWidth: 2 },
                    lineStyle: { color: '#3B5CEB', width: 2.2 },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(59, 92, 235, 0.22)' },
                                { offset: 1, color: 'rgba(59, 92, 235, 0.02)' }
                            ]
                        }
                    },
                    label: {
                        show: true,
                        position: 'top',
                        color: '#1E293B',
                        fontWeight: 600,
                        fontSize: 10,
                        offset: [0, -3]
                    }
                }
            ]
        }
    }, [trendTimeframe])

    // 2. Enquiry Source Data
    const enquirySourceData = [
        { value: 42, name: 'Website', color: '#3B5CEB' },
        { value: 24, name: 'Walk-in', color: '#6085FF' },
        { value: 18, name: 'Referral', color: '#8EA7FA' },
        { value: 10, name: 'Social Media', color: '#BAC8FC' },
        { value: 6, name: 'Others', color: '#DCE4FD' }
    ]

    const enquirySourceOption = useMemo(() => {
        return {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: <b>{c}%</b>',
                backgroundColor: '#1E293B',
                textStyle: { color: '#FFFFFF', fontSize: 11 }
            },
            series: [
                {
                    name: 'Enquiry Source',
                    type: 'pie',
                    radius: ['52%', '78%'],
                    center: ['50%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 3,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        show: true,
                        position: 'center',
                        formatter: '{count|86}\n{text|Enquiries}',
                        rich: {
                            count: {
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: '#1E293B',
                                lineHeight: 18
                            },
                            text: {
                                fontSize: 10,
                                color: '#64748B',
                                lineHeight: 13
                            }
                        }
                    },
                    labelLine: { show: false },
                    data: enquirySourceData.map((d) => ({
                        value: d.value,
                        name: d.name,
                        itemStyle: { color: d.color }
                    }))
                }
            ]
        }
    }, [])

    // 3. Visitor Check-in / Check-out Bar Chart Config
    const visitorBarOption = useMemo(() => {
        const xDays = ['27 Oct', '28 Oct', '29 Oct', '30 Oct', '31 Oct']
        const checkIns = [32, 41, 46, 39, 47]
        const checkOuts = [28, 37, 43, 36, 44]

        return {
            tooltip: {
                trigger: 'axis',
                backgroundColor: '#1E293B',
                textStyle: { color: '#FFFFFF', fontSize: 11 }
            },
            grid: {
                top: 22,
                bottom: 22,
                left: 28,
                right: 8,
                containLabel: false
            },
            xAxis: {
                type: 'category',
                data: xDays,
                axisLine: { lineStyle: { color: '#E2E8F0' } },
                axisLabel: { color: '#64748B', fontSize: 9.5 },
                axisTick: { show: false }
            },
            yAxis: {
                type: 'value',
                min: 0,
                max: 60,
                interval: 10,
                splitLine: { lineStyle: { color: '#F1F5F9' } },
                axisLabel: { color: '#94A3B8', fontSize: 9 }
            },
            series: [
                {
                    name: 'Check-in',
                    type: 'bar',
                    barWidth: 7,
                    barGap: '25%',
                    itemStyle: {
                        color: '#3B5CEB',
                        borderRadius: [3, 3, 0, 0]
                    },
                    label: {
                        show: true,
                        position: 'top',
                        fontSize: 8.5,
                        color: '#3B5CEB',
                        fontWeight: 600,
                        offset: [0, -1]
                    },
                    data: checkIns
                },
                {
                    name: 'Check-out',
                    type: 'bar',
                    barWidth: 7,
                    itemStyle: {
                        color: '#C7D2FE',
                        borderRadius: [3, 3, 0, 0]
                    },
                    label: {
                        show: true,
                        position: 'top',
                        fontSize: 8.5,
                        color: '#6366F1',
                        fontWeight: 600,
                        offset: [0, -1]
                    },
                    data: checkOuts
                }
            ]
        }
    }, [visitorTimeframe])

    // 4. Gate Pass Status Data
    const gatePassData = [
        { value: 72, percent: 59, name: 'Issued', color: '#3B5CEB' },
        { value: 41, percent: 34, name: 'Returned', color: '#8EA7FA' },
        { value: 8, percent: 7, name: 'Expired', color: '#E0E7FF' }
    ]

    const gatePassStatusOption = useMemo(() => {
        return {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: <b>{c}</b> ({d}%)',
                backgroundColor: '#1E293B',
                textStyle: { color: '#FFFFFF', fontSize: 11 }
            },
            series: [
                {
                    name: 'Gate Pass Status',
                    type: 'pie',
                    radius: ['52%', '78%'],
                    center: ['50%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 3,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        show: true,
                        position: 'center',
                        formatter: '{count|121}\n{text|Passes}',
                        rich: {
                            count: {
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: '#1E293B',
                                lineHeight: 18
                            },
                            text: {
                                fontSize: 10,
                                color: '#64748B',
                                lineHeight: 13
                            }
                        }
                    },
                    labelLine: { show: false },
                    data: gatePassData.map((d) => ({
                        value: d.value,
                        name: d.name,
                        itemStyle: { color: d.color }
                    }))
                }
            ]
        }
    }, [])

    return (
        <div className="space-y-6 pb-12">
            {/* Top Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3.5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Academic Year */}
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white">
                        <GraduationCap className="w-4 h-4 text-gray-500 shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-medium leading-none">Academic Year</span>
                            <select
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                                className="text-xs font-semibold text-gray-800 bg-transparent outline-none cursor-pointer pr-2 pt-0.5"
                            >
                                <option value="2026 - 2027">2026 - 2027</option>
                                <option value="2025 - 2026">2025 - 2026</option>
                                <option value="2024 - 2025">2024 - 2025</option>
                            </select>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-2.5 border border-gray-200 rounded-lg px-3 py-2 bg-white">
                        <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-medium leading-none">Date Range</span>
                            <span className="text-xs font-semibold text-gray-800 pt-0.5 whitespace-nowrap">{dateRange}</span>
                        </div>
                        <Calendar className="w-3.5 h-3.5 text-gray-400 ml-2 shrink-0" />
                    </div>
                </div>

                {/* Filter Action Buttons */}
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => {}}
                        className="bg-[#3B5CEB] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                        <Filter className="w-3.5 h-3.5" />
                        <span>Apply</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                        <span>Reset</span>
                    </button>
                </div>
            </div>

            {/* Overview Title and Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Front Office Overview</h1>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <Info className="w-3 h-3 text-blue-600" />
                            <span>Demo data</span>
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Enquiries, visitors, documents and gate pass activity at a glance.
                    </p>
                </div>

                {/* 3 Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => navigate('/front-office/admission-enquiry/add')}
                        className="bg-[#3B5CEB] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Register Enquiry</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/front-office/visitors')}
                        className="bg-white border border-[#3B5CEB] text-[#3B5CEB] hover:bg-blue-50 text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                        <Users className="w-4 h-4" />
                        <span>Check In Visitor</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/front-office/add-gate-pass')}
                        className="bg-white border border-[#3B5CEB] text-[#3B5CEB] hover:bg-blue-50 text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Issue Gate Pass</span>
                    </button>
                </div>
            </div>

            {/* 4 Stat Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* 1. New Enquiries */}
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#3B5CEB] mb-2.5">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">New Enquiries</span>
                        <div className="text-2xl font-bold text-gray-900 mt-0.5">86</div>
                        <div className="flex items-center gap-1 mt-1 text-[11px] whitespace-nowrap">
                            <span className="text-emerald-600 font-semibold flex items-center">
                                <ArrowUp className="w-3 h-3 stroke-[2.5]" /> +12%
                            </span>
                            <span className="text-gray-400">vs previous period</span>
                        </div>
                    </div>
                    <div className="pt-4">
                        <Sparkline points={[30, 42, 38, 55, 62, 58, 75, 86]} color="#3B5CEB" />
                    </div>
                </div>

                {/* 2. Today's Visitors */}
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#3B5CEB] mb-2.5">
                            <UserCheck className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">Today's Visitors</span>
                        <div className="text-2xl font-bold text-gray-900 mt-0.5">47</div>
                        <div className="flex items-center gap-1 mt-1 text-[11px] whitespace-nowrap">
                            <span className="text-emerald-600 font-semibold flex items-center">
                                <ArrowUp className="w-3 h-3 stroke-[2.5]" /> +18%
                            </span>
                            <span className="text-gray-400">vs previous day</span>
                        </div>
                    </div>
                    <div className="pt-4">
                        <Sparkline points={[25, 32, 28, 38, 42, 36, 44, 47]} color="#3B5CEB" />
                    </div>
                </div>

                {/* 3. Pending Documents */}
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#3B5CEB] mb-2.5">
                            <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">Pending Documents</span>
                        <div className="text-2xl font-bold text-gray-900 mt-0.5">28</div>
                        <div className="flex items-center gap-1 mt-1 text-[11px] whitespace-nowrap">
                            <span className="text-rose-600 font-semibold flex items-center">
                                <ArrowDown className="w-3 h-3 stroke-[2.5]" /> -10%
                            </span>
                            <span className="text-gray-400">vs previous period</span>
                        </div>
                    </div>
                    <div className="pt-4">
                        <Sparkline points={[45, 40, 42, 35, 38, 32, 30, 28]} color="#8EA7FA" />
                    </div>
                </div>

                {/* 4. Gate Passes Issued */}
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#3B5CEB] mb-2.5">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">Gate Passes Issued</span>
                        <div className="text-2xl font-bold text-gray-900 mt-0.5">121</div>
                        <div className="flex items-center gap-1 mt-1 text-[11px] whitespace-nowrap">
                            <span className="text-emerald-600 font-semibold flex items-center">
                                <ArrowUp className="w-3 h-3 stroke-[2.5]" /> +14%
                            </span>
                            <span className="text-gray-400">vs previous period</span>
                        </div>
                    </div>
                    <div className="pt-4">
                        <Sparkline points={[60, 72, 68, 85, 92, 88, 105, 121]} color="#3B5CEB" />
                    </div>
                </div>
            </div>

            {/* 4 Analytical Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Chart 1: Enquiry Trend */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className="text-xs font-bold text-gray-800 truncate" title="Enquiry Trend">
                                Enquiry Trend
                            </h3>
                            <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        </div>
                        <select
                            value={trendTimeframe}
                            onChange={(e) => setTrendTimeframe(e.target.value)}
                            className="text-[11px] font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 outline-none cursor-pointer shrink-0"
                        >
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                        </select>
                    </div>
                    <SafeChart option={enquiryTrendOption} style={{ height: 150, width: '100%' }} />
                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-50 text-[11px] text-gray-500">
                        <span>Period Total</span>
                        <span className="font-bold text-gray-900">86 Enquiries</span>
                    </div>
                </div>

                {/* Chart 2: Enquiry Source */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 mb-2">
                        <h3 className="text-xs font-bold text-gray-800">Enquiry Source</h3>
                        <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                        {/* Donut Canvas on Left */}
                        <div className="w-[115px] h-[150px] shrink-0">
                            <SafeChart option={enquirySourceOption} style={{ height: 150, width: '100%' }} />
                        </div>
                        {/* Clean HTML Legend on Right */}
                        <div className="flex-1 flex flex-col gap-1.5 pl-1">
                            {enquirySourceData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between gap-1 text-[11px]">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className="text-gray-600 truncate">{item.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900 shrink-0">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pt-1.5 border-t border-gray-50 text-[10px] text-gray-400 text-center">
                        Total breakdown across 5 channels
                    </div>
                </div>

                {/* Chart 3: Visitor Check-in / Check-out */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className="text-xs font-bold text-gray-800 truncate" title="Visitor Check-in / Check-out">
                                Visitor Check-in / Check-out
                            </h3>
                            <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        </div>
                        <select
                            value={visitorTimeframe}
                            onChange={(e) => setVisitorTimeframe(e.target.value)}
                            className="text-[11px] font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 outline-none cursor-pointer shrink-0"
                        >
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                        </select>
                    </div>
                    <SafeChart option={visitorBarOption} style={{ height: 150, width: '100%' }} />
                    <div className="flex items-center justify-center gap-4 pt-1.5 border-t border-gray-50">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#3B5CEB]" />
                            <span className="text-[11px] text-gray-600 font-medium">Check-in</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#C7D2FE]" />
                            <span className="text-[11px] text-gray-600 font-medium">Check-out</span>
                        </div>
                    </div>
                </div>

                {/* Chart 4: Gate Pass Status */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 mb-2">
                        <h3 className="text-xs font-bold text-gray-800">Gate Pass Status</h3>
                        <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                        {/* Donut Canvas on Left */}
                        <div className="w-[115px] h-[150px] shrink-0">
                            <SafeChart option={gatePassStatusOption} style={{ height: 150, width: '100%' }} />
                        </div>
                        {/* Clean HTML Legend on Right */}
                        <div className="flex-1 flex flex-col gap-2 pl-1">
                            {gatePassData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between gap-1 text-[11px]">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className="text-gray-600 truncate">{item.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900 shrink-0 text-right whitespace-nowrap">
                                        {item.value} <span className="text-gray-400 font-normal">({item.percent}%)</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pt-1.5 border-t border-gray-50 text-[10px] text-gray-400 text-center">
                        Total 121 active campus passes
                    </div>
                </div>
            </div>

            {/* Bottom Section: Recent Activity & Follow-up List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Card: Recent Activity */}
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/front-office/admission-enquiry')}
                                className="text-xs font-semibold text-[#3B5CEB] hover:underline cursor-pointer"
                            >
                                View All
                            </button>
                        </div>

                        {/* Activity Timeline List */}
                        <div className="mt-4 space-y-4">
                            {/* Item 1 */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                                    <span className="text-xs text-gray-400 w-24 shrink-0 pt-0.5 whitespace-nowrap">Today, 11:42 AM</span>
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <UserPlus className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-semibold text-gray-800 truncate">New enquiry registered</h4>
                                        <p className="text-[11px] text-gray-500 truncate">Ruhaan K. - Grade 4</p>
                                    </div>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 shrink-0">
                                    Enquiry
                                </span>
                            </div>

                            {/* Item 2 */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                                    <span className="text-xs text-gray-400 w-24 shrink-0 pt-0.5 whitespace-nowrap">Today, 11:10 AM</span>
                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                        <Users className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-semibold text-gray-800 truncate">Visitor checked in</h4>
                                        <p className="text-[11px] text-gray-500 truncate">Parent - Anitha Raman</p>
                                    </div>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 shrink-0">
                                    Visitor
                                </span>
                            </div>

                            {/* Item 3 */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                                    <span className="text-xs text-gray-400 w-24 shrink-0 pt-0.5 whitespace-nowrap">Today, 10:37 AM</span>
                                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-semibold text-gray-800 truncate">Gate pass issued</h4>
                                        <p className="text-[11px] text-gray-500 truncate">Vendor - Sri Sai Suppliers</p>
                                    </div>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 shrink-0">
                                    Gate Pass
                                </span>
                            </div>

                            {/* Item 4 */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                                    <span className="text-xs text-gray-400 w-24 shrink-0 pt-0.5 whitespace-nowrap">Today, 09:58 AM</span>
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                        <FileText className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-semibold text-gray-800 truncate">Document uploaded</h4>
                                        <p className="text-[11px] text-gray-500 truncate">ID Proof - Ruhaan K.</p>
                                    </div>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 shrink-0">
                                    Document
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Card: Follow-up List */}
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                <h3 className="text-sm font-bold text-gray-900">Follow-up List</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/front-office/admission-enquiry')}
                                className="text-xs font-semibold text-[#3B5CEB] hover:underline cursor-pointer"
                            >
                                View All
                            </button>
                        </div>

                        {/* Follow-up List Table */}
                        <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 text-[11px] font-medium text-gray-400 whitespace-nowrap">
                                        <th className="pb-2.5 font-medium pr-3">Enquiry ID</th>
                                        <th className="pb-2.5 font-medium pr-3">Name</th>
                                        <th className="pb-2.5 font-medium pr-3">Grade (Interested)</th>
                                        <th className="pb-2.5 font-medium pr-3">Last Contact</th>
                                        <th className="pb-2.5 font-medium pr-3">Next Follow-up</th>
                                        <th className="pb-2.5 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs whitespace-nowrap">
                                    <tr>
                                        <td className="py-2.5 font-medium text-gray-700 pr-3">ENQ-2641</td>
                                        <td className="py-2.5 font-semibold text-gray-900 pr-3">Aarav S.</td>
                                        <td className="py-2.5 text-gray-600 pr-3">Grade 5</td>
                                        <td className="py-2.5 text-gray-500 pr-3">28 Oct 2026</td>
                                        <td className="py-2.5 text-gray-500 pr-3">03 Nov 2026</td>
                                        <td className="py-2.5 text-right">
                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                Pending
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 font-medium text-gray-700 pr-3">ENQ-2638</td>
                                        <td className="py-2.5 font-semibold text-gray-900 pr-3">Meera V.</td>
                                        <td className="py-2.5 text-gray-600 pr-3">Grade 3</td>
                                        <td className="py-2.5 text-gray-500 pr-3">27 Oct 2026</td>
                                        <td className="py-2.5 text-gray-500 pr-3">04 Nov 2026</td>
                                        <td className="py-2.5 text-right">
                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                In Progress
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 font-medium text-gray-700 pr-3">ENQ-2635</td>
                                        <td className="py-2.5 font-semibold text-gray-900 pr-3">Dhruv K.</td>
                                        <td className="py-2.5 text-gray-600 pr-3">Grade 8</td>
                                        <td className="py-2.5 text-gray-500 pr-3">27 Oct 2026</td>
                                        <td className="py-2.5 text-gray-500 pr-3">02 Nov 2026</td>
                                        <td className="py-2.5 text-right">
                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                Pending
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 font-medium text-gray-700 pr-3">ENQ-2631</td>
                                        <td className="py-2.5 font-semibold text-gray-900 pr-3">Ishita R.</td>
                                        <td className="py-2.5 text-gray-600 pr-3">Grade 6</td>
                                        <td className="py-2.5 text-gray-500 pr-3">26 Oct 2026</td>
                                        <td className="py-2.5 text-gray-500 pr-3">01 Nov 2026</td>
                                        <td className="py-2.5 text-right">
                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                Closed
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
