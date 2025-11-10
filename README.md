# Open Teleport

Um módulo para Foundry VTT que permite teleportar tokens com efeitos visuais incríveis usando o Sequencer!

## Características

- 🎯 Teleporte interativo com seleção visual de destino
- ✨ Efeitos personalizáveis de saída e chegada usando o Sequencer Database
- 🎮 Interface simples e intuitiva
- 🔄 Animações suaves de fade in/out
- 🎨 Suporte completo ao Database Viewer do Sequencer

## Requisitos

- **Foundry VTT**: Versão 13 ou superior
- **Sequencer**: Versão 3.0.0 ou superior (obrigatório)

## Como Usar

### 1. Instalação

1. Copie a pasta `openteleport` para o diretório de módulos do Foundry VTT
2. Ative o módulo nas configurações do mundo
3. Certifique-se de que o módulo **Sequencer** está instalado e ativo

### 2. Teleportando um Token

1. **Selecione um token** no canvas
2. **Clique no botão "Open Teleport"** na barra de ferramentas de tokens (ícone de porta)
3. **Digite o efeito de saída**:
   - Uma janela aparecerá solicitando o caminho do efeito
   - Use o Database Viewer do Sequencer para encontrar efeitos
   - Exemplo: `jb2a.misty_step.01.blue`
   - Clique em "Confirmar"

4. **O token desaparecerá** com o efeito visual

5. **Selecione o destino**:
   - Um círculo laranja aparecerá seguindo o cursor
   - Clique no local desejado no mapa
   - Pressione Esc ou botão direito para cancelar

6. **Digite o efeito de chegada**:
   - Outra janela aparecerá
   - Digite o caminho do efeito de aparecimento
   - Exemplo: `jb2a.misty_step.02.blue`
   - Clique em "Confirmar"

7. **O token aparecerá** no novo local com o efeito visual!

### 3. Encontrando Efeitos

Para encontrar efeitos disponíveis:

1. Ative o módulo **Sequencer**
2. Use o **Database Viewer** do Sequencer (geralmente acessível através das ferramentas)
3. Navegue pelos efeitos disponíveis
4. Copie o caminho do efeito desejado (ex: `jb2a.misty_step.01.blue`)

### Exemplos de Efeitos Populares

**Teleporte Místico:**
- Saída: `jb2a.misty_step.01.blue`
- Chegada: `jb2a.misty_step.02.blue`

**Teleporte de Fogo:**
- Saída: `jb2a.fire_bolt.orange`
- Chegada: `jb2a.explosion.orange`

**Teleporte Arcano:**
- Saída: `jb2a.magic_signs.circle.02.conjuration.intro.blue`
- Chegada: `jb2a.magic_signs.circle.02.conjuration.loop.blue`

## Recursos Técnicos

### Estrutura do Módulo

```
openteleport/
├── module.json          # Manifesto do módulo
├── README.md            # Esta documentação
├── scripts/
│   └── openteleport.js  # Script principal
└── styles/
    └── openteleport.css # Estilos
```

### API

O módulo expõe a classe `OpenTeleport` globalmente. Você pode usar em macros:

```javascript
// Exemplo de macro personalizada
const token = canvas.tokens.controlled[0];
if (token) {
  await OpenTeleport.startTeleportSequence(token);
}
```

## Solução de Problemas

### O botão não aparece
- Verifique se o módulo está ativo
- Verifique se o Sequencer está instalado e ativo
- Recarregue a página (F5)

### Efeito não funciona
- Verifique se o caminho do efeito está correto
- Use o Database Viewer do Sequencer para confirmar
- Verifique o console (F12) para erros

### Token não teleporta
- Certifique-se de selecionar apenas um token
- Verifique as permissões do token
- Verifique se você tem permissões de GM/Player adequadas

## Changelog

### v1.1.0 (2024)
- Atualizado para Foundry VTT v13
- Melhorado crosshair de seleção com feedback visual
- Ajustado sistema de coordenadas para v13
- Corrigido ícone do botão na toolbar

### v1.0.0 (2024)
- Lançamento inicial
- Teleporte com efeitos do Sequencer
- Seleção interativa de destino
- Diálogos para entrada de efeitos

## Licença

Este módulo é fornecido como está, sem garantias.

## Créditos

Desenvolvido para a comunidade Foundry VTT.

Usa o incrível módulo **Sequencer** para efeitos visuais.
