# Pokemon Team Stats

Aplicación web para registrar y analizar estadísticas de partidas de Pokemon VGC (Video Game Championships), centrada en el formato **Pokemon Champions**.

## Descripcion

La idea principal es tener un registro detallado de tus partidas competitivas a partir de tus equipos en formato Pokepaste. La app permite importar un equipo, ver toda su informacion de un vistazo y registrar cada partida con los datos relevantes para el analisis: que pokemon llevaste, cuales pusiste de lead, contra quien jugaste y si ganaste o perdiste.

Con el tiempo, esto permite detectar patrones: que leads funcionan mejor, que selecciones son mas consistentes, contra que equipos tienes mas dificultades, etc.

Todos los datos se almacenan en **localStorage**, sin necesidad de backend ni cuenta de usuario.

---

## Vistas y navegacion

La aplicacion se organiza en las siguientes vistas:

### 1. Listado de equipos (pantalla principal)

Es la pantalla de inicio. Muestra todos los equipos creados con un resumen rapido (nombre del equipo, numero de partidas, winrate global). Desde aqui se puede:

- Pulsar en un equipo para entrar a su vista detallada.
- Crear un nuevo equipo.

### 2. Crear equipo

Formulario minimalista con un unico campo: el **Pokepaste** del equipo. Al pegarlo y confirmar, la app parsea automaticamente los 6 Pokemon con todos sus datos (objeto, habilidad, naturaleza, EVs, movimientos) y guarda el equipo.

Opcionalmente se puede asignar un nombre al equipo para identificarlo en el listado.

### 3. Vista del equipo y estadisticas

Pantalla central de la aplicacion. Combina en una sola vista la informacion del equipo, las estadisticas y el historial de partidas. Muestra:

- Los 6 Pokemon del equipo con toda su informacion.
- Un boton para **editar el Pokepaste**, util cuando el equipo evoluciona (cambios de sets, objetos, movimientos). Al editar, el paste se reparsea y los datos del equipo se actualizan manteniendo el historial de partidas.
- Un boton para **añadir partida**.
- Las **estadisticas** del equipo calculadas a partir de las partidas registradas:
  - Winrate global (victorias / total de partidas).
  - Winrate por cada Pokemon en seleccion.
  - Winrate por combinacion de lead.
  - Winrate por combinacion de seleccion de 4.
- El **historial completo** de partidas con todos sus detalles.

### 4. Añadir partida

Formulario para registrar una nueva partida. Campos:

- **Seleccion**: cuales de los 6 Pokemon del equipo se llevaron a la partida (se eligen 4).
- **Lead**: de los 4 seleccionados, cuales 2 abrieron la batalla.
- **Rival**: se introducen los nombres de los **6 Pokemon del equipo rival** (solo el nombre, sin datos adicionales). A partir de ahi se indica cuales 4 selecciono el rival y cuales 2 pusieron de lead, siguiendo la misma logica que el equipo propio. No se registra el nombre del oponente.
- **Notas**: campo de texto libre para anotar lo que ocurrio en el combate (un critico decisivo, un fallo de ataque, una jugada clave, etc.).
- **Resultado**: victoria o derrota.

---

## Funcionalidades principales

### Importacion de equipos via Pokepaste

[Pokepaste](https://pokepast.es) es el formato estandar de la comunidad competitiva para compartir equipos. Un paste incluye, por cada Pokemon:

- Nombre del Pokemon (y apodo si lo tiene)
- Objeto equipado
- Habilidad
- Naturaleza
- EVs (Effort Values)
- Movimientos

La aplicacion parsea este formato automaticamente y muestra el equipo completo con toda su informacion estructurada, sin necesidad de introducir nada a mano.

### Edicion del Pokepaste

Un equipo puede cambiar a lo largo del tiempo. Desde la vista del equipo se puede editar el Pokepaste en cualquier momento para reflejar la version actual del team, sin perder el historial de partidas ya registradas.

### Registro de partidas

Por cada partida jugada se registra:

#### Seleccion
En VGC se eligen **4 de los 6 Pokemon** del equipo para llevar a la partida. Se registra que 4 Pokemon se seleccionaron en cada partida.

#### Lead
De los 4 seleccionados, se elige un **lead de 2 Pokemon** que empiezan la batalla en campo. Se registra que pareja de Pokemon abrio la partida.

#### Rival
Se registra el equipo del rival de forma simplificada:
- Los **nombres de sus 6 Pokemon** (solo el nombre, sin sets ni datos adicionales).
- Cuales **4 selecciono** para la partida.
- Su **lead** (los 2 que abrieron).

#### Notas
Campo de texto libre para describir lo que ocurrio en el combate: un critico importante, un fallo de ataque, una jugada decisiva, etc.

#### Resultado
Se marca si la partida fue **victoria o derrota**.

---

## Almacenamiento

Todos los datos (equipos, partidas, estadisticas) se guardan en el **localStorage** del navegador. No se requiere ninguna cuenta, servidor ni base de datos externa. Los datos persisten entre sesiones en el mismo dispositivo y navegador.

---

## Stack tecnico

*Por definir.*

---

## Estado del proyecto

En desarrollo inicial. De momento solo existe la definicion del proyecto.
