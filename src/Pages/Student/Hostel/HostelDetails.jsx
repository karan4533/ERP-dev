import React, { useState, useEffect } from 'react'
import hostel_img from "../../../assets/images/hostel-mock-img.png"
import { Building, CircleCheck, ShieldAlert, Bed, Phone, Calendar, UserCheck, AlertCircle } from 'lucide-react'
import { hostelService } from '../../../services/modules/hostelService'
import { useAuth } from '../../../context/AuthContext'

const HostelDetails = () => {
    const { auth } = useAuth()
    const studentId = auth?.user?.id || 'STU-001'

    const [enrolment, setEnrolment] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchEnrolment = async () => {
            setLoading(true)
            try {
                // Try direct student ID, or demo fallback 'STU-001'
                let res = await hostelService.getEnrolmentByStudentId(studentId)
                if (!res?.data) {
                    res = await hostelService.getEnrolmentByStudentId('STU-001')
                }
                if (res?.success && res.data) {
                    setEnrolment(res.data)
                }
            } catch (err) {
                console.warn('Could not load student hostel enrolment:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchEnrolment()
    }, [studentId])

    const blockName = enrolment?.hostelBlockName || 'Block A - Boys Senior Wing'
    const roomNo = enrolment?.roomNumber || 'A-201'
    const bedNo = enrolment?.bedNumber || 'B1'
    const checkIn = enrolment?.checkInDate || '19/12/2025'
    const status = enrolment?.status || 'Active'

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-6'>
                <div className='flex flex-col md:flex-row items-center gap-6'>
                    <img src={hostel_img} alt="hostel-img" className='w-56 h-auto object-cover rounded-xl' />
                    <div className='flex flex-col gap-y-2 flex-1'>
                        <h2 className='text-2xl font-bold text-slate-900'>Queens International Residential Hostel</h2>
                        <p className='text-sm text-slate-500'>
                            Campus Boarding & Student Residential Quarters • 24/7 Security & Wardens
                        </p>
                        <div className='flex flex-wrap items-center gap-2 mt-2'>
                            <span className='flex items-center gap-x-2 bg-[#EBF4FE] px-4 py-1.5 rounded-lg text-sm font-semibold text-[#0751E0]'>
                                <Building size={18} />
                                <span>{blockName}</span>
                            </span>
                            <span className={`flex items-center gap-x-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold ${status === 'Active' ? 'bg-[#E7F7EE] text-[#008000]' : 'bg-slate-100 text-slate-600'}`}>
                                <CircleCheck size={18} />
                                <span>Status: {status}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-6 space-y-6'>
                <h2 className='text-xl font-bold text-slate-900'>Hostel Bed Allocation & Facilities</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Institution Hostel</span>
                        <span className='text-sm text-slate-900 font-medium'>Queens Residential Campus</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Hostel Block</span>
                        <span className='text-sm text-slate-900 font-medium'>{blockName}</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Allocated Room</span>
                        <span className='text-sm text-indigo-700 font-bold'>Room {roomNo}</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Floor Number</span>
                        <span className='text-sm text-slate-900 font-medium'>2nd Floor (South Wing)</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Allocated Bed</span>
                        <span className='text-sm text-emerald-700 font-bold'>Bed {bedNo}</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Resident Warden</span>
                        <span className='text-sm text-slate-900 font-medium'>Mr. M. Kumar</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Warden Office Contact</span>
                        <span className='text-sm text-slate-900 font-medium font-mono'>+91 98401 23456</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Check-in Date</span>
                        <span className='text-sm text-slate-900 font-medium'>{checkIn}</span>
                    </div>
                    <div className='flex flex-col gap-y-1'>
                        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Annual Boarding Fee</span>
                        <span className='text-sm text-slate-900 font-bold'>₹48,000 / Academic Year</span>
                    </div>
                </div>

                <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#EDF4FE] p-4 rounded-xl border border-blue-200'>
                    <div className='flex gap-x-3 items-start'>
                        <ShieldAlert className='w-5 h-5 text-[#0A5DFE] shrink-0 mt-0.5' />
                        <span className='text-xs text-slate-700'>
                            <strong className='text-[#00007A] block'>Hostel Code of Conduct:</strong>
                            Study hours are observed from 7:00 PM to 9:30 PM. Campus biometric curfew is 8:30 PM.
                        </span>
                    </div>
                    <button
                        type='button'
                        onClick={() => alert('Hostel Rules & Regulations:\n1. Maintain silence during study hours (19:00 - 21:30).\n2. Visitors permitted only on Sundays (14:00 - 17:00).\n3. Any room property damage will be debited from caution deposit.\n4. Biometric checkout required for campus leave.')}
                        className='text-[#0A5DFE] text-xs font-semibold bg-white px-4 py-2 rounded-lg border border-[#0A5DFE] hover:bg-[#0A5DFE] hover:text-white transition-all cursor-pointer whitespace-nowrap'
                    >
                        View Hostel Rules
                    </button>
                </div>
            </div>
        </section>
    )
}

export default HostelDetails
