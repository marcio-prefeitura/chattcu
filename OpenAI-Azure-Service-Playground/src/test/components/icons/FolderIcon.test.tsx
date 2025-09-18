import React from 'react'
import { render } from '@testing-library/react'
import FolderIcon from '../../../components/icons/FolderIcon'

describe('FolderIcon', () => {
    // Teste para verificar se o componente renderiza corretamente
    it('deve renderizar corretamente', () => {
        const { container } = render(<FolderIcon />)
        expect(container.querySelector('.folder')).toBeInTheDocument()
    })

    // Teste para verificar se a classe CSS é aplicada corretamente no elemento Box
    it('deve aplicar a classe CSS "folder" no elemento Box', () => {
        const { container } = render(<FolderIcon />)
        const boxElement = container.querySelector('.folder')
        expect(boxElement).toBeInTheDocument()
    })

    // Teste para verificar se o ícone correto é renderizado
    it('deve renderizar o ícone "folder_open" dentro do Box', () => {
        const { getByText } = render(<FolderIcon />)
        const iconElement = getByText('folder_open')
        expect(iconElement).toBeInTheDocument()
        expect(iconElement).toHaveClass('material-symbols-rounded')
    })
})
