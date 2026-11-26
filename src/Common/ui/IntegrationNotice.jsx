import { CheckCircle2, CircleAlert, CircleDashed, FlaskConical, RefreshCw } from 'lucide-react'
import { getIntegrationState } from './feedback'
import { getStatusTone } from './tokens'

const ICONS = {
    demo: FlaskConical,
    disconnected: CircleDashed,
    syncing: RefreshCw,
    connected: CheckCircle2,
    failed: CircleAlert,
}

const IntegrationNotice = ({ state = 'disconnected', title, description, action, className = '' }) => {
    const integration = getIntegrationState(state)
    const tone = getStatusTone(integration.tone)
    const Icon = ICONS[integration.state] || CircleDashed

    return (
        <aside
            className={`flex items-start gap-3 rounded-[var(--erp-radius-surface)] border p-3.5 ${className}`}
            style={{ backgroundColor: tone.background, borderColor: tone.border }}
            aria-label={title || integration.title}
        >
            <Icon
                aria-hidden='true'
                className={integration.state === 'syncing' ? 'mt-0.5 shrink-0 animate-spin motion-reduce:animate-none' : 'mt-0.5 shrink-0'}
                size={18}
                style={{ color: tone.foreground }}
            />
            <div className='min-w-0 flex-1'>
                <p className='text-sm font-semibold' style={{ color: tone.foreground }}>
                    {title || integration.title}
                </p>
                <p className='mt-0.5 text-sm text-[var(--erp-slate)]'>
                    {description || integration.description}
                </p>
            </div>
            {action && <div className='shrink-0'>{action}</div>}
        </aside>
    )
}

export default IntegrationNotice
