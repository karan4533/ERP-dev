import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { toast } from 'react-toastify'
import {
    FEES_STRUCTURES,
    feeAmountForStructure,
    formatFeesStructureLabel,
    getStudentTransportRouteOptions,
} from '../studentTransportData'
import { hydrateRoutesFromApi } from '../../RouteManagement/routeManagementData'
import { formatTransportDate, parseTransportDate } from '../../transportCampus'
import { canUseClassDetailsApi, loadClassDirectory } from '../../../../services/classDetailsApi'
import { getClassDetails, getClassSelectOptions } from '../../../../Common/RBAC/academicsCatalogData'
import { listStudentsApi, mapStudentListFromApi } from '../../../../services/studentsApi'
import { listStaffParentsApi } from '../../../../services/parentsStaffApi'
import { isApiStudentsEnabled } from '../../../../services/apiClient'
import { getStudentsList } from '../../../../Common/StudentDatabase/studentDatabaseData'
import { hydrateEnrolledStudentsFromApi } from '../../../../Common/StudentDatabase/enrolledStudentsData'

const normSection = (value) => String(value || '').trim().toUpperCase().replace(/^—$/, '')

const normClassKey = (value) => {
    const text = String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
    const grade = text.match(/^grade\s*(\d+[a-z]?)$/i) || text.match(/^class\s*(\d+[a-z]?)$/i)
    if (grade) return `grade ${grade[1]}`
    const bare = text.match(/^(\d+[a-z]?)$/)
    if (bare) return `grade ${bare[1]}`
    return text
}

const studentMatchesClassSection = (row, className, section) => {
    const rowClass = normClassKey(row.className || row.class)
    const wantClass = normClassKey(className)
    if (rowClass !== wantClass) return false
    const rowSection = normSection(row.section)
    const wantSection = normSection(section)
    // Placed students match section; unplaced (empty / —) still show so TM can assign transport.
    if (!rowSection || rowSection === '—') return true
    return rowSection === wantSection
}

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const parseClassSection = (value) => {
    const raw = String(value || '').trim()
    if (!raw) return { className: '', section: '' }
    const parts = raw.split(/\s*[-–—]\s*/)
    if (parts.length >= 2) {
        return { className: parts[0].trim(), section: parts.slice(1).join('-').trim() }
    }
    return { className: raw, section: '' }
}

