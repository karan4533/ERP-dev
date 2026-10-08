import React from 'react'
import { CheckCircle2, Circle, ExternalLink, FileText, Image, Link2, Video } from 'lucide-react'
import { decisionBadgeColor } from '../atrData'

const Field = ({ label, value, className = '' }) => (
    <div className={`flex flex-col gap-y-1 ${className}`}>
        <span className='text-sm font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap'>{value || '—'}</span>
    </div>
)

export const ActionTakenDetailsSection = ({ actionTaken }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h3 className='text-base font-semibold text-black mb-4'>Action Taken Details</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            <Field label='Action Taken' value={actionTaken.actionTaken} className='sm:col-span-2 lg:col-span-3' />
            <Field label='Solution Implemented' value={actionTaken.solutionImplemented} className='sm:col-span-2 lg:col-span-3' />
            <Field label='Completion Date' value={actionTaken.completionDate} />
            <Field label='Responsible Person' value={actionTaken.responsiblePerson} />
            <Field label='Outcome / Result' value={actionTaken.outcomeResult} className='sm:col-span-2 lg:col-span-3' />
            <Field label='Additional Remarks' value={actionTaken.additionalRemarks} className='sm:col-span-2 lg:col-span-3' />
        </div>
    </div>
)

const PhotoGrid = ({ title, photos, icon: Icon }) => {
    if (!photos?.length) return null
    return (
        <div>
            <div className='flex items-center gap-2 mb-3'>
                <Icon size={16} className='text-[#515DEF]' />
                <span className='text-sm font-medium text-[#1E1E1E]'>{title}</span>
            </div>
            <div className='grid grid-cols-2 gap-2'>
                {photos.map((photo) => (
                    <div
                        key={photo}
                        className='aspect-video rounded-lg bg-[#EDEEF5] border border-[#D9D9D9] flex items-center justify-center p-2'
                    >
                        <div className='text-center'>
                            <Image size={24} className='text-[#808080] mx-auto mb-1' />
                            <span className='text-xs text-[#667085] break-all'>{photo}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export const BeforeAfterEvidencePanel = ({ evidence }) => {
    const hasBefore = evidence.beforePhotos?.length > 0
    const hasAfter = evidence.afterPhotos?.length > 0
    const hasDocs = evidence.documents?.length > 0
    const hasVideos = evidence.videos?.length > 0
    const hasLinks = evidence.links?.length > 0
    const empty = !hasBefore && !hasAfter && !hasDocs && !hasVideos && !hasLinks

    return (
        <div className='bg-white rounded-2xl shadow-md p-4'>
            <h3 className='text-base font-semibold text-black mb-4'>Before & After Evidence</h3>
            {empty ? (
                <p className='text-sm text-[#667085]'>No evidence attached.</p>
            ) : (
                <div className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <PhotoGrid title='Before Photos' photos={evidence.beforePhotos} icon={Image} />
                        <PhotoGrid title='After Photos' photos={evidence.afterPhotos} icon={Image} />
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {hasDocs && (
                            <div>
                                <div className='flex items-center gap-2 mb-3'>
                                    <FileText size={16} className='text-[#515DEF]' />
                                    <span className='text-sm font-medium text-[#1E1E1E]'>Supporting Documents</span>
                                </div>
                                <div className='space-y-2'>
                                    {evidence.documents.map((doc) => (
                                        <a
                                            key={doc.name}
                                            href={doc.url}
                                            className='flex items-center gap-2 rounded-lg bg-[#F5F6FA] border border-[#D9D9D9] px-3 py-2 hover:border-[#515DEF] transition-colors'
                                        >
                                            <FileText size={16} className='text-[#515DEF] shrink-0' />
                                            <span className='text-sm text-[#515DEF]'>{doc.name}</span>
                                            <ExternalLink size={12} className='text-[#808080] ml-auto shrink-0' />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                        {hasVideos && (
                            <div>
                                <div className='flex items-center gap-2 mb-3'>
                                    <Video size={16} className='text-[#515DEF]' />
                                    <span className='text-sm font-medium text-[#1E1E1E]'>Videos</span>
                                </div>
                                <div className='space-y-2'>
                                    {evidence.videos.map((video) => (
                                        <div
                                            key={video}
                                            className='flex items-center gap-2 rounded-lg bg-[#EDEEF5] border border-[#D9D9D9] px-3 py-2'
                                        >
                                            <Video size={16} className='text-[#515DEF] shrink-0' />
                                            <span className='text-xs text-[#667085] break-all'>{video}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {hasLinks && (
                        <div>
                            <div className='flex items-center gap-2 mb-3'>
                                <Link2 size={16} className='text-[#515DEF]' />
                                <span className='text-sm font-medium text-[#1E1E1E]'>External Links</span>
                            </div>
                            <div className='space-y-2'>
                                {evidence.links.map((link) => (
                                    <a
                                        key={link.url}
                                        href={link.url}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='flex items-center gap-2 text-sm text-[#515DEF] hover:underline'
                                    >
                                        <Link2 size={14} className='shrink-0' />
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export const VerificationDetailsSection = ({ verification }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h3 className='text-base font-semibold text-black mb-4'>Verification Details</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            <Field label='Department Head' value={verification.departmentHead} />
            <Field
                label='Acknowledged On'
                value={
                    verification.acknowledgedOn
                        ? `${verification.acknowledgedOn} · ${verification.acknowledgedOnTime}`
                        : ''
                }
            />
            <div className='flex flex-col gap-y-1'>
                <span className='text-sm font-medium text-[#808080]'>Super Admin Decision</span>
                <span className={`inline-flex w-fit px-2.5 py-1 rounded-lg text-xs font-semibold ${decisionBadgeColor[verification.superAdminDecision] ?? 'bg-[#EDEEF5] text-[#667085]'}`}>
                    {verification.superAdminDecision || '—'}
                </span>
            </div>
            <Field
                label='Approved / Rejected On'
                value={
                    verification.decisionOn
                        ? `${verification.decisionOn} · ${verification.decisionOnTime}`
                        : '—'
                }
            />
            <Field label='Super Admin Remarks' value={verification.superAdminRemarks} className='sm:col-span-2 lg:col-span-3' />
        </div>
    </div>
)

export const AtrStatusTimeline = ({ timeline }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h3 className='text-base font-semibold text-black mb-4'>Status Timeline</h3>
        <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
                <thead>
                    <tr className='border-b border-[#EDEEF5]'>
                        <th className='text-left py-2 pr-4 text-xs font-medium text-[#808080] uppercase'>Stage</th>
                        <th className='text-center py-2 text-xs font-medium text-[#808080] uppercase w-20'>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {timeline.map((item) => (
                        <tr key={item.stage} className='border-b border-[#F2F4F7] last:border-0'>
                            <td className={`py-3 pr-4 ${item.done ? 'text-[#1E1E1E] font-medium' : 'text-[#808080]'}`}>
                                {item.stage}
                            </td>
                            <td className='py-3 text-center'>
                                {item.done ? (
                                    <CheckCircle2 size={18} className='text-[#4CAF50] inline-block' />
                                ) : (
                                    <Circle size={18} className='text-[#D9D9D9] inline-block' />
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)
