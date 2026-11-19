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
| Escopo DHCP | `CLIENTES-LAB`: 192.168.234.100 a 192.168.234.200 |
| Domínio / NetBIOS | `aprendia.local` / `APRENDIA` |
| Endereço da aplicação | `http://app.aprendia.local` |

> Na NAT Network do VirtualBox, o gateway corresponde sempre ao primeiro endereço da rede (.1). O valor .2 apresentado em aula refere-se ao ambiente VMware.

### 2.3 Convenções

- Todo o trabalho é feito pelas telas: o **VirtualBox Manager** para criar e alterar as máquinas virtuais, e os consoles gráficos do Windows (**Server Manager** e as ferramentas do menu **Tools**) para configurar o sistema. Comandos aparecem apenas onde o Windows não oferece tela equivalente, e isso é indicado no passo.
- O sistema está em inglês; os nomes de menus e botões são citados como aparecem na tela.
- Para enviar **Ctrl + Alt + Del** à máquina virtual, use o menu **Input → Keyboard → Insert Ctrl-Alt-Del** da janela da VM.
- Os snapshots são criados com a máquina virtual **desligada** (**Start → Power → Shut down** dentro do Windows).
- Recomendado: após a instalação de cada VM, usar **Devices → Insert Guest Additions CD image…**, executar o instalador pelo Explorador de Arquivos e reiniciar. Isso ajusta a resolução da tela e habilita a área de transferência compartilhada (**Devices → Shared Clipboard → Bidirectional**).

## 3. Procedimentos

### 3.1 Rede virtual

1. No VirtualBox Manager, abrir **File → Tools → Network Manager**.
2. Na aba **NAT Networks**, clicar em **Create**.
3. Em **General Options**, preencher:
   - **Name:** `AprendIA-NAT`;
   - **IPv4 Prefix:** `192.168.234.0/24`;
   - **Enable DHCP:** desmarcado (o DHCP será o do servidor).
4. Clicar em **Apply** e conferir a rede na lista.

**Evidência:** P01.

### 3.2 Máquina virtual do servidor

**Criação pelo assistente:**

1. No VirtualBox Manager, clicar em **New**.
2. **Virtual machine Name and Operating System:**
   - **Name:** `SRV-AprendIA-GS`;
   - **Folder:** a pasta escolhida para as máquinas virtuais;
   - **ISO Image:** a ISO do Windows Server 2025;
   - **Type / Version:** Microsoft Windows / Windows Server 2025 (64-bit);
   - marcar **Skip Unattended Installation**, para conduzir a instalação manualmente.
3. **Hardware:** **Base Memory** `4096 MB`, **Processors** `2`; manter **EFI** habilitado, como sugerido.
4. **Virtual Hard disk:** **Create a Virtual Hard Disk Now**, `60 GB`, tipo **VDI**, com **Pre-allocate Full Size** desmarcado (disco dinâmico).
5. Revisar o resumo e clicar em **Finish**.

**Ajuste da rede:**

6. Com a VM selecionada, abrir **Settings → Network → Adapter 1**.
7. Manter **Enable Network Adapter** marcado e escolher **Attached to:** `NAT Network`, **Name:** `AprendIA-NAT`. Clicar em **OK**.
8. Conferir no painel de detalhes da VM: 4096 MB, 2 CPUs, disco de 60 GB, ISO no drive óptico e rede NAT Network.

**Instalação do Windows:**

9. Clicar em **Start**. Se aparecer *Press any key to boot from CD or DVD*, clicar na janela e pressionar uma tecla.
10. Escolher idioma e teclado, **Install Windows Server**, e **I don't have a product key**.
11. Selecionar **Windows Server 2025 Standard Evaluation (Desktop Experience)**. Sem *Desktop Experience* o sistema é instalado sem interface gráfica (Server Core).
12. Aceitar a licença, selecionar o **Disk 0** (60 GB) e clicar em **Install**.
13. Ao final, definir a senha da conta **Administrator** e entrar no sistema (Ctrl + Alt + Del pelo menu **Input**). O **Server Manager** abre automaticamente.

### 3.3 Preparação do servidor

