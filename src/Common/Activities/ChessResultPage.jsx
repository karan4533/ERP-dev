import { useMemo, useState } from 'react'
import { Award, CalendarDays, MapPin, Search, Trophy, UsersRound } from 'lucide-react'
import { getChessResultActivities } from './activitiesData'

const resultBadgeColor = {
    Winner: 'bg-[#4CAF5033] text-[#4CAF50]',
    'Runner Up': 'bg-[#00B0FF33] text-[#0086C9]',
    'Third Place': 'bg-[#FF980033] text-[#FF9800]',
    Completed: 'bg-[#515DEF1A] text-[#515DEF]',
}

const StatTile = ({ icon: Icon, label, value, tone }) => (
    <div className={`border rounded-xl p-4 ${tone}`}>
        <div className='flex items-center gap-3'>
            <div className='size-11 rounded-full bg-white/70 flex items-center justify-center shrink-0'>
                <Icon size={22} />
            </div>
            <div className='min-w-0'>
                <p className='text-sm font-medium opacity-75 truncate'>{label}</p>
                <p className='text-2xl font-bold leading-tight truncate'>{value}</p>
            </div>
        </div>
    </div>
)

export default function ChessResultPage() {
    const [search, setSearch] = useState('')
    const [selectedId, setSelectedId] = useState('')

    const chessResults = useMemo(() => getChessResultActivities(), [])
    const filteredResults = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return chessResults
        return chessResults.filter((item) => {
            const haystack = `${item.eventName} ${item.eventType} ${item.venue} ${item.eventDate}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [chessResults, search])

    const selectedTournament =
        filteredResults.find((item) => item.id === selectedId)
        || filteredResults[0]
        || null
    const players = selectedTournament?.players || []
    const categoryCount = new Set(players.map((player) => player.category).filter(Boolean)).size

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4'>
                    <div>
                        <h1 className='text-xl font-semibold text-black'>Chess Result</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            APAR SPORTS ACADEMY 3rd DISTRICT LEVEL OPEN & CHILDRENs CHESS TOURNAMENT
                        </p>
                    </div>
                    <div className='relative w-full lg:max-w-sm'>
                        <input
                            type='text'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Search tournament'
                            className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-2.5 pl-9 focus:outline-none'
                        />
                        <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                <StatTile icon={Trophy} label='Tournaments' value={filteredResults.length} tone='bg-[#F9F7FE] border-[#DFDDEF] text-[#2515B4]' />
                <StatTile icon={UsersRound} label='Players' value={players.length} tone='bg-[#F0F8FE] border-[#D2E2F0] text-[#0056D2]' />
                <StatTile icon={Award} label='Categories' value={categoryCount} tone='bg-[#F1FCF2] border-[#D1E7CC] text-[#0B6D2C]' />
                <StatTile icon={CalendarDays} label='Event Date' value={selectedTournament?.eventDate || '-'} tone='bg-[#FFF7ED] border-[#FED7AA] text-[#B45309]' />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Tournament List</h2>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Tournament</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Event Type</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Venue</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Players</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResults.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className='px-2 py-8 text-center text-[#667085]'>
                                        No chess results found.
                                    </td>
                                </tr>
                            ) : (
                                filteredResults.map((tournament) => (
                                    <tr
                                        key={tournament.id}
                                        onClick={() => setSelectedId(tournament.id)}
                                        className={`border-b border-[#f2f4f7] text-[#667085] hover:bg-[#f2f4f7] cursor-pointer ${selectedTournament?.id === tournament.id ? 'bg-[#F7F8FF]' : ''}`}
                                    >
                                        <td className='px-2 py-4 rounded-s-lg font-medium text-[#1E1E1E]'>{tournament.eventName}</td>
                                        <td className='px-2 py-4'>{tournament.eventType}</td>
                                        <td className='px-2 py-4'>{tournament.eventDate}</td>
                                        <td className='px-2 py-4'>
                                            <span className='inline-flex items-center gap-1'>
                                                <MapPin size={14} />
                                                {tournament.venue}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4'>{tournament.players?.length || 0}</td>
                                        <td className='px-2 py-4 rounded-e-lg'>
                                            <span className='px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap bg-[#4CAF5033] text-[#4CAF50]'>
                                                Published
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Player Results</h2>
                    <span className='text-sm font-medium text-[#515DEF]'>{players.length} Players</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Rank</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Player Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Category</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>School</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Rating</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Score</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Tie Break</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className='px-2 py-8 text-center text-[#667085]'>
                                        No player results found.
                                    </td>
                                </tr>
                            ) : (
                                players.map((player) => (
                                    <tr key={player.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 rounded-s-lg font-semibold text-[#1E1E1E]'>{player.rank}</td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{player.name}</td>
                                        <td className='px-2 py-4'>{player.category}</td>
                                        <td className='px-2 py-4'>{player.className}</td>
                                        <td className='px-2 py-4'>{player.school}</td>
                                        <td className='px-2 py-4'>{player.rating}</td>
                                        <td className='px-2 py-4'>{player.score}</td>
                                        <td className='px-2 py-4'>{player.tieBreak}</td>
                                        <td className='px-2 py-4 rounded-e-lg'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${resultBadgeColor[player.result] || resultBadgeColor.Completed}`}>
                                                {player.result}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}
