FROM python:3.12.5-slim-bullseye AS builder

RUN apt-get update \
    && apt-get install gcc -y \
    && apt-get clean 

WORKDIR /app

COPY requirements.txt ./requirements.txt

RUN pip install --user -r requirements.txt --trusted-host=pypi.org --trusted-host=files.pythonhosted.org

# Production image
FROM python:3.12.5-slim-bullseye AS app
EXPOSE 8000
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        openjdk-17-jdk \
        libxslt1.1 \
        ffmpeg \
        libxinerama1 \
        libreoffice \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# atualiza o PATH (mantém binários do pip local); LibreOffice já fica no PATH padrão (/usr/bin/soffice)
ENV PATH=/root/.local/bin:$PATH

COPY --from=builder /root/.local /root/.local
COPY newrelic.ini .
COPY ./src/ ./src

# ENTRYPOINT ["newrelic-admin", "run-program"]
ENTRYPOINT uvicorn src.main:app --host 0.0.0.0
# CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0"]
