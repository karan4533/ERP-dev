import React from 'react'
import { ChevronDown } from 'lucide-react'
import { getActiveSteps } from './workflowRulesData'

const WorkflowBuilder = ({ title, steps }) => {
    const activeSteps = getActiveSteps(steps)

    if (activeSteps.length === 0) {
        return (
            <p className='text-sm text-[#667085]'>No workflow steps configured.</p>
        )
    }

    return (
        <div className='flex flex-col items-start gap-2'>
            {title && (
                <div className='inline-flex items-center gap-2 rounded-lg bg-[#515DEF1A] text-[#515DEF] px-3 py-2 text-sm font-semibold'>
                    {title}
                </div>
            )}
            {activeSteps.map((step, index) => (
                <React.Fragment key={`${step}-${index}`}>
                    {index > 0 && <ChevronDown size={16} className='text-[#808080] ml-4' />}
                    <div className='inline-flex items-center gap-2 rounded-md border border-[#EDEEF5] bg-[#FAFAFA] px-3 py-2 text-sm text-[#1E1E1E] ml-4'>
                        <span className='text-xs font-semibold text-[#515DEF]'>{index + 1}.</span>
                        {step}
                    </div>
                </React.Fragment>
            ))}
        </div>
    )
}

export default WorkflowBuilder
