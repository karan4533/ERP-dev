import { ArrowLeft, Workflow } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FeedbackState from './FeedbackState'
import PageHeader from './PageHeader'

const UnavailableWorkflowPage = ({
    title = 'Workflow not connected',
    description = 'This route is reserved for a documented workflow, but its production data and approval contract are not connected yet.',
}) => {
    const navigate = useNavigate()

    return (
        <div>
            <PageHeader
                title={title}
                description='No records were changed and you have not been redirected to an unrelated module.'
                status='Not connected'
            />
            <FeedbackState
                kind='empty'
                title='This workflow is not available yet'
                description={description}
                action={(
                    <button
                        type='button'
                        onClick={() => navigate(-1)}
                        className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3.5 text-sm font-semibold text-[var(--erp-ink)] hover:bg-[var(--erp-canvas)]'
                    >
                        <ArrowLeft aria-hidden='true' size={16} />
                        Return to previous page
                    </button>
                )}
            />
            <p className='sr-only'><Workflow aria-hidden='true' /> Workflow integration pending.</p>
        </div>
    )
}

export default UnavailableWorkflowPage
