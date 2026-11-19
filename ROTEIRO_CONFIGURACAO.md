# Roteiro de Configuração — Infraestrutura Windows Server do AprendIA

**Global Solution 2026.2 — CitizenTech · Disciplina: Operating Systems**

## 1. Objetivo

Este roteiro descreve, em ordem de execução, os procedimentos adotados para implantar a infraestrutura Windows Server que sustenta a solução AprendIA. Contempla:

- os serviços estudados no semestre: DNS, Active Directory, File Server, IIS, GPO, RDS e DFS;
- o monitoramento de recursos;
- a recuperação automática de serviços e o teste de falha;
- a auditoria.

As evidências citadas (P01 a P40) estão em `evidencias/prints/` e são descritas no documento `DOCUMENTACAO_INFRAESTRUTURA.pdf`.

## 2. Ambiente

### 2.1 Recursos utilizados

| Item | Especificação |
|---|---|
| Virtualizador | Oracle VirtualBox 7.2 |
| Sistema operacional (servidor e cliente) | Windows Server 2025 Standard Evaluation, com Desktop Experience |
| Rede virtual | NAT Network `AprendIA-NAT`, 192.168.234.0/24, DHCP do VirtualBox desabilitado |
| Hardware de cada máquina virtual | 4096 MB de RAM, 2 vCPUs, disco dinâmico de 60 GB |
| Disco adicional do servidor | 20 GB, dinâmico, destinado aos dados compartilhados |

### 2.2 Parâmetros

| Parâmetro | Valor |
|---|---|
| Nome do servidor / IP | `SRV01` / 192.168.234.10 (estático) |
| Nome do cliente / IP | `CLIENTE01` / atribuído por DHCP (192.168.234.100) |
| Máscara / gateway | 255.255.255.0 / 192.168.234.1 |
| Servidor DNS | 192.168.234.10 |
| Domínio / NetBIOS | `aprendia.local` / `APRENDIA` |
| Endereço da aplicação | `http://app.aprendia.local` |

> Na NAT Network do VirtualBox, o gateway corresponde sempre ao primeiro endereço da rede (.1). O valor .2 apresentado em aula refere-se ao ambiente VMware.

### 2.3 Convenções

- Os comandos devem ser executados no **Windows PowerShell com privilégios de administrador**, salvo indicação contrária.
- Os snapshots devem ser criados com a máquina virtual **desligada**.

## 3. Procedimentos

### 3.1 Rede virtual

1. No VirtualBox, acessar **File → Tools → Network Manager → NAT Networks → Create**.
2. Definir o nome `AprendIA-NAT`, o prefixo `192.168.234.0/24` e desmarcar **Enable DHCP**.

**Evidência:** P01.

### 3.2 Máquina virtual do servidor

1. Criar a máquina virtual `SRV-AprendIA-GS` com os recursos da seção 2.1, utilizando a ISO do Windows Server 2025.
2. Em **Settings → Network → Adapter 1**, selecionar **NAT Network** e a rede `AprendIA-NAT`.
3. Instalar a edição **Windows Server 2025 Standard Evaluation (Desktop Experience)** e definir a senha da conta administrativa.

### 3.3 Preparação do servidor

```powershell
Rename-Computer -NewName SRV01 -Restart
```

Após a reinicialização, configurar o endereçamento estático e liberar a resposta ao ping (ICMP), bloqueada por padrão:

```powershell
New-NetIPAddress -InterfaceAlias Ethernet -IPAddress 192.168.234.10 -PrefixLength 24 -DefaultGateway 192.168.234.1
Set-DnsClientServerAddress -InterfaceAlias Ethernet -ServerAddresses 192.168.234.10
netsh advfirewall firewall add rule name="AprendIA - Permitir Ping (ICMPv4)" protocol=icmpv4:8,any dir=in action=allow
```

Criar o snapshot `01_INSTALACAO_LIMPA`.

### 3.4 Serviços de DNS e DHCP

1. Instalar as funções:

```powershell
Install-WindowsFeature DNS, DHCP -IncludeManagementTools
```

