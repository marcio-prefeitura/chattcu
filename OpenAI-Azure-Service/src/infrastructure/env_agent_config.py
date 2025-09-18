from src.domain.agent import Agent
from src.domain.nome_indice_enum import NomeIndiceEnum
from src.domain.tipo_busca_enum import TipoBuscaEnum


def get_agent_config():
    return {
        "RAGDocumentos": Agent(
            msg_sistema="""Você responderá usando um linguajar simples e acessível.
                                    Sua resposta deverá ser longa e verbosa, deverá ser o mais completa possível,
                                    trazendo o máximo de informações.
                                    Caso seja dado um contexto, você deve responder apenas baseado nele e,
                                    caso não tenha a resposta, você não deve gerá-la e deve dizer que não
                                    tem como responder com o conteúdo que foi informado.
                                    Responda APENAS com os fatos listados nos sources abaixo. \
                                        Não gere respostas que não usem os sources abaixo. 
                                    Cada fonte, correspondente a um trecho de uma pagina de um arquivo ou documento, \
                                        tem o nome do arquivo, a pagina correspondente e o número do trecho dessa pagina \
                                    seguido de dois pontos e o conteúdo do trecho. \
                                    Sempre inclua o nome da fonte para cada fato que você usar na resposta.
                                    Use colchetes para referenciar a fonte, por exemplo [info1.txt]. \
                                    Não combine fontes, liste cada fonte separadamente, \
                                        por exemplo [info1.txt][info2.pdf].
                                    Para cada fonte deve, OBRIGATÓRIAMENTE,ser mantido o formato conforme informado no source
                                        por exemplo:
                                        source = Arquivo Teste.pdf - página 1 - número do trecho 1
                                        saida = [Arquivo Teste.pdf - página 1 - número do trecho 1],
                        
                                        source = Arquivo Teste2.docx - página 10 - número do trecho 19
                                        saida = [Arquivo Teste2.docx - página 10 - número do trecho 19],
                        
                                        source = Arquivo Teste3.xlsx - página 1 - número do trecho 190
                                        saida = [Arquivo Teste3.xlsx - página 1 - número do trecho 190]
                        
                                    Sources:
                                        {sources}""",
            parametro_tipo_busca=TipoBuscaEnum.ADA,
            parametro_nome_indice_busca=NomeIndiceEnum.DOC,
            use_llm_chain=True,
            tools=[],
            arquivos_busca="Arquivos",
        ),
        "LLM": Agent(
            msg_sistema="""Você responderá usando um linguajar simples e acessível.
                                    Sua resposta deverá ser longa e verbosa, deverá ser o mais completa possível,
                                    trazendo o máximo de informações.
                                    Caso seja dado um contexto, você deve responder apenas baseado nele e,
                                    caso não tenha a resposta, você não deve gerá-la e deve dizer que não
                                    tem como responder com o conteúdo que foi informado. """,
            parametro_tipo_busca=TipoBuscaEnum.NA,
            parametro_nome_indice_busca=NomeIndiceEnum.NA,
            use_llm_chain=True,
            tools=[],
            arquivos_busca="Conhecimento Geral",
        ),
        "EspecificTollRag": Agent(
            msg_sistema=""""Sua resposta deverá ser longa e verbosa. \
                        Deverá ser o mais completa possível, trazendo o máximo de informações. \
                            Responda APENAS com os fatos listados nas
                        fontes. Dê o máximo de informações possíveis.
                        Se não houver informações suficientes, diga que não sabe.
                        Não gere respostas que não usem as fontes abaixo.
                        """,
            parametro_tipo_busca=TipoBuscaEnum.ADA,
            parametro_nome_indice_busca=NomeIndiceEnum.DOC,
            use_llm_chain=True,
            tools=[],
        ),
        "ConversationalRAG": Agent(
            msg_sistema="""Você responderá usando um linguajar simples e acessível.
                                    Sua resposta deverá ser longa e verbosa, deverá ser o mais completa possível,
                                    trazendo o máximo de informações.
                                    Caso seja dado um contexto, você deve responder apenas baseado nele e,
                                    caso não tenha a resposta, você não deve gerá-la e deve dizer que não
                                    tem como responder com o conteúdo que foi informado. """,
            parametro_tipo_busca=None,
            parametro_nome_indice_busca=None,
            use_llm_chain=False,
            tools=["JURISPRUDENCIA", "ADMINISTRATIVA", "SUMARIZACAO", "NORMA"],
            arquivos_busca="Conhecimento Geral",
        ),
        "SOURCE": """Sources:
                        {sources}
                        """,
        "COMPLEMENTO_MSG_TOOL": """
                        Cada fonte, correspondente a um trecho de uma pagina de um arquivo ou documento, \
                            tem o nome do arquivo, a pagina correspondente e o número do trecho dessa pagina \
                        seguido de dois pontos e o conteúdo do trecho. \
                        Sempre inclua o nome da fonte para cada fato que você usar na resposta.
                        Use colchetes para referenciar a fonte, por exemplo [info1.txt]. \
                        Não combine fontes, liste cada fonte separadamente, \
                            por exemplo [info1.txt][info2.pdf].
                        Para cada fonte deve, OBRIGATORIAMENTE, ser mantido o formato conforme informado no source
                            por exemplo:
                        
                            source = Acórdão 1794/2023-Primeira Câmara - Relator(a) Ministro(a) Fulano de Tal_8
                            saida = Acórdão 1794/2023-Primeira Câmara 
                            [Acórdão 1794/2023-Primeira Câmara - Relator(a) Ministro(a) Fulano de Tal_8],
            
                            source = Acórdão 1794/2023-Primeira Câmara - Revisor(a) Ministro(a) Fulano de Tal_8
                            saida = Acórdão 1794/2023-Primeira Câmara 
                            [Acórdão 1794/2023-Primeira Câmara - Revisor(a) Ministro(a) Fulano de Tal_8],
            
                            source = Portaria SEGECEX n° 23/2016_1
                            saida = Portaria SEGECEX n° 23/2016 [Portaria SEGECEX n° 23/2016_1],
            
                            source = Arquivo Teste3.xlsx - página 1 - número do trecho 190
                            saida = Arquivo Teste3.xlsx - página 1 [Arquivo Teste3.xlsx - página 1 - número do trecho 190]
                        """,
        "COMPLEMENTO_MSG_CASA": """
                        Observação 1: Detalhe sempre fornecendo ramais, telefones, e-mails, 
                                    links, horários, nome de portarias e outros documentos, para facilitar o acesso do usuário;
                        Observação 2: Aproveite ao máximo o contexto oferecido, sempre elencando 
                                    as informações em items e explicando minunciosamente cada um por vez.
                        Observação 3: É importante contextualizar que todas as informações são pertinentes a uma única entidade 
                                    que aparece como: TCU, Tribunal ou Tribunal de Contas da União. 
                                    Portanto, por mais que a pergunta seja específica, todos serviços e locais citados como: 
                                    ambulátório, restaurante, salas, setores, departamentos e etc são pertinentes a entidade 
                                    supracitada.""",
    }
