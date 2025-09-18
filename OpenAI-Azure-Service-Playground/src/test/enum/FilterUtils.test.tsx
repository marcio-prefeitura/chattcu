import { IChat, ISharedChat } from '../../infrastructure/utils/types'
import { AgentModel } from '../../shared/interfaces/AgentModel'
import { IFolder } from '../../shared/interfaces/Folder'
import { filterArchiveChats, filterChats, filterSharedChats, filterUploadedFiles } from '../../utils/FilterUtils'

describe('filterUtils', () => {
    describe('filterChats', () => {
        const mockChats: IChat[] = [
            { id: '1', titulo: 'Chat Test 1', mensagens: [], isLoading: false },
            { id: '2', titulo: 'Another Chat', mensagens: [], isLoading: false },
            { id: '3', titulo: 'Test Chat 3', mensagens: [], isLoading: false }
        ]

        it('should return empty array if chatsHistory is undefined', () => {
            expect(filterChats(undefined, 'test')).toEqual([])
        })

        it('should return all chats if query is empty', () => {
            expect(filterChats(mockChats, '')).toEqual(mockChats)
        })

        it('should filter chats by title case insensitive', () => {
            expect(filterChats(mockChats, 'test')).toEqual([mockChats[0], mockChats[2]])
        })
    })

    describe('filterUploadedFiles', () => {
        const mockFolders: IFolder[] = [
            {
                id: '1',
                nome: 'Test Folder',
                arquivos: [
                    { id: '1', nome: 'test1.pdf', tipo_midia: 'pdf' },
                    { id: '2', nome: 'document.pdf', tipo_midia: 'pdf' }
                ]
            },
            {
                id: '2',
                nome: 'Another Folder',
                arquivos: [{ id: '3', nome: 'test3.pdf', tipo_midia: 'pdf' }]
            }
        ] as IFolder[]

        it('should filter files by name and set folder open state', () => {
            const result = filterUploadedFiles(mockFolders, 'test')
            expect(result[0].open).toBe(true)
            expect(result[0].arquivos).toHaveLength(1)
            expect(result[0].arquivos[0].nome).toContain('test')
        })

        it('should filter folders by name', () => {
            const result = filterUploadedFiles(mockFolders, 'Another')
            expect(result).toHaveLength(1)
            expect(result[0].nome).toBe('Another Folder')
        })

        it('should return folders that match query or have matching files', () => {
            const result = filterUploadedFiles(mockFolders, 'test')
            expect(result).toHaveLength(2)
        })
    })

    describe('filterSharedChats', () => {
        const mockSharedChats: ISharedChat[] = [
            {
                id: '1',
                usuario: 'user1',
                st_removido: false,
                arquivos: [],
                chat: { id: '1', titulo: 'Shared Test 1', mensagens: [], isLoading: false },
                data_compartilhamento: new Date('2024-01-01T10:00:00Z'),
                destinatarios: []
            },
            {
                id: '2',
                usuario: 'user1',
                st_removido: false,
                arquivos: [],
                chat: { id: '2', titulo: 'Shared Doc', mensagens: [], isLoading: false },
                data_compartilhamento: new Date('2024-01-02T10:00:00Z'),
                destinatarios: []
            },
            {
                id: '3',
                usuario: 'user1',
                st_removido: false,
                arquivos: [],
                chat: { id: '3', titulo: 'Test Share 3', mensagens: [], isLoading: false },
                data_compartilhamento: new Date('2024-01-03T10:00:00Z'),
                destinatarios: []
            }
        ]

        it('should return empty array if sharedChats is undefined', () => {
            expect(filterSharedChats(undefined, 'test')).toEqual([])
        })

        it('should return sorted chats if query is empty', () => {
            const result = filterSharedChats(mockSharedChats, '')
            expect(result[0].id).toBe('3') // Most recent first
            expect(result[2].id).toBe('1') // Oldest last
        })

        it('should filter and sort shared chats by title', () => {
            const result = filterSharedChats(mockSharedChats, 'test')
            expect(result).toHaveLength(2)
            expect(result[0].chat.titulo).toContain('Test')
            expect(result[1].chat.titulo).toContain('Test')
            // Verify sorting
            expect(result[0].data_compartilhamento.getTime()).toBeGreaterThan(result[1].data_compartilhamento.getTime())
        })
    })

    describe('filterArchiveChats', () => {
        const mockArchiveChats: IChat[] = [
            { id: '1', titulo: 'Archive Test 1', mensagens: [], arquivado: true, isLoading: false },
            { id: '2', titulo: 'Archive Doc', mensagens: [], arquivado: true, isLoading: false },
            { id: '3', titulo: 'Test Archive 3', mensagens: [], arquivado: false, isLoading: false }
        ]

        it('should return empty array if archiveChats is undefined', () => {
            expect(filterArchiveChats(undefined, 'test')).toEqual([])
        })

        it('should return all archive chats if query is empty', () => {
            expect(filterArchiveChats(mockArchiveChats, '')).toEqual(mockArchiveChats)
        })

        it('should filter archive chats by title and archived status', () => {
            const result = filterArchiveChats(mockArchiveChats, 'test')
            expect(result).toHaveLength(1)
            expect(result[0].titulo).toBe('Archive Test 1')
            expect(result[0].arquivado).toBe(true)
        })

        it('should sort chats by archived status', () => {
            const mixedChats: IChat[] = [
                { id: '1', titulo: 'Test 1', mensagens: [], arquivado: true, isLoading: false },
                { id: '2', titulo: 'Test 2', mensagens: [], arquivado: false, isLoading: false },
                { id: '3', titulo: 'Test 3', mensagens: [], arquivado: true, isLoading: false }
            ]
            const result = filterArchiveChats(mixedChats, '')

            expect(result.map(c => c.arquivado)).toEqual([true, false, true])
        })
    })

    describe('filterEspecialistas', () => {
        const mockEspecialistas: AgentModel[] = [
            {
                labelAgente: 'AI Expert',
                valueAgente: 'ai_expert',
                selected: false,
                quebraGelo: ['Hi', 'Hello'],
                autor: 'John Doe',
                descricao: 'Specialist in artificial intelligence',
                icon: null,
                instrucoes: 'Some instructions'
            },
            {
                labelAgente: 'Data Scientist',
                valueAgente: 'data_scientist',
                selected: false,
                quebraGelo: ['Hello', 'Hi there'],
                autor: 'Jane Smith',
                descricao: 'Expert in data analysis',
                icon: null,
                instrucoes: 'Data analysis instructions'
            },
            {
                labelAgente: 'ML Engineer',
                valueAgente: 'ml_engineer',
                selected: false,
                quebraGelo: ['Greetings', 'Welcome'],
                autor: 'Bob Wilson',
                descricao: 'AI and machine learning specialist',
                icon: null
            }
        ]
    })
})
