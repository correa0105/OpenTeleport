/**
 * Open Teleport - Módulo de teleporte com efeitos do Sequencer
 */

class OpenTeleport {
  static ID = 'openteleport';

  static log(...args) {
    console.log(`${this.ID} |`, ...args);
  }

  /**
   * Inicializa o módulo
   */
  static initialize() {
    // Verifica se o Sequencer está disponível
    if (!game.modules.get('sequencer')?.active) {
      ui.notifications.error('Open Teleport requer o módulo Sequencer ativo!');
      return;
    }

    // Adiciona botão no Token Control
    Hooks.on('getSceneControlButtons', (controls) => {
      // No Foundry v13+, controls é um objeto com as chaves sendo os nomes dos controles
      if (controls.tokens) {
        controls.tokens.tools.openteleport = {
          name: 'openteleport',
          title: 'Open Teleport',
          icon: 'fas fa-door-open',
          button: true,
          onClick: () => this.onTeleportClick(),
          visible: true
        };
      }
    });
  }

  /**
   * Chamado quando o botão de teleporte é clicado
   */
  static async onTeleportClick() {
    const controlled = canvas.tokens.controlled;

    if (controlled.length === 0) {
      ui.notifications.warn('Selecione um token primeiro!');
      return;
    }

    if (controlled.length > 1) {
      ui.notifications.warn('Selecione apenas um token!');
      return;
    }

    const token = controlled[0];
    await this.startTeleportSequence(token);
  }

  /**
   * Inicia a sequência de teleporte
   */
  static async startTeleportSequence(token) {
    // Passo 1: Solicitar o nome do efeito de saída
    const exitEffects = await this.promptForEffect('Efeito de Saída');

    if (!exitEffects) {
      return;
    }

    // Passo 2: Executar efeito de desaparecimento e ocultar token
    await this.playExitEffect(token, exitEffects);

    // Passo 3: Mostrar crosshair para selecionar destino
    const destination = await this.selectDestination(token);

    if (!destination) {
      // Se cancelado, tornar o token visível novamente
      await token.document.update({ hidden: false });
      ui.notifications.info('Teleporte cancelado');
      return;
    }

    // Passo 4: Solicitar o nome do efeito de chegada
    const entryEffects = await this.promptForEffect('Efeito de Chegada');

    if (!entryEffects) {
      // Se cancelado, restaurar posição original e visibilidade
      await token.document.update({ hidden: false });
      ui.notifications.info('Teleporte cancelado');
      return;
    }

    // Passo 5: Mover token e executar efeito de aparecimento
    await this.playEntryEffect(token, destination, entryEffects);
  }

