import React from 'react'
import { Link } from 'react-router-dom'

const LINKS = [
    {
        title: 'Cultural Activities',
        description: 'Read-only list from the campus activities API.',
        to: '/pro/events/cultural',
    },
    {
        title: 'Sports Activities',
        description: 'Read-only list from the campus activities API.',
        to: '/pro/events/sports',
    },
    {
        title: 'Competitions',
        description: 'Read-only list from the campus activities API.',
        to: '/pro/events/competitions',
    },
]

const EventsHub = () => (
    <section className='space-y-4'>
        <div>
            <h1 className='text-2xl font-semibold text-black'>Events &amp; School Activities</h1>
            <p className='text-sm text-[#667085] mt-1'>
                Browse approved cultural, sports, and competition activities. Creating or editing is not available for PRO.
            </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {LINKS.map((item) => (
                <Link
                    key={item.to}
                    to={item.to}
                    className='block bg-white rounded-2xl shadow-md p-4 border border-transparent hover:border-[#515DEF]/40 transition-colors'
                >
                    <h2 className='text-base font-semibold text-black'>{item.title}</h2>
                    <p className='mt-2 text-sm text-[#667085]'>{item.description}</p>
                </Link>
            ))}
        </div>
    </section>
)

export default EventsHub
