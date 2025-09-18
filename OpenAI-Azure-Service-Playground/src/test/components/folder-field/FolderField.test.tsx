import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FolderField from '../../../components/folder-field/FolderField'

describe('FolderField', () => {
    const onSaveFolder = jest.fn()
    const setSelectedFolder = jest.fn()
    const setTrasitionFolderField = jest.fn()
    const setDesabledUpload = jest.fn()

    beforeEach(() => {
        render(
            <FolderField
                onSaveFolder={onSaveFolder}
                setSelectedFolder={setSelectedFolder}
                setTrasitionFolderField={setTrasitionFolderField}
                setDesabledUpload={setDesabledUpload}
            />
        )
    })

    it('limpa o campo de entrada após salvar a pasta', async () => {
        const folderName = 'Nova Pasta'
        const inputField = screen.getByPlaceholderText('Criar pasta')
        fireEvent.change(inputField, { target: { value: folderName } })

        fireEvent.keyDown(inputField, { key: 'Enter', code: 'Enter' })

        await waitFor(() => {
            expect(inputField).toHaveValue('')
        })

        expect(onSaveFolder).toHaveBeenCalledWith(folderName)
    })
    it('ativa o botão de salvar quando o nome da pasta é válido (<= 25 caracteres)', async () => {
        const folderName = 'Pasta Válida'
        const inputField = screen.getByPlaceholderText('Criar pasta')

        fireEvent.change(inputField, { target: { value: folderName } })

        const saveButton = screen.getByTitle('Salvar')
        expect(saveButton).not.toBeDisabled()

        expect(screen.queryByText('Máximo permitido de 40 caracteres.')).not.toBeInTheDocument()
    })

    it('desativa o botão de salvar e mostra erro quando o nome da pasta é maior que 40 caracteres', async () => {
        const folderName = ''
        const inputField = screen.getByPlaceholderText('Criar pasta')

        fireEvent.change(inputField, { target: { value: folderName } })

        const saveButton = screen.getByTitle('Salvar')
        expect(saveButton).toBeDisabled()
    })
})