const StudentTransportForm = forwardRef(({ record }, ref) => {
    const initialClass = parseClassSection(record?.classSection)

    const [classOptions, setClassOptions] = useState([])
    const [sectionOptions, setSectionOptions] = useState([])
    const [students, setStudents] = useState([])
    const [parentsByStudentId, setParentsByStudentId] = useState({})
    const [routeOptions, setRouteOptions] = useState(() => getStudentTransportRouteOptions())

    const [loadingCatalog, setLoadingCatalog] = useState(true)
    const [loadingStudents, setLoadingStudents] = useState(false)
    const [loadingRoutes, setLoadingRoutes] = useState(false)

    const [className, setClassName] = useState(initialClass.className)
    const [section, setSection] = useState(initialClass.section)
    const [selectedStudentId, setSelectedStudentId] = useState(record?.studentId ?? '')

    const [studentId, setStudentId] = useState(record?.studentId ?? '')
    const [studentName, setStudentName] = useState(record?.studentName ?? '')
    const [admissionNumber, setAdmissionNumber] = useState(record?.admissionNumber ?? '')
    const [parentName, setParentName] = useState(record?.parentName ?? '')
    const [parentContact, setParentContact] = useState(record?.parentContact ?? '')

    const [routeName, setRouteName] = useState(record?.routeName ?? '')
    const [routeId, setRouteId] = useState(record?.routeId ?? '')
    const [startLocation, setStartLocation] = useState(record?.startLocation ?? '')
    const [endLocation, setEndLocation] = useState(record?.endLocation ?? '')
    const [vehicleNumber, setVehicleNumber] = useState(record?.vehicleNumber ?? '')
    const [supportStaff, setSupportStaff] = useState(record?.supportStaff ?? '')
    const [driverName, setDriverName] = useState(record?.driverName ?? '')
    const [driverContact, setDriverContact] = useState(record?.driverContact ?? '')
    const [pickUpTime, setPickUpTime] = useState(record?.pickUpTime ?? '')
    const [dropTime, setDropTime] = useState(record?.dropTime ?? '')
    const [feesStructure, setFeesStructure] = useState(
        record?.feesStructure?.split(' — ')[0] ?? '',
    )
    const [feeAmount, setFeeAmount] = useState(() => {
        const parts = String(record?.feesStructure || '').split(' — ')
        return parts[1] || ''
    })
    const [createdDate, setCreatedDate] = useState(() => parseTransportDate(record?.createdDate) ?? new Date())

    const selectedRoute = useMemo(
        () => routeOptions.find((route) => route.id === routeId || route.label === routeName) ?? null,
        [routeOptions, routeId, routeName],
    )

    const stopOptions = selectedRoute?.stops ?? []

    useEffect(() => {
        let cancelled = false
        setLoadingCatalog(true)
        setLoadingRoutes(true)

        ;(async () => {
            try {
                if (canUseClassDetailsApi()) {
                    await loadClassDirectory().catch(() => null)
                }
                await hydrateRoutesFromApi()
                if (!isApiStudentsEnabled()) {
                    await hydrateEnrolledStudentsFromApi().catch(() => [])
                }
                if (isApiStudentsEnabled()) {
                    const parentRows = await listStaffParentsApi().catch(() => [])
                    if (!cancelled) {
                        const map = {}
                        parentRows.forEach((row) => {
                            const key = String(row.studentId || row.id || '')
                            if (!key) return
                            map[key] = {
                                parentName: row.parentName || row.name || '',
                                parentContact: row.mobileNumber || row.contact || '',
                            }
                        })
                        setParentsByStudentId(map)
                    }
                }
            } finally {
                if (!cancelled) {
                    setClassOptions(getClassSelectOptions())
                    setRouteOptions(getStudentTransportRouteOptions())
                    setLoadingCatalog(false)
                    setLoadingRoutes(false)
                }
            }
        })()

        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (!className) {
            setSectionOptions([])
            return
        }
        const detail = getClassDetails().find(
            (item) => String(item.className).toLowerCase() === String(className).toLowerCase(),
        )
        const sections = (detail?.sections || [])
            .filter((item) => item?.isActive !== false)
            .map((item) => item.name || item.section || item)
            .filter(Boolean)
        setSectionOptions(sections)
        if (section && sections.length && !sections.some((s) => String(s).toLowerCase() === String(section).toLowerCase())) {
            setSection('')
        }
    }, [className, section, classOptions])

    useEffect(() => {
        let cancelled = false
        if (!className || !section) {
            setStudents([])
            return undefined
        }

        setLoadingStudents(true)
        ;(async () => {
            try {
                let rows = []
                if (isApiStudentsEnabled()) {
                    const apiRows = await listStudentsApi({ className })
                    rows = apiRows.map(mapStudentListFromApi)
                } else {
                    await hydrateEnrolledStudentsFromApi().catch(() => [])
                    rows = getStudentsList()
                }
                if (cancelled) return
                setStudents(rows.filter((row) => studentMatchesClassSection(row, className, section)))
            } catch (err) {
                if (!cancelled) {
                    setStudents([])
                    const status = err?.status || err?.response?.status
                    const message = err?.message || err?.body?.message || String(err || '')
                    if (status === 403 || /forbidden|permission/i.test(message)) {
                        toast.error('Cannot load students (permission denied). Sign out and sign back in, then try again.')
                    } else {
                        toast.error(message || 'Could not load students for this class.')
                    }
                }
            } finally {
                if (!cancelled) setLoadingStudents(false)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [className, section])

    const applyStopDetails = (stop, route) => {
        if (!stop) return
        setStartLocation(stop.startLocation || '')
        setEndLocation(stop.endLocation || route?.endLocation || '')
        setPickUpTime(stop.pickUpTime || '')
        setDropTime(stop.dropTime || '')
        if (feesStructure) {
            const amount = feeAmountForStructure(stop, feesStructure)
            setFeeAmount(amount)
        }
    }

    const handleClassChange = (value) => {
        setClassName(value)
        setSection('')
        setSelectedStudentId('')
        setStudentId('')
        setStudentName('')
        setAdmissionNumber('')
        setParentName('')
        setParentContact('')
        setStudents([])
    }

    const handleSectionChange = (value) => {
        setSection(value)
        setSelectedStudentId('')
        setStudentId('')
        setStudentName('')
        setAdmissionNumber('')
        setParentName('')
        setParentContact('')
    }

    const handleStudentChange = (value) => {
        setSelectedStudentId(value)
        const selected = students.find((row) => String(row.id) === String(value))
        if (!selected) return
        setStudentId(selected.id || '')
        setStudentName(selected.name || '')
        setAdmissionNumber(selected.admissionNumber || '')
        const parent = parentsByStudentId[String(selected.id)]
        setParentName(
            parent?.parentName
            || selected.fatherName
            || selected.motherName
            || '',
        )
        setParentContact(
            parent?.parentContact
            || selected.parentMobileNumber
            || selected.mobileNumber
            || '',
        )
    }

    const handleRouteChange = (value) => {
        const selected = routeOptions.find((route) => route.label === value)
        setRouteName(value)
        if (!selected) {
            setRouteId('')
            return
        }
        setRouteId(selected.id)
        setVehicleNumber(selected.vehicleNumber || '')
        setSupportStaff(selected.supportStaff || '')
        setDriverName(selected.driverName || '')
        setDriverContact(selected.driverContact || '')
        setEndLocation(selected.endLocation || '')

        const stops = selected.stops || []
        if (stops.length === 1) {
            applyStopDetails(stops[0], selected)
        } else {
            setStartLocation('')
            setPickUpTime(selected.pickUpTime || '')
            setDropTime(selected.dropTime || '')
            if (feesStructure) {
                setFeeAmount(feeAmountForStructure(selected, feesStructure))
            }
        }
    }

    const handleStopChange = (value) => {
        setStartLocation(value)
        const stop = stopOptions.find((item) => item.startLocation === value || item.label === value)
        applyStopDetails(stop, selectedRoute)
        if (stop && !supportStaff && selectedRoute?.supportStaff) {
            setSupportStaff(selectedRoute.supportStaff)
        }
    }

    const handleFeesStructureChange = (value) => {
        setFeesStructure(value)
        const source = stopOptions.find((item) => item.startLocation === startLocation) || selectedRoute
        setFeeAmount(feeAmountForStructure(source, value))
    }

    useImperativeHandle(ref, () => ({
        getValues: () => ({
            studentId: String(studentId).trim(),
            studentName: String(studentName).trim(),
            classSection: className && section ? `${className} - ${section}` : className || section,
            admissionNumber: String(admissionNumber).trim(),
            parentName: String(parentName).trim(),
            parentContact: String(parentContact).trim(),
            routeId,
            routeName,
            startLocation: String(startLocation).trim(),
            endLocation: String(endLocation).trim(),
            vehicleNumber: String(vehicleNumber).trim(),
            supportStaff: String(supportStaff).trim(),
            driverName: String(driverName).trim(),
            driverContact: String(driverContact).trim(),
            pickUpTime: String(pickUpTime).trim(),
            dropTime: String(dropTime).trim(),
            feesStructure: formatFeesStructureLabel(feesStructure, feeAmount),
            createdDate: formatTransportDate(createdDate),
        }),
        validate: () => {
            if (!className) return 'Class is required.'
            if (!section) return 'Section is required.'
            if (!String(studentName).trim()) return 'Please select a student.'
            if (!String(routeName).trim()) return 'Route is required.'
            if (!String(startLocation).trim()) return 'Start location (pick-up point) is required.'
            return null
        },
    }))

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:mt-8 mt-2'>
            <div className='lg:col-span-3 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] px-4 py-3 text-sm text-[#312E81]'>
                Saving enrollment posts the route fee as a <span className='font-semibold'>Transport Fee</span> bill to
                Account Head → Fee Collection, and Parent/Student Fees Payment (after Finance has a Transport Fee category).
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='class-name' className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                <select
                    id='class-name'
                    value={className}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className={selectClass}
                >
                    <option value=''>{loadingCatalog ? 'Loading classes…' : '--Select--'}</option>
                    {className && !classOptions.some((item) => item.value === className) && (
                        <option value={className}>{className}</option>
                    )}
                    {classOptions.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                </select>
            </div>

            <div className='flex flex-col gap-y-2'>
                <label htmlFor='section' className='text-base font-medium text-[#1E1E1E]'>Section:</label>
                <select
                    id='section'
                    value={section}
                    onChange={(e) => handleSectionChange(e.target.value)}
                    disabled={!className}
                    className={selectClass}
                >
                    <option value=''>{className ? '--Select--' : 'Select class first'}</option>
                    {section && !sectionOptions.some((item) => String(item) === String(section)) && (
                        <option value={section}>{section}</option>
                    )}
                    {sectionOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>

            <div className='flex flex-col gap-y-2'>
                <label htmlFor='student-select' className='text-base font-medium text-[#1E1E1E]'>Student:</label>
                <select
                    id='student-select'
                    value={selectedStudentId}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    disabled={!className || !section}
                    className={selectClass}
                >
                    <option value=''>
                        {!className || !section
                            ? 'Select class & section first'
                            : loadingStudents
                                ? 'Loading students…'
                                : students.length === 0
                                    ? 'No students in this section'
                                    : '--Select student--'}
                    </option>
                    {selectedStudentId && !students.some((row) => String(row.id) === String(selectedStudentId)) && (
                        <option value={selectedStudentId}>{studentName || selectedStudentId}</option>
                    )}
                    {students.map((row) => (
                        <option key={row.id} value={row.id}>
                            {row.name}{row.admissionNumber ? ` (${row.admissionNumber})` : ''}
                        </option>
                    ))}
                </select>
            </div>

            <div className='flex flex-col gap-y-2'>
                <label htmlFor='student-id' className='text-base font-medium text-[#1E1E1E]'>Student ID:</label>
                <input type='text' id='student-id' value={studentId} readOnly className={`${inputClass} bg-[#F9FAFB]`} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='student-name' className='text-base font-medium text-[#1E1E1E]'>Student Name:</label>
                <input type='text' id='student-name' value={studentName} readOnly className={`${inputClass} bg-[#F9FAFB]`} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='admission-number' className='text-base font-medium text-[#1E1E1E]'>Admission Number:</label>
                <input type='text' id='admission-number' value={admissionNumber} readOnly className={`${inputClass} bg-[#F9FAFB]`} />
            </div>

            <div className='flex flex-col gap-y-2'>
                <label htmlFor='route-name' className='text-base font-medium text-[#1E1E1E]'>Route Name:</label>
                <select id='route-name' value={routeName} onChange={(e) => handleRouteChange(e.target.value)} className={selectClass}>
                    <option value=''>{loadingRoutes ? 'Loading routes…' : '--Select--'}</option>
                    {routeName && !routeOptions.some((r) => r.label === routeName) && (
                        <option value={routeName}>{routeName}</option>
                    )}
                    {routeOptions.map((route) => (
                        <option key={route.id} value={route.label}>{route.label}</option>
                    ))}
                </select>
                {!loadingRoutes && routeOptions.length === 0 && (
                    <p className='text-xs text-[#667085]'>No routes yet — add them under Route Management.</p>
                )}
            </div>

            <div className='flex flex-col gap-y-2'>
                <label htmlFor='start-location' className='text-base font-medium text-[#1E1E1E]'>Start Location (Pick-up Point):</label>
                <select
                    id='start-location'
                    value={startLocation}
                    onChange={(e) => handleStopChange(e.target.value)}
                    disabled={!selectedRoute}
                    className={selectClass}
                >
                    <option value=''>{selectedRoute ? '--Select pick-up point--' : 'Select route first'}</option>
                    {startLocation && !stopOptions.some((s) => s.startLocation === startLocation) && (
                        <option value={startLocation}>{startLocation}</option>
                    )}
                    {stopOptions.map((stop) => (
                        <option key={stop.id} value={stop.startLocation}>
                            {stop.label}
                        </option>
                    ))}
                </select>
                {selectedRoute && stopOptions.length > 1 && (
                    <p className='text-xs text-[#667085]'>This route has {stopOptions.length} pick-up points.</p>
                )}
            </div>

            <div className='flex flex-col gap-y-2'>
                <label htmlFor='vehicle-number' className='text-base font-medium text-[#1E1E1E]'>Vehicle Number:</label>
                <input type='text' id='vehicle-number' value={vehicleNumber} readOnly className={`${inputClass} bg-[#F9FAFB]`} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='end-location' className='text-base font-medium text-[#1E1E1E]'>End Location:</label>
                <input type='text' id='end-location' value={endLocation} readOnly className={`${inputClass} bg-[#F9FAFB]`} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='pick-up-time' className='text-base font-medium text-[#1E1E1E]'>Pick Up Time:</label>
                <input type='text' id='pick-up-time' value={pickUpTime} readOnly className={`${inputClass} bg-[#F9FAFB]`} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='drop-time' className='text-base font-medium text-[#1E1E1E]'>Drop Time:</label>
                <input type='text' id='drop-time' value={dropTime} readOnly className={`${inputClass} bg-[#F9FAFB]`} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='fees-structure' className='text-base font-medium text-[#1E1E1E]'>Fees Structure:</label>
                <select id='fees-structure' value={feesStructure} onChange={(e) => handleFeesStructureChange(e.target.value)} className={selectClass}>
                    <option value=''>--Select--</option>
                    {FEES_STRUCTURES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
                {feeAmount && (
                    <p className='text-xs text-[#515DEF] font-medium'>Amount: {feeAmount}</p>
                )}
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='support-staff' className='text-base font-medium text-[#1E1E1E]'>Support Staff:</label>
                <input type='text' id='support-staff' value={supportStaff} readOnly className={`${inputClass} bg-[#F9FAFB]`} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='driver-name' className='text-base font-medium text-[#1E1E1E]'>Driver Name:</label>
                <input type='text' id='driver-name' value={driverName} readOnly className={`${inputClass} bg-[#F9FAFB]`} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label htmlFor='driver-contact' className='text-base font-medium text-[#1E1E1E]'>Driver Contact:</label>
                <input type='text' id='driver-contact' value={driverContact} readOnly className={`${inputClass} bg-[#F9FAFB]`} />
            </div>
            <div className='flex flex-col gap-y-2'>
                <label className='text-base font-medium text-[#1E1E1E]'>Created Date:</label>
                <div className='relative'>
                    <DatePicker
                        selected={createdDate}
                        onChange={(date) => setCreatedDate(date)}
                        dateFormat='dd/MM/yyyy'
                        isClearable
                        className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                    />
                    <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                </div>
            </div>
        </div>
    )
})

StudentTransportForm.displayName = 'StudentTransportForm'

export default StudentTransportForm
