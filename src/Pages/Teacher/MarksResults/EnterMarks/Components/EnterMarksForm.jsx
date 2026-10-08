import React, { useState } from 'react'
import {
    STUDENTS_LIST,
    CLASSES,
    SECTIONS,
    SUBJECTS,
    EXAM_NAMES,
    GRADES,
    computeGrade,
} from '../enterMarksData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const textareaClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full min-h-[100px] resize-y'

const EnterMarksForm = ({ onSubmit }) => {
    const [rollNumber, setRollNumber] = useState('')
    const [subject, setSubject] = useState('')
    const [className, setClassName] = useState('')
    const [section, setSection] = useState('')
    const [examName, setExamName] = useState('')
    const [studentName, setStudentName] = useState('')
    const [totalMarks, setTotalMarks] = useState('')
    const [obtainedMarks, setObtainedMarks] = useState('')
    const [grade, setGrade] = useState('')
    const [remarks, setRemarks] = useState('')

    const handleRollNumberChange = (value) => {
        setRollNumber(value)
        const student = STUDENTS_LIST.find((item) => item.rollNumber === value)
        if (student) {
            setStudentName(student.name)
            setClassName(student.className)
            setSection(student.section)
        } else {
            setStudentName('')
            setClassName('')
            setSection('')
        }
    }

    const handleMarksChange = (total, obtained) => {
        setTotalMarks(total)
        setObtainedMarks(obtained)
        const computed = computeGrade(obtained, total)
        if (computed) setGrade(computed)
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        onSubmit({
            rollNumber,
            subject,
            className,
            section,
            examName,
            studentName,
            totalMarks,
            obtainedMarks,
            grade,
            remarks,
        })
    }

    return (
        <form id='enter-marks-form' onSubmit={handleSubmit}>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='roll-number' className='text-base font-medium text-[#1E1E1E]'>Roll Number:</label>
                    <select
                        id='roll-number'
                        required
                        value={rollNumber}
                        onChange={(e) => handleRollNumberChange(e.target.value)}
                        className={selectClass}
                    >
                        <option value=''>--Select--</option>
                        {STUDENTS_LIST.map((student) => (
                            <option key={student.id} value={student.rollNumber}>{student.rollNumber}</option>
                        ))}
                    </select>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='subject' className='text-base font-medium text-[#1E1E1E]'>Subject:</label>
                    <select
                        id='subject'
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className={selectClass}
                    >
                        <option value=''>--Select--</option>
                        {SUBJECTS.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='class-name' className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                    <select
                        id='class-name'
                        required
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        className={selectClass}
                    >
                        <option value=''>--Select--</option>
                        {CLASSES.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='section' className='text-base font-medium text-[#1E1E1E]'>Section:</label>
                    <select
                        id='section'
                        required
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className={selectClass}
                    >
                        <option value=''>--Select--</option>
                        {SECTIONS.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='exam-name' className='text-base font-medium text-[#1E1E1E]'>Exam Name:</label>
                    <select
                        id='exam-name'
                        required
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        className={selectClass}
                    >
                        <option value=''>--Select--</option>
                        {EXAM_NAMES.map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='student-name' className='text-base font-medium text-[#1E1E1E]'>Student Name:</label>
                    <input
                        type='text'
                        id='student-name'
                        required
                        readOnly
                        value={studentName}
                        placeholder='Select roll number'
                        className={`${inputClass} bg-[#F9FAFB]`}
                    />
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='total-marks' className='text-base font-medium text-[#1E1E1E]'>Total Marks:</label>
                    <input
                        type='number'
                        id='total-marks'
                        required
                        min='1'
                        value={totalMarks}
                        onChange={(e) => handleMarksChange(e.target.value, obtainedMarks)}
                        placeholder='e.g. 100'
                        className={inputClass}
                    />
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='obtained-marks' className='text-base font-medium text-[#1E1E1E]'>Obtained Marks:</label>
                    <input
                        type='number'
                        id='obtained-marks'
                        required
                        min='0'
                        value={obtainedMarks}
                        onChange={(e) => handleMarksChange(totalMarks, e.target.value)}
                        placeholder='e.g. 85'
                        className={inputClass}
                    />
                </div>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='grade' className='text-base font-medium text-[#1E1E1E]'>Grade:</label>
                    <select
                        id='grade'
                        required
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className={selectClass}
                    >
                        <option value=''>--Select--</option>
                        {GRADES.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                </div>
                <div className='flex flex-col gap-y-2 lg:col-span-3'>
                    <label htmlFor='remarks' className='text-base font-medium text-[#1E1E1E]'>Remarks:</label>
                    <textarea
                        id='remarks'
                        required
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder='Enter remarks about the student performance...'
                        className={textareaClass}
                    />
                </div>
            </div>
        </form>
    )
}

export default EnterMarksForm