1. **Nome:** no **Server Manager → Local Server**, clicar no nome ao lado de **Computer name → Change…**, digitar `SRV01`, confirmar e escolher **Restart Now**.
2. **Endereço estático:** pressionar **Win + R**, abrir `ncpa.cpl`, clicar com o botão direito em **Ethernet → Properties → Internet Protocol Version 4 (TCP/IPv4) → Properties** e preencher:
   - **Use the following IP address:** `192.168.234.10`, máscara `255.255.255.0`, gateway `192.168.234.1`;
   - **Preferred DNS server:** `192.168.234.10`.
3. **Resposta ao ping (ICMP), bloqueada por padrão:** abrir **Server Manager → Tools → Windows Defender Firewall with Advanced Security → Inbound Rules → New Rule…** e seguir o assistente:
   - **Rule Type:** *Custom*; **Program:** *All programs*;
   - **Protocol type:** *ICMPv4* → **Customize…** → *Specific ICMP types* → **Echo Request**;
   - **Scope:** qualquer endereço; **Action:** *Allow the connection*; **Profile:** todos;
   - **Name:** `AprendIA - Permitir Ping (ICMPv4)`.
4. Conferir em **ncpa.cpl → Ethernet → Details** que o IPv4, a máscara, o gateway e o DNS estão corretos.

Desligar o servidor e, no VirtualBox Manager, abrir o menu ao lado do nome da VM → **Snapshots** → **Take**, com o nome `01_INSTALACAO_LIMPA`.

### 3.4 Serviços de DNS e DHCP

1. No **Server Manager → Manage → Add Roles and Features**, escolher *Role-based or feature-based installation*, selecionar o `SRV01` e marcar **DNS Server** e **DHCP Server** (aceitando **Add Features** em cada um). Avançar até **Install**.
2. Abrir **Tools → DHCP**, expandir o servidor, clicar com o botão direito em **IPv4 → New Scope…** e preencher o assistente:
   - **Name:** `CLIENTES-LAB`;
   - **IP Address Range:** de `192.168.234.100` a `192.168.234.200`, máscara `255.255.255.0`;
   - **Exclusions:** nenhuma; **Lease Duration:** 8 dias;
   - **Router (Default Gateway) — opção 003:** `192.168.234.1`;
   - **Domain Name and DNS Servers — opções 015 e 006:** domínio `aprendia.local` e servidor `192.168.234.10` (o aviso de validação é esperado, pois o domínio ainda não existe);
   - **WINS:** em branco.
3. Escolher *Yes, I want to activate this scope now* e concluir. Em **Scope Options**, conferir as opções 003, 006 e 015.

> A zona `aprendia.local` **não** deve ser criada nesta etapa. Ela é criada automaticamente, integrada ao Active Directory, durante a promoção do controlador de domínio (seção 3.6). A criação antecipada gera uma zona sem atualização dinâmica, na qual o controlador de domínio não consegue registrar seus registros SRV.

### 3.5 Máquina virtual do cliente

1. No VirtualBox Manager, repetir o assistente **New** da seção 3.2 com o nome `CLI-AprendIA-GS`, os mesmos recursos (4096 MB, 2 vCPUs, 60 GB) e, em **Settings → Network → Adapter 1**, a mesma rede `AprendIA-NAT`.
2. Instalar o sistema como na seção 3.2 e renomear a máquina para `CLIENTE01` (**Server Manager → Local Server → Computer name → Change…**).
3. Em `ncpa.cpl → Ethernet → Properties → IPv4`, marcar **Obtain an IP address automatically** e **Obtain DNS server address automatically**.
4. Criar no cliente a mesma regra de ping do servidor (seção 3.3, passo 3).
5. Validar o recebimento do endereço: em `ncpa.cpl`, botão direito em **Ethernet → Disable** e depois **Enable**; em seguida, **Status → Details**. Devem aparecer o IPv4 da faixa do escopo, o gateway `192.168.234.1`, o DNS e o **DHCP Server** `192.168.234.10`.
6. No servidor, em **Tools → DHCP → escopo → Address Leases**, conferir a concessão do CLIENTE01.

Desligar o cliente e criar, pelo VirtualBox Manager, o snapshot `Cliente_Antes_Dominio`.

### 3.6 Active Directory Domain Services

