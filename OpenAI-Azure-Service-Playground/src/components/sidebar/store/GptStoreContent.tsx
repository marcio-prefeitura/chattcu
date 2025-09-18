import React, { useEffect, useState } from 'react'

import { Box, Button, IconButton, Tab, Toolbar, Tooltip, Typography } from '@mui/material'
import { useInfiniteQuery } from '@tanstack/react-query'
import Tabs from '@mui/material/Tabs'

import { FilterEspecialistas } from '../../../infrastructure/utils/types'
import { Categoria } from '../../../shared/interfaces/Store'
import { IUserInfo } from '../../../hooks/useUserInfo'
import { listCategorias, listEspecialistasPaginado, listTotaisEspecialistasPorTipo } from '../../../infrastructure/api'
import FilterField from '../../filter-field/FilterField'
import If from '../../operator/if'
import GptStoreSave from './GptStoreSave'

import './GptStore.scss'

interface IGptStoreContent {
    profile: IUserInfo
    isShow: boolean
    isMobile: boolean
    redirectForm: boolean
    setRedirectForm: any
}

const GptStoreContent: React.FC<IGptStoreContent> = ({ profile, redirectForm, setRedirectForm }) => {
    const [query, setQuery] = useState<string>('')
    const [value, setValue] = useState(0)
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [totaisPorCategoria, setTotaisPorCategoria] = useState<{ [key: string]: number }>({
        'Meus Especialistas': 0
    })
    const [bodyTabs, setBodyTabs] = useState<string[]>(['Meus Especialistas'])
    const [selectedCategory, setSelectedCategory] = useState<string>('Meus Especialistas')
    const [filters, setFilters] = useState<FilterEspecialistas>({
        per_page: 6,
        page: 1,
        categoria: ''
    })

    const [especialistasPorTipo, setEspecialistasPorTipo] = useState<{ [key: string]: any[] }>({
        'Meus Especialistas': []
    })

    const redirectFormSave = () => {
        setRedirectForm(true)
    }

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue)
    }

    const carregarListasIniciais = async () => {
        const categorias = await listCategorias()
        const totais = await listTotaisEspecialistasPorTipo()
        setCategorias(categorias)
        setTotaisPorCategoria(
            totais.reduce((map, item) => {
                map[item.categoria] = item.total ?? 0
                return map
            }, {} as { [key: string]: number })
        )
    }

    const handleTabClick = (tabName: string) => {
        setSelectedCategory(tabName)
        if (!bodyTabs.includes(tabName)) {
            setBodyTabs(prev => [...prev, tabName])
            setEspecialistasPorTipo(prevState => ({
                ...prevState,
                [tabName]: []
            }))
        }
        setFilters(prevFilters => ({ ...prevFilters, categoria: tabName }))
    }

    const fetchEspecialistas =
        (categoria: string) =>
        async ({ pageParam = 1 }) => {
            return await listEspecialistasPaginado({ ...filters, page: pageParam, categoria: categoria })
        }

    const {
        data: especialistasData,
        fetchNextPage: fetchNextPage,
        hasNextPage: hasNextPage,
        isLoading: isLoading
    } = useInfiniteQuery(['especialistas', filters, selectedCategory], fetchEspecialistas(selectedCategory), {
        getNextPageParam: (lastPage, pages) => {
            const total = lastPage.total
            const loadedEspecialistas = pages.flatMap(page => page.especialistas)
            return loadedEspecialistas.length < total ? pages.length + 1 : false
        }
    })

    useEffect(() => {
        carregarListasIniciais()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (especialistasData) {
            const especialistas = especialistasData.pages.flatMap(page => page.especialistas)
            if (especialistas.length > 0) {
                const categoria = especialistas[0].categoria.nome || ''
                if (selectedCategory === 'Meus Especialistas') {
                    setEspecialistasPorTipo(prevState => ({
                        ...prevState,
                        'Meus Especialistas': especialistas
                    }))
                } else {
                    setEspecialistasPorTipo(prevState => ({
                        ...prevState,
                        [categoria]: especialistas
                    }))
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [especialistasData])

    return redirectForm ? (
        <GptStoreSave profile={profile} />
    ) : (
        <Box className='gpt-store-content'>
            <Toolbar />
            <Box className='gpt-store-content__scroll'>
                <Box className='gpt-store-content__main'>
                    <Box className='gpt-store-content__header'>
                        <Typography
                            variant='h5'
                            align='center'>
                            Especialistas
                        </Typography>
                        <Typography
                            variant='subtitle1'
                            color='textSecondary'
                            align='center'>
                            Explore e desenvolva versões customizadas do ChatTCU que integram diretrizes, conhecimentos
                            adicionais e uma variedade de habilidades
                        </Typography>
                    </Box>

                    <Box className='gpt-store-content__search'>
                        <div className='gpt-store-filter'>
                            <FilterField
                                query={query}
                                title=''
                                onFilterChange={setQuery}
                                placeholder='Buscar Especialistas'
                                icon_position='start'
                            />
                        </div>
                        <Button
                            disableElevation
                            variant='contained'
                            className='gpt-store-content__criar-button'
                            onClick={redirectFormSave}>
                            <div className='icon-plus' />
                            Criar Especialista
                        </Button>
                    </Box>
                    <If test={categorias.length > 0}>
                        <Box className='gpt-store-content__tabs'>
                            <Tabs
                                value={value}
                                onChange={handleChange}
                                variant='scrollable'
                                scrollButtons
                                aria-label='visible arrows tabs example'
                                className='gpt-store-content__tabs-chevron'>
                                {categorias.map((categoria, index) => (
                                    <Tab
                                        data-testid={`${categoria.nome}-tab`}
                                        key={categoria.nome}
                                        label={
                                            <Box
                                                display='flex'
                                                alignItems='center'
                                                gap={1}>
                                                {categoria.nome}
                                                {value === index ? (
                                                    <IconButton
                                                        aria-label=''
                                                        className='gpt-store-content__selecionado'>
                                                        {totaisPorCategoria[categoria.nome] ?? 0}
                                                    </IconButton>
                                                ) : (
                                                    <IconButton
                                                        aria-label=''
                                                        className='gpt-store-content__sem-selecionado'>
                                                        {totaisPorCategoria[categoria.nome] ?? 0}
                                                    </IconButton>
                                                )}
                                            </Box>
                                        }
                                        className={`gpt-store-content__tabs-item ${
                                            value === index ? 'selected-tab' : ''
                                        }`}
                                        onClick={() => handleTabClick(categoria.nome)}
                                    />
                                ))}
                            </Tabs>
                        </Box>
                    </If>
                    <If test={!isLoading && categorias.length > 0}>
                        <Box className='gpt-store-content__indicator'>
                            <Typography
                                variant='h6'
                                className='gpt-store-content__title'>
                                {selectedCategory}
                            </Typography>
                            <Box className='gpt-store-content__grid'>
                                {especialistasPorTipo[selectedCategory].length === 0 ? (
                                    <Box className='new-file-upload__nenhum-arquivo'>
                                        <span className='icon-alert-triangle' />
                                        <p>Nenhum Resultado Encontrado</p>
                                    </Box>
                                ) : (
                                    especialistasPorTipo[selectedCategory].map((especialista, index) => (
                                        <Box
                                            key={especialista.valueAgente + '-' + index}
                                            className='gpt-store-content__store-card'>
                                            <Box className='gpt-store-content__card-content'>
                                                <Box className='gpt-store-content__icon'>
                                                    <span
                                                        className={`${especialista.icon}`}
                                                        style={{ fontSize: 20 }}
                                                    />
                                                </Box>
                                                <Box className='text'>
                                                    <Typography
                                                        className='title'
                                                        variant='body2'>
                                                        {especialista.labelAgente}
                                                    </Typography>
                                                    <Tooltip title={especialista.descricao}>
                                                        <Typography
                                                            className='subtitle'
                                                            variant='body2'
                                                            color='textSecondary'>
                                                            {especialista.descricao}
                                                        </Typography>
                                                    </Tooltip>
                                                    <Typography
                                                        className='icon'
                                                        variant='caption'>
                                                        <div className='icon-user' />
                                                        {especialista.autor}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Box>
                            {hasNextPage && selectedCategory === selectedCategory && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                    <Button
                                        sx={{ textTransform: 'none', fontSize: '12px' }}
                                        variant='outlined'
                                        className='gpt-store-content__ver-mais'
                                        onClick={() => fetchNextPage()}>
                                        Ver mais
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </If>
                </Box>
            </Box>
        </Box>
    )
}

export default GptStoreContent
