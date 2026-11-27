import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'
import { isApiStudentsEnabled } from '../../../services/apiClient'
import { getStudentApi, mapStudentDetailFromApi } from '../../../services/studentsApi'
import { getParentDetailById, mapStudentDetailToParentDetail } from './parentDatabaseData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value || '—'}</span>
    </div>
)

const ViewParent = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [parent, setParent] = useState(null)
    const [status, setStatus] = useState('loading')
    const [error, setError] = useState('')
    const [dataSource, setDataSource] = useState('live')
    const [reloadKey, setReloadKey] = useState(0)

    const loadDetail = useCallback(async () => {
        setStatus('loading')
        setError('')
        if (!id) {
            setParent(null)
            setStatus('ready')
            return
        }
        if (!isApiStudentsEnabled()) {
            setParent(getParentDetailById(id))
            setDataSource('api-off')
            setStatus('ready')
            return
        }
        try {
            const raw = await getStudentApi(id)
            const detail = mapStudentDetailFromApi(raw)
            setParent(mapStudentDetailToParentDetail(detail, mo_user))
            setDataSource('live')
            setError('')
            setStatus('ready')
        } catch (err) {
            const offline = getParentDetailById(id)
            setParent(offline)
            if (offline) {
                setDataSource('cached-api-failed')
                setError(
                    err?.message
                        || 'Campus student detail unavailable. Showing offline/cached parent copy — not live API data.',
                )
            } else {
                setDataSource('empty-api-failed')
                setError(err?.message || 'Parent not found on the campus API.')
            }
            setStatus('ready')
        }
    }, [id])

    useEffect(() => {
        loadDetail()
    }, [loadDetail, reloadKey])

    if (status === 'loading') {
        return (
            <section className='space-y-6'>
                <p className='text-sm text-[#667085]'>Loading parent details…</p>
            </section>
        )
    }

    if (!parent) {
        return (
            <section className='space-y-6'>
                <div className='flex flex-wrap items-center gap-3'>
                    <button
                        type='button'
                        onClick={() => navigate('/front-office/parent-management')}
                        className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                    >
                        <ArrowLeft size={18} />
                        Back to list
                    </button>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center space-y-3'>
                    <p className='text-[#667085]'>{error || 'Parent not found.'}</p>
                    {isApiStudentsEnabled() ? (
                        <button
                            type='button'
                            onClick={() => setReloadKey((k) => k + 1)}
                            className='text-sm px-3 py-1.5 rounded-md border border-[#515DEF] text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                        >
                            Retry live API
                        </button>
                    ) : null}
                </div>
            </section>
        )
    }

    const addr = parent.address
    const contact = parent.contact
    const student = parent.student
    const isCached = dataSource === 'cached-api-failed' || dataSource === 'api-off'

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/front-office/parent-management')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {dataSource === 'live' ? (
                <p className='text-xs text-[#027A48] bg-[#ECFDF3] rounded-lg px-3 py-2'>
                    Live campus student / guardian detail from API.
                </p>
            ) : null}
            {error ? (
                <div className='text-sm text-[#B42318] bg-[#FEF3F2] rounded-lg px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                    <span>
                        {isCached ? <strong>Offline / cached only. </strong> : null}
                        {error}
                    </span>
                    {isApiStudentsEnabled() ? (
                        <button
                            type='button'
                            onClick={() => setReloadKey((k) => k + 1)}
                            className='shrink-0 text-sm px-3 py-1.5 rounded-md border border-[#B42318] text-[#B42318] hover:bg-[#B42318] hover:text-white transition-colors cursor-pointer'
                        >
                            Retry live API
                        </button>
                    ) : null}
                </div>
            ) : null}

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                    <img
                        src={parent.profileImage || mo_user}
                        alt=''
                        className='w-20 h-20 rounded-full object-cover ring-2 ring-indigo-100'
                    />
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>
                            {parent.parentName}
                            {isCached ? (
                                <span className='ml-2 text-xs font-medium uppercase tracking-wide text-[#B54708]'>Cached</span>
                            ) : null}
                        </h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            <span className='font-medium text-[#1E1E1E]'>Parent ID: {parent.parentId}</span>
                            {' · '}
                            <span className='text-[#808080]'>{parent.relation}</span>
                            {' · '}
                            <span className='text-[#808080]'>
                                Linked student id: {parent.studentIds?.[0] || '—'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            <Section title='Personal information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Parent name' value={parent.parentName} />
                    <Field label='Gender' value={parent.gender} />
                    <Field label='Relation to student' value={parent.relation} />
                    <Field label='Occupation' value={parent.occupation} />
                    <Field label='Yearly income' value={parent.yearlyIncome} />
                    <div className='lg:col-span-3'>
                        <Field label='Street / full address' value={addr.address} />
                    </div>
                    <Field label='Country' value={addr.country} />
                    <Field label='State' value={addr.state} />
                    <Field label='City' value={addr.city} />
                    <Field label='Zip code' value={addr.zipCode} />
                    <Field label='Mobile number' value={contact.mobileNumber} />
                    <Field label='Alternative number' value={contact.alternativeNumber} />
                    <Field label='Email' value={contact.email} />
                </div>
            </Section>

            <Section title='Linked student'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Student name' value={student.name} />
                    <Field label='Admission number' value={student.admissionNumber} />
                    <Field label='Class' value={student.class} />
                    <Field label='Section' value={student.section} />
                </div>
            </Section>
        </section>
    )
}

export default ViewParent
