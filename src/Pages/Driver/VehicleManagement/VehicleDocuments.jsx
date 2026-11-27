import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { hydrateDriverProfileSources, resolveDriverProfile } from '../driverProfileData'
import UploadDocuments from './Components/UploadDocuments'

const VehicleDocuments = () => {
    const { email } = useAuth()
    const [vehicle, setVehicle] = useState(null)

    useEffect(() => {
        hydrateDriverProfileSources().finally(() => {
            setVehicle(resolveDriverProfile(email).vehicle)
        })
    }, [email])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4 md:p-6'>
                <div className='mb-6'>
                    <h2 className='text-xl font-semibold text-[#1E1E1E]'>
                        Vehicle Documents
                        {' '}
                        <span className='text-sm font-normal text-[#667085]'>
                            — {vehicle?.vehicleNumber || 'Assigned vehicle'} certificate dates from Transport Manager
                        </span>
                    </h2>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
                    {[
                        { label: 'RC Expiry', value: vehicle?.rcExpiryDate || vehicle?.registrationExpiry || '—' },
                        { label: 'Insurance Expiry', value: vehicle?.insuranceExpiryDate || '—' },
                        { label: 'Fitness Expiry', value: vehicle?.fitnessExpiryDate || vehicle?.fitnessExpiry || '—' },
                        { label: 'Pollution Expiry', value: vehicle?.pollutionExpiryDate || vehicle?.pucExpiry || '—' },
                    ].map((item) => (
                        <div key={item.label} className='rounded-xl border border-[#EDEEF5] bg-[#FAFBFF] px-4 py-3'>
                            <p className='text-xs text-[#667085] uppercase tracking-wide'>{item.label}</p>
                            <p className='text-sm font-semibold text-[#0C1E5B] mt-1'>{item.value || '—'}</p>
                        </div>
                    ))}
                </div>

                <h3 className='text-base font-medium text-[#1E1E1E] mb-4'>
                    Upload copies
                    <span className='text-sm font-normal text-[#667085]'> — image or PDF, max 2MB</span>
                </h3>
                <UploadDocuments />
            </div>
        </section>
    )
}

export default VehicleDocuments
