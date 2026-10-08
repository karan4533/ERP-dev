import React, { useEffect, useState } from 'react'
import { Download, FileText, ShieldCheck, X } from 'lucide-react'

const SectionLabel = ({ children }) => (
    <p className='text-[10px] font-semibold text-[#808080] uppercase tracking-wide mb-2'>{children}</p>
)

const TRANSITION_MS = 300

const ConcessionDetailsOffcanvas = ({ isOpen, onClose, concession }) => {
    const [mounted, setMounted] = useState(false)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (isOpen && concession) {
            setMounted(true)
            const frame = requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisible(true))
            })
            return () => cancelAnimationFrame(frame)
        }

        setVisible(false)
        const timer = window.setTimeout(() => setMounted(false), TRANSITION_MS)
        return () => window.clearTimeout(timer)
    }, [isOpen, concession])

    useEffect(() => {
        if (!mounted) return undefined

        const handleEscape = (event) => {
            if (event.key === 'Escape') onClose()
        }

        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', handleEscape)

        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', handleEscape)
        }
    }, [mounted, onClose])

    if (!mounted || !concession) return null

    const initials = concession.student.split(' ').map((part) => part[0]).join('').slice(0, 2)

    return (
        <div className='fixed inset-0 z-[100] flex justify-end'>
            <div
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${
                    visible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
                aria-hidden='true'
            />

            <aside
                className={`relative z-10 w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
                    visible ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className='flex items-center justify-between px-5 py-4 border-b border-[#F2F4F7] shrink-0'>
                    <h2 className='text-lg font-semibold text-[#1E1E1E]'>Concession Details</h2>
                    <button
                        type='button'
                        onClick={onClose}
                        className='text-[#667085] hover:text-[#FF5722] transition-colors cursor-pointer'
                        aria-label='Close concession details'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='flex-1 overflow-y-auto px-5 py-5 space-y-6'>
                    <div className='flex items-start gap-4'>
                        <div className={`size-14 rounded-xl ${concession.avatarColor} text-white text-lg font-semibold flex items-center justify-center shrink-0`}>
                            {initials}
                        </div>
                        <div className='min-w-0'>
                            <h3 className='text-xl font-semibold text-[#1E1E1E]'>{concession.student}</h3>
                            <p className='text-sm text-[#667085] mt-0.5'>
                                Roll: {concession.rollNumber} · {concession.studentId}
                            </p>
                            <span className='inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-[#4CAF501A] text-[#4CAF50]'>
                                {concession.gradeSection}
                            </span>
                        </div>
                    </div>

                    <div>
                        <SectionLabel>Applied Concession</SectionLabel>
                        <div className='rounded-xl bg-[#F5F6FA] border border-[#EDEEF5] p-4 space-y-3'>
                            <div className='flex items-center justify-between gap-3 text-sm'>
                                <span className='text-[#667085]'>Type</span>
                                <span className='font-semibold text-[#1E1E1E]'>{concession.concessionType}</span>
                            </div>
                            <div className='flex items-center justify-between gap-3 text-sm'>
                                <span className='text-[#667085]'>Policy ID</span>
                                <span className='font-semibold text-[#515DEF]'>{concession.policyId}</span>
                            </div>
                            <div className='flex items-center justify-between gap-3 text-sm'>
                                <span className='text-[#667085]'>Approval Date</span>
                                <span className='font-semibold text-[#1E1E1E]'>{concession.approvalDate}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <SectionLabel>Financial Impact</SectionLabel>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='rounded-xl border border-[#EDEEF5] bg-white p-4'>
                                <p className='text-[10px] font-semibold text-[#808080] uppercase tracking-wide'>Standard Fee</p>
                                <p className='text-lg font-semibold text-[#1E1E1E] mt-1'>{concession.originalAmount}</p>
                            </div>
                            <div className='rounded-xl border border-[#FF572233] bg-[#FF57220D] p-4'>
                                <p className='text-[10px] font-semibold text-[#FF5722] uppercase tracking-wide'>Total Savings</p>
                                <p className='text-lg font-semibold text-[#FF5722] mt-1'>{concession.totalSavings}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <SectionLabel>Supporting Documents</SectionLabel>
                        <div className='space-y-2'>
                            {concession.documents.map((doc) => (
                                <div
                                    key={doc.name}
                                    className='flex items-center gap-3 rounded-xl border border-[#EDEEF5] px-3 py-3 hover:bg-[#F9F9F9] transition-colors'
                                >
                                    <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                                        doc.icon === 'shield' ? 'bg-[#515DEF1A] text-[#515DEF]' : 'bg-[#EDEEF5] text-[#667085]'
                                    }`}>
                                        {doc.icon === 'shield' ? <ShieldCheck size={16} /> : <FileText size={16} />}
                                    </div>
                                    <p className='flex-1 text-sm font-medium text-[#1E1E1E] truncate'>{doc.name}</p>
                                    <button
                                        type='button'
                                        className='text-[#667085] hover:text-[#515DEF] cursor-pointer shrink-0'
                                        aria-label={`Download ${doc.name}`}
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className='shrink-0 border-t border-[#F2F4F7] bg-[#FAFAFA] px-5 py-4 space-y-3'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='w-full text-sm font-medium text-[#667085] border border-[#D9D9D9] bg-white px-4 py-2.5 rounded-md hover:bg-[#F9F9F9] transition-colors cursor-pointer'
                    >
                        Close
                    </button>
                    <div className='flex gap-3'>
                        <button
                            type='button'
                            className='flex-1 bg-[#515DEF] text-white text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-90 transition-all cursor-pointer'
                        >
                            Renew Concession
                        </button>
                        <button
                            type='button'
                            className='px-5 py-2.5 text-sm font-medium text-[#FF5722] border border-[#FF5722] rounded-md hover:bg-[#FF57220D] transition-colors cursor-pointer'
                        >
                            Revoke
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    )
}

export default ConcessionDetailsOffcanvas
