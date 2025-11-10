# Exemplos de Uso - Open Teleport

## Macros Úteis

### Macro 1: Teleporte Rápido com Efeitos Predefinidos

Esta macro permite teleportar um token com efeitos pré-configurados, pulando os diálogos:

```javascript
// Teleporte Místico Azul - Rápido
async function quickTeleport() {
  const token = canvas.tokens.controlled[0];

  if (!token) {
    ui.notifications.warn('Selecione um token primeiro!');
    return;
  }

  // Efeitos predefinidos
  const exitEffect = 'jb2a.misty_step.01.blue';
  const entryEffect = 'jb2a.misty_step.02.blue';

  // Efeito de saída
  await new Sequence()
    .effect()
      .file(exitEffect)
      .atLocation(token)
      .scale(token.document.width)
    .animation()
      .on(token)
      .fadeOut(500)
    .wait(200)
    .thenDo(() => {
      token.document.update({ hidden: true });
    })
    .play();

  // Selecionar destino
  ui.notifications.info('Clique para selecionar o destino (botão direito para cancelar)');

  const position = await new Promise((resolve) => {
    const handleClick = (event) => {
      const pos = canvas.mousePosition;
      canvas.stage.off('click', handleClick);
      canvas.stage.off('rightdown', handleRightClick);
      resolve(pos);
    };

    const handleRightClick = (event) => {
      canvas.stage.off('click', handleClick);
      canvas.stage.off('rightdown', handleRightClick);
      resolve(null);
    };

    canvas.stage.on('click', handleClick);
    canvas.stage.on('rightdown', handleRightClick);
  });

  if (!position) {
    await token.document.update({ hidden: false });
    ui.notifications.info('Teleporte cancelado');
    return;
  }

  // Mover e efeito de entrada
  await token.document.update({
    x: position.x - (token.w / 2),
    y: position.y - (token.h / 2)
  });

  await new Sequence()
    .effect()
      .file(entryEffect)
      .atLocation(position)
      .scale(token.document.width)
    .animation()
      .on(token)
      .fadeIn(500)
    .thenDo(() => {
      token.document.update({ hidden: false });
    })
    .play();

  ui.notifications.info('Teleporte concluído!');
}

quickTeleport();
```

### Macro 2: Teleporte de Fogo

```javascript
// Teleporte com tema de fogo
const token = canvas.tokens.controlled[0];

if (!token) {
  ui.notifications.warn('Selecione um token!');
} else {
  // Sobrescreve os efeitos padrão
  window.openTeleportOverride = {
    exit: 'jb2a.fire_bolt.orange',
    entry: 'jb2a.explosion.orange'
  };

  await OpenTeleport.startTeleportSequence(token);

  delete window.openTeleportOverride;
}
```

### Macro 3: Teleporte em Área (Múltiplos Tokens)

```javascript
// Teleporta múltiplos tokens para a mesma área
async function areaTeleport() {
  const tokens = canvas.tokens.controlled;

  if (tokens.length === 0) {
    ui.notifications.warn('Selecione pelo menos um token!');
    return;
  }

  // Selecionar destino central
  ui.notifications.info('Clique no centro da área de destino');

  const centerPosition = await new Promise((resolve) => {
    const handleClick = (event) => {
      const pos = canvas.mousePosition;
      canvas.stage.off('click', handleClick);
      resolve(pos);
    };
    canvas.stage.on('click', handleClick);
  });

  const exitEffect = 'jb2a.misty_step.01.blue';
  const entryEffect = 'jb2a.misty_step.02.blue';

  // Teleporta cada token
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Calcula offset para espalhar os tokens
    const angle = (i / tokens.length) * Math.PI * 2;
    const distance = canvas.grid.size;
    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;

    // Efeito de saída
    await new Sequence()
      .effect()
        .file(exitEffect)
        .atLocation(token)
        .scale(token.document.width)
      .animation()
        .on(token)
        .fadeOut(300)
      .play();

    await token.document.update({ hidden: true });

    // Move para nova posição
    const newX = centerPosition.x + offsetX - (token.w / 2);
    const newY = centerPosition.y + offsetY - (token.h / 2);

    await token.document.update({ x: newX, y: newY });

    // Efeito de entrada
    await new Sequence()
      .effect()
        .file(entryEffect)
        .atLocation({x: newX + token.w/2, y: newY + token.h/2})
        .scale(token.document.width)
      .animation()
        .on(token)
        .fadeIn(300)
      .play();

    await token.document.update({ hidden: false });

    // Pequeno delay entre cada token
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  ui.notifications.info(`${tokens.length} tokens teleportados!`);
}

areaTeleport();
```

## Combinações de Efeitos Populares

### Teleporte Arcano Elegante
- Saída: `jb2a.magic_signs.circle.02.conjuration.intro.blue`
- Chegada: `jb2a.magic_signs.circle.02.conjuration.loop.blue`

### Teleporte Sombrio
- Saída: `jb2a.smoke.puff.centered.dark_black`
- Chegada: `jb2a.smoke.puff.centered.dark_black`

### Teleporte Divino
- Saída: `jb2a.divine_smite.caster.blueyellow`
- Chegada: `jb2a.divine_smite.caster.blueyellow`

### Teleporte Elétrico
- Saída: `jb2a.static_electricity.03.blue`
- Chegada: `jb2a.static_electricity.03.blue`

### Teleporte Dimensional
- Saída: `jb2a.portals.horizontal.vortex.blue`
- Chegada: `jb2a.portals.horizontal.vortex.blue`

### Teleporte de Gelo
- Saída: `jb2a.ice_spikes.radial.white`
- Chegada: `jb2a.ice_spikes.radial.white`

## Dicas Avançadas

### 1. Combinar com Som

```javascript
// Adicione sons aos seus teleportes
await new Sequence()
  .sound()
    .file("path/to/sound.mp3")
    .volume(0.5)
  .effect()
    .file('jb2a.misty_step.01.blue')
    .atLocation(token)
  .play();
```

### 2. Adicionar Shake na Câmera

```javascript
await new Sequence()
  .effect()
    .file('jb2a.explosion.orange')
    .atLocation(position)
  .canvasPan()
    .shake({duration: 500, strength: 5})
  .play();
```

### 3. Criar Trail de Partículas

```javascript
await new Sequence()
  .effect()
    .file('jb2a.particles.outward.blue.01')
    .atLocation(token)
    .scaleToObject(2)
  .effect()
    .file('jb2a.misty_step.01.blue')
    .atLocation(token)
  .play();
```

## Hook Events

Você pode adicionar hooks personalizados para reagir aos teleportes:

```javascript
// Adicione no seu código personalizado
Hooks.on('preTokenTeleport', (token, sourcePosition) => {
  console.log('Token prestes a teleportar:', token.name);
});

Hooks.on('postTokenTeleport', (token, destinationPosition) => {
  console.log('Token teleportado para:', destinationPosition);
});
```

## Contribuindo

Se você criar efeitos interessantes ou macros úteis, compartilhe com a comunidade!
