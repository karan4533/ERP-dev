import { format } from 'date-fns'

const formatCellDate = (date) => {
    if (!date) return '—'
    if (date instanceof Date) return format(date, 'dd-MM-yyyy')
    return date
}

export default function TimetablePeriodCell({
    subject,
    date,
    teacher,
    className = '',
    subjectClassName = 'font-medium',
}) {
    if (!subject) return null

    return (
        <div className={`inline-flex flex-col items-center justify-center gap-0.5 w-full py-3 px-2 rounded-lg text-sm ${className}`}>
            <span className={subjectClassName}>{subject}</span>
            <span className="text-xs font-normal opacity-80">
                {formatCellDate(date)}
            </span>
            <span className="text-xs font-normal opacity-80">
                {teacher || '—'}
            </span>
        </div>
    )
}