2. Criar, no console DHCP, o escopo IPv4 da rede de clientes (faixa a partir de 192.168.234.100), com as opções:
   - **003 Router:** 192.168.234.1;
   - **006 DNS Servers:** 192.168.234.10;
   - **015 DNS Domain Name:** `aprendia.local`.
3. Ativar o escopo.

> A zona `aprendia.local` **não** deve ser criada nesta etapa. Ela é criada automaticamente, integrada ao Active Directory, durante a promoção do controlador de domínio (seção 3.6). A criação antecipada gera uma zona sem atualização dinâmica, na qual o controlador de domínio não consegue registrar seus registros SRV.

### 3.5 Máquina virtual do cliente

1. Criar a máquina virtual `CLI-AprendIA-GS` com os mesmos recursos e a mesma rede do servidor.
2. Instalar o sistema e renomear a máquina para `CLIENTE01`.
3. Configurar a placa de rede para obter endereço e DNS automaticamente.
4. Validar o recebimento do endereço pelo DHCP do servidor:

```powershell
ipconfig /renew
ipconfig /all
nslookup www.microsoft.com 192.168.234.10
```

Criar o snapshot `Cliente_Antes_Dominio`.

### 3.6 Active Directory Domain Services

1. Criar o snapshot `Antes_ADDS`. Em seguida, instalar a função e promover o servidor a controlador de uma nova floresta:

```powershell
Install-WindowsFeature AD-Domain-Services -IncludeManagementTools
Install-ADDSForest -DomainName aprendia.local -DomainNetbiosName APRENDIA -InstallDns
```

2. Após a reinicialização, validar o controlador de domínio:

```powershell
Get-ADDomain | Select-Object DNSRoot, NetBIOSName, PDCEmulator
Get-ADDomainController | Select-Object HostName, IsGlobalCatalog
nslookup -type=SRV _ldap._tcp.dc._msdcs.aprendia.local
```

3. Autorizar o servidor DHCP no Active Directory e criar o registro DNS da aplicação:

```powershell
Add-DhcpServerInDC -DnsName srv01.aprendia.local -IPAddress 192.168.234.10
Add-DnsServerResourceRecordA -ZoneName aprendia.local -Name app -IPv4Address 192.168.234.10
```

4. Criar a estrutura organizacional. As OUs ficam sob `aprendia.local`:

| OU | Finalidade |
|---|---|
| `AprendIA` | raiz da organização |
| `AprendIA\Usuarios` | contas de usuários |
| `AprendIA\Computadores` | estações do domínio |
| `AprendIA\Grupos` | grupos de segurança |
| `AprendIA\Laboratorio` | testes de políticas |

5. Criar os grupos de segurança globais, na OU `Grupos`:

| Grupo | Finalidade |
|---|---|
| `GG_Publico_R` | leitura da pasta Publico |
| `GG_Financeiro_RW` | leitura e gravação na pasta Financeiro |
| `GG_Projetos_RW` | leitura e gravação na pasta Projetos |
| `GG_Web_Publicadores` | publicação de arquivos da aplicação web |
| `GG_Acesso_Remoto` | acesso ao servidor por Área de Trabalho Remota |

6. Criar os usuários de teste, na OU `Usuarios`:

| Usuário | Grupos |
|---|---|
| `aluno` | GG_Publico_R |
| `ana.financeiro` | GG_Financeiro_RW, GG_Publico_R |
| `paulo.projetos` | GG_Projetos_RW, GG_Publico_R, GG_Web_Publicadores, GG_Acesso_Remoto |

7. Incluir a conta administrativa do laboratório no grupo **Domain Admins**, para que ela também administre as estações do domínio.
8. No CLIENTE01, ingressar no domínio `aprendia.local` (**sysdm.cpl → Change → Domain**) e reiniciar.
9. No console **Active Directory Users and Computers**, mover o objeto `CLIENTE01` para a OU `AprendIA\Computadores`.

Criar o snapshot `Depois_AD` nas duas máquinas virtuais.

