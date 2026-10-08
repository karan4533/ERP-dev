import React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import ParameterCard from './ParameterCard'
import { countSectionFindings, isResponseAnswered } from '../executeAuditData'

const ChecklistSection = ({
    section,
    sectionRef,
    expanded,
    onToggle,
    tabMode = false,
    responses,
    observations,
    auditReference,
    onParameterChange,
    onObservationChange,
    onSaveObservation,
    onSubmitObservation,
    onOpenSop,
}) => {
    const findingsCount = countSectionFindings(section, responses, observations)
    const answeredCount = section.parameters.filter((p) =>
        isResponseAnswered(p.responseType, responses[p.id]?.response),
    ).length

    const parameterList = (
        <div className={`space-y-3 ${tabMode ? '' : 'mt-3 pl-1'}`}>
            {section.parameters.map((parameter) => {
                const obs = observations.find((o) => o.parameterId === parameter.id)

                return (
                    <ParameterCard
                        key={parameter.id}
                        parameter={parameter}
                        value={responses[parameter.id]}
                        observation={obs}
                        auditReference={auditReference}
                        onChange={(next) => onParameterChange(parameter.id, next, parameter, section.title)}
                        onObservationChange={(next) => onObservationChange(parameter.id, next)}
                        onSaveObservation={() => onSaveObservation(parameter.id)}
                        onSubmitObservation={() => onSubmitObservation(parameter.id)}
                        onOpenSop={onOpenSop}
                    />
                )
            })}
        </div>
    )

    if (tabMode) {
        return (
            <div ref={sectionRef} id={`section-${section.id}`} className='scroll-mt-24'>
                <div className='flex flex-wrap items-center justify-between gap-2 mb-4 px-1'>
                    <h3 className='text-base font-semibold text-black'>{section.title}</h3>
                    <div className='flex items-center gap-2'>
                        <span className='text-xs text-[#667085] bg-[#EDEEF5] px-2 py-1 rounded-lg'>
                            {answeredCount}/{section.parameters.length} done
                        </span>
                        {findingsCount > 0 && (
                            <span className='text-xs font-semibold text-[#FF0000] bg-[#FF000015] px-2 py-1 rounded-lg'>
                                🔴 {findingsCount} Finding{findingsCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
                {parameterList}
            </div>
        )
    }

    return (
        <div ref={sectionRef} id={`section-${section.id}`} className='scroll-mt-24'>
            <button
                type='button'
                onClick={onToggle}
                className='w-full flex items-center justify-between gap-3 bg-white rounded-2xl shadow-md px-4 py-3 hover:bg-[#FAFBFF] transition-colors cursor-pointer'
            >
                <div className='flex items-center gap-2'>
                    {expanded ? <ChevronDown size={20} className='text-[#515DEF]' /> : <ChevronRight size={20} className='text-[#667085]' />}
                    <h3 className='text-base font-semibold text-black text-left'>{section.title}</h3>
                </div>
                <div className='flex items-center gap-2 shrink-0'>
                    <span className='text-xs text-[#667085] bg-[#EDEEF5] px-2 py-1 rounded-lg'>
                        {answeredCount}/{section.parameters.length} done
                    </span>
                    <span className='text-xs text-[#667085] bg-[#EDEEF5] px-2 py-1 rounded-lg hidden sm:inline'>
                        {section.parameters.length} parameters
                    </span>
                    {findingsCount > 0 && (
                        <span className='text-xs font-semibold text-[#FF0000] bg-[#FF000015] px-2 py-1 rounded-lg'>
                            🔴 {findingsCount} Finding{findingsCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </button>

            {expanded && parameterList}
        </div>
    )
}

export default ChecklistSection
