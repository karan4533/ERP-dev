import React, { useMemo, useState } from 'react'
import {
    ChevronLeft,
    ChevronRight,
    Download,
    EllipsisIcon,
    Eye,
    Pencil,
    Plus,
} from 'lucide-react'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import QuestionFormModal from './QuestionFormModal'
import {
    DEPARTMENT_OPTIONS,
    MANDATORY_FILTER_OPTIONS,
    QUESTION_BANK,
    QUESTION_STATUS_OPTIONS,
    SECTION_OPTIONS,
    createQuestionId,
    getQuestionStatus,
    getSectionMeta,
    mandatoryBadgeColor,
    questionStatusBadgeColor,
} from './questionBankData'
import { RESPONSE_TYPES_LIST, getActiveResponseTypeLabels } from '../ResponseTypes/responseTypesData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const QuestionBankList = () => {
    const [questions, setQuestions] = useState(QUESTION_BANK)
    const [search, setSearch] = useState('')
    const [department, setDepartment] = useState('')
    const [sectionId, setSectionId] = useState('')
    const [responseType, setResponseType] = useState('')
    const [mandatoryFilter, setMandatoryFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [formModal, setFormModal] = useState({ open: false, mode: 'create', question: null, questionId: null })

    const activeResponseTypes = useMemo(
        () => getActiveResponseTypeLabels(RESPONSE_TYPES_LIST),
        []
    )

    const filteredQuestions = useMemo(() => questions
        .filter((question) => {
            const searchValue = search.trim().toLowerCase()
            const matchesSearch = !searchValue
                || question.id.toLowerCase().includes(searchValue)
                || question.question.toLowerCase().includes(searchValue)
            const matchesDepartment = !department || question.department === department
            const matchesSection = !sectionId || question.sectionId === sectionId
            const matchesResponseType = !responseType || question.responseType === responseType
            const matchesMandatory = !mandatoryFilter
                || mandatoryFilter === 'All'
                || (mandatoryFilter === 'Mandatory' && question.mandatory)
                || (mandatoryFilter === 'Optional' && !question.mandatory)
            const questionStatus = getQuestionStatus(question.active)
            const matchesStatus = !statusFilter || questionStatus === statusFilter

            return matchesSearch
                && matchesDepartment
                && matchesSection
                && matchesResponseType
                && matchesMandatory
                && matchesStatus
        })
        .sort((a, b) => {
            if (a.sectionName !== b.sectionName) {
                return a.sectionName.localeCompare(b.sectionName)
            }
            return a.order - b.order
        }), [questions, search, department, sectionId, responseType, mandatoryFilter, statusFilter])

    const sectionFilterOptions = useMemo(() => {
        if (!department) return SECTION_OPTIONS
        return SECTION_OPTIONS.filter((section) => section.department === department)
    }, [department])

    const clearFilters = () => {
        setSearch('')
        setDepartment('')
        setSectionId('')
        setResponseType('')
        setMandatoryFilter('')
        setStatusFilter('')
    }

    const toFormData = (question) => ({
        sectionId: question.sectionId,
        question: question.question,
        description: question.description,
        responseType: question.responseType,
        mandatory: question.mandatory,
        weightage: String(question.weightage),
        order: String(question.order),
        active: question.active,
    })

    const openCreateModal = () => {
        const sectionQuestions = sectionId
            ? questions.filter((question) => question.sectionId === sectionId)
            : []
        setFormModal({
            open: true,
            mode: 'create',
            questionId: null,
            question: {
                sectionId: sectionId || '',
                question: '',
                description: '',
                responseType: '',
                mandatory: false,
                weightage: '1',
                order: String(sectionQuestions.length + 1 || 1),
                active: true,
            },
        })
    }

    const openEditModal = (question) => {
        setFormModal({
            open: true,
            mode: 'edit',
            questionId: question.id,
            question: toFormData(question),
        })
    }

    const openViewModal = (question) => {
        setFormModal({
            open: true,
            mode: 'view',
            questionId: question.id,
            question: toFormData(question),
        })
    }

    const closeFormModal = () => {
        setFormModal({ open: false, mode: 'create', question: null, questionId: null })
    }

    const handleSave = (formData) => {
        const sectionMeta = getSectionMeta(formData.sectionId)
        const payload = {
            sectionId: formData.sectionId,
            sectionName: sectionMeta?.sectionName ?? '',
            templateName: sectionMeta?.templateName ?? '',
            department: sectionMeta?.department ?? '',
            question: formData.question,
            description: formData.description,
            responseType: formData.responseType,
            mandatory: formData.mandatory,
            weightage: Number(formData.weightage) || 1,
            order: Number(formData.order) || 1,
            active: formData.active,
        }

        if (formModal.mode === 'edit' && formModal.questionId) {
            setQuestions((prev) => prev.map((question) => (
                question.id === formModal.questionId
                    ? { ...question, ...payload }
                    : question
            )))
        } else {
            setQuestions((prev) => [
                {
                    id: createQuestionId(prev),
                    ...payload,
                },
                ...prev,
            ])
        }

        closeFormModal()
    }

    const toggleActive = (questionId) => {
        setQuestions((prev) => prev.map((question) => (
            question.id === questionId
                ? { ...question, active: !question.active }
                : question
        )))
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-sm text-[#667085] mb-4'>
                    Manage audit questions across checklist sections with flexible response types, weightage, and mandatory rules.
                </p>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2 xl:col-span-2'>
                        <label htmlFor='question-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='question-search'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Question ID, text...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='question-department-filter' className='text-base font-medium text-[#808080]'>Department</label>
                        <select
                            id='question-department-filter'
                            value={department}
                            onChange={(event) => {
                                setDepartment(event.target.value)
                                setSectionId('')
                            }}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {DEPARTMENT_OPTIONS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='question-section-filter' className='text-base font-medium text-[#808080]'>Section</label>
                        <select
                            id='question-section-filter'
                            value={sectionId}
                            onChange={(event) => setSectionId(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All Sections</option>
                            {sectionFilterOptions.map((section) => (
                                <option key={section.id} value={section.id}>{section.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='question-response-filter' className='text-base font-medium text-[#808080]'>Response Type</label>
                        <select
                            id='question-response-filter'
                            value={responseType}
                            onChange={(event) => setResponseType(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {activeResponseTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='question-mandatory-filter' className='text-base font-medium text-[#808080]'>Mandatory</label>
                        <select
                            id='question-mandatory-filter'
                            value={mandatoryFilter}
                            onChange={(event) => setMandatoryFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            {MANDATORY_FILTER_OPTIONS.map((item) => (
                                <option key={item} value={item === 'All' ? '' : item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='question-status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='question-status-filter'
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {QUESTION_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-3'>Supported Response Types</h3>
                <div className='flex flex-wrap gap-2'>
                    {RESPONSE_TYPES_LIST.filter((item) => item.active).map((item) => (
                        <span
                            key={item.id}
                            className='text-xs font-medium px-3 py-1.5 rounded-full bg-[#515DEF1A] text-[#515DEF]'
                            title={item.description}
                        >
                            {item.type}
                        </span>
                    ))}
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Question Bank</h2>
                    <div className='flex gap-x-2'>
                        <button
                            type='button'
                            onClick={openCreateModal}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Create Question
                        </button>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Question ID</th>
                                <th className={thClass}>Question</th>
                                <th className={thClass}>Department</th>
                                <th className={thClass}>Response Type</th>
                                <th className={thClass}>Mandatory</th>
                                <th className={thClass}>Weightage</th>
                                <th className={thClass}>Status</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuestions.map((question) => {
                                const status = getQuestionStatus(question.active)
                                const mandatoryLabel = question.mandatory ? 'Yes' : 'No'
                                return (
                                    <tr key={question.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg whitespace-nowrap`}>{question.id}</td>
                                        <td className={`${tdClass} max-w-[280px]`}>
                                            <p className='font-medium text-[#1E1E1E] truncate' title={question.question}>{question.question}</p>
                                            <p className='text-xs text-[#808080] mt-0.5 truncate' title={`${question.sectionName} — ${question.templateName}`}>
                                                {question.sectionName} — {question.templateName}
                                            </p>
                                        </td>
                                        <td className={tdClass}>{question.department}</td>
                                        <td className={tdClass}>
                                            <span className='text-xs px-2 py-1 rounded bg-[#EDEEF5] text-[#667085] whitespace-nowrap'>
                                                {question.responseType}
                                            </span>
                                        </td>
                                        <td className={tdClass}>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${mandatoryBadgeColor[mandatoryLabel]}`}>
                                                {mandatoryLabel}
                                            </span>
                                        </td>
                                        <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{question.weightage}</td>
                                        <td className={tdClass}>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${questionStatusBadgeColor[status]}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className={`${tdClass} text-center rounded-e-lg`}>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <button
                                                    type='button'
                                                    onClick={() => openViewModal(question)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                                >
                                                    <Eye size={14} />
                                                    View
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => openEditModal(question)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                                >
                                                    <Pencil size={14} />
                                                    Edit
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => toggleActive(question.id)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    {question.active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredQuestions.length === 0 && (
                    <p className='text-sm text-[#667085] text-center py-8'>No questions match the selected filters.</p>
                )}
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filteredQuestions.length} of {filteredQuestions.length} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <QuestionFormModal
                isOpen={formModal.open}
                mode={formModal.mode}
                initialData={formModal.question}
                onClose={closeFormModal}
                onSave={handleSave}
            />
        </section>
    )
}

export default QuestionBankList
