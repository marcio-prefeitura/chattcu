import { Box, IconButton, Menu, MenuItem, Typography } from '@mui/material'
import { MoreVertRounded } from '@mui/icons-material'
import If from '../operator/if'

interface AccordeonMenuProps {
    handleClick: (event: React.MouseEvent<HTMLElement>) => void
    anchorEl: any
    chatCounter: number
    handleClose: (event: React.MouseEvent<HTMLElement>) => void
    onClickDeleteAll: () => void
    titleDeleteAll: string
}

const AccordionMenu: React.FC<AccordeonMenuProps> = ({
    handleClick,
    anchorEl,
    chatCounter,
    handleClose,
    onClickDeleteAll,
    titleDeleteAll
}) => {
    return (
        <Box>
            <IconButton
                onClick={handleClick}
                size='small'>
                <MoreVertRounded className='opcoes-enviadas-recebidas' />
            </IconButton>
            <If test={chatCounter > 0}>
                <Menu
                    className='sidebar__menu'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}>
                    <MenuItem onClick={handleClose}>
                        <Box
                            className='sidebar__item-teste'
                            data-testid='item-teste-button'
                            color='secondary'
                            onClick={onClickDeleteAll}>
                            <span className='icon-unarchive' />
                            <Typography className='sidebar__texto'>{titleDeleteAll}</Typography>
                        </Box>
                    </MenuItem>
                </Menu>
            </If>
        </Box>
    )
}

export default AccordionMenu
