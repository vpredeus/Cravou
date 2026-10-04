# Home e fluxo de entrada

As páginas standalone usam Angular Router e o mesmo tema e PreferencesStore
da aplicação. EntryShell organiza o viewport, título e conteúdo; AppHeader
compartilha marca e voltar com o Streak. Settings aparece somente nas páginas
com cronômetro: Streak e device-demo. No cabeçalho compartilhado, a página de
jogo habilita explicitamente showSettings; as telas de entrada não o habilitam.
As etapas de entrada usam a marca centralizada no cabeçalho e um link circular
com seta e nome acessível "Voltar". Streak reutiliza esse cabeçalho, com Settings
à direita e identificação do modo acima da meta. Home mantém seu layout anterior.

| Rota                 | Tela                                   |
| -------------------- | -------------------------------------- |
| `/`                  | Home                                   |
| `/local`             | Single Player / Multiplayer            |
| `/streak`            | Streak existente                       |
| `/local/multiplayer` | Próxima etapa de configuração de grupo |
| `/online`            | Perfil da sessão / criar / entrar      |
| `/online/create`     | Próxima etapa de criação               |
| `/online/join`       | Campo de código                        |
| `/online/join/next`  | Próxima etapa de validação e conexão   |
| `/device-demo`       | Demo de desenvolvimento preservada     |

NextStepPage apresenta somente o conteúdo estático definido nas rotas. Não há
simulação de grupo, conexão ou resultado. Join normaliza caixa e espaços externos;
não define comprimento, formato ou validação de código de sala. Nenhum código é
persistido ou enviado. As ações futuras continuam explicitamente indisponíveis.

OnlineEntryPage escreve diretamente no PreferencesStore existente, com o mesmo
registry local e ProfileAvatar das configurações. O perfil continua sincronizado
com Settings ao navegar entre a tela Online e a página de jogo.

Os estilos compartilhados são SCSS com escopo dos componentes. Fundo usa
--game-background; superfícies usam --surface-background; indicadores e glow
usam --accent-color. Não há novos tokens de cor nem dependências.

Layouts se adaptam por largura e altura disponíveis, com Grid, clamp, container
units, 100dvh e safe areas. Links são navegação nativa do Router; campos e radios
mantêm semântica e foco visível. A entrada respeita prefers-reduced-motion.

Streak muda apenas de rota e recebe o cabeçalho compartilhado, com voltar para
Local e marca para Home. Providers da sessão, timer, regras e aparelho continuam
os mesmos. Sair da rota encerra aquela sessão, como já ocorria na destruição da
página. Preferências permanecem em memória durante a navegação.
