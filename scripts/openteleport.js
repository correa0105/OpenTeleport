/**
 * Open Teleport - Módulo de teleporte com efeitos do Sequencer
 */

class OpenTeleport {
  static ID = 'openteleport';

  static log(...args) {
    console.log(`${this.ID} |`, ...args);
  }

  /**
   * Obtém o ator base de um token (não sintético)
   * Isso garante que presets sejam salvos no ator real, não em atores específicos do token
   */
  static getBaseActor(token) {
    if (!token || !token.document || !token.document.actorId) return null;
    // token.document.actorId sempre aponta para o ator base, mesmo em tokens não-linkados
    const actor = game.actors.get(token.document.actorId);
    return actor || null;
  }

  /**
   * Obtém lista de efeitos favoritos
   */
  static getFavorites() {
    return game.settings.get(this.ID, 'favoriteEffects') || [];
  }

  /**
   * Adiciona um novo preset de teleporte para um ator
   */
  static async addActorTeleportPreset(actor, name, exitEffects, entryEffects) {
    if (!actor) return;

    // Obtém presets existentes
    const presets = this.getActorTeleportPresets(actor);

    // Cria novo preset
    const newPreset = {
      id: foundry.utils.randomID(),
      name: name,
      exitEffects: exitEffects,
      entryEffects: entryEffects,
      createdAt: Date.now(),
      lastUsed: Date.now()
    };

    // Adiciona à lista
    presets.push(newPreset);

    // Salva
    await actor.setFlag(this.ID, 'teleportPresets', presets);
    this.log('Preset de teleporte adicionado para ator:', actor.name, '- Nome:', name);

    return newPreset;
  }

  /**
   * Obtém todos os presets de teleporte de um ator
   */
  static getActorTeleportPresets(actor) {
    if (!actor) return [];
    const presets = actor.getFlag(this.ID, 'teleportPresets');
    return presets || [];
  }

  /**
   * Verifica se um ator tem presets de teleporte salvos
   */
  static hasActorTeleportPresets(actor) {
    if (!actor) return false;
    const presets = this.getActorTeleportPresets(actor);
    return presets.length > 0;
  }

  /**
   * Obtém um preset específico por ID
   */
  static getActorTeleportPresetById(actor, presetId) {
    if (!actor) return null;
    const presets = this.getActorTeleportPresets(actor);
    return presets.find(p => p.id === presetId);
  }

  /**
   * Atualiza o timestamp de último uso de um preset
   */
  static async updatePresetLastUsed(actor, presetId) {
    if (!actor) return;

    const presets = this.getActorTeleportPresets(actor);
    const preset = presets.find(p => p.id === presetId);

    if (preset) {
      preset.lastUsed = Date.now();
      await actor.setFlag(this.ID, 'teleportPresets', presets);
    }
  }

  /**
   * Remove um preset específico
   */
  static async removeActorTeleportPreset(actor, presetId) {
    if (!actor) return;

    let presets = this.getActorTeleportPresets(actor);
    presets = presets.filter(p => p.id !== presetId);

    await actor.setFlag(this.ID, 'teleportPresets', presets);
    this.log('Preset removido para ator:', actor.name);
  }

  /**
   * Salva um efeito nos favoritos
   */
  static async addFavorite(path, duration) {
    const favorites = this.getFavorites();

    // Verifica se já existe
    if (favorites.some(f => f.path === path)) {
      ui.notifications.warn('Este efeito já está nos favoritos!');
      return;
    }

    favorites.push({ path, duration });
    await game.settings.set(this.ID, 'favoriteEffects', favorites);
    ui.notifications.info('Efeito adicionado aos favoritos!');
  }

  /**
   * Remove um efeito dos favoritos
   */
  static async removeFavorite(path) {
    const favorites = this.getFavorites();
    const filtered = favorites.filter(f => f.path !== path);
    await game.settings.set(this.ID, 'favoriteEffects', filtered);
    ui.notifications.info('Efeito removido dos favoritos!');
  }

