import React from 'react'
import { downloadHtml, openPrintDocument } from '../../printDocument'
import { PLANNING_COLUMNS, lessonPlanPrintHtml, planningRowsFromPlan } from '../lessonPlanTemplate'

const show = (value) => (value === undefined || value === null || String(value).trim() === '' ? 'NA' : value)

const LessonPlanTemplateView = ({ plan }) => {
    const rows = planningRowsFromPlan(plan)
    const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Lesson Plan ${plan.id}</title></head><body>${lessonPlanPrintHtml(plan)}</body></html>`
    const print = () => openPrintDocument({
        title: `Lesson Plan ${plan.id}`,
        body: lessonPlanPrintHtml(plan),
        css: '@page{size:A4 landscape;margin:12mm} th{background:#f3f4f6;font-size:11px}',
    })
    return (
        <div className='space-y-3'>
            <div className='flex flex-wrap gap-2'>
                <button type='button' className='text-sm bg-[#515DEF] text-white px-3 py-2 rounded-md cursor-pointer' onClick={print}>Print</button>
                <button type='button' className='text-sm border border-[#515DEF] text-[#515DEF] px-3 py-2 rounded-md cursor-pointer' onClick={() => downloadHtml(`lesson-plan-${plan.id}.html`, documentHtml)}>Export</button>
            </div>
            <div className='overflow-x-auto border border-[#1E1E1E] text-sm'>
                <p className='px-3 py-2 font-medium'>MONTH: {show(plan.month)} &nbsp; WEEK NO: {show(plan.weekNo)} &nbsp; ACADEMIC YEAR: {show(plan.academicYear)}</p>
                <table className='w-full border-collapse min-w-[720px]'>
                    <thead className='bg-[#F3F4F6]'>
                        <tr>
                            {['Grade & Section', 'Teacher', 'Subject', 'Planning Period (From - To dates)', 'Number of Sessions', 'Chapter No. and Name'].map((label) => (
                                <th key={label} className='border border-[#1E1E1E] px-2 py-2 text-left font-medium'>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className='border border-[#1E1E1E] px-2 py-2'>{show(plan.className)} {show(plan.section)}</td>
                            <td className='border border-[#1E1E1E] px-2 py-2'>{show(plan.submitterName)}</td>
                            <td className='border border-[#1E1E1E] px-2 py-2'>{show(plan.subject)}</td>
                            <td className='border border-[#1E1E1E] px-2 py-2'>{show(plan.fromDate)} to {show(plan.toDate)}</td>
                            <td className='border border-[#1E1E1E] px-2 py-2'>{show(plan.numberOfSessions)}</td>
                            <td className='border border-[#1E1E1E] px-2 py-2'>{show(plan.chapterName || plan.title)}</td>
                        </tr>
                    </tbody>
                </table>
                <table className='w-full border-collapse min-w-[1100px]'>
                    <thead className='bg-[#F3F4F6]'>
                        <tr>{PLANNING_COLUMNS.map((column) => <th key={column.key} className='border border-[#1E1E1E] px-2 py-2 text-left font-medium'>{column.label}</th>)}</tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id}>
                                {PLANNING_COLUMNS.map((column) => (
                                    <td key={column.key} className='border border-[#1E1E1E] px-2 py-2 whitespace-pre-wrap'>{show(row[column.key])}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className='px-3 py-3 space-y-2 whitespace-pre-wrap'>
                    <p><strong>Details of students who need special attention:</strong> {show(plan.specialAttention)}</p>
                    <p><strong>Modified classroom setup for students requiring special care:</strong> {show(plan.classroomSetup)}</p>
                    <p><strong>Teacher notes influencing learners or sessions:</strong> {show(plan.teacherNotes)}</p>
                    <p><strong>Reflection:</strong> {show(plan.reflection)}</p>
                </div>
                <table className='w-full border-collapse'>
                    <thead className='bg-[#F3F4F6]'>
                        <tr>{['Subject Mentor', 'Evaluator', 'Coordinator', 'Total No. of SDG Planned', 'Total No. of SDC Planned', 'Total No. of Worksheets Planned'].map((label) => <th key={label} className='border border-[#1E1E1E] px-2 py-2 text-left font-medium'>{label}</th>)}</tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className='border border-[#1E1E1E] px-2 py-2'>{show(plan.subjectMentor)}</td>
                            <td className='border border-[#1E1E1E] px-2 py-2'>{show(plan.evaluator)}</td>
                            <td className='border border-[#1E1E1E] px-2 py-2'>{show(plan.coordinatorSignoff)}</td>
                            <td className='border border-[#1E1E1E] px-2 py-2'>{show(plan.sdgPlanned)}</td>
                            <td className='border border-[#1E1E1E] px-2 py-2'>{show(plan.sdcPlanned)}</td>
                            <td className='border border-[#1E1E1E] px-2 py-2'>{show(plan.worksheetsPlanned)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default LessonPlanTemplateView
