import React, { useState } from 'react'
import { Building2, ExternalLink, Globe, HeartHandshake, Newspaper, Plus, Users, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { DataTable, StatusBadge } from '../../../Common/ui'

const INITIAL_COVERAGE = [
    {
        id: 'MED-2026-012',
        title: 'Queen Mira Students Secure State Ranks in Cambridge IGCSE Math & Sciences',
        mediaHouse: 'The Hindu — Education Plus',
        date: '2026-10-14',
        author: 'Staff Bureau',
        link: 'https://thehindu.com/education/qmis-cambridge-achievers-2026',
        category: 'Academic Excellence',
        sentiment: 'Positive',
    },
    {
        id: 'MED-2026-011',
        title: 'QMIS Green Campus: Solar Power & Zero Waste Water Recycling Model in Madurai',
        mediaHouse: 'Dinamalar (Tamil Daily)',
        date: '2026-09-28',
        author: 'R. Senthil Kumar',
        link: 'https://dinamalar.com/special/qmis-sustainable-campus',
        category: 'Sustainability',
        sentiment: 'Positive',
    },
    {
        id: 'MED-2026-009',
        title: 'Inter-School Invitational Football Championship hosted at QMIS Sports Complex',
        mediaHouse: 'Times of India — Madurai Edition',
        date: '2026-09-12',
        author: 'Sports Desk',
        link: 'https://timesofindia.indiatimes.com/sports/qmis-championship',
        category: 'Sports & Athletics',
        sentiment: 'Positive',
    },
]

const INITIAL_VISITORS = [
    {
        id: 'VIS-2026-044',
        name: 'Dr. K. Rajasekaran',
        designation: 'Senior Scientist & Project Director',
        organization: 'ISRO Propulsion Complex (IPRC), Mahendragiri',
        date: '2026-10-18',
        purpose: 'Chief Guest at National Science Day Expo & Robotics Conclave',
        hostOfficer: 'Director of Academics & PRO',
        feedbackRating: '5 / 5',
        remarks: 'Extraordinary scientific aptitude in middle school learners. State-of-the-art laboratory facilities.',
    },
    {
        id: 'VIS-2026-041',
        name: 'Prof. David Vance',
        designation: 'South Asia Regional Education Officer',
        organization: 'Cambridge International Education (CAIE)',
        date: '2026-10-02',
        purpose: 'Annual Cambridge Curriculum Compliance & Teacher Training Inspection',
        hostOfficer: 'Managing Director & Joint Director',
        feedbackRating: '5 / 5',
        remarks: 'Impeccable academic standards and innovative experiential teaching practices observed.',
    },
]

const PROManagement = () => {
    const [coverageList, setCoverageList] = useState(INITIAL_COVERAGE)
    const [visitorList, setVisitorList] = useState(INITIAL_VISITORS)
    const [activeTab, setActiveTab] = useState('coverage')
    const [isCoverageModal, setIsCoverageModal] = useState(false)
    const [isVisitorModal, setIsVisitorModal] = useState(false)

    const [coverageForm, setCoverageForm] = useState({
        title: '',
        mediaHouse: '',
        date: new Date().toISOString().slice(0, 10),
        category: 'Academic Excellence',
        link: '',
    })

    const [visitorForm, setVisitorForm] = useState({
        name: '',
        designation: '',
        organization: '',
        date: new Date().toISOString().slice(0, 10),
        purpose: '',
        remarks: '',
        feedbackRating: '5 / 5',
    })

    const handleAddCoverage = (e) => {
        e.preventDefault()
        if (!coverageForm.title.trim() || !coverageForm.mediaHouse.trim()) {
            toast.error('Headline and publication name are required.')
            return
        }

        const newRec = {
            id: `MED-2026-${String(coverageList.length + 13).padStart(3, '0')}`,
            ...coverageForm,
            author: 'PRO Desk',
            sentiment: 'Positive',
        }

        setCoverageList([newRec, ...coverageList])
        setIsCoverageModal(false)
        setCoverageForm({
            title: '',
            mediaHouse: '',
            date: new Date().toISOString().slice(0, 10),
            category: 'Academic Excellence',
            link: '',
        })
        toast.success('Media coverage archive updated.')
    }

    const handleAddVisitor = (e) => {
        e.preventDefault()
        if (!visitorForm.name.trim() || !visitorForm.organization.trim()) {
            toast.error('Visitor name and institution/organization are required.')
            return
        }

        const newRec = {
            id: `VIS-2026-${String(visitorList.length + 45).padStart(3, '0')}`,
            ...visitorForm,
            hostOfficer: 'Director Office & PRO',
        }

        setVisitorList([newRec, ...visitorList])
        setIsVisitorModal(false)
        setVisitorForm({
            name: '',
            designation: '',
            organization: '',
            date: new Date().toISOString().slice(0, 10),
            purpose: '',
            remarks: '',
            feedbackRating: '5 / 5',
        })
        toast.success('Dignitary entry logged in VIP Visitor Book.')
    }

    const coverageColumns = [
        { key: 'id', label: 'Article Ref', required: true, render: (row) => <span className='font-mono font-bold'>{row.id}</span> },
        {
            key: 'title',
            label: 'News Headline & Publication',
            required: true,
            render: (row) => (
                <div>
                    <p className='font-semibold text-[var(--erp-ink)]'>{row.title}</p>
                    <p className='text-xs text-[var(--erp-muted)]'>
                        {row.mediaHouse} · {row.category} · {row.date}
                    </p>
                </div>
            ),
        },
        {
            key: 'link',
            label: 'Web Link / Clip',
            render: (row) => (
                <a
                    href={row.link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1 text-xs font-semibold text-[var(--erp-indigo)] hover:underline'
                >
                    View Press Clip <ExternalLink size={12} />
                </a>
            ),
        },
        { key: 'sentiment', label: 'Brand Sentiment', render: (row) => <span className='px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800'>{row.sentiment}</span> },
    ]

    const visitorColumns = [
        { key: 'id', label: 'Log Ref', required: true, render: (row) => <span className='font-mono font-bold'>{row.id}</span> },
        {
            key: 'name',
            label: 'Dignitary Name & Designation',
            required: true,
            render: (row) => (
                <div>
                    <p className='font-semibold text-[var(--erp-ink)]'>{row.name}</p>
                    <p className='text-xs text-[var(--erp-muted)]'>{row.designation} · {row.organization}</p>
                </div>
            ),
        },
        { key: 'date', label: 'Visit Date', render: (row) => row.date },
        { key: 'purpose', label: 'Visit Purpose', render: (row) => <span className='text-xs font-medium'>{row.purpose}</span> },
        { key: 'feedbackRating', label: 'Rating', render: (row) => <span className='font-bold text-amber-600'>{row.feedbackRating}</span> },
        { key: 'remarks', label: 'Dignitary Notes', render: (row) => <span className='text-xs text-slate-600 block max-w-xs truncate' title={row.remarks}>{row.remarks}</span> },
    ]

    return (
        <section className='space-y-5'>
            <div className='flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl shadow-md'>
                <div>
                    <div className='flex items-center gap-2'>
                        <span className='rounded-lg bg-pink-100 p-2 text-pink-700'>
                            <Building2 size={22} />
                        </span>
                        <h1 className='text-xl font-bold text-[var(--erp-ink)]'>
                            Public Relations Officer (PRO) &amp; Media Management
                        </h1>
                    </div>
                    <p className='text-xs text-[var(--erp-muted)] mt-1'>
                        Institutional brand communication, media coverage archives, and VIP guest logbook.
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                    {activeTab === 'coverage' ? (
                        <button
                            type='button'
                            onClick={() => setIsCoverageModal(true)}
                            className='inline-flex items-center gap-1.5 rounded-lg bg-[var(--erp-indigo)] px-4 py-2 text-xs font-semibold text-white cursor-pointer hover:bg-[var(--erp-indigo-dark)]'
                        >
                            <Plus size={16} /> Archive Press Coverage
                        </button>
                    ) : (
                        <button
                            type='button'
                            onClick={() => setIsVisitorModal(true)}
                            className='inline-flex items-center gap-1.5 rounded-lg bg-[var(--erp-indigo)] px-4 py-2 text-xs font-semibold text-white cursor-pointer hover:bg-[var(--erp-indigo-dark)]'
                        >
                            <Plus size={16} /> Log Dignitary Visit
                        </button>
                    )}
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md overflow-hidden'>
                <div className='flex border-b border-[var(--erp-line)] px-5 pt-3 gap-5'>
                    <button
                        type='button'
                        onClick={() => setActiveTab('coverage')}
                        className={`pb-3 text-sm font-semibold border-b-2 cursor-pointer ${
                            activeTab === 'coverage'
                                ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]'
                                : 'border-transparent text-[var(--erp-slate)]'
                        }`}
                    >
                        Press Releases &amp; Media Archive
                    </button>
                    <button
                        type='button'
                        onClick={() => setActiveTab('visitors')}
                        className={`pb-3 text-sm font-semibold border-b-2 cursor-pointer ${
                            activeTab === 'visitors'
                                ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]'
                                : 'border-transparent text-[var(--erp-slate)]'
                        }`}
                    >
                        VIP &amp; Dignitary Visitor Book
                    </button>
                </div>

                <div className='p-4'>
                    {activeTab === 'coverage' ? (
                        <DataTable
                            caption='Media coverage register'
                            rows={coverageList}
                            columns={coverageColumns}
                            rowKey='id'
                        />
                    ) : (
                        <DataTable
                            caption='VIP visitors'
                            rows={visitorList}
                            columns={visitorColumns}
                            rowKey='id'
                        />
                    )}
                </div>
            </div>

            {/* Coverage Modal */}
            {isCoverageModal && (
                <div className='fixed inset-0 z-250 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <h3 className='text-base font-bold text-[var(--erp-ink)]'>Archive Press Release / Media Clip</h3>
                            <button onClick={() => setIsCoverageModal(false)} className='p-1 text-slate-400 hover:bg-slate-100 rounded-lg'>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddCoverage} className='mt-4 space-y-3'>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>News Headline *</label>
                                <input
                                    required
                                    className='w-full text-xs rounded-lg border px-3 py-2'
                                    placeholder='e.g. QMIS Robotics Team Wins National Award'
                                    value={coverageForm.title}
                                    onChange={(e) => setCoverageForm({ ...coverageForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Media House / Publisher *</label>
                                <input
                                    required
                                    className='w-full text-xs rounded-lg border px-3 py-2'
                                    placeholder='e.g. The Hindu / Dinamalar'
                                    value={coverageForm.mediaHouse}
                                    onChange={(e) => setCoverageForm({ ...coverageForm, mediaHouse: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Category</label>
                                <select
                                    className='w-full text-xs rounded-lg border px-3 py-2 bg-white'
                                    value={coverageForm.category}
                                    onChange={(e) => setCoverageForm({ ...coverageForm, category: e.target.value })}
                                >
                                    <option>Academic Excellence</option>
                                    <option>Sports &amp; Athletics</option>
                                    <option>Sustainability &amp; Community</option>
                                    <option>Arts &amp; Culture</option>
                                    <option>Campus Facilities</option>
                                </select>
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Digital Article Link</label>
                                <input
                                    type='url'
                                    className='w-full text-xs rounded-lg border px-3 py-2'
                                    placeholder='https://...'
                                    value={coverageForm.link}
                                    onChange={(e) => setCoverageForm({ ...coverageForm, link: e.target.value })}
                                />
                            </div>
                            <div className='flex justify-end gap-2 border-t pt-3'>
                                <button type='button' onClick={() => setIsCoverageModal(false)} className='rounded-lg border px-3 py-1.5 text-xs'>Cancel</button>
                                <button type='submit' className='rounded-lg bg-[var(--erp-indigo)] px-4 py-1.5 text-xs font-semibold text-white'>Save Article</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Visitor Modal */}
            {isVisitorModal && (
                <div className='fixed inset-0 z-250 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <h3 className='text-base font-bold text-[var(--erp-ink)]'>Log VIP Dignitary Visit</h3>
                            <button onClick={() => setIsVisitorModal(false)} className='p-1 text-slate-400 hover:bg-slate-100 rounded-lg'>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddVisitor} className='mt-4 space-y-3'>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Dignitary Full Name *</label>
                                <input
                                    required
                                    className='w-full text-xs rounded-lg border px-3 py-2'
                                    placeholder='e.g. Dr. K. Radhakrishnan'
                                    value={visitorForm.name}
                                    onChange={(e) => setVisitorForm({ ...visitorForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Designation &amp; Organization *</label>
                                <input
                                    required
                                    className='w-full text-xs rounded-lg border px-3 py-2'
                                    placeholder='e.g. Former ISRO Chairman'
                                    value={visitorForm.organization}
                                    onChange={(e) => setVisitorForm({ ...visitorForm, organization: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Purpose of Campus Visit</label>
                                <input
                                    className='w-full text-xs rounded-lg border px-3 py-2'
                                    placeholder='e.g. Annual Day Chief Guest & Keynote Address'
                                    value={visitorForm.purpose}
                                    onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Guest Remarks / Testimonial</label>
                                <textarea
                                    rows={3}
                                    className='w-full text-xs rounded-lg border px-3 py-2'
                                    placeholder='Remarks noted in visitors diary...'
                                    value={visitorForm.remarks}
                                    onChange={(e) => setVisitorForm({ ...visitorForm, remarks: e.target.value })}
                                />
                            </div>
                            <div className='flex justify-end gap-2 border-t pt-3'>
                                <button type='button' onClick={() => setIsVisitorModal(false)} className='rounded-lg border px-3 py-1.5 text-xs'>Cancel</button>
                                <button type='submit' className='rounded-lg bg-[var(--erp-indigo)] px-4 py-1.5 text-xs font-semibold text-white'>Log Dignitary Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}

export default PROManagement

