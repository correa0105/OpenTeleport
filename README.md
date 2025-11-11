# Open Teleport

Um módulo para Foundry VTT que permite teleportar tokens com efeitos visuais incríveis usando o Sequencer!

## Características

- 🎯 Teleporte interativo com seleção visual de destino
- ✨ Efeitos personalizáveis de saída e chegada usando o Sequencer Database
- 🎮 Interface simples e intuitiva
- 🔄 Animações suaves de fade in/out
- 🎨 Suporte completo ao Database Viewer do Sequencer
- 💾 Presets de teleporte salvos por ator
- ⚡ Teleporte rápido via Token HUD (ícone de raio)
- ⭐ Sistema de favoritos para efeitos mais usados
- 🔁 **NOVO v1.5**: Sistema de repetições de efeitos
- 📍 **NOVO v1.5**: Efeitos podem persistir no chão (temporário ou permanente)
- 🔊 **NOVO v1.5**: Integração com playlists para tocar sons durante o teleporte
- 🎛️ **NOVO v1.5**: Interface avançada com opções expansíveis

## Requisitos

- **Foundry VTT**: Versão 13 ou superior
- **Sequencer**: Versão 3.0.0 ou superior (obrigatório)
- **Crossgate**: Módulo de teleporte para Foundry v13 (obrigatório)

## Como Usar

### 1. Instalação

1. Copie a pasta `openteleport` para o diretório de módulos do Foundry VTT
2. Ative o módulo nas configurações do mundo
3. Certifique-se de que os módulos **Sequencer** e **Crossgate** estão instalados e ativos

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
   - O crosshair do **Crossgate** aparecerá
   - Clique no local desejado no mapa
   - Pressione Esc para cancelar
   - O crosshair se adapta ao tamanho do token automaticamente

6. **Digite o efeito de chegada**:
   - Outra janela aparecerá
   - Digite o caminho do efeito de aparecimento
   - Exemplo: `jb2a.misty_step.02.blue`
   - Clique em "Confirmar"

7. **O token aparecerá** no novo local com o efeito visual!

8. **Preset salvo automaticamente**:
   - Os efeitos usados são salvos automaticamente para aquele ator
   - Na próxima vez, você pode usar o teleporte rápido!

### 3. Teleporte Rápido (Novo!)

Após usar o teleporte pela primeira vez com um ator, um preset é salvo automaticamente:

1. **Selecione o token** clicando nele
2. **O HUD aparecerá acima do token** com vários ícones (vida, configurações, etc.)
3. Procure o **ícone de raio laranja ⚡** no HUD
   - Este botão só aparece se você já tiver usado o teleporte completo com aquele ator
   - O ícone tem uma animação pulsante para chamar atenção
4. **Clique no ícone de raio ⚡**
5. A animação de saída inicia automaticamente
6. **Selecione o destino** com o círculo laranja
7. O token aparece no novo local com os efeitos salvos!

**Nota**: O botão de teleporte rápido só aparece se você já tiver usado o teleporte completo pelo menos uma vez com aquele ator.

**Localização Visual**:
```
Token Selecionado
       ↓
  [💀 ⚙️ 📊 ⚡ ❌]  ← HUD com ícones (o raio ⚡ é o teleporte rápido)
       Token
```

### 4. Configurações Avançadas de Efeitos (v1.5)

Cada efeito agora possui opções avançadas:

#### Repetições
- Configure quantas vezes o efeito se repetirá (1-10 vezes)
- Útil para criar efeitos mais dramáticos ou prolongados
- Cada repetição usa a duração natural da animação do Sequencer

#### Persistir no Chão
1. **Marque a opção** "Persistir no chão" para deixar o efeito visível após o teleporte
2. Escolha o tipo de persistência:
   - **Temporário**: Define quanto tempo (em ms) o efeito fica visível
   - **Permanente**: O efeito fica no mapa até ser removido manualmente

**Exemplo de uso**: Deixar um círculo mágico no local de saída/chegada

#### Tocar Som
1. **Marque a opção** "Tocar som"
2. **Selecione um som** da sua playlist do Foundry
3. O som será tocado junto com o efeito
4. Sons organizados por playlist para fácil localização

**Dica**: Organize seus sons de efeitos mágicos em uma playlist específica!

### 5. Sistema de Favoritos

Para facilitar o uso de efeitos recorrentes:

1. Ao digitar o caminho do efeito, você verá um ícone de **estrela** ⭐
2. **Clique na estrela** para adicionar o efeito aos favoritos
3. Na próxima vez, ao clicar no campo de texto, uma lista de favoritos aparecerá
4. **Clique em um favorito** para preencher automaticamente
5. Use o **X** ao lado de cada favorito para removê-lo da lista

### 6. Encontrando Efeitos

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
- Verifique se o **Sequencer** e **Crossgate** estão instalados e ativos
- Recarregue a página (F5)

### Crosshair não aparece
- Verifique se o módulo **Crossgate** está instalado e ativo
- Verifique no console (F12) se há erros relacionados ao Crossgate
- Certifique-se de que a versão do Crossgate é compatível com Foundry v13

### Efeito não funciona
- Verifique se o caminho do efeito está correto
- Use o Database Viewer do Sequencer para confirmar
- Verifique o console (F12) para erros

### Token não teleporta
- Certifique-se de selecionar apenas um token
- Verifique as permissões do token
- Verifique se você tem permissões de GM/Player adequadas

## Changelog

### v1.6.0 (2025) - NOVO!
- 🎯 **Integração com Crossgate**: Usa o crosshair avançado do Crossgate
  - Crosshair se adapta automaticamente ao tamanho do token
  - Visual aprimorado com ícone e label customizável
  - Melhor feedback visual durante a seleção
- 📦 **Crossgate Obrigatório**: Módulo Crossgate agora é dependência obrigatória

### v1.5.0 (2025)
- 🔁 **Sistema de Repetições**: Configure quantas vezes cada efeito se repetirá (1-10x)
- 📍 **Persistência de Efeitos**: Efeitos podem ficar no chão após o teleporte
  - Temporário: Define duração em milissegundos
  - Permanente: Efeito fica até ser removido manualmente
- 🔊 **Integração com Sons**: Selecione sons das suas playlists para tocar durante o teleporte
- 🎨 **Interface Renovada**: Opções expansíveis com checkboxes e configurações avançadas
- 📦 **Box de Efeitos**: Cada efeito agora tem sua própria seção visual organizada
- ⚙️ **Configuração Granular**: Controle individual de repetições, persistência e som por efeito
- 🎛️ **Campo de Duração Removido**: Substituído por repetições (funciona melhor com animações do Sequencer)

### v1.4.0 (2025)
- ✨ Adicionado sistema de presets por ator
- ⚡ Implementado teleporte rápido via Token HUD
- 💾 Presets são salvos automaticamente após cada teleporte
- 🎯 Botão de teleporte rápido aparece no HUD do token
- 📝 Os presets são salvos usando Actor Flags (persistem entre sessões)

### v1.3.0 (2024)
- ⭐ Sistema de favoritos adicionado
- 🔄 Suporte a múltiplos efeitos simultâneos
- 📏 Campos de duração personalizável
- 💡 Sistema de tooltips informativos

### v1.2.0 (2024)
- 🎨 Melhorias na interface
- ✏️ Adicionado sistema de adicionar/remover efeitos dinamicamente

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