  /**
   * Inicializa o módulo
   */
  static initialize() {
    this.log('Inicializando Open Teleport...');

    // Registra configuração de favoritos
    game.settings.register(this.ID, 'favoriteEffects', {
      name: 'Efeitos Favoritos',
      scope: 'world',
      config: false,
      type: Array,
      default: []
    });

    // Adiciona botão no Token Control - DEVE ser registrado no init
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

    // Adiciona botão no HUD do token (acima do token quando selecionado)
    Hooks.on('renderTokenHUD', (app, html, data) => {
      const token = app.object;
      if (!token) return;

      // Obtém o ator base (não sintético)
      const actor = this.getBaseActor(token);
      if (!actor) return;

      // Verifica se o ator tem presets salvos
      if (this.hasActorTeleportPresets(actor)) {
        // Converte html para jQuery se necessário
        const $html = html instanceof jQuery ? html : $(html);

        // Adiciona botão de teleporte rápido no HUD
        const controlIcon = $html.find('.control-icon');

        const teleportButton = $(`
          <div class="control-icon openteleport-quick" title="Teleporte Rápido">
            <i class="fas fa-bolt"></i>
          </div>
        `);

        teleportButton.click((event) => {
          event.preventDefault();
          event.stopPropagation();
          this.quickTeleport(token);
        });

        // Adiciona o botão após o último ícone de controle
        controlIcon.last().after(teleportButton);
      }
    });
  }

