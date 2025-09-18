import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SharingAccordion from '../../../../components/sidebar/sharing/SharingAccordion'
import { ISharedChat } from '../../../../infrastructure/utils/types'

// Mocks corrigidos
jest.mock('react-router-dom', () => ({
    useParams: () => ({ share_id: '1' })
}))

jest.mock('../../../../utils/AlertUtils', () => ({
    __esModule: true,
    default: () => () => ({ alert: null, handleAlert: jest.fn() })
}))

jest.mock('moment', () => ({
    utc: () => ({
        tz: () => ({
            format: () => '01/01/2023 - 12h00'
        })
    })
}))

// Mock para MaterialUI components
jest.mock('@mui/material', () => ({
    Accordion: ({ children, ...props }) => <div {...props}>{children}</div>,
    AccordionSummary: ({ children, ...props }) => <div {...props}>{children}</div>,
    AccordionDetails: ({ children }) => <div>{children}</div>,
    Box: ({ children }) => <div>{children}</div>,
    IconButton: ({ children, ...props }) => <button {...props}>{children}</button>,
    List: ({ children }) => <ul>{children}</ul>,
    ListItemButton: ({ children, ...props }) => <li {...props}>{children}</li>,
    Menu: ({ children, open }) => (open ? <div>{children}</div> : null),
    MenuItem: ({ children }) => <div>{children}</div>,
    Tooltip: ({ children }) => <>{children}</>,
    Typography: ({ children }) => <span>{children}</span>
}))

const mockChats: ISharedChat[] = [
    {
        id: '1',
        chat: { id: 'chat1', titulo: 'Chat 1', mensagens: [], isLoading: false },
        data_compartilhamento: new Date('2023-01-01T12:00:00'),
        usuario: 'User1',
        st_removido: false,
        arquivos: [],
        destinatarios: []
    }
]

const defaultProps = {
    title: 'Test Accordion',
    chats: mockChats,
    isLoading: false,
    isError: false,
    onClickDeleteAll: jest.fn(),
    onDeleteItem: jest.fn(),
    onRefresh: jest.fn(),
    onChatClick: jest.fn()
}

describe('SharingAccordion', () => {
    it('renderiza o componente com chats', () => {
        render(<SharingAccordion {...defaultProps} />)
        expect(screen.getByText('Test Accordion')).toBeInTheDocument()
        expect(screen.getByText('Chat 1')).toBeInTheDocument()
    })

    it('chama onChatClick quando um chat é clicado', () => {
        render(<SharingAccordion {...defaultProps} />)
        fireEvent.click(screen.getByText('Chat 1'))
        expect(defaultProps.onChatClick).toHaveBeenCalledWith(mockChats[0])
    })

    it('abre o menu e mostra a opção de revogar links', () => {
        render(<SharingAccordion {...defaultProps} />)
        const menuButton = screen.getAllByRole('button')[0]
        fireEvent.click(menuButton)
        expect(screen.getByText('Revogar todos os Links')).toBeInTheDocument()
    })
})
