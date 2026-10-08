import { Navigate } from 'react-router-dom'
import { getAnnouncementRoutes } from '../../../Common/Announcement/announcementConfigs'

export default function AddAnnouncement() {
    return <Navigate to={getAnnouncementRoutes('jointdirectorassistant').list} replace />
}
