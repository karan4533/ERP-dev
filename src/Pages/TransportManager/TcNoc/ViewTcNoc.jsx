import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import TcNocHistory from '../../../Common/TcRequest/TcNocHistory'
import { resolveTcNocManager } from '../../../Common/TcRequest/managerNocConfig'
import {
    decideTcNocViaApi,
    getTcRequestById,
    hydrateTcRequestFromApi,
    statusBadgeColor,
} from '../../../Common/TcRequest/tcRequestData'
import { canUseTcApi } from '../../../services/tcApi'

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value || '—'}</span>
    </div>
)

const ViewTcNoc = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const manager = resolveTcNocManager(location.pathname)
    const [request, setRequest] = useState(() => getTcRequestById(id))
    const [remarks, setRemarks] = useState('')
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        if (!canUseTcApi()) return undefined
        let active = true
        hydrateTcRequestFromApi(id)
            .then((row) => {
                if (!active) return
                setRequest(row)
            })
            .catch(() => {
                if (active) setRequest(null)
            })
        return () => { active = false }
    }, [id])

    const myNoc = useMemo(
        () => (request?.nocs || []).find((n) => n.roleCode === manager.roleCode) || null,
        [request, manager.roleCode],
    )
    const canDecide = request?.status === 'Pending Manager NOCs' && myNoc?.status === 'Pending'

    const decide = async (decision) => {
        if (!canUseTcApi() || busy) return
        if (decision === 'reject' && !remarks.trim()) {
            toast.error('A remark is required when rejecting a NOC.')
            return
        }
        setBusy(true)
        try {
            const updated = await decideTcNocViaApi(id, decision, remarks)
            setRequest(updated)
            toast.success(decision === 'approve' ? `${manager.label} NOC approved.` : `${manager.label} NOC rejected.`)
        } catch (error) {
            toast.error(error?.message || 'Could not save NOC decision.')
        } finally {
            setBusy(false)
        }
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate(manager.basePath)}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to TC NOC list
            </button>

            {!request ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>TC request not found.</div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-wrap items-center gap-3'>
                            <h1 className='text-2xl font-semibold text-black'>{request.requestId}</h1>
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${statusBadgeColor[request.status]}`}>
                                {request.status}
                            </span>
                        </div>
                        <p className='text-sm text-[#667085] mt-2'>
                            {manager.label} NOC · {request.studentName} · {request.classSection}
                        </p>
                    </div>

                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h2 className='text-xl font-semibold text-black mb-6'>Student / request</h2>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Student Name' value={request.studentName} />
                            <Field label='Admission Number' value={request.admissionNumber} />
                            <Field label='Transfer To' value={request.transferTo} />
                            <Field label='Requested On' value={request.requestedOn} />
                            <Field label='Last Date of Attendance' value={request.lastDateOfAttendance} />
                            <div className='lg:col-span-3'><Field label='Reason' value={request.reason} /></div>
                        </div>
                    </div>

                    <TcNocHistory nocs={request.nocs} />

                    {canDecide ? (
                        <div className='bg-white rounded-2xl shadow-md p-4'>
                            <h2 className='text-xl font-semibold text-black mb-4'>Record {manager.label} NOC</h2>
                            <div className='flex flex-col gap-y-2 mb-4'>
                                <label htmlFor='noc-remarks' className='text-base font-medium text-[#808080]'>Remarks</label>
                                <textarea
                                    id='noc-remarks'
                                    rows={3}
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder='Clearance notes (required when rejecting)'
                                    className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                                />
                            </div>
                            <div className='flex sm:justify-end justify-center gap-x-4'>
                                <button
                                    type='button'
                                    disabled={busy}
                                    onClick={() => decide('reject')}
                                    className='bg-white text-[#FF0000] text-sm px-8 py-2 rounded-md border border-[#FF0000] hover:bg-[#FF0000] hover:text-white transition-all duration-200 cursor-pointer disabled:opacity-60'
                                >
                                    Reject NOC
                                </button>
                                <button
                                    type='button'
                                    disabled={busy}
                                    onClick={() => decide('approve')}
                                    className='bg-[#4CAF50] text-white text-sm px-8 py-2 rounded-md border border-[#4CAF50] hover:opacity-90 transition-all duration-200 cursor-pointer disabled:opacity-60'
                                >
                                    {busy ? 'Saving…' : 'Approve NOC'}
                                </button>
                            </div>
                        </div>
                    ) : null}
                </>
            )}
        </section>
    )
}

export default ViewTcNoc