1. Com o servidor desligado, criar o snapshot `Antes_ADDS` pelo VirtualBox Manager e ligar o servidor.
2. **Instalação e promoção:**
   - Em **Add Roles and Features**, marcar **Active Directory Domain Services** e instalar.
   - Ao terminar, clicar em **Promote this server to a domain controller** (também disponível na bandeira amarela do Server Manager).
   - **Deployment Configuration:** *Add a new forest*, **Root domain name** `aprendia.local`.
   - **Domain Controller Options:** manter **DNS server** e **Global Catalog** marcados e definir a senha do modo de restauração (DSRM).
   - **DNS Options:** o aviso de delegação é esperado.
   - **Additional Options:** NetBIOS `APRENDIA`.
   - **Paths:** manter os padrões.
   - Executar o **Prerequisites Check** e clicar em **Install**. O servidor reinicia sozinho.
3. **Validação do controlador de domínio:**
   - Entrar com a conta do domínio (**Other user** → `APRENDIA\` seguido da conta administrativa).
   - Abrir **Tools → DNS → Forward Lookup Zones → aprendia.local** e conferir as pastas `_msdcs`, `_sites`, `_tcp` e `_udp`, além do registro A do `srv01`.
   - Em `_tcp`, o registro **_ldap** aponta para `srv01.aprendia.local`.
4. **DHCP no domínio:**
   - Na bandeira amarela do Server Manager, clicar em **Complete DHCP configuration → Commit**.
   - Em **Tools → DHCP**, clicar com o botão direito no servidor → **Authorize** e atualizar com **F5**. O ícone IPv4 fica verde.
5. **Registro DNS da aplicação:** em **DNS → aprendia.local**, botão direito → **New Host (A or AAAA)…**, com **Name** `app` e **IP address** `192.168.234.10` → **Add Host**.
6. **Estrutura organizacional:** em **Tools → Active Directory Users and Computers**, clicar com o botão direito em `aprendia.local → New → Organizational Unit` e criar:

| OU | Finalidade |
|---|---|
| `AprendIA` | raiz da organização |
| `AprendIA\Usuarios` | contas de usuários |
| `AprendIA\Computadores` | estações do domínio |
| `AprendIA\Grupos` | grupos de segurança |
| `AprendIA\Laboratorio` | testes de políticas |

7. **Grupos:** na OU `Grupos`, botão direito → **New → Group**, com escopo *Global* e tipo *Security*:

| Grupo | Finalidade |
|---|---|
| `GG_Publico_R` | leitura da pasta Publico |
| `GG_Financeiro_RW` | leitura e gravação na pasta Financeiro |
| `GG_Projetos_RW` | leitura e gravação na pasta Projetos |
| `GG_Web_Publicadores` | publicação de arquivos da aplicação web |
| `GG_Acesso_Remoto` | acesso ao servidor por Área de Trabalho Remota |

8. **Usuários de teste:**
   - Na OU `Usuarios`, botão direito → **New → User**, definir a senha e desmarcar *User must change password at next logon*.
   - Incluir cada usuário nos seus grupos pelo botão direito → **Add to a group…**

| Usuário | Grupos |
|---|---|
| `aluno` | GG_Publico_R |
| `ana.financeiro` | GG_Financeiro_RW, GG_Publico_R |
| `paulo.projetos` | GG_Projetos_RW, GG_Publico_R, GG_Web_Publicadores, GG_Acesso_Remoto |

9. **Conta administrativa:** em **Properties → Member Of → Add…**, incluí-la no grupo **Domain Admins**, para que ela também administre as estações do domínio.
10. **Ingresso do cliente:**
    - No CLIENTE01, pressionar **Win + R** e abrir `sysdm.cpl`.
    - Clicar em **Change…**, marcar **Member of: Domain**, digitar `aprendia.local` e informar a credencial administrativa do domínio.
    - Após a mensagem de boas-vindas, reiniciar.
11. **Objeto do cliente:** no **Active Directory Users and Computers**, mover o `CLIENTE01` de *Computers* para a OU `AprendIA\Computadores`, arrastando-o ou usando o botão direito → **Move**.

Desligar as duas máquinas e criar, pelo VirtualBox Manager, o snapshot `Depois_AD` em cada uma.

**Evidências:** P02 a P05.

### 3.7 Servidor de arquivos e permissões NTFS

1. **Novo disco, com o servidor desligado:**
   - No VirtualBox Manager, criar o snapshot `Antes_FileServer`.
   - Abrir **Settings → Storage**, selecionar **Controller: SATA** e clicar no ícone **Adds hard disk** → **Create**.
   - Escolher **VDI**, **Dynamically allocated**, `20 GB`, nome `SRV-AprendIA-GS-dados` → **Finish → Choose → OK**.
2. **Volume de dados, com o servidor ligado:** abrir **Win + R** → `diskmgmt.msc`.
   - Na janela *Initialize Disk*, escolher **GPT** para o novo disco.
   - A unidade de DVD, que ocupa a letra D:, passa para Z:: botão direito em **CD-ROM 0 → Change Drive Letter and Paths → Change → Z:**.
   - No novo disco, botão direito → **New Simple Volume**, com tamanho total, letra **D**, sistema **NTFS**, rótulo `DADOS` e formatação rápida.
3. **Função e pastas:**
   - Em **Add Roles and Features → File and Storage Services → File and iSCSI Services**, marcar **File Server** e instalar.
   - No Explorador de Arquivos, criar `D:\Compartilhamentos` com as subpastas `Publico`, `Financeiro` e `Projetos`.
4. Aplicar a matriz de acesso:

| Pasta | Compartilhamento | NTFS |
|---|---|---|
| Publico | Authenticated Users: Leitura | Domain Users: Leitura e execução |
| Financeiro | Authenticated Users: Alteração | GG_Financeiro_RW: Modificar |
| Projetos | Authenticated Users: Alteração | GG_Projetos_RW: Modificar |

Para cada pasta (exemplo: Financeiro):

- **Compartilhamento:**
  - Botão direito na pasta → **Properties → Sharing → Advanced Sharing…** → **Share this folder**.
  - Em **Permissions**, remover **Everyone**, adicionar `Authenticated Users` e marcar **Change** (no Publico, apenas **Read**).
- **NTFS:**
  - Na aba **Security → Advanced**, clicar em **Disable inheritance → Convert inherited permissions…**.
  - Remover as entradas **Users** e **CREATOR OWNER**, mantendo SYSTEM e Administrators com **Full control**.
  - Clicar em **Add → Select a principal** → `GG_Financeiro_RW` e marcar **Modify** (no Publico, `Domain Users` com **Read & execute**).

5. Conferir a configuração:
   - em **Server Manager → File and Storage Services → Shares**, os três compartilhamentos;
   - na aba **Security → Advanced** de cada pasta, as permissões efetivas.
6. **Teste no cliente:**
   - Como `aluno`, abrir `\\SRV01\Publico` pelo Explorador de Arquivos e tentar criar um arquivo, o que deve ser negado. Depois abrir `\\SRV01\Financeiro`, também negado.
   - Como `ana.financeiro`, criar, editar e apagar um arquivo no Financeiro.

**Evidências:** P06 a P12.

### 3.8 Servidor Web (IIS)

1. **Função e pasta do site:**
   - Em **Add Roles and Features**, marcar **Web Server (IIS)** e instalar.
   - No Explorador de Arquivos, criar `C:\Sites\AprendIA` e colocar nela a página inicial da aplicação (`index.html`).
2. **Pool e site:** abrir **Tools → Internet Information Services (IIS) Manager**.
   - **Application Pools → Add Application Pool…**, com **Name** `AprendIA-Pool` e **.NET CLR version** *No Managed Code*.
   - **Sites → Add Website…**:
     - **Site name:** `AprendIA`;
     - **Application pool:** `AprendIA-Pool`;
     - **Physical path:** `C:\Sites\AprendIA`;
     - **Binding:** `http`, porta `80`, **Host name** `app.aprendia.local`.
3. No **IIS Manager**, conferir o site em execução e o binding (**Bindings…**).
4. No cliente, acessar `http://app.aprendia.local` pelo navegador.

**Evidências:** P13 a P15.

### 3.9 Política de Grupo (GPO)

1. No console **Group Policy Management**, criar a GPO `GPO_USR_BloquearPainelControle`.
2. Editar a GPO e definir **User Configuration → Policies → Administrative Templates → Control Panel → Prohibit access to Control Panel and PC settings** como **Enabled**.
3. Vincular a GPO à OU `AprendIA\Usuarios` (botão direito na OU → **Link an Existing GPO…**).
4. No cliente, encerrar a sessão e entrar como `aluno`, para que a política de usuário seja aplicada no logon. Opcionalmente, conferir a GPO aplicada em **Win + R** → `rsop.msc`.

O Painel de Controle deve exibir a mensagem de restrição.

**Evidências:** P16 e P17.

### 3.10 DFS Namespaces

1. Em **Add Roles and Features → File and Storage Services → File and iSCSI Services**, marcar **DFS Namespaces** e instalar.
2. No console **DFS Management**, clicar com o botão direito em **Namespaces → New Namespace…** e criar o namespace baseado em domínio `\\aprendia.local\Arquivos`, em modo Windows Server 2008, hospedado no SRV01.
3. Botão direito no namespace → **New Folder…**, criando uma pasta para cada compartilhamento:

| Pasta do namespace | Destino |
|---|---|
| `Publico` | `\\SRV01\Publico` |
| `Financeiro` | `\\SRV01\Financeiro` |
| `Projetos` | `\\SRV01\Projetos` |

4. No cliente, abrir `\\aprendia.local\Arquivos` pelo Explorador de Arquivos e conferir as três pastas.

O acesso pelo namespace mantém as permissões NTFS das pastas de origem.

**Evidências:** P18 e P19.

### 3.11 Acesso remoto (Remote Desktop Services)

Como o SRV01 é controlador de domínio, não se instala o RD Session Host, por recomendação da Microsoft. Adota-se a Área de Trabalho Remota com autenticação em nível de rede (NLA), restrita a um grupo.

1. **Habilitar:**
   - Em **Server Manager → Local Server**, clicar em **Remote Desktop: Disabled**.
   - Na aba **Remote**, marcar **Allow remote connections to this computer** e **Allow connections only from computers running Remote Desktop with Network Level Authentication**.
   - Confirmar o aviso. O Windows libera a regra de firewall correspondente.
2. No **Active Directory Users and Computers**, abrir **Builtin → Remote Desktop Users → Members → Add…** e incluir `GG_Acesso_Remoto`.
3. Criar a GPO `GPO_SRV_AcessoRemoto`:
   - **Caminho:** Computer Configuration → Policies → Windows Settings → Security Settings → Local Policies → User Rights Assignment → **Allow log on through Remote Desktop Services**;
   - **Valor:** `Administrators` e `APRENDIA\GG_Acesso_Remoto`.
4. Vincular a GPO à OU **Domain Controllers**. A política vale após o ciclo de atualização (5 minutos em controladores de domínio) ou após reiniciar o servidor.
5. Testar a partir do cliente com o aplicativo **Remote Desktop Connection**, no computador `srv01.aprendia.local`:
   - `paulo.projetos` deve obter a sessão;
   - `aluno` deve ser recusado.

**Evidências:** P20 e P21.

### 3.12 Monitoramento de recursos

1. Abrir **Win + R** → `perfmon` e criar os três conjuntos de alertas em **Data Collector Sets → User Defined**. Exemplo para a CPU:
   - Botão direito → **New → Data Collector Set**, com o nome `AprendIA-Alerta-CPU` e a opção **Create manually (Advanced)**.
   - Escolher **Performance Counter Alert**.
   - Adicionar o contador **Processor(_Total)\% Processor Time** com **Alert when: Above** `80` → **Finish**.
   - Abrir **Properties** do coletor criado dentro do conjunto:
     - na aba **Alerts**, definir **Sample interval** de `15` segundos;
     - na aba **Alert Action**, marcar **Log an entry in the application event log**.
2. Repetir o processo para os outros recursos:

| Conjunto | Contador | Condição |
|---|---|---|
| `AprendIA-Alerta-CPU` | Processor(_Total)\% Processor Time | acima de 80 |
| `AprendIA-Alerta-Memoria` | Memory\% Committed Bytes In Use | acima de 80 |
| `AprendIA-Alerta-Disco` | LogicalDisk(C:)\% Free Space e LogicalDisk(D:)\% Free Space | abaixo de 15 |

3. Clicar com o botão direito em cada conjunto → **Start**. Após uma reinicialização do servidor, os conjuntos devem ser iniciados novamente.
4. Validar os alertas provocando carga controlada:

| Recurso | Procedimento |
|---|---|
| CPU | dois processos de cálculo contínuo durante cerca de 75 segundos |
| Memória | alocação de aproximadamente 3,4 GB durante 60 segundos |
| Disco | criação de um arquivo de 19 GB em D: (`fsutil file createnew`, sem tela equivalente), removido em seguida |

5. Acompanhar a carga no **Task Manager → Performance** e conferir os eventos **2031** em **Event Viewer → Applications and Services Logs → Microsoft → Windows → Diagnosis-PLA → Operational**.

**Evidências:** P22 a P25.

### 3.13 Tolerância a falhas

1. **Reinício automático dos serviços do IIS:** abrir **Win + R** → `services.msc` e, em **World Wide Web Publishing Service → Properties → Recovery**, definir:
   - **First failure**, **Second failure** e **Subsequent failures:** *Restart the Service*;
   - **Reset fail count after:** 1 dia;
   - **Restart service after:** 1 minuto.
2. Repetir a mesma configuração em **Windows Process Activation Service**.
3. **Pool sempre ativo:** no **IIS Manager → Application Pools → AprendIA-Pool → Advanced Settings…**, definir **Start Mode** como *AlwaysRunning*. A proteção **Rapid-Fail Protection** permanece habilitada por padrão.

**Evidência:** P26.

### 3.14 Teste de falha

1. **Monitor no cliente:** manter em execução um monitor que consulta a aplicação a cada 3 segundos e registra o resultado. Este é o único trecho do roteiro em que não há tela equivalente, por isso é usado um script no PowerShell:

```powershell
while ($true) {
    $h = Get-Date -Format 'HH:mm:ss'
    try { $c = (Invoke-WebRequest http://app.aprendia.local -UseBasicParsing -TimeoutSec 3).StatusCode } catch { $c = $_.Exception.Message }
    "$h  $c" | Tee-Object C:\Evidencias\cli-teste-falha.txt -Append
    Start-Sleep 3
}
```

2. **Queda simulada no servidor:**
   - Abrir o **Task Manager → Services**, clicar com o botão direito em **W3SVC → Go to details**.
   - No processo destacado, usar o botão direito → **End task** e confirmar.
   - O processo é encerrado à força, como em uma falha real.
3. Resultado observado:
   - o monitor passou de **200** para falhas de conexão;
   - o Windows registrou o evento **7031** e reiniciou o W3SVC e o WAS após o intervalo configurado;
   - o monitor voltou a **200** em cerca de 1 minuto, sem intervenção manual.

> Parar o serviço pelo botão **Stop** do `services.msc` é registrado como parada normal (evento 7036) e não aciona a recuperação. Por esse motivo, o teste encerra o processo pelo Task Manager.

**Evidências:** P27 e P28.

### 3.15 Auditoria e acompanhamento

1. Criar a GPO `GPO_SRV_Auditoria`.
2. Em **Computer Configuration → Policies → Windows Settings → Security Settings → Advanced Audit Policy Configuration → Audit Policies**, definir **Success and Failure** para:
   - Account Logon → Audit Kerberos Authentication Service;
   - Logon/Logoff → Audit Logon;
   - Object Access → Audit File System.
3. Vincular a GPO à OU **Domain Controllers** e conferir as configurações na aba **Settings** da GPO, no **Group Policy Management**.
4. **Auditoria (SACL) da pasta Financeiro:** botão direito em `D:\Compartilhamentos\Financeiro` → **Properties → Security → Advanced → Auditing → Add**.
   - **Principal:** `Everyone`;
   - **Type:** *All*;
   - **Applies to:** *This folder, subfolders and files*;
   - em **Show advanced permissions**, marcar **Create files / write data** e **Delete**.
5. No **Event Viewer**, clicar em **Create Custom View…** e criar o modo de exibição `AprendIA - Auditoria e Operacao`, com os eventos:
   - 4624, 4625, 4771 e 4663, do log Security;
   - 7031, do log System;
   - 2031, do log Diagnosis-PLA/Operational.
6. Gerar os eventos de teste:
   - uma tentativa de logon do usuário `aluno` com senha incorreta, que gera o evento **4771**;
   - a gravação de um arquivo por `ana.financeiro` na pasta Financeiro, que gera o evento **4663**.
7. Para o acompanhamento da aplicação, abrir pelo Explorador de Arquivos:
   - o log W3C do IIS (`C:\inetpub\logs\LogFiles\W3SVC2`);
   - o log `HTTPERR` do Windows (`C:\Windows\System32\LogFiles\HTTPERR`), onde ficam as respostas 503 do período de indisponibilidade.

**Evidências:** P29 a P33.

### 3.16 Validação final

No servidor:

- **Server Manager → Dashboard:** as funções AD DS, DNS, DHCP, File and Storage Services e IIS aparecem sem alertas.
- **services.msc:** os serviços Active Directory Domain Services, DNS Server, Server, DFS Namespace, World Wide Web Publishing Service e Remote Desktop Services estão *Running*.
- **ncpa.cpl → Ethernet → Details:** o IP é 192.168.234.10 e o DNS é 192.168.234.10.

No cliente:

- **ncpa.cpl → Ethernet → Details:** endereço recebido do DHCP do SRV01.
- **Navegador:** `http://app.aprendia.local` abre a aplicação (porta 80).
- **Explorador de Arquivos:** `\\SRV01` abre os compartilhamentos (porta 445).
- **Remote Desktop Connection:** conecta ao `srv01.aprendia.local` com um usuário autorizado (porta 3389).

**Evidências:** P34, P35 e as saídas em `evidencias/saidas/`.

### 3.17 Publicação da aplicação web

A aplicação web do AprendIA é estática (HTML, CSS e JavaScript, pasta `app/` deste repositório) e não depende de runtime adicional nem de acesso à internet. Os tipos `.html`, `.css` e `.js` já são atendidos pelo IIS sem configuração extra.

1. **Cópia dos arquivos, pelo Explorador de Arquivos:**
   - Criar `C:\Sites\Backup` e copiar para ela o `index.html` provisório, com o nome `index-provisorio.html`.
   - Copiar o conteúdo da pasta `app/` para `C:\Sites\AprendIA`, escolhendo **Replace the files in the destination**.
2. **Verificação:** no **IIS Manager**, selecionar o site `AprendIA` → **Explore** para conferir os arquivos e **Browse app.aprendia.local on \*:80** para abrir a aplicação.
3. No cliente, acessar `http://app.aprendia.local`, preencher a identificação do aluno, responder às 24 questões e conferir o resultado do diagnóstico.

**Funcionamento da aplicação:**
- **Correção:** cada resposta é comparada ao gabarito; cada conteúdo recebe de 0 a 3 acertos.
- **Situação do conteúdo:** 3 acertos = sem lacuna; 2 = a confirmar pelo professor; 0 ou 1 = lacuna.
- **Nível por disciplina:** 0 lacunas = adequado; 1 ou 2 = em desenvolvimento; 3 ou 4 = abaixo do esperado.
- **Reforço:** os conteúdos com lacuna aparecem primeiro, seguidos dos que estão a confirmar, cada um com uma estratégia de estudo.

**Evidências:** P36 a P40.

## 4. Pontos de restauração (snapshots)

Todos os snapshots são criados no VirtualBox Manager (menu ao lado do nome da VM → **Snapshots** → **Take**), com a máquina desligada. Para voltar a um ponto, basta selecioná-lo na mesma tela e clicar em **Restore**.

| Máquina | Snapshots |
|---|---|
| SRV-AprendIA-GS | `01_INSTALACAO_LIMPA` → `Antes_ADDS` → `Depois_AD` → `Antes_FileServer` |
| CLI-AprendIA-GS | `Cliente_Antes_Dominio` → `Depois_AD` |

Os snapshots constituem pontos de retorno e não substituem uma política de backup.

## 5. Diagnóstico de problemas

| Sintoma | Verificação |
|---|---|
| Cliente sem endereço (169.254.x.x) | no console DHCP, escopo ativo e servidor autorizado; no VirtualBox, **Settings → Network** da VM na rede `AprendIA-NAT` |
| Ping sem resposta | regra de ICMP no **Windows Defender Firewall with Advanced Security** do servidor (seção 3.3) |
| Domínio não localizado | em `ncpa.cpl`, DNS do cliente apontando para 192.168.234.10; no console DNS, registro **_ldap** em `aprendia.local → _tcp` |
| Acesso negado inesperado | abas **Sharing** e **Security** da pasta (vale a permissão mais restritiva); novo logon após inclusão em grupo |
| Site indisponível | no **IIS Manager**, estado do site e do pool e binding com o nome correto; no `services.msc`, W3SVC em execução |
| GPO não aplicada | vínculo à OU correta no **Group Policy Management**; novo logon do usuário; conferência em `rsop.msc` |
| VM não inicia pela ISO | no VirtualBox, **Settings → Storage → Optical Drive** com a ISO e **Settings → System → Boot Order** |
