import React, { useMemo } from 'react'
import Select from 'react-select'
import { FINANCE_ACADEMIC_YEARS } from '../../financeDomain/financeMasters'
import { searchStudents } from '../../financeDomain/financeHelpers'

const selectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '42px',
        borderColor: state.isFocused ? '#515DEF' : '#D9D9D9',
        boxShadow: state.isFocused ? '0 0 0 1px #515DEF' : 'none',
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
        '&:hover': { borderColor: '#515DEF' },
    }),
    menu: (base) => ({ ...base, zIndex: 40, fontSize: '0.875rem' }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#515DEF' : state.isFocused ? '#EDEEF5' : '#fff',
        color: state.isSelected ? '#fff' : '#1E1E1E',
    }),
    placeholder: (base) => ({ ...base, color: '#808080' }),
}

const formatOptionLabel = (option) => (
    <div>
        <div className='text-sm text-inherit'>{option.label}</div>
        {option.subLabel && <div className='text-xs opacity-70'>{option.subLabel}</div>}
    </div>
)

const StudentSearch = ({ students, academicYear, onAcademicYearChange, selectedStudent, onSelectStudent }) => {
    const options = useMemo(() => students.map((student) => ({
        value: student.id,
        label: `${student.name} · ${student.className}-${student.section}`,
        subLabel: `${student.admissionNo} · Roll ${student.rollNo} · ${student.phone}`,
        student,
    })), [students])

    const filterOption = (option, input) => {
        if (!input) return true
        return searchStudents([option.data.student], input).length > 0
    }

    return (
        <div className='bg-white rounded-2xl shadow-md p-4'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
                <div>
                    <label className='block text-xs text-[#667085] mb-1.5'>Academic Year</label>
                    <select
                        value={academicYear}
                        onChange={(event) => onAcademicYearChange(event.target.value)}
                        className='w-full text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 bg-white focus:outline-none focus:border-[#515DEF]'
                    >
                        {FINANCE_ACADEMIC_YEARS.map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <div className='lg:col-span-2'>
                    <label className='block text-xs text-[#667085] mb-1.5'>
                        Student Search
                    </label>
                    <Select
                        styles={selectStyles}
                        options={options}
                        value={options.find((item) => item.value === selectedStudent?.id) ?? null}
                        onChange={(option) => onSelectStudent(option?.student ?? null)}
                        placeholder='Name, admission no., roll no., application no., register no., parent mobile'
                        isClearable
                        filterOption={filterOption}
                        formatOptionLabel={formatOptionLabel}
                    />
                </div>
            </div>
        </div>
    )
}

export default StudentSearch