  /**
   * Setup após o jogo estar pronto
   */
  static setup() {
    // Verifica se o Sequencer está disponível
    if (!game.modules.get('sequencer')?.active) {
      console.error('Open Teleport: Módulo Sequencer não está ativo!');
      ui.notifications.error('Open Teleport requer o módulo Sequencer ativo!');
      return;
    }

    // Verifica se o Crossgate está disponível
    if (!game.modules.get('crossgate')?.active) {
      console.error('Open Teleport: Módulo Crossgate não está ativo!');
      ui.notifications.error('Open Teleport requer o módulo Crossgate ativo!');
      return;
    }

    // Verifica se a API do Crossgate está disponível globalmente
    if (typeof window.crossgate === 'undefined' || !window.crossgate.crosshairs) {
      console.error('Open Teleport: API do Crossgate não está disponível!');
      ui.notifications.error('API do Crossgate não está disponível! Certifique-se de que o Crossgate está carregado.');
      return;
    }

    this.log('Módulos Sequencer e Crossgate carregados com sucesso');
    ui.notifications.info('Open Teleport carregado com sucesso!');
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
   * Mostra diálogo para selecionar preset e executa teleporte rápido
   */
  static async quickTeleport(token) {
    try {
      if (!token) {
        ui.notifications.warn('Token inválido!');
        return;
      }

      // Obtém o ator base (não sintético)
      const actor = this.getBaseActor(token);
      if (!actor) {
        ui.notifications.warn('Ator não encontrado!');
        return;
      }

      const presets = this.getActorTeleportPresets(actor);
      if (presets.length === 0) {
        ui.notifications.warn('Nenhum preset de teleporte encontrado para este ator!');
        return;
      }

      this.log('Presets encontrados para', actor.name, ':', presets.length);

      // Se só tem um preset, usa direto
      if (presets.length === 1) {
        this.log('Usando preset único:', presets[0].name);
        await this.executeTeleportWithPreset(token, presets[0]);
        return;
      }

      // Mostra diálogo de seleção
      this.log('Mostrando diálogo de seleção de presets...');
      const selectedPreset = await this.showPresetSelectionDialog(actor, presets);

      this.log('Resultado do diálogo:', selectedPreset);

      if (selectedPreset) {
        this.log('Preset selecionado:', selectedPreset.name);
        await this.executeTeleportWithPreset(token, selectedPreset);
      } else {
        this.log('Nenhum preset selecionado ou diálogo cancelado');
      }
    } catch (error) {
      console.error('Erro no quickTeleport:', error);
      ui.notifications.error('Erro ao executar teleporte rápido: ' + error.message);
    }
  }

  /**
   * Mostra diálogo para selecionar um preset
   */
  static async showPresetSelectionDialog(actor, presets) {
    return new Promise((resolve) => {
      let resolved = false;

      // Wrapper para garantir que resolve só seja chamado uma vez
      const safeResolve = (value) => {
        if (!resolved) {
          resolved = true;
          resolve(value);
        }
      };

      // Ordena presets por último uso
      const sortedPresets = [...presets].sort((a, b) => b.lastUsed - a.lastUsed);

      const content = `
        <div class="openteleport-preset-list">
          <p style="margin-bottom: 10px;">Selecione um preset de teleporte:</p>
          ${sortedPresets.map(preset => `
            <div class="openteleport-preset-item" data-preset-id="${preset.id}">
              <div class="preset-info">
                <strong>${preset.name}</strong>
                <small>Usado: ${new Date(preset.lastUsed).toLocaleString()}</small>
              </div>
              <div class="preset-actions">
                <button type="button" class="preset-delete-btn" data-preset-id="${preset.id}" title="Remover preset">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join('')}
          <div style="margin-top: 15px;"></div>
        </div>
      `;

      const dialog = new Dialog({
        title: `Presets de Teleporte - ${actor.name}`,
        content: content,
        buttons: {
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Cancelar',
            callback: () => safeResolve(null)
          }
        },
        default: 'cancel',
        close: () => safeResolve(null),
        render: (html) => {
          // Handler para remover preset
          html.on('click', '.preset-delete-btn', async function(event) {
            event.stopPropagation();
            OpenTeleport.log('Botão "Deletar preset" clicado');
            const presetId = $(this).data('preset-id');
            const preset = presets.find(p => p.id === presetId);

            const confirmed = await Dialog.confirm({
              title: 'Remover Preset',
              content: `<p>Tem certeza que deseja remover o preset <strong>"${preset.name}"</strong>?</p>`
            });

            if (confirmed) {
              await OpenTeleport.removeActorTeleportPreset(actor, presetId);
              $(this).closest('.openteleport-preset-item').remove();
              ui.notifications.info(`Preset "${preset.name}" removido!`);

              // Se não tem mais presets, fecha o diálogo
              if (html.find('.openteleport-preset-item').length === 0) {
                safeResolve(null);
                dialog.close();
              }
            }
          });

          // Click no item também usa o preset
          html.on('click', '.openteleport-preset-item', function(event) {
            // Ignora se clicou em um botão de ação
            if ($(event.target).closest('.preset-actions').length) {
              OpenTeleport.log('Clique foi em um botão de ação, ignorando');
              return;
            }

            OpenTeleport.log('Item de preset clicado');
            const presetId = $(this).data('preset-id');
            OpenTeleport.log('Preset ID (do item):', presetId);
            const preset = presets.find(p => p.id === presetId);
            OpenTeleport.log('Preset encontrado (do item):', preset);

            safeResolve(preset);
            dialog.close();
          });
        }
      }, {
        width: 400,
        height: 'auto'
      });

      dialog.render(true);
    });
  }

  /**
   * Executa teleporte usando um preset específico
   */
  static async executeTeleportWithPreset(token, preset) {
    try {
      this.log('=== EXECUTANDO TELEPORTE COM PRESET ===');
      this.log('Token:', token.name);
      this.log('Preset:', preset.name);
      this.log('Exit Effects:', preset.exitEffects);
      this.log('Entry Effects:', preset.entryEffects);

      // Obtém o ator base (não sintético)
      const actor = this.getBaseActor(token);
      if (!actor) {
        ui.notifications.error('Ator não encontrado!');
        return;
      }

      this.log('Ator base:', actor.name);

      // Atualiza último uso
      this.log('Atualizando último uso do preset...');
      await this.updatePresetLastUsed(actor, preset.id);

      this.log('Iniciando efeito de saída...');
      // Executa o efeito de saída
      await this.playExitEffect(token, preset.exitEffects);
      this.log('Efeito de saída concluído!');

      this.log('Selecionando destino...');
      // Mostra crosshair para selecionar destino
      const destination = await this.selectDestination(token);
      this.log('Destino selecionado:', destination);

      if (!destination) {
        // Se cancelado, tornar o token visível novamente
        await token.document.update({ hidden: false });
        ui.notifications.info('Teleporte cancelado');
        return;
      }

      this.log('Executando efeito de chegada...');
      // Executa o efeito de chegada
      await this.playEntryEffect(token, destination, preset.entryEffects);
      this.log('Efeito de chegada concluído!');
      this.log('=== TELEPORTE CONCLUÍDO ===');

    } catch (error) {
      console.error('Erro no executeTeleportWithPreset:', error);
      ui.notifications.error('Erro ao executar teleporte: ' + error.message);
      // Restaura visibilidade em caso de erro
      try {
        await token.document.update({ hidden: false });
      } catch (e) {
        console.error('Erro ao restaurar visibilidade:', e);
      }
    }
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

    // Passo 6: Perguntar se deseja salvar como preset
    const actor = this.getBaseActor(token);
    if (actor) {
      const save = await Dialog.confirm({
        title: 'Salvar Preset',
        content: '<p>Deseja salvar este teleporte como um preset para acesso rápido?</p>',
        yes: () => true,
        no: () => false
      });

      if (save) {
        const presetName = await this.promptPresetName(actor);
        if (presetName) {
          await this.addActorTeleportPreset(actor, presetName, exitEffects, entryEffects);
          ui.notifications.info(`Preset "${presetName}" salvo! Use o ícone ⚡ no HUD para acesso rápido.`);
        }
      }
    }
  }

  /**
   * Solicita nome para o preset
   */
  static async promptPresetName(actor) {
    return new Promise((resolve) => {
      const presets = this.getActorTeleportPresets(actor);
      const defaultName = `Teleporte ${presets.length + 1}`;

      const content = `
        <form>
          <div class="form-group">
            <label>Nome do Preset:</label>
            <input type="text" id="preset-name" name="preset-name" value="${defaultName}" style="width: 100%;" autofocus/>
          </div>
        </form>
      `;

      new Dialog({
        title: 'Nome do Preset',
        content: content,
        buttons: {
          ok: {
            icon: '<i class="fas fa-check"></i>',
            label: 'Salvar',
            callback: (html) => {
              const name = html.find('#preset-name').val().trim();
              resolve(name || defaultName);
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
        width: 300
      }).render(true);
    });
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
            <div class="openteleport-effect-main">
              <div class="openteleport-effect-path" style="position: relative;">
                <input type="text"
                  class="openteleport-input effect-path"
                  name="effect-path-${index}"
                  placeholder="Ex: jb2a.misty_step.01.blue" />
                <button type="button" class="openteleport-favorite-btn" data-index="${index}" title="Adicionar aos favoritos">
                  <i class="fas fa-star"></i>
                </button>
              </div>
              <div class="openteleport-effect-repeats">
                <input type="number"
                  class="openteleport-input effect-repeats"
                  name="effect-repeats-${index}"
                  value="1" min="1" max="10" step="1" />
              </div>
              <div class="openteleport-effect-scale">
                <input type="number"
                  class="openteleport-input effect-scale"
                  name="effect-scale-${index}"
                  value="1.0" min="0.1" max="5.0" step="0.1" />
              </div>
              ${showRemove ? '<button type="button" class="openteleport-remove-btn-inline" data-index="' + index + '">−</button>' : '<button type="button" class="openteleport-add-btn-inline">+</button>'}
            </div>
            <div class="openteleport-effect-options">
              <div class="openteleport-option-group">
                <label class="openteleport-checkbox-label">
                  <input type="checkbox" class="effect-persist" name="effect-persist-${index}" />
                  <span>Persistir no chão</span>
                </label>
                <div class="openteleport-persist-options" style="display: none;">
                  <label class="openteleport-radio-label">
                    <input type="radio" name="persist-type-${index}" value="timed" class="persist-type" checked />
                    <span>Temporário:</span>
                    <input type="number" class="openteleport-input-small persist-duration" value="5000" min="1000" max="60000" step="1000" />
                    <span>ms</span>
                  </label>
                  <label class="openteleport-radio-label">
                    <input type="radio" name="persist-type-${index}" value="permanent" class="persist-type" />
                    <span>Permanente</span>
                  </label>
                </div>
              </div>
              <div class="openteleport-option-group">
                <label class="openteleport-checkbox-label">
                  <input type="checkbox" class="effect-sound" name="effect-sound-${index}" />
                  <span>Tocar som</span>
                </label>
                <div class="openteleport-sound-options" style="display: none;">
                  <select class="openteleport-input sound-select" name="sound-select-${index}">
                    <option value="">Selecione um som...</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        `;
      };

      const content = `
        <form style="padding: 10px;">
          <div class="openteleport-form-group">
            <div class="openteleport-label-row" style="margin-bottom: 8px;">
              <div style="flex: 3; display: flex; align-items: center; gap: 6px;">
                <label>Caminho do Efeito</label>
                <span class="openteleport-info-btn" data-tooltip-id="tooltip-path">
                  !
                  <span class="openteleport-tooltip">Use o Database Viewer do Sequencer</span>
                </span>
              </div>
              <div style="flex: 1; display: flex; align-items: center; gap: 6px;">
                <label>Repetições</label>
                <span class="openteleport-info-btn" data-tooltip-id="tooltip-repeats">
                  !
                  <span class="openteleport-tooltip">Quantas vezes o efeito se repetirá (1-10)</span>
                </span>
              </div>
              <div style="flex: 1; display: flex; align-items: center; gap: 6px;">
                <label>Escala</label>
                <span class="openteleport-info-btn" data-tooltip-id="tooltip-scale">
                  !
                  <span class="openteleport-tooltip">Tamanho do efeito (1.0 = normal, 2.0 = dobro)</span>
                </span>
              </div>
              <div style="width: 32px;"></div>
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
                const row = $(this);
                const path = row.find('.effect-path').val().trim();
                const repeats = parseInt(row.find('.effect-repeats').val()) || 1;
                const scale = parseFloat(row.find('.effect-scale').val()) || 1.0;

                if (path) {
                  const effect = {
                    path: path,
                    repeats: repeats,
                    scale: scale
                  };

                  // Verifica se deve persistir
                  const persistChecked = row.find('.effect-persist').is(':checked');
                  if (persistChecked) {
                    const persistType = row.find('.persist-type:checked').val();
                    effect.persist = {
                      enabled: true,
                      type: persistType
                    };

                    if (persistType === 'timed') {
                      effect.persist.duration = parseInt(row.find('.persist-duration').val()) || 5000;
                    }
                  }

                  // Verifica se deve tocar som
                  const soundChecked = row.find('.effect-sound').is(':checked');
                  if (soundChecked) {
                    const soundPath = row.find('.sound-select').val();
                    if (soundPath) {
                      effect.sound = soundPath;
                    }
                  }

                  effects.push(effect);
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
          const dialogEl = html.closest('.dialog');

          // Popula sons da playlist
          OpenTeleport.populateSoundOptions(html);

          // Handler para adicionar novo efeito
          html.on('click', '.openteleport-add-btn-inline', function() {
            effectCount++;
            const container = html.find('#effects-container');
            container.append(generateEffectRow(effectCount - 1));

            // Popula sons no novo row
            OpenTeleport.populateSoundOptions(html);

            // Redimensiona o diálogo
            dialogEl.css('height', 'auto');
          });

          // Handler para remover efeito
          html.on('click', '.openteleport-remove-btn-inline', function() {
            $(this).closest('.openteleport-effect-row').remove();

            // Redimensiona o diálogo
            dialogEl.css('height', 'auto');
          });

          // Handler para checkbox "Persistir no chão"
          html.on('change', '.effect-persist', function() {
            const row = $(this).closest('.openteleport-effect-row');
            const options = row.find('.openteleport-persist-options');
            if ($(this).is(':checked')) {
              options.slideDown(200);
            } else {
              options.slideUp(200);
            }
            dialogEl.css('height', 'auto');
          });

          // Handler para checkbox "Tocar som"
          html.on('change', '.effect-sound', function() {
            const row = $(this).closest('.openteleport-effect-row');
            const options = row.find('.openteleport-sound-options');
            if ($(this).is(':checked')) {
              options.slideDown(200);
            } else {
              options.slideUp(200);
            }
            dialogEl.css('height', 'auto');
          });

          // Handler para habilitar/desabilitar input de duração baseado no tipo
          html.on('change', '.persist-type', function() {
            const row = $(this).closest('.openteleport-effect-row');
            const durationInput = row.find('.persist-duration');
            const isTimedPersist = $(this).val() === 'timed';
            durationInput.prop('disabled', !isTimedPersist);
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

          // Sistema de favoritos
          OpenTeleport.setupFavorites(html);
        }
      }, {
        width: 520,
        height: 'auto',
        resizable: true
      });

      dialog.render(true);
    });
  }

  /**
   * Popula as opções de som das playlists
   */
  static populateSoundOptions(html) {
    const selects = html.find('.sound-select');

    selects.each(function() {
      const select = $(this);

      // Limpa opções existentes exceto a primeira
      select.find('option:not(:first)').remove();

      // Obtém todas as playlists
      game.playlists.forEach(playlist => {
        // Cria optgroup para cada playlist
        const optgroup = $(`<optgroup label="${playlist.name}"></optgroup>`);

        playlist.sounds.forEach(sound => {
          optgroup.append(`<option value="${sound.path}">${sound.name}</option>`);
        });

        if (playlist.sounds.size > 0) {
          select.append(optgroup);
        }
      });
    });
  }

  /**
   * Configura sistema de favoritos no diálogo
   */
  static setupFavorites(html) {
    // Handler para favoritar efeito
    html.on('click', '.openteleport-favorite-btn', async function() {
      const row = $(this).closest('.openteleport-effect-row');
      const pathInput = row.find('.effect-path');
      const durationInput = row.find('.effect-duration');
      const path = pathInput.val().trim();
      const duration = parseInt(durationInput.val()) || 1000;

      if (!path) {
        ui.notifications.warn('Digite um caminho de efeito primeiro!');
        return;
      }

      await OpenTeleport.addFavorite(path, duration);
      $(this).addClass('favorited');
    });

    // Handler para mostrar favoritos ao focar no campo
    html.on('focus', '.effect-path', function() {
      const input = $(this);
      const favorites = OpenTeleport.getFavorites();

      if (favorites.length === 0) return;

      // Remove dropdown anterior se existir
      $('.openteleport-favorites-dropdown').remove();

      // Cria dropdown
      const dropdown = $(`
        <div class="openteleport-favorites-dropdown">
          <div class="openteleport-favorites-header">
            Favoritos
          </div>
          <div class="openteleport-favorites-list">
            ${favorites.map(fav => `
              <div class="openteleport-favorite-item" data-path="${fav.path}" data-duration="${fav.duration}">
                <span class="favorite-path">${fav.path}</span>
                <span class="favorite-duration">(${fav.duration}ms)</span>
                <button type="button" class="openteleport-unfavorite-btn" data-path="${fav.path}">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `);

      // Posiciona dropdown
      const inputPos = input.offset();
      dropdown.css({
        top: inputPos.top + input.outerHeight() + 'px',
        left: inputPos.left + 'px',
        width: input.outerWidth() + 'px'
      });

      $('body').append(dropdown);

      // Handler para selecionar favorito
      dropdown.on('click', '.openteleport-favorite-item', function(e) {
        if ($(e.target).closest('.openteleport-unfavorite-btn').length) return;

        const path = $(this).data('path');
        const duration = $(this).data('duration');
        const row = input.closest('.openteleport-effect-row');

        input.val(path);
        row.find('.effect-duration').val(duration);

        dropdown.remove();
      });

      // Handler para remover favorito
      dropdown.on('click', '.openteleport-unfavorite-btn', async function(e) {
        e.stopPropagation();
        const path = $(this).data('path');
        await OpenTeleport.removeFavorite(path);
        $(this).closest('.openteleport-favorite-item').remove();

        if (dropdown.find('.openteleport-favorite-item').length === 0) {
          dropdown.remove();
        }
      });
    });

    // Remove dropdown ao clicar fora
    html.on('blur', '.effect-path', function() {
      setTimeout(() => {
        if (!$('.openteleport-favorites-dropdown:hover').length) {
          $('.openteleport-favorites-dropdown').remove();
        }
      }, 200);
    });
  }

