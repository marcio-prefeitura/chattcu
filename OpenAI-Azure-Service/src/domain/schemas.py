from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, RootModel

from src.domain.agent_config import AgentConfig
from src.domain.store import Especialista
from src.domain.trecho import Trecho


class ChatGptInput(BaseModel):
    stream: Optional[bool] = False
    prompt_usuario: str
    arquivos_selecionados: Optional[List[str]] = []
    arquivos_selecionados_prontos: Optional[List[str]] = []
    tool_selecionada: Optional[str] = None
    temperature: Optional[float] = 0
    top_p: Optional[float] = 0.95
    top_documentos: Optional[int] = 15
    parametro_modelo_llm: Optional[str] = None
    correlacao_chamada_id: Optional[str] = None
    imagens: Optional[List[str]] = []
    config: Optional[AgentConfig] = None


class ListaIdsIn(BaseModel):
    ids: List[str]


class AtualizarChatInput(BaseModel):
    titulo: Optional[str] = None
    fixado: Optional[bool] = None
    arquivado: Optional[bool] = None


class BulkAtualizarChatInput(ListaIdsIn):
    fixado: Optional[bool] = None
    arquivado: Optional[bool] = None


class ReagirInput(BaseModel):
    reacao: str
    conteudo: str
    ofensivo: bool
    inveridico: bool
    nao_ajudou: bool


class AutenticacaoSigaIn(BaseModel):
    login: str
    senha: str


class AutenticacaoSigaOut(BaseModel):
    tokenJwt: str
    refreshToken: str
    userFingerPrint: str


class AutenticacaoOut(BaseModel):
    userFingerPrint: str


class ResponsePadrao(BaseModel):
    status: int
    mensagem: str


class ResponseErroPadrao(BaseModel):
    status: int
    mensagemErro: str


class ResponseException(BaseModel):
    detail: str


class ChatLLMResponse(BaseModel):
    chat_id: str
    chat_titulo: str
    codigo_prompt: str
    response: str
    codigo_response: str
    trechos: List[Trecho] = []  # opcional
    arquivos_busca: Optional[str] = None  # opcional


class FeedbackOut(BaseModel):
    conteudo: str
    nao_ajudou: bool
    inveridico: bool
    ofensivo: bool
    reacao: str


class MessageOut(BaseModel):
    feedback: FeedbackOut | str
    codigo: str
    papel: str
    conteudo: str
    favoritado: bool
    arquivos_busca: str
    arquivos_selecionados: List[str]
    arquivos_selecionados_prontos: List[str]
    trechos: List[Trecho]
    especialista_utilizado: Optional[str] = None
    parametro_modelo_llm: Optional[str] = None
    imagens: Optional[List[str]] = []


class ChatOut(BaseModel):
    id: str
    usuario: str
    titulo: str
    data_ultima_iteracao: Optional[str] = None
    fixado: bool
    arquivado: bool
    mensagens: Optional[List[MessageOut]] = None
    editing: bool = False
    deleting: bool = False


class InfoUsuarioOut(BaseModel):
    login: str
    sigla_lotacao: str
    nome: str
    roles: str


class ChatPagination(BaseModel):
    chats: List[ChatOut]
    has_more_chats: bool


class ItemSistema(BaseModel):
    id: int | str = None
    nome: str
    usuario: str
    st_removido: bool = False
    id_pasta_pai: int | str = -1
    data_criacao: Optional[str] = None
    st_arquivo: bool = False
    tamanho: Optional[str] = None
    tipo_midia: Optional[str] = None
    nome_blob: Optional[str] = None
    status: Optional[str] = None
    arquivos: Optional[List["ItemSistema"]] = None
    selected: Optional[bool] = False
    show: Optional[bool] = True
    uploaded: Optional[bool] = True
    open: Optional[bool] = False


class ItemSistemaComErro(BaseModel):
    item: "ItemSistema"
    erro: str


class ItemFolderIn(BaseModel):
    nome: str


class AcaoItemFolderEnum(Enum):
    COPIAR = "COPY"
    MOVER = "MOVE"


class ItemFolderInForCopy(BaseModel):
    ids_itens: List[str]
    acao: "AcaoItemFolderEnum"


class DestinatarioOut(BaseModel):
    codigo: str
    nome: str


class CompartilhamentoIn(BaseModel):
    id_chat: str


class CompartilhamentoOut(BaseModel):
    id: str
    chat: ChatOut
    usuario: str
    st_removido: bool
    data_compartilhamento: Optional[str]
    arquivos: Optional[List[str]] = None


class ServicoSegedam(BaseModel):
    cod: int
    descr_nome: str
    texto_publico_alvo: str
    texto_requisitos: str
    texto_como_solicitar: Optional[str]
    texto_palavras_chave: Optional[str]
    texto_etapas: str
    texto_o_que_e: str
    descr_categoria: str
    descr_subcategoria: str
    descr_unidade_responsavel: Optional[str]
    link_sistema: Optional[str]
    nome_sistema: Optional[str]


class ServicoSegedamList(RootModel):
    root: list["ServicoSegedam"] = Field(min_length=1)


class PaginatedChatsResponse(BaseModel):
    chats: List[ChatOut]
    total: int


class PaginatedEspecialistResponse(BaseModel):
    especialistas: List[Especialista]
    total: int


class FiltrosChat(BaseModel):
    fixados: Optional[bool] = None
    arquivados: Optional[bool] = None
    page: Optional[int] = None
    per_page: Optional[int] = None
    searchText: Optional[str] = None


class FiltrosEspecialistas(BaseModel):
    categoria: Optional[str] = None
    page: Optional[int] = None
    per_page: Optional[int] = None
    usuario_logado: Optional[str] = None


class InOutputModelOut(BaseModel):
    text: bool
    image: bool
    audio: bool
    video: bool


class ModelOut(BaseModel):
    name: str
    description: str
    icon: str
    is_beta: bool
    max_words: int
    stream_support: bool
    inputs: InOutputModelOut
    outputs: InOutputModelOut


class GabiResponse(BaseModel):
    transcript: str
    summary: str
    itens_filenames: List[str]


class ImageBase64Out(BaseModel):
    imagem_base64: str
