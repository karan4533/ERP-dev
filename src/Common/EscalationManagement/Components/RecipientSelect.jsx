import React, { useMemo } from 'react'
import Select from 'react-select'
import {
    getEscalationRecipientById,
    getEscalationRecipientSelectOptions,
} from '../escalationUsersData'

const selectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '46px',
        borderColor: state.isFocused ? '#515DEF' : '#D9D9D9',
        boxShadow: state.isFocused ? '0 0 0 1px #515DEF' : 'none',
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
        '&:hover': {
            borderColor: '#515DEF',
        },
    }),
    menu: (base) => ({
        ...base,
        zIndex: 30,
        fontSize: '0.875rem',
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#515DEF' : state.isFocused ? '#EDEEF5' : '#fff',
        color: state.isSelected ? '#fff' : '#1E1E1E',
    }),
    placeholder: (base) => ({
        ...base,
        color: '#808080',
    }),
}

const formatOptionLabel = ({ label, subLabel }) => (
    <div>
        <div className='text-sm text-[#1E1E1E]'>{label}</div>
        {subLabel && <div className='text-xs text-[#808080]'>{subLabel}</div>}
    </div>
)

const RecipientSelect = ({
    targetRoleKey,
    value,
    onChange,
    disabled = false,
    roleLabel,
}) => {
    const options = useMemo(
        () => getEscalationRecipientSelectOptions(targetRoleKey),
        [targetRoleKey],
    )

    const selectedOption = useMemo(
        () => options.find((option) => option.value === value) ?? null,
        [options, value],
    )

    return (
        <div className='flex flex-col gap-y-2 sm:col-span-2'>
            <label className='text-base font-medium text-[#808080]'>
                Select {roleLabel || 'Recipient'}
            </label>
            <Select
                inputId='escalation-recipient'
                options={options}
                value={selectedOption}
                onChange={(option) => onChange?.(option?.value || '')}
                isSearchable
                isDisabled={disabled || options.length === 0}
                placeholder={options.length ? `Search ${roleLabel || 'recipient'}...` : 'No users available'}
                styles={selectStyles}
                formatOptionLabel={formatOptionLabel}
                noOptionsMessage={() => 'No matching users found'}
            />
            {options.length > 1 && (
                <span className='text-xs text-[#667085]'>
                    Multiple {roleLabel?.toLowerCase() || 'recipient'} accounts found — choose the specific person who should receive this escalation.
                </span>
            )}
        </div>
    )
}

export { getEscalationRecipientById }
export default RecipientSelect
