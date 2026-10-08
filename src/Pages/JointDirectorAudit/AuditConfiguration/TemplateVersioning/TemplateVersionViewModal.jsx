import React from 'react'
import { X } from 'lucide-react'
import { formatPublishedDate, versionStatusBadgeColor } from './templateVersioningData'

const TemplateVersionViewModal = ({ isOpen, version, onClose }) => {
    if (!isOpen || !version) return null

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <h2 className='text-lg font-semibold text-[#1E1E1E]'>View Template Version</h2>
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
                        <div>
                            <p className='text-xs text-[#808080] mb-1'>Version</p>
                            <p className='text-sm font-semibold text-[#515DEF]'>{version.version}</p>
                        </div>
                        <div>
                            <p className='text-xs text-[#808080] mb-1'>Status</p>
                            <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${versionStatusBadgeColor[version.status]}`}>
                                {version.status}
                            </span>
                        </div>
                        <div className='sm:col-span-2'>
                            <p className='text-xs text-[#808080] mb-1'>Template</p>
                            <p className='text-sm font-medium text-[#1E1E1E]'>{version.templateName}</p>
                        </div>
                        <div>
                            <p className='text-xs text-[#808080] mb-1'>Department</p>
                            <p className='text-sm text-[#667085]'>{version.department}</p>
                        </div>
                        <div>
                            <p className='text-xs text-[#808080] mb-1'>Created By</p>
                            <p className='text-sm text-[#667085]'>{version.createdBy}</p>
                        </div>
                        <div>
                            <p className='text-xs text-[#808080] mb-1'>Published Date</p>
                            <p className='text-sm text-[#667085]'>{formatPublishedDate(version.publishedDate)}</p>
                        </div>
                        <div>
                            <p className='text-xs text-[#808080] mb-1'>Sections / Questions</p>
                            <p className='text-sm text-[#667085]'>{version.sections} sections · {version.questions} questions</p>
                        </div>
                    </div>
                    <div>
                        <p className='text-xs text-[#808080] mb-1'>Change Summary</p>
                        <p className='text-sm text-[#667085] leading-relaxed'>{version.changeSummary}</p>
                    </div>
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

export default TemplateVersionViewModal
