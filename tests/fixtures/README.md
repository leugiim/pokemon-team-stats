# Fixtures

Datos de ejemplo para los tests de caracterización. Se reutilizarán para comparar la versión Svelte de `pokemon-tools` con esta app.

- `team.paste.txt`: Pokepaste con 3 sets (sin apodo, con apodo y género, Mega). Incluye líneas que el parser ignora (Level, Shiny, Tera Type, IVs).
- `history.full.json`: historial en formato completo (2 partidas).
- `history.compact.json`: historial en formato compacto de exportación (`d`, `r`, `tr`, `s`, `l`, `rt`, `rs`, `rl`, `n`), con una partida `ongoing` sin roster.
