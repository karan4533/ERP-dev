import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, House } from 'lucide-react'
import { getBreadcrumbItems } from './breadcrumbMappings'

const CommonBreadcrumb = () => {
    const { pathname } = useLocation()
    const { homePath, crumbs } = getBreadcrumbItems(pathname)

    if (!crumbs.length) return null

    return (
        <nav
            aria-label="Breadcrumb"
            className="mb-3 w-full rounded-2xl bg-white px-4 py-3 shadow-[0_1px_3px_rgba(16,24,40,0.08)] sm:px-5"
        >
            <ol className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm font-inter">
                <li className="flex items-center">
                    <Link
                        to={homePath}
                        className="inline-flex items-center text-[#515DEF] transition-opacity hover:opacity-80"
                        aria-label="Home"
                    >
                        <House size={18} strokeWidth={2.25} />
                    </Link>
                </li>

                {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1 || crumb.isCurrent

                    return (
                        <li key={`${crumb.label}-${index}`} className="flex items-center gap-x-2.5">
                            <ChevronRight size={16} className="shrink-0 text-[#9CA3AF]" strokeWidth={2} />
                            {crumb.to && !isLast ? (
                                <Link
                                    to={crumb.to}
                                    className="text-[#6B7280] transition-colors hover:text-[#515DEF]"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span
                                    className={
                                        isLast
                                            ? 'font-semibold text-[#111827]'
                                            : 'text-[#6B7280]'
                                    }
                                    aria-current={isLast ? 'page' : undefined}
                                >
                                    {crumb.label}
                                </span>
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}

export default CommonBreadcrumb
