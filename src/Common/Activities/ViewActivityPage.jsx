import { useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import {
    MD_APPROVAL_STATUS,
    approveActivityViaApi,
    getActivityById,
    getPersonInCharge,
    hydrateActivitiesFromApi,
    mdApprovalBadgeColor,
    updateActivityMdApproval,
} from './activitiesData'
import { canUseActivitiesApi } from '../../services/activitiesApi'
import { getActivityConfig, getActivityRoutes } from './activityConfigs'
import { getClassDisplayLabel } from '../RBAC/academicsCatalogData'

const DetailRow = ({ label, value }) => (
    <div className='flex flex-col gap-1 sm:flex-row sm:gap-4 py-3 border-b border-[#F2F4F7] last:border-b-0'>
        <span className='text-sm font-medium text-[#667085] sm:w-40 shrink-0'>{label}</span>
        <span className='text-sm text-[#1E1E1E]'>{value || '—'}</span>
    </div>
)

export default function ViewActivityPage({ roleKey, activityType }) {
    const { id } = useParams()
    const config = getActivityConfig(activityType)
    const routes = getActivityRoutes(activityType, roleKey)
    const [ready, setReady] = useState(!canUseActivitiesApi())
    useEffect(() => {
        if (!canUseActivitiesApi()) return undefined
        let active = true
        hydrateActivitiesFromApi(activityType).then(() => {
            if (active) setReady(true)
        }).catch(() => {
            if (active) setReady(true)
        })
        return () => {
            active = false
        }
    }, [activityType])
    const [activity, setActivity] = useState(null)
    useEffect(() => {
        if (!ready) return
        setActivity(getActivityById(id))
    }, [ready, id, activityType])

    const approvalStatusHeader =
        roleKey === 'admin' || roleKey === 'superadmin' ? 'Super Admin Approval Status' : 'MD Approval Status'
    const players = activity?.players || []
    const canDecide =
        roleKey === 'superadmin' && activity?.mdApprovalStatus === MD_APPROVAL_STATUS.PENDING

    const handleApproval = async (status) => {
        try {
            const next = canUseActivitiesApi()
                ? await approveActivityViaApi(id, status)
                : updateActivityMdApproval(id, status)
            setActivity(next)
            toast.success(status === MD_APPROVAL_STATUS.APPROVED ? 'Activity approved.' : 'Activity rejected.')
        } catch (caught) {
            toast.error(caught?.message || 'Approval could not be saved.')
        }
    }

    if (!ready) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-6'>
                <p className='text-[#667085]'>Loading activity…</p>
            </section>
        )
    }

    if (!activity || activity.type !== activityType) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-6'>
                <p className='text-[#667085]'>Activity not found.</p>
                <NavLink to={routes.list} className='inline-block mt-4 text-sm text-[#515DEF] hover:underline'>
                    Back to list
                </NavLink>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <NavLink
                    to={routes.list}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] hover:underline mb-4'
                >
                    <ArrowLeft size={16} />
                    Back to {config.listTitle}
                </NavLink>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                    <div>
                        <h1 className='text-xl font-semibold text-black'>{activity.eventName}</h1>
                        <p className='text-sm text-[#667085] mt-1'>{config.formTitle}</p>
                    </div>
                    {canDecide && (
                        <div className='flex flex-wrap gap-2'>
                            <button
                                type='button'
                                onClick={() => handleApproval(MD_APPROVAL_STATUS.APPROVED)}
                                className='bg-[#2E7D32] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 cursor-pointer'
                            >
                                Approve
                            </button>
                            <button
                                type='button'
                                onClick={() => handleApproval(MD_APPROVAL_STATUS.REJECTED)}
                                className='bg-white text-[#F44336] text-sm px-4 py-2 rounded-md border border-[#F44336] hover:bg-[#F44336] hover:text-white cursor-pointer'
                            >
                                Reject
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <DetailRow label='Event Name' value={activity.eventName} />
                <DetailRow label='Event Type' value={activity.eventType} />
                <DetailRow label='Class' value={getClassDisplayLabel(activity.className)} />
                <DetailRow label='Event Date' value={activity.eventDate} />
                <DetailRow label='Start Time' value={activity.startTime} />
                <DetailRow label='End Time' value={activity.endTime} />
                <DetailRow label='Venue' value={activity.venue} />
                <DetailRow label={config.personLabel} value={getPersonInCharge(activity, config.personField)} />
                <DetailRow label='Description' value={activity.description} />
                <DetailRow label='Submitted By' value={activity.submittedBy} />
                <DetailRow label='Submitted Date' value={activity.submittedDate} />
                <div className='flex flex-col gap-1 sm:flex-row sm:gap-4 py-3'>
                    <span className='text-sm font-medium text-[#667085] sm:w-40 shrink-0'>{approvalStatusHeader}</span>
                    <span className={`inline-flex w-fit px-2 py-1 rounded-lg text-xs font-semibold ${mdApprovalBadgeColor[activity.mdApprovalStatus]}`}>
                        {activity.mdApprovalStatus}
                    </span>
                </div>
            </div>

            {players.length > 0 && (
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                        <h2 className='text-xl font-medium text-black'>Player Results</h2>
                        <span className='text-sm font-medium text-[#515DEF]'>{players.length} Players</span>
                    </div>
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                                <tr>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Rank</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Player Name</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Category</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>School</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Rating</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Score</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Tie Break</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {players.map((player) => (
                                    <tr key={player.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 rounded-s-lg font-semibold text-[#1E1E1E]'>{player.rank || '-'}</td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{player.name}</td>
                                        <td className='px-2 py-4'>{player.category}</td>
                                        <td className='px-2 py-4'>{player.className}</td>
                                        <td className='px-2 py-4'>{player.school}</td>
                                        <td className='px-2 py-4'>{player.rating}</td>
                                        <td className='px-2 py-4'>{player.score || '-'}</td>
                                        <td className='px-2 py-4'>{player.tieBreak || '-'}</td>
                                        <td className='px-2 py-4 rounded-e-lg'>{player.result || player.status || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    )
}
