import json
from datetime import datetime

from pydantic import BaseModel, ValidationError


class MensagemChatStopRedis(BaseModel):
    channel_subscricao: str
    correlacao_chamada_id: str
    usuario: str
    origem: str
    data_hora: datetime | None

    def __init__(
        self,
        channel_subscricao: str,
        correlacao_chamada_id: str,
        usuario: str,
        origem: str,
        data_hora: datetime | None = None,
    ):
        super().__init__(
            channel_subscricao=channel_subscricao,
            correlacao_chamada_id=correlacao_chamada_id,
            usuario=usuario,
            origem=origem,
            data_hora=data_hora,
        )

    def __str__(self):
        return f"""                        
            channel_subscricao: {self.channel_subscricao}, 
            correlacao_chamada_id: {self.correlacao_chamada_id},            
            usuario: {self.usuario},
            origem: {self.origem},
            data_hora: {self.data_hora}"""

    @classmethod
    def from_str(cls, conteudo: str) -> "MensagemChatStopRedis":
        """Converte uma string JSON em uma instância do modelo."""
        try:
            data = json.loads(conteudo)

            if not isinstance(data.get("data_hora"), str) or data["data_hora"] is None:
                data["data_hora"] = datetime.now().isoformat()
            else:
                try:
                    datetime.fromisoformat(data["data_hora"])
                except ValueError:
                    data["data_hora"] = datetime.now().isoformat()

            return cls(**data)
        except json.JSONDecodeError as e:
            print(
                f"Erro ao decodificar JSON, possível problema de interface de mensagem descompatível: {e}"
            )
            return None
        except Exception as e:
            raise ValueError(f"Erro diverso ao ler dados da mensagem: {e}")
