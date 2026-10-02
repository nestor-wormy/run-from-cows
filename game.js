(() => {
  "use strict";

  const SIZE = 7;
  const CENTER = Math.floor(SIZE / 2);
  const DIRECTIONS = {
    north: { x: 0, y: -1, label: "NORTH" },
    east: { x: 1, y: 0, label: "EAST" },
    south: { x: 0, y: 1, label: "SOUTH" },
    west: { x: -1, y: 0, label: "WEST" }
  };
  const WAVES = [
    [
      { kind: "drifter", x: 1, y: 1 },
      { kind: "drifter", x: 5, y: 5 }
    ],
    [
      { kind: "bruiser", x: 5, y: 1 },
      { kind: "drifter", x: 1, y: 5 },
      { kind: "dasher", x: 5, y: 5 }
    ],
    [
      { kind: "bruiser", x: 5, y: 1 },
      { kind: "dasher", x: 1, y: 5 },
      { kind: "dasher", x: 5, y: 5 }
    ]
  ];
  const ENEMY_TYPES = {
    drifter: { name: "Drifter", hp: 4, damage: 1, symbol: "D" },
    bruiser: { name: "Bruiser", hp: 7, damage: 2, symbol: "B" },
    dasher: { name: "Dasher", hp: 3, damage: 1, symbol: "S" }
  };
  const $ = (selector) => document.querySelector(selector);
  const arena = $("#arena");
  let game;

  function newGame() {
    game = {
      player: { x: 3, y: 6, hp: 12, maxHp: 12 },
      enemies: [],
      wave: 1,
      turn: 1,
      actions: 2,
      charge: 0,
      gravity: "south",
      gravityChanged: false,
      finished: false,
      log: []
    };
    spawnWave();
    addLog("Trial begins. The rift bends every unit at turn end.");
    render();
  }

  function spawnWave() {
    game.enemies = WAVES[game.wave - 1].map((spawn, index) => ({
      id: `${game.wave}-${index}`,
      kind: spawn.kind,
      x: spawn.x,
      y: spawn.y,
      hp: ENEMY_TYPES[spawn.kind].hp,
      maxHp: ENEMY_TYPES[spawn.kind].hp
    }));
    game.actions = 2;
    game.gravityChanged = false;
    addLog(`Wave ${String(game.wave).padStart(2, "0")} enters the arena.`);
  }

  function addLog(message) {
    game.log.unshift({ turn: game.turn, message });
    game.log = game.log.slice(0, 5);
  }

  function manhattan(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function enemyAt(x, y) {
    return game.enemies.find((enemy) => enemy.x === x && enemy.y === y);
  }

  function occupied(x, y, except) {
    return (game.player !== except && game.player.x === x && game.player.y === y)
      || game.enemies.some((enemy) => enemy !== except && enemy.x === x && enemy.y === y);
  }

  function spendAction() {
    game.actions -= 1;
    if (game.enemies.length === 0) {
      if (game.wave === WAVES.length) {
        game.finished = true;
        addLog("Trial complete. The arena is yours.");
      } else {
        game.wave += 1;
        addLog(`Wave ${game.wave - 1} cleared.`);
        spawnWave();
      }
    }
    render();
  }

  function movePlayer(direction) {
    if (game.finished || game.actions <= 0) return;
    const vector = DIRECTIONS[direction];
    const x = game.player.x + vector.x;
    const y = game.player.y + vector.y;
    if (!inside(x, y) || occupied(x, y, game.player)) {
      addLog("That tile is blocked.");
      render();
      return;
    }
    game.player.x = x;
    game.player.y = y;
    addLog(`You move ${direction}.`);
    spendAction();
  }

  function attackEnemy(enemy) {
    if (game.finished || game.actions <= 0 || !game.enemies.includes(enemy)) return;
    if (manhattan(game.player, enemy) > 1) {
      addLog(`${ENEMY_TYPES[enemy.kind].name} is out of strike range.`);
      render();
      return;
    }
    enemy.hp -= 3;
    addLog(`Strike hits ${ENEMY_TYPES[enemy.kind].name} for 3.`);
    if (enemy.hp <= 0) {
      game.enemies = game.enemies.filter((unit) => unit !== enemy);
      game.charge = Math.min(3, game.charge + 1);
      addLog(`${ENEMY_TYPES[enemy.kind].name} shattered. +1 rift charge.`);
    }
    spendAction();
  }

  function strike() {
    const target = game.enemies
      .filter((enemy) => manhattan(game.player, enemy) === 1)
      .sort((a, b) => a.hp - b.hp)[0];
    if (target) attackEnemy(target);
    else {
      addLog("No hostile is adjacent. Move in for a strike.");
      render();
    }
  }

  function surge() {
    if (game.finished || game.actions <= 0 || game.charge < 2) return;
    const targets = game.enemies.filter((enemy) => manhattan(game.player, enemy) <= 2);
    if (targets.length === 0) {
      addLog("No hostiles in surge range.");
      render();
      return;
    }
    game.charge -= 2;
    targets.forEach((enemy) => { enemy.hp -= 4; });
    addLog(`Rift surge hits ${targets.length} ${targets.length === 1 ? "hostile" : "hostiles"} for 4.`);
    const defeated = targets.filter((enemy) => enemy.hp <= 0);
    defeated.forEach((enemy) => addLog(`${ENEMY_TYPES[enemy.kind].name} shattered.`));
    game.enemies = game.enemies.filter((enemy) => enemy.hp > 0);
    game.charge = Math.min(3, game.charge + defeated.length);
    spendAction();
  }

  function setGravity(direction) {
    if (game.finished || game.gravityChanged) return;
    game.gravity = direction;
    game.gravityChanged = true;
    addLog(`Gravity locked ${direction}. The rift pulls this way.`);
    render();
  }

  function inside(x, y) {
    return x >= 0 && x < SIZE && y >= 0 && y < SIZE;
  }

  function enemyTurn() {
    for (const enemy of [...game.enemies]) {
      if (game.player.hp <= 0 || !game.enemies.includes(enemy)) break;
      const stats = ENEMY_TYPES[enemy.kind];
      if (manhattan(enemy, game.player) === 1) {
        game.player.hp -= stats.damage;
        addLog(`${stats.name} hits you for ${stats.damage}.`);
        continue;
      }
      const options = [
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
      ].map((step) => ({ x: enemy.x + step.x, y: enemy.y + step.y }))
        .filter((point) => inside(point.x, point.y) && !occupied(point.x, point.y, enemy))
        .sort((a, b) => manhattan(a, game.player) - manhattan(b, game.player));
      if (options.length) {
        enemy.x = options[0].x;
        enemy.y = options[0].y;
      }
    }
    if (game.player.hp <= 0) {
      game.player.hp = 0;
      game.finished = true;
      addLog("Pilot down. The rift claims the arena.");
      return;
    }
    applyGravity();
    game.turn += 1;
    game.actions = 2;
    game.gravityChanged = false;
    addLog("Your turn. Two actions available.");
  }

  function applyGravity() {
    const vector = DIRECTIONS[game.gravity];
    const units = [game.player, ...game.enemies];
    const axis = vector.x !== 0 ? "x" : "y";
    units.sort((a, b) => (b[axis] - a[axis]) * (vector[axis] || 1));
    for (const unit of units) {
      const x = unit.x + vector.x;
      const y = unit.y + vector.y;
      if (!inside(x, y) || occupied(x, y, unit)) {
        damageUnit(unit, 1, "The arena wall");
        continue;
      }
      unit.x = x;
      unit.y = y;
      if (unit.x === CENTER && unit.y === CENTER) {
        damageUnit(unit, unit === game.player ? 2 : 4, "The rift core");
        const landing = findLanding(SIZE - 1 - CENTER, SIZE - 1 - CENTER, unit);
        if (landing) {
          unit.x = landing.x;
          unit.y = landing.y;
        }
      }
    }
    game.enemies = game.enemies.filter((enemy) => enemy.hp > 0);
    if (game.player.hp <= 0) {
      game.player.hp = 0;
      game.finished = true;
      addLog("The rift overwhelms your pilot.");
    }
  }

  function damageUnit(unit, amount, source) {
    unit.hp -= amount;
    if (unit === game.player) addLog(`${source} deals ${amount} hull damage.`);
    else if (unit.hp <= 0) addLog(`${ENEMY_TYPES[unit.kind].name} is lost to ${source.toLowerCase()}.`);
    else addLog(`${source} clips ${ENEMY_TYPES[unit.kind].name} for ${amount}.`);
  }

  function findLanding(x, y, unit) {
    const candidates = [];
    for (let distance = 0; distance < SIZE * SIZE; distance += 1) {
      for (let row = 0; row < SIZE; row += 1) {
        for (let column = 0; column < SIZE; column += 1) {
          if (Math.abs(column - x) + Math.abs(row - y) === distance
              && !(column === CENTER && row === CENTER)
              && !occupied(column, row, unit)) {
            candidates.push({ x: column, y: row });
          }
        }
      }
      if (candidates.length) return candidates[0];
    }
    return null;
  }

  function endTurn() {
    if (game.finished) return;
    addLog("Hostiles advance.");
    enemyTurn();
    render();
  }

  function tileIntent(enemy) {
    return manhattan(enemy, game.player) === 1
      ? `${ENEMY_TYPES[enemy.kind].name}, ${enemy.hp} HP — attacks at turn end`
      : `${ENEMY_TYPES[enemy.kind].name}, ${enemy.hp} HP — closing in`;
  }

  function render() {
    arena.replaceChildren();
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "tile";
        tile.setAttribute("role", "gridcell");
        tile.setAttribute("aria-label", `Row ${y + 1}, column ${x + 1}`);
        if (x === CENTER && y === CENTER) {
          tile.classList.add("rift-tile");
          const core = document.createElement("span");
          core.className = "rift-core";
          core.setAttribute("aria-hidden", "true");
          tile.append(core);
          tile.setAttribute("aria-label", "Rift core, deals damage and ejects units");
        }
        if (game.player.x === x && game.player.y === y) {
          const pilot = document.createElement("span");
          pilot.className = "unit player-unit";
          pilot.textContent = "✦";
          pilot.setAttribute("aria-label", "You");
          tile.append(pilot);
          tile.setAttribute("aria-label", "Your position");
        }
        const enemy = enemyAt(x, y);
        if (enemy) {
          const unit = document.createElement("span");
          unit.className = `unit enemy-unit ${enemy.kind}`;
          unit.textContent = ENEMY_TYPES[enemy.kind].symbol;
          unit.setAttribute("aria-hidden", "true");
          const health = document.createElement("span");
          health.className = "enemy-hp";
          const fill = document.createElement("i");
          fill.style.width = `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`;
          health.append(fill);
          tile.append(unit, health);
          tile.setAttribute("aria-label", tileIntent(enemy));
        }
        tile.disabled = game.finished;
        tile.addEventListener("click", () => {
          const target = enemyAt(x, y);
          if (target) attackEnemy(target);
          else if (manhattan(game.player, { x, y }) === 1) {
            const direction = Object.entries(DIRECTIONS).find(([, vector]) =>
              game.player.x + vector.x === x && game.player.y + vector.y === y);
            if (direction) movePlayer(direction[0]);
          }
        });
        arena.append(tile);
      }
    }

    $("#health-label").textContent = `${game.player.hp} / ${game.player.maxHp}`;
    $("#health-bar").style.width = `${(game.player.hp / game.player.maxHp) * 100}%`;
    $("#health-bar").style.background = game.player.hp <= 4 ? "var(--coral)" : "var(--lime)";
    $("#charge-pips").replaceChildren(...Array.from({ length: 3 }, (_, index) => {
      const pip = document.createElement("i");
      pip.className = `charge-pip${index < game.charge ? " filled" : ""}`;
      return pip;
    }));
    $("#wave-label").innerHTML = `WAVE ${String(game.wave).padStart(2, "0")} <span>/ 0${WAVES.length}</span>`;
    $("#wave-progress").style.width = `${(game.wave / WAVES.length) * 100}%`;
    $("#turn-label").textContent = `TURN ${String(game.turn).padStart(2, "0")}`;
    $("#gravity-label").textContent = `PULLING ${game.gravity.toUpperCase()}`;
    $("#actions-label").textContent = `${game.actions} ${game.actions === 1 ? "ACTION" : "ACTIONS"}`;
    $("#strike-button").disabled = game.finished || game.actions <= 0
      || !game.enemies.some((enemy) => manhattan(enemy, game.player) === 1);
    $("#surge-button").disabled = game.finished || game.actions <= 0 || game.charge < 2;
    document.querySelectorAll("[data-move]").forEach((button) => {
      const vector = DIRECTIONS[button.dataset.move];
      button.disabled = game.finished || game.actions <= 0
        || !inside(game.player.x + vector.x, game.player.y + vector.y)
        || occupied(game.player.x + vector.x, game.player.y + vector.y, game.player);
    });
    document.querySelectorAll("[data-gravity]").forEach((button) => {
      button.classList.toggle("selected", button.dataset.gravity === game.gravity);
      button.disabled = game.finished || game.gravityChanged;
    });
    $("#end-turn-button").disabled = game.finished;
    const feed = $("#combat-log");
    feed.replaceChildren(...game.log.map((item) => {
      const line = document.createElement("li");
      const turn = document.createElement("span");
      turn.className = "feed-turn";
      turn.textContent = `T${String(item.turn).padStart(2, "0")}`;
      line.append(turn, document.createTextNode(item.message));
      return line;
    }));
    const banner = $("#result-banner");
    banner.hidden = !game.finished;
    banner.classList.toggle("loss", game.player.hp === 0);
    banner.textContent = game.player.hp > 0 ? "TRIAL CLEARED — RIFT CONQUERED" : "PILOT DOWN — RESTART TO REDEPLOY";
  }

  document.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", () => movePlayer(button.dataset.move));
  });
  document.querySelectorAll("[data-gravity]").forEach((button) => {
    button.addEventListener("click", () => setGravity(button.dataset.gravity));
  });
  $("#strike-button").addEventListener("click", strike);
  $("#surge-button").addEventListener("click", surge);
  $("#end-turn-button").addEventListener("click", endTurn);
  $("#restart-button").addEventListener("click", newGame);
  document.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLButtonElement && event.key === " ") return;
    const key = event.key.toLowerCase();
    const movement = { w: "north", arrowup: "north", d: "east", arrowright: "east",
      s: "south", arrowdown: "south", a: "west", arrowleft: "west" };
    if (movement[key]) {
      event.preventDefault();
      movePlayer(movement[key]);
    } else if (key === "j") strike();
    else if (key === "k") surge();
    else if (key === "enter" && !game.finished) endTurn();
  });

  newGame();
})();
