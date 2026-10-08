import { useState } from 'react'
import { toast } from 'react-toastify'
import { entryBlocked, requestReentry } from './governance'

export default function EntryClosureGate({ moduleName, actor, children }) {
    const [pending, setPending] = useState(false)
    const blocked = entryBlocked(moduleName, actor)
    if (!blocked) return children
    const ask = () => {
        requestReentry({
            module: moduleName,
            record: moduleName,
            reason: 'Correction after the entry period closed',
            requestedBy: actor,
        })
        setPending(true)
        toast.success('Re-entry request sent to Super Admin.')
    }
    return (
        <div className='bg-[#FFF7ED] border border-[#FDBA74] rounded-2xl p-4 text-sm text-[#9A3412]'>
            <p className='font-medium'>Entry closed for {moduleName}.</p>
            <p className='mt-1'>Save and submit stay blocked until Super Admin approves a re-entry request for {actor}.</p>
            <button type='button' onClick={ask} disabled={pending} className='mt-3 bg-[#515DEF] text-white px-4 py-2 rounded-md cursor-pointer disabled:opacity-60'>
                {pending ? 'Re-entry requested' : 'Request re-entry'}
            </button>
        </div>
    )
}