  /**
   * Mostra um diálogo para solicitar o caminho do efeito
   */
  static async promptForEffect(title) {
    return new Promise((resolve) => {
      let effectCount = 1;

      const generateEffectRow = (index) => {
        const showRemove = index > 0;
        return `
          <div class="openteleport-effect-row" data-effect-index="${index}">
            <div class="openteleport-effect-inputs">
              <div class="openteleport-effect-path">
                <input type="text"
                  class="openteleport-input effect-path"
                  name="effect-path-${index}"
                  placeholder="Ex: jb2a.misty_step.01.blue" />
              </div>
              <div class="openteleport-effect-duration">
                <input type="number"
                  class="openteleport-input effect-duration"
                  name="effect-duration-${index}"
                  value="1000" min="100" max="10000" step="100" />
              </div>
            </div>
            ${showRemove ? '<button type="button" class="openteleport-remove-btn" data-index="' + index + '">−</button>' : '<button type="button" class="openteleport-add-btn">+</button>'}
          </div>
        `;
      };

      const content = `
        <form style="padding: 10px;">
          <div class="openteleport-form-group">
            <div class="openteleport-label-row" style="margin-bottom: 8px;">
              <div style="flex: 2; display: flex; align-items: center; gap: 6px;">
                <label>Caminho</label>
                <span class="openteleport-info-btn" data-tooltip-id="tooltip-path">
                  !
                  <span class="openteleport-tooltip">Use o Database Viewer do Sequencer</span>
                </span>
              </div>
              <div style="flex: 1; display: flex; align-items: center; gap: 6px;">
                <label>Duração (ms)</label>
                <span class="openteleport-info-btn" data-tooltip-id="tooltip-duration">
                  !
                  <span class="openteleport-tooltip">Tempo de duração do efeito (1000ms = 1s)</span>
                </span>
              </div>
              <div style="width: 32px; display: flex; align-items: center; justify-content: center;">
                <span class="openteleport-info-btn" data-tooltip-id="tooltip-add">
                  !
                  <span class="openteleport-tooltip">Clique no + para adicionar efeitos</span>
                </span>
              </div>
            </div>
            <div id="effects-container">
              ${generateEffectRow(0)}
            </div>
          </div>
        </form>
      `;

      const dialog = new Dialog({
        title: title,
        content: content,
        buttons: {
          ok: {
            icon: '<i class="fas fa-check"></i>',
            label: 'Confirmar',
            callback: (html) => {
              const effects = [];
              html.find('.openteleport-effect-row').each(function() {
                const path = $(this).find('.effect-path').val().trim();
                const duration = parseInt($(this).find('.effect-duration').val()) || 1000;

                if (path) {
                  effects.push({ path, duration });
                }
              });

              resolve(effects.length > 0 ? effects : null);
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Cancelar',
            callback: () => resolve(null)
          }
        },
        default: 'ok',
        close: () => resolve(null),
        render: (html) => {
          // Handler para adicionar novo efeito
          html.on('click', '.openteleport-add-btn', function() {
            effectCount++;
            const container = html.find('#effects-container');
            container.append(generateEffectRow(effectCount - 1));
          });

          // Handler para remover efeito
          html.on('click', '.openteleport-remove-btn', function() {
            $(this).closest('.openteleport-effect-row').remove();
          });

          // Handler para posicionar tooltips corretamente
          html.on('mouseenter', '.openteleport-info-btn', function(e) {
            const tooltip = $(this).find('.openteleport-tooltip');
            const btnRect = this.getBoundingClientRect();

            tooltip.css({
              position: 'fixed',
              left: btnRect.left + (btnRect.width / 2) + 'px',
              top: (btnRect.top - 8) + 'px'
            });
          });
        }
      }, {
        width: 520,
        height: 'auto'
      });

      dialog.render(true);
    });
  }

  /**
   * Executa o efeito de desaparecimento e oculta o token
   */
  static async playExitEffect(token, effects) {
    try {
      // Cria a sequência de efeito
      const sequence = new Sequence();

      // Adiciona todos os efeitos à sequência
      for (const effect of effects) {
        sequence.effect()
          .file(effect.path)
          .atLocation(token)
          .scale(token.document.width)
          .duration(effect.duration);
      }

      // Adiciona a animação de fade out e oculta o token
      sequence
        .animation()
          .on(token)
          .fadeOut(500)
        .wait(200)
        .thenDo(() => {
          token.document.update({ hidden: true });
        });

      await sequence.play();

    } catch (error) {
      console.error('Erro ao executar efeito de saída:', error);
      ui.notifications.error(`Erro ao carregar efeitos`);
      throw error;
    }
  }

  /**
   * Mostra um crosshair para selecionar o destino
   */
  static async selectDestination(token) {
    try {
      ui.notifications.info('Clique para selecionar o destino (Esc para cancelar)');

      // Cria um crosshair customizado usando MeasuredTemplate
      const position = await new Promise((resolve) => {
        let cancelled = false;

        // Handler para clique no canvas
        const handleClick = async (event) => {
          if (cancelled) return;

          const pos = event.data.getLocalPosition(canvas.app.stage);
          const worldPos = {
            x: pos.x,
            y: pos.y
          };

          cleanup();
          resolve(worldPos);
        };

        // Handler para cancelar (tecla Esc ou botão direito)
        const handleCancel = (event) => {
          if (event.key === 'Escape' || event.button === 2) {
            cancelled = true;
            cleanup();
            resolve(null);
          }
        };

        const handleRightClick = (event) => {
          cancelled = true;
          cleanup();
          resolve(null);
        };

        // Adiciona visual feedback (círculo de preview)
        const circle = new PIXI.Graphics();
        circle.lineStyle(2, 0xff6400, 0.8);
        circle.drawCircle(0, 0, token.document.width * canvas.grid.size / 2);
        canvas.stage.addChild(circle);

        // Atualiza a posição do círculo com o mouse
        const handleMouseMove = (event) => {
          if (cancelled) return;
          const pos = event.data.getLocalPosition(canvas.app.stage);
          circle.x = pos.x;
          circle.y = pos.y;
        };

        // Função de limpeza
        const cleanup = () => {
          canvas.stage.off('click', handleClick);
          canvas.stage.off('rightdown', handleRightClick);
          canvas.stage.off('mousemove', handleMouseMove);
          document.removeEventListener('keydown', handleCancel);
          canvas.stage.removeChild(circle);
        };

        // Registra os event listeners
        canvas.stage.on('click', handleClick);
        canvas.stage.on('rightdown', handleRightClick);
        canvas.stage.on('mousemove', handleMouseMove);
        document.addEventListener('keydown', handleCancel);
      });

      return position;

    } catch (error) {
      console.error('Erro ao selecionar destino:', error);
      return null;
    }
  }

  /**
   * Move o token para o destino e executa o efeito de aparecimento
   */
  static async playEntryEffect(token, destination, effects) {
    try {
      // Move o token (ainda oculto) para a nova posição
      const tokenWidth = token.document.width * canvas.grid.size;
      const tokenHeight = token.document.height * canvas.grid.size;

      await token.document.update({
        x: destination.x - (tokenWidth / 2),
        y: destination.y - (tokenHeight / 2)
      });

      // Cria a sequência de efeito de chegada
      const sequence = new Sequence();

      // Adiciona todos os efeitos à sequência
      for (const effect of effects) {
        sequence.effect()
          .file(effect.path)
          .atLocation(destination)
          .scale(token.document.width)
          .duration(effect.duration);
      }

      // Adiciona a animação de fade in e mostra o token
      sequence
        .animation()
          .on(token)
          .fadeIn(500)
        .thenDo(() => {
          token.document.update({ hidden: false });
        });

      await sequence.play();

      ui.notifications.info('Teleporte concluído!');

    } catch (error) {
      console.error('Erro ao executar efeito de chegada:', error);
      ui.notifications.error(`Erro ao carregar efeitos`);

      // Restaura visibilidade em caso de erro
      await token.document.update({ hidden: false });
    }
  }
}

// Registra o hook de inicialização
Hooks.once('init', () => {
  OpenTeleport.initialize();
});
