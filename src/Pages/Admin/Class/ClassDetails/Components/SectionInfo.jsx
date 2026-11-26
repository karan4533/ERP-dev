import React from 'react'
import { Plus, Trash2 } from 'lucide-react'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const SectionInfo = ({
    sections,
    onChangeSection,
    onAddSection,
    onRemoveSection,
}) => {
    return (
        <>
            <div className='space-y-4 lg:mt-8 mt-2'>
                {sections.map((section, index) => (
                    <div key={`section-${index}`} className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-6 items-end'>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor={`section-name-${index}`} className='text-base font-medium text-[#1E1E1E]'>Section:</label>
                            <input
                                id={`section-name-${index}`}
                                type='text'
                                value={section.name}
                                onChange={(e) => onChangeSection(index, 'name', e.target.value)}
                                placeholder='e.g. A'
                                className={inputClass}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor={`section-capacity-${index}`} className='text-base font-medium text-[#1E1E1E]'>Section Capacity:</label>
                            <input
                                id={`section-capacity-${index}`}
                                type='text'
                                value={section.capacity}
                                onChange={(e) => onChangeSection(index, 'capacity', e.target.value)}
                                placeholder='e.g. 25'
                                className={inputClass}
                            />
                        </div>
                        <button
                            type='button'
                            onClick={() => onRemoveSection(index)}
                            disabled={sections.length === 1}
                            className='mb-1 inline-flex items-center justify-center size-10 rounded-md border border-[#F44336] text-[#F44336] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
                            aria-label='Remove section'
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <div className='flex justify-end mt-6'>
                <button
                    type='button'
                    onClick={onAddSection}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full inline-flex items-center justify-center gap-2'
                >
                    <Plus size={16} />
                    Add Information
                </button>
            </div>
        </>
    )
}

export default SectionInfo
