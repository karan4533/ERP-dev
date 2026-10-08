import React, { useEffect, useMemo, useState } from 'react'
import { GitCompare, X } from 'lucide-react'
import { formatPublishedDate, getVersionsForTemplate } from './templateVersioningData'

const CompareField = ({ label, left, right, changed }) => (
    <div className={`rounded-lg border px-3 py-2 ${changed ? 'border-[#FF980033] bg-[#FF98000D]' : 'border-[#EDEEF5] bg-[#FAFAFA]'}`}>
        <p className='text-xs text-[#808080] mb-1'>{label}</p>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm'>
            <p className='text-[#667085]'>{left}</p>
            <p className={`font-medium ${changed ? 'text-[#FF9800]' : 'text-[#1E1E1E]'}`}>{right}</p>
        </div>
    </div>
)

const TemplateVersionCompareModal = ({
    isOpen,
    baseVersion,
    versions,
    onClose,
}) => {
    const [compareVersionId, setCompareVersionId] = useState('')

    const comparableVersions = useMemo(() => {
        if (!baseVersion) return []
        return getVersionsForTemplate(baseVersion.templateId, versions)
            .filter((item) => item.id !== baseVersion.id)
    }, [baseVersion, versions])

    const compareVersion = useMemo(
        () => comparableVersions.find((item) => item.id === compareVersionId) ?? comparableVersions[0] ?? null,
        [comparableVersions, compareVersionId]
    )

    useEffect(() => {
        if (isOpen && comparableVersions.length > 0) {
            setCompareVersionId(comparableVersions[0].id)
        }
    }, [isOpen, comparableVersions])

    if (!isOpen || !baseVersion) return null

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <div className='flex items-center gap-2'>
                        <GitCompare size={18} className='text-[#515DEF]' />
                        <h2 className='text-lg font-semibold text-[#1E1E1E]'>Compare Versions</h2>
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='text-[#667085] hover:text-[#FF5722] transition-colors cursor-pointer'
                        aria-label='Close modal'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='px-6 py-5 space-y-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className='rounded-xl border border-[#515DEF33] bg-[#515DEF0D] p-3'>
                            <p className='text-xs font-semibold uppercase text-[#515DEF] mb-1'>Base Version</p>
                            <p className='text-sm font-medium text-[#1E1E1E]'>{baseVersion.version} · {baseVersion.templateName}</p>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='compare-version-select' className='text-xs font-medium text-[#808080]'>Compare With</label>
                            <select
                                id='compare-version-select'
                                value={compareVersion?.id ?? ''}
                                onChange={(event) => setCompareVersionId(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 bg-white focus:outline-none focus:border-[#515DEF]'
                                disabled={comparableVersions.length === 0}
                            >
                                {comparableVersions.length === 0 ? (
                                    <option value=''>No other versions</option>
                                ) : (
                                    comparableVersions.map((item) => (
                                        <option key={item.id} value={item.id}>{item.version}</option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    {compareVersion ? (
                        <div className='space-y-3'>
                            <CompareField
                                label='Sections'
                                left={baseVersion.sections}
                                right={compareVersion.sections}
                                changed={baseVersion.sections !== compareVersion.sections}
                            />
                            <CompareField
                                label='Questions'
                                left={baseVersion.questions}
                                right={compareVersion.questions}
                                changed={baseVersion.questions !== compareVersion.questions}
                            />
                            <CompareField
                                label='Status'
                                left={baseVersion.status}
                                right={compareVersion.status}
                                changed={baseVersion.status !== compareVersion.status}
                            />
                            <CompareField
                                label='Published Date'
                                left={formatPublishedDate(baseVersion.publishedDate)}
                                right={formatPublishedDate(compareVersion.publishedDate)}
                                changed={baseVersion.publishedDate !== compareVersion.publishedDate}
                            />
                            <CompareField
                                label='Change Summary'
                                left={baseVersion.changeSummary}
                                right={compareVersion.changeSummary}
                                changed={baseVersion.changeSummary !== compareVersion.changeSummary}
                            />
                        </div>
                    ) : (
                        <p className='text-sm text-[#667085]'>No other versions available for comparison.</p>
                    )}
                </div>

                <div className='px-6 py-4 border-t border-[#F2F4F7] bg-[#FAFAFA] flex justify-end'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='text-sm font-medium text-[#667085] border border-[#D9D9D9] bg-white px-5 py-2.5 rounded-md hover:bg-[#F9F9F9] transition-colors cursor-pointer'
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default TemplateVersionCompareModal
