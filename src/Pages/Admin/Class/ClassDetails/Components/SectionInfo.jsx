import React from 'react'
import { Plus, Trash2 } from 'lucide-react'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const SectionInfo = ({
    sections,
    onChangeSection,
    onAddSection,
    onRemoveSection,
    showCapacity = true,
    // API mode: the server stores capacity, room and the class teacher (a login) per section.
    apiMode = false,
    teacherOptions = [],
    teacherStatus = 'idle',
    teacherError = '',
    onRetryTeachers,
}) => {
    const gridColumns = apiMode
        ? 'lg:grid-cols-[1fr_1fr_1fr_2fr_auto]'
        : showCapacity ? 'lg:grid-cols-[1fr_1fr_auto]' : 'lg:grid-cols-[1fr_auto]'

    return (
        <>
            <div className='space-y-4 lg:mt-8 mt-2'>
                {sections.map((section, index) => (
                    <div key={`section-${index}`} className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 ${gridColumns} gap-6 items-end`}>
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
                        {(showCapacity || apiMode) && (
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor={`section-capacity-${index}`} className='text-base font-medium text-[#1E1E1E]'>Section Capacity:</label>
                            <input
                                id={`section-capacity-${index}`}
                                type='text'
                                inputMode={apiMode ? 'numeric' : undefined}
                                value={section.capacity}
                                onChange={(e) => onChangeSection(index, 'capacity', e.target.value)}
                                placeholder='e.g. 25'
                                className={inputClass}
                            />
                        </div>
                        )}
                        {apiMode && (
                            <>
                                <div className='flex flex-col gap-y-2'>
                                    <label htmlFor={`section-room-${index}`} className='text-base font-medium text-[#1E1E1E]'>Room No.:</label>
                                    <input
                                        id={`section-room-${index}`}
                                        type='text'
                                        maxLength={20}
                                        value={section.roomNumber}
                                        onChange={(e) => onChangeSection(index, 'roomNumber', e.target.value)}
                                        placeholder='e.g. 102'
                                        className={inputClass}
                                    />
                                </div>
                                <div className='flex flex-col gap-y-2'>
                                    <label htmlFor={`section-teacher-${index}`} className='text-base font-medium text-[#1E1E1E]'>Class Teacher:</label>
                                    <select
                                        id={`section-teacher-${index}`}
                                        value={section.classTeacherUserId}
                                        disabled={teacherStatus === 'loading'}
                                        onChange={(e) => onChangeSection(index, 'classTeacherUserId', e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value=''>{teacherStatus === 'loading' ? 'Loading teachers…' : 'No class teacher'}</option>
                                        {teacherOptions.map((teacher) => (
                                            <option key={teacher.userId} value={teacher.userId}>
                                                {teacher.name}{teacher.name !== teacher.email ? ` (${teacher.email})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
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

            {apiMode && teacherStatus === 'error' && (
                <p role='alert' className='text-xs text-[#B42318] mt-3'>
                    Could not load the teacher list: {teacherError}{' '}
                    {onRetryTeachers && (
                        <button type='button' onClick={onRetryTeachers} className='underline cursor-pointer'>Retry</button>
                    )}
                </p>
            )}
            {apiMode && teacherStatus === 'ready' && teacherOptions.length === 0 && (
                <p className='text-xs text-[#667085] mt-3'>
                    There are no active teacher or coordinator logins yet, so a class teacher cannot be chosen.
                    Create one under User Management, then come back.
                </p>
            )}

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
