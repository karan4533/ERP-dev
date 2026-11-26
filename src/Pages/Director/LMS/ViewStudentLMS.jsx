import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Download } from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'
import pdf_icon from '../../../assets/images/pdf-icon.png'
import mp4_icon from '../../../assets/images/mp4-icon.png'

const MOCK_STUDENT = {
    studentId: 'STU-100842',
    studentName: 'Rahul Kumar Sharma',
    class: 'Class 10',
    section: 'Section A',
    profileImage: null,
}

const SUBJECT_HOMEWORK = [
    {
        subject: 'Mathematics',
        teacherName: 'Anita Verma',
        homework: [
            {
                title: 'Algebra Worksheet – Chapter 5',
                givenDate: '03-03-2026',
                uploadedDate: '05-03-2026',
                documents: [
                    { name: 'Algebra_Worksheet_Answers.pdf', type: 'pdf' },
                ],
            },
            {
                title: 'Quadratic Equations Practice',
                givenDate: '10-03-2026',
                uploadedDate: '12-03-2026',
                documents: [
                    { name: 'Quadratic_Practice.pdf', type: 'pdf' },
                    { name: 'Solution_Scan.jpg', type: 'pdf' },
                ],
            },
        ],
    },
    {
        subject: 'Science',
        teacherName: 'John Milton',
        homework: [
            {
                title: 'Photosynthesis Lab Report',
                givenDate: '04-03-2026',
                uploadedDate: '07-03-2026',
                documents: [
                    { name: 'Lab_Report_Photosynthesis.pdf', type: 'pdf' },
                ],
            },
        ],
    },
    {
        subject: 'English',
        teacherName: 'Sarah Thomas',
        homework: [
            {
                title: 'Essay on Environmental Protection',
                givenDate: '01-03-2026',
                uploadedDate: '04-03-2026',
                documents: [
                    { name: 'Environment_Essay.pdf', type: 'pdf' },
                ],
            },
            {
                title: 'Grammar Exercise – Tenses',
                givenDate: '08-03-2026',
                uploadedDate: '—',
                documents: [],
            },
        ],
    },
    {
        subject: 'Social Science',
        teacherName: 'David Wilson',
        homework: [
            {
                title: 'Indian Independence Movement Notes',
                givenDate: '06-03-2026',
                uploadedDate: '09-03-2026',
                documents: [
                    { name: 'Independence_Notes.pdf', type: 'pdf' },
                    { name: 'Presentation_Recording.mp4', type: 'video' },
                ],
            },
        ],
    },
]

const DocumentIcon = ({ type }) => (
    <img src={type === 'video' ? mp4_icon : pdf_icon} alt="" className="w-6 h-6 shrink-0" />
)

const ViewStudentLMS = () => {
    const navigate = useNavigate()
    const student = MOCK_STUDENT

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/director/lms/student-lms')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                    <img
                        src={student.profileImage || mo_user}
                        alt=""
                        className='w-20 h-20 rounded-full object-cover ring-2 ring-indigo-100'
                    />
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>{student.studentName}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            <span className='font-medium text-[#1E1E1E]'>Student ID: {student.studentId}</span>
                            {' · '}
                            <span className='text-[#808080]'>{student.class} · {student.section}</span>
                        </p>
                    </div>
                </div>
            </div>

            {SUBJECT_HOMEWORK.map((subjectBlock) => (
                <div key={subjectBlock.subject} className='bg-white rounded-2xl shadow-md p-4'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 pb-4 border-b border-[#EEF0F6]'>
                        <h2 className='text-xl font-semibold text-[#0C1E5B]'>{subjectBlock.subject}</h2>
                        <p className='text-sm text-[#808080]'>
                            Subject Teacher: <span className='font-medium text-[#1E1E1E]'>{subjectBlock.teacherName}</span>
                        </p>
                    </div>

                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left rtl:text-right">
                            <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                                <tr>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Homework Title</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Given By</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Given Date</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Uploaded Date</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Uploaded Documents</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjectBlock.homework.map((item) => (
                                    <tr
                                        key={item.title}
                                        className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]"
                                    >
                                        <td className="px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg">{item.title}</td>
                                        <td className="px-2 py-4">{subjectBlock.teacherName}</td>
                                        <td className="px-2 py-4">{item.givenDate}</td>
                                        <td className="px-2 py-4">{item.uploadedDate}</td>
                                        <td className="px-2 py-4 rounded-e-lg">
                                            {item.documents.length > 0 ? (
                                                <div className='flex flex-col gap-2'>
                                                    {item.documents.map((doc) => (
                                                        <div
                                                            key={doc.name}
                                                            className='flex items-center justify-between gap-3 rounded-lg border border-[#E8ECF4] bg-[#FAFBFD] px-3 py-2'
                                                        >
                                                            <span className='flex items-center gap-2 min-w-0'>
                                                                <DocumentIcon type={doc.type} />
                                                                <span className='text-sm font-normal text-[#515DEF] truncate'>{doc.name}</span>
                                                            </span>
                                                            <span className='flex items-center gap-1 shrink-0'>
                                                                <button
                                                                    type='button'
                                                                    className='p-1.5 rounded-md text-[#515DEF] hover:bg-[#515DEF]/10 cursor-pointer'
                                                                    title='View'
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button
                                                                    type='button'
                                                                    className='p-1.5 rounded-md text-[#515DEF] hover:bg-[#515DEF]/10 cursor-pointer'
                                                                    title='Download'
                                                                >
                                                                    <Download size={16} />
                                                                </button>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className='text-sm text-[#808080]'>Not uploaded yet</span>
                                            )}
                                        </td>
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

export default ViewStudentLMS
