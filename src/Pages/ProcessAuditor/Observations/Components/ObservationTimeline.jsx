import React from 'react'
import { CheckCircle2, Circle } from 'lucide-react'

const ObservationTimeline = ({ timeline }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h3 className='text-base font-semibold text-black mb-4'>Observation Timeline</h3>
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

export default ObservationTimeline
