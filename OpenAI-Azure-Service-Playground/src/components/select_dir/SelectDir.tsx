import {
    Box,
    FormControl,
    IconButton,
    Tooltip,
    Select,
    MenuItem,
    InputAdornment,
    SelectChangeEvent
} from '@mui/material'
import React from 'react'
import { v4 as uuidv4 } from 'uuid'

import { IUserInfo } from '../../hooks/useUserInfo'

type SelectDirProps = {
    folders: any[]
    opcaoSelecionada: string
    setOpcaoSelecionada: React.Dispatch<React.SetStateAction<string>>
    profile?: IUserInfo
    handleFolderField: () => void // Adicione esta prop
}

const SelectDir: React.FC<SelectDirProps> = ({
    folders,
    opcaoSelecionada,
    setOpcaoSelecionada,
    profile,
    handleFolderField
}) => {
    const handleSelecaoChange = (event: SelectChangeEvent<string>) => {
        setOpcaoSelecionada(event.target.value)
    }

    return (
        <Box
            display='flex'
            alignItems='center'>
            <FormControl fullWidth>
                <Select
                    className={`${profile?.perfilDev ? 'select-dir-new' : 'select-dir'}`}
                    value={opcaoSelecionada}
                    onChange={handleSelecaoChange}
                    displayEmpty
                    size='small'
                    inputProps={{ 'aria-label': 'Without label' }}
                    style={{ fontSize: '.8rem' }}
                    endAdornment={
                        <InputAdornment position='end'>
                            <Box
                                sx={{
                                    borderLeft: '1px solid #ccc',
                                    height: '40px',
                                    marginRight: '2px'
                                }}
                            />

                            <Tooltip
                                title='Nova pasta'
                                arrow>
                                <IconButton
                                    aria-label='Nova pasta'
                                    data-testid='save-folder'
                                    onClick={handleFolderField}>
                                    <span className='icon-folder-plus' />
                                </IconButton>
                            </Tooltip>
                        </InputAdornment>
                    }>
                    {folders.map(folder => (
                        <MenuItem
                            className='ola select-dir-item'
                            key={`select-${uuidv4()}`}
                            value={folder.id}
                            style={{ fontSize: '.8rem' }}>
                            {folder.nome}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    )
}

export default SelectDir
