import { Navigate, useParams } from 'react-router-dom'

const RedirectLegacyDirectMessages = ({ inboxBase }) => {
    const { conversationId } = useParams()
    return (
        <Navigate
            to={conversationId ? `${inboxBase}/${conversationId}` : inboxBase}
            replace
        />
    )
}

export default RedirectLegacyDirectMessages
