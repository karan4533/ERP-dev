import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { toast } from 'react-toastify'
import DocumentFileUpload from '../../Pages/Admin/Documents/EmployeeDocuments/Components/DocumentFileUpload'
import { addAnnouncement, canCreateAnnouncements, CATEGORY_OPTIONS } from './announcementData'
import { getAnnouncementRoutes } from './announcementConfigs'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
const readOnlyInputClass = `${inputClass} bg-[#F9F9F9] cursor-not-allowed`

export default function AddAnnouncementForm({ roleKey }) {
    const navigate = useNavigate()
    const routes = getAnnouncementRoutes(roleKey)
    const sentBy = routes.sentByDefault || ''
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('')
    const [message, setMessage] = useState('')
    const [announcementDate, setAnnouncementDate] = useState(new Date())
    const [attachmentName, setAttachmentName] = useState('')

    if (!canCreateAnnouncements(roleKey)) {
        return <Navigate to={routes.list} replace />
    }

    const handleSave = () => {
        if (!title.trim()) {
            toast.error('Announcement title is required.')
            return
        }
        if (!category) {
            toast.error('Please select an announcement category.')
            return
        }
        if (!message.trim()) {
            toast.error('Announcement message is required.')
            return
        }

        addAnnouncement(
            {
                title,
                category,
                message,
                sentBy,
                announcementDate,
                attachmentName,
            },
            roleKey,
        )

        toast.success('Announcement created successfully.')
        navigate(routes.list)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Add Announcement Information</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='announcement-title' className='text-base font-medium text-[#1E1E1E]'>Announcement Title:</label>
                        <input
                            type='text'
                            id='announcement-title'
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='announcement-category' className='text-base font-medium text-[#1E1E1E]'>Announcement Category:</label>
                        <select
                            id='announcement-category'
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                            className={inputClass}
                        >
                            <option value=''>Select Category</option>
                            {CATEGORY_OPTIONS.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2 lg:col-span-3'>
                        <label htmlFor='announcement-message' className='text-base font-medium text-[#1E1E1E]'>Announcement Message:</label>
                        <textarea
                            id='announcement-message'
                            rows={3}
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='sent-by' className='text-base font-medium text-[#1E1E1E]'>Sent By:</label>
                        <input
                            type='text'
                            id='sent-by'
                            value={sentBy}
                            readOnly
                            disabled
                            className={readOnlyInputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='announcement-date' className='text-base font-medium text-[#1E1E1E]'>Announcement Date:</label>
                        <div className='relative'>
                            <DatePicker
                                id='announcement-date'
                                selected={announcementDate}
                                onChange={(date) => setAnnouncementDate(date || new Date())}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='col-span-full flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Upload Attachment:</label>
                        <DocumentFileUpload fileName={attachmentName} onChange={setAttachmentName} />
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate(routes.list)}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSave}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}
