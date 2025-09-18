#backend
git clone git@github.com:TCU-TI/OpenAI-Azure-Service.git
# último commit do dia até 31/1/2025 - Release do ChatTCU 5.0 + pesquenas correções - Para enviar outra versão, só trocar o hash ou comentar a linha para mandar o HEAD
git -C OpenAI-Azure-Service reset --hard 18fe41e3946255a8ffdd6a76fb9a9d5a8cf98adb
rm OpenAI-Azure-Service\resources\*deb* -fo
rm OpenAI-Azure-Service\.git -fo -Recurse -Confirm:$false

#frontend
git clone git@github.com:TCU-TI/OpenAI-Azure-Service-Playground.git
# último commit do dia até 31/1/2025 - Release do ChatTCU 5.0 + pesquenas correções - Para enviar outra versão, só trocar o hash ou comentar a linha para mandar o HEAD
git -C OpenAI-Azure-Service-Playground reset --hard a8e22c0dd8170b3311369b3e748d6fc20de2c646
rm OpenAI-Azure-Service-Playground\.git -fo -Recurse -Confirm:$false

#zip com ambos
$compress = @{
  Path = "OpenAI-Azure-Service", "OpenAI-Azure-Service-Playground"
  CompressionLevel = "Optimal"
  DestinationPath = "ChatTCU 5.0.zip"
}
Compress-Archive @compress

#apagar os diretórios para evitar mandar por engano
rm OpenAI-Azure-Service -fo -Recurse -Confirm:$false
rm OpenAI-Azure-Service-Playground -fo -Recurse -Confirm:$false


#infra Azure
git clone git@github.com:TCU-TI/chattcu-infra-azure.git
# último commit do dia até 31/1/2025 - Release do ChatTCU 5.0 + pesquenas correções - Para enviar outra versão, só trocar o hash ou comentar a linha para mandar o HEAD
git -C chattcu-infra-azure reset --hard 4a262aad8ca8a62cc5ff66a3de64a7192e79b079
rm chattcu-infra-azure\.git -fo -Recurse -Confirm:$false

#zip com ambos
$compress = @{
  Path = "chattcu-infra-azure"
  CompressionLevel = "Optimal"
  DestinationPath = "Infra Nuvem ChatTCU 5.0.zip"
}
Compress-Archive @compress

rm chattcu-infra-azure -fo -Recurse -Confirm:$false