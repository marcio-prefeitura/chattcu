#############################################
# 1) Base de build: instala deps e roda pip
#############################################
FROM python:3.12.5-slim-bullseye AS builder

# Melhora performance/limpa cache do pip
ENV PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Dependências mínimas pra compilar wheels (ajuste se precisar de mais libs)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copie só requirements antes, pra aproveitar cache de camadas
COPY requirements.txt ./requirements.txt

# Instala em /root/.local (user site-packages) para copiar pro estágio final
RUN pip install --user -r requirements.txt --trusted-host=pypi.org --trusted-host=files.pythonhosted.org


#############################################
# 2) Imagem final de runtime
#############################################
FROM python:3.12.5-slim-bullseye AS app

# Porta padrão
EXPOSE 8000

WORKDIR /app

# Variáveis úteis
ENV PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/root/.local/bin:$PATH \
    PORT=8000

# Pacotes de sistema solicitados + curl para healthcheck
# (remova os que não precisar; estes aumentam bastante a imagem)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        openjdk-17-jdk \
        libxslt1.1 \
        ffmpeg \
        libxinerama1 \
        libreoffice \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Copia libs Python do estágio de build
COPY --from=builder /root/.local /root/.local

# App code e config do New Relic (se não usar, pode remover estas duas linhas)
COPY newrelic.ini .
COPY ./src/ ./src

# (Opcional) HEALTHCHECK — ajuste o path para um endpoint público da sua API
# Usa a porta do App Service (WEBSITES_PORT) se existir, senão PORT/8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD sh -c 'P="${WEBSITES_PORT:-${PORT:-8000}}"; curl -fsS "http://127.0.0.1:${P}/health" || exit 1'

# IMPORTANTE:
# - Use CMD (não ENTRYPOINT). O App Service pode substituir o CMD se você
#   preencher o Startup Command lá, sem quebrar o container.
# - Respeite WEBSITES_PORT (Azure) com fallback pra PORT e 8000.
CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port ${WEBSITES_PORT:-${PORT:-8000}}"]
