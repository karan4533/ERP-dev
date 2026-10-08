import React, { useState } from 'react'
import StudentDatabaseListView from '../../../Common/UserDatabase/StudentDatabaseListView'
import EditRequestModal from '../../../Common/CommonComponents/EditRequestModal'
import { ROUTE_BASE } from './studentDatabaseData'

const StudentsList = () => {
    const [editRequestModal, setEditRequestModal] = useState(false)

    return (
        <>
            <StudentDatabaseListView
                routeBase={ROUTE_BASE}
                title='Students List'
                renderExtraActions={() => (
                    <button
                        type='button'
                        onClick={() => setEditRequestModal(true)}
                        className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                    >
                        Edit
                    </button>
                )}
            />
            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
        </>
    )
}

export default StudentsList