**Evidências:** P02 a P05.

### 3.7 Servidor de arquivos e permissões NTFS

1. Com o servidor desligado, criar o snapshot `Antes_FileServer` e anexar o disco adicional de 20 GB à controladora SATA.
2. Ligar o servidor e preparar o volume. A unidade de DVD, que ocupa a letra D:, é movida para Z:.

```powershell
Get-CimInstance Win32_Volume -Filter "DriveType=5" | Set-CimInstance -Property @{ DriveLetter = 'Z:' }
$n = (Get-Disk | Where-Object PartitionStyle -eq 'RAW').Number
Initialize-Disk -Number $n -PartitionStyle GPT
New-Partition -DiskNumber $n -UseMaximumSize -DriveLetter D | Format-Volume -FileSystem NTFS -NewFileSystemLabel DADOS
```

3. Instalar a função File Server e criar as pastas:

```powershell
Install-WindowsFeature FS-FileServer -IncludeManagementTools
New-Item -ItemType Directory -Path D:\Compartilhamentos\Publico, D:\Compartilhamentos\Financeiro, D:\Compartilhamentos\Projetos
```

4. Aplicar a matriz de acesso:

| Pasta | Compartilhamento | NTFS |
|---|---|---|
| Publico | Authenticated Users: Leitura | Domain Users: Leitura e execução |
| Financeiro | Authenticated Users: Alteração | GG_Financeiro_RW: Modificar |
| Projetos | Authenticated Users: Alteração | GG_Projetos_RW: Modificar |

Em todas as pastas, a herança é desativada e apenas SYSTEM e Administrators mantêm Controle total.

```powershell
$base = 'D:\Compartilhamentos'
New-SmbShare -Name Publico    -Path "$base\Publico"    -ReadAccess   'NT AUTHORITY\Authenticated Users'
New-SmbShare -Name Financeiro -Path "$base\Financeiro" -ChangeAccess 'NT AUTHORITY\Authenticated Users'
New-SmbShare -Name Projetos   -Path "$base\Projetos"   -ChangeAccess 'NT AUTHORITY\Authenticated Users'

$adm = 'NT AUTHORITY\SYSTEM:(OI)(CI)F', 'BUILTIN\Administrators:(OI)(CI)F'
icacls "$base\Publico"    /inheritance:r /grant:r $adm 'APRENDIA\Domain Users:(OI)(CI)RX'
icacls "$base\Financeiro" /inheritance:r /grant:r $adm 'APRENDIA\GG_Financeiro_RW:(OI)(CI)M'
icacls "$base\Projetos"   /inheritance:r /grant:r $adm 'APRENDIA\GG_Projetos_RW:(OI)(CI)M'
```

5. Verificar a configuração:

```powershell
Get-SmbShare | Where-Object Path -like 'D:\Compartilhamentos*'
'Publico', 'Financeiro', 'Projetos' | ForEach-Object { Get-SmbShareAccess -Name $_ }
icacls D:\Compartilhamentos\*
```

**Evidências:** P06 a P12.

### 3.8 Servidor Web (IIS)

1. Instalar a função e criar a pasta do site, com a página inicial da aplicação (`index.html`):

```powershell
Install-WindowsFeature Web-Server -IncludeManagementTools
New-Item C:\Sites\AprendIA -ItemType Directory
```

2. Criar o pool de aplicativos e o site:

```powershell
Import-Module WebAdministration
New-WebAppPool -Name AprendIA-Pool
Set-ItemProperty IIS:\AppPools\AprendIA-Pool -Name managedRuntimeVersion -Value ''
New-Website -Name AprendIA -PhysicalPath C:\Sites\AprendIA -ApplicationPool AprendIA-Pool -Port 80 -HostHeader app.aprendia.local
```

3. Validar a partir do cliente:

```powershell
nslookup app.aprendia.local
Test-NetConnection app.aprendia.local -Port 80
```

4. Acessar `http://app.aprendia.local` pelo navegador do cliente.

**Evidências:** P13 a P15.

### 3.9 Política de Grupo (GPO)

