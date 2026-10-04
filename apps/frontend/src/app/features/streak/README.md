# Streak

`StreakPage` compõe GameDevice e SettingsPanel. `StreakGame` e `TimerEngine`
são providers da página; a sessão existe somente em memória. Preferências,
áudios e os tokens CSS existentes continuam sendo reutilizados.

`streak-rules.ts` reúne constantes e funções puras:

- Meta: `10 + Math.floor(Math.random() * 1991)`, uniforme nos inteiros inclusivos
  de 10 a 2000 centésimos. Não há conversão de segundos nem seed.
- Acerto: `elapsedCentiseconds === targetCentiseconds`, sem tolerância.
- Diferença: resultado menos meta, formatado com sinal e vírgula decimal.
- Top 5: recebe apenas sequências encerradas maiores que zero, ordena em ordem
  decrescente e conserva duplicatas. A sequência ativa fica fora da lista.

`TimerEngine.start(timeoutCentiseconds?)` mantém compatibilidade com a demo
sem limite. Streak passa `ATTEMPT_TIMEOUT_CS = 3000`. O timeout agenda um
`setTimeout`, mas a decisão sempre relê `performance.now()`. Se o callback
chegar cedo, agenda o restante; se chegar tarde, produz `TIMED_OUT`. STOP
também verifica o limite absoluto antes de salvar um resultado. Assim,
29,999 s pode ser uma tentativa válida; 30,000 s sem STOP anterior vira DNF.
Reset, STOP e destruição cancelam callbacks pendentes.

O resultado normal usa `Math.floor(elapsedMilliseconds / 10)`. DNF não possui
tempo nem diferença no tipo de resultado e não salva `3000` como medição.
A página fornece a mensagem `DNF` ao visor, revela o estado final e não toca
um som automático. Os MP3s atuais continuam sendo tocados somente em START
e STOP pela mesma ação do botão.

CRAVOU incrementa a streak. ERROU/DNF encerram e registram a sequência ativa,
então zeram a streak. A avaliação é idempotente, inclusive entre STOP e o
efeito que observa o estado final do timer. `nextAttempt()` só funciona após
FINISHED/TIMED_OUT: gera outra meta, reseta o timer e o resultado, preservando
streak e Top 5. Não há avanço automático nem terceira ação do botão físico.

O layout usa `100dvh`, safe areas, Grid e container queries por espaço
disponível. Quando há largura, os indicadores ficam nas laterais. Quando a
largura é restrita e há altura, ficam compactos acima do aparelho. A largura
do aparelho também acompanha a altura útil para preservar sua composição
sem scroll. Settings permanece um popover sobreposto e não move o aparelho.

Rota: `/streak`, acessível por Home → Local → Single Player. O cabeçalho
compartilhado centraliza a marca, oferece a seta para voltar a Local e mantém
Settings à direita. STREAK / SINGLE PLAYER aparece acima da meta na coluna do
aparelho, em uma linha quando há pouca altura disponível.
Demo técnica isolada: `/device-demo`. Regras, timer e aparelho permanecem
independentes do fluxo de entrada; não há persistência ou backend.
