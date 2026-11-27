import TeacherExtraClass from '../../Teacher/ExtraClass/ExtraClass'

/** Same list + API hydrate as Teacher; coordinator paths; no create CTA. */
const ExtraClass = () => (
    <TeacherExtraClass
        canCreate={false}
        listPath='/coordinator/class/extra-class'
        addPath='/coordinator/class/extra-class/add'
        viewPath='/coordinator/class/extra-class/view'
        editPath='/coordinator/class/extra-class/edit'
    />
)

export default ExtraClass
