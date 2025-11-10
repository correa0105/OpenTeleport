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
    this.log('Inicializando módulo');

    // Verifica se o Sequencer está disponível
    if (!game.modules.get('sequencer')?.active) {
      ui.notifications.error('Open Teleport requer o módulo Sequencer ativo!');
      return;
    }

    // Adiciona botão no Token Control
    Hooks.on('getSceneControlButtons', (controls) => {
      const tokenControls = controls.find(c => c.name === 'token');

      if (tokenControls) {
        tokenControls.tools.push({
          name: 'openteleport',
          title: 'Open Teleport',
          icon: 'fas fa-door-open',
          button: true,
          onClick: () => this.onTeleportClick(),
          visible: true
        });
      }
    });

    this.log('Módulo inicializado com sucesso');
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
    const exitEffectPath = await this.promptForEffect('Efeito de Saída',
      'Digite o caminho do efeito do Sequencer para o desaparecimento:');

    if (!exitEffectPath) {
      this.log('Teleporte cancelado - nenhum efeito de saída fornecido');
      return;
    }

    // Passo 2: Executar efeito de desaparecimento e ocultar token
    await this.playExitEffect(token, exitEffectPath);

    // Passo 3: Mostrar crosshair para selecionar destino
    const destination = await this.selectDestination(token);

    if (!destination) {
      // Se cancelado, tornar o token visível novamente
      await token.document.update({ hidden: false });
      ui.notifications.info('Teleporte cancelado');
      return;
    }

    // Passo 4: Solicitar o nome do efeito de chegada
    const entryEffectPath = await this.promptForEffect('Efeito de Chegada',
      'Digite o caminho do efeito do Sequencer para o aparecimento:');

    if (!entryEffectPath) {
      // Se cancelado, restaurar posição original e visibilidade
      await token.document.update({ hidden: false });
      ui.notifications.info('Teleporte cancelado');
      return;
    }

    // Passo 5: Mover token e executar efeito de aparecimento
    await this.playEntryEffect(token, destination, entryEffectPath);
  }

  /**
   * Mostra um diálogo para solicitar o caminho do efeito
   */
  static async promptForEffect(title, content) {
    return new Promise((resolve) => {
      const dialog = new Dialog({
        title: title,
        content: `
          <form>
            <div class="form-group">
              <label>${content}</label>
              <input type="text" id="effect-path" name="effect-path"
                placeholder="jb2a.misty_step.01.blue" style="width: 100%;" />
              <p style="font-size: 0.8em; color: #666; margin-top: 5px;">
                Dica: Use o Database Viewer do Sequencer para encontrar efeitos
              </p>
            </div>
          </form>
        `,
        buttons: {
          ok: {
            icon: '<i class="fas fa-check"></i>',
            label: 'Confirmar',
            callback: (html) => {
              const path = html.find('#effect-path').val().trim();
              resolve(path || null);
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Cancelar',
            callback: () => resolve(null)
          }
        },
        default: 'ok',
        close: () => resolve(null)
      }, {
        width: 400
      });

      dialog.render(true);
    });
  }

  /**
   * Executa o efeito de desaparecimento e oculta o token
   */
  static async playExitEffect(token, effectPath) {
    this.log('Executando efeito de saída:', effectPath);

    try {
      // Cria a sequência de efeito
      const sequence = new Sequence();

      sequence
        .effect()
          .file(effectPath)
          .atLocation(token)
          .scale(token.document.width)
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
      ui.notifications.error(`Erro ao carregar efeito: ${effectPath}`);
      throw error;
    }
  }

  /**
   * Mostra um crosshair para selecionar o destino
   */
  static async selectDestination(token) {
    this.log('Aguardando seleção de destino');

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
  static async playEntryEffect(token, destination, effectPath) {
    this.log('Executando efeito de chegada:', effectPath);

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

      sequence
        .effect()
          .file(effectPath)
          .atLocation(destination)
          .scale(token.document.width)
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
      ui.notifications.error(`Erro ao carregar efeito: ${effectPath}`);

      // Restaura visibilidade em caso de erro
      await token.document.update({ hidden: false });
    }
  }
}

// Registra o hook de inicialização
Hooks.once('init', () => {
  OpenTeleport.initialize();
});

Hooks.once('ready', () => {
  OpenTeleport.log('Módulo pronto para uso');
});
