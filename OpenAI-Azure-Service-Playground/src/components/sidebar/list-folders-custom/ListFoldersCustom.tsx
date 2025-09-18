import React, { useEffect, useState } from 'react'

import { Box, Checkbox, CircularProgress } from '@mui/material'
import Collapse from '@mui/material/Collapse'
// import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Tooltip from '@mui/material/Tooltip'

import { IFile, IFolder } from '../../../shared/interfaces/Folder'
import { getMidiaByExtensao } from '../../../utils/enum/MidiasAceitasEnum'
import { IUserInfo } from '../../../hooks/useUserInfo'
import { isNullOrUndefined, transformArrayStringToArray } from '../../../utils/AlertUtils'
import { CircularProgressWithLabel } from '../../circularprogress-with-label/CircularProgressWithLabel'
import FileActionsMenu from '../../file-actions-menu/FileActionsMenu'
import FolderActionsMenu from '../../folder-actions-menu/FolderActionsMenu'
import If from '../../operator/if'

import './ListFoldersCustom.scss'

interface ListFoldersCustomProps {
    filteredFolder: IFolder[]
    onSelectFolder: (folder: any) => void
    handleDeleteFolder: (folderId: string) => void
    handleEditFolder: (folder: IFolder) => Promise<boolean>
    handleDownloadFolder: (folderId: string) => Promise<void>
    handleDeleteFiles: (folder: any) => void
    handleCopiedFile: (file: IFile[], oldFolderUpdated: IFolder, mensagem: string) => void
    handleMovedFileBulk: (files: any[], selectedFolder: string, oldFolderUpdated: IFolder, mensagem: string) => void
    handleEditFile: (file: IFile) => Promise<boolean>
    handleDeleteFile: (folder: any, fileId: string) => void
    handleDownloadFile: (fileId: string) => Promise<void>
    handleMovedFile: (file: any, oldFile: any, mensagem: string) => void
    onSelectFile: (folder: IFolder, fileId: string, checked: boolean) => void
    profile?: IUserInfo
}
const ListFoldersCustom: React.FC<ListFoldersCustomProps> = props => {
    const {
        filteredFolder,
        onSelectFile,
        onSelectFolder,
        handleDeleteFiles,
        handleDeleteFolder,
        handleEditFolder,
        handleDownloadFolder,
        handleCopiedFile,
        handleMovedFileBulk,
        handleEditFile,
        handleDeleteFile,
        handleDownloadFile,
        handleMovedFile,
        profile
    } = props
    const activeItens: string[] = []

    const [activeFilter, setActiveFilter] = useState<string[]>(activeItens)

    const handleClick = idx => {
        const activeItens = toggleElement(activeFilter, idx)
        setActiveFilter(isNullOrUndefined(activeItens) ? [] : activeItens)
    }

    const openFolderSelected = () => {
        const indexFolder = filteredFolder.filter(folder => folder.open)

        if (indexFolder) {
            setActiveFilter(indexFolder.map(f => f.id))
        }
    }

    useEffect(() => {
        openFolderSelected()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredFolder])

    const toggleElement = (list: any, value: any): any[] => {
        if (isNullOrUndefined(list)) {
            return [value]
        }

        if (!Array.isArray(list)) {
            list = transformArrayStringToArray(list)
        }

        const index = list.indexOf(value)
        if (index !== -1) {
            list.splice(index, 1)
        } else {
            list.push(value)
        }

        return list.length ? list.slice() : null
    }

    const BpIconFiles = 'list-folder__bp-icon'
    const BpIconCheckedFiles = 'list-folder__bp-icon-checked'
    const BpIconDisabledLabel = 'list-folder__bp-icon-desabilitado'

    return (
        <Box
            className='list-folder'
            data-testid='list-folders-custom'>
            {filteredFolder.map(folder => (
                <If
                    key={`if-tree-view-folder-${folder.id}`}
                    test={folder.show}>
                    <List
                        disablePadding
                        className='box-pasta'
                        key={`list-folders-custom-${folder.id}`}
                        sx={{ width: '100%' }}
                        component='nav'
                        aria-labelledby='nested-list-subheader'>
                        <ListItemButton>
                            <If test={folder.arquivos.length > 0}>
                                {activeFilter.includes(folder.id) ? (
                                    <Box
                                        data-testid='down'
                                        onClick={() => {
                                            handleClick(folder.id)
                                        }}
                                        className='icon-chevron-down'
                                    />
                                ) : (
                                    <Box
                                        data-testid={`icon-chevron-right-${folder.id}`}
                                        onClick={() => {
                                            handleClick(folder.id)
                                        }}
                                        className='icon-chevron-right'
                                    />
                                )}
                            </If>
                            <Checkbox
                                onChange={() => onSelectFolder(folder)}
                                checked={folder.selected}
                                disabled={!folder.arquivos.length}
                                checkedIcon={<span className={BpIconCheckedFiles} />}
                                icon={
                                    <span
                                        className={`${BpIconFiles} ${
                                            folder.arquivos.length ? '' : BpIconDisabledLabel
                                        }`}
                                    />
                                }
                            />
                            <Tooltip
                                title={folder.nome}
                                placement='top'
                                arrow>
                                <ListItemText
                                    className='list-folder__name'
                                    primary={folder.nome}
                                />
                            </Tooltip>
                            <Box aria-label='qtd-registros'>
                                <span className='list-folder__contador'>{folder.arquivos?.length}</span>
                            </Box>
                            <FolderActionsMenu
                                data-testid='folder-action-menu'
                                folder={folder}
                                filteredFolder={filteredFolder}
                                handleEditFolder={handleEditFolder}
                                handleDeleteFolder={handleDeleteFolder}
                                handleDownloadFolder={handleDownloadFolder}
                                handleCopiedFile={handleCopiedFile}
                                handleMovedFileBulk={handleMovedFileBulk}
                                handleDeleteFiles={handleDeleteFiles}
                            />
                        </ListItemButton>
                        {folder.arquivos?.map(file => (
                            <If
                                key={`if-show-file-${file.id}`}
                                test={file.show}>
                                <Collapse
                                    in={activeFilter.includes(folder.id)}
                                    timeout='auto'
                                    unmountOnExit>
                                    <List
                                        component='div'
                                        className='box-children'
                                        disablePadding>
                                        <ListItemButton
                                            sx={{ pl: 6 }}
                                            id={`treeview-files-${file.id}`}>
                                            <If test={file.status === 'PRONTO'}>
                                                <Checkbox
                                                    aria-label={`file-${file.id}`}
                                                    checked={file.selected}
                                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                                        onSelectFile(folder, file.id, event.target.checked)
                                                    }
                                                    checkedIcon={<span className={BpIconCheckedFiles} />}
                                                    icon={<span className={BpIconFiles} />}
                                                />
                                            </If>
                                            <If test={!file.uploaded}>
                                                <Box className='box-circular-progress'>
                                                    <CircularProgressWithLabel data-testid={'progressbar'} />
                                                </Box>
                                            </If>
                                            <If test={file.uploaded && file.status !== 'PRONTO'}>
                                                <CircularProgress
                                                    size={18}
                                                    variant='indeterminate'
                                                    thickness={4}
                                                />
                                            </If>
                                            <Tooltip
                                                title={file.nome}
                                                placement='top'
                                                arrow>
                                                <ListItemText
                                                    data-testid={`file-name-${file.id}`}
                                                    className='list-folder__name-children'
                                                    primary={file.nome}
                                                />
                                            </Tooltip>
                                            <If test={file.id !== null}>
                                                <span className={getMidiaByExtensao(file.tipo_midia)?.icon} />
                                                <FileActionsMenu
                                                    data-testid='file-action-menu'
                                                    file={file}
                                                    filteredFolder={filteredFolder}
                                                    handleEditFile={handleEditFile}
                                                    handleDeleteFile={handleDeleteFile}
                                                    handleDownloadFile={handleDownloadFile}
                                                    handleCopiedFile={handleCopiedFile}
                                                    handleMovedFile={handleMovedFile}
                                                    profile={profile}
                                                />
                                            </If>
                                        </ListItemButton>
                                    </List>
                                </Collapse>
                            </If>
                        ))}
                    </List>
                </If>
            ))}
        </Box>
    )
}
export default ListFoldersCustom
