import React, { useState, useMemo } from 'react'
import {
    Cpu,
    RefreshCw,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    Wifi,
    Settings,
    UserCheck,
    Search,
    Plus,
    ExternalLink,
    Clock,
    Database,
} from 'lucide-react'
import {
    getEsslDevices,
    saveEsslDevices,
    getBiometricMappings,
    saveBiometricMappings,
    getRawBiometricPunches,
    syncEsslDevices,
    resolveUnmappedDeviceUser,
} from '../esslBiometricEngine'
import { ENTERPRISE_EMPLOYEES } from '../attendanceLeaveData'

export default function EsslDeviceConfigSection({ currentUserRole = 'admin' }) {
    const [devices, setDevices] = useState(getEsslDevices)
    const [mappings, setMappings] = useState(getBiometricMappings)
    const [rawPunches, setRawPunches] = useState(getRawBiometricPunches)
    const [activeSubTab, setActiveSubTab] = useState('devices') // 'devices' | 'mappings' | 'raw-punches' | 'unmapped'
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncSummary, setSyncSummary] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Unmapped resolution state
    const [selectedUnmappedUserId, setSelectedUnmappedUserId] = useState(null)
    const [targetEmployeeId, setTargetEmployeeId] = useState(ENTERPRISE_EMPLOYEES[0]?.id || '')

    // Trigger Manual eSSL Device Sync
    const handleTriggerSync = () => {
        setIsSyncing(true)
        setSyncSummary(null)

        setTimeout(() => {
            const summary = syncEsslDevices()
            setDevices(getEsslDevices())
            setRawPunches(getRawBiometricPunches())
            setSyncSummary(summary)
            setIsSyncing(false)
        }, 1200)
    }

    // Handle Unmapped Resolution
    const handleResolveUnmapped = () => {
        if (!selectedUnmappedUserId || !targetEmployeeId) return
        const emp = ENTERPRISE_EMPLOYEES.find((e) => e.id === targetEmployeeId)
        if (!emp) return

        resolveUnmappedDeviceUser(selectedUnmappedUserId, emp.id, emp.name, emp.department)
        setMappings(getBiometricMappings())
        setRawPunches(getRawBiometricPunches())
        setSelectedUnmappedUserId(null)
        alert(`Device User ID ${selectedUnmappedUserId} successfully mapped to ${emp.name} (${emp.id})`)
    }

    // Filtered Mappings
    const filteredMappings = useMemo(() => {
        if (!searchQuery.trim()) return mappings
        const q = searchQuery.toLowerCase()
        return mappings.filter(
            (m) =>
                m.deviceUserId.toLowerCase().includes(q) ||
                m.employeeName.toLowerCase().includes(q) ||
                m.employeeId.toLowerCase().includes(q) ||
                m.department.toLowerCase().includes(q)
        )
    }, [mappings, searchQuery])

    // Filtered Raw Punches
    const filteredRawPunches = useMemo(() => {
        if (!searchQuery.trim()) return rawPunches
        const q = searchQuery.toLowerCase()
        return rawPunches.filter(
            (p) =>
                p.punchId.toLowerCase().includes(q) ||
                p.deviceId.toLowerCase().includes(q) ||
                String(p.deviceUserId).includes(q) ||
                p.verificationMode.toLowerCase().includes(q)
        )
    }, [rawPunches, searchQuery])

    // Unmapped punches list
    const unmappedPunches = rawPunches.filter((p) => p.isUnmapped)

    return (
        <div className="space-y-6">
            {/* Header & Global Sync Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                        eSSL Biometric Integration & Device Hub
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Hardware connection management, biometric user ID mappings, and live punch synchronization.
                    </p>
                </div>
                <div>
                    <button
                        onClick={handleTriggerSync}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Synchronizing Devices...' : 'Sync Devices Now'}
                    </button>
                </div>
            </div>

            {/* Sync Summary Alert */}
            {syncSummary && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                            <span className="font-bold">Sync Completed Successfully:</span> {syncSummary.activeDevicesCount} of {syncSummary.totalDevicesCount} devices online. Processed {syncSummary.totalPunchesProcessed} punches ({syncSummary.duplicatesFiltered} duplicate taps filtered).
                        </div>
                    </div>
                    <span className="text-xs font-mono text-emerald-700">{syncSummary.syncedAt}</span>
                </div>
            )}

            {/* Device Hardware Cards Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {devices.map((d) => (
                    <div key={d.deviceId} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                {d.deviceId}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {d.status}
                            </span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">{d.name}</h4>
                            <p className="text-xs text-slate-500">{d.model} • {d.location}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-500">IP / Port:</span>
                                <span className="font-mono text-slate-800">{d.ipAddress}:{d.port}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Punches:</span>
                                <span className="font-semibold text-slate-800">{d.totalPunchesRecorded.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Health Score:</span>
                                <span className="font-semibold text-emerald-600">{d.healthScore}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Last Synced:</span>
                                <span className="text-slate-700">{d.lastSyncTime}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="border-b border-slate-200 flex items-center justify-between">
                <nav className="flex space-x-6">
                    <button
                        onClick={() => setActiveSubTab('devices')}
                        className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
                            activeSubTab === 'devices'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Device Settings
                    </button>
                    <button
                        onClick={() => setActiveSubTab('mappings')}
                        className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
                            activeSubTab === 'mappings'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Biometric User Mappings ({mappings.length})
                    </button>
                    <button
                        onClick={() => setActiveSubTab('raw-punches')}
                        className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
                            activeSubTab === 'raw-punches'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Raw Punch Logs ({rawPunches.length})
                    </button>
                    {unmappedPunches.length > 0 && (
                        <button
                            onClick={() => setActiveSubTab('unmapped')}
                            className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                                activeSubTab === 'unmapped'
                                    ? 'border-amber-600 text-amber-600'
                                    : 'border-transparent text-amber-600 hover:text-amber-800'
                            }`}
                        >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Unmapped Queue ({unmappedPunches.length})
                        </button>
                    )}
                </nav>
            </div>

            {/* TAB 1: DEVICE SETTINGS */}
            {activeSubTab === 'devices' && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-800">Connected Device Configurations</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <tr>
                                    <th className="px-4 py-3">Device ID</th>
                                    <th className="px-4 py-3">Hardware Model</th>
                                    <th className="px-4 py-3">TCP/IP Address</th>
                                    <th className="px-4 py-3">Port</th>
                                    <th className="px-4 py-3">Comm Key</th>
                                    <th className="px-4 py-3">Auto-Sync Interval</th>
                                    <th className="px-4 py-3">Auth Modes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {devices.map((d) => (
                                    <tr key={d.deviceId} className="hover:bg-slate-50/70">
                                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{d.deviceId}</td>
                                        <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{d.ipAddress}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{d.port}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{d.commKey}</td>
                                        <td className="px-4 py-3 text-xs">{d.autoSyncIntervalMinutes} mins</td>
                                        <td className="px-4 py-3 text-xs">
                                            <div className="flex flex-wrap gap-1">
                                                {d.supportedModes?.map((m) => (
                                                    <span key={m} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: BIOMETRIC USER MAPPINGS */}
            {activeSubTab === 'mappings' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search by Device User ID or Name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <tr>
                                    <th className="px-4 py-3">Device User ID</th>
                                    <th className="px-4 py-3">Employee ID</th>
                                    <th className="px-4 py-3">Employee Name</th>
                                    <th className="px-4 py-3">Department</th>
                                    <th className="px-4 py-3">Primary Auth Mode</th>
                                    <th className="px-4 py-3">RFID Card No</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Enrolled Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredMappings.map((m) => (
                                    <tr key={m.mappingId} className="hover:bg-slate-50/70">
                                        <td className="px-4 py-3 font-mono font-bold text-blue-600">{m.deviceUserId}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{m.employeeId}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-900">{m.employeeName}</td>
                                        <td className="px-4 py-3 text-xs">{m.department}</td>
                                        <td className="px-4 py-3 text-xs">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-xs">
                                                {m.primaryAuthMode}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs">{m.rfidCardNumber || 'N/A'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {m.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-xs text-slate-400">{m.enrolledDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: RAW BIOMETRIC PUNCH LOGS */}
            {activeSubTab === 'raw-punches' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Filter raw punch logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <span className="text-xs text-slate-500">
                            Immutable transaction stream directly from hardware polling
                        </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <tr>
                                    <th className="px-4 py-3">Punch ID</th>
                                    <th className="px-4 py-3">Device ID</th>
                                    <th className="px-4 py-3">Device User ID</th>
                                    <th className="px-4 py-3">Punch Time</th>
                                    <th className="px-4 py-3">ISO Timestamp</th>
                                    <th className="px-4 py-3">Verification Mode</th>
                                    <th className="px-4 py-3">Punch State</th>
                                    <th className="px-4 py-3 text-right">Integrity Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRawPunches.map((p) => (
                                    <tr key={p.punchId} className="hover:bg-slate-50/70 font-mono text-xs">
                                        <td className="px-4 py-3 font-semibold text-slate-800">{p.punchId}</td>
                                        <td className="px-4 py-3 text-blue-600 font-bold">{p.deviceId}</td>
                                        <td className="px-4 py-3 text-slate-900 font-bold">{p.deviceUserId}</td>
                                        <td className="px-4 py-3 text-slate-700">{p.punchTime}</td>
                                        <td className="px-4 py-3 text-slate-400">{p.timestamp}</td>
                                        <td className="px-4 py-3 text-slate-600 font-sans">{p.verificationMode}</td>
                                        <td className="px-4 py-3 font-sans">
                                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                                {p.punchState}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-sans">
                                            {p.isUnmapped ? (
                                                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                                                    Unmapped User
                                                </span>
                                            ) : p.isDuplicate ? (
                                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                                                    Debounced Duplicate
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                                                    Verified & Processed
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 4: UNMAPPED PUNCHES QUEUE */}
            {activeSubTab === 'unmapped' && (
                <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Unmapped Biometric Punches Resolution Queue</h3>
                            <p className="text-xs text-slate-500">
                                Punches captured by devices whose User ID has not yet been linked to an ERP Employee record.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <tr>
                                    <th className="px-4 py-3">Punch ID</th>
                                    <th className="px-4 py-3">Unmapped Device User ID</th>
                                    <th className="px-4 py-3">Device Location</th>
                                    <th className="px-4 py-3">Punch Time</th>
                                    <th className="px-4 py-3">Verification Mode</th>
                                    <th className="px-4 py-3 text-right">Resolve Mapping</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {unmappedPunches.map((p) => (
                                    <tr key={p.punchId} className="hover:bg-slate-50/70">
                                        <td className="px-4 py-3 font-mono font-semibold">{p.punchId}</td>
                                        <td className="px-4 py-3 font-mono font-bold text-rose-600">{p.deviceUserId}</td>
                                        <td className="px-4 py-3 text-xs">{p.deviceId}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{p.punchTime}</td>
                                        <td className="px-4 py-3 text-xs">{p.verificationMode}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => setSelectedUnmappedUserId(p.deviceUserId)}
                                                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs"
                                            >
                                                Assign Employee
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mapping Modal / Bar */}
                    {selectedUnmappedUserId && (
                        <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Linking Device User ID: <span className="text-blue-600 font-mono">{selectedUnmappedUserId}</span>
                                </span>
                                <div className="mt-1">
                                    <select
                                        value={targetEmployeeId}
                                        onChange={(e) => setTargetEmployeeId(e.target.value)}
                                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800"
                                    >
                                        {ENTERPRISE_EMPLOYEES.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                {e.name} ({e.id} • {e.department})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedUnmappedUserId(null)}
                                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResolveUnmapped}
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
                                >
                                    Confirm Link
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

