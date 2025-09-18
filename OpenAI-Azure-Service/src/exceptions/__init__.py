class ServiceException(Exception): ...


class MongoException(Exception): ...


class ElasticException(Exception): ...


class AzureFunctionError(Exception):
    """Exception raised for errors in the Azure Function.

    Attributes:
        message -- explanation of the error
    """

    def __init__(self, message):
        self.message = message
        super().__init__(self.message)


class BusinessException(Exception):
    """Classe de exceção criada para tratamento de regras de negócio.

    Args:
        message: mensagem customizada de erro de negócio.
        code: código de erro, seguindo o HTTP status code.
    """

    def __init__(self, message, code=1000):
        super().__init__(message)
        self.message = message
        self.code = code

    def __str__(self):
        return f"[Erro {self.code}] {self.message}"
