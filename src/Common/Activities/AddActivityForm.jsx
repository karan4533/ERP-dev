import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import {
    MD_APPROVAL_STATUS,
    addActivity,
    formatEventDate,
    formatTimeLabel,
    getActivityById,
    parseEventDateForInput,
    parseTimeForInput,
    updateActivity,
} from './activitiesData'
import { getActivityConfig, getActivityRoutes } from './activityConfigs'
import { getClassSelectOptions } from '../RBAC/academicsCatalogData'
import MdApprovalSubmitModal from './MdApprovalSubmitModal'

const emptyForm = (personField) => ({
    eventName: '',
    eventType: '',
    className: '',
    eventDate: new Date(),
    startTime: '',
    endTime: '',
    venue: '',
    [personField]: '',
    description: '',
})

const activityToForm = (activity, personField) => ({
    eventName: activity.eventName || '',
    eventType: activity.eventType || '',
    className: activity.className || '',
    eventDate: parseEventDateForInput(activity.eventDate),
    startTime: parseTimeForInput(activity.startTime),
    endTime: parseTimeForInput(activity.endTime),
    venue: activity.venue || '',
    [personField]: activity[personField] || '',
    description: activity.description || '',
})

export default function AddActivityForm({ roleKey, activityType, mode = 'add' }) {
    const { id } = useParams()
    const isEdit = mode === 'edit'
    const navigate = useNavigate()
    const config = getActivityConfig(activityType)
    const routes = getActivityRoutes(activityType, roleKey)
    const existing = useMemo(
        () => (isEdit && id ? getActivityById(id) : null),
        [isEdit, id],
    )
    const classOptions = useMemo(() => getClassSelectOptions(), [])

    const [form, setForm] = useState(() => {
        if (isEdit && existing && existing.type === activityType) {
            return activityToForm(existing, config.personField)
        }
        return emptyForm(config.personField)
    })
    const [approvalModal, setApprovalModal] = useState(false)
    const [error, setError] = useState('')

    if (isEdit && id && (!existing || existing.type !== activityType)) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-6'>
                <p className='text-[#667085]'>Activity not found.</p>
                <button
                    type='button'
                    onClick={() => navigate(routes.list)}
                    className='mt-4 text-sm text-[#515DEF] hover:underline cursor-pointer'
                >
                    Back to list
                </button>
            </section>
        )
    }

    const updateField = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }))
    }

    const buildPayload = () => ({
        type: activityType,
        eventName: form.eventName.trim(),
        eventType: form.eventType.trim(),
        className: form.className.trim(),
        eventDate: formatEventDate(form.eventDate),
        startTime: formatTimeLabel(form.startTime),
        endTime: formatTimeLabel(form.endTime),
        venue: form.venue.trim(),
        coordinator: config.personField === 'coordinator' ? form[config.personField].trim() : '',
        coach: config.personField === 'coach' ? form[config.personField].trim() : '',
        description: form.description.trim(),
        submittedBy: existing?.submittedBy || (roleKey === 'admin' ? 'Admin' : 'Director'),
        mdApprovalStatus:
            roleKey === 'admin'
                ? MD_APPROVAL_STATUS.PENDING
                : existing?.mdApprovalStatus || MD_APPROVAL_STATUS.APPROVED,
    })

    const handleSubmit = () => {
        if (!form.eventName.trim()) {
            setError('Event name is required.')
            return
        }
        setError('')

        const payload = buildPayload()

        if (isEdit) {
            updateActivity(id, payload)
            toast.success(
                roleKey === 'admin'
                    ? 'Activity updated and sent for Super Admin approval.'
                    : 'Activity updated.',
            )
            navigate(routes.list)
            return
        }

        addActivity(payload)

        if (roleKey === 'admin') {
            setApprovalModal(true)
            setForm(emptyForm(config.personField))
            toast.success('Activity submitted for Super Admin approval.')
            return
        }

        toast.success('Activity saved and added to the calendar.')
        navigate(routes.list)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>
                    {isEdit ? `Edit ${config.formTitle}` : config.formTitle}
                </h2>
                {roleKey === 'admin' && (
                    <p className='text-sm text-[#667085] mt-2'>
                        Submissions from Admin require Super Admin approval before they are published.
                    </p>
                )}

                {error && (
                    <p className='text-sm text-red-600 mt-4'>{error}</p>
                )}

                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Event Name:</label>
                        <input
                            type='text'
                            value={form.eventName}
                            onChange={(e) => updateField('eventName', e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Event Type:</label>
                        <input
                            type='text'
                            value={form.eventType}
                            onChange={(e) => updateField('eventType', e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                        <select
                            value={form.className}
                            onChange={(e) => updateField('className', e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        >
                            <option value=''>Select class</option>
                            <option value='All Students'>All Students</option>
                            {classOptions.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                        {classOptions.length === 0 && (
                            <p className='text-xs text-[#E65100]'>
                                No classes found. Create classes under Class Details first.
                            </p>
                        )}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Event Date:</label>
                        <div className='relative'>
                            <DatePicker
                                selected={form.eventDate}
                                onChange={(date) => updateField('eventDate', date)}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Start Time:</label>
                        <input
                            type='time'
                            value={form.startTime}
                            onChange={(e) => updateField('startTime', e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>End Time:</label>
                        <input
                            type='time'
                            value={form.endTime}
                            onChange={(e) => updateField('endTime', e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Venue:</label>
                        <input
                            type='text'
                            value={form.venue}
                            onChange={(e) => updateField('venue', e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>{config.personLabel}:</label>
                        <input
                            type='text'
                            value={form[config.personField]}
                            onChange={(e) => updateField(config.personField, e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Description:</label>
                        <input
                            type='text'
                            value={form.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        />
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate(routes.list)}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSubmit}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    {isEdit ? 'Save Changes' : roleKey === 'admin' ? 'Submit for Super Admin Approval' : 'Save Changes'}
                </button>
            </div>

            <MdApprovalSubmitModal
                open={approvalModal}
                onClose={() => setApprovalModal(false)}
                listPath={routes.list}
            />
        </section>
    )
}
