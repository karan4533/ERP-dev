import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Bus,
    Navigation,
    MapPin,
    Users,
    Fuel,
    Wrench,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Gauge,
    ArrowRight,
    ShieldCheck,
    Phone,
    UserCheck,
    Activity,
    Play,
    Square,
    ChevronRight,
    AlertCircle,
    Calendar,
    Radio
} from 'lucide-react'

const INITIAL_STOPS = [
    {
        id: 'stop-1',
        name: 'Anna Nagar West Extension',
        scheduledTime: '06:45 AM',
        actualTime: '06:47 AM',
        studentsExpected: 8,
        studentsBoarded: 8,
        status: 'Completed',
        landmark: 'Bus Depot Gate 2'
    },
    {
        id: 'stop-2',
        name: 'Koyambedu Junction',
        scheduledTime: '07:02 AM',
        actualTime: '07:04 AM',
        studentsExpected: 6,
        studentsBoarded: 4,
        status: 'At Stop',
        landmark: 'Metro Station Exit B'
    },
    {
        id: 'stop-3',
        name: 'Vadapalani Signal',
        scheduledTime: '07:12 AM',
        actualTime: '—',
        studentsExpected: 5,
        studentsBoarded: 0,
        status: 'Upcoming',
        landmark: 'Forum Mall Service Road'
    },
    {
        id: 'stop-4',
        name: 'Queen Mira International School',
        scheduledTime: '07:30 AM',
        actualTime: '—',
        studentsExpected: 0,
        studentsBoarded: 0,
        status: 'Destination',
        landmark: 'Main Campus East Porch'
    }
]

const INITIAL_STOP_STUDENTS = [
    { id: 'STU-101', name: 'Aarav Sharma', class: 'Grade 9-A', status: 'Boarded', time: '07:03 AM' },
    { id: 'STU-102', name: 'Rohan Verma', class: 'Grade 10-B', status: 'Boarded', time: '07:04 AM' },
    { id: 'STU-103', name: 'Diya Nair', class: 'Grade 8-A', status: 'Boarded', time: '07:05 AM' },
    { id: 'STU-104', name: 'Kavya S.', class: 'Grade 11-Science', status: 'Boarded', time: '07:06 AM' },
    { id: 'STU-105', name: 'Arjun Prakash', class: 'Grade 7-C', status: 'Waiting', time: '—' },
    { id: 'STU-106', name: 'Meera Iyer', class: 'Grade 9-B', status: 'Waiting', time: '—' },
]