1. No console **Group Policy Management**, criar a GPO `GPO_USR_BloquearPainelControle`.
2. Editar a GPO e definir **User Configuration → Policies → Administrative Templates → Control Panel → Prohibit access to Control Panel and PC settings** como **Enabled**.
3. Vincular a GPO à OU `AprendIA\Usuarios`.
4. No cliente, autenticado como `aluno`, aplicar e verificar a política:

```powershell
gpupdate /force
gpresult /r /scope user
```

O Painel de Controle deve exibir a mensagem de restrição.

**Evidências:** P16 e P17.

### 3.10 DFS Namespaces

1. Instalar a função:

```powershell
Install-WindowsFeature FS-DFS-Namespace -IncludeManagementTools
```

2. No console **DFS Management**, criar o namespace baseado em domínio `\\aprendia.local\Arquivos`, em modo Windows Server 2008, hospedado no SRV01.
3. Criar as pastas do namespace, cada uma apontando para o compartilhamento correspondente:

| Pasta do namespace | Destino |
|---|---|
| `Publico` | `\\SRV01\Publico` |
| `Financeiro` | `\\SRV01\Financeiro` |
| `Projetos` | `\\SRV01\Projetos` |

4. Verificar:

```powershell
Get-DfsnRoot
Get-DfsnFolder -Path '\\aprendia.local\Arquivos\*'
```

O acesso pelo namespace mantém as permissões NTFS das pastas de origem.

**Evidências:** P18 e P19.

### 3.11 Acesso remoto (Remote Desktop Services)

Como o SRV01 é controlador de domínio, não se instala o RD Session Host, por recomendação da Microsoft. Adota-se a Área de Trabalho Remota com autenticação em nível de rede (NLA), restrita a um grupo.

1. Habilitar o acesso remoto:

```powershell
Set-ItemProperty 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name fDenyTSConnections -Value 0
Set-ItemProperty 'HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp' -Name UserAuthentication -Value 1
Enable-NetFirewallRule -DisplayGroup 'Remote Desktop'
```

2. Adicionar o grupo `GG_Acesso_Remoto` ao grupo interno **Remote Desktop Users**.
3. Criar a GPO `GPO_SRV_AcessoRemoto` e definir:
   - **Caminho:** Computer Configuration → Policies → Windows Settings → Security Settings → Local Policies → User Rights Assignment → **Allow log on through Remote Desktop Services**;
   - **Valor:** `Administrators` e `APRENDIA\GG_Acesso_Remoto`.
4. Vincular a GPO à OU **Domain Controllers** e aplicar com `gpupdate /force`.
5. Testar a partir do cliente, com `mstsc /v:srv01.aprendia.local`:
   - `paulo.projetos` deve obter a sessão;
   - `aluno` deve ser recusado.

**Evidências:** P20 e P21.

### 3.12 Monitoramento de recursos

1. Criar os conjuntos de alertas do Monitor de Desempenho, com amostragem de 15 segundos e registro no log de eventos:

```powershell
logman create alert AprendIA-Alerta-CPU     -th '\Processor(_Total)\% Processor Time>80' -si 00:00:15 -el
logman create alert AprendIA-Alerta-Memoria -th '\Memory\% Committed Bytes In Use>80' -si 00:00:15 -el
logman create alert AprendIA-Alerta-Disco   -th '\LogicalDisk(C:)\% Free Space<15' '\LogicalDisk(D:)\% Free Space<15' -si 00:00:15 -el
'AprendIA-Alerta-CPU', 'AprendIA-Alerta-Memoria', 'AprendIA-Alerta-Disco' | ForEach-Object { logman start $_ }
logman query
```

Os conjuntos também podem ser criados pelo console **perfmon**, em *Data Collector Sets → User Defined → New → Performance Counter Alert*. Após uma reinicialização do servidor, devem ser iniciados novamente.

2. Validar os alertas provocando carga controlada:

