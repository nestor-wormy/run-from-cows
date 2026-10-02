# Rift Rumble

An original, turn-based arena battle about weaponizing a shifting gravity field. Survive three waves of hostiles, set the direction of the arena's pull, and use the central rift to damage and reposition units.

## Play

Open `index.html` in a browser. Each turn you have two actions:

- Move one tile with WASD, the arrow keys, the on-screen arrows, or by clicking a neighboring tile.
- Strike an adjacent hostile for 3 damage (`J`).
- Use Rift Surge (`K`) to deal 4 damage to every hostile within two tiles; it costs two rift charges.
- Set the gravity direction once per turn for free. At the end of your turn, the field pushes every unit one tile that way. Collisions hurt, and units pushed into the rift take damage before being ejected.
- End your turn to let the hostiles advance and attack.

Defeating hostiles earns rift charge. Clear all three waves to win; restart any time to try a new tactical approach.

The game uses plain HTML, CSS, and JavaScript and does not require a build step or dependencies.
