import { cloneElement, isValidElement, useId } from 'react'
import { getFormControlProps } from './formControl'

const FormField = ({
    id,
    label,
    hint,
    error,
    required = false,
    children,
    className = '',
}) => {
    const generatedId = useId().replace(/:/g, '')
    const controlId = id || children?.props?.id || `field-${generatedId}`
    const props = getFormControlProps({
        id: controlId,
        hasHint: Boolean(hint),
        hasError: Boolean(error),
        required,
    })
    const control = isValidElement(children)
        ? cloneElement(children, {
            ...props.control,
            ...children.props,
            id: children.props.id || props.control.id,
            'aria-describedby': props.control['aria-describedby'],
            'aria-invalid': props.control['aria-invalid'],
            'aria-errormessage': props.control['aria-errormessage'],
            required: props.control.required,
            'aria-required': props.control['aria-required'],
        })
        : children

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label {...props.label} className='text-sm font-medium text-[var(--erp-ink)]'>
                {label}
                {required && <span className='ml-1 text-[var(--erp-red)]' aria-hidden='true'>*</span>}
                {required && <span className='sr-only'> required</span>}
            </label>
            {control}
            {hint && <p id={props.hintId} className='text-xs text-[var(--erp-muted)]'>{hint}</p>}
            {error && <p id={props.errorId} role='alert' className='text-xs font-medium text-[var(--erp-red)]'>{error}</p>}
        </div>
    )
}

export default FormField