const Dashboard = () => {
    const [isDutyActive, setIsDutyActive] = useState(true)
    const [dutyMessage, setDutyMessage] = useState('Trip Active: Morning Shift to Queen Mira Campus')
    const [currentStopIdx, setCurrentStopIdx] = useState(1) // 0-based index: 1 = Koyambedu
    const [stops, setStops] = useState(INITIAL_STOPS)
    const [currentStudents, setCurrentStudents] = useState(INITIAL_STOP_STUDENTS)
    const [speed, setSpeed] = useState(0) // 0 km/h at current stop

    // Toggle duty status
    const handleToggleDuty = () => {
        if (isDutyActive) {
            setIsDutyActive(false)
            setDutyMessage('Duty Stopped: Vehicle Parked at Campus Depot. Pre-trip checklist archived.')
        } else {
            setIsDutyActive(true)
            setDutyMessage('Duty Started: Morning Shift Route 5 in progress.')
        }
    }

    // Toggle student boarding status
    const handleToggleStudent = (studentId) => {
        setCurrentStudents((prev) =>
            prev.map((s) => {
                if (s.id === studentId) {
                    const newStatus = s.status === 'Boarded' ? 'Waiting' : 'Boarded'
                    return {
                        ...s,
                        status: newStatus,
                        time: newStatus === 'Boarded' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
                    }
                }
                return s
            })
        )
    }

    // Advance to next stop
    const handleAdvanceStop = () => {
        if (currentStopIdx < stops.length - 1) {
            const nextIdx = currentStopIdx + 1
            const updatedStops = stops.map((stop, idx) => {
                if (idx < nextIdx) return { ...stop, status: 'Completed', actualTime: stop.actualTime === '—' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : stop.actualTime }
                if (idx === nextIdx) return { ...stop, status: idx === stops.length - 1 ? 'Destination' : 'At Stop' }
                return { ...stop, status: 'Upcoming' }
            })
            setStops(updatedStops)
            setCurrentStopIdx(nextIdx)
            if (nextIdx === stops.length - 1) {
                setSpeed(0)
                setDutyMessage('Arrived at School Campus: Students disembarking safely.')
            } else {
                setSpeed(36)
            }
        }
    }

    const totalBoarded = stops[0].studentsBoarded + currentStudents.filter((s) => s.status === 'Boarded').length
    const totalExpected = 19
    const boardingPct = Math.round((totalBoarded / totalExpected) * 100)

    return (
        <div className="space-y-6 pb-12">
            {/* Header & Duty Control Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-indigo-50 text-[#515DEF]">
                                <Bus className="w-6 h-6" />
                            </span>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl font-bold text-slate-800">Driver Live Operational Dashboard</h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Bus #04 • TN-09-AB-4521
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-[#515DEF] border border-indigo-100">
                                        Route 5 — North Campus
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Assigned Driver: <strong className="text-slate-700">Sandy Selva (VAN-1001)</strong> • Attendant: <strong className="text-slate-700">Mrs. Lakshmi</strong> • Shift: <strong className="text-slate-700">Morning (06:45 AM – 07:30 AM)</strong>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <div className="text-xs text-slate-400 font-medium">GPS Tracking</div>
                            <div className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                                <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Telemetry
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleToggleDuty}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-sm ${
                                isDutyActive
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                        >
                            {isDutyActive ? (
                                <>
                                    <Square className="w-4 h-4 fill-current" />
                                    End Duty / Park
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-current" />
                                    Start Trip / On Duty
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Duty Broadcast Banner */}
                <div className={`mt-4 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between border ${
                    isDutyActive ? 'bg-indigo-50/70 border-indigo-100 text-indigo-900' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                    <div className="flex items-center gap-2">
                        <Activity className={`w-4 h-4 ${isDutyActive ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />
                        <span><strong>Operational Status:</strong> {dutyMessage}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                        Today: {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* KPI Overview Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tile 1: Route & Next Stop */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Location</span>
                        <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                            <Navigation className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="mt-2">
                        <div className="text-sm font-bold text-slate-800 line-clamp-1">{stops[currentStopIdx]?.name || 'School Campus'}</div>
                        <div className="text-xs text-blue-600 font-medium mt-0.5">
                            {stops[currentStopIdx]?.status === 'Destination' ? 'Destination Reached' : `Stop ${currentStopIdx + 1} of ${stops.length}`}
                        </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                        <span>Speed: <strong className="text-slate-700">{speed} km/h</strong></span>
                        <span>ETA: <strong className="text-slate-700">{stops[currentStopIdx]?.scheduledTime}</strong></span>
                    </div>
                </div>

                {/* Tile 2: Student Boarding Quick Count */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Student Boarding</span>
                        <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                            <Users className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="mt-2">
                        <div className="text-2xl font-black text-slate-800">
                            {totalBoarded} <span className="text-xs font-normal text-slate-500">/ {totalExpected} Boarded</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${boardingPct}%` }} />
                        </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                        <span>Pending: <strong className="text-amber-600">{totalExpected - totalBoarded}</strong></span>
                        <Link to="/driver/attendance-management/student-attendance" className="text-[#515DEF] font-semibold hover:underline">
                            Full Register →
                        </Link>
                    </div>
                </div>

                {/* Tile 3: Vehicle Health & Inspection */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Vehicle Health</span>
                        <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                            <Gauge className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="mt-2">
                        <div className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Optimal (100%)
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                            Odometer: <strong className="text-slate-700">48,210 KM</strong>
                        </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                        <span>Tire: <strong className="text-slate-700">34 PSI</strong></span>
                        <span>Battery: <strong className="text-slate-700">12.6V</strong></span>
                    </div>
                </div>

                {/* Tile 4: Fuel Log & Tank */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fuel Level</span>
                        <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                            <Fuel className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="mt-2">
                        <div className="text-2xl font-black text-slate-800">
                            72% <span className="text-xs font-normal text-slate-500">(~110 L)</span>
                        </div>
                        <div className="text-xs text-emerald-600 font-medium mt-0.5">
                            Range: ~380 KM remaining
                        </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                        <span>Voucher: <strong className="text-amber-600">1 Pending</strong></span>
                        <Link to="/driver/fuel-request" className="text-[#515DEF] font-semibold hover:underline">
                            Fuel History →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Live Trip Route Stops & Quick Attendance Check */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Live Trip Route Stops Timeline */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#515DEF]" />
                                    Live Route Stops &amp; Progress (Route 5)
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    From Anna Nagar West Extension to Queen Mira International School
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAdvanceStop}
                                disabled={currentStopIdx >= stops.length - 1}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    currentStopIdx >= stops.length - 1
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-[#515DEF] text-white hover:bg-indigo-600 shadow-xs'
                                }`}
                            >
                                Advance to Next Stop
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Route Timeline */}
                        <div className="mt-5 space-y-4">
                            {stops.map((stop, idx) => {
                                const isDone = idx < currentStopIdx
                                const isCurrent = idx === currentStopIdx
                                const isDest = idx === stops.length - 1

                                return (
                                    <div
                                        key={stop.id}
                                        className={`relative flex items-start gap-4 p-3.5 rounded-xl transition-all border ${
                                            isCurrent
                                                ? 'bg-indigo-50/60 border-indigo-200 shadow-xs'
                                                : isDone
                                                ? 'bg-slate-50/60 border-slate-100 opacity-90'
                                                : 'bg-white border-slate-100'
                                        }`}
                                    >
                                        {/* Status Dot / Icon */}
                                        <div className="flex flex-col items-center pt-0.5">
                                            <div
                                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                                    isDone
                                                        ? 'bg-emerald-500 text-white'
                                                        : isCurrent
                                                        ? 'bg-[#515DEF] text-white ring-4 ring-indigo-100 animate-pulse'
                                                        : 'bg-slate-200 text-slate-600'
                                                }`}
                                            >
                                                {isDone ? '✓' : idx + 1}
                                            </div>
                                            {idx < stops.length - 1 && (
                                                <div className={`w-0.5 h-8 mt-1.5 ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                                            )}
                                        </div>

                                        {/* Stop Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between flex-wrap gap-1">
                                                <h3 className="text-sm font-bold text-slate-800">
                                                    {stop.name}
                                                    {isCurrent && (
                                                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                                                            Current Stop
                                                        </span>
                                                    )}
                                                </h3>
                                                <span className="text-xs font-semibold text-slate-700">
                                                    Sched: {stop.scheduledTime}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Landmark: {stop.landmark}
                                            </p>

                                            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100/60">
                                                <span className="text-slate-600">
                                                    {isDest ? (
                                                        'Destination Drop-off Point'
                                                    ) : (
                                                        <>Students Boarding: <strong className="text-slate-800">{stop.studentsBoarded}/{stop.studentsExpected}</strong></>
                                                    )}
                                                </span>
                                                <span className={`font-semibold ${
                                                    isDone ? 'text-emerald-600' : isCurrent ? 'text-indigo-600' : 'text-slate-400'
                                                }`}>
                                                    {stop.status} {stop.actualTime !== '—' && `(${stop.actualTime})`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Quick Student Boarding Check for Current Stop */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-emerald-600" />
                                    Boarding Quick-Check: {stops[currentStopIdx]?.name}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Click student name or badge to quickly toggle boarded status
                                </p>
                            </div>
                            <Link
                                to="/driver/attendance-management/student-attendance"
                                className="text-xs font-bold text-[#515DEF] hover:underline flex items-center gap-1"
                            >
                                Open Full Attendance <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {currentStudents.map((student) => {
                                const isBoarded = student.status === 'Boarded'
                                return (
                                    <div
                                        key={student.id}
                                        onClick={() => handleToggleStudent(student.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                            isBoarded
                                                ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/60'
                                                : 'bg-amber-50/50 border-amber-200 hover:bg-amber-100/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                isBoarded ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                                            }`}>
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-800">{student.name}</div>
                                                <div className="text-[11px] text-slate-500">{student.class}</div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                isBoarded ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {student.status}
                                            </span>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{student.time}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Col: Vehicle Health Status, Fuel Summary & Quick Links */}
                <div className="space-y-6">
                    {/* Pre-Trip Vehicle Checklist & Inspection Alert */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                Pre-Trip Vehicle Inspection
                            </h2>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Passed
                            </span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                                <span className="text-slate-600">Braking &amp; Emergency Brakes</span>
                                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Checked (100%)
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                                <span className="text-slate-600">First Aid Kit &amp; Fire Extinguisher</span>
                                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Present &amp; Valid
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                                <span className="text-slate-600">Emergency Exit Door</span>
                                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Unlatched &amp; Operational
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                                <span className="text-slate-600">CCTV &amp; GPS Tracking System</span>
                                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Live Streaming
                                </span>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <strong className="font-bold">Next Maintenance Due:</strong>
                                <p className="text-[11px] text-amber-800 mt-0.5">
                                    50,000 KM Periodic Service scheduled in 1,790 KM. Fitness Certificate valid until Nov 2026.
                                </p>
                            </div>
                        </div>

                        <Link
                            to="/driver/vehicle-management/vehicle-health-status/add"
                            className="w-full py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-[#515DEF] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                            <Wrench className="w-3.5 h-3.5" /> Log Vehicle Health Check
                        </Link>
                    </div>

                    {/* Fuel Log Summary Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Fuel className="w-4 h-4 text-amber-600" />
                                Fuel Log &amp; Requisitions
                            </h2>
                            <Link to="/driver/fuel-request" className="text-xs font-semibold text-[#515DEF] hover:underline">
                                View All
                            </Link>
                        </div>

                        <div className="space-y-2.5 text-xs">
                            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800">Pending Request (FR-001)</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                        Pending Approval
                                    </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                                    <span>Quantity: <strong>60 Litres</strong></span>
                                    <span>Odometer: 45,250 KM</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800">Last Refueled (FR-002)</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        Approved &amp; Filled
                                    </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                                    <span>45 Litres • ₹4,275</span>
                                    <span>Date: 28-07-2025</span>
                                </div>
                            </div>
                        </div>

                        <Link
                            to="/driver/fuel-request/add"
                            className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                            <Fuel className="w-3.5 h-3.5" /> Raise Fuel Voucher
                        </Link>
                    </div>

                    {/* Operational Shortcuts */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                        <h2 className="text-sm font-bold text-slate-800">Quick Operations Shortcuts</h2>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                            <Link
                                to="/driver/my-route/route-stops"
                                className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 flex items-center justify-between transition-colors group"
                            >
                                <span className="font-medium text-slate-700 group-hover:text-indigo-600">
                                    View Full Route Stops &amp; Timetable
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                            </Link>
                            <Link
                                to="/driver/vehicle-management/vehicle-details"
                                className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 flex items-center justify-between transition-colors group"
                            >
                                <span className="font-medium text-slate-700 group-hover:text-indigo-600">
                                    Vehicle Registration &amp; Insurance Details
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                            </Link>
                            <Link
                                to="/driver/maintenance-request/add"
                                className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 flex items-center justify-between transition-colors group"
                            >
                                <span className="font-medium text-slate-700 group-hover:text-indigo-600">
                                    Report Mechanical Issue / Breakdown
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                            </Link>
                            <Link
                                to="/driver/department-ticketing"
                                className="p-2.5 rounded-xl border border-rose-100 hover:bg-rose-50/50 flex items-center justify-between transition-colors group"
                            >
                                <span className="font-bold text-rose-700 flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5" /> Transport Desk Emergency SOS
                                </span>
                                <ChevronRight className="w-4 h-4 text-rose-400" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
