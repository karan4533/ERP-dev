import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { flattenSidebarLinks, resolveSidebarLinks } from '../../CommonSidebar/resolveSidebarLinks'
import { searchPages } from './globalSearchIndex'

/**
 * Header search over the pages the signed-in role can open (its own menu), so it never lists
 * an unauthorized or missing route. Ctrl/⌘+K focuses it; arrows + Enter open a result.
 * The header keys it by pathname, so navigating clears the query.
 */
const GlobalSearch = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { role } = useAuth()
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState(0)
    const inputRef = useRef(null)
    const boxRef = useRef(null)

    const pages = useMemo(() => flattenSidebarLinks(resolveSidebarLinks(location.pathname, role)), [location.pathname, role])
    const results = useMemo(() => searchPages(pages, query), [pages, query])

    useEffect(() => {
        const onKey = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault()
                inputRef.current?.focus()
                setOpen(true)
            }
        }
        const onClick = (event) => {
            if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false)
        }
        window.addEventListener('keydown', onKey)
        document.addEventListener('mousedown', onClick)
        return () => {
            window.removeEventListener('keydown', onKey)
            document.removeEventListener('mousedown', onClick)
        }
    }, [])

    const go = (page) => {
        if (!page) return
        setOpen(false)
        setQuery('')
        navigate(page.to)
    }

    const onKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActive((index) => Math.min(index + 1, results.length - 1))
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActive((index) => Math.max(index - 1, 0))
        } else if (event.key === 'Enter') {
            event.preventDefault()
            go(results[active])
        } else if (event.key === 'Escape') {
            setOpen(false)
            inputRef.current?.blur()
        }
    }

    return (
        <div ref={boxRef} className='relative hidden sm:block w-64 lg:w-80'>
            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
            <input
                ref={inputRef}
                type='search'
                value={query}
                onChange={(event) => {
                    setQuery(event.target.value)
                    setActive(0)
                    setOpen(true)
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
                placeholder='Search pages (Ctrl+K)'
                aria-label='Search pages'
                role='combobox'
                aria-expanded={open && Boolean(query.trim())}
                aria-controls='global-search-results'
                className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2 focus:outline-none focus:border-[#515DEF]'
            />
            {open && query.trim() && (
                <div
                    id='global-search-results'
                    role='listbox'
                    className='absolute left-0 right-0 mt-1 bg-white border border-[#E4E7EC] rounded-lg shadow-lg max-h-80 overflow-y-auto z-300'
                >
                    {results.length === 0 ? (
                        <p className='px-3 py-3 text-sm text-[#667085]'>No pages match “{query.trim()}”.</p>
                    ) : (
                        results.map((page, index) => (
                            <button
                                key={page.to}
                                type='button'
                                role='option'
                                aria-selected={index === active}
                                onMouseEnter={() => setActive(index)}
                                onClick={() => go(page)}
                                className={`w-full text-left px-3 py-2 cursor-pointer ${index === active ? 'bg-[#EDEEF5]' : 'bg-white'}`}
                            >
                                <span className='block text-sm text-[#1E1E1E]'>{page.title}</span>
                                {page.section ? <span className='block text-xs text-[#667085]'>{page.section}</span> : null}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export default GlobalSearch
