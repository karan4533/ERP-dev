import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addIncident } from '../../../Common/demoDomain/securityIncidents'

const inputClass = 'text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const AddIncidents = () => {
    const navigate = useNavigate()
    const [date, setDate] = useState('2026-09-30')

    const save = (event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const record = addIncident({
            id: data.get('reportId'),
            incidentType: data.get('incidentType'),
            date,
            time: data.get('time'),
            location: data.get('location'),
            description: data.get('description'),
            reportTo: data.get('reportTo'),
            priority: data.get('priority'),
        })
        navigate(`/gate-keeper/incidents/${record.id}`)
    }

    return (
        <form onSubmit={save}>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>CSO / Gate Keeper — Add Incident</h2>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6'>
                    <label className='text-sm'>Report ID<input name='reportId' className={inputClass} placeholder='Leave blank to generate' /></label>
                    <label className='text-sm'>Incident Type<input name='incidentType' required className={inputClass} /></label>
                    <label className='text-sm'>Date<input type='date' value={date} onChange={(event) => setDate(event.target.value)} required className={inputClass} /></label>
                    <label className='text-sm'>Time<input name='time' type='time' required className={inputClass} /></label>
                    <label className='text-sm'>Location<input name='location' required placeholder='Gate, block, or area' className={inputClass} /></label>
                    <label className='text-sm'>Priority<select name='priority' className={inputClass}><option>High</option><option>Medium</option><option>Low</option></select></label>
                    <label className='text-sm md:col-span-3'>Description<textarea name='description' required rows={3} className={inputClass} /></label>
                    <label className='text-sm'>Report To<select name='reportTo' className={inputClass}><option>Admin</option><option>Gate Keeper Manager</option><option>Security</option><option>Other</option></select></label>
                </div>
            </div>
            <div className='flex justify-end gap-4 mt-6'>
                <button type='button' onClick={() => navigate('/gate-keeper/incidents')} className='border border-[#515DEF] text-[#515DEF] px-8 py-2 rounded-md cursor-pointer'>Discard Changes</button>
                <button type='submit' className='bg-[#515DEF] text-white px-8 py-2 rounded-md cursor-pointer'>Save Changes</button>
            </div>
        </form>
    )
}

export default AddIncidents
