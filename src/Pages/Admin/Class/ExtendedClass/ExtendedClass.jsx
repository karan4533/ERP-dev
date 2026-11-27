import TeacherExtraClass from '../../../Teacher/ExtraClass/ExtraClass'

/** Admin Extended Class uses the shared API-backed list (the route in AdminRoutes renders the same component). */
const ExtendedClass = () => (
    <TeacherExtraClass
        canCreate
        listPath='/admin/class/extended-class'
        addPath='/admin/class/add-extended-class'
        viewPath='/admin/class/extended-class/view'
        editPath='/admin/class/edit-extended-class'
    />
)

export default ExtendedClass
