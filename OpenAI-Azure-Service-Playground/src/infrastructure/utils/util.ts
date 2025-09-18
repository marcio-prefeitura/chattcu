export const getSidebarTabClassName = (isMobile: boolean, isShow: boolean) => {
    let className = 'new-sidebar'

    if (isMobile) className = ' sidebar-mobile relative'

    if (!isShow) className += ' sidebar-hide'

    return className
}

export const isLocalhost = () => {
    return (process.env.REACT_APP_BACK_ENDPOINT ?? '').toLowerCase().includes('localhost')
}
