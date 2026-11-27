import React, { useMemo, useState } from 'react'
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

const sortLabels = (values) => [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

const StudentSearch = ({ students, academicYear, onAcademicYearChange, selectedStudent, onSelectStudent }) => {
    const [classFilter, setClassFilter] = useState('')
    const [sectionFilter, setSectionFilter] = useState('')

    const classOptions = useMemo(
        () => sortLabels(new Set(students.map((s) => String(s.className || '').trim()).filter(Boolean))),
        [students],
    )
    const sectionOptions = useMemo(
        () => sortLabels(new Set(students
            .filter((s) => !classFilter || String(s.className || '').trim() === classFilter)
            .map((s) => String(s.section || '').trim())
            .filter(Boolean))),
        [students, classFilter],
    )
    const visibleStudents = useMemo(() => students.filter((s) => (
        (!classFilter || String(s.className || '').trim() === classFilter)
        && (!sectionFilter || String(s.section || '').trim() === sectionFilter)
    )), [students, classFilter, sectionFilter])

    const options = useMemo(() => visibleStudents.map((student) => {
        const className = String(student.className || '').trim() || '—'
        const section = String(student.section || '').trim()
        const classLabel = section ? `${className}-${section}` : `${className} (section unassigned)`
        return {
            value: student.id,
            label: `${student.name} · ${classLabel}`,
            subLabel: `${student.admissionNo} · Roll ${student.rollNo || '—'} · ${student.phone || '—'}`,
            student,
        }
    }), [visibleStudents])

    const selectedOption = selectedStudent
        ? options.find((item) => item.value === selectedStudent.id) ?? {
            value: selectedStudent.id,
            label: selectedStudent.name,
            student: selectedStudent,
        }
        : null

    const filterOption = (option, input) => {
        if (!input) return true
        return searchStudents([option.data.student], input).length > 0
    }

    return (
        <div className='bg-white rounded-2xl shadow-md p-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4'>
                <div>
                    <label htmlFor='fee-academic-year' className='block text-xs text-[#667085] mb-1.5'>Academic Year</label>
                    <select
                        id='fee-academic-year'
                        value={academicYear}
                        onChange={(event) => onAcademicYearChange(event.target.value)}
                        className='w-full text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 bg-white focus:outline-none focus:border-[#515DEF]'
                    >
                        {FINANCE_ACADEMIC_YEARS.map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor='fee-class-filter' className='block text-xs text-[#667085] mb-1.5'>Class</label>
                    <select
                        id='fee-class-filter'
                        value={classFilter}
                        onChange={(event) => {
                            setClassFilter(event.target.value)
                            setSectionFilter('')
                        }}
                        className='w-full text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 bg-white focus:outline-none focus:border-[#515DEF]'
                    >
                        <option value=''>All classes</option>
                        {classOptions.map((value) => (
                            <option key={value} value={value}>{value}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor='fee-section-filter' className='block text-xs text-[#667085] mb-1.5'>Section</label>
                    <select
                        id='fee-section-filter'
                        value={sectionFilter}
                        onChange={(event) => setSectionFilter(event.target.value)}
                        className='w-full text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 bg-white focus:outline-none focus:border-[#515DEF]'
                    >
                        <option value=''>All sections</option>
                        {sectionOptions.map((value) => (
                            <option key={value} value={value}>{value}</option>
                        ))}
                    </select>
                </div>
                <div className='md:col-span-3 lg:col-span-2'>
                    <label htmlFor='fee-student-search' className='block text-xs text-[#667085] mb-1.5'>
                        Student Search ({options.length} of {students.length})
                    </label>
                    <Select
                        inputId='fee-student-search'
                        styles={selectStyles}
                        options={options}
                        value={selectedOption}
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
