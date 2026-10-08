import React from 'react'
import { CheckCircle2, Circle } from 'lucide-react'

const AuditTimeline = ({ timeline, layout = 'vertical' }) => {
    if (layout === 'horizontal') {
        return (
            <div className='pt-4 border-t border-white/20 mt-5'>
                <p className='text-[10px] font-semibold text-white/70 uppercase tracking-widest mb-3'>Audit Timeline</p>
                <div className='flex items-start gap-0 overflow-x-auto pb-1'>
                    {timeline.map((item, index) => (
                        <React.Fragment key={item.stage}>
                            <div className='flex flex-col items-center min-w-[72px] shrink-0'>
                                <div className={`size-8 rounded-full flex items-center justify-center ${
                                    item.done ? 'bg-white text-[#515DEF]' : 'bg-white/20 text-white/60'
                                }`}>
                                    {item.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                </div>
                                <p className={`text-[10px] font-medium mt-1.5 text-center leading-tight ${
                                    item.done ? 'text-white' : 'text-white/50'
                                }`}>
                                    {item.stage}
                                </p>
                                {item.done && item.date && (
                                    <p className='text-[9px] text-white/60 mt-0.5 text-center'>{item.date}</p>
                                )}
                            </div>
                            {index < timeline.length - 1 && (
                                <div className={`h-0.5 flex-1 min-w-[16px] mt-4 ${
                                    item.done && timeline[index + 1]?.done ? 'bg-white/80' : 'bg-white/25'
                                }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className='bg-white rounded-2xl shadow-md p-4 h-full'>
            <h3 className='text-base font-semibold text-black mb-4'>Audit Timeline</h3>
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
}

export default AuditTimeline
