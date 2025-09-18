import React from 'react'

import { Box, Button, Tooltip } from '@mui/material'

import { ContentType } from '../../../shared/types/content-type'
import { LabelSwitcher } from '../../../shared/types/label-switcher'

import './SidebarSwitcher.scss'

interface ISidebarSwitcherItem {
    label: LabelSwitcher
    contentType: ContentType
    icon: React.ReactNode
    className: string
    onContentTypeChange: (contentType: ContentType) => void
    isExpanded?: boolean
}

const SidebarSwitcherItem: React.FC<ISidebarSwitcherItem> = ({
    className,
    label,
    contentType,
    icon,
    onContentTypeChange,
    isExpanded = true
}) => {
    return (
        <Tooltip
            title={!isExpanded ? label : ''}
            placement='right-start'
            arrow>
            <Box className='new-sidebar-switcher__button'>
                <Button
                    disableElevation
                    fullWidth
                    className={`${className} sidebar-button`}
                    color='primary'
                    size='medium'
                    variant='text'
                    onClick={() => onContentTypeChange(contentType)}>
                    {icon}
                    {isExpanded && <span className='sidebar-label'>{label}</span>}
                </Button>
            </Box>
        </Tooltip>
    )
}

export default SidebarSwitcherItem
