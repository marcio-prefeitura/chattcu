import {
    Box,
    Button,
    createTheme,
    IconButton,
    InputAdornment,
    TextField,
    ThemeProvider,
    Toolbar,
    Tooltip
} from '@mui/material'
import React, { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import Link from '@mui/material/Link'

import { IFolder } from '../../../shared/interfaces/Folder'
import { ISelectedFiles } from '../../../shared/interfaces/SelectedFiles'
import { IUserInfo } from '../../../hooks/useUserInfo'
import useAlert from '../../../utils/AlertUtils'
import InputFiles from '../../chat-box/InputFiles'
import MessageToast from '../../message-toast/MessageToast'
import SelectBase from '../../select-base/SelectBase'

import './GptStoreSave.scss'

export interface GptStoreSaveProps {
    profile: IUserInfo
}

const GptStoreSave: React.FC<GptStoreSaveProps> = ({ profile }) => {
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        instrucoes: '',
        primeiroQuebraGelo: '',
        segundoQuebraGelo: '',
        terceiroQuebraGelo: '',
        quartoQuebraGelo: ''
    })
    const [errors, setErrors] = useState({
        nome: false,
        descricao: false,
        instrucoes: false,
        primeiroQuebraGelo: false,
        segundoQuebraGelo: false,
        terceiroQuebraGelo: false,
        quartoQuebraGelo: false
    })
    const [selectError, setSelectError] = useState(false)
    const [opcaoSelecionada, setOpcaoSelecionada] = useState('')

    const [filesSelected, setFilesSelected] = useState<ISelectedFiles[]>([])
    const foldersRef = useRef<IFolder[]>([])
    const hasSelectedFiles = filesSelected.find(fS => fS.selected_files.length > 0)
    const [showClearButton, setShowClearButton] = useState(false)
    const [setUpdatedFoldersFromChipsActions] = useState<any[]>([])
    const { alert, handleAlert } = useAlert()
    const pathname = useLocation()
    const router = useNavigate()
    const theme = createTheme({
        components: {
            MuiTextField: {
                defaultProps: {
                    variant: 'outlined',
                    fullWidth: true
                }
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'red'
                        }
                    }
                }
            },
            MuiFormLabel: {
                styleOverrides: {
                    root: {
                        '&.Mui-error': {
                            color: 'red'
                        }
                    }
                }
            }
        }
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setFormData({ ...formData, [name]: value })

        if (value.trim() !== '') {
            setErrors({ ...errors, [name]: false })
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const newErrors = {
            nome: formData.nome.trim() === '',
            descricao: formData.descricao.trim() === '',
            instrucoes: formData.instrucoes.trim() === '',
            primeiroQuebraGelo: formData.primeiroQuebraGelo.trim() === '',
            segundoQuebraGelo: formData.segundoQuebraGelo.trim() === '',
            terceiroQuebraGelo: formData.terceiroQuebraGelo.trim() === '',
            quartoQuebraGelo: formData.quartoQuebraGelo.trim() === ''
        }
        const isSelectInvalid = opcaoSelecionada === ''

        setErrors(newErrors)
        setSelectError(isSelectInvalid)

        const hasErrors = Object.values(newErrors).some(error => error)

        if (hasErrors || isSelectInvalid) {
            console.log('Há erros no formulário!')
            return
        }

        console.log('Dados do formulário:', formData)
        console.log('opcaoSelecionada: ', opcaoSelecionada)

        handleAlert('success', 'Especialista criado com sucesso!')
    }

    const openFileTab = () => (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
            event &&
            event.type === 'keydown' &&
            ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
        ) {
            return
        }

        router(`${pathname.pathname}?tab=files`)
    }
    const handleCleanPrimeiroQuebraGelo = () => {
        setFormData(prevData => ({
            ...prevData,
            primeiroQuebraGelo: ''
        }))
    }
    const handleCleanSegundoQuebraGelo = () => {
        setFormData(prevData => ({
            ...prevData,
            segundoQuebraGelo: ''
        }))
    }
    const handleCleanTerceiroQuebraGelo = () => {
        setFormData(prevData => ({
            ...prevData,
            terceiroQuebraGelo: ''
        }))
    }
    const handleCleanQuartoQuebraGelo = () => {
        setFormData(prevData => ({
            ...prevData,
            quartoQuebraGelo: ''
        }))
    }

    const options = [
        { id: 1, nome: 'Jurisprudência' },
        { id: 2, nome: 'Sistema Casa' },
        { id: 3, nome: 'Normativos do TCU' }
    ]

    return (
        <>
            <Box className='gpt-store-save'>
                <Toolbar />
                <Box className='gpt-store-save__main'>
                    <Box className='gpt-store-save__scroll'>
                        <form
                            onSubmit={handleSubmit}
                            className='gpt-store-save__form'>
                            <Box className='gpt-store-save__logo'>
                                <Link
                                    href='/'
                                    className='logo'>
                                    <div className='logo' />
                                </Link>
                            </Box>
                            <Box className='gpt-store-save__textfields'>
                                <Box className='gpt-store-save__box-text'>
                                    <Box className='gpt-store-save__title'>Nome</Box>
                                    <ThemeProvider theme={theme}>
                                        <TextField
                                            name='nome'
                                            placeholder='Nome'
                                            variant='outlined'
                                            className='gpt-store-save__custom-textfield'
                                            fullWidth
                                            onChange={handleChange}
                                            error={errors.nome}
                                            helperText={errors.nome ? 'Este campo Nome é obrigatório.' : ''}
                                        />
                                    </ThemeProvider>
                                </Box>
                                <Box className='gpt-store-save__box-text'>
                                    <Box className='gpt-store-save__title'>Descrição</Box>
                                    <ThemeProvider theme={theme}>
                                        <TextField
                                            name='descricao'
                                            placeholder='Descrição'
                                            variant='outlined'
                                            className='gpt-store-save__custom-textfield'
                                            fullWidth
                                            onChange={handleChange}
                                            error={errors.descricao}
                                            helperText={errors.descricao ? 'Este campo Descrição é obrigatório.' : ''}
                                        />
                                    </ThemeProvider>
                                </Box>
                                <Box className='gpt-store-save__box-text'>
                                    <Box className='gpt-store-save__title'>Instruções</Box>
                                    <ThemeProvider theme={theme}>
                                        <TextField
                                            name='instrucoes'
                                            placeholder='Instruções'
                                            variant='outlined'
                                            className='gpt-store-save__custom-textfield'
                                            fullWidth
                                            multiline
                                            onChange={handleChange}
                                            rows={2}
                                            inputProps={{
                                                style: { minHeight: '48px', overflow: 'auto' }
                                            }}
                                            error={errors.instrucoes}
                                            helperText={errors.instrucoes ? 'Este campo Instruções é obrigatório.' : ''}
                                        />
                                    </ThemeProvider>
                                </Box>
                            </Box>
                            <Box className='gpt-store-save__quebra-gelo'>
                                <Box className='gpt-store-save__title'>Quebra-gelos</Box>
                                <Box className='gpt-store-save__quebra-gelo-inputs'>
                                    <ThemeProvider theme={theme}>
                                        <TextField
                                            name='primeiroQuebraGelo'
                                            value={formData.primeiroQuebraGelo}
                                            placeholder='Primeiro Quebra-gelo'
                                            variant='outlined'
                                            className='gpt-store-save__custom-textfield'
                                            fullWidth
                                            onChange={handleChange}
                                            error={errors.primeiroQuebraGelo}
                                            helperText={
                                                errors.primeiroQuebraGelo
                                                    ? 'Este campo Primeiro Quebra-gelo é obrigatório.'
                                                    : ''
                                            }
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment
                                                        position='end'
                                                        className='custom-input-adornment'>
                                                        <IconButton
                                                            data-testid='clear-files-1'
                                                            title='Limpar'
                                                            disabled={false}
                                                            onClick={handleCleanPrimeiroQuebraGelo}>
                                                            <span className='icon-x' />
                                                        </IconButton>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                    </ThemeProvider>
                                    <ThemeProvider theme={theme}>
                                        <TextField
                                            name='segundoQuebraGelo'
                                            value={formData.segundoQuebraGelo}
                                            placeholder='Segundo Quebra-gelo'
                                            variant='outlined'
                                            className='gpt-store-save__custom-textfield'
                                            fullWidth
                                            onChange={handleChange}
                                            error={errors.segundoQuebraGelo}
                                            helperText={
                                                errors.segundoQuebraGelo
                                                    ? 'Este campo Segundo Quebra-gelo  é obrigatório.'
                                                    : ''
                                            }
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment
                                                        position='end'
                                                        className='custom-input-adornment'>
                                                        <IconButton
                                                            data-testid='clear-files-2'
                                                            title='Limpar'
                                                            onClick={handleCleanSegundoQuebraGelo}
                                                            disabled={false}>
                                                            <span className='icon-x' />
                                                        </IconButton>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                    </ThemeProvider>
                                    <ThemeProvider theme={theme}>
                                        <TextField
                                            name='terceiroQuebraGelo'
                                            value={formData.terceiroQuebraGelo}
                                            placeholder='Terceiro Quebra-gelo'
                                            variant='outlined'
                                            className='gpt-store-save__custom-textfield'
                                            fullWidth
                                            onChange={handleChange}
                                            error={errors.terceiroQuebraGelo}
                                            helperText={
                                                errors.terceiroQuebraGelo
                                                    ? 'Este campo Terceiro Quebra-gelo  é obrigatório.'
                                                    : ''
                                            }
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment
                                                        position='end'
                                                        className='custom-input-adornment'>
                                                        <IconButton
                                                            data-testid='clear-files-3'
                                                            title='Limpar'
                                                            onClick={handleCleanTerceiroQuebraGelo}
                                                            disabled={false}>
                                                            <span className='icon-x' />
                                                        </IconButton>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                    </ThemeProvider>
                                    <ThemeProvider theme={theme}>
                                        <TextField
                                            name='quartoQuebraGelo'
                                            value={formData.quartoQuebraGelo}
                                            placeholder='Quarto Quebra-gelo'
                                            variant='outlined'
                                            className='gpt-store-save__custom-textfield'
                                            fullWidth
                                            onChange={handleChange}
                                            error={errors.quartoQuebraGelo}
                                            helperText={
                                                errors.quartoQuebraGelo
                                                    ? 'Este campo Quarto Quebra-gelo é obrigatório.'
                                                    : ''
                                            }
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment
                                                        position='end'
                                                        className='custom-input-adornment'>
                                                        <IconButton
                                                            data-testid='clear-files-4'
                                                            title='Limpar'
                                                            onClick={handleCleanQuartoQuebraGelo}
                                                            disabled={false}>
                                                            <span className='icon-x' />
                                                        </IconButton>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                    </ThemeProvider>
                                </Box>
                            </Box>

                            <Box className='grid-container'>
                                <Box className='gpt-store-save__box-text'>
                                    <Box className='grid-item'>
                                        <Box className='gpt-store-save__box-title-subtitle'>
                                            <span className='gpt-store-save__title'>Bases</span>
                                            <span className='gpt-store-save__subtitle'>
                                                Visualize as bases de dados existentes
                                            </span>
                                        </Box>
                                        <SelectBase
                                            bases={options}
                                            opcaoSelecionada={opcaoSelecionada}
                                            setOpcaoSelecionada={setOpcaoSelecionada}
                                            selectError={selectError}
                                        />
                                    </Box>
                                </Box>
                                <Box className='gpt-store-save__box-text'>
                                    <Box className='grid-item'>
                                        <Box className='gpt-store-save__box-title-subtitle'>
                                            <span className='gpt-store-save__title'>Adicionar nova Base</span>
                                            <span className='gpt-store-save__subtitle'>
                                                Carregue um novo arquivo de base de dados para inclusão no sistema
                                            </span>
                                        </Box>
                                        <Box className='gpt-store-save__input-icon'>
                                            <TextField
                                                variant='outlined'
                                                className='gpt-store-save__custom-textfield-base'
                                                placeholder='Carregue um novo arquivo de base'
                                                fullWidth
                                                onChange={handleChange}
                                                InputProps={{
                                                    startAdornment: (
                                                        <Box
                                                            data-testid='input-files'
                                                            sx={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: 1
                                                            }}>
                                                            {hasSelectedFiles ? (
                                                                <InputFiles
                                                                    filesSelected={filesSelected}
                                                                    setFilesSelected={setFilesSelected}
                                                                    foldersRef={foldersRef}
                                                                    showClearButton={showClearButton}
                                                                    setShowClearButton={setShowClearButton}
                                                                    setUpdatedFoldersFromChipsActions={
                                                                        setUpdatedFoldersFromChipsActions
                                                                    }
                                                                    profile={profile}
                                                                />
                                                            ) : (
                                                                <span aria-label='empty' />
                                                            )}
                                                        </Box>
                                                    )
                                                }}
                                            />
                                            <Tooltip
                                                placement='top'
                                                title='Faça upload de arquivos para serem utilizados no chat'>
                                                <IconButton
                                                    className='gpt-store-save__button-upload'
                                                    onClick={openFileTab()}
                                                    data-testid='icon-upload'>
                                                    <span className='icon-upload' />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>

                            <Box className='gpt-store-save__box-button'>
                                <Button
                                    disableElevation
                                    size='medium'
                                    variant='contained'
                                    className='gpt-store-save__criar-button'
                                    onClick={handleSubmit}>
                                    Criar Especialista
                                </Button>
                            </Box>
                        </form>
                    </Box>
                </Box>
            </Box>
            <Box className='new-sidebar__alert'>{alert && <MessageToast {...alert} />}</Box>
        </>
    )
}

export default GptStoreSave
