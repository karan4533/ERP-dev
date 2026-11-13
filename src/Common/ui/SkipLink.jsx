import { getSkipLinkProps } from './accessibility'

const SkipLink = ({ targetId = 'main-content', children = 'Skip to main content' }) => {
    const { href } = getSkipLinkProps(targetId)

    return (
        <a className='ui-skip-link' href={href}>
            {children}
        </a>
    )
}

export default SkipLink
