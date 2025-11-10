# Changelog - Open Teleport

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.2.0] - 2024

### Adicionado
- Suporte para múltiplos efeitos simultâneos (botão +)
- Campo de duração personalizável para cada efeito (em milissegundos)
- Botões de informação (!) com tooltips explicativos
- Possibilidade de remover efeitos adicionais (botão −)

### Modificado
- Layout dos diálogos completamente redesenhado
- Labels organizadas horizontalmente para melhor aproveitamento do espaço
- Removidos logs de debug desnecessários
- Interface mais limpa e profissional

### Corrigido
- Compatibilidade com Foundry VTT v13+ (estrutura de controls como objeto)
- Bug onde o botão não aparecia na toolbar de tokens

### Técnico
- **openteleport.css**: Adicionados estilos para tooltips e múltiplos efeitos
- **openteleport.js:99-197**: Reimplementado `promptForEffect()` com suporte a múltiplos efeitos
- **openteleport.js:202-233**: Atualizado `playExitEffect()` para processar array de efeitos
- **openteleport.js:316-359**: Atualizado `playEntryEffect()` para processar array de efeitos
- **openteleport.js:25-35**: Corrigido hook `getSceneControlButtons` para v13

## [1.1.0] - 2024

### Adicionado
- Feedback visual melhorado: círculo laranja segue o cursor durante seleção de destino
- Suporte para cancelar seleção com tecla ESC
- Melhor tratamento de eventos de mouse e teclado

### Modificado
- **BREAKING**: Atualizado requisito mínimo para Foundry VTT v13
- Reimplementado sistema de crosshair usando PIXI.Graphics nativo
- Ajustado cálculo de coordenadas para usar API v13 (`token.document.width/height`)
- Alterado ícone do botão de `fa-portal-enter` para `fa-door-open` (compatibilidade)
- Melhorado sistema de limpeza de event listeners

### Corrigido
- Removida chamada para API inexistente `canvas.interface.createScrollingText`
- Corrigido acesso a propriedades de token (agora usa `token.document.width` ao invés de `token.w`)
- Ajustado cálculo de posição do token para considerar `canvas.grid.size`

### Técnico
- **module.json**: Atualizado `compatibility.minimum` de "11" para "13"
- **module.json**: Atualizado `compatibility.verified` de "12" para "13"
- **openteleport.js:183-258**: Reimplementado `selectDestination()` com PIXI.Graphics
- **openteleport.js:268-269**: Ajustado cálculo de dimensões do token
- **openteleport.js:32**: Alterado ícone para `fas fa-door-open`

## [1.0.0] - 2024

### Adicionado
- Lançamento inicial do módulo
- Botão "Open Teleport" na barra de ferramentas de tokens
- Sistema de diálogos para entrada de efeitos (saída e chegada)
- Integração completa com Sequencer Database
- Efeitos de desaparecimento (fade out) e aparecimento (fade in)
- Sistema de seleção de destino com clique no canvas
- Suporte para cancelamento de operações (botão direito)
- Documentação completa em português
- Exemplos de uso e macros

### Requisitos Iniciais
- Foundry VTT v11+
- Sequencer v3.0.0+