  /**
   * Executa o efeito de desaparecimento e oculta o token
   */
  static async playExitEffect(token, effects) {
    try {
      // Salva posição original
      const originalX = token.document.x;
      const originalY = token.document.y;

      // Cria a sequência de efeito
      const sequence = new Sequence();

      // Adiciona todos os efeitos à sequência
      for (const effect of effects) {
        const repeats = effect.repeats || 1;

        // Adiciona som se configurado (antes dos efeitos)
        if (effect.sound) {
          sequence.sound().file(effect.sound);
        }

        // Adiciona o efeito com repetições
        for (let i = 0; i < repeats; i++) {
          // Calcula a escala: escala base do token * escala customizada
          const effectScale = token.document.width * (effect.scale || 1.0);

          const effectInstance = sequence.effect()
            .file(effect.path)
            .atLocation({ x: originalX, y: originalY })
            .scale(effectScale);

          // Adiciona persistência se configurado (apenas na última repetição)
          if (effect.persist && effect.persist.enabled && i === repeats - 1) {
            if (effect.persist.type === 'permanent') {
              // Persist permanente
              effectInstance.persist();
            } else if (effect.persist.type === 'timed' && effect.persist.duration) {
              // Persist temporário - NÃO usa .persist(), apenas deixa o efeito renderizar
              // e ele será removido automaticamente após a duração
              effectInstance.duration(effect.persist.duration);
            }
          }

          // Se não for o último da repetição, aguarda o efeito terminar antes de repetir
          if (i < repeats - 1) {
            effectInstance.waitUntilFinished();
          }
        }
      }

      // Inicia os efeitos
      const sequencePromise = sequence.play();

      // Aguarda um pouco e oculta o token imediatamente
      await new Promise(resolve => setTimeout(resolve, 200));
      await token.document.update({ hidden: true });

      // Aguarda os efeitos terminarem
      await sequencePromise;

    } catch (error) {
      console.error('Erro ao executar efeito de saída:', error);
      ui.notifications.error(`Erro ao carregar efeitos`);
      throw error;
    }
  }