| Recurso | Procedimento |
|---|---|
| CPU | dois processos de cálculo contínuo durante cerca de 75 segundos |
| Memória | alocação de aproximadamente 3,4 GB durante 60 segundos |
| Disco | criação de um arquivo de 19 GB em D: (`fsutil file createnew`), removido em seguida |

3. Conferir os eventos **2031** em **Event Viewer → Applications and Services Logs → Microsoft → Windows → Diagnosis-PLA → Operational**.

**Evidências:** P22 a P25.

### 3.13 Tolerância a falhas

1. Configurar o reinício automático dos serviços do IIS. Os serviços são reiniciados 1 minuto após cada falha, e o contador de falhas é zerado após 1 dia:

```powershell
sc.exe failure W3SVC reset= 86400 actions= restart/60000/restart/60000/restart/60000
sc.exe failure WAS   reset= 86400 actions= restart/60000/restart/60000/restart/60000
sc.exe qfailure W3SVC
```

2. Manter o pool de aplicativos sempre ativo (a proteção Rapid-Fail permanece habilitada por padrão):

```powershell
Set-ItemProperty IIS:\AppPools\AprendIA-Pool -Name startMode -Value AlwaysRunning
```

**Evidência:** P26.

### 3.14 Teste de falha

1. No cliente, manter em execução um monitor que consulta a aplicação a cada 3 segundos e registra o resultado:

```powershell
while ($true) {
    $h = Get-Date -Format 'HH:mm:ss'
    try { $c = (Invoke-WebRequest http://app.aprendia.local -UseBasicParsing -TimeoutSec 3).StatusCode } catch { $c = $_.Exception.Message }
    "$h  $c" | Tee-Object C:\Evidencias\cli-teste-falha.txt -Append
    Start-Sleep 3
}
```

2. No servidor, encerrar à força o processo do serviço W3SVC, simulando uma queda:

```powershell
$svc = Get-CimInstance Win32_Service -Filter "Name='W3SVC'"
taskkill /F /PID $svc.ProcessId
```

3. Resultado observado:
   - o monitor passou de **200** para falhas de conexão;
   - o Windows registrou o evento **7031** e reiniciou o W3SVC e o WAS após o intervalo configurado;
   - o monitor voltou a **200** em cerca de 1 minuto, sem intervenção manual.

> O encerramento por `Stop-Process` é registrado como parada normal (evento 7036) e não aciona a recuperação. Por esse motivo, o teste utiliza `taskkill /F`.

**Evidências:** P27 e P28.

### 3.15 Auditoria e acompanhamento

1. Criar a GPO `GPO_SRV_Auditoria`.
2. Em **Computer Configuration → Policies → Windows Settings → Security Settings → Advanced Audit Policy Configuration → Audit Policies**, definir **Success and Failure** para:
   - Account Logon → Audit Kerberos Authentication Service;
   - Logon/Logoff → Audit Logon;
   - Object Access → Audit File System.
3. Vincular a GPO à OU **Domain Controllers** e conferir:

```powershell
gpupdate /force
auditpol /get /category:"Account Logon","Logon/Logoff","Object Access"
```

4. Configurar a auditoria (SACL) da pasta Financeiro:

```powershell
$acl = Get-Acl D:\Compartilhamentos\Financeiro -Audit
$regra = New-Object System.Security.AccessControl.FileSystemAuditRule('Everyone', 'CreateFiles, WriteData, Delete', 'ContainerInherit, ObjectInherit', 'None', 'Success, Failure')
$acl.AddAuditRule($regra)
Set-Acl D:\Compartilhamentos\Financeiro $acl
```

5. No Visualizador de Eventos, criar o modo de exibição personalizado `AprendIA - Auditoria e Operacao`, com os eventos:
   - 4624, 4625, 4771 e 4663, do log Security;
   - 7031, do log System;
   - 2031, do log Diagnosis-PLA/Operational.
6. Gerar os eventos de teste:
   - uma tentativa de logon do usuário `aluno` com senha incorreta, que gera o evento **4771**;
   - a gravação de um arquivo por `ana.financeiro` na pasta Financeiro, que gera o evento **4663**.
