import React from 'react'

const SectionNav = ({ sections, activeSectionId, sectionStats, onNavigate }) => (
    <nav className='bg-white rounded-2xl shadow-md border border-[#EDEEF5] overflow-hidden'>
        <p className='text-xs font-semibold text-[#808080] uppercase tracking-wide px-4 py-3 border-b border-[#EDEEF5] bg-[#FAFBFF]'>
            Sections
        </p>
        <ul className='flex flex-col'>
            {sections.map((section) => {
                const stats = sectionStats[section.id] ?? { findings: 0, answered: 0, total: 0 }
                const isActive = activeSectionId === section.id

                return (
                    <li key={section.id}>
                        <button
                            type='button'
                            onClick={() => onNavigate(section.id)}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left border-l-4 transition-all duration-200 cursor-pointer ${
                                isActive
                                    ? 'border-l-[#515DEF] bg-[#515DEF]/5 text-[#515DEF]'
                                    : 'border-l-transparent text-[#667085] hover:bg-[#FAFBFF] hover:text-[#1E1E1E]'
                            }`}
                        >
                            <span className={`text-sm truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                {section.title}
                            </span>
                            <span className='flex items-center gap-2 shrink-0'>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                    isActive ? 'bg-[#515DEF]/15 text-[#515DEF]' : 'bg-[#EDEEF5] text-[#808080]'
                                }`}>
                                    {stats.answered}/{stats.total}
                                </span>
                                {stats.findings > 0 && (
                                    <span className='text-[10px] font-semibold text-[#FF0000]'>🔴 {stats.findings}</span>
                                )}
                            </span>
                        </button>
                    </li>
                )
            })}
        </ul>
    </nav>
)

export default SectionNav