  /**
   * Mostra um crosshair para selecionar o destino usando Crossgate
   */
  static async selectDestination(token) {
    try {
      ui.notifications.info('Clique para selecionar o destino (Esc para cancelar)');

      // Verifica se o Crossgate está disponível
      if (typeof window.crossgate === 'undefined') {
        ui.notifications.error('Crossgate não está disponível!');
        return null;
      }

      // Usa o crosshair do Crossgate com configurações customizadas
      const location = await window.crossgate.crosshairs.show({
        size: token.document.width,
        label: 'Destino do Teleporte',
        rememberControlled: true
      });

      // Se foi cancelado, retorna null
      if (location.cancelled) {
        return null;
      }

      // Retorna as coordenadas
      return {
        x: location.x,
        y: location.y
      };

    } catch (error) {
      console.error('Erro ao selecionar destino:', error);
      ui.notifications.error('Erro ao usar o crosshair do Crossgate');
      return null;
    }
  }

  /**
   * Move o token para o destino e executa o efeito de aparecimento
   */
  static async playEntryEffect(token, destination, effects) {
    try {
      // Calcula coordenadas finais
      const tokenWidth = token.document.width * canvas.grid.size;
      const tokenHeight = token.document.height * canvas.grid.size;
      const finalX = destination.x - (tokenWidth / 2);
      const finalY = destination.y - (tokenHeight / 2);

      // Move o token (ainda oculto) para a nova posição instantaneamente SEM ANIMAÇÃO
      await token.document.update({
        x: finalX,
        y: finalY
      }, { animate: false });

      // Aguarda um momento para garantir que o token foi movido
      await new Promise(resolve => setTimeout(resolve, 100));

      // Cria a sequência de efeito de chegada
      const sequence = new Sequence();

      // Adiciona todos os efeitos à sequência
      for (const effect of effects) {
        const repeats = effect.repeats || 1;

        // Adiciona som se configurado (antes dos efeitos)
        if (effect.sound) {
          sequence.sound().file(effect.sound);
        }

        // Adiciona o efeito com repetições
        for (let i = 0; i < repeats; i++) {
          // Calcula a escala: escala base do token * escala customizada
          const effectScale = token.document.width * (effect.scale || 1.0);

          const effectInstance = sequence.effect()
            .file(effect.path)
            .atLocation(destination)
            .scale(effectScale);

          // Adiciona persistência se configurado (apenas na última repetição)
          if (effect.persist && effect.persist.enabled && i === repeats - 1) {
            if (effect.persist.type === 'permanent') {
              // Persist permanente
              effectInstance.persist();
            } else if (effect.persist.type === 'timed' && effect.persist.duration) {
              // Persist temporário - NÃO usa .persist(), apenas deixa o efeito renderizar
              // e ele será removido automaticamente após a duração
              effectInstance.duration(effect.persist.duration);
            }
          }

          // Se não for o último da repetição, aguarda o efeito terminar antes de repetir
          if (i < repeats - 1) {
            effectInstance.waitUntilFinished();
          }
        }
      }

      // Torna o token visível com fade in
      sequence
        .animation()
          .on(token)
          .fadeIn(500);

      // Mostra o token e executa os efeitos
      await token.document.update({ hidden: false });
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

// Registra o hook de setup (após módulos estarem carregados)
Hooks.once('ready', () => {
  OpenTeleport.setup();
});
