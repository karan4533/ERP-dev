import React from 'react'

export const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
export const tdClass = 'px-2 py-4 text-[#667085]'

export const SettingsPanel = ({ title, sub, action, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        {(title || action) && (
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4'>
                <div>
                    {title && <h3 className='text-base font-semibold text-[#1E1E1E]'>{title}</h3>}
                    {sub && <p className='text-sm text-[#667085] mt-1'>{sub}</p>}
                </div>
                {action}
            </div>
        )}
        {children}
    </div>
)

export const FormField = ({ label, children }) => (
    <div>
        <label className='block text-xs text-[#667085] mb-1.5'>{label}</label>
        {children}
    </div>
)

export const fieldClass =
    'w-full text-sm border border-[#D9D9D9] rounded-md px-3 py-2 text-[#1E1E1E] bg-white focus:outline-none focus:border-[#515DEF]'

export const FormGrid = ({ children }) => (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>{children}</div>
)

export const Toggle = ({ enabled, onChange, ariaLabel }) => (
    <button
        type='button'
        role='switch'
        aria-checked={enabled}
        aria-label={ariaLabel}
        onClick={() => onChange(!enabled)}
        className={`relative w-[34px] h-[19px] rounded-full shrink-0 cursor-pointer transition-colors border ${
            enabled
                ? 'bg-[#515DEF] border-[#515DEF]'
                : 'bg-[#EDEEF5] border-[#D9D9D9]'
        }`}
    >
        <span
            className={`absolute top-[2px] size-3.5 rounded-full bg-white transition-all ${
                enabled ? 'left-[17px]' : 'left-[2px]'
            }`}
        />
    </button>
)

export const SettingRow = ({ label, sub, enabled, onChange }) => (
    <div className='flex items-center justify-between gap-4 py-3 border-b border-[#F2F4F7] last:border-b-0'>
        <div>
            <p className='text-sm font-medium text-[#1E1E1E]'>{label}</p>
            {sub && <p className='text-xs text-[#667085] mt-0.5'>{sub}</p>}
        </div>
        <Toggle enabled={enabled} onChange={onChange} ariaLabel={label} />
    </div>
)
