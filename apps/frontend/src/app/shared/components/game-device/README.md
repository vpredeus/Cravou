# Game Device

Componentes standalone, sem cronômetro ou regras de jogo. `GameDevice` combina
`SevenSegmentDisplay`, `SevenSegmentDigit` e `ActionButton`.

```html
<app-game-device
  [value]="'12.33'"
  [displayHidden]="false"
  [soundEnabled]="true"
  [soundCue]="'start'"
  [keyboardShortcut]="true"
  buttonLabel="Acionar dispositivo"
  (action)="onAction()"
/>
```

- `value`: string numérica, preservando zeros à esquerda. Aceita ponto ou vírgula;
  apresenta um ponto luminoso e usa vírgula no nome acessível. Entrada inválida
  usa `00.00`. O componente não altera nem mede o valor.
- `displayHidden`: retira completamente a camada dos dígitos reais da pintura
  com `visibility: hidden` e `opacity: 0`, preservando sua geometria. Uma camada
  independente, sem dígitos e sem vínculo com `value`, produz um brilho radial
  constante na cor do tema, difundido por blur sob o vidro fumê. O blur é aplicado
  somente ao brilho genérico, nunca ao valor real. O nome acessível também oculta
  o número. O valor permanece no DOM; isto é ocultação visual, não proteção de dados.
- `displayMessage`: mensagem externa opcional no lugar dos números, sem lógica
  de jogo. O estado oculto tem prioridade e continua mostrando só o brilho
  genérico. Streak fornece `DNF` quando não há resultado numérico válido.
- `disabled`, `buttonLabel`, `soundEnabled`: controlam o botão sem regras de jogo.
  A superfície iluminada não contém texto ou ícones; `buttonLabel` define apenas
  seu nome acessível via `aria-label`.
- `soundCue`: `'start'` (padrão) toca `audio/button-press_start.mp3`; `'end'` toca
  `audio/button-press_end.mp3`. O componente recebe a escolha externamente,
  sem decidir se um cronômetro está em execução.
- `keyboardShortcut`: padrão `false`. Ative somente no dispositivo ativo para
  aceitar Space fora do botão. Outros controles, campos editáveis e eventos
  previamente tratados mantêm seu comportamento. Space e Enter funcionam no
  próprio botão focado mesmo com o atalho global desligado.
- `action`: evento genérico emitido no início do pressionamento. Pointer Events
  unificam mouse, toque e caneta. Repetições de teclado e o clique subsequente ao
  pointerdown não duplicam a ação. Há feedback visual de 120 ms; o áudio toca
  desde o início do arquivo selecionado.
- Conteúdo projetado opcional aparece entre o visor e o botão.

O tamanho acompanha a largura disponível; os dígitos SVG e o botão preservam
suas proporções. A demo limita essa largura também pela altura do espaço útil,
com container units, `100dvh` e safe areas.

Os tokens padrão estão em `src/styles.scss`. Sobrescreva no ancestral ou no host:
`--game-background`, `--surface-background`, `--accent-color`, `--display-off-color`,
`--display-frame-color`, `--text-color`, `--shadow-color`,
`--muted-text-color` e `--surface-highlight`. LEDs, glow e botão usam
`--accent-color`. `--button-depth` controla a profundidade do botão.

`--game-background` altera somente o fundo da página. O visor e o painel de
configurações usam `--surface-background`, mantendo o tom escuro original.
O suporte usa `--display-frame-color` e permanece opaco inclusive quando o
botão está desabilitado; apenas sua face luminosa perde brilho nesse estado.

`ButtonSound` usa dois elementos de áudio nativos, pré-carrega os MP3 fornecidos
e inicia a reprodução na interação. Um novo acionamento interrompe o som anterior
para evitar sobreposição. Desligar o som interrompe a reprodução atual.
Na destruição, os áudios são parados e descarregados.
Falhas de carregamento ou política de autoplay não interrompem a ação.

A tela temporária está em `features/game-device-demo` e ocupa somente a rota
`/device-demo` de `app.routes.ts`, sem barra de debug. Ela fornece uma meta fixa de 1233
centésimos, integra `TimerEngine` e abre `SettingsPanel` pela engrenagem.
O timer usa `performance.now()` no início e no fim; o resultado usa
`Math.floor(elapsedMilliseconds / 10)`. Não há atualização por frame enquanto
o visor está oculto, pois o brilho genérico independe do valor real.

O primeiro acionamento inicia (READY → RUNNING), toca Start e oculta o visor.
O segundo finaliza (RUNNING → FINISHED), toca End e revela o resultado.
FINISHED bloqueia novos acionamentos. “Nova tentativa” chama explicitamente
`reset()` no container e devolve o foco ao botão, sem transformar o terceiro
acionamento em reset. Esse controle pode ser removido quando um Game Engine
passar a determinar o início de cada tentativa.

`PreferencesStore` guarda perfil, aparência e som somente na memória da sessão.
O painel usa Popover nativo para fechamento externo/Escape e posicionamento
flutuante limitado ao viewport. O registro de avatares contém SVGs locais
temporários. `App` aplica as cores escolhidas como CSS Custom Properties;
os valores iniciais continuam vindo do tema existente. O GameDevice não
conhece perfil, painel, meta, timer nem regras de jogo. A rota principal agora
usa a feature `streak`; veja seu README para regras, timeout e estado da sessão.
