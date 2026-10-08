import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getRouteById } from './routeManagementData'
import { staffForStop, studentsForStop } from './routeStopRoster'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>
            {value || '—'}
        </span>
    </div>
)

const ViewRoute = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const route = getRouteById(id)
    const [openStop, setOpenStop] = useState(0)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/route-management')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!route ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Route not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h1 className='text-2xl font-semibold text-black'>{route.routeName}</h1>
                        <p className='text-sm text-[#667085] mt-2'>
                            <span className='font-medium text-[#1E1E1E]'>
                                Route ID: {route.id}
                            </span>
                            {' · '}
                            <span>{route.vehicleNumber}</span>
                        </p>
                    </div>

                    <Section title='Route Details Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Route Name' value={route.routeName} />
                            <Field label='Vehicle Number' value={route.vehicleNumber} />
                            <Field label='Select Driver' value={route.driverName} />
                            <Field label='Driver Contact' value={route.driverContact} />
                            <Field label='Vehicle ID' value={route.vehicleId} />
                            <Field label='Start Location' value={route.startLocation} />
                            <Field label='End Location' value={route.endLocation} />
                            <Field label='Pick Up Time' value={route.pickUpTime} />
                            <Field label='Drop Time' value={route.dropTime} />
                            <Field label='Yearly Fees' value={route.yearlyFees} />
                            <Field label='Half Yearly Fees' value={route.halfYearlyFees} />
                            <Field label='Quarterly Fees' value={route.quarterlyFees} />
                            <Field label='Monthly Fees' value={route.monthlyFees} />
                            <Field label='Support Staff' value={route.supportStaff} />
                            <Field label='Total Stops' value={route.totalStops} />
                            <Field label='Distance' value={route.distance} />
                            <Field label='Estimated Time' value={route.estimatedTime} />
                        </div>
                    </Section>

                    {route.stops.map((stop, index) => {
                        const students = studentsForStop(route, stop, index)
                        const staff = staffForStop(route.id, index)
                        const open = openStop === index
                        return (
                            <Section key={`${route.id}-stop-${index}`} title={stop.startLocation || `Stop ${index + 1}`}>
                                <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
                                    <p className='text-sm text-[#1E1E1E]'>Students: {students.length} · Staff: {staff.length}</p>
                                    <button type='button' onClick={() => setOpenStop(open ? -1 : index)} className='text-sm text-[#515DEF] cursor-pointer'>{open ? 'Hide details' : 'View details'}</button>
                                </div>
                                {open && (
                                    <div className='space-y-4'>
                                        <div className='overflow-x-auto'>
                                            <table className='w-full text-sm text-left'>
                                                <thead className='bg-[#EDEEF5]'><tr>{['Student Name', 'Grade / Class', 'Parent Name', 'Contact Number'].map((label) => <th key={label} className='px-2 py-2'>{label}</th>)}</tr></thead>
                                                <tbody>
                                                    {students.length === 0 && <tr><td className='px-2 py-3 text-[#667085]' colSpan={4}>Students: 0</td></tr>}
                                                    {students.map((student) => (
                                                        <tr key={student.id} className='border-b border-[#f2f4f7]'>
                                                            <td className='px-2 py-2'>{student.studentName}</td>
                                                            <td className='px-2 py-2'>{student.classSection}</td>
                                                            <td className='px-2 py-2'>{student.parentName || '—'}</td>
                                                            <td className='px-2 py-2'>{student.parentContact || '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className='overflow-x-auto'>
                                            <table className='w-full text-sm text-left'>
                                                <thead className='bg-[#EDEEF5]'><tr>{['Staff Name', 'Staff Number'].map((label) => <th key={label} className='px-2 py-2'>{label}</th>)}</tr></thead>
                                                <tbody>
                                                    {staff.length === 0 && <tr><td className='px-2 py-3 text-[#667085]' colSpan={2}>Staff: 0</td></tr>}
                                                    {staff.map((member) => (
                                                        <tr key={member.id} className='border-b border-[#f2f4f7]'>
                                                            <td className='px-2 py-2'>{member.staffName}</td>
                                                            <td className='px-2 py-2'>{member.staffNumber}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </Section>
                        )
                    })}
                </>
            )}
        </section>
    )
}

export default ViewRoute
