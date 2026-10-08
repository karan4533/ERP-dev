import React from 'react'
import { CheckCircle2, Circle, ExternalLink, FileText, Image, Link2, Video } from 'lucide-react'
import { categoryBadgeColor } from '../rcaData'

const Field = ({ label, value, className = '' }) => (
    <div className={`flex flex-col gap-y-1 ${className}`}>
        <span className='text-sm font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap'>{value || '—'}</span>
    </div>
)

export const RcaDetailsSection = ({ rca }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h3 className='text-base font-semibold text-black mb-4'>Root Cause Analysis Details</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            <Field label='Problem Statement' value={rca.problemStatement} className='sm:col-span-2 lg:col-span-3' />
            <Field label='Root Cause' value={rca.rootCause} className='sm:col-span-2 lg:col-span-3' />
            <div className='flex flex-col gap-y-1'>
                <span className='text-sm font-medium text-[#808080]'>Root Cause Category</span>
                <span className={`inline-flex w-fit px-2.5 py-1 rounded-lg text-xs font-semibold ${categoryBadgeColor[rca.rootCauseCategory] ?? 'bg-[#EDEEF5] text-[#667085]'}`}>
                    {rca.rootCauseCategory}
                </span>
            </div>
            <Field label='Responsible Person' value={rca.responsiblePerson} />
            <Field label='Target Completion Date' value={rca.targetCompletionDate} />
            <Field label='Corrective Action Plan' value={rca.correctiveActionPlan} className='sm:col-span-2 lg:col-span-3' />
            <Field label='Preventive Action Plan' value={rca.preventiveActionPlan} className='sm:col-span-2 lg:col-span-3' />
            <Field label='Remarks' value={rca.remarks} className='sm:col-span-2 lg:col-span-3' />
        </div>
    </div>
)

export const RcaEvidencePanel = ({ evidence }) => {
    const hasPhotos = evidence.photos?.length > 0
    const hasDocs = evidence.documents?.length > 0
    const hasVideos = evidence.videos?.length > 0
    const hasLinks = evidence.links?.length > 0
    const empty = !hasPhotos && !hasDocs && !hasVideos && !hasLinks

    return (
        <div className='bg-white rounded-2xl shadow-md p-4'>
            <h3 className='text-base font-semibold text-black mb-4'>Supporting Evidence</h3>
            {empty ? (
                <p className='text-sm text-[#667085]'>No supporting evidence attached.</p>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {hasPhotos && (
                        <div>
                            <div className='flex items-center gap-2 mb-3'>
                                <Image size={16} className='text-[#515DEF]' />
                                <span className='text-sm font-medium text-[#1E1E1E]'>Photos</span>
                            </div>
                            <div className='grid grid-cols-2 gap-2'>
                                {evidence.photos.map((photo) => (
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
                    {hasDocs && (
                        <div>
                            <div className='flex items-center gap-2 mb-3'>
                                <FileText size={16} className='text-[#515DEF]' />
                                <span className='text-sm font-medium text-[#1E1E1E]'>Documents</span>
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
                    {hasLinks && (
                        <div>
                            <div className='flex items-center gap-2 mb-3'>
                                <Link2 size={16} className='text-[#515DEF]' />
                                <span className='text-sm font-medium text-[#1E1E1E]'>Links</span>
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

export const ApprovalTimeline = ({ timeline, finalStatus, statusBadgeColor }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
            <h3 className='text-base font-semibold text-black'>Approval Timeline</h3>
            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${statusBadgeColor[finalStatus] ?? 'bg-[#EDEEF5] text-[#667085]'}`}>
                Final Status: {finalStatus}
            </span>
        </div>
        <div className='space-y-0'>
            {timeline.map((item, index) => (
                <div key={item.stage} className='flex gap-3'>
                    <div className='flex flex-col items-center'>
                        {item.done ? (
                            <CheckCircle2 size={18} className='text-[#4CAF50] shrink-0' />
                        ) : (
                            <Circle size={18} className='text-[#D9D9D9] shrink-0' />
                        )}
                        {index < timeline.length - 1 && (
                            <div className={`w-0.5 flex-1 min-h-[24px] ${item.done ? 'bg-[#4CAF50]' : 'bg-[#EDEEF5]'}`} />
                        )}
                    </div>
                    <div className='pb-4'>
                        <p className={`text-sm font-medium ${item.done ? 'text-[#1E1E1E]' : 'text-[#808080]'}`}>
                            {item.stage}
                        </p>
                        {item.done && item.date && (
                            <p className='text-xs text-[#667085] mt-0.5'>
                                {item.date} · {item.time}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
)
