import React, { useRef, useState } from 'react'

import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material'
import { Box } from '@mui/system'
// import SaveIcon from '@mui/icons-material/Save'

import './FolderField.scss'

type FolderFieldProps = {
    onSaveFolder: (folderName: string) => void
    setSelectedFolder: React.Dispatch<React.SetStateAction<string>>
    setTrasitionFolderField: React.Dispatch<React.SetStateAction<boolean>>
    setDesabledUpload: React.Dispatch<React.SetStateAction<boolean>>
}
const MAX_TITLE_LENGTH = 40

const FolderField: React.FC<FolderFieldProps> = ({ onSaveFolder, setTrasitionFolderField, setDesabledUpload }) => {
    const [nome, setNome] = useState<string>('')
    const inputRef = useRef<HTMLInputElement>(null)

    const onChangeNome = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNome(event.target.value)
    }

    const handleSaveFolder = () => {
        onSaveFolder(nome)
        setNome('')
        if (inputRef.current) {
            inputRef.current.blur()
        }
        handleFolderReturn()
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' && isFolderNameValid(nome)) {
            handleSaveFolder()
        }
    }

    const isFolderNameValid = (name: string): string | null => {
        if (name.length > MAX_TITLE_LENGTH) {
            return null
        } else {
            return name.trim()
        }
    }
    const handleFolderReturn = () => {
        setTrasitionFolderField(false)
        setDesabledUpload(false)
    }

    return (
        <Box
            className='folder-field'
            data-testid='folder-field-component'>
            <TextField
                fullWidth
                id='outlined-basic'
                placeholder='Criar pasta'
                variant='outlined'
                size='small'
                value={nome}
                onChange={onChangeNome}
                onKeyDown={handleKeyDown}
                inputRef={inputRef}
                inputProps={{
                    maxLength: MAX_TITLE_LENGTH
                }}
                InputProps={{
                    endAdornment: (
                        <>
                            {/* <InputAdornment position='end'>
                                <Tooltip
                                    title='Criar pasta'
                                    arrow>
                                    <IconButton
                                        className={`folder-field__button-save ${
                                            isFolderNameValid(nome) ? 'icon-button-enabled' : 'icon-button-disabled'
                                        }`}
                                        title='Salvar'
                                        aria-label='Criar pasta'
                                        data-testid='button-save-folder'
                                        disabled={!isFolderNameValid(nome)}
                                        onClick={handleSaveFolder}>
                                        <span className='icon-save' />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment> */}
                            <InputAdornment
                                position='end'
                                className='custom-input-adornment'>
                                <Tooltip
                                    title='Criar pasta'
                                    arrow>
                                    <IconButton
                                        size='small'
                                        className={`folder-field__button-save ${
                                            isFolderNameValid(nome) ? 'icon-button-enabled' : 'icon-button-disabled'
                                        }`}
                                        title='Salvar'
                                        aria-label='Criar pasta'
                                        data-testid='button-save-folder'
                                        disabled={!isFolderNameValid(nome)}
                                        onClick={handleSaveFolder}>
                                        <span className='icon-save' />
                                    </IconButton>
                                </Tooltip>
                                <IconButton
                                    size='small'
                                    data-testid='clear-files-2'
                                    title='Limpar'
                                    onClick={handleFolderReturn}
                                    disabled={false}>
                                    <span className='icon-x' />
                                </IconButton>
                            </InputAdornment>
                        </>
                    ),
                    className: nome.length === MAX_TITLE_LENGTH ? 'input-field-error' : ''
                }}
                error={nome.length === MAX_TITLE_LENGTH}
                helperText={
                    nome.length === MAX_TITLE_LENGTH ? `Máximo permitido de ${MAX_TITLE_LENGTH} caracteres.` : ''
                }
                FormHelperTextProps={{
                    className: nome.length === MAX_TITLE_LENGTH ? 'folder-field__helper-text-error' : ''
                }}
            />
        </Box>
    )
}

export default FolderField