7. Para o acompanhamento da aplicação, utilizar:
   - o log W3C do IIS (`C:\inetpub\logs\LogFiles\W3SVC2`);
   - o log `HTTPERR` do Windows (`C:\Windows\System32\LogFiles\HTTPERR`), onde ficam as respostas 503 do período de indisponibilidade.

**Evidências:** P29 a P33.

### 3.16 Validação final

No servidor:

```powershell
hostname; ipconfig /all
nslookup app.aprendia.local
Get-WindowsFeature AD-Domain-Services, DNS, FS-FileServer, FS-DFS-Namespace, Web-Server
Get-Service NTDS, DNS, LanmanServer, Dfs, W3SVC, TermService
```

No cliente:

```powershell
hostname; ipconfig /all
nslookup app.aprendia.local
80, 445, 3389 | ForEach-Object { Test-NetConnection srv01.aprendia.local -Port $_ }
```

**Evidências:** P34, P35 e as saídas em `evidencias/saidas/`.

### 3.17 Publicação da aplicação web

A aplicação web do AprendIA é estática (HTML, CSS e JavaScript, pasta `app/` deste repositório) e não depende de runtime adicional nem de acesso à internet. Os tipos `.html`, `.css` e `.js` já são atendidos pelo IIS sem configuração extra.

1. Preservar a página anterior e copiar os arquivos da aplicação para a pasta do site:

```powershell
New-Item C:\Sites\Backup -ItemType Directory -Force
Copy-Item C:\Sites\AprendIA\index.html C:\Sites\Backup\index-provisorio.html
Copy-Item <pasta-da-aplicacao>\* C:\Sites\AprendIA\ -Force
```

2. Verificar a publicação:

```powershell
Get-ChildItem C:\Sites\AprendIA
Get-Website AprendIA
(Invoke-WebRequest http://app.aprendia.local -UseBasicParsing).StatusCode
```

3. No cliente, acessar `http://app.aprendia.local`, preencher a identificação do aluno, responder às 24 questões e conferir o resultado do diagnóstico.

**Funcionamento da aplicação:**
- **Correção:** cada resposta é comparada ao gabarito; cada conteúdo recebe de 0 a 3 acertos.
- **Situação do conteúdo:** 3 acertos = sem lacuna; 2 = a confirmar pelo professor; 0 ou 1 = lacuna.
- **Nível por disciplina:** 0 lacunas = adequado; 1 ou 2 = em desenvolvimento; 3 ou 4 = abaixo do esperado.
- **Reforço:** os conteúdos com lacuna aparecem primeiro, seguidos dos que estão a confirmar, cada um com uma estratégia de estudo.

**Evidências:** P36 a P40.

## 4. Pontos de restauração (snapshots)

| Máquina | Snapshots |
|---|---|
| SRV-AprendIA-GS | `01_INSTALACAO_LIMPA` → `Antes_ADDS` → `Depois_AD` → `Antes_FileServer` |
| CLI-AprendIA-GS | `Cliente_Antes_Dominio` → `Depois_AD` |

Os snapshots constituem pontos de retorno e não substituem uma política de backup.

## 5. Diagnóstico de problemas

| Sintoma | Verificação |
|---|---|
| Cliente sem endereço (169.254.x.x) | escopo DHCP ativo e autorizado; máquina virtual na rede `AprendIA-NAT` |
| Ping sem resposta | regra de ICMP no firewall do servidor (seção 3.3) |
| Domínio não localizado | DNS do cliente apontando para 192.168.234.10; `nslookup -type=SRV _ldap._tcp.dc._msdcs.aprendia.local` |
| Acesso negado inesperado | permissão de compartilhamento e NTFS (vale a mais restritiva); novo logon após inclusão em grupo |
| Site indisponível | `Test-NetConnection app.aprendia.local -Port 80`; estado do site e do pool; binding com o nome correto |
| GPO não aplicada | vínculo à OU correta; `gpupdate /force`; `gpresult /r` |
| Comando sem efeito ou *Access denied* | PowerShell executado como administrador |
