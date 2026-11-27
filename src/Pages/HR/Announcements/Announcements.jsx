import AnnouncementListView from '../../../Common/Announcement/AnnouncementListView'

/** HR announcements SoT = HR portal API collections (not campus /announcements). Delivery SMTP/WhatsApp stay stubbed. */
const Announcements = () => (
    <div className="space-y-2">
        <p className="text-xs text-[#667085] px-1">
            Source: live HR API announcements collection. External email / WhatsApp delivery is stubbed until production keys.
        </p>
        <AnnouncementListView roleKey="hr" />
    </div>
)

export default Announcements
