import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Upload } from 'lucide-react'
import {
    AUTO_FILLED,
    AUDIENCE_OPTIONS,
    CATEGORY_OPTIONS,
    DELIVERY_CHANNELS,
    DEPARTMENT_OPTIONS,
    GRADE_OPTIONS,
    PRIORITY_OPTIONS,
    SECTION_OPTIONS,
} from '../announcementData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const readOnlyClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-[#F9F9F9]'

const AnnouncementInfo = () => {
    const [audience, setAudience] = useState('')
    const [scheduleType, setScheduleType] = useState('immediate')
    const [publishDateTime, setPublishDateTime] = useState(null)
    const [expiryDateTime, setExpiryDateTime] = useState(null)
    const [channels, setChannels] = useState([])

    const toggleChannel = (channel) => {
        setChannels((prev) =>
            prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
        )
    }

    return (
        <div className='space-y-8 lg:mt-8 mt-2'>
            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Basic Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-2 flex flex-col gap-y-2'>
                        <label htmlFor="announcement-title" className='text-base font-medium text-[#1E1E1E]'>Announcement Title *</label>
                        <input type="text" id="announcement-title" placeholder="Enter announcement title" className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="announcement-category" className='text-base font-medium text-[#1E1E1E]'>Category *</label>
                        <select id="announcement-category" className={selectClass} defaultValue="">
                            <option value="" disabled>Select category</option>
                            {CATEGORY_OPTIONS.map((category) => (
                                <option key={category.value} value={category.value}>{category.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <label htmlFor="announcement-message" className='text-base font-medium text-[#1E1E1E]'>Message *</label>
                        <textarea id="announcement-message" rows={4} placeholder="Enter announcement message" className={`${inputClass} resize-none`} />
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Audience Selection</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                    {AUDIENCE_OPTIONS.map((option) => (
                        <label key={option.value} className='flex items-center gap-x-2 text-sm text-[#1E1E1E] cursor-pointer border border-[#D9D9D9] rounded-md px-3 py-3 hover:border-[#515DEF]'>
                            <input
                                type="radio"
                                name="audience"
                                value={option.value}
                                checked={audience === option.value}
                                onChange={(e) => setAudience(e.target.value)}
                                className='accent-[#515DEF]'
                            />
                            {option.label}
                        </label>
                    ))}
                </div>

                {audience === 'specific-class' && (
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6'>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor="grade" className='text-base font-medium text-[#1E1E1E]'>Grade *</label>
                            <select id="grade" className={selectClass} defaultValue="">
                                <option value="" disabled>Select grade</option>
                                {GRADE_OPTIONS.map((grade) => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor="section" className='text-base font-medium text-[#1E1E1E]'>Section *</label>
                            <select id="section" className={selectClass} defaultValue="">
                                <option value="" disabled>Select section</option>
                                {SECTION_OPTIONS.map((section) => (
                                    <option key={section} value={section}>{section}</option>
                                ))}
                            </select>
                        </div>
                        <p className='sm:col-span-2 text-xs text-[#667085]'>Example: Grade 10-A, Grade 11-B</p>
                    </div>
                )}

                {audience === 'specific-department' && (
                    <div className='mt-6 max-w-md'>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor="department" className='text-base font-medium text-[#1E1E1E]'>Department *</label>
                            <select id="department" className={selectClass} defaultValue="">
                                <option value="" disabled>Select department</option>
                                {DEPARTMENT_OPTIONS.map((dept) => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Priority</h3>
                <div className='flex flex-wrap gap-3'>
                    {PRIORITY_OPTIONS.map((priority) => (
                        <label key={priority} className='flex items-center gap-x-2 text-sm text-[#1E1E1E] cursor-pointer border border-[#D9D9D9] rounded-md px-4 py-2.5 hover:border-[#515DEF]'>
                            <input type="radio" name="priority" value={priority} className='accent-[#515DEF]' />
                            {priority}
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Delivery Channels</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                    {DELIVERY_CHANNELS.map((channel) => (
                        <label key={channel} className='flex items-center gap-x-2 text-sm text-[#1E1E1E] cursor-pointer border border-[#D9D9D9] rounded-md px-3 py-3 hover:border-[#515DEF]'>
                            <input
                                type="checkbox"
                                checked={channels.includes(channel)}
                                onChange={() => toggleChannel(channel)}
                                className='accent-[#515DEF]'
                            />
                            {channel}
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Schedule</h3>
                <div className='flex flex-wrap gap-4 mb-6'>
                    <label className='flex items-center gap-x-2 text-sm text-[#1E1E1E] cursor-pointer'>
                        <input
                            type="radio"
                            name="schedule"
                            value="immediate"
                            checked={scheduleType === 'immediate'}
                            onChange={() => setScheduleType('immediate')}
                            className='accent-[#515DEF]'
                        />
                        Publish Immediately
                    </label>
                    <label className='flex items-center gap-x-2 text-sm text-[#1E1E1E] cursor-pointer'>
                        <input
                            type="radio"
                            name="schedule"
                            value="later"
                            checked={scheduleType === 'later'}
                            onChange={() => setScheduleType('later')}
                            className='accent-[#515DEF]'
                        />
                        Schedule Later
                    </label>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                    {scheduleType === 'later' && (
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Publish Date & Time *</label>
                            <div className='relative'>
                                <DatePicker
                                    selected={publishDateTime}
                                    onChange={setPublishDateTime}
                                    showTimeSelect
                                    timeFormat="hh:mm aa"
                                    timeIntervals={15}
                                    dateFormat="dd/MM/yyyy hh:mm aa"
                                    placeholderText="Select publish date & time"
                                    className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                                />
                                <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                            </div>
                        </div>
                    )}
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Expiry Date & Time</label>
                        <div className='relative'>
                            <DatePicker
                                selected={expiryDateTime}
                                onChange={setExpiryDateTime}
                                isClearable
                                showTimeSelect
                                timeFormat="hh:mm aa"
                                timeIntervals={15}
                                dateFormat="dd/MM/yyyy hh:mm aa"
                                placeholderText="Optional expiry date & time"
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Sent By</label>
                        <input type="text" readOnly value={AUTO_FILLED.sentBy} className={readOnlyClass} />
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Attachments (Optional)</h3>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
                    {['PDF', 'Image', 'Document'].map((type) => (
                        <div key={type} className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>{type}</label>
                            <label className='flex flex-col items-center justify-center gap-2 border border-dashed border-[#D9D9D9] rounded-md px-4 py-6 cursor-pointer hover:border-[#515DEF] transition-colors'>
                                <Upload size={20} className='text-[#808080]' />
                                <span className='text-xs text-[#667085]'>Click to upload {type.toLowerCase()}</span>
                                <input type="file" className='hidden' accept={type === 'Image' ? 'image/*' : type === 'PDF' ? '.pdf' : '.doc,.docx,.pdf'} />
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default AnnouncementInfo
