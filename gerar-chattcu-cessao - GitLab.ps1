#backend
git -c http.sslVerify=false clone https://srv-scm.tcu.gov.br/nucleo-ia/openai-azure-service.git
# último commit do dia 30/4/2024 - Release do ChatTCU 4.0 - Para enviar outra versão, só trocar o hash ou comentar a linha para mandar o HEAD
git -C openai-azure-service reset --hard 86d4afb56a79f2ab925e3267dd9565c05f48bc02
rm openai-azure-service\resources\*deb* -fo
rm openai-azure-service\.git -fo -Recurse -Confirm:$false

#frontend
git -c http.sslVerify=false clone https://srv-scm.tcu.gov.br/nucleo-ia/openai-azure-service-playground.git
# último commit do dia 30/4/2024 - Release do ChatTCU 4.0 - Para enviar outra versão, só trocar o hash ou comentar a linha para mandar o HEAD
git -C openai-azure-service-playground reset --hard 3d1fa1c6006203a5db076bdfcf978bdf6d4a7486
rm openai-azure-service-playground\.git -fo -Recurse -Confirm:$false

#zip com ambos
$compress = @{
  Path = "openai-azure-service", "openai-azure-service-playground"
  CompressionLevel = "Optimal"
  DestinationPath = "ChatTCU 4.0.zip"
}
Compress-Archive @compress

#apagar os diretórios para evitar mandar por engano
rm openai-azure-service -fo -Recurse -Confirm:$false
rm openai-azure-service-playground -fo -Recurse -Confirm:$false


#infra Azure
git -c http.sslVerify=false clone https://srv-scm.tcu.gov.br/nucleo-ia/chattcu-infra-azure.git
# Enviando HEAD. Posteriormente SINCRONIZAR as datas de commit deste repo com o corte do back e front (ChatTCU 5.0 em diante)
#git -C openai-azure-service-playground reset --hard 3d1fa1c6006203a5db076bdfcf978bdf6d4a7486
rm chattcu-infra-azure\.git -fo -Recurse -Confirm:$false

#zip com ambos
$compress = @{
  Path = "chattcu-infra-azure"
  CompressionLevel = "Optimal"
  DestinationPath = "Infra Nuvem ChatTCU.zip"
}
Compress-Archive @compress

rm chattcu-infra-azure -fo -Recurse -Confirm:$false