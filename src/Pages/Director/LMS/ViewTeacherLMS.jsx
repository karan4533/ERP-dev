import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'

const MOCK_TEACHER = {
    staffId: 'STF-2024-0156',
    teacherName: 'Anita Verma',
    subject: 'Mathematics',
    assignedClass: 'Class 9, Class 10',
    profileImage: null,
}

const CLASS_SECTION_TASKS = [
    {
        className: 'Class 10',
        section: 'Section A',
        studentsCount: 32,
        tasks: [
            {
                taskType: 'Homework',
                subject: 'Mathematics',
                homeworkName: 'Algebra Worksheet – Chapter 5',
                assignedDate: '03-03-2026',
                dueDate: '05-03-2026',
                reviewedDate: '06-03-2026',
                submissions: '28 / 32',
                remarks: 'Most students submitted on time. Review completed.',
            },
            {
                taskType: 'Assignment',
                subject: 'Mathematics',
                homeworkName: 'Mid Term Revision Assignment',
                assignedDate: '08-03-2026',
                dueDate: '10-03-2026',
                reviewedDate: '11-03-2026',
                submissions: '30 / 32',
                remarks: 'Good performance overall. Few need improvement in problem 4.',
            },
            {
                taskType: 'Homework',
                subject: 'Mathematics',
                homeworkName: 'Quadratic Equations Practice',
                assignedDate: '10-03-2026',
                dueDate: '12-03-2026',
                reviewedDate: '—',
                submissions: '15 / 32',
                remarks: 'Review pending — submission deadline not yet reached.',
            },
        ],
    },
    {
        className: 'Class 9',
        section: 'Section B',
        studentsCount: 28,
        tasks: [
            {
                taskType: 'Homework',
                subject: 'Mathematics',
                homeworkName: 'Linear Equations Worksheet',
                assignedDate: '02-03-2026',
                dueDate: '04-03-2026',
                reviewedDate: '05-03-2026',
                submissions: '26 / 28',
                remarks: 'Excellent submission rate. Minor errors in step-by-step solutions.',
            },
            {
                taskType: 'Assignment',
                subject: 'Mathematics',
                homeworkName: 'Geometry Basics Assignment',
                assignedDate: '07-03-2026',
                dueDate: '09-03-2026',
                reviewedDate: '10-03-2026',
                submissions: '27 / 28',
                remarks: 'Well attempted. Encourage students to show construction steps.',
            },
        ],
    },
]

const taskTypeBadge = {
    Homework: 'bg-[#2196F333] text-[#2196F3]',
    Assignment: 'bg-[#FF980033] text-[#FF9800]',
}

const ViewTeacherLMS = () => {
    const navigate = useNavigate()
    const teacher = MOCK_TEACHER

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/director/lms/teacher-lms')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                    <img
                        src={teacher.profileImage || mo_user}
                        alt=""
                        className='w-20 h-20 rounded-full object-cover ring-2 ring-indigo-100'
                    />
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>{teacher.teacherName}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            <span className='font-medium text-[#1E1E1E]'>Staff ID: {teacher.staffId}</span>
                            {' · '}
                            <span className='text-[#808080]'>Subject: {teacher.subject}</span>
                        </p>
                        <p className='text-sm text-[#808080] mt-1'>Assigned Classes: {teacher.assignedClass}</p>
                    </div>
                </div>
            </div>

            {CLASS_SECTION_TASKS.map((block) => (
                <div key={`${block.className}-${block.section}`} className='bg-white rounded-2xl shadow-md p-4'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 pb-4 border-b border-[#EEF0F6]'>
                        <h2 className='text-xl font-semibold text-[#0C1E5B]'>
                            {block.className} · {block.section}
                        </h2>
                        <p className='text-sm text-[#808080]'>
                            Given to <span className='font-medium text-[#1E1E1E]'>{block.studentsCount} students</span>
                        </p>
                    </div>

                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left rtl:text-right">
                            <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                                <tr>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Task Type</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Subject</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Homework / Assignment Name</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Assigned Date</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Due Date</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Reviewed Date</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Submissions</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {block.tasks.map((task) => (
                                    <tr
                                        key={task.homeworkName}
                                        className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]"
                                    >
                                        <td className="px-2 py-4 rounded-s-lg">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${taskTypeBadge[task.taskType]}`}>
                                                {task.taskType}
                                            </span>
                                        </td>
                                        <td className="px-2 py-4">{task.subject}</td>
                                        <td className="px-2 py-4 font-medium text-[#1E1E1E]">{task.homeworkName}</td>
                                        <td className="px-2 py-4">{task.assignedDate}</td>
                                        <td className="px-2 py-4">{task.dueDate}</td>
                                        <td className="px-2 py-4">{task.reviewedDate}</td>
                                        <td className="px-2 py-4">{task.submissions}</td>
                                        <td className="px-2 py-4 rounded-e-lg">{task.remarks}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </section>
    )
}

export default ViewTeacherLMS
