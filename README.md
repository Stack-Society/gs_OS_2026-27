# AprendIA — Infraestrutura Windows Server (Operating Systems)

Entrega da disciplina **Operating Systems** da Global Solution 2026.2 (CitizenTech).

Este repositório documenta a infraestrutura Windows Server que sustenta o AprendIA: os serviços do semestre (DNS, Active Directory, File Server, IIS, GPO, RDS e DFS), o monitoramento de CPU, memória e disco, os logs de auditoria e o teste de falha. O vídeo de demonstração está em [`video/`](video/). A documentação completa, com todos os prints comentados, está em [`DOCUMENTACAO_INFRAESTRUTURA.pdf`](DOCUMENTACAO_INFRAESTRUTURA.pdf), e o passo a passo da implantação, feito pelas telas do VirtualBox e do Windows, em [`ROTEIRO_CONFIGURACAO.md`](ROTEIRO_CONFIGURACAO.md).

## Sumário

1. [Integrantes](#integrantes)
2. [Ficha da CitizenTech](#ficha-da-citizentech)
3. [O projeto AprendIA](#o-projeto-aprendia)
4. [Papel da infraestrutura](#papel-da-infraestrutura)
5. [Topologia](#topologia)
6. [Serviços configurados](#serviços-configurados)
7. [Aplicação web](#aplicação-web)
8. [Permissões e testes de acesso](#permissões-e-testes-de-acesso)
9. [Monitoramento](#monitoramento)
10. [Tolerância e teste de falha](#tolerância-e-teste-de-falha)
11. [Logs de auditoria e acompanhamento](#logs-de-auditoria-e-acompanhamento)
12. [Decisões do laboratório](#decisões-do-laboratório)
13. [Evidências](#evidências)
14. [Vídeo](#vídeo)

## Integrantes

| Nome | RM |
|---|---|
| Leonardo Fernandes Mesquita | RM:559623 |
| Vitor de Lima Domingues | RM:561008 |
| Giovanni Romano Provazi | RM:560434 |
| Caio Berardo de Araújo | RM:560357 |
| Felipe Carlos Abreu | RM:559476 |

## Ficha da CitizenTech

| Campo | Preenchimento |
|---|---|
| Nome da CitizenTech | *AprendIA* |
| Cidade e bairro | São Paulo |
| Cidadão beneficiado | Alunos do 1º ao 5º ano e seus professores |
| Problema, em uma frase | Professores não têm um jeito rápido e padronizado de saber em quais conteúdos cada aluno está abaixo do esperado para a sua série, nem o que fazer a respeito. |
| Como funciona | O aluno responde a um questionário da sua série (24 questões de Língua Portuguesa e Matemática). O sistema corrige, um modelo de Machine Learning estima a chance de lacuna em cada um dos 8 conteúdos e gera os insights: nível por disciplina, conteúdos a reforçar em ordem de urgência e uma estratégia de estudo para cada um. Casos duvidosos ficam para o professor confirmar. |
| O que cada parte faz | **IA (Python):** modelo treinado e exportado em ONNX. **API Java:** cadastro de escolas e alunos, correção, execução do modelo, insights e histórico, com banco Oracle. **Infraestrutura (este repositório):** servidor Windows que hospeda a aplicação web, com identidade, arquivos, políticas, acesso remoto, monitoramento, auditoria e recuperação de falhas. |
| Link do repositório | *https://github.com/Stack-Society/gs_OS_2026-27* |
| Indicador de impacto | % de alunos com diagnóstico no início do ano; tempo até a intervenção; % de lacunas superadas no questionário seguinte |
| ODS conectados | ODS 4 (Educação de qualidade) e ODS 10 (Redução das desigualdades) |

## O projeto AprendIA

No início do ano, o professor dos anos iniciais precisa descobrir em quais conteúdos cada aluno está abaixo do esperado. Sem uma ferramenta, isso depende de provas corrigidas à mão e da percepção de cada professor.

O AprendIA aplica um questionário curto e padronizado por série e devolve ao professor, em segundos:

- o **nível** do aluno em Língua Portuguesa e em Matemática;
- os **conteúdos com lacuna**, em ordem de urgência;
- uma **estratégia de estudo** para cada conteúdo a reforçar;
- os **casos duvidosos**, que o professor confirma, sem que a IA decida sozinha.

```
aluno responde 24 questões ──► correção ──► modelo de ML (ONNX) ──► lacuna / sem lacuna / a confirmar ──► insights para o professor
```

| Disciplina | Conteúdos avaliados |
|---|---|
| Língua Portuguesa | decodificação, localizar informação, inferência, ortografia |
| Matemática | números, operações, geometria, grandezas e medidas |

As outras partes da solução são o **modelo de IA em Python** (regressão logística por conteúdo, exportada em ONNX) e a **API REST em Java** (Spring Boot e Oracle), que corrige, executa o modelo e grava os diagnósticos.

## Papel da infraestrutura

A infraestrutura é o ambiente onde o AprendIA roda dentro de uma escola ou secretaria de educação:

| Necessidade da escola | Serviço que atende |
|---|---|
| Acessar a aplicação por um nome, sem decorar IP | **DNS**: `app.aprendia.local` |
| Cada pessoa com o seu login e o seu grupo | **Active Directory**: domínio `aprendia.local` |
| Guardar arquivos por setor, com acesso controlado | **File Server** com permissões NTFS |
| Um caminho único para os arquivos, independente do servidor | **DFS**: `\\aprendia.local\Arquivos` |
| Hospedar a aplicação web | **IIS**: site `AprendIA` |
| Padronizar e proteger as estações | **GPO** |
| Administração remota só por quem pode | **RDS** (Área de Trabalho Remota com NLA) |
| Saber quando o servidor está sobrecarregado | **Monitor de Desempenho** com alertas |
| Voltar sozinho depois de uma falha | **Recuperação automática** dos serviços do IIS |
| Saber quem fez o quê | **Auditoria** e **logs do IIS** |

## Topologia

```
                 VirtualBox — NAT Network "AprendIA-NAT" (192.168.234.0/24, gateway 192.168.234.1)
   ┌──────────────────────────────────────────┐            ┌──────────────────────────────┐
   │ SRV01  192.168.234.10 (IP fixo)          │            │ CLIENTE01  192.168.234.100   │
   │ Windows Server 2025 Standard             │◄──────────►│ (IP por DHCP do SRV01)       │
   │ AD DS · DNS · DHCP · File Server · DFS   │            │ membro do domínio            │
   │ IIS · GPO · RDP · Perfmon · Auditoria    │            │ testes de usuário            │
   └──────────────────────────────────────────┘            └──────────────────────────────┘
                         domínio aprendia.local (NetBIOS APRENDIA)
```

| Máquina | Função | Sistema | IP | Hardware |
|---|---|---|---|---|
| SRV01 | controlador de domínio e servidor de aplicação | Windows Server 2025 Standard (Desktop Experience) | 192.168.234.10 | 4 GB RAM, 2 vCPU, disco de 60 GB + disco de dados de 20 GB |
| CLIENTE01 | estação de teste no domínio | Windows Server 2025 Standard (Desktop Experience) | 192.168.234.100 (DHCP) | 4 GB RAM, 2 vCPU, 60 GB |

As duas máquinas virtuais foram criadas e ajustadas pelas telas do VirtualBox Manager (assistente **New** e **Settings**). A configuração da rede virtual está no P01.

## Serviços configurados

| Serviço | Configuração | Evidência |
|---|---|---|
| **DNS** | zona `aprendia.local` do domínio, registros `srv01` e `app` → 192.168.234.10 | P02, P14, P34, P35 |
| **Active Directory** | domínio `aprendia.local`; OU `AprendIA` com `Usuarios`, `Computadores`, `Grupos` e `Laboratorio`; grupos `GG_Publico_R`, `GG_Financeiro_RW`, `GG_Projetos_RW`, `GG_Web_Publicadores`, `GG_Acesso_Remoto`; usuários `aluno`, `ana.financeiro` e `paulo.projetos`; CLIENTE01 na OU `Computadores` | P03 a P05 |
| **DHCP** (apoio) | autorizado no AD; entrega ao cliente IP, gateway 192.168.234.1 e DNS 192.168.234.10 | P35 |
| **File Server** | disco de dados `D:` (DADOS, NTFS); compartilhamentos `Publico`, `Financeiro` e `Projetos` com herança desativada e permissões por grupo | P06 a P12 |
| **DFS** | namespace de domínio `\\aprendia.local\Arquivos` com as pastas `Publico`, `Financeiro` e `Projetos` | P18, P19 |
| **IIS** | site `AprendIA` em `C:\Sites\AprendIA`, pool `AprendIA-Pool`, binding `http` porta 80 com host `app.aprendia.local`, log W3C; hospeda a aplicação web | P13 a P15, P33, P36 a P40 |
| **GPO** | `GPO_USR_BloquearPainelControle` (OU Usuarios), `GPO_SRV_AcessoRemoto` e `GPO_SRV_Auditoria` (OU Domain Controllers) | P16, P17, P29 |
| **RDS** | Área de Trabalho Remota com NLA; direito de logon remoto só para `Administrators` e `GG_Acesso_Remoto`, concedido por GPO | P20, P21 |
| **Monitoramento** | alertas de CPU, memória e disco no Monitor de Desempenho, gravando no log de eventos | P22 a P25 |
| **Recuperação** | W3SVC e WAS reiniciam sozinhos 1 minuto após uma queda; pool `AlwaysRunning` | P26 a P28 |
| **Auditoria** | logon, autenticação Kerberos e sistema de arquivos (sucesso e falha), SACL na pasta Financeiro | P29 a P33 |

## Aplicação web

A aplicação web do AprendIA está em [`app/`](app/) e publicada no IIS do SRV01, em `http://app.aprendia.local`. É uma aplicação estática (HTML, CSS e JavaScript), sem bibliotecas externas e sem dependência de internet.

| Arquivo | Função |
|---|---|
| `index.html` | estrutura das três telas: identificação, questionário e resultado |
| `styles.css` | visual, versão para celular e versão para impressão |
| `dados.js` | questionário do 3º ano (24 questões, 3 por conteúdo), gabarito e estratégias de estudo |
| `app.js` | fluxo das telas, correção e diagnóstico |

**Fluxo:** o professor informa o nome e a turma do aluno → o aluno responde a uma questão por vez → a aplicação corrige e mostra o nível em cada disciplina, a situação de cada conteúdo e os conteúdos a reforçar, com uma estratégia para cada um.

| Acertos no conteúdo | Situação | Lacunas na disciplina | Nível |
|---|---|---|---|
| 3 | sem lacuna | 0 | adequado |
| 2 | a confirmar pelo professor | 1 ou 2 | em desenvolvimento |
| 0 ou 1 | lacuna | 3 ou 4 | abaixo do esperado |

**Publicação:** os arquivos são copiados pelo Explorador de Arquivos para `C:\Sites\AprendIA`; a página anterior fica guardada em `C:\Sites\Backup`. Evidências: P36 a P40.

## Permissões e testes de acesso

Matriz aplicada (a permissão efetiva é a mais restritiva entre compartilhamento e NTFS):

| Pasta | Compartilhamento | NTFS |
|---|---|---|
| Publico | Authenticated Users: Leitura | Domain Users: Leitura e execução |
| Financeiro | Authenticated Users: Alteração | GG_Financeiro_RW: Modificar |
| Projetos | Authenticated Users: Alteração | GG_Projetos_RW: Modificar |

Em todas as pastas, SYSTEM e Administrators têm Controle total.

| Usuário | Teste | Resultado | Evidência |
|---|---|---|---|
| aluno | ler `\\SRV01\Publico` | permitido | P11 |
| aluno | criar arquivo em `\\SRV01\Publico` | negado | P11 |
| aluno | abrir `\\SRV01\Financeiro` | negado | P11 |
| ana.financeiro | criar, editar e apagar arquivo em `\\SRV01\Financeiro` | permitido | P12 |
| ana.financeiro | gravar em `\\aprendia.local\Arquivos\Financeiro` (DFS) | permitido | P19 |
| aluno | abrir o Painel de Controle | bloqueado pela GPO | P17 |
| paulo.projetos | Área de Trabalho Remota no SRV01 | permitido | P20 |
| aluno | Área de Trabalho Remota no SRV01 | negado | P21 |

## Monitoramento

| Alerta | Contador | Condição | Disparo no teste |
|---|---|---|---|
| `AprendIA-Alerta-CPU` | `\Processor(_Total)\% Processor Time` | acima de 80 | 100% |
| `AprendIA-Alerta-Memoria` | `\Memory\% Committed Bytes In Use` | acima de 80 | 94,8% |
| `AprendIA-Alerta-Disco` | `\LogicalDisk(C:)` e `(D:)\% Free Space` | abaixo de 15 | D: com 11,2% livre |

- Amostragem a cada 15 segundos.
- Cada disparo grava o evento **2031** em *Microsoft-Windows-Diagnosis-PLA/Operational* (P25).
- A carga foi provocada de propósito: dois processos de cálculo para a CPU, alocação de cerca de 3 GB para a memória e um arquivo de 19 GB no disco D:, apagado em seguida.

## Tolerância e teste de falha

**Configuração:** na aba **Recovery** do `services.msc`, os serviços **W3SVC** (IIS) e **WAS** reiniciam sozinhos 1 minuto depois de uma queda, na primeira, na segunda e nas demais falhas. No IIS Manager, o pool `AprendIA-Pool` fica em `AlwaysRunning` com Rapid-Fail Protection ligada.

**Teste:** um monitor no CLIENTE01 consultou `http://app.aprendia.local` a cada 3 segundos enquanto o processo do serviço W3SVC era encerrado à força no servidor, como numa falha real.

| Teste | Sintoma | Recuperação | Tempo fora do ar | Evidência |
|---|---|---|---|---|
| Queda forçada do serviço W3SVC | o cliente passa de **200** para *timeout* | o Windows registra o evento **7031** e reinicia W3SVC e WAS sozinho | cerca de 1 minuto (atraso configurado) | P27, P28 |

> Parar o serviço de forma "limpa" é registrado como parada normal (evento 7036) e não aciona a recuperação; por isso o teste encerra o processo à força (**End task** no Gerenciador de Tarefas), o que simula uma queda real. O P27 mostra as duas situações.

## Logs de auditoria e acompanhamento

| Política (GPO_SRV_Auditoria) | Configuração |
|---|---|
| Audit Kerberos Authentication Service | Sucesso e falha |
| Audit Logon | Sucesso e falha |
| Audit File System | Sucesso e falha |

- **SACL** na pasta `D:\Compartilhamentos\Financeiro`: criação, gravação e exclusão, por qualquer usuário.
- **Modo de exibição personalizado** *AprendIA - Auditoria e Operacao* no Visualizador de Eventos, com os eventos 4624, 4625, 4771, 4663, 7031 e 2031.

| Evento | O que registra | Exemplo no teste | Evidência |
|---|---|---|---|
| 4771 | senha errada no logon de domínio (Kerberos) | `aluno`, a partir de 192.168.234.100 | P31 |
| 4663 | acesso a arquivo auditado | `ana.financeiro` gravando `relatorio-ana-dfs.txt` no Financeiro | P32 |
| 7031 | serviço encerrado inesperadamente | W3SVC no teste de falha | P28 |
| 2031 | alerta do Monitor de Desempenho | CPU, memória e disco | P25 |

**Logs do IIS:** o log W3C do site registra cada requisição (data, hora, URL, IP do cliente, status e tempo). As respostas **503** da queda ficam no log `HTTPERR` do Windows (P33).

## Decisões do laboratório

| Decisão | Motivo |
|---|---|
| Cliente com Windows Server 2025 | não havia ISO de Windows 11 disponível; o Windows Server entra no domínio e se comporta como estação |
| Gateway 192.168.234.1 | na NAT Network do VirtualBox o gateway é sempre o .1 (o exemplo da aula usa VMware, com .2) |
| Atualizações do Windows adiadas | laboratório isolado; economia de tempo |
| Área de Trabalho Remota administrativa, sem RD Session Host | a Microsoft não recomenda o RD Session Host num controlador de domínio |
| DHCP só como apoio | não é exigido; mantido para o cliente receber IP |
| Conta administrativa do laboratório no Domain Admins | administrar o servidor e o cliente com a mesma conta |
| Snapshots com a VM desligada | com a VM ligada, o snapshot travava neste computador |

## Evidências

Os prints estão em [`evidencias/prints/`](evidencias/prints/) e as saídas de conferência em [`evidencias/saidas/`](evidencias/saidas/). O PDF traz cada print com a descrição completa.

| Print | O que mostra |
|---|---|
| [P01](evidencias/prints/P01-rede-nat-network.png) | NAT Network AprendIA-NAT: 192.168.234.0/24, gateway .1, DHCP do VirtualBox desligado |
| [P02](evidencias/prints/P02-dns-zona-aprendia.png) | DNS: zona `aprendia.local` com os registros do domínio, `srv01`, `app` e `CLIENTE01` |
| [P03](evidencias/prints/P03-ad-ous-usuarios.png) | AD: estrutura de OUs `AprendIA` e os usuários de teste |
| [P04](evidencias/prints/P04-ad-grupos.png) | AD: grupos de segurança globais |
| [P05](evidencias/prints/P05-ad-computadores.png) | AD: CLIENTE01 na OU `Computadores` |
| [P06](evidencias/prints/P06-disco-dados-vm.png) | disco de dados de 20 GB anexado ao SRV01 |
| [P07](evidencias/prints/P07-disco-dados-gpt.png) | disco de dados inicializado em GPT e DVD movido para Z: |
| [P08](evidencias/prints/P08-volume-dados.png) | Gerenciamento de Disco com o volume DADOS (D:), NTFS |
| [P09](evidencias/prints/P09-ntfs-financeiro.png) | NTFS do Financeiro: herança desativada, GG_Financeiro_RW com Modificar |
| [P10](evidencias/prints/P10-compartilhamentos-ntfs.png) | compartilhamentos, permissões de compartilhamento e NTFS das três pastas |
| [P11](evidencias/prints/P11-acesso-aluno-negado.png) | aluno: lê o Publico, não grava nele e é negado no Financeiro |
| [P12](evidencias/prints/P12-acesso-ana-financeiro.png) | ana.financeiro cria, edita e apaga arquivo no Financeiro |
| [P13](evidencias/prints/P13-iis-site-binding.png) | IIS: site AprendIA com binding `app.aprendia.local:80` |
| [P14](evidencias/prints/P14-cliente-dns-porta80.png) | cliente: `app.aprendia.local` resolvido pelo SRV01 e porta 80 acessível |
| [P15](evidencias/prints/P15-cliente-site-aprendia.png) | site aberto no navegador do cliente |
| [P16](evidencias/prints/P16-gpo-editor-painel.png) | GPO com o Painel de Controle bloqueado (Enabled) |
| [P17](evidencias/prints/P17-gpo-painel-bloqueado.png) | aluno: `gpresult` com a GPO aplicada e Painel bloqueado |
| [P18](evidencias/prints/P18-dfs-namespace.png) | DFS: namespace `\\aprendia.local\Arquivos` com as três pastas |
| [P19](evidencias/prints/P19-dfs-acesso-cliente.png) | ana.financeiro acessando o Financeiro pelo DFS |
| [P20](evidencias/prints/P20-rdp-sessao-autorizada.png) | sessão remota de paulo.projetos no SRV01 |
| [P21](evidencias/prints/P21-rdp-acesso-negado.png) | acesso remoto do aluno recusado |
| [P22](evidencias/prints/P22-alerta-cpu-config.png) | alerta de CPU: acima de 80, amostra de 15 s |
| [P23](evidencias/prints/P23-alertas-em-execucao.png) | três alertas em Running |
| [P24](evidencias/prints/P24-cpu-sob-carga.png) | CPU em 100% durante o teste de carga |
| [P25](evidencias/prints/P25-eventos-alertas-2031.png) | eventos 2031 dos alertas |
| [P26](evidencias/prints/P26-recuperacao-w3svc.png) | recuperação automática do W3SVC |
| [P27](evidencias/prints/P27-falha-monitor-cliente.png) | monitor do cliente: 200 → falha → 200 |
| [P28](evidencias/prints/P28-falha-evento-7031.png) | evento 7031 da queda do W3SVC |
| [P29](evidencias/prints/P29-auditoria-politica.png) | GPOs aplicadas e política de auditoria ativa |
| [P30](evidencias/prints/P30-auditoria-modo-exibicao.png) | modo de exibição personalizado de auditoria e operação |
| [P31](evidencias/prints/P31-evento-4771-senha-errada.png) | evento 4771: senha errada do aluno |
| [P32](evidencias/prints/P32-evento-4663-arquivo.png) | evento 4663: gravação da Ana no Financeiro |
| [P33](evidencias/prints/P33-logs-iis.png) | log do IIS com 200 e o 503 da queda |
| [P34](evidencias/prints/P34-validacao-srv01.png) | SRV01: IP, DNS, funções instaladas e serviços |
| [P35](evidencias/prints/P35-validacao-cliente01.png) | CLIENTE01: IP por DHCP, DNS e portas 80, 445 e 3389 |
| [P36](evidencias/prints/P36-app-publicada-iis.png) | aplicação web copiada para `C:\Sites\AprendIA`, site Started e resposta HTTP 200 |
| [P37](evidencias/prints/P37-app-tela-inicial.png) | aplicação no navegador do cliente: tela de identificação |
| [P38](evidencias/prints/P38-app-questao.png) | questão com texto de apoio, alternativa selecionada e barra de progresso |
| [P39](evidencias/prints/P39-app-resultado-niveis.png) | resultado: nível por disciplina e situação de cada conteúdo |
| [P40](evidencias/prints/P40-app-resultado-reforco.png) | resultado: conteúdos a reforçar com as estratégias de estudo |

| Saída de conferência | Conteúdo |
|---|---|
| [`srv01-final.txt`](evidencias/saidas/srv01-final.txt) | `hostname`, `ipconfig /all`, `nslookup` e funções do SRV01 |
| [`cliente01-final.txt`](evidencias/saidas/cliente01-final.txt) | `hostname`, `ipconfig /all`, `nslookup` e `Test-NetConnection` do cliente |
| [`srv01-shares-ntfs.txt`](evidencias/saidas/srv01-shares-ntfs.txt) | compartilhamentos, permissões de compartilhamento e `icacls` |
| [`srv01-logman.txt`](evidencias/saidas/srv01-logman.txt) | conjuntos de alerta em execução |
| [`cli-teste-falha.txt`](evidencias/saidas/cli-teste-falha.txt) | registro completo do monitor durante o teste de falha |

## Vídeo

Vídeo de demonstração do projeto (2min12s): [`video/AprendIA_demonstracao.mp4`](video/AprendIA_demonstracao.mp4).

Apresenta, em páginas de caderno, o projeto AprendIA, a topologia, os serviços configurados (DNS, Active Directory, File Server, IIS, DFS, GPO e RDS), o monitoramento, o teste de falha com a recuperação automática do IIS, a auditoria, a aplicação web funcionando e os integrantes do grupo.
