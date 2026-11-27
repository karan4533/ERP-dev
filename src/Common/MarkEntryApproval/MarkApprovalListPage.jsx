import React, { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Download, EllipsisIcon } from 'lucide-react'
import Dropdown from '../CommonComponents/Dropdown'
import ExportModal from '../CommonComponents/ExportModal'
import { useAuth } from '../../context/AuthContext'
import { approverLabel, stepAction } from '../Approvals/approvalStep'
import {
    APPROVAL_STATUSES,
    approvalStatusColor,
    canUseExamsApi,
    encodeContextKey,
    filterMarkSessions,
    formatClassLabel,
    getAllMarkSessions,
    hydrateMarkApprovalsFromApi,
} from './markEntryApprovalData'

const filterInputClass =
    'text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'

/** Marks approval list for one approver role (Coordinator → Principal → Director). */
const MarkApprovalListPage = ({ basePath, role }) => {
    const location = useLocation()
    const { email } = useAuth()
    const api = canUseExamsApi()
    // Server results are tagged with the navigation they belong to, so "loading" is derived, not set in the effect.
    const [result, setResult] = useState({ key: null, rows: [], error: '' })
    const [search, setSearch] = useState('')
    const [approvalStatus, setApprovalStatus] = useState('')
    const [onlyMine, setOnlyMine] = useState(false)
    const [exportModal, setExportModal] = useState(false)

    useEffect(() => {
        if (!api) return undefined
        let cancelled = false
        const key = location.key
        hydrateMarkApprovalsFromApi()
            .then((rows) => {
                if (!cancelled) setResult({ key, rows, error: '' })
            })
            .catch((err) => {
                if (!cancelled) setResult({ key, rows: [], error: err?.message || 'Mark submissions could not be loaded.' })
            })
        return () => {
            cancelled = true
        }
    }, [api, location.key])

    const loading = api && result.key !== location.key
    const error = api ? result.error : ''
    const sessions = api ? result.rows : getAllMarkSessions().filter((s) => s.status === 'submitted')

    const actionFor = (session) => (api ? stepAction(session, role, email) : { canAct: session.approvalStatus === 'Pending', note: '' })
    const waitingForMe = sessions.filter((session) => actionFor(session).canAct)
    const filteredSessions = filterMarkSessions(onlyMine ? waitingForMe : sessions, { search, approvalStatus })

    const clearFilters = () => {
        setSearch('')
        setApprovalStatus('')
        setOnlyMine(false)
    }

    if (loading) return <p className='text-[#667085]'>Loading mark submissions…</p>
    if (error) return <p className='text-[#B42318]'>{error}</p>

    return (
        <section className='space-y-6'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>Mark Entry Approval</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Marks go Coordinator → Principal → Director; the Director&apos;s approval publishes them to students and parents.
                    You decide the {approverLabel(role)} step.
                </p>
            </div>

            <button
                type='button'
                onClick={() => setOnlyMine((value) => !value)}
                className={`text-left w-full sm:w-auto rounded-xl border px-4 py-3 transition-all cursor-pointer ${
                    onlyMine ? 'border-[#515DEF] bg-[#515DEF08] ring-2 ring-[#515DEF]' : 'border-[#E4E7EC] hover:border-[#515DEF] bg-white'
                }`}
            >
                <p className='text-sm font-medium text-[#808080]'>Waiting for you</p>
                <p className='text-2xl font-bold text-[#0C1E5B] mt-1'>{waitingForMe.length}</p>
                <p className='text-xs text-[#515DEF] mt-1'>{onlyMine ? 'Filter active — click to clear' : 'Click to show only these'}</p>
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <button
                    type='button'
                    onClick={clearFilters}
                    className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                >
                    Clear Filters
                </button>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:mt-6 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input id='search' type='text' value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Exam, class, subject, submitter...' className={filterInputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='approval-status' className='text-base font-medium text-[#808080]'>Approval Status</label>
                        <select id='approval-status' value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)} className={filterInputClass}>
                            <option value=''>All</option>
                            {APPROVAL_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Submitted Mark Entries</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>S.No</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Exam</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Submitted By</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Students</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>With</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className='px-2 py-8 text-center text-[#667085]'>
                                        {onlyMine ? 'Nothing is waiting for your decision.' : 'No submitted mark entries match the selected filters.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredSessions.map((session, index) => {
                                    const action = actionFor(session)
                                    return (
                                        <tr key={session.contextKey} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                            <td className='px-2 py-4 rounded-s-lg'>{index + 1}</td>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E]'>
                                                {session.exam}
                                                {session.version > 1 ? <span className='ml-1 text-xs text-[#808080]'>v{session.version}</span> : null}
                                            </td>
                                            <td className='px-2 py-4'>{formatClassLabel(session.className)} — {session.section || '—'}</td>
                                            <td className='px-2 py-4'>{session.subject}</td>
                                            <td className='px-2 py-4'>{session.submittedByRole ?? '—'}</td>
                                            <td className='px-2 py-4'>{session.students?.length ?? 0}</td>
                                            <td className='px-2 py-4'>
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${approvalStatusColor[session.approvalStatus] ?? 'bg-[#66708533] text-[#667085]'}`}>
                                                    {session.approvalStatus ?? '—'}
                                                </span>
                                            </td>
                                            <td className='px-2 py-4 whitespace-nowrap'>
                                                {session.approvalStatus === 'Pending' ? (action.canAct ? 'You' : approverLabel(session.awaitingRole) || '—') : '—'}
                                            </td>
                                            <td className='px-2 py-4 text-center rounded-e-lg'>
                                                <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                    <NavLink
                                                        to={`${basePath}/review/${encodeContextKey(session.contextKey)}`}
                                                        className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                    >
                                                        {action.canAct ? 'Review' : 'View'}
                                                    </NavLink>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <p className='text-sm font-medium text-[#515DEF] mt-4'>
                    Showing {filteredSessions.length} submission{filteredSessions.length !== 1 ? 's' : ''}
                </p>
            </div>

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='mark-entry-approvals'
                rows={filteredSessions}
                exportDescription={<>You are exporting {filteredSessions.length} record(s).</>}
            />
        </section>
    )
}

export default MarkApprovalListPage
