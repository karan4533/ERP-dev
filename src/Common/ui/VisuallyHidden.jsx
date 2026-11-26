import { VISUALLY_HIDDEN_STYLE } from './accessibility'

const VisuallyHidden = ({ as: Component = 'span', children, ...props }) => (
    <Component style={VISUALLY_HIDDEN_STYLE} {...props}>
        {children}
    </Component>
)

export default VisuallyHidden
