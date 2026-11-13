export const getFormControlProps = ({ id, hasHint = false, hasError = false, required = false }) => {
    const hintId = `${id}-hint`
    const errorId = `${id}-error`
    const describedBy = [hasHint ? hintId : null, hasError ? errorId : null].filter(Boolean).join(' ')

    return {
        control: {
            id,
            ...(required && { required: true, 'aria-required': true }),
            ...(describedBy && { 'aria-describedby': describedBy }),
            ...(hasError && {
                'aria-invalid': true,
                'aria-errormessage': errorId,
            }),
        },
        label: { htmlFor: id },
        hintId,
        errorId,
    }
}
