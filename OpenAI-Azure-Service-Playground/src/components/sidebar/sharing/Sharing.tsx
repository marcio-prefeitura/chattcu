import { useContext, useEffect, useRef, useState } from 'react'

import { useQuery, useMutation } from '@tanstack/react-query'
import { Box } from '@mui/material'

import { ISharedChat } from '../../../infrastructure/utils/types'
import { InTeamsContext } from '../../../context/AppContext'
import { IUserInfo } from '../../../hooks/useUserInfo'
import { getAllSharedChats, deleteAllSharingChats, deleteSharingChat } from '../../../infrastructure/api'
import useAlert from '../../../utils/AlertUtils'
import { filterSharedChats } from '../../../utils/FilterUtils'
import DialogGeneric from '../../dialog-generic/DialogGeneric'
import FilterField from '../../filter-field/FilterField'
import MessageToast from '../../message-toast/MessageToast'
import SharingAccordion from './SharingAccordion'

import './Sharing.scss'

interface SharingProps {
    onSharedChatSelect: (sharedChat: ISharedChat) => void
    profile?: IUserInfo
}

const Sharing: React.FC<SharingProps> = ({ onSharedChatSelect, profile }) => {
    const inTeams = useContext(InTeamsContext)
    const [query, setQuery] = useState<string>('')

    const [openDeleteFixedModal, setOpenDeleteFixedModal] = useState(false)
    const [openDeleteSentModal, setOpenDeleteSentModal] = useState(false)

    const selectedShared = useRef<string | null>(null)

    const { alert, handleAlert } = useAlert()

    const shouldRefresh = useRef<boolean>()

    shouldRefresh.current = true

    const querySent = useQuery(['sharingSent'], getAllSharedChats, {
        onError: () => {
            console.error('Erro ao carregar chats enviados')
        },
        onSuccess: () => {
            console.log('Chats enviados carregados com sucesso')
        },
        staleTime: 1000 * 60 * 5, // 5 min
        cacheTime: 1000 * 60 * 5,
        refetchOnWindowFocus: true
    })

    const deleteAllMutation = useMutation(deleteAllSharingChats, {
        onSuccess: data => {
            handleAlert('success', data.mensagem)
            querySent.refetch()
        },
        onError: () => {
            handleAlert('error', 'Erro ao deletar todos os chats enviados')
        }
    })

    const deleteOneMutation = useMutation(deleteSharingChat, {
        onSuccess: data => {
            handleAlert('success', data.mensagem)
            querySent.refetch()
        },
        onError: () => {
            handleAlert('error', 'Erro ao deletar chat enviado')
        }
    })

    const handleShowDeleteFixedModal = () => {
        setOpenDeleteFixedModal(true)
    }

    const handleHideDeleteFixedModal = () => {
        setOpenDeleteFixedModal(false)
    }

    const handleShowDeleteSentModal = (item: ISharedChat) => {
        selectedShared.current = item.id
        setOpenDeleteSentModal(true)
    }

    const handleHideDeleteSentModal = () => {
        selectedShared.current = null
        setOpenDeleteSentModal(false)
    }

    const handleClearAllSentConversations = async () => {
        await deleteAllMutation.mutateAsync()
        setOpenDeleteFixedModal(false)
    }

    const handleDeleteSentConfirm = async () => {
        if (selectedShared.current) {
            await deleteOneMutation.mutateAsync(selectedShared.current)
            setOpenDeleteSentModal(false)
            selectedShared.current = null
        }
    }

    // Estou usando este eFFect para atualizar a lista de compartilhados quando trocar de tab
    useEffect(() => {
        if (shouldRefresh.current) {
            querySent.refetch()

            shouldRefresh.current = false
        }
    }, [querySent])

    const filteredSentChats = filterSharedChats(querySent.data, query)

    return (
        <Box className='sharing'>
            {/* <Box className='newsidebar__filtro-compartilhadas'>
                <FilterField
                    query={query}
                    title=''
                    onFilterChange={setQuery}
                    placeholder='Filtrar compartilhados'
                    icon_position='start'
                />
            </Box> */}
            <Box className={`sidebar__container  sharing__container ${inTeams ? 'sharing__container__teams' : ''}`}>
                <Box className='sharing__main'>
                    <FilterField
                        query={query}
                        title=''
                        onFilterChange={setQuery}
                        placeholder='Filtrar compartilhados'
                        icon_position='start'
                    />
                    <SharingAccordion
                        title='Chats compartilhados'
                        chats={filteredSentChats}
                        isLoading={querySent.isLoading}
                        isError={querySent.isError}
                        onClickDeleteAll={handleShowDeleteFixedModal}
                        onDeleteItem={handleShowDeleteSentModal}
                        onRefresh={querySent.refetch}
                        onChatClick={onSharedChatSelect}
                        profile={profile}
                    />
                </Box>
            </Box>
            <DialogGeneric
                open={openDeleteFixedModal}
                onClose={handleHideDeleteFixedModal}
                titulo='Revogar todos os Links compartilhados'
                conteudo='Tem certeza que deseja revogar todos os links compartilhados?'
                icone='icon-trash'
                onCancel={handleHideDeleteFixedModal}
                onConfirm={handleClearAllSentConversations}
                cancelText='Cancelar'
                confirmText='Confirmar'
            />
            <DialogGeneric
                open={openDeleteSentModal}
                onClose={handleHideDeleteSentModal}
                titulo='Revogar Link compartilhado'
                conteudo='Tem certeza que deseja revogar o link compartilhado?'
                icone='icon-trash'
                onCancel={handleHideDeleteSentModal}
                onConfirm={handleDeleteSentConfirm}
                cancelText='Cancelar'
                confirmText='Confirmar'
            />

            {alert && <MessageToast {...alert} />}
        </Box>
    )
}

export default Sharing
