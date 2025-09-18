FROM python:bookworm
# Ref.: https://github.com/nikolaik/docker-python-nodejs
# Ref: https://github.com/nodesource/distributions#installation-instructions

RUN \
  apt-get update && \
  apt-get install -yqq nodejs npm && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* && \
  pip install -U pip

# Ref: https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/install#linux
RUN \
  curl -Lo bicep https://github.com/Azure/bicep/releases/v0.24.24/download/bicep-linux-x64 && \
  chmod +x ./bicep && \
  mv ./bicep /usr/local/bin/bicep

# Ref: https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teams-toolkit-cli?pivots=version-three#get-started
RUN ["npm", "install", "-g", "@microsoft/teamsapp-cli"]

WORKDIR /app
COPY requirements.txt .
RUN \
  pip install --user -r requirements.txt --trusted-host=pypi.org --trusted-host=files.pythonhosted.org && \
  rm requirements.txt
