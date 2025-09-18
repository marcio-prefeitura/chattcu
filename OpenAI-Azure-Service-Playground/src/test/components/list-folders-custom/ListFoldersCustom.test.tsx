import ListFoldersCustom from '../../../components/sidebar/list-folders-custom/ListFoldersCustom'
import { IFolder } from '../../../shared/interfaces/Folder'
import { fireEvent, render, screen } from '@testing-library/react'

export const mockfilteredFolder: IFolder[] = [
    {
        id: '1',
        nome: 'Folder 1',
        usuario: 'teste',
        id_pasta_pai: '-1',
        data_criacao: null,
        st_removido: false,
        tamanho: '250MB',
        selected: true,
        st_arquivo: false,
        status: 'PRONTO',
        tipo_midia: 'PDF',
        nome_blob: 'sdasdfas153asdf151sdf',
        open: false,
        show: true,
        arquivos: [
            {
                id: '1',
                usuario: 'teste',
                id_pasta_pai: '1',
                nome: 'File 1',
                st_removido: false,
                data_criacao: null,
                st_arquivo: true,
                tamanho: 250,
                tipo_midia: 'PDF',
                nome_blob: 'sdasdfas153asdf151sdf',
                status: 'PRONTO',
                selected: false,
                progress: 50,
                show: true
            }
        ]
    }
]

const mockProps = {
    isFiltrando: false,
    filteredFolder: mockfilteredFolder,
    onSelectFile: jest.fn(),
    onSelectFolder: jest.fn(),
    handleEditFolder: jest.fn(),
    handleDeleteFolder: jest.fn(),
    handleDeleteFiles: jest.fn(),
    handleDownloadFolder: jest.fn(),
    handleEditFile: jest.fn(),
    handleDeleteFile: jest.fn(),
    handleDownloadFile: jest.fn(),
    onToggleFolder: jest.fn(),
    handleCopiedFile: jest.fn(),
    handleMovedFile: jest.fn(),
    handleMovedFileBulk: jest.fn()
}

describe('<ListFoldersCustom />', () => {
    it('Deve renderizar componente com sucesso', () => {
        const { container } = render(<ListFoldersCustom {...mockProps} />)
        expect(container.firstChild).toHaveClass('list-folder')
    })

    it('Validacao de abrir pasta de arquivos', () => {
        render(<ListFoldersCustom {...mockProps} />)
        const buttonRight = screen.getByTestId('icon-chevron-right-1')
        fireEvent.click(buttonRight)
        const buttonDown = screen.getByTestId('down')
        expect(buttonDown).toBeInTheDocument()
    })

    it('Validacao de selecionar todos arquivos', () => {
        render(<ListFoldersCustom {...mockProps} />)
        const buttonCheck = screen.getByRole('checkbox')
        fireEvent.click(buttonCheck)
        const buttonRight = screen.getByTestId('icon-chevron-right-1')
        fireEvent.click(buttonRight)
        expect(buttonCheck).toBeChecked()
    })
})
